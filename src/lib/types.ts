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
	Team,
	User,
} from "../../generated/prisma/client";

export type ExtendedUser = Pick<User, "fullName" | "email" | "id" | "userName">;

export interface RequestAcceptedEmailProps {
	fullName: string;
	email: string;
	workspaceId: string;
	workspaceName: string;
	hasAccount: boolean;
	token?: string;
}

export interface RequestRejectedEmailProps {
	fullName: string;
	email: string;
	workspaceName: string;
	reason?: string | null;
}

export interface InviteCodeEmailProps {
	invitedEmail: string;
	inviterName: string;
	workspaceName: string;
	code: string;
	timeLimit: Date | string;
}

export interface MemberDeactivatedEmailProps {
	fullName: string;
	email: string;
	workspaceName: string;
	reason?: string | null;
	deactivatedAt?: Date | string;
}

export interface MemberActivatedEmailProps {
	fullName: string;
	email: string;
	workspaceName: string;
	workspaceId?: string;
	activatedAt?: Date | string;
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
	member?:
		| (Member & {
				user?: User;
		  })
		| null;
}

export interface ProjectActivity extends Activity {
	member?:
		| (Member & {
				user?: User;
		  })
		| null;
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
	team?: {
		id: string;
		name: string;
	} | null;
}

export interface TeamMemberItem extends Member {
	user: User;
	isLead?: boolean;
}

export interface TeamWithMembers {
	id: string;
	name: string;
	description?: string | null;
	workspaceId: string;
	visibility?: "PUBLIC" | "PRIVATE";
	allowSelfJoin?: boolean;
	requireApproval?: boolean;
	allowMemberTaskCreation?: boolean;
	autoAssignAllMembers?: boolean;
	allowMemberInvites?: boolean;
	hideTasksFromNonMembers?: boolean;
	notifyAllOnNewTask?: boolean;
	notifyLeadsOnJoinLeave?: boolean;
	leadIds: string[];
	memberIds?: string[];
	pendingMemberIds?: string[];
	members: TeamMemberItem[];
	leads: TeamMemberItem[];
	pendingMembers?: TeamMemberItem[];
	tasks?: Tasks[];
	_count?: {
		members: number;
		tasks?: number;
	};
}

export interface TeamSummaryStats {
	totalTeams: number;
	assignedMembersCount: number;
	unassignedMembersCount: number;
	totalLeadsCount: number;
	avgTeamSize: number;
}

export interface Quote {
	text: string;
	author: string;
}
