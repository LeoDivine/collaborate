"use server";

import { JoinWorkspaceValues } from "@/components/forms/join-workspace";
import { User } from "next-auth";
import { auth } from "../../../auth";
import { db } from "../db";
import { joinWorkspaceSchema } from "../schemas/workspace";
import { triggerPusherEvent } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/events";
import { validateInviteCode } from "./invite.services";
import { createMemberForWorkspace } from "./member.services";

export const makeRequest = async (
	values: JoinWorkspaceValues,
	workspaceId: string,
	user?: User,
) => {
	const validatedFields = joinWorkspaceSchema.safeParse(values);
	if (!validatedFields.success) {
		return {
			success: false,
			message: "Invalid fields passed",
		};
	}
	const { email, name, inviteToken, message } = validatedFields.data;

	// Check if applicant is ALREADY a member of this workspace (by email or userId)
	const existingMember = await db.member.findFirst({
		where: {
			workspaceId,
			OR: [
				{
					user: {
						email: {
							equals: email.trim().toLowerCase(),
							mode: "insensitive",
						},
					},
				},
				...(user?.id ? [{ userId: user.id }] : []),
			],
		},
		include: {
			workspace: {
				select: {
					name: true,
				},
			},
		},
	});

	if (existingMember) {
		if (existingMember.status === "INACTIVE") {
			return {
				success: false,
				isDeactivated: true,
				message: `Your membership in "${existingMember.workspace?.name || "this workspace"}" has been deactivated. You cannot rejoin or access this workspace. Please contact the workspace administrator.`,
			};
		}

		return {
			success: false,
			alreadyMember: true,
			message: `You are already a member of "${existingMember.workspace?.name || "this workspace"}"`,
		};
	}

	// Check for invite code fast-track
	if (inviteToken?.trim()) {
		const inviteValidation = await validateInviteCode(inviteToken.trim(), email);
		if (!inviteValidation.valid) {
			return {
				success: false,
				message: inviteValidation.message || "Invalid or expired invite token",
			};
		}

		if (inviteValidation.workspace?.id !== workspaceId) {
			return {
				success: false,
				message: `This invite code belongs to "${inviteValidation.workspace?.name || "another workspace"}"`,
			};
		}

		// User is validly invited! Fast-track instant join
		if (user?.id) {
			const memberRes = await createMemberForWorkspace(user.id, workspaceId);
			if (!memberRes.success) {
				return {
					success: false,
					message: memberRes.message || "Failed to join workspace",
				};
			}

			await db.joinRequest.upsert({
				where: {
					email_workspaceId: {
						email,
						workspaceId,
					},
				},
				update: {
					status: "ACCEPTED",
					inviteCode: inviteToken.trim(),
					reviewedAt: new Date(),
					userId: user.id,
				},
				create: {
					email,
					fullName: name,
					inviteCode: inviteToken.trim(),
					message: message || "Joined via invite code",
					workspaceId,
					userId: user.id,
					status: "ACCEPTED",
					reviewedAt: new Date(),
				},
			});

			return {
				success: true,
				instantJoined: true,
				message: `Welcome! You have joined ${inviteValidation.workspace.name} directly via invite code.`,
			};
		} else {
			await db.joinRequest.upsert({
				where: {
					email_workspaceId: {
						email,
						workspaceId,
					},
				},
				update: {
					status: "ACCEPTED",
					inviteCode: inviteToken.trim(),
					reviewedAt: new Date(),
				},
				create: {
					email,
					fullName: name,
					inviteCode: inviteToken.trim(),
					message: message || "Joined via invite code",
					workspaceId,
					status: "ACCEPTED",
					reviewedAt: new Date(),
				},
			});

			return {
				success: true,
				instantJoined: true,
				message: "Invite code verified! Please sign in or create an account to access the workspace.",
			};
		}
	}

	const isEmailExisting = await db.joinRequest.findFirst({
		where: {
			email,
			workspaceId,
			status: "PENDING",
		},
	});

	const isEmailAccepted = await db.joinRequest.findFirst({
		where: {
			email,
			workspaceId,
			status: "ACCEPTED",
		},
	});

	if (isEmailExisting) {
		return {
			success: false,
			message: "A request with this email already exists",
		};
	}

	const members = await db.member.findMany({
		where: {
			workspaceId: workspaceId,
		},
		include: {
			user: true,
		},
	});

	if (members.length > 0) {
		const isEmailInWorkspace = members.find(
			(i) => i.user.email.toLowerCase() === email.trim().toLowerCase(),
		);

		if (isEmailInWorkspace) {
			if (isEmailInWorkspace.status === "INACTIVE") {
				return {
					success: false,
					isDeactivated: true,
					message:
						"Your membership in this workspace has been deactivated. You cannot rejoin or access this workspace. Please contact the workspace administrator.",
				};
			}

			return {
				success: false,
				alreadyMember: true,
				message: "This email already exists in the workspace",
			};
		}
	}

	try {
		let joinWorkspace;
		if (isEmailAccepted && members.find((i) => i.user.email !== email)) {
			joinWorkspace = await db.joinRequest.update({
				where: {
					email_workspaceId: {
						email,
						workspaceId,
					},
				},
				data: {
					status: "PENDING",
					createdAt: new Date(),
				},
			});

			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.WORKSPACE_REQUEST_RECEIVED,
				{
					request: joinWorkspace,
					workspaceId,
				},
			);

			return {
				success: true,
				message:
					"Request successfully sent, the admin will approve your request soon.",
			};
		} else {
			joinWorkspace = await db.joinRequest.create({
				data: {
					email,
					fullName: name,
					inviteCode: inviteToken,
					message,
					workspaceId,
					userId: user?.id,
				},
			});
		}
		//TODO: CHECK FOR INVITE CODE CORRECTION
		if (!joinWorkspace) {
			return {
				success: false,
				message: "Request not sent",
			};
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.WORKSPACE_REQUEST_RECEIVED,
			{
				request: joinWorkspace,
				workspaceId,
			},
		);

		return {
			success: true,
			message:
				"Request successfully sent, the admin will approve your request soon.",
		};
	} catch (e) {
		console.log({ e });
		return {
			success: false,
			message: "Something went wrong",
		};
	}
};

