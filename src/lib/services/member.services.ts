"use server";

import { User } from "../../../generated/prisma/client";
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

export const getMembersByWorkspaceId = async (
	page: number,
	limit: number,
	workspaceId: string,
	query?: string,
) => {
	const [members, total] = await Promise.all([
		await db.member.findMany({
			take: limit,
			skip: (page - 1) * limit,
			include: {
				user: true,
			},
			where: {
				AND: [
					{
						workspaceId,
					},
					{
						OR: [
							{
								user: {
									fullName: {
										contains: query,
										mode: "insensitive",
									},
								},
							},
							{
								user: {
									email: {
										contains: query,
										mode: "insensitive",
									},
								},
							},
							{
								user: {
									userName: {
										contains: query,
										mode: "insensitive",
									},
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

		await db.member.count({
			where: {
				workspaceId,
			},
		}),
	]);

	if (members.length === 0) {
		return {
			success: false,
			meesage: "No members found",
			members: [],
			total,
		};
	}

	return {
		success: true,
		meesage: "Members fetched successfully",
		members,
		total,
	};
};

export const createMemberForWorkspace = async (
	userId: string,
	workspaceId: string,
) => {
	try {
		const member = await db.member.create({
			data: {
				role: "MEMBER",
				workspaceId: workspaceId,
				userId,
			},
		});
		return {
			success: true,
			member,
			message: "Member created successfully",
		};
	} catch (e: any) {
		return {
			success: false,
			message: "Something went wrong with creating workspace",
		};
	}
};
