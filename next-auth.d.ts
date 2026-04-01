import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
	interface Session {
		user?: {
			id: string;
			email: string;
			fullName: string;
			userName: string;
			currentWorkspaceId?: string;
			currentWorkspaceMode?: string;
			currentWorkspaceRole?: string;
			currentWorkspaceName?: string;
		} & DefaultSession["user"];
		error?: string;
	}

	interface User extends DefaultUser {
		id: string;
		email: string;
		fullName: string;
		userName: string;
		currentWorkspaceMode?: string;
		currentWorkspaceId?: string;
		currentWorkspaceRole?: string;
		currentWorkspaceName?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		email: string;
		fullName: string;
		userName: string;
		currentWorkspaceId?: string;
		currentWorkspaceRole?: string;
		currentWorkspaceMode?: string;
		currentWorkspaceName?: string;
	}
}
