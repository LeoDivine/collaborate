import { Member, Prisma, User } from "../../generated/prisma/client";

export type ExtendedUser = Pick<User, "fullName" | "email" | "id" | "userName">;

export interface Quote {
	text: string;
	author: string;
}

export interface RequestAcceptedEmailProps {
	fullName: string;
	email: string;
	workspaceId: string;
	workspaceName: string;
	hasAccount: boolean;
}

export interface MembersUsers extends Member {
	user: User;
}

export type ProjectWithMembers = Prisma.ProjectGetPayload<{
	include: {
		projectMembers: {
			include: {
				member: {
					include: {
						user: true;
					};
				};
			};
		};
		tasks: {
			select: {
				id: true;
				status: true;
			};
		};
	};
}>;

