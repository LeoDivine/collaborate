"use server";

import { db } from "../db";
import { auth } from "../../../auth";
import { MileStoneStatus, PriorityLevel, Status, Prisma } from "../../../generated/prisma/client";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/events";
import { computeTaskAccess } from "@/lib/permissions/task-permissions";
import { formatLabel, formatPriority, formatStatus } from "@/lib/utils";
import type { Tasks } from "../types";

export async function resolveTaskMemberAndAccess(
	taskId: string,
	userId?: string,
	workspaceId?: string,
) {
	if (!userId || !workspaceId) return null;

	const member = await db.member.findUnique({
		where: { userId_workspaceId: { userId, workspaceId } },
	});
	if (!member) return null;

	const task = await db.task.findUnique({
		where: { id: taskId },
		include: {
			taskMembers: true,
			milestones: true,
		},
	});
	if (!task) return null;

	const projectMember = await db.projectMember.findFirst({
		where: {
			projectId: task.projectId,
			memberId: member.id,
		},
	});

	const access = computeTaskAccess({
		workspaceRole: member.role,
		projectRole: projectMember?.projectRole,
		isTaskCreator: task.createdById === member.id,
		isTaskAssignee: task.taskMembers.some((tm) => tm.memberId === member.id),
	});

	return { member, task, projectMember, access };
}


export interface CreateTaskInput {
	title: string;
	description: string;
	projectId: string;
	workspaceId: string;
	createdById: string;
	priority?: PriorityLevel;
	status?: Status;
	startPeriod: Date;
	endPeriod: Date;
	memberIds?: string[];
	labels?: string[];
	resources?: { name: string; url: string }[];
	milestones?: {
		title: string;
		description?: string;
		dueDate?: Date;
	}[];
}

