/**
 * Pusher channel naming helpers, event name constants, and event payload types.
 */

// Channel prefix helpers
export const PUSHER_CHANNELS = {
	getWorkspaceChannel: (workspaceId: string) => `workspace-${workspaceId}`,
	getProjectChannel: (projectId: string) => `project-${projectId}`,
	getTaskChannel: (taskId: string) => `task-${taskId}`,
	getUserChannel: (userId: string) => `user-${userId}`,
	getPrivateWorkspaceChannel: (workspaceId: string) => `private-workspace-${workspaceId}`,
	getPresenceWorkspaceChannel: (workspaceId: string) => `presence-workspace-${workspaceId}`,
} as const;

// Event names
export const PUSHER_EVENTS = {
	// Workspace Events
	WORKSPACE_UPDATED: "workspace:updated",
	WORKSPACE_MEMBER_JOINED: "workspace:member_joined",
	WORKSPACE_MEMBER_LEFT: "workspace:member_left",
	WORKSPACE_MEMBER_ROLE_UPDATED: "workspace:member_role_updated",

	// Project Events
	PROJECT_CREATED: "project:created",
	PROJECT_UPDATED: "project:updated",
	PROJECT_DELETED: "project:deleted",

	// Task Events
	TASK_CREATED: "task:created",
	TASK_UPDATED: "task:updated",
	TASK_DELETED: "task:deleted",
	TASK_STATUS_CHANGED: "task:status_changed",

	// Comment Events
	COMMENT_CREATED: "comment:created",
	COMMENT_UPDATED: "comment:updated",
	COMMENT_DELETED: "comment:deleted",

	// Milestone Events
	MILESTONE_CREATED: "milestone:created",
	MILESTONE_UPDATED: "milestone:updated",
	MILESTONE_DELETED: "milestone:deleted",

	// Resource Events
	RESOURCE_ADDED: "resource:added",
	RESOURCE_UPDATED: "resource:updated",
	RESOURCE_DELETED: "resource:deleted",

	// Member Assignment Events
	MEMBERS_UPDATED: "members:updated",

	// Activity & Notification Events
	ACTIVITY_CREATED: "activity:created",
	NOTIFICATION_NEW: "notification:new",

	// Presence
	USER_ONLINE: "user:online",
	USER_OFFLINE: "user:offline",
} as const;

export type PusherEventType = (typeof PUSHER_EVENTS)[keyof typeof PUSHER_EVENTS];

// Payload Types
export interface CommentEventPayload {
	comment: {
		id: string;
		message: string;
		memberId: string;
		taskId?: string | null;
		projectId?: string | null;
		createdAt: string | Date;
		member?: {
			user?: {
				fullName: string;
				userName?: string | null;
				email: string;
			};
		};
	};
}

export interface TaskEventPayload {
	taskId: string;
	workspaceId?: string;
	updates?: Record<string, unknown>;
	task?: Record<string, unknown>;
	status?: string;
}

export interface ProjectEventPayload {
	projectId: string;
	workspaceId?: string;
	updates?: Record<string, unknown>;
	project?: Record<string, unknown>;
}

export interface ActivityEventPayload {
	activity: {
		id: string;
		title: string;
		description: string;
		type: string;
		createdAt: string | Date;
		projectId?: string | null;
		taskId?: string | null;
		workspaceId: string;
		memberId?: string | null;
		member?: {
			user?: {
				fullName: string;
				userName?: string | null;
				email: string;
			};
		};
	};
}

export interface MilestoneEventPayload {
	taskId: string;
	milestoneId?: string;
	milestone?: Record<string, unknown>;
}

export interface ResourceEventPayload {
	projectId?: string;
	taskId?: string;
	resourceId?: string;
	resource?: Record<string, unknown>;
}

export interface MembersEventPayload {
	projectId?: string;
	taskId?: string;
	memberIds?: string[];
	leadId?: string;
	projectMembers?: unknown[];
	taskMembers?: unknown[];
}

export interface NotificationEventPayload {
	notification: {
		id: string;
		title: string;
		message: string;
		type?: string;
		createdAt: string | Date;
	};
}
