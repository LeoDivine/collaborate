"use server";

import { MemberStatus, WorkspaceRoles } from "../../../generated/prisma/enums";
import { auth } from "../../../auth";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/events";
import MemberDeactivatedEmail from "@/components/email-templates/member-deactivated-email";
import MemberActivatedEmail from "@/components/email-templates/member-activated-email";
import React from "react";
import { Resend } from "resend";

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
		// Prevent adding an existing member to the same workspace
		const existingMember = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
		});

		if (existingMember) {
			if (existingMember.status === "INACTIVE") {
				return {
					success: false,
					alreadyMember: true,
					isDeactivated: true,
					message:
						"Your membership in this workspace has been deactivated. Please contact the workspace administrator.",
				};
			}
			return {
				success: false,
				alreadyMember: true,
				message: "User is already a member of this workspace",
			};
		}

		const member = await db.member.create({
			data: {
				role: "MEMBER",
				workspaceId: workspaceId,
				userId,
			},
			include: {
				user: true,
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.WORKSPACE_MEMBER_JOINED,
			{
				member,
				workspaceId,
			},
		);

		return {
			success: true,
			member,
			message: "Member created successfully",
		};
	} catch (e: any) {
		return {
			success: false,
			message: "Something went wrong with creating workspace member",
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
	reason?: string,
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
			include: {
				user: true,
				workspace: true,
			},
		});

		// When a member is deactivated, send custom deactivation email
		if (status === "INACTIVE" && updatedMember.user?.email) {
			try {
				const resend = new Resend(process.env.RESEND_API_KEY);
				const senderEmail =
					process.env.SENDER_EMAIL || "notifications@collaborate.app";
				const workspaceName = updatedMember.workspace?.name || "Workspace";

				await resend.emails.send({
					from: `Collaborate <${senderEmail}>`,
					to: [updatedMember.user.email],
					subject: `Important: Your membership in ${workspaceName} has been deactivated`,
					react: React.createElement(MemberDeactivatedEmail, {
						fullName: updatedMember.user.fullName,
						email: updatedMember.user.email,
						workspaceName,
						reason: reason?.trim() || null,
					}),
				});
			} catch (emailErr) {
				console.error("Failed to send member deactivation email:", emailErr);
			}
		}

		// When a member is activated/reactivated, send activation email
		if (status === "ACTIVE" && updatedMember.user?.email) {
			try {
				const resend = new Resend(process.env.RESEND_API_KEY);
				const senderEmail =
					process.env.SENDER_EMAIL || "notifications@collaborate.app";
				const workspaceName = updatedMember.workspace?.name || "Workspace";

				await resend.emails.send({
					from: `Collaborate <${senderEmail}>`,
					to: [updatedMember.user.email],
					subject: `Workspace access restored: Welcome back to ${workspaceName}`,
					react: React.createElement(MemberActivatedEmail, {
						fullName: updatedMember.user.fullName,
						email: updatedMember.user.email,
						workspaceName,
						workspaceId: updatedMember.workspaceId,
					}),
				});
			} catch (emailErr) {
				console.error("Failed to send member activation email:", emailErr);
			}
		}

		// Trigger real-time Pusher event for status update
		const statusPayload = {
			memberId: updatedMember.id,
			userId: updatedMember.userId,
			userEmail: updatedMember.user?.email,
			workspaceId: updatedMember.workspaceId,
			workspaceName: updatedMember.workspace?.name || "Workspace",
			status: updatedMember.status,
			reason: reason?.trim() || null,
		};

		try {
			// Broadcast to the user's personal channel (so they are kicked out/notified in real-time)
			await triggerPusherEvent(
				PUSHER_CHANNELS.getUserChannel(updatedMember.userId),
				PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
				statusPayload,
			);

			// Broadcast to the workspace channel (so online members/admins see the update in real-time)
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(updatedMember.workspaceId),
				PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
				statusPayload,
			);
		} catch (pusherErr) {
			console.error("Pusher broadcast error for member status update:", pusherErr);
		}

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
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const targetMember = await db.member.findUnique({
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

		if (!targetMember) {
			return { success: false, message: "Member not found" };
		}

		// Check if the current user is an Admin or Owner in this workspace
		const currentUserMember = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId: session.user.id,
					workspaceId: targetMember.workspaceId,
				},
			},
		});

		const canViewAssignments =
			currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";

		// If regular member, strip out assignment counts and details
		if (!canViewAssignments) {
			const { _count, ...rest } = targetMember;
			return {
				success: true,
				canViewAssignments: false,
				member: {
					...rest,
					projectMembers: [],
					taskMembers: [],
					_count: {
						createdTasks: 0,
						createdProjects: 0,
						taskMembers: 0,
						projectMembers: 0,
					},
				},
			};
		}

		// If Admin or Owner, include detailed assigned projects and tasks
		const memberWithAssignments = await db.member.findUnique({
			where: { id: memberId },
			include: {
				user: true,
				workspace: true,
				team: true,
				projectMembers: {
					include: {
						project: {
							select: {
								id: true,
								title: true,
								status: true,
								priority: true,
							},
						},
					},
					orderBy: { assignedAt: "desc" },
				},
				taskMembers: {
					include: {
						task: {
							select: {
								id: true,
								title: true,
								status: true,
								priority: true,
								project: {
									select: {
										id: true,
										title: true,
									},
								},
							},
						},
					},
					orderBy: { assignedAt: "desc" },
				},
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

		return {
			success: true,
			canViewAssignments: true,
			member: memberWithAssignments,
		};
	} catch (e: any) {
		return {
			success: false,
			message: e.message || "Failed to fetch member details",
		};
	}
};

