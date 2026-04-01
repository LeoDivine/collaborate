"use server";

import { ExtendedWorkspaceCreateValues } from "@/components/forms/create-workspace";
import { JoinWorkspaceValues } from "@/components/forms/join-workspace";
import { User } from "next-auth";
import { DeskMode } from "../../../generated/prisma/enums";
import { db } from "../db";
import {
	extendedWorkspaceCreateSchema,
	joinWorkspaceSchema,
} from "../schemas/workspace";
import { generateSuffix } from "../utils";

export const getWorkspaceBByID = async (id: string) => {
	const workspace = await db.workspace.findUnique({
		where: {
			id: id,
		},
	});
	return workspace;
};

export const generateUniqueSlugOnCreation = async (baseSlug: string) => {
	let exists = await db.workspace.findUnique({
		where: { slug: baseSlug },
	});

	if (!exists) return baseSlug;

	for (let i = 0; i < 5; i++) {
		const newSlug = `${baseSlug}-${generateSuffix(3)}`;

		const exists = await db.workspace.findUnique({
			where: { slug: newSlug },
		});

		if (!exists) return newSlug;
	}

	return `${baseSlug}-${Date.now().toString().slice(-4)}`;
};

export const createWorkspace = async (
	values: ExtendedWorkspaceCreateValues,
	currentUser: User,
) => {
	const workspaceCheck = await db.workspace.findMany({
		where: {
			createdById: currentUser.id,
			mode: "INDIVIDUAL",
		},
	});
	// console.log({ workspaceCheck });
	if (
		workspaceCheck.length > 0 &&
		values.workspaceMode === ("INDIVIDUAL" as DeskMode)
	) {
		return {
			success: false,
			message: "You already have a personal workspace",
		};
	} else {
		let slug = values.slug;
		const validatedFields =
			await extendedWorkspaceCreateSchema.safeParse(values);

		if (!validatedFields.success) {
			return {
				success: false,
				message: "Invalid fields passed",
			};
		}
		try {
			const workspace = await db.workspace.create({
				data: {
					mode: values.workspaceMode as DeskMode,
					name: values.name,
					slug,
					teamSize: values.teamSize,
					industryType: values.industryType,
					createdById: currentUser.id,
				},
			});

			const member = await db.member.create({
				data: {
					role: "OWNER",
					userId: currentUser.id,
					workspaceId: workspace.id,
				},
			});
			return {
				success: true,
				workspace,
				member,
				message: "Workspace created successfully",
			};
		} catch (e) {
			console.log({ e });
			slug = await generateUniqueSlugOnCreation(values.slug);
			const workspace = await db.workspace.create({
				data: {
					mode: values.workspaceMode as DeskMode,
					name: values.name,
					slug,
					teamSize: values.teamSize,
					industryType: values.industryType,
					createdById: currentUser.id,
				},
			});

			const member = await db.member.create({
				data: {
					role: "OWNER",
					userId: currentUser.id,
					workspaceId: workspace.id,
				},
			});

			return {
				success: true,
				message: "Workspace created successfully",
				workspace,
				member,
			};
		}
	}
};

export const searchForWorkspace = async ({
	limit,
	page,
	query,
}: {
	query?: string;
	limit: number;
	page: number;
}) => {
	const workspace = await db.workspace.findMany({
		take: limit,
		skip: (page - 1) * limit,
		where:
			query ?
				{
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							slug: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
					AND: [{ mode: "WORKSPACE" }],
				}
			:	{},
	});

	if (workspace.length === 0) {
		return {
			success: false,
			message: "No workspace available",
			workspace: [],
		};
	}

	return {
		success: true,
		workspace,
		message: "Workspace fetched successfully",
	};
};

export const workspaceRequest = async (
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
		return {
			success: false,
			message: "Something went wrong",
		};
	}
};
