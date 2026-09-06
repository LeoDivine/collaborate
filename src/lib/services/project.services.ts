"use server";

import { auth } from "../../../auth";
import { ActivityType, MileStoneStatus, PriorityLevel, ProjectAccess, ProjectVisibility, Status, WorkspaceRoles } from "../../../generated/prisma/enums";
import { db } from "../db";
import type { ProjectMembers, Projects } from "../types";
import { triggerPusherEvent } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/events";
import { computeProjectAccess, ProjectAccessResult } from "@/lib/permissions/project-permissions";
import { formatLabel, formatPriority, formatStatus } from "@/lib/utils";

export const createProject = async ({
	values,
}: {
	values: {
		startDate: Date;
		dueDate: Date;
		priority: PriorityLevel;
		projectMembers: string[];
		projectLead: string;
		title: string;
		description: string;
		labels: string[];
		visibility?: ProjectVisibility;
		resources: {
			name: string;
			url: string;
		}[];
	};
}) => {
	console.log({ values });

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized or invalid session",
		};
	}

	if (values.dueDate < values.startDate) {
		return {
			success: false,
			message: "Due date cannot be before start date",
		};
	}

	try {
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: "Member not found in this workspace",
			};
		}

		const projectCreationProcess = await db.$transaction(async (tx) => {
			const project = await tx.project.create({
				data: {
					description: values.description,
					endPeriod: values.dueDate,
					startPeriod: values.startDate,
					title: values.title,
					workspaceId: workspaceId!,
					createdById: member.id,
					priority: values.priority,
					labels: (values.labels || []).map(formatLabel).filter(Boolean),
					visibility: values.visibility || ("PUBLIC" as ProjectVisibility),
				},
			});

			for (const r of values.resources) {
				await tx.resource.create({
					data: {
						name: r.name,
						url: r.url,
						workspaceId,
						projectId: project.id,
					},
				});
			}

			const memberIdsToAssign = Array.from(
				new Set([...values.projectMembers, member.id]),
			);

			await tx.projectMember.createMany({
				data: memberIdsToAssign.map((memberId) => ({
					projectId: project.id,
					memberId: memberId,
					projectRole:
						values.projectLead === memberId ||
						(!values.projectLead && memberId === member.id)
							? ("PROJECT_LEAD" as ProjectAccess)
							: ("CONTRIBUTOR" as ProjectAccess),
				})),
			});

			await tx.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Project Created",
					description: "created this project",
					workspaceId: workspaceId!,
					projectId: project.id,
					memberId: member.id,
				},
			});

			return {
				success: true,
				message: "Project created successfully",
				project,
			};
		});

		if (projectCreationProcess.success && projectCreationProcess.project) {
			const fullProject = await db.project.findUnique({
				where: { id: projectCreationProcess.project.id },
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
					resources: true,
					tasks: {
						include: {
							resources: true,
							milestones: true,
							createdBy: {
								include: {
									user: true,
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
						},
					},
					createdBy: {
						include: {
							user: true,
						},
					},
				},
			});

			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.PROJECT_CREATED,
				{ project: fullProject || projectCreationProcess.project, projectId: projectCreationProcess.project.id, workspaceId }
			);
		}

		return projectCreationProcess;
	} catch (e) {
		console.log("Something went wrong", e);
		return {
			success: false,
			message: "Something went wrong with creating project",
		};
	}
};

