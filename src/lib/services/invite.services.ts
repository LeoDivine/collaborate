"use server";

import { auth } from "../../../auth";
import { db } from "../db";
import { InviteCodeType } from "../../../generated/prisma/enums";
import { revalidatePath } from "next/cache";
import InviteCodeEmail from "@/components/email-templates/invite-code-email";
import React from "react";
import { Resend } from "resend";

export interface CreateInviteCodeInput {
	workspaceId: string;
	type: InviteCodeType;
	reservedFor?: string;
	expiresInHours?: number; // e.g. 24, 168 (7 days), 720 (30 days)
}

function generateCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let part1 = "";
	let part2 = "";
	for (let i = 0; i < 4; i++) {
		part1 += chars.charAt(Math.floor(Math.random() * chars.length));
		part2 += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `INV-${part1}-${part2}`;
}

export const createInviteCode = async (input: CreateInviteCodeInput) => {
	const session = await auth();
	const user = session?.user;

	if (!user?.id) {
		return { success: false, message: "Unauthorized" };
	}

	const { workspaceId, type, reservedFor, expiresInHours = 168 } = input;

	if (!workspaceId) {
		return { success: false, message: "Workspace ID is required" };
	}

	// Verify user is OWNER or ADMIN
	const currentMember = await db.member.findUnique({
		where: {
			userId_workspaceId: {
				userId: user.id,
				workspaceId,
			},
		},
	});

	if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
		return {
			success: false,
			message: "Only workspace admins and owners can generate invite codes",
		};
	}

	if (type === "RESERVED") {
		if (!reservedFor?.trim()) {
			return {
				success: false,
				message: "Reserved invite codes must specify a target email address",
			};
		}

		const normalizedEmail = reservedFor.trim().toLowerCase();

		// Ensure reserved invite cannot be sent to someone who is already a member of this workspace
		const existingMember = await db.member.findFirst({
			where: {
				workspaceId,
				user: {
					email: {
						equals: normalizedEmail,
						mode: "insensitive",
					},
				},
			},
			include: {
				user: true,
			},
		});

		// Check if email belongs to workspace creator/owner
		const isOwner = await db.workspace.findFirst({
			where: {
				id: workspaceId,
				createdBy: {
					email: {
						equals: normalizedEmail,
						mode: "insensitive",
					},
				},
			},
		});

		if (existingMember || isOwner) {
			if (existingMember?.status === "INACTIVE") {
				return {
					success: false,
					message: `Cannot send invite: "${normalizedEmail}" is currently deactivated from this workspace. Please reactivate their membership in the Members page instead.`,
				};
			}
			return {
				success: false,
				message: `Cannot create invite code: "${normalizedEmail}" is already a member of this workspace`,
			};
		}

		// Check if an unexpired reserved invite code already exists for this email
		const existingInvite = await db.inviteCode.findFirst({
			where: {
				workspaceId,
				type: "RESERVED",
				reservedFor: {
					equals: normalizedEmail,
					mode: "insensitive",
				},
				timeLimit: {
					gt: new Date(),
				},
			},
		});

		if (existingInvite) {
			return {
				success: false,
				message: `An active invite code (${existingInvite.code}) is already pending for "${normalizedEmail}"`,
			};
		}
	}

	try {
		const code = generateCode();
		const timeLimit = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

		const invite = await db.inviteCode.create({
			data: {
				code,
				type,
				reservedFor: type === "RESERVED" ? reservedFor?.trim().toLowerCase() : null,
				timeLimit,
				workspaceId,
				memberId: currentMember.id,
				userId: user.id,
			},
			include: {
				workspace: true,
			},
		});

		// Send email if reserved for a specific recipient
		if (type === "RESERVED" && invite.reservedFor) {
			try {
				const resend = new Resend(process.env.RESEND_API_KEY);
				const senderEmail = process.env.SENDER_EMAIL || "notifications@collaborate.app";
				const inviterName = user.fullName || "A workspace administrator";
				const workspaceName = invite.workspace?.name || "Workspace";

				await resend.emails.send({
					from: `Collaborate <${senderEmail}>`,
					to: [invite.reservedFor],
					subject: `${inviterName} invited you to join ${workspaceName}`,
					react: React.createElement(InviteCodeEmail, {
						invitedEmail: invite.reservedFor,
						inviterName,
						workspaceName,
						code: invite.code,
						timeLimit: invite.timeLimit,
					}),
				});
			} catch (emailErr) {
				console.error("Failed to send reserved invite email:", emailErr);
			}
		}

		revalidatePath("/invite-codes");

		return {
			success: true,
			message:
				type === "RESERVED" && invite.reservedFor
					? `Invite code ${code} generated and invitation email sent to ${invite.reservedFor}`
					: `Invite code ${code} created successfully`,
			inviteCode: invite,
		};
	} catch (e: any) {
		console.error("Error creating invite code:", e);
		return {
			success: false,
			message: e?.message || "Failed to create invite code",
		};
	}
};

