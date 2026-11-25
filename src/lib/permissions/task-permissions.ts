import { ProjectAccess, WorkspaceRoles } from "../../../generated/prisma/enums";

export interface TaskAccessOptions {
	workspaceRole?: WorkspaceRoles | null;
	projectRole?: ProjectAccess | null;
	isTaskCreator: boolean;
	isTaskAssignee: boolean;
}

export interface TaskAccessResult {
	/** Only assigned task members and the task creator can make changes to a task */
	canEditTask: boolean;

	/** Anyone outside a task cannot make comments about a task (only task creator or assigned members) */
	canCommentOnTask: boolean;

	/** Whether the user is inside the task (creator or assignee) */
	isInsideTask: boolean;

	/** Whether the user is a contributor or above in the project */
	isProjectContributor: boolean;

	/** Whether the user is a workspace owner/admin */
	isWorkspaceAdmin: boolean;

	/** Whether the user can manage assignees on the task */
	canManageMembers: boolean;

	/** Whether the user can delete the task */
	canDeleteTask: boolean;
}

/**
 * Computes task permissions based on the user's workspace role, project access, and task relation.
 */
export function computeTaskAccess({
	workspaceRole,
	projectRole,
	isTaskCreator,
	isTaskAssignee,
}: TaskAccessOptions): TaskAccessResult {
	const isWorkspaceAdmin =
		workspaceRole === WorkspaceRoles.OWNER ||
		workspaceRole === WorkspaceRoles.ADMIN;

	const isProjectLead = projectRole === ProjectAccess.PROJECT_LEAD;

	const isProjectContributor =
		isProjectLead || projectRole === ProjectAccess.CONTRIBUTOR;

	const isInsideTask = isTaskCreator || isTaskAssignee;

	// Elevated project managers: Workspace Admins or Project Lead
	const isElevated = isWorkspaceAdmin || isProjectLead;

	// Rule: Workspace Admins, Project Leads, assigned task members, and the task creator can make changes to a task
	const canEditTask = isElevated || isInsideTask;

	// Rule: Task creator, assigned members, and project leads (or workspace admins) can interact with comments
	const canCommentOnTask = isInsideTask || isElevated;

	// Assignee management: Admins, project leads/managers, or task creator
	const canManageMembers = isElevated || isTaskCreator;

	// Task deletion: Admins, project leads/managers, or task creator
	const canDeleteTask = isElevated || isTaskCreator;

	return {
		canEditTask,
		canCommentOnTask,
		isInsideTask,
		isProjectContributor,
		isWorkspaceAdmin,
		canManageMembers,
		canDeleteTask,
	};
}
