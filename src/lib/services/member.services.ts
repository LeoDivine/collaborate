"use server";

import { db } from "../db";

export const getMembersByUserID = async (userId: string) => {
	// console.log({ userId });
	const member = await db.member.findMany({
		where: {
			userId,
		},
		include: {
			workspace: true,
		},
	});
	if (!userId) {
		return {
			member: [],
		};
	}
	return {
		member,
	};
};
