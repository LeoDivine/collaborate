"use server";

import { MemberStatus, WorkspaceRoles } from "../../../generated/prisma/enums";
import { auth } from "../../../auth";
import { db } from "../db";
import { revalidatePath } from "next/cache";

export const getMembersByUserID = async (userId: string) => {
	if (!userId) {
		return {
			members: [],
		};
	}
	const members = await db.member.findMany({
		where: {
			userId,
		},
		include: {
			workspace: {
				include: {
					_count: {
						select: {
							members: true,
							projects: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return {
		members,
	};
};

export const getMembersByWorkspaceId = async (
	page: number,
	limit: number,
	workspaceId: string,
	query?: string,
) => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
			members: [],
			total: 0,
		};
	}

	const trimmedQuery = query?.trim();

	const whereClause = {
		workspaceId,
		...(trimmedQuery
			? {
					OR: [
						{
							user: {
								fullName: {
									contains: trimmedQuery,
									mode: "insensitive" as const,
								},
							},
						},
						{
							user: {
								email: {
									contains: trimmedQuery,
									mode: "insensitive" as const,
								},
							},
						},
						{
							user: {
								userName: {
									contains: trimmedQuery,
									mode: "insensitive" as const,
								},
							},
						},
					],
				}
			: {}),
	};

	const [members, total] = await Promise.all([
		db.member.findMany({
			take: limit,
			skip: (page - 1) * limit,
			include: {
				user: true,
			},
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
		}),
		db.member.count({
			where: whereClause,
		}),
	]);

	return {
		success: true,
		message: members.length === 0 ? "No members found" : "Members fetched successfully",
		members,
		total,
	};
};

export const createMemberForWorkspace = async (
	userId: string,
	workspaceId: string,
) => {
	try {
		const member = await db.member.create({
			data: {
				role: "MEMBER",
				workspaceId: workspaceId,
				userId,
			},
		});
		return {
			success: true,
			member,
			message: "Member created successfully",
		};
	} catch (e: any) {
		return {
			success: false,
			message: "Something went wrong with creating workspace",
		};
	}
};

export const updateMemberRole = async (
	memberId: string,
	role: WorkspaceRoles,
) => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const targetMember = await db.member.findUnique({
			where: { id: memberId },
		});

		if (!targetMember) {
			return { success: false, message: "Member not found" };
		}

		if (targetMember.role === "OWNER") {
			return { success: false, message: "Cannot modify workspace Owner role" };
		}

		const currentUserMember = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId: session.user.id,
					workspaceId: targetMember.workspaceId,
				},
			},
		});

		if (
			!currentUserMember ||
			(currentUserMember.role !== "OWNER" && currentUserMember.role !== "ADMIN")
		) {
			return {
				success: false,
				message: "You do not have permission to update member roles",
			};
		}

		const updatedMember = await db.member.update({
			where: { id: memberId },
			data: { role },
		});

		revalidatePath("/members");
		return {
			success: true,
			message: `Member role updated to ${role}`,
			member: updatedMember,
		};
	} catch (e: any) {
		console.error("Error updating member role:", e);
		return {
			success: false,
			message: e.message || "Failed to update member role",
		};
	}
};

export const updateMemberStatus = async (
	memberId: string,
	status: MemberStatus,
) => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const targetMember = await db.member.findUnique({
			where: { id: memberId },
		});

		if (!targetMember) {
			return { success: false, message: "Member not found" };
		}

		if (targetMember.role === "OWNER") {
			return { success: false, message: "Cannot modify workspace Owner status" };
		}

		const currentUserMember = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId: session.user.id,
					workspaceId: targetMember.workspaceId,
				},
			},
		});

		if (
			!currentUserMember ||
			(currentUserMember.role !== "OWNER" && currentUserMember.role !== "ADMIN")
		) {
			return {
				success: false,
				message: "You do not have permission to update member status",
			};
		}

		const updatedMember = await db.member.update({
			where: { id: memberId },
			data: { status },
		});

		revalidatePath("/members");
		return {
			success: true,
			message: `Member status set to ${status}`,
			member: updatedMember,
		};
	} catch (e: any) {
		console.error("Error updating member status:", e);
		return {
			success: false,
			message: e.message || "Failed to update member status",
		};
	}
};

export const removeMember = async (memberId: string) => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const targetMember = await db.member.findUnique({
			where: { id: memberId },
		});

		if (!targetMember) {
			return { success: false, message: "Member not found" };
		}

		if (targetMember.role === "OWNER") {
			return { success: false, message: "Cannot remove workspace Owner" };
		}

		const currentUserMember = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId: session.user.id,
					workspaceId: targetMember.workspaceId,
				},
			},
		});

		if (
			!currentUserMember ||
			(currentUserMember.role !== "OWNER" && currentUserMember.role !== "ADMIN")
		) {
			return {
				success: false,
				message: "You do not have permission to remove members",
			};
		}

		await db.member.delete({
			where: { id: memberId },
		});

		revalidatePath("/members");
		return {
			success: true,
			message: "Member removed from workspace successfully",
		};
	} catch (e: any) {
		console.error("Error removing member:", e);
		return {
			success: false,
			message: e.message || "Failed to remove member",
		};
	}
};

export const getMemberDetails = async (memberId: string) => {
	try {
		const member = await db.member.findUnique({
			where: { id: memberId },
			include: {
				user: true,
				workspace: true,
				team: true,
				_count: {
					select: {
						createdTasks: true,
						createdProjects: true,
						taskMembers: true,
						projectMembers: true,
					},
				},
			},
		});

		if (!member) {
			return { success: false, message: "Member not found" };
		}

		return {
			success: true,
			member,
		};
	} catch (e: any) {
		return {
			success: false,
			message: e.message || "Failed to fetch member details",
		};
	}
};

