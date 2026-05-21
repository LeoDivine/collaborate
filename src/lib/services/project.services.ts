"use server";

import { auth } from "../../../auth";
import { PriorityLevel, ProjectAccess } from "../../../generated/prisma/enums";
import { db } from "../db";

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
					Labels: values.labels,
				},
			});

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
) => {
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
			tasks: {
				select: {
					id: true,
					status: true,
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
		projects,
		total: projects.length,
	};
};
