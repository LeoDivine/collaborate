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