export const getProjectsByWorkspaceId = async (
	workspaceId: string,
	query?: string,
): Promise<{
	success: boolean;
	message: string;
	projects: Projects[];
	total: number;
}> => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace not found",
			projects: [],
			total: 0,
		};
	}

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
		currentMember?.role === WorkspaceRoles.OWNER ||
		currentMember?.role === WorkspaceRoles.ADMIN;

	const visibilityFilter =
		isWorkspaceAdmin || !currentMember
			? {}
			: {
					OR: [
						{ visibility: "PUBLIC" as ProjectVisibility },
						{ projectMembers: { some: { memberId: currentMember.id } } },
						{ createdById: currentMember.id },
					],
				};

	const projects = await db.project.findMany({
		where: {
			workspaceId,
			...visibilityFilter,
			...(query ?
				{
					title: {
						contains: query,
						mode: "insensitive",
					},
				}
			:	{}),
		},
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
			resources: true,
			tasks: {
				include: {
					resources: true,
					milestones: true,
					createdBy: {
						include: {
							user: true,
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
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	if (projects.length === 0) {
		return {
			success: false,
			message: "No projects found",
			projects: [],
			total: 0,
		};
	}

	return {
		success: true,
		message: "Projects fetched successfully",
		projects: projects as unknown as Projects[],
		total: projects.length,
	};
};

export const getProjectMembersByProjectId = async (
	projectId: string,
): Promise<{
	success: boolean;
	message: string;
	projectMembers: ProjectMembers[];
	total: number;
}> => {
	if (!projectId) {
		return {
			success: false,
			message: "Project not found",
			projectMembers: [],
			total: 0,
		};
	}

	const projectMembers = await db.projectMember.findMany({
		where: {
			projectId,
		},
		include: {
			member: {
				include: {
					user: true,
				},
			},
		},
		orderBy: {
			assignedAt: "desc",
		},
	});

	if (projectMembers.length === 0) {
		return {
			success: false,
			message: "No project members found",
			projectMembers: [],
			total: 0,
		};
	}

	return {
		success: true,
		message: "Project members fetched successfully",
		projectMembers: projectMembers as unknown as ProjectMembers[],
		total: projectMembers.length,
	};
};

export const getProjectById = async (id: string, workspaceId: string) => {
	const projectInfo = await db.project.findUnique({
		where: {
			id,
			AND: {
				workspaceId,
			},
		},
		include: {
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
			createdBy: {
				include: {
					user: true,
				},
			},
			projectMembers: {
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			},
			resources: true,
			tasks: {
				include: {
					resources: true,
					createdBy: {
						include: {
							user: true,
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
				},
				orderBy: {
					createdAt: "desc",
				},
			},
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
				take: 20,
			},
		},
	});
	if (!projectInfo) {
		return {
			success: false,
			message: "This project does not exist",
		};
	}

	if (projectInfo.visibility === ("PRIVATE" as ProjectVisibility)) {
		const session = await auth();
		const userId = session?.user?.id;
		if (userId) {
			const member = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
			});
			const isWorkspaceAdmin =
				member?.role === WorkspaceRoles.OWNER ||
				member?.role === WorkspaceRoles.ADMIN;
			const isProjectMember = projectInfo.projectMembers.some(
				(pm) => pm.memberId === member?.id,
			);
			const isCreator = projectInfo.createdById === member?.id;

			if (!isWorkspaceAdmin && !isProjectMember && !isCreator) {
				return {
					success: false,
					message: "You do not have permission to view this private project",
				};
			}
		}
	}

	return {
		success: true,
		message: "Project information found",
		projectInfo,
	};
};

export const resolveProjectMemberAndAccess = async (
	userId: string,
	workspaceId: string,
	projectId: string,
): Promise<{
	member: any;
	project: any;
	access: ProjectAccessResult;
} | null> => {
	const member = await db.member.findUnique({
		where: {
			userId_workspaceId: {
				userId,
				workspaceId,
			},
		},
	});

	if (!member) return null;

	const project = await db.project.findUnique({
		where: {
			id: projectId,
			workspaceId,
		},
		include: {
			projectMembers: true,
		},
	});

	if (!project) return null;

	const projectMember = project.projectMembers.find(
		(pm) => pm.memberId === member.id,
	);

	const access = computeProjectAccess({
		workspaceRole: member.role,
		projectRole: projectMember?.projectRole,
		isProjectCreator: project.createdById === member.id,
	});

	return { member, project, access };
};

const checkProjectEditPermission = async (
	userId: string,
	workspaceId: string,
	projectId: string,
): Promise<{ allowed: boolean; member?: any; access?: ProjectAccessResult; message?: string }> => {
	const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, projectId);
	if (!resolved) {
		return {
			allowed: false,
			message: "Project not found or unauthorized",
		};
	}

	if (!resolved.access.canConfigureProject) {
		return {
			allowed: false,
			member: resolved.member,
			access: resolved.access,
			message: "Only project leads, creator, and workspace admins can configure this project",
		};
	}

	return {
		allowed: true,
		member: resolved.member,
		access: resolved.access,
	};
};

export const addProjectResource = async ({
	projectId,
	name,
	url,
}: {
	projectId: string;
	name: string;
	url: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized or invalid session",
		};
	}

	if (!name.trim() || !url.trim()) {
		return {
			success: false,
			message: "Resource name and link are required",
		};
	}

	try {
		const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, projectId);
		if (!resolved || !resolved.access.canManageResources) {
			return {
				success: false,
				message: "You do not have permission to add resources to this project",
			};
		}

		const member = resolved.member;

		const resource = await db.resource.create({
			data: {
				name: name.trim(),
				url: url.trim(),
				projectId,
				workspaceId,
			},
		});

		let activity = null;
		if (member) {
			activity = await db.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Added",
					description: `added resource "${name.trim()}" to this project`,
					workspaceId,
					projectId,
					memberId: member.id,
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

		if (activity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getProjectChannel(projectId),
			PUSHER_EVENTS.RESOURCE_ADDED,
			{ projectId, resource }
		);

		return {
			success: true,
			message: "Resource added successfully",
			resource,
			activity,
		};
	} catch (e: any) {
		console.error("Failed to add resource", e);
		return {
			success: false,
			message: e?.message || "Failed to add resource",
		};
	}
};

export const deleteProjectResource = async (resourceId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	try {
		const resource = await db.resource.findUnique({
			where: { id: resourceId },
		});

		if (!resource || resource.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Resource not found or unauthorized",
			};
		}

		const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, resource.projectId);
		if (!resolved || !resolved.access.canManageResources) {
			return {
				success: false,
				message: "You do not have permission to delete resources from this project",
			};
		}

		const member = resolved.member;

		await db.resource.delete({
			where: {
				id: resourceId,
				workspaceId,
			},
		});

		let activity = null;
		if (member) {
			activity = await db.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Removed",
					description: `removed resource "${resource.name}"`,
					workspaceId,
					projectId: resource.projectId,
					taskId: resource.taskId || undefined,
					memberId: member.id,
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

		if (activity && resource.projectId) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(resource.projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (resource.projectId) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getProjectChannel(resource.projectId),
				PUSHER_EVENTS.RESOURCE_DELETED,
				{ projectId: resource.projectId, resourceId }
			);
		}

		return {
			success: true,
			message: "Resource deleted successfully",
			activity,
		};
	} catch (e: any) {
		console.error("Failed to delete resource", e);
		return {
			success: false,
			message: e?.message || "Failed to delete resource",
		};
	}
};

