import { User } from "../../generated/prisma/client";

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
}
