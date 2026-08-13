"use server";

import { db } from "../db";
import { auth } from "../../../auth";
import { MileStoneStatus, PriorityLevel, Status } from "../../../generated/prisma/client";
import { revalidatePath } from "next/cache";

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
}

export const getTasksByWorkspaceId = async (workspaceId: string) => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
			tasks: [],
			total: 0,
		};
	}

	try {
		const tasks = await db.task.findMany({
			where: {
				workspaceId,
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
			tasks,
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
	} = input;

	if (!title || !projectId || !workspaceId || !createdById) {
		return {
			success: false,
			message:
				"Missing required fields (title, project, workspace, creator)",
		};
	}

	try {
		const newTask = await db.task.create({
			data: {
				title,
				description,
				projectId,
				workspaceId,
				createdById,
				priority,
				status,
				startPeriod: new Date(startPeriod),
				endPeriod: new Date(endPeriod),
				Labels: labels,
				taskMembers: {
					create: memberIds.map((memberId) => ({
						memberId,
					})),
				},
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
				createdBy: {
					include: {
						user: true,
					},
				},
			},
		});

		revalidatePath("/tasks");
		revalidatePath(`/projects/${projectId}`);

		return {
			success: true,
			message: "Task created successfully",
			task: newTask,
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
		const existingTask = await db.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return {
				success: false,
				message: "Task not found",
			};
		}

		const updatedTask = await db.task.update({
			where: { id: taskId },
			data: {
				...values,
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
			let activityTitle = "Task Updated";
			let activityDesc = `Updated task "${updatedTask.title}"`;

			if (values.status && values.status !== existingTask.status) {
				activityTitle = "Task Status Changed";
				activityDesc = `Changed status of task "${updatedTask.title}" to ${values.status.replaceAll("_", " ")}`;
			} else if (
				values.priority &&
				values.priority !== existingTask.priority
			) {
				activityTitle = "Task Priority Changed";
				activityDesc = `Changed priority of task "${updatedTask.title}" to ${values.priority}`;
			}

			await db.activity.create({
				data: {
					type: "TASKS",
					title: activityTitle,
					description: activityDesc,
					workspaceId: existingTask.workspaceId,
					projectId: existingTask.projectId,
					taskId,
					memberId: memberIdToUse,
				},
			});
		}

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

		return {
			success: true,
			message: "Task updated successfully",
			task: updatedTask,
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
		const existingTask = await db.task.findUnique({
			where: { id: taskId },
			include: { taskMembers: true },
		});

		if (!existingTask) {
			return {
				success: false,
				message: "Task not found",
			};
		}

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

		if (actorMemberId) {
			await db.activity.create({
				data: {
					type: "TASKS",
					title: "Task Assignees Updated",
					description: `Updated assignees for task "${existingTask.title}"`,
					workspaceId: existingTask.workspaceId,
					projectId: existingTask.projectId,
					taskId,
					memberId: actorMemberId,
				},
			});
		}

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

		return {
			success: true,
			message: "Task assignees updated successfully",
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
		const existingTask = await db.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return {
				success: false,
				message: "Task not found",
			};
		}

		let memberIdToUse = actorMemberId;
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

		await db.taskMember.deleteMany({ where: { taskId } });
		await db.mileStone.deleteMany({ where: { taskId } });
		await db.comment.deleteMany({ where: { taskId } });
		await db.resource.deleteMany({ where: { taskId } });
		await db.activity.deleteMany({ where: { taskId } });
		await db.task.delete({ where: { id: taskId } });

		// Create project activity record for task deletion
		await db.activity.create({
			data: {
				type: "PROJECTS",
				title: "Task Deleted",
				description: `Deleted task "${existingTask.title}"`,
				workspaceId: existingTask.workspaceId,
				projectId: existingTask.projectId,
				memberId: memberIdToUse,
			},
		});

		revalidatePath("/tasks");
		revalidatePath(`/projects/${existingTask.projectId}`);

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
	dueDate,
}: {
	taskId: string;
	title: string;
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
		const task = await db.task.findUnique({ where: { id: taskId } });
		if (!task) return { success: false, message: "Task not found" };

		const member = await db.member.findUnique({
			where: { userId_workspaceId: { userId, workspaceId } },
		});

		const milestone = await db.mileStone.create({
			data: {
				title: title.trim(),
				description: "",
				taskId,
				dueDate: dueDate || task.endPeriod,
				status: MileStoneStatus.NOT_STARTED,
				createdById: member?.id ?? userId,
			},
		});

		await db.activity.create({
			data: {
				type: "TASKS",
				title: "Milestone Created",
				description: `Added milestone "${title.trim()}" to this task`,
				workspaceId,
				projectId: task.projectId,
				taskId,
				memberId: member?.id,
			},
		});

		revalidatePath(`/tasks/${taskId}`);
		return {
			success: true,
			message: "Milestone added successfully",
			milestone,
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
		const milestone = await db.mileStone.update({
			where: { id: milestoneId },
			data: { status },
			include: { task: true },
		});

		const member = await db.member.findUnique({
			where: { userId_workspaceId: { userId, workspaceId } },
		});

		await db.activity.create({
			data: {
				type: "TASKS",
				title: "Milestone Updated",
				description: `Marked milestone "${milestone.title}" as ${status === MileStoneStatus.DONE ? "Completed" : "To Do"}`,
				workspaceId,
				projectId: milestone.task.projectId,
				taskId: milestone.taskId,
				memberId: member?.id,
			},
		});

		revalidatePath(`/tasks/${milestone.taskId}`);
		return { success: true, message: "Milestone updated", milestone };
	} catch (e: any) {
		console.error("Error updating milestone:", e);
		return { success: false, message: "Failed to update milestone" };
	}
};

export const deleteMilestone = async (milestoneId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	if (!workspaceId) return { success: false, message: "Unauthorized" };
	try {
		const milestone = await db.mileStone.findUnique({
			where: { id: milestoneId },
		});
		if (!milestone)
			return { success: false, message: "Milestone not found" };

		await db.mileStone.delete({ where: { id: milestoneId } });
		revalidatePath(`/tasks/${milestone.taskId}`);
		return { success: true, message: "Milestone deleted" };
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
			const member = await db.member.findUnique({
				where: { userId_workspaceId: { userId, workspaceId } },
			});
			if (!member) return { success: false, message: "Member not found" };

			const task = await db.task.findUnique({ where: { id: taskId } });
			if (!task) return { success: false, message: "Task not found" };

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

			revalidatePath(`/tasks/${taskId}`);
			revalidatePath(`/projects/${task.projectId}`);
			return { success: true, message: "Comment posted", comment };
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
			const updated = await db.comment.update({
				where: { id: commentId },
				data: { message: message.trim() },
				include: {
					member: {
						include: { user: true },
					},
				},
			});

			if (updated.taskId) revalidatePath(`/tasks/${updated.taskId}`);
			if (updated.projectId)
				revalidatePath(`/projects/${updated.projectId}`);
			return {
				success: true,
				message: "Comment updated",
				comment: updated,
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
