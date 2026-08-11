import {
	Activity,
	Comment,
	Member,
	Prisma,
	Project,
	ProjectMember,
	Resource,
	Task,
	User,
} from "../../generated/prisma/client";

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

export interface ProjectMembers extends ProjectMember {
	member: Member & {
		user: User;
	};
}

export interface ProjectComment extends Comment {
	member?: (Member & {
		user?: User;
	}) | null;
}

export interface ProjectActivity extends Activity {
	member?: (Member & {
		user?: User;
	}) | null;
}

export interface Projects extends Project {
	projectMembers: ProjectMembers[];
	tasks: Task[];
	resources: Resource[];
	comments?: ProjectComment[];
	activities?: ProjectActivity[];
}