export const getWorkspaceInviteCodes = async (workspaceId: string) => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID required",
			inviteCodes: [],
			existingMemberEmails: [],
		};
	}

	try {
		const [inviteCodes, acceptedRequests, currentMembers] = await Promise.all([
			db.inviteCode.findMany({
				where: {
					workspaceId,
				},
				include: {
					createdBy: {
						include: {
							user: true,
						},
					},
					workspace: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			}),
			db.joinRequest.findMany({
				where: {
					workspaceId,
					status: "ACCEPTED",
					inviteCode: { not: null },
				},
				select: {
					inviteCode: true,
					email: true,
					fullName: true,
					reviewedAt: true,
				},
			}),
			db.member.findMany({
				where: {
					workspaceId,
				},
				select: {
					user: {
						select: {
							email: true,
							fullName: true,
						},
					},
				},
			}),
		]);

		const memberEmails = new Set(
			currentMembers
				.map((m) => m.user?.email?.toLowerCase().trim())
				.filter(Boolean) as string[]
		);

		const enrichedCodes = inviteCodes.map((item) => {
			const redemptions = acceptedRequests.filter(
				(r) => r.inviteCode?.trim().toUpperCase() === item.code.trim().toUpperCase()
			);

			const isReservedMember =
				item.type === "RESERVED" &&
				item.reservedFor &&
				memberEmails.has(item.reservedFor.toLowerCase().trim());

			const isUsed = redemptions.length > 0 || Boolean(isReservedMember);
			const usedCount =
				redemptions.length > 0 ? redemptions.length : isReservedMember ? 1 : 0;
			const usedBy =
				redemptions[0] ||
				(isReservedMember && item.reservedFor ? { email: item.reservedFor } : null);

			return {
				...item,
				isUsed,
				usedCount,
				usedBy,
			};
		});

		return {
			success: true,
			inviteCodes: enrichedCodes,
			existingMemberEmails: Array.from(memberEmails),
		};
	} catch (e: any) {
		console.error("Error fetching invite codes:", e);
		return {
			success: false,
			message: "Failed to fetch invite codes",
			inviteCodes: [],
			existingMemberEmails: [],
		};
	}
};

export const revokeInviteCode = async (inviteCodeId: string) => {
	const session = await auth();
	const user = session?.user;

	if (!user?.id) {
		return { success: false, message: "Unauthorized" };
	}

	try {
		const targetInvite = await db.inviteCode.findUnique({
			where: { id: inviteCodeId },
		});

		if (!targetInvite) {
			return { success: false, message: "Invite code not found" };
		}

		// Verify permission
		const member = await db.member.findUnique({
			where: {
				userId_workspaceId: {
					userId: user.id,
					workspaceId: targetInvite.workspaceId,
				},
			},
		});

		if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
			return {
				success: false,
				message: "Permission denied: Only admins and owners can revoke invite codes",
			};
		}

		await db.inviteCode.delete({
			where: { id: inviteCodeId },
		});

		revalidatePath("/invite-codes");

		return {
			success: true,
			message: "Invite code revoked successfully",
		};
	} catch (e: any) {
		console.error("Error revoking invite code:", e);
		return {
			success: false,
			message: "Failed to revoke invite code",
		};
	}
};

export const validateInviteCode = async (code: string, email?: string) => {
	if (!code?.trim()) {
		return { valid: false, message: "Invite code is required" };
	}

	try {
		const invite = await db.inviteCode.findFirst({
			where: {
				code: code.trim().toUpperCase(),
			},
			include: {
				workspace: true,
			},
		});

		if (!invite) {
			return { valid: false, message: "Invalid invite code" };
		}

		// Check expiration
		const now = new Date();
		if (now > new Date(invite.timeLimit)) {
			return { valid: false, message: "This invite code has expired" };
		}

		// If reserved, check email
		if (invite.type === "RESERVED" && invite.reservedFor) {
			if (!email || email.trim().toLowerCase() !== invite.reservedFor.toLowerCase()) {
				return {
					valid: false,
					message: `This invite code is reserved for ${invite.reservedFor}`,
				};
			}

			// Check if this reserved recipient is already in the workspace (code already used)
			const existingRecipientMember = await db.member.findFirst({
				where: {
					workspaceId: invite.workspaceId,
					user: {
						email: {
							equals: invite.reservedFor.trim().toLowerCase(),
							mode: "insensitive",
						},
					},
				},
			});

			if (existingRecipientMember) {
				return {
					valid: false,
					alreadyMember: true,
					workspace: invite.workspace,
					message: `This invite code has already been used. "${invite.reservedFor}" is already a member.`,
				};
			}
		}

		// Prevent existing members from re-joining the same workspace with open or reserved codes
		if (email?.trim()) {
			const existingMember = await db.member.findFirst({
				where: {
					workspaceId: invite.workspaceId,
					user: {
						email: {
							equals: email.trim().toLowerCase(),
							mode: "insensitive",
						},
					},
				},
			});

			if (existingMember) {
				if (existingMember.status === "INACTIVE") {
					return {
						valid: false,
						isDeactivated: true,
						workspace: invite.workspace,
						message: `Your membership in "${invite.workspace.name}" has been deactivated. You cannot use invite codes to rejoin. Please contact an administrator.`,
					};
				}

				return {
					valid: false,
					alreadyMember: true,
					workspace: invite.workspace,
					message: `You are already a member of "${invite.workspace.name}"`,
				};
			}
		}

		return {
			valid: true,
			invite,
			workspace: invite.workspace,
			message: `Valid code for ${invite.workspace.name}`,
		};
	} catch (e: any) {
		console.error("Error validating invite code:", e);
		return { valid: false, message: "Failed to validate invite code" };
	}
};
