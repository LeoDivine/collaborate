"use server";

import { ExtendedWorkspaceCreateValues } from "@/components/forms/create-workspace";
import { db } from "../db";
import { DeskMode } from "../../../generated/prisma/enums";
import { ExtendedUser } from "../types";
import { User } from "next-auth";
import { generateSuffix } from "../utils";
import { extendedWorkspaceCreateSchema } from "../schemas/workspace";

export const getWorkspaceBByID = async (id: string) => {
	const workspace = await db.workspace.findUnique({
		where: {
			id: id,
		},
	});
	return workspace;
};

export const getAllWorkspaceForUserUserId = async (userId: string) => {
	const workspace = await db.user.findMany({
		where: {
			id: userId,
		},
		include: {
			workspaces: true,
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