export const updateProjectResource = async ({
	resourceId,
	name,
	url,
}: {
	resourceId: string;
	name: string;
	url: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	if (!name.trim() || !url.trim()) {
		return {
			success: false,
			message: "Resource name and link are required",
		};
	}

	try {
		const resource = await db.resource.findUnique({
			where: { id: resourceId },
		});

		if (!resource || resource.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Resource not found or unauthorized",
			};
		}

		const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, resource.projectId);
		if (!resolved || !resolved.access.canManageResources) {
			return {
				success: false,
				message: "You do not have permission to update resources in this project",
			};
		}

		const member = resolved.member;

		const updatedResource = await db.resource.update({
			where: {
				id: resourceId,
				workspaceId,
			},
			data: {
				name: name.trim(),
				url: url.trim(),
			},
		});

		let activity = null;
		if (member) {
			activity = await db.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Updated",
					description: `updated resource "${name.trim()}" in this project`,
					workspaceId,
					projectId: updatedResource.projectId,
					memberId: member.id,
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

		if (activity && updatedResource.projectId) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(updatedResource.projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (updatedResource.projectId) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getProjectChannel(updatedResource.projectId),
				PUSHER_EVENTS.RESOURCE_UPDATED,
				{ projectId: updatedResource.projectId, resource: updatedResource }
			);
		}

		return {
			success: true,
			message: "Resource updated successfully",
			resource: updatedResource,
			activity,
		};
	} catch (e) {
		console.error("Failed to update resource", e);
		return {
			success: false,
			message: "Failed to update resource",
		};
	}
};

