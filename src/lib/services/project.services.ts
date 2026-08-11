"use server";

import { auth } from "../../../auth";
import { ActivityType, PriorityLevel, ProjectAccess, Status } from "../../../generated/prisma/enums";
import { db } from "../db";
import type { ProjectMembers, Projects } from "../types";

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
					labels: values.labels,
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

			await tx.projectMember.createMany({
				data: values.projectMembers.map((memberId) => ({
					projectId: project.id,
					memberId: memberId,
					projectRole:
						values.projectLead === memberId ?
							("PROJECT_LEAD" as ProjectAccess)
						:	("CONTRIBUTOR" as ProjectAccess),
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

	const projects = await db.project.findMany({
		where: {
			workspaceId,
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
			tasks: true,
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
			createdBy: true,
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
			tasks: true,
			activities: {
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
				take: 20,
			},
		},
	});
	if (!id) {
		return {
			success: false,
			message: "This project does not exist",
		};
	}

	return {
		success: true,
		message: "Project information found",
		projectInfo,
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
		const result = await db.$transaction(async (tx) => {
			const resource = await tx.resource.create({
				data: {
					name: name.trim(),
					url: url.trim(),
					projectId,
					workspaceId,
				},
			});

			const member = await tx.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
			});

			const activity = await tx.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Added",
					description: `added resource "${name.trim()}" to this project`,
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

			return { resource, activity };
		});

		return {
			success: true,
			message: "Resource added successfully",
			resource: result.resource,
			activity: result.activity,
		};
	} catch (e) {
		console.error("Failed to add resource", e);
		return {
			success: false,
			message: "Failed to add resource",
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
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		const result = await db.$transaction(async (tx) => {
			const resource = await tx.resource.findUnique({
				where: { id: resourceId },
			});

			if (!resource || resource.workspaceId !== workspaceId) {
				return null;
			}

			await tx.resource.delete({
				where: {
					id: resourceId,
					workspaceId,
				},
			});

			const activity = await tx.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Removed",
					description: `removed resource "${resource.name}" from this project`,
					workspaceId,
					projectId: resource.projectId,
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

			return activity;
		});

		if (!result) {
			return {
				success: false,
				message: "Resource not found or unauthorized",
			};
		}

		return {
			success: true,
			message: "Resource deleted successfully",
			activity: result,
		};
	} catch (e) {
		console.error("Failed to delete resource", e);
		return {
			success: false,
			message: "Failed to delete resource",
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
		const result = await db.$transaction(async (tx) => {
			const updatedResource = await tx.resource.update({
				where: {
					id: resourceId,
					workspaceId,
				},
				data: {
					name: name.trim(),
					url: url.trim(),
				},
			});

			const member = await tx.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
			});

			const activity = await tx.activity.create({
				data: {
					type: ActivityType.PROJECTS,
					title: "Resource Updated",
					description: `updated resource "${name.trim()}" in this project`,
					workspaceId,
					projectId: updatedResource.projectId,
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

			return { updatedResource, activity };
		});

		return {
			success: true,
			message: "Resource updated successfully",
			resource: result.updatedResource,
			activity: result.activity,
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
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

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
					...(values.labels !== undefined && { labels: values.labels }),
				},
			});

			const changes: string[] = [];
			if (values.title !== undefined) changes.push(`updated title of this project to "${values.title.trim()}"`);
			if (values.status !== undefined) changes.push(`changed status of this project to ${values.status}`);
			if (values.priority !== undefined) changes.push(`changed priority of this project to ${values.priority}`);
			if (values.description !== undefined) changes.push("updated description of this project");
			if (values.startDate !== undefined) changes.push("updated start date of this project");
			if (values.dueDate !== undefined) changes.push("updated due date of this project");
			if (values.labels !== undefined) changes.push("updated labels of this project");

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

		return {
			success: true,
			message: "Project updated successfully",
			project: result.updatedProject,
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
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		const existingProjectMembers = await db.projectMember.findMany({
			where: { projectId },
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		const previousLeadRecord = existingProjectMembers.find(
			(pm) => pm.projectRole === ("PROJECT_LEAD" as ProjectAccess)
		);
		const previousLeadId = previousLeadRecord?.memberId;
		const previousMemberIds = existingProjectMembers.map((pm) => pm.memberId);

		const isLeadChanged = projectLeadId !== previousLeadId;
		const addedMemberIds = projectMembers.filter((id) => !previousMemberIds.includes(id));
		const removedMemberIds = previousMemberIds.filter((id) => !projectMembers.includes(id));

		const createdActivities: any[] = [];

		await db.$transaction(async (tx) => {
			await tx.projectMember.deleteMany({
				where: {
					projectId,
				},
			});

			if (projectMembers.length > 0) {
				await tx.projectMember.createMany({
					data: projectMembers.map((memberId) => ({
						projectId,
						memberId,
						projectRole:
							projectLeadId === memberId ?
								("PROJECT_LEAD" as ProjectAccess)
							:	("CONTRIBUTOR" as ProjectAccess),
					})),
				});
			}

			if (isLeadChanged) {
				if (projectLeadId) {
					let leadMember = existingProjectMembers.find((pm) => pm.memberId === projectLeadId)?.member;
					if (!leadMember) {
						const fetched = await tx.member.findUnique({
							where: { id: projectLeadId },
							include: { user: true },
						});
						if (fetched) leadMember = fetched;
					}
					const leadName = leadMember?.user?.fullName || leadMember?.user?.userName || "a member";
					const act = await tx.activity.create({
						data: {
							type: ActivityType.PROJECTS,
							title: "Project Lead Changed",
							description: `changed project lead of this project to ${leadName}`,
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
				} else if (previousLeadId) {
					const act = await tx.activity.create({
						data: {
							type: ActivityType.PROJECTS,
							title: "Project Lead Removed",
							description: "unassigned project lead of this project",
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
			}

			if (addedMemberIds.length > 0) {
				const addedMembers = await tx.member.findMany({
					where: { id: { in: addedMemberIds } },
					include: { user: true },
				});
				const addedNames = addedMembers
					.map((m) => m.user.fullName || m.user.userName)
					.join(", ");
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
				const removedNames = existingProjectMembers
					.filter((pm) => removedMemberIds.includes(pm.memberId))
					.map((pm) => pm.member.user.fullName || pm.member.user.userName)
					.join(", ");
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

			if (!isLeadChanged && addedMemberIds.length === 0 && removedMemberIds.length === 0) {
				const act = await tx.activity.create({
					data: {
						type: ActivityType.PROJECTS,
						title: "Project Members Updated",
						description: `updated members of this project (${projectMembers.length} member${projectMembers.length === 1 ? "" : "s"})`,
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
}: {
	projectId: string;
	message: string;
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
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		return {
			success: true,
			message: "Comment added successfully",
			comment,
		};
	} catch (e) {
		console.error("Failed to add comment", e);
		return {
			success: false,
			message: "Failed to add comment",
		};
	}
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

		return {
			success: true,
			message: "Comment updated successfully",
			comment: updatedComment,
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
		const project = await db.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.workspaceId !== workspaceId) {
			return {
				success: false,
				message: "Project not found or unauthorized",
			};
		}

		await db.$transaction(async (tx) => {
			const tasks = await tx.task.findMany({
				where: { projectId, workspaceId },
				select: { id: true },
			});
			const taskIds = tasks.map((t) => t.id);

			if (taskIds.length > 0) {
				await tx.taskMember.deleteMany({
					where: { taskId: { in: taskIds } },
				});
				await tx.mileStone.deleteMany({
					where: { taskId: { in: taskIds } },
				});
			}

			await tx.comment.deleteMany({
				where: { projectId, workspaceId },
			});
			await tx.resource.deleteMany({
				where: { projectId, workspaceId },
			});
			await tx.projectMember.deleteMany({
				where: { projectId },
			});
			await tx.task.deleteMany({
				where: { projectId, workspaceId },
			});
			await tx.activity.deleteMany({
				where: { projectId, workspaceId },
			});
			await tx.project.delete({
				where: { id: projectId, workspaceId },
			});
		});

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