export const acceptRequestAdmin = async (requestId: string) => {
	const session = await auth();
	const user = session?.user;
	if (!requestId) {
		return {
			success: false,
			message: "Request ID is not valid",
		};
	}

	try {
		const request = await db.joinRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: "ACCEPTED",
				reviewedById: user?.id,
				reviewedAt: new Date(),
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(request.workspaceId),
			PUSHER_EVENTS.WORKSPACE_REQUEST_UPDATED,
			{
				requestId: request.id,
				workspaceId: request.workspaceId,
				status: request.status,
				reviewedById: user?.id,
				reviewedAt: request.reviewedAt,
				request,
			},
		);

		return {
			success: true,
			message:
				"Request accepted, they would get a confirmation email soon.",
			request,
		};
	} catch (e) {
		console.error("Issue with accepting admin request", e);
		return {
			success: false,
			message: "Failed to accept request",
		};
	}
};

export const rejectRequestAdmin = async (
	requestId: string,
	reason?: string,
) => {
	const session = await auth();
	const user = session?.user;
	if (!requestId) {
		return {
			success: false,
			message: "Request ID is not valid",
		};
	}

	try {
		const existing = await db.joinRequest.findUnique({
			where: { id: requestId },
			include: { workspace: true },
		});

		if (!existing) {
			return { success: false, message: "Request not found" };
		}

		if (user?.id) {
			const adminMember = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId: user.id,
						workspaceId: existing.workspaceId,
					},
				},
			});

			if (
				!adminMember ||
				(adminMember.role !== "OWNER" && adminMember.role !== "ADMIN")
			) {
				return { success: false, message: "Permission denied" };
			}
		}

		const request = await db.joinRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: "REJECTED",
				reviewedById: user?.id,
				reviewedAt: new Date(),
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(request.workspaceId),
			PUSHER_EVENTS.WORKSPACE_REQUEST_UPDATED,
			{
				requestId: request.id,
				workspaceId: request.workspaceId,
				status: "REJECTED",
				reviewedById: user?.id,
				reviewedAt: request.reviewedAt,
				request,
			},
		);

		return {
			success: true,
			message: "Request declined successfully",
			request,
		};
	} catch (e) {
		console.error("Issue with rejecting admin request", e);
		return {
			success: false,
			message: "Failed to decline request",
		};
	}
};

export const deleteRequestAdmin = async (requestId: string) => {
	const session = await auth();
	const user = session?.user;
	if (!requestId) {
		return {
			success: false,
			message: "Request ID is not valid",
		};
	}

	try {
		const request = await db.joinRequest.delete({
			where: {
				id: requestId,
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(request.workspaceId),
			PUSHER_EVENTS.WORKSPACE_REQUEST_UPDATED,
			{
				requestId: request.id,
				workspaceId: request.workspaceId,
				status: "DELETED",
				reviewedById: user?.id,
				reviewedAt: new Date(),
				request,
			},
		);

		return {
			success: true,
			message: "Request declined and removed successfully",
			request,
		};
	} catch (e) {
		console.error("Issue with declining request", e);
		return {
			success: false,
			message: "Failed to decline request",
		};
	}
};

export const getAllRequest = async (
	page: number,
	limit: number,
	workspaceId: string,
	query?: string,
	status?: string,
	inviteType?: string,
	sort: "asc" | "desc" = "desc",
) => {
	const andConditions: any[] = [{ workspaceId }];

	if (query && query.trim()) {
		andConditions.push({
			OR: [
				{
					fullName: {
						contains: query.trim(),
						mode: "insensitive",
					},
				},
				{
					email: {
						contains: query.trim(),
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (status && status !== "ALL") {
		andConditions.push({
			status: status as any,
		});
	}

	if (inviteType === "WITH_CODE") {
		andConditions.push({
			inviteCode: {
				not: null,
			},
		});
	} else if (inviteType === "DIRECT") {
		andConditions.push({
			OR: [{ inviteCode: null }, { inviteCode: "" }],
		});
	}

	const whereConditions = {
		AND: andConditions,
	};

	const [requests, filteredTotal, allTotal, pending, accepted, rejected] =
		await Promise.all([
			db.joinRequest.findMany({
				take: limit,
				skip: (page - 1) * limit,
				where: whereConditions,
				orderBy: {
					createdAt: sort === "asc" ? "asc" : "desc",
				},
			}),
			db.joinRequest.count({
				where: whereConditions,
			}),
			db.joinRequest.count({
				where: {
					workspaceId,
				},
			}),
			db.joinRequest.count({
				where: {
					workspaceId,
					status: "PENDING",
				},
			}),
			db.joinRequest.count({
				where: {
					workspaceId,
					status: "ACCEPTED",
				},
			}),
			db.joinRequest.count({
				where: {
					workspaceId,
					status: "REJECTED",
				},
			}),
		]);

	if (requests.length === 0) {
		return {
			success: false,
			message: "No requests found",
			requests: [],
			total: filteredTotal,
			stats: {
				pending,
				accepted,
				rejected,
				total: allTotal,
			},
		};
	}

	return {
		success: true,
		message: "Requests fetched successfully",
		requests,
		total: filteredTotal,
		stats: {
			pending,
			accepted,
			rejected,
			total: allTotal,
		},
	};
};