export const updateProjectDetails = async ({
	projectId,
	values,
}: {
	projectId: string;
	values: {
		title?: string;
		description?: string;
		priority?: PriorityLevel;
		status?: Status;
		startDate?: Date;
		dueDate?: Date;
		labels?: string[];
	};
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	if (values.startDate && values.dueDate && values.dueDate < values.startDate) {
		return {
			success: false,
			message: "Due date cannot be before start date",
		};
	}

	try {
		const permCheck = await checkProjectEditPermission(userId, workspaceId, projectId);
		if (!permCheck.allowed) {
			return {
				success: false,
				message: permCheck.message || "You do not have permission to update this project",
			};
		}

		const member = permCheck.member;

		const result = await db.$transaction(async (tx) => {
			const updatedProject = await tx.project.update({
				where: {
					id: projectId,
					workspaceId,
				},
				data: {
					...(values.title !== undefined && { title: values.title.trim() }),
					...(values.description !== undefined && { description: values.description }),
					...(values.priority !== undefined && { priority: values.priority }),
					...(values.status !== undefined && { status: values.status }),
					...(values.startDate !== undefined && { startPeriod: values.startDate }),
					...(values.dueDate !== undefined && { endPeriod: values.dueDate }),
					...(values.labels !== undefined && { labels: values.labels.map(formatLabel).filter(Boolean) }),
				},
			});

			const changes: string[] = [];
			if (values.title !== undefined) changes.push(`updated title of this project to "${values.title.trim()}"`);
			if (values.status !== undefined) changes.push(`changed status of this project to ${formatStatus(values.status)}`);
			if (values.priority !== undefined) changes.push(`changed priority of this project to ${formatPriority(values.priority)}`);
			if (values.description !== undefined) changes.push("updated description of this project");
			if (values.startDate !== undefined) changes.push("updated start date of this project");
			if (values.dueDate !== undefined) changes.push("updated due date of this project");
			if (values.labels !== undefined) changes.push("updated labels of this project");

			if (values.status === Status.COMPLETED) {
				await tx.task.updateMany({
					where: { projectId },
					data: { status: Status.COMPLETED },
				});

				await tx.mileStone.updateMany({
					where: {
						task: {
							projectId,
						},
					},
					data: {
						status: MileStoneStatus.DONE,
						...(member?.id && { completedById: member.id }),
					},
				});
				changes.push("marked all associated tasks and milestones as completed");
			} else if (values.status === Status.TODO || values.status === Status.IN_PROGRESS) {
				await tx.task.updateMany({
					where: { projectId },
					data: { status: Status.IN_PROGRESS },
				});

				await tx.mileStone.updateMany({
					where: {
						task: {
							projectId,
						},
					},
					data: {
						status: MileStoneStatus.IN_PROGRESS,
						completedById: null,
					},
				});
				changes.push("set all associated tasks and milestones to in progress");
			}

			const activityDescription = changes.length > 0 ? changes.join(", ") : "updated this project";

			const activity = await tx.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Project Updated",
					description: activityDescription,
					workspaceId,
					projectId: updatedProject.id,
					memberId: member?.id,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});

			return { updatedProject, activity };
		});

		let updatedTasks = undefined;
		if (
			values.status === Status.COMPLETED ||
			values.status === Status.TODO ||
			values.status === Status.IN_PROGRESS
		) {
			updatedTasks = await db.task.findMany({
				where: { projectId },
				include: {
					milestones: true,
					taskMembers: { include: { member: { include: { user: true } } } },
					createdBy: { include: { user: true } },
					resources: true,
				},
				orderBy: { createdAt: "desc" },
			});
		}

		if (result.activity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: result.activity }
			);
		}

		await triggerPusherEvent(
			[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
			PUSHER_EVENTS.PROJECT_UPDATED,
			{ projectId, updates: values, project: result.updatedProject, tasks: updatedTasks }
		);

		return {
			success: true,
			message: "Project updated successfully",
			project: result.updatedProject,
			tasks: updatedTasks,
			activity: result.activity,
		};
	} catch (e) {
		console.error("Failed to update project details", e);
		return {
			success: false,
			message: "Failed to update project details",
		};
	}
};

