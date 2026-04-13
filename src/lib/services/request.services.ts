"use server";

import { JoinWorkspaceValues } from "@/components/forms/join-workspace";
import { User } from "next-auth";
import { db } from "../db";
import { joinWorkspaceSchema } from "../schemas/workspace";
import { getMembersByWorkspaceId } from "./member.services";

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

	const isEmailExisting = await db.joinRequest.findUnique({
		where: {
			email,
		},
	});

	if (isEmailExisting) {
		return {
			success: false,
			message: "A request with this email already exists",
		};
	}

	const members = await getMembersByWorkspaceId(workspaceId);

	if (members.success) {
		const isEmailInWorkspace = members.members.find(
			(i) => i.user.email === email,
		);

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

export const acceptRequest = async (requestId: string) => {
	if (!requestId) {
		return {
			success: false,
			meesage: "Request ID is not valid",
		};
	}
	const request = await db.joinRequest.update({
		where: {
			id: requestId,
		},
		data: {
			status: "ACCEPTED",
		},
	});

	if (!request) {
		return {
			success: false,
			meesage: "Request not accepted",
		};
	}

	return {
		success: true,
		meesage: "Request accepted",
		data: {
			request,
		},
	};
};
