"use server";

import { JoinWorkspaceValues } from "@/components/forms/join-workspace";
import { User } from "next-auth";
import { auth } from "../../../auth";
import { db } from "../db";
import { joinWorkspaceSchema } from "../schemas/workspace";

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

	const isEmailExisting = await db.joinRequest.findFirst({
		where: {
			email,
			workspaceId,
			status: "PENDING",
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
		const isEmailInWorkspace = members.find((i) => i.user.email === email);

		if (isEmailInWorkspace) {
			return {
				success: false,
				message: "This email already exists in the workspace",
			};
		}
	}

	try {
		const joinWorkspace = await db.joinRequest.create({
			data: {
				email,
				fullName: name,
				inviteCode: inviteToken,
				message,
				workspaceId,
				userId: user?.id,
			},
		});
		//TODO: CHECK FOR INVITE CODE CORRECTION
		if (!joinWorkspace) {
			return {
				success: false,
				message: "Request not sent",
			};
		}
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

export const getAllRequest = async (
	page: number,
	limit: number,
	workspaceId: string,
	query?: string,
) => {
	const [requests, total, pending, accepted] = await Promise.all([
		db.joinRequest.findMany({
			take: limit,
			skip: (page - 1) * limit,
			where: {
				AND: [
					{
						workspaceId,
					},
					{
						OR: [
							{
								fullName: {
									contains: query,
									mode: "insensitive",
								},
							},
							{
								email: {
									contains: query,
									mode: "insensitive",
								},
							},
						],
					},
				],
			},
			orderBy: {
				createdAt: "desc",
			},
		}),
		db.joinRequest.count({}),
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
	]);

	if (requests.length === 0) {
		return {
			success: false,
			message: "No requests found",
			requests: [],
			total,
		};
	}

	return {
		success: true,
		message: "Requests fetched successfully",
		requests,
		total,
		stats: {
			pending,
			accepted,
		},
	};
};