export const updateProjectMembers = async ({
	projectId,
	projectMembers,
	projectLeadId,
}: {
	projectId: string;
	projectMembers: string[];
	projectLeadId?: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;
	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	try {
		const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, projectId);
		if (!resolved || !resolved.access.canManageMembers) {
			return {
				success: false,
				message: "You do not have permission to update project members",
			};
		}

		const member = resolved.member;

		const createdActivities: any[] = [];

		await db.$transaction(async (tx) => {
			const currentProject = await tx.project.findUnique({
				where: {
					id: projectId,
					workspaceId,
				},
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
			});

			if (!currentProject) {
				throw new Error("Project not found");
			}

			const currentMemberIds = currentProject.projectMembers.map((pm) => pm.memberId);
			const currentLead = currentProject.projectMembers.find((pm) => pm.projectRole === ProjectAccess.PROJECT_LEAD);
			const currentLeadId = currentLead?.memberId;

			const isLeadChanged = projectLeadId !== undefined && projectLeadId !== currentLeadId;

			const addedMemberIds = projectMembers.filter((id) => !currentMemberIds.includes(id));
			const removedMemberIds = currentMemberIds.filter((id) => !projectMembers.includes(id));

			if (removedMemberIds.length > 0) {
				await tx.projectMember.deleteMany({
					where: {
						projectId,
						memberId: {
							in: removedMemberIds,
						},
					},
				});
			}

			if (addedMemberIds.length > 0) {
				await tx.projectMember.createMany({
					data: addedMemberIds.map((memberId) => ({
						projectId,
						memberId,
						projectRole: memberId === projectLeadId ? ProjectAccess.PROJECT_LEAD : ProjectAccess.CONTRIBUTOR,
					})),
				});
			}

			if (projectLeadId && currentLeadId !== projectLeadId) {
				if (currentLeadId) {
					await tx.projectMember.updateMany({
						where: {
							projectId,
							memberId: currentLeadId,
						},
						data: {
							projectRole: ProjectAccess.CONTRIBUTOR,
						},
					});
				}

				await tx.projectMember.updateMany({
					where: {
						projectId,
						memberId: projectLeadId,
					},
					data: {
						projectRole: ProjectAccess.PROJECT_LEAD,
					},
				});
			}

			if (isLeadChanged) {
				let leadName = "Unknown";
				if (projectLeadId) {
					const newLeadMember = await tx.member.findUnique({
						where: { id: projectLeadId },
						include: { user: true },
					});
					leadName = newLeadMember?.user.fullName || newLeadMember?.user.userName || "Unknown";
				}
				const act = await tx.activity.create({
					data: {
						type: ActivityType.PROJECTS,
						title: "Project Lead Assigned",
						description: `assigned ${leadName} as the project lead`,
						workspaceId,
						projectId,
						memberId: member?.id,
					},
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				});
				createdActivities.push(act);
			}

			if (addedMemberIds.length > 0) {
				const addedMembers = await tx.member.findMany({
					where: { id: { in: addedMemberIds } },
					include: { user: true },
				});
				const addedNames = addedMembers.map((m) => m.user.fullName || m.user.userName).join(", ");
				const act = await tx.activity.create({
					data: {
						type: ActivityType.PROJECTS,
						title: "Members Added",
						description: `added ${addedNames || addedMemberIds.length + " member(s)"} to this project`,
						workspaceId,
						projectId,
						memberId: member?.id,
					},
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				});
				createdActivities.push(act);
			}

			if (removedMemberIds.length > 0) {
				const removedMembers = currentProject.projectMembers.filter((pm) => removedMemberIds.includes(pm.memberId));
				const removedNames = removedMembers.map((pm) => pm.member.user.fullName || pm.member.user.userName).join(", ");
				const act = await tx.activity.create({
					data: {
						type: ActivityType.PROJECTS,
						title: "Members Removed",
						description: `removed ${removedNames || removedMemberIds.length + " member(s)"} from this project`,
						workspaceId,
						projectId,
						memberId: member?.id,
					},
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				});
				createdActivities.push(act);
			}
		});

		for (const act of createdActivities) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity: act }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getProjectChannel(projectId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ projectId, memberIds: projectMembers, leadId: projectLeadId }
		);

		return {
			success: true,
			message: "Project members updated successfully",
			activities: createdActivities,
		};
	} catch (e) {
		console.error("Failed to update project members", e);
		return {
			success: false,
			message: "Failed to update project members",
		};
	}
};

