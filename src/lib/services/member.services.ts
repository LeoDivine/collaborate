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

// export const getMemberById = async (userId: string) => {
// 	const member = await db.member.findMany({
// 		where: {
// 			userId,
// 		},
// 	});
// 	return member;
// };