export const getTasksByWorkspaceId = async (
	workspaceId: string,
	options?: {
		startDate?: Date;
		endDate?: Date;
	},
): Promise<{
	success: boolean;
	message: string;
	tasks: Tasks[];
	total: number;
}> => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
			tasks: [],
			total: 0,
		};
	}

	try {
		const session = await auth();
		const userId = session?.user?.id;
		let currentMember = null;
		if (userId) {
			currentMember = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
			});
		}

		const isWorkspaceAdmin =
			currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

		const projectPrivacyFilter: Prisma.TaskWhereInput =
			isWorkspaceAdmin || !currentMember
				? {}
				: {
						project: {
							OR: [
								{ visibility: "PUBLIC" as any },
								{ projectMembers: { some: { memberId: currentMember.id } } },
								{ createdById: currentMember.id },
							],
						},
				  };

		const dateFilter: Prisma.TaskWhereInput = {};
		if (options?.startDate && options?.endDate) {
			dateFilter.AND = [
				{ startPeriod: { lte: options.endDate } },
				{ endPeriod: { gte: options.startDate } },
			];
		} else if (options?.startDate) {
			dateFilter.endPeriod = { gte: options.startDate };
		} else if (options?.endDate) {
			dateFilter.startPeriod = { lte: options.endDate };
		}

		const tasks = await db.task.findMany({
			where: {
				workspaceId,
				...projectPrivacyFilter,
				...dateFilter,
			},
			include: {
				project: true,
				taskMembers: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				},
				milestones: true,
				resources: true,
				createdBy: {
					include: {
						user: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return {
			success: true,
			message: "Tasks fetched successfully",
			tasks: tasks as unknown as Tasks[],
			total: tasks.length,
		};
	} catch (error: any) {
		console.error("Error fetching tasks:", error);
		return {
			success: false,
			message: "Failed to fetch tasks",
			tasks: [],
			total: 0,
		};
	}
};

export const getTaskById = async (taskId: string) => {
	if (!taskId) {
		return {
			success: false,
			message: "Task ID is required",
			task: null,
		};
	}

	try {
		const task = await db.task.findUnique({
			where: {
				id: taskId,
			},
			include: {
				project: {
					include: {
						resources: true,
						projectMembers: {
							include: {
								member: {
									include: {
										user: true,
									},
								},
							},
						},
					},
				},
				taskMembers: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				},
				milestones: true,
				comments: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				resources: true,
				activities: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
						task: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				createdBy: {
					include: {
						user: true,
					},
				},
			},
		});

		if (!task) {
			return {
				success: false,
				message: "Task not found",
				task: null,
			};
		}

		if ((task.project as any)?.visibility === "PRIVATE") {
			const session = await auth();
			const userId = session?.user?.id;
			if (userId) {
				const member = await db.member.findUnique({
					where: {
						userId_workspaceId: {
							userId,
							workspaceId: task.workspaceId,
						},
					},
				});
				const isWorkspaceAdmin =
					member?.role === "OWNER" || member?.role === "ADMIN";
				const isProjectMember = task.project?.projectMembers?.some(
					(pm: any) => pm.memberId === member?.id,
				);
				const isProjectCreator = task.project?.createdById === member?.id;
				const isTaskCreator = task.createdById === member?.id;
				const isTaskAssignee = task.taskMembers?.some(
					(tm: any) => tm.memberId === member?.id,
				);

				if (
					!isWorkspaceAdmin &&
					!isProjectMember &&
					!isProjectCreator &&
					!isTaskCreator &&
					!isTaskAssignee
				) {
					return {
						success: false,
						message: "You do not have permission to view this task",
						task: null,
					};
				}
			}
		}

		if (task.projectId) {
			const allProjectResources = await db.resource.findMany({
				where: {
					projectId: task.projectId,
				},
			});
			(task as any).resources = allProjectResources;
		}

		return {
			success: true,
			message: "Task details fetched successfully",
			task,
		};
	} catch (error: any) {
		console.error("Error fetching task details:", error);
		return {
			success: false,
			message: "Failed to fetch task details",
			task: null,
		};
	}
};

export const checkAndAutoCompleteProject = async (
	projectId: string,
	memberId?: string,
) => {
	if (!projectId) return { projectAutoCompleted: false };

	try {
		const tasks = await db.task.findMany({
			where: { projectId },
		});

		if (tasks.length > 0 && tasks.every((t) => t.status === Status.COMPLETED)) {
			const project = await db.project.findUnique({
				where: { id: projectId },
			});

			if (project && project.status !== Status.COMPLETED) {
				await db.project.update({
					where: { id: projectId },
					data: { status: Status.COMPLETED },
				});

				let memberIdToUse = memberId;
				if (!memberIdToUse) {
					const session = await auth();
					const workspaceId = session?.user?.currentWorkspaceId;
					const userId = session?.user?.id;
					if (userId && workspaceId) {
						const member = await db.member.findUnique({
							where: { userId_workspaceId: { userId, workspaceId } },
						});
						memberIdToUse = member?.id;
					}
				}

				if (memberIdToUse) {
					await db.activity.create({
						data: {
							type: "PROJECTS",
							title: "Project Status Changed",
							description: `All tasks completed. Changed status of project "${project.title}" to Completed`,
							workspaceId: project.workspaceId,
							projectId,
							memberId: memberIdToUse,
						},
					});
				}

				revalidatePath("/projects");
				revalidatePath(`/projects/${projectId}`);

				return { projectAutoCompleted: true };
			}
		}
	} catch (error) {
		console.error("Error in checkAndAutoCompleteProject:", error);
	}

	return { projectAutoCompleted: false };
};

export const checkAndUpdateProjectOnTaskRemovedFromTodo = async (
	projectId: string,
	memberId?: string,
) => {
	if (!projectId) return { projectSetToInProgress: false };

	try {
		const project = await db.project.findUnique({
			where: { id: projectId },
		});

		if (project && project.status === Status.TODO) {
			await db.project.update({
				where: { id: projectId },
				data: { status: Status.IN_PROGRESS },
			});

			let memberIdToUse = memberId;
			if (!memberIdToUse) {
				const session = await auth();
				const workspaceId = session?.user?.currentWorkspaceId;
				const userId = session?.user?.id;
				if (userId && workspaceId) {
					const member = await db.member.findUnique({
						where: { userId_workspaceId: { userId, workspaceId } },
					});
					memberIdToUse = member?.id;
				}
			}

			if (memberIdToUse) {
				await db.activity.create({
					data: {
						type: "PROJECTS",
						title: "Project Status Changed",
						description: `Task status updated from TODO. Changed status of project "${project.title}" to In Progress`,
						workspaceId: project.workspaceId,
						projectId,
						memberId: memberIdToUse,
					},
				});
			}

			revalidatePath("/projects");
			revalidatePath(`/projects/${projectId}`);

			return { projectSetToInProgress: true };
		}
	} catch (error) {
		console.error("Error in checkAndUpdateProjectOnTaskRemovedFromTodo:", error);
	}

	return { projectSetToInProgress: false };
};

export const checkAndUpdateProjectOnTaskUncompleted = async (
	projectId: string,
	memberId?: string,
) => {
	if (!projectId) return { projectSetToInProgress: false };

	try {
		const project = await db.project.findUnique({
			where: { id: projectId },
			include: { tasks: true },
		});

		if (project && project.status === Status.COMPLETED) {
			const hasIncompleteTasks = project.tasks.some(
				(t) => t.status !== Status.COMPLETED,
			);

			if (hasIncompleteTasks) {
				await db.project.update({
					where: { id: projectId },
					data: { status: Status.IN_PROGRESS },
				});

				let memberIdToUse = memberId;
				if (!memberIdToUse) {
					const session = await auth();
					const workspaceId = session?.user?.currentWorkspaceId;
					const userId = session?.user?.id;
					if (userId && workspaceId) {
						const member = await db.member.findUnique({
							where: { userId_workspaceId: { userId, workspaceId } },
						});
						memberIdToUse = member?.id;
					}
				}

				if (memberIdToUse) {
					await db.activity.create({
						data: {
							type: "PROJECTS",
							title: "Project Status Changed",
							description: `Task status updated from Completed. Changed status of project "${project.title}" to In Progress`,
							workspaceId: project.workspaceId,
							projectId,
							memberId: memberIdToUse,
						},
					});
				}

				revalidatePath("/projects");
				revalidatePath(`/projects/${projectId}`);

				return { projectSetToInProgress: true };
			}
		}
	} catch (error) {
		console.error("Error in checkAndUpdateProjectOnTaskUncompleted:", error);
	}

	return { projectSetToInProgress: false };
};

export const checkAndUpdateTaskOnMilestoneUncompleted = async (
	taskId: string,
	memberId?: string,
) => {
	if (!taskId)
		return {
			taskSetToInProgress: false,
			projectSetToInProgress: false,
		};

	try {
		const task = await db.task.findUnique({
			where: { id: taskId },
			include: { milestones: true },
		});

		if (!task)
			return {
				taskSetToInProgress: false,
				projectSetToInProgress: false,
			};

		let taskSetToInProgress = false;
		let projectSetToInProgress = false;

		const hasIncompleteMilestones = task.milestones.some(
			(m) => m.status !== MileStoneStatus.DONE,
		);

		if (hasIncompleteMilestones && task.status === Status.COMPLETED) {
			await db.task.update({
				where: { id: taskId },
				data: { status: Status.IN_PROGRESS },
			});
			taskSetToInProgress = true;

			let memberIdToUse = memberId;
			if (!memberIdToUse) {
				const session = await auth();
				const workspaceId = session?.user?.currentWorkspaceId;
				const userId = session?.user?.id;
				if (userId && workspaceId) {
					const member = await db.member.findUnique({
						where: { userId_workspaceId: { userId, workspaceId } },
					});
					memberIdToUse = member?.id;
				}
			}

			if (memberIdToUse) {
				await db.activity.create({
					data: {
						type: "TASKS",
						title: "Task Status Changed",
						description: `Milestone status updated from Completed. Changed status of task "${task.title}" to In Progress`,
						workspaceId: task.workspaceId,
						projectId: task.projectId,
						taskId,
						memberId: memberIdToUse,
					},
				});
			}

			const projRes = await checkAndUpdateProjectOnTaskUncompleted(
				task.projectId,
				memberIdToUse,
			);
			projectSetToInProgress = projRes.projectSetToInProgress;

			revalidatePath("/tasks");
			revalidatePath(`/tasks/${taskId}`);
			revalidatePath(`/projects/${task.projectId}`);
		} else {
			const projRes = await checkAndUpdateProjectOnTaskUncompleted(
				task.projectId,
				memberId,
			);
			projectSetToInProgress = projRes.projectSetToInProgress;
		}

		return {
			taskSetToInProgress,
			projectSetToInProgress,
			taskStatus: taskSetToInProgress ? Status.IN_PROGRESS : task.status,
		};
	} catch (error) {
		console.error(
			"Error in checkAndUpdateTaskOnMilestoneUncompleted:",
			error,
		);
	}

	return {
		taskSetToInProgress: false,
		projectSetToInProgress: false,
	};
};

export const checkAndUpdateTaskOnMilestoneComplete = async (
	taskId: string,
	memberId?: string,
) => {
	if (!taskId)
		return {
			taskSetToInProgress: false,
			projectSetToInProgress: false,
			taskAutoCompleted: false,
			projectAutoCompleted: false,
		};

	try {
		const task = await db.task.findUnique({
			where: { id: taskId },
			include: { milestones: true },
		});

		if (!task)
			return {
				taskSetToInProgress: false,
				projectSetToInProgress: false,
				taskAutoCompleted: false,
				projectAutoCompleted: false,
			};

		let taskSetToInProgress = false;
		let projectSetToInProgress = false;

		if (task.status === Status.TODO) {
			await db.task.update({
				where: { id: taskId },
				data: { status: Status.IN_PROGRESS },
			});
			taskSetToInProgress = true;

			let memberIdToUse = memberId;
			if (!memberIdToUse) {
				const session = await auth();
				const workspaceId = session?.user?.currentWorkspaceId;
				const userId = session?.user?.id;
				if (userId && workspaceId) {
					const member = await db.member.findUnique({
						where: { userId_workspaceId: { userId, workspaceId } },
					});
					memberIdToUse = member?.id;
				}
			}

			if (memberIdToUse) {
				await db.activity.create({
					data: {
						type: "TASKS",
						title: "Task Status Changed",
						description: `Milestone completed. Changed status of task "${task.title}" to In Progress`,
						workspaceId: task.workspaceId,
						projectId: task.projectId,
						taskId,
						memberId: memberIdToUse,
					},
				});
			}

			const projRes = await checkAndUpdateProjectOnTaskRemovedFromTodo(
				task.projectId,
				memberId,
			);
			projectSetToInProgress = projRes.projectSetToInProgress;

			revalidatePath("/tasks");
			revalidatePath(`/tasks/${taskId}`);
			revalidatePath(`/projects/${task.projectId}`);
		}

		const autoRes = await checkAndAutoCompleteTask(taskId, memberId);

		return {
			taskSetToInProgress,
			projectSetToInProgress:
				projectSetToInProgress || autoRes.projectAutoCompleted,
			taskAutoCompleted: autoRes.taskAutoCompleted,
			projectAutoCompleted: autoRes.projectAutoCompleted,
			taskStatus:
				autoRes.taskAutoCompleted ? Status.COMPLETED
				: taskSetToInProgress ? Status.IN_PROGRESS
				: task.status,
		};
	} catch (error) {
		console.error("Error in checkAndUpdateTaskOnMilestoneComplete:", error);
	}

	return {
		taskSetToInProgress: false,
		projectSetToInProgress: false,
		taskAutoCompleted: false,
		projectAutoCompleted: false,
	};
};

export const checkAndAutoCompleteTask = async (
	taskId: string,
	memberId?: string,
) => {
	if (!taskId) return { taskAutoCompleted: false, projectAutoCompleted: false };

	try {
		const task = await db.task.findUnique({
			where: { id: taskId },
			include: { milestones: true },
		});

		if (!task) return { taskAutoCompleted: false, projectAutoCompleted: false };

		const milestones = task.milestones;
		if (
			milestones.length > 0 &&
			milestones.every((m) => m.status === MileStoneStatus.DONE)
		) {
			let taskAutoCompleted = false;
			if (task.status !== Status.COMPLETED) {
				await db.task.update({
					where: { id: taskId },
					data: { status: Status.COMPLETED },
				});
				taskAutoCompleted = true;

				let memberIdToUse = memberId;
				if (!memberIdToUse) {
					const session = await auth();
					const workspaceId = session?.user?.currentWorkspaceId;
					const userId = session?.user?.id;
					if (userId && workspaceId) {
						const member = await db.member.findUnique({
							where: { userId_workspaceId: { userId, workspaceId } },
						});
						memberIdToUse = member?.id;
					}
				}

				if (memberIdToUse) {
					await db.activity.create({
						data: {
							type: "TASKS",
							title: "Task Status Changed",
							description: `All milestones completed. Changed status of task "${task.title}" to Completed`,
							workspaceId: task.workspaceId,
							projectId: task.projectId,
							taskId,
							memberId: memberIdToUse,
						},
					});
				}

				revalidatePath("/tasks");
				revalidatePath(`/tasks/${taskId}`);
				revalidatePath(`/projects/${task.projectId}`);
			}

			const projectRes = await checkAndAutoCompleteProject(
				task.projectId,
				memberId,
			);

			return {
				taskAutoCompleted: taskAutoCompleted || task.status === Status.COMPLETED,
				projectAutoCompleted: projectRes.projectAutoCompleted,
			};
		}
	} catch (error) {
		console.error("Error in checkAndAutoCompleteTask:", error);
	}

	return { taskAutoCompleted: false, projectAutoCompleted: false };
};

export const createTask = async (input: CreateTaskInput) => {
	const {
		title,
		description,
		projectId,
		workspaceId,
		createdById,
		priority = PriorityLevel.MEDIUM,
		status = Status.TODO,
		startPeriod,
		endPeriod,
		memberIds = [],
		labels = [],
		resources = [],
		milestones = [],
	} = input;

	if (!title || !projectId || !workspaceId || !createdById) {
		return {
			success: false,
			message:
				"Missing required fields (title, project, workspace, creator)",
		};
	}

	try {
		const taskStart = new Date(startPeriod);
		const taskEnd = new Date(endPeriod);

		if (taskEnd < taskStart) {
			return {
				success: false,
				message: "Task due date cannot be before start date",
			};
		}

		const project = await db.project.findUnique({
			where: { id: projectId },
		});

		if (!project) {
			return {
				success: false,
				message: "Project not found",
			};
		}

		const projStart = new Date(project.startPeriod);
		const projEnd = new Date(project.endPeriod);

		if (taskStart < projStart || taskStart > projEnd) {
			return {
				success: false,
				message: "Task start date must be within the project date range",
			};
		}

		if (taskEnd > projEnd || taskEnd < taskStart) {
			return {
				success: false,
				message: "Task due date must be within the project date range and not before start date",
			};
		}

		if (milestones && milestones.length > 0) {
			for (const m of milestones) {
				if (!m.title?.trim()) {
					return {
						success: false,
						message: "Milestone title is required",
					};
				}
				if (m.dueDate) {
					const mDate = new Date(m.dueDate);
					if (mDate < taskStart || mDate > taskEnd) {
						return {
							success: false,
							message: `Milestone "${m.title}" date must be within the task date range`,
						};
					}
				}
			}
		}

		const newTask = await db.task.create({
			data: {
				title,
				description,
				projectId,
				workspaceId,
				createdById,
				priority,
				status,
				startPeriod: taskStart,
				endPeriod: taskEnd,
				Labels: (labels || []).map(formatLabel).filter(Boolean),
				taskMembers: {
					create: memberIds.map((memberId) => ({
						memberId,
					})),
				},
				milestones:
					milestones && milestones.length > 0 ?
						{
							create: milestones.map((m) => ({
								title: m.title.trim(),
								description: m.description?.trim() || "",
								dueDate: m.dueDate ? new Date(m.dueDate) : taskEnd,
								status: MileStoneStatus.NOT_STARTED,
								createdById,
							})),
						}
					:	undefined,
				resources:
					resources.length > 0 ?
						{
							create: resources.map((r) => ({
								name: r.name,
								url: r.url,
								workspaceId,
								projectId,
							})),
						}
					:	undefined,
				activities: {
					create: {
						type: "TASKS",
						title: "Task Created",
						description: `Created task "${title}"`,
						workspaceId,
						projectId,
						memberId: createdById,
					},
				},
			},
			include: {
				project: true,
				taskMembers: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				},
				milestones: true,
				resources: true,
				createdBy: {
					include: {
						user: true,
					},
				},
				activities: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		revalidatePath("/tasks");
		revalidatePath(`/projects/${projectId}`);

		const createdActivity = newTask.activities?.[0];

		if (createdActivity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: createdActivity }
			);
		}

		await triggerPusherEvent(
			[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
			PUSHER_EVENTS.TASK_CREATED,
			{ task: newTask, taskId: newTask.id, projectId, workspaceId }
		);

		let projectSetToInProgress = false;
		if (newTask.status !== Status.TODO) {
			const res = await checkAndUpdateProjectOnTaskRemovedFromTodo(
				projectId,
				createdById,
			);
			projectSetToInProgress = res.projectSetToInProgress;
		}

		if (newTask.status !== Status.COMPLETED) {
			const res = await checkAndUpdateProjectOnTaskUncompleted(
				projectId,
				createdById,
			);
			projectSetToInProgress =
				projectSetToInProgress || res.projectSetToInProgress;
		}

		let projectAutoCompleted = false;
		if (newTask.status === Status.COMPLETED) {
			const res = await checkAndAutoCompleteProject(projectId, createdById);
			projectAutoCompleted = res.projectAutoCompleted;
		}

		return {
			success: true,
			message: "Task created successfully",
			task: newTask,
			activity: createdActivity,
			projectSetToInProgress,
			projectAutoCompleted,
		};
	} catch (error: any) {
		console.error("Error creating task:", error);
		return {
			success: false,
			message: error?.message || "Failed to create task",
		};
	}
};

export const updateTaskDetails = async ({
	taskId,
	values,
	memberId,
}: {
	taskId: string;
	values: {
		title?: string;
		description?: string;
		status?: Status;
		priority?: PriorityLevel;
		startPeriod?: Date;
		endPeriod?: Date;
		projectId?: string;
		Labels?: string[];
		labels?: string[];
	};
	memberId?: string;
}) => {
	if (!taskId) {
		return {
			success: false,
			message: "Task ID is required",
		};
	}

	try {
		const session = await auth();
		const workspaceId = session?.user?.currentWorkspaceId;
		const userId = session?.user?.id;

		const resolved = await resolveTaskMemberAndAccess(taskId, userId, workspaceId);
		if (!resolved) {
			return {
				success: false,
				message: "Unauthorized or task not found",
			};
		}

		if (!resolved.access.canEditTask) {
			return {
				success: false,
				message:
					"Only assigned task members and the task creator can edit this task.",
			};
		}

		const existingTask = resolved.task;

		if (values.startPeriod || values.endPeriod) {
			const project = await db.project.findUnique({
				where: { id: existingTask.projectId },
			});
			if (project) {
				const newStart = values.startPeriod ? new Date(values.startPeriod) : new Date(existingTask.startPeriod);
				const newEnd = values.endPeriod ? new Date(values.endPeriod) : new Date(existingTask.endPeriod);
				const projStart = new Date(project.startPeriod);
				const projEnd = new Date(project.endPeriod);

				if (newStart < projStart || newStart > projEnd) {
					return {
						success: false,
						message: "Task start date must be within the project date range",
					};
				}
				if (newEnd > projEnd || newEnd < newStart) {
					return {
						success: false,
						message: "Task due date must be within the project date range and not before start date",
					};
				}

				const milestones = existingTask.milestones || [];
				for (const m of milestones) {
					if (m.dueDate) {
						const mDate = new Date(m.dueDate);
						if (mDate < newStart || mDate > newEnd) {
							return {
								success: false,
								message: `Cannot update task dates: milestone "${m.title}" falls outside the new task date range`,
							};
						}
					}
				}
			}
		}

		let memberIdToUse = memberId;
		if (!memberIdToUse) {
			const session = await auth();
			const workspaceId = session?.user?.currentWorkspaceId;
			const userId = session?.user?.id;
			if (userId && workspaceId) {
				const member = await db.member.findUnique({
					where: { userId_workspaceId: { userId, workspaceId } },
				});
				memberIdToUse = member?.id;
			}
		}

		if (values.status === Status.COMPLETED) {
			await db.mileStone.updateMany({
				where: { taskId },
				data: {
					status: MileStoneStatus.DONE,
					...(memberIdToUse ? { completedById: memberIdToUse } : {}),
				},
			});
		} else if (values.status === Status.IN_PROGRESS || values.status === Status.TODO) {
			await db.mileStone.updateMany({
				where: { taskId },
				data: {
					status: MileStoneStatus.NOT_STARTED,
					completedById: null,
				},
			});
		}

		const { labels, Labels, ...otherValues } = values;
		const taskLabels = Labels ?? labels;

		const updatedTask = await db.task.update({
			where: { id: taskId },
			data: {
				...otherValues,
				...(taskLabels !== undefined ? { Labels: taskLabels } : {}),
			},
			include: {
				project: true,
				taskMembers: {
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				},
				milestones: true,
			},
		});

		let createdActivity = null;
		if (memberIdToUse) {
			let activityTitle = "Task Updated";
			let activityDesc = `Updated task "${updatedTask.title}"`;

			if (values.title && values.title !== existingTask.title) {
				activityTitle = "Task Title Updated";
				activityDesc = `Changed task title from "${existingTask.title}" to "${values.title}"`;
			} else if (
				values.description !== undefined &&
				values.description !== existingTask.description
			) {
				activityTitle = "Task Description Updated";
				activityDesc = `Updated description for task "${updatedTask.title}"`;
			} else if (
				values.status &&
				values.status !== existingTask.status
			) {
				activityTitle = "Task Status Changed";
				activityDesc = `Changed status of task "${updatedTask.title}" to ${formatStatus(values.status)}`;
			} else if (
				values.priority &&
				values.priority !== existingTask.priority
			) {
				activityTitle = "Task Priority Changed";
				activityDesc = `Changed priority of task "${updatedTask.title}" to ${formatPriority(values.priority)}`;
			} else if (
				values.startPeriod &&
				new Date(values.startPeriod).getTime() !==
					new Date(existingTask.startPeriod).getTime()
			) {
				activityTitle = "Task Start Date Updated";
				activityDesc = `Updated start date for task "${updatedTask.title}"`;
			} else if (
				values.endPeriod &&
				new Date(values.endPeriod).getTime() !==
					new Date(existingTask.endPeriod).getTime()
			) {
				activityTitle = "Task Due Date Updated";
				activityDesc = `Updated due date for task "${updatedTask.title}"`;
			} else if (taskLabels !== undefined) {
				activityTitle = "Task Labels Updated";
				activityDesc = `Updated labels for task "${updatedTask.title}"`;
			}

			createdActivity = await db.activity.create({
				data: {
					type: "TASKS",
					title: activityTitle,
					description: activityDesc,
					workspaceId: existingTask.workspaceId,
					projectId: existingTask.projectId,
					taskId,
					memberId: memberIdToUse,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});
		}

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

		if (createdActivity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getTaskChannel(taskId), PUSHER_CHANNELS.getWorkspaceChannel(existingTask.workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: createdActivity }
			);
		}

		await triggerPusherEvent(
			[PUSHER_CHANNELS.getTaskChannel(taskId), PUSHER_CHANNELS.getWorkspaceChannel(existingTask.workspaceId)],
			PUSHER_EVENTS.TASK_UPDATED,
			{ taskId, updates: values, task: updatedTask, status: updatedTask.status }
		);

		let projectSetToInProgress = false;
		if (existingTask.status === Status.TODO && updatedTask.status !== Status.TODO) {
			const res = await checkAndUpdateProjectOnTaskRemovedFromTodo(
				existingTask.projectId,
				memberIdToUse,
			);
			projectSetToInProgress = res.projectSetToInProgress;
		}

		if (
			existingTask.status === Status.COMPLETED &&
			updatedTask.status !== Status.COMPLETED
		) {
			const res = await checkAndUpdateProjectOnTaskUncompleted(
				existingTask.projectId,
				memberIdToUse,
			);
			projectSetToInProgress =
				projectSetToInProgress || res.projectSetToInProgress;
		}

		let projectAutoCompleted = false;
		if (updatedTask.status === Status.COMPLETED) {
			const projectRes = await checkAndAutoCompleteProject(
				existingTask.projectId,
				memberIdToUse,
			);
			projectAutoCompleted = projectRes.projectAutoCompleted;
		}

		return {
			success: true,
			message: "Task updated successfully",
			task: updatedTask,
			activity: createdActivity,
			projectSetToInProgress,
			projectAutoCompleted,
		};
	} catch (error: any) {
		console.error("Error updating task:", error);
		return {
			success: false,
			message: "Failed to update task",
		};
	}
};

export const updateTaskMembers = async ({
	taskId,
	memberIds,
	actorMemberId,
}: {
	taskId: string;
	memberIds: string[];
	actorMemberId?: string;
}) => {
	if (!taskId) {
		return {
			success: false,
			message: "Task ID is required",
		};
	}

	try {
		const session = await auth();
		const workspaceId = session?.user?.currentWorkspaceId;
		const userId = session?.user?.id;

		const resolved = await resolveTaskMemberAndAccess(taskId, userId, workspaceId);
		if (!resolved) {
			return {
				success: false,
				message: "Unauthorized or task not found",
			};
		}

		if (!resolved.access.canManageMembers) {
			return {
				success: false,
				message: "You do not have permission to manage assignees for this task.",
			};
		}

		const existingTask = resolved.task;

		// Delete current task members
		await db.taskMember.deleteMany({
			where: { taskId },
		});

		// Insert new task members
		if (memberIds.length > 0) {
			await db.taskMember.createMany({
				data: memberIds.map((mId) => ({
					taskId,
					memberId: mId,
				})),
			});
		}

		let createdActivity = null;
		const memberIdToUse = actorMemberId || resolved.member.id;
		if (memberIdToUse) {
			createdActivity = await db.activity.create({
				data: {
					type: "TASKS",
					title: "Task Assignees Updated",
					description: `Updated assignees for task "${existingTask.title}"`,
					workspaceId: existingTask.workspaceId,
					projectId: existingTask.projectId,
					taskId,
					memberId: memberIdToUse,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});
		}

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

		if (createdActivity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getTaskChannel(taskId), PUSHER_CHANNELS.getWorkspaceChannel(existingTask.workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: createdActivity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getTaskChannel(taskId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ taskId, memberIds }
		);

		return {
			success: true,
			message: "Task assignees updated successfully",
			activity: createdActivity,
		};
	} catch (error: any) {
		console.error("Error updating task members:", error);
		return {
			success: false,
			message: "Failed to update task assignees",
		};
	}
};

export const deleteTask = async (taskId: string, actorMemberId?: string) => {
	if (!taskId) {
		return {
			success: false,
			message: "Task ID is required",
		};
	}

	try {
		const session = await auth();
		const workspaceId = session?.user?.currentWorkspaceId;
		const userId = session?.user?.id;

		const resolved = await resolveTaskMemberAndAccess(taskId, userId, workspaceId);
		if (!resolved) {
			return {
				success: false,
				message: "Unauthorized or task not found",
			};
		}

		if (!resolved.access.canDeleteTask) {
			return {
				success: false,
				message: "You do not have permission to delete this task.",
			};
		}

		const existingTask = resolved.task;
		const memberIdToUse = actorMemberId || resolved.member.id;

		await db.taskMember.deleteMany({ where: { taskId } });
		await db.mileStone.deleteMany({ where: { taskId } });
		await db.comment.deleteMany({ where: { taskId } });
		await db.resource.deleteMany({ where: { taskId } });
		await db.activity.deleteMany({ where: { taskId } });
		await db.task.delete({ where: { id: taskId } });

		// Create project activity record for task deletion
		const deletedActivity = await db.activity.create({
			data: {
				type: "PROJECTS",
				title: "Task Deleted",
				description: `Deleted task "${existingTask.title}"`,
				workspaceId: existingTask.workspaceId,
				projectId: existingTask.projectId,
				memberId: memberIdToUse,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

		if (deletedActivity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(existingTask.projectId), PUSHER_CHANNELS.getWorkspaceChannel(existingTask.workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: deletedActivity }
			);
		}

		await triggerPusherEvent(
			[PUSHER_CHANNELS.getProjectChannel(existingTask.projectId), PUSHER_CHANNELS.getWorkspaceChannel(existingTask.workspaceId)],
			PUSHER_EVENTS.TASK_DELETED,
			{ taskId, projectId: existingTask.projectId }
		);

		await checkAndUpdateProjectOnTaskUncompleted(
			existingTask.projectId,
			memberIdToUse,
		);
		await checkAndAutoCompleteProject(existingTask.projectId, memberIdToUse);

		return {
			success: true,
			message: "Task deleted successfully",
		};
	} catch (error: any) {
		console.error("Error deleting task:", error);
		return {
			success: false,
			message: "Failed to delete task",
		};
	}
};

export const addMilestone = async ({
	taskId,
	title,
	description,
	dueDate,
}: {
	taskId: string;
	title: string;
	description?: string;
	dueDate?: Date;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return { success: false, message: "Unauthorized" };
	}
	if (!title.trim()) {
		return { success: false, message: "Milestone title is required" };
	}
	try {
		const resolved = await resolveTaskMemberAndAccess(taskId, userId, workspaceId);
		if (!resolved) {
			return { success: false, message: "Unauthorized or task not found" };
		}

		if (!resolved.access.canEditTask) {
			return {
				success: false,
				message:
					"Only assigned task members and the task creator can add milestones to this task.",
			};
		}

		const task = resolved.task;
		const member = resolved.member;

		const taskStart = new Date(task.startPeriod);
		const taskEnd = new Date(task.endPeriod);

		if (dueDate) {
			const mDate = new Date(dueDate);
			if (mDate < taskStart || mDate > taskEnd) {
				return {
					success: false,
					message: "Milestone date must be within the task date range",
				};
			}
		}

		const milestone = await db.mileStone.create({
			data: {
				title: title.trim(),
				description: description?.trim() || "",
				taskId,
				dueDate: dueDate ? new Date(dueDate) : taskEnd,
				status: MileStoneStatus.NOT_STARTED,
				createdById: member?.id ?? userId,
			},
		});

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Milestone Created",
				description: `Added milestone "${title.trim()}" to this task`,
				workspaceId,
				projectId: task.projectId,
				taskId,
				memberId: member?.id,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		revalidatePath(`/tasks/${taskId}`);
		await checkAndUpdateTaskOnMilestoneUncompleted(
			taskId,
			member?.id,
		);

		if (activity) {
			await triggerPusherEvent(
				[
					PUSHER_CHANNELS.getTaskChannel(taskId),
					...(task.projectId ? [PUSHER_CHANNELS.getProjectChannel(task.projectId)] : []),
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getTaskChannel(taskId),
			PUSHER_EVENTS.MILESTONE_CREATED,
			{ taskId, milestone }
		);

		return {
			success: true,
			message: "Milestone added successfully",
			milestone,
			activity,
		};
	} catch (e: any) {
		console.error("Error adding milestone:", e);
		return { success: false, message: "Failed to add milestone" };
	}
};

export const toggleMilestoneStatus = async ({
	milestoneId,
	status,
}: {
	milestoneId: string;
	status: MileStoneStatus;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return { success: false, message: "Unauthorized" };
	}
	try {
		const existingMilestone = await db.mileStone.findUnique({
			where: { id: milestoneId },
			include: { task: true },
		});
		if (!existingMilestone) {
			return { success: false, message: "Milestone not found" };
		}

		const resolved = await resolveTaskMemberAndAccess(
			existingMilestone.taskId,
			userId,
			workspaceId,
		);
		if (!resolved) {
			return { success: false, message: "Unauthorized or task not found" };
		}

		if (!resolved.access.canEditTask) {
			return {
				success: false,
				message:
					"Only assigned task members and the task creator can update milestones for this task.",
			};
		}

		const member = resolved.member;

		const milestone = await db.mileStone.update({
			where: { id: milestoneId },
			data: { status },
			include: { task: true },
		});

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Milestone Updated",
				description: `Marked milestone "${milestone.title}" as ${status === MileStoneStatus.DONE ? "Completed" : "To Do"}`,
				workspaceId,
				projectId: milestone.task.projectId,
				taskId: milestone.taskId,
				memberId: member?.id,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		revalidatePath(`/tasks/${milestone.taskId}`);
		revalidatePath(`/projects/${milestone.task.projectId}`);

		let autoRes = {
			taskSetToInProgress: false,
			projectSetToInProgress: false,
			taskAutoCompleted: false,
			projectAutoCompleted: false,
			taskStatus: undefined as Status | undefined,
		};

		if (status === MileStoneStatus.DONE) {
			const res = await checkAndUpdateTaskOnMilestoneComplete(
				milestone.taskId,
				member?.id,
			);
			autoRes = {
				taskSetToInProgress: res.taskSetToInProgress,
				projectSetToInProgress: res.projectSetToInProgress,
				taskAutoCompleted: res.taskAutoCompleted,
				projectAutoCompleted: res.projectAutoCompleted,
				taskStatus: res.taskStatus,
			};
		} else {
			const res = await checkAndUpdateTaskOnMilestoneUncompleted(
				milestone.taskId,
				member?.id,
			);
			autoRes = {
				taskSetToInProgress: res.taskSetToInProgress,
				projectSetToInProgress: res.projectSetToInProgress,
				taskAutoCompleted: false,
				projectAutoCompleted: false,
				taskStatus: res.taskStatus,
			};
		}

		if (activity) {
			await triggerPusherEvent(
				[
					PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
					...(milestone.task.projectId ? [PUSHER_CHANNELS.getProjectChannel(milestone.task.projectId)] : []),
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
			PUSHER_EVENTS.MILESTONE_UPDATED,
			{ taskId: milestone.taskId, milestoneId, milestone, taskStatus: autoRes.taskStatus }
		);

		if (autoRes.taskStatus) {
			await triggerPusherEvent(
				[
					PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
					...(milestone.task.projectId ? [PUSHER_CHANNELS.getProjectChannel(milestone.task.projectId)] : []),
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				],
				PUSHER_EVENTS.TASK_UPDATED,
				{ taskId: milestone.taskId, updates: { status: autoRes.taskStatus }, status: autoRes.taskStatus }
			);
		}

		return {
			success: true,
			message: "Milestone updated",
			milestone,
			activity,
			taskSetToInProgress: autoRes.taskSetToInProgress,
			projectSetToInProgress: autoRes.projectSetToInProgress,
			taskAutoCompleted: autoRes.taskAutoCompleted,
			projectAutoCompleted: autoRes.projectAutoCompleted,
			taskStatus: autoRes.taskStatus,
		};
	} catch (e: any) {
		console.error("Error updating milestone:", e);
		return { success: false, message: "Failed to update milestone" };
	}
};

export const deleteMilestone = async (milestoneId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) return { success: false, message: "Unauthorized" };
	try {
		const milestone = await db.mileStone.findUnique({
			where: { id: milestoneId },
			include: { task: true },
		});
		if (!milestone)
			return { success: false, message: "Milestone not found" };

		const resolved = await resolveTaskMemberAndAccess(
			milestone.taskId,
			userId,
			workspaceId,
		);
		if (!resolved) {
			return { success: false, message: "Unauthorized or task not found" };
		}

		if (!resolved.access.canEditTask) {
			return {
				success: false,
				message:
					"Only assigned task members and the task creator can delete milestones for this task.",
			};
		}

		const member = resolved.member;

		await db.mileStone.delete({ where: { id: milestoneId } });

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Milestone Deleted",
				description: `Deleted milestone "${milestone.title}" from this task`,
				workspaceId,
				projectId: milestone.task.projectId,
				taskId: milestone.taskId,
				memberId: member?.id,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		revalidatePath(`/tasks/${milestone.taskId}`);
		revalidatePath(`/projects/${milestone.task.projectId}`);

		const uncompRes = await checkAndUpdateTaskOnMilestoneUncompleted(
			milestone.taskId,
			member?.id,
		);

		const autoRes = await checkAndAutoCompleteTask(
			milestone.taskId,
			member?.id,
		);

		if (activity) {
			await triggerPusherEvent(
				[
					PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
					...(milestone.task.projectId ? [PUSHER_CHANNELS.getProjectChannel(milestone.task.projectId)] : []),
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
			PUSHER_EVENTS.MILESTONE_DELETED,
			{ taskId: milestone.taskId, milestoneId }
		);

		const updatedStatus = autoRes.taskAutoCompleted ? Status.COMPLETED : uncompRes.taskStatus;
		if (updatedStatus) {
			await triggerPusherEvent(
				[
					PUSHER_CHANNELS.getTaskChannel(milestone.taskId),
					...(milestone.task.projectId ? [PUSHER_CHANNELS.getProjectChannel(milestone.task.projectId)] : []),
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				],
				PUSHER_EVENTS.TASK_UPDATED,
				{ taskId: milestone.taskId, updates: { status: updatedStatus }, status: updatedStatus }
			);
		}

		return {
			success: true,
			message: "Milestone deleted",
			activity,
			taskSetToInProgress: uncompRes.taskSetToInProgress,
			projectSetToInProgress: uncompRes.projectSetToInProgress,
			taskAutoCompleted: autoRes.taskAutoCompleted,
			projectAutoCompleted: autoRes.projectAutoCompleted,
			taskStatus: autoRes.taskAutoCompleted ? Status.COMPLETED : uncompRes.taskStatus,
		};
	} catch (e: any) {
		console.error("Error deleting milestone:", e);
		return { success: false, message: "Failed to delete milestone" };
	}
};

async function withRetry<T>(
	fn: () => Promise<T>,
	retries = 2,
	delayMs = 400,
): Promise<T> {
	try {
		return await fn();
	} catch (err: any) {
		const isDnsError =
			err?.code === "EAI_AGAIN" ||
			err?.message?.includes("EAI_AGAIN") ||
			err?.message?.includes("getaddrinfo");

		if (retries > 0 && isDnsError) {
			await new Promise((r) => setTimeout(r, delayMs));
			return withRetry(fn, retries - 1, delayMs * 2);
		}
		throw err;
	}
}

export const addTaskComment = async ({
	taskId,
	message,
	replyCommentId,
}: {
	taskId: string;
	message: string;
	replyCommentId?: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return { success: false, message: "Unauthorized" };
	}
	if (!message.trim()) {
		return { success: false, message: "Comment content cannot be empty" };
	}
	try {
		return await withRetry(async () => {
			const resolved = await resolveTaskMemberAndAccess(
				taskId,
				userId,
				workspaceId,
			);
			if (!resolved) {
				return { success: false, message: "Unauthorized or task not found" };
			}

			if (!resolved.access.canCommentOnTask) {
				return {
					success: false,
					message:
						"Only assigned task members, the task creator, and project leads can comment on this task.",
				};
			}

			const member = resolved.member;
			const task = resolved.task;

			const comment = await db.comment.create({
				data: {
					message: message.trim(),
					replyCommentId: replyCommentId || null,
					taskId,
					projectId: task.projectId,
					workspaceId,
					memberId: member.id,
				},
				include: {
					member: {
						include: { user: true },
					},
				},
			});

			const activity = await db.activity.create({
				data: {
					type: "TASKS",
					title: replyCommentId ? "Reply Added" : "Comment Added",
					description:
						replyCommentId ?
							`replied to a comment on task "${task.title}"`
						:	`commented on task "${task.title}"`,
					workspaceId,
					projectId: task.projectId,
					taskId,
					memberId: member.id,
				},
				include: {
					member: {
						include: { user: true },
					},
				},
			});

			revalidatePath(`/tasks/${taskId}`);
			revalidatePath(`/projects/${task.projectId}`);

			// Broadcast real-time comment creation to task channel
			await triggerPusherEvent(
				PUSHER_CHANNELS.getTaskChannel(taskId),
				PUSHER_EVENTS.COMMENT_CREATED,
				{ comment }
			);

			return {
				success: true,
				message: "Comment posted",
				comment,
				activity,
			};
		});
	} catch (e: any) {
		console.error("Error posting comment:", e);
		const isDns =
			e?.code === "EAI_AGAIN" ||
			e?.message?.includes("EAI_AGAIN") ||
			e?.message?.includes("getaddrinfo");
		return {
			success: false,
			message:
				isDns ?
					"Temporary database network glitch. Please try again."
				:	"Failed to post comment",
		};
	}
};

export const updateTaskComment = async ({
	commentId,
	message,
}: {
	commentId: string;
	message: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId)
		return { success: false, message: "Unauthorized" };
	if (!message.trim())
		return { success: false, message: "Message cannot be empty" };
	try {
		return await withRetry(async () => {
			const member = await db.member.findUnique({
				where: { userId_workspaceId: { userId, workspaceId } },
			});

			const updated = await db.comment.update({
				where: { id: commentId },
				data: { message: message.trim() },
				include: {
					member: {
						include: { user: true },
					},
				},
			});

			let activity = null;
			if (updated.taskId && member) {
				const taskObj = await db.task.findUnique({
					where: { id: updated.taskId },
					select: { title: true },
				});
				activity = await db.activity.create({
					data: {
						type: "TASKS",
						title: "Comment Updated",
						description:
							taskObj ?
								`Updated a comment on task "${taskObj.title}"`
							:	"Updated a comment",
						workspaceId,
						projectId: updated.projectId || undefined,
						taskId: updated.taskId,
						memberId: member.id,
					},
					include: {
						member: {
							include: { user: true },
						},
					},
				});
			}

			if (updated.taskId) revalidatePath(`/tasks/${updated.taskId}`);
			if (updated.projectId)
				revalidatePath(`/projects/${updated.projectId}`);

			// Broadcast real-time comment update to task channel
			if (updated.taskId) {
				await triggerPusherEvent(
					PUSHER_CHANNELS.getTaskChannel(updated.taskId),
					PUSHER_EVENTS.COMMENT_UPDATED,
					{ commentId, message: updated.message, comment: updated }
				);
			}

			return {
				success: true,
				message: "Comment updated",
				comment: updated,
				activity,
			};
		});
	} catch (e: any) {
		console.error("Error updating comment:", e);
		return { success: false, message: "Failed to update comment" };
	}
};

export const deleteTaskComment = async (commentId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId) return { success: false, message: "Unauthorized" };
	try {
		return await withRetry(async () => {
			const existing = await db.comment.findUnique({
				where: { id: commentId },
			});
			if (!existing)
				return { success: false, message: "Comment not found" };

			let memberIdToUse: string | undefined;
			if (userId && workspaceId) {
				const member = await db.member.findUnique({
					where: { userId_workspaceId: { userId, workspaceId } },
				});
				memberIdToUse = member?.id;
			}

			await db.comment.deleteMany({
				where: {
					OR: [{ id: commentId }, { replyCommentId: commentId }],
				},
			});

			let activity;
			if (existing.taskId) {
				const task = await db.task.findUnique({
					where: { id: existing.taskId },
					select: { title: true, projectId: true },
				});

				activity = await db.activity.create({
					data: {
						type: "TASKS",
						title: "Comment Deleted",
						description:
							task ?
								`Deleted a comment on task "${task.title}"`
							:	`Deleted a comment`,
						workspaceId,
						projectId:
							existing.projectId || task?.projectId || undefined,
						taskId: existing.taskId,
						memberId: memberIdToUse,
					},
					include: {
						member: {
							include: { user: true },
						},
					},
				});
			}

			if (existing.taskId) {
				// Broadcast real-time comment deletion to task channel
				await triggerPusherEvent(
					PUSHER_CHANNELS.getTaskChannel(existing.taskId),
					PUSHER_EVENTS.COMMENT_DELETED,
					{ commentId }
				);
				revalidatePath(`/tasks/${existing.taskId}`);
			}

			if (existing.projectId) {
				revalidatePath(`/projects/${existing.projectId}`);
			}

			return { success: true, message: "Comment deleted", activity };
		});
	} catch (e: any) {
		console.error("Error deleting comment:", e);
		return { success: false, message: "Failed to delete comment" };
	}
};

export const addTaskResource = async ({
	taskId,
	name,
	url,
}: {
	taskId: string;
	name: string;
	url: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return { success: false, message: "Unauthorized" };
	}
	if (!name.trim() || !url.trim()) {
		return { success: false, message: "Name and Link are required" };
	}
	try {
		const task = await db.task.findUnique({ where: { id: taskId } });
		if (!task) return { success: false, message: "Task not found" };

		const member = await db.member.findUnique({
			where: { userId_workspaceId: { userId, workspaceId } },
		});

		const resource = await db.resource.create({
			data: {
				name: name.trim(),
				url: url.trim(),
				taskId,
				projectId: task.projectId,
				workspaceId,
			},
		});

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Resource Added",
				description: `Added resource "${name.trim()}" to task "${task.title}"`,
				workspaceId,
				projectId: task.projectId,
				taskId,
				memberId: member?.id,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		revalidatePath(`/tasks/${taskId}`);
		revalidatePath(`/projects/${task.projectId}`);

		if (activity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getTaskChannel(taskId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getTaskChannel(taskId),
			PUSHER_EVENTS.RESOURCE_ADDED,
			{ taskId, resource }
		);

		return { success: true, message: "Resource added", resource, activity };
	} catch (e: any) {
		console.error("Error adding resource:", e);
		return { success: false, message: "Failed to add resource" };
	}
};

export const deleteTaskResource = async (
	resourceId: string,
	currentTaskId?: string,
) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId) return { success: false, message: "Unauthorized" };
	try {
		const resource = await db.resource.findUnique({
			where: { id: resourceId },
		});
		if (!resource) return { success: false, message: "Resource not found" };

		let memberIdToUse: string | undefined;
		if (userId && workspaceId) {
			const member = await db.member.findUnique({
				where: { userId_workspaceId: { userId, workspaceId } },
			});
			memberIdToUse = member?.id;
		}

		const targetTaskId = resource.taskId || currentTaskId;
		let taskTitle = "";
		if (targetTaskId) {
			const taskObj = await db.task.findUnique({
				where: { id: targetTaskId },
				select: { title: true },
			});
			if (taskObj) taskTitle = taskObj.title;
		}

		await db.resource.delete({ where: { id: resourceId } });

		const activityDesc =
			taskTitle ?
				`Deleted resource "${resource.name}" from task "${taskTitle}"`
			:	`Deleted resource "${resource.name}"`;

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Resource Deleted",
				description: activityDesc,
				workspaceId,
				projectId: resource.projectId,
				taskId: targetTaskId || undefined,
				memberId: memberIdToUse,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		if (targetTaskId) {
			revalidatePath(`/tasks/${targetTaskId}`);
		}
		if (resource.projectId) {
			revalidatePath(`/projects/${resource.projectId}`);
		}

		if (activity && targetTaskId) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getTaskChannel(targetTaskId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (targetTaskId) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getTaskChannel(targetTaskId),
				PUSHER_EVENTS.RESOURCE_DELETED,
				{ taskId: targetTaskId, resourceId }
			);
		}

		return { success: true, message: "Resource deleted", activity };
	} catch (e: any) {
		console.error("Error deleting resource:", e);
		return { success: false, message: "Failed to delete resource" };
	}
};

export const updateTaskResource = async ({
	resourceId,
	name,
	url,
	currentTaskId,
}: {
	resourceId: string;
	name: string;
	url: string;
	currentTaskId?: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId) return { success: false, message: "Unauthorized" };
	if (!name.trim() || !url.trim()) {
		return { success: false, message: "Name and link are required" };
	}
	try {
		let finalUrl = url.trim();
		if (
			!finalUrl.startsWith("http://") &&
			!finalUrl.startsWith("https://")
		) {
			finalUrl = `https://${finalUrl}`;
		}

		let memberIdToUse: string | undefined;
		if (userId && workspaceId) {
			const member = await db.member.findUnique({
				where: { userId_workspaceId: { userId, workspaceId } },
			});
			memberIdToUse = member?.id;
		}

		const resource = await db.resource.update({
			where: { id: resourceId },
			data: { name: name.trim(), url: finalUrl },
		});

		const targetTaskId = resource.taskId || currentTaskId;
		let taskTitle = "";
		if (targetTaskId) {
			const taskObj = await db.task.findUnique({
				where: { id: targetTaskId },
				select: { title: true },
			});
			if (taskObj) taskTitle = taskObj.title;
		}

		const activityDesc =
			taskTitle ?
				`Updated resource "${name.trim()}" on task "${taskTitle}"`
			:	`Updated resource "${name.trim()}"`;

		const activity = await db.activity.create({
			data: {
				type: "TASKS",
				title: "Resource Updated",
				description: activityDesc,
				workspaceId,
				projectId: resource.projectId,
				taskId: targetTaskId || undefined,
				memberId: memberIdToUse,
			},
			include: {
				member: {
					include: { user: true },
				},
			},
		});

		if (targetTaskId) {
			revalidatePath(`/tasks/${targetTaskId}`);
		}
		if (resource.projectId) {
			revalidatePath(`/projects/${resource.projectId}`);
		}

		if (activity && targetTaskId) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getTaskChannel(targetTaskId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (targetTaskId) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getTaskChannel(targetTaskId),
				PUSHER_EVENTS.RESOURCE_UPDATED,
				{ taskId: targetTaskId, resource }
			);
		}

		return {
			success: true,
			message: "Resource updated",
			resource,
			activity,
		};
	} catch (e: any) {
		console.error("Error updating resource:", e);
		return { success: false, message: "Failed to update resource" };
	}
};
