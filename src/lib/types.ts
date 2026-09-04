import {
	Activity,
	Comment,
	Member,
	MileStone,
	Prisma,
	Project,
	ProjectMember,
	Resource,
	Task,
	TaskMember,
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

export interface TaskMembers extends TaskMember {
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
	tasks: (Task & {
		milestones?: MileStone[];
		resources?: Resource[];
		taskMembers?: TaskMembers[];
		createdBy?: Member & {
			user: User;
		};
	})[];
	resources: Resource[];
	comments?: ProjectComment[];
	activities?: ProjectActivity[];
	createdBy?: Member & {
		user: User;
	};
}

export interface Tasks extends Task {
	project: Project & {
		resources?: Resource[];
		projectMembers?: ProjectMembers[];
	};
	taskMembers: TaskMembers[];
	milestones: MileStone[];
	comments?: ProjectComment[];
	resources?: Resource[];
	activities?: ProjectActivity[];
	createdBy?: Member & {
		user: User;
	};
}


