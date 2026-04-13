"use server";

import { db } from "../db";

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
			workspace: true,
		},
	});

	return {
		members,
	};
};

// export const getMemberInfoByUserId = () => {};

// export const getMemberById = async (userId: string) => {
// 	const member = await db.member.findMany({
// 		where: {
// 			userId,
// 		},
// 	});
// 	return member;
// };

export const getMembersByWorkspaceId = async (id: string) => {
	if (!id) {
		return {
			success: false,
			message: "ID not found",
			members: [],
		};
	}
	const members = await db.member.findMany({
		where: {
			workspaceId: id,
		},
		include: {
			user: true,
		},
	});

	if (members.length > 0) {
		return {
			success: true,
			message: "Members for this workspace have been fetched",
			members,
		};
	} else {
		return {
			success: false,
			message: "No members found for this workspace",
			members: [],
		};
	}
};
