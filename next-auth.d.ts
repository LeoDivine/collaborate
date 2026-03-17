import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
	interface Session {
		user?: {
			id: string;
			email: string;
			fullName: string;
			userName: string;
			currenWorkspaceId?: string;
			currentWorkspaceMode?: string;
			currentWorkspaceRole?: string;
		} & DefaultSession["user"];
		error?: string;
	}

	interface User extends DefaultUser {
		id: string;
		email: string;
		fullName: string;
		userName: string;
		currentWorkspaceMode?: string;
		currenWorkspaceId?: string;
		currentWorkspaceRole?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		email: string;
		fullName: string;
		userName: string;
		currenWorkspaceId?: string;
		currentWorkspaceRole?: string;
		currentWorkspaceMode?: string;
	}
}
