"use server";

import { db } from "../db";

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