export const addProjectComment = async ({
	projectId,
	message,
	replyCommentId,
}: {
	projectId: string;
	message: string;
	replyCommentId?: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized or invalid session",
		};
	}

	if (!message.trim()) {
		return {
			success: false,
			message: "Comment message cannot be empty",
		};
	}

	try {
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
			include: {
				user: true,
			},
		});

		if (!member) {
			return {
				success: false,
				message: "Member not found in workspace",
			};
		}

		const comment = await db.comment.create({
			data: {
				message: message.trim(),
				projectId,
				workspaceId,
				memberId: member.id,
				...(replyCommentId && { replyCommentId }),
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		const activity = await db.activity.create({
			data: {
				type: ActivityType.PROJECTS,
				title: replyCommentId ? "Reply Added" : "Comment Added",
				description: replyCommentId ? "replied to a comment on this project" : "commented on this project",
				workspaceId,
				projectId,
				memberId: member.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		// Broadcast real-time comment creation and activity to all project and workspace viewers
		if (activity) {
			await triggerPusherEvent(
				[PUSHER_CHANNELS.getProjectChannel(projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getProjectChannel(projectId),
			PUSHER_EVENTS.COMMENT_CREATED,
			{ comment }
		);

		return {
			success: true,
			message: replyCommentId ? "Reply added successfully" : "Comment added successfully",
			comment,
			activity,
		};
	} catch (e) {
		console.error("Failed to add comment", e);
		return {
			success: false,
			message: "Failed to add comment",
		};
	}
};

const getAllDescendantCommentIds = async (
	tx: any,
	parentIds: string[],
): Promise<string[]> => {
	if (parentIds.length === 0) return [];
	const children = await tx.comment.findMany({
		where: { replyCommentId: { in: parentIds } },
		select: { id: true },
	});
	const childIds = children.map((c: { id: string }) => c.id);
	if (childIds.length === 0) return [];
	const grandChildIds = await getAllDescendantCommentIds(tx, childIds);
	return [...childIds, ...grandChildIds];
};

export const deleteProjectComment = async (commentId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	try {
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: "Member not found",
			};
		}

		const comment = await db.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment || comment.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Comment not found or unauthorized",
			};
		}

		if (comment.memberId !== member.id && member.role === "MEMBER") {
			return {
				success: false,
				message: "You can only delete your own comments",
			};
		}

		const activity = await db.$transaction(async (tx) => {
			const descendantIds = await getAllDescendantCommentIds(tx, [
				commentId,
			]);
			if (descendantIds.length > 0) {
				await tx.comment.deleteMany({
					where: { id: { in: descendantIds } },
				});
			}

			await tx.comment.delete({
				where: { id: commentId },
			});

			if (comment.projectId) {
				const act = await tx.activity.create({
					data: {
						type: ActivityType.PROJECTS,
						title: "Comment Deleted",
						description: "deleted a comment from this project",
						workspaceId,
						projectId: comment.projectId,
						memberId: member.id,
					},
					include: {
						member: {
							include: {
								user: true,
							},
						},
					},
				});
				return act;
			}
			return null;
		});

		// Broadcast real-time comment deletion and activity
		if (comment.projectId) {
			if (activity) {
				await triggerPusherEvent(
					[PUSHER_CHANNELS.getProjectChannel(comment.projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
					PUSHER_EVENTS.ACTIVITY_CREATED,
					{ activity }
				);
			}

			await triggerPusherEvent(
				PUSHER_CHANNELS.getProjectChannel(comment.projectId),
				PUSHER_EVENTS.COMMENT_DELETED,
				{ commentId }
			);
		}

		return {
			success: true,
			message: "Comment deleted successfully",
			activity,
		};
	} catch (e) {
		console.error("Failed to delete comment", e);
		return {
			success: false,
			message: "Failed to delete comment",
		};
	}
};

export const updateProjectComment = async ({
	commentId,
	message,
}: {
	commentId: string;
	message: string;
}) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	if (!message.trim()) {
		return {
			success: false,
			message: "Comment cannot be empty",
		};
	}

	try {
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: "Member not found",
			};
		}

		const comment = await db.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment || comment.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Comment not found or unauthorized",
			};
		}

		if (comment.memberId !== member.id && member.role === "MEMBER") {
			return {
				success: false,
				message: "You can only edit your own comments",
			};
		}

		const updatedComment = await db.comment.update({
			where: { id: commentId },
			data: {
				message: message.trim(),
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		let activity = null;
		if (updatedComment.projectId) {
			activity = await db.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Comment Updated",
					description: "updated a comment in this project",
					workspaceId,
					projectId: updatedComment.projectId,
					memberId: member.id,
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

		// Broadcast real-time comment update and activity
		if (updatedComment.projectId) {
			if (activity) {
				await triggerPusherEvent(
					[PUSHER_CHANNELS.getProjectChannel(updatedComment.projectId), PUSHER_CHANNELS.getWorkspaceChannel(workspaceId)],
					PUSHER_EVENTS.ACTIVITY_CREATED,
					{ activity }
				);
			}

			await triggerPusherEvent(
				PUSHER_CHANNELS.getProjectChannel(updatedComment.projectId),
				PUSHER_EVENTS.COMMENT_UPDATED,
				{ commentId, message: updatedComment.message, comment: updatedComment }
			);
		}

		return {
			success: true,
			message: "Comment updated successfully",
			comment: updatedComment,
			activity,
		};
	} catch (e) {
		console.error("Failed to update comment", e);
		return {
			success: false,
			message: "Failed to update comment",
		};
	}
};

export const deleteProject = async (projectId: string) => {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	if (!workspaceId || !userId) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}

	try {
		const resolved = await resolveProjectMemberAndAccess(userId, workspaceId, projectId);
		if (!resolved || !resolved.access.canDeleteProject) {
			return {
				success: false,
				message: "You do not have permission to delete this project",
			};
		}

		const project = await db.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Project not found or unauthorized",
			};
		}

		await db.$transaction([
			db.taskMember.deleteMany({ where: { task: { projectId } } }),
			db.mileStone.deleteMany({ where: { task: { projectId } } }),
			db.comment.deleteMany({ where: { projectId } }),
			db.resource.deleteMany({ where: { projectId } }),
			db.projectMember.deleteMany({ where: { projectId } }),
			db.task.deleteMany({ where: { projectId } }),
			db.activity.deleteMany({ where: { projectId } }),
			db.project.delete({ where: { id: projectId, workspaceId } }),
		]);

		await triggerPusherEvent(
			[PUSHER_CHANNELS.getWorkspaceChannel(workspaceId), PUSHER_CHANNELS.getProjectChannel(projectId)],
			PUSHER_EVENTS.PROJECT_DELETED,
			{ projectId, workspaceId }
		);

		return {
			success: true,
			message: "Project deleted successfully",
		};
	} catch (e) {
		console.error("Failed to delete project", e);
		return {
			success: false,
			message: "Failed to delete project",
		};
	}
};




