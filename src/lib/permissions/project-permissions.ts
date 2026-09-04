import { ProjectAccess, WorkspaceRoles } from "../../../generated/prisma/enums";

export interface ProjectAccessOptions {
	workspaceRole?: WorkspaceRoles | null;
	projectRole?: ProjectAccess | null;
	isProjectCreator: boolean;
}

export interface ProjectAccessResult {
	/** Workspace owner or admin */
	isWorkspaceAdmin: boolean;

	/** Project lead of this project */
	isProjectLead: boolean;

	/** Active contributor in this project */
	isProjectContributor: boolean;

	/** Read-only viewer in this project */
	isProjectViewer: boolean;

	/** Whether user can configure project metadata (Title, Description, Timeline, Dates, Priority, Status, Labels) */
	canConfigureProject: boolean;

	/** Whether user can manage project membership and project lead */
	canManageMembers: boolean;

	/** Whether user can delete the project */
	canDeleteProject: boolean;

	/** Whether user can create tasks within this project */
	canCreateTasks: boolean;

	/** Whether user can add or delete project-level resources */
	canManageResources: boolean;

	/** Whether user can post comments and replies in the project */
	canCommentOnProject: boolean;
}

/**
 * Computes granular project permissions based on workspace role, project access, and creator status.
 */
export function computeProjectAccess({
	workspaceRole,
	projectRole,
	isProjectCreator,
}: ProjectAccessOptions): ProjectAccessResult {
	const isWorkspaceAdmin =
		workspaceRole === WorkspaceRoles.OWNER ||
		workspaceRole === WorkspaceRoles.ADMIN;

	const isProjectLead = projectRole === ProjectAccess.PROJECT_LEAD;

	const isProjectContributor =
		isProjectLead || projectRole === ProjectAccess.CONTRIBUTOR;

	const isProjectViewer = projectRole === ProjectAccess.VIEWER;

	// Elevated project admins: Workspace Admins, Project Lead, or Project Creator
	const isProjectElevated = isWorkspaceAdmin || isProjectLead || isProjectCreator;

	// Active contributors: Anyone elevated + Contributors
	const hasContributionRights = isProjectElevated || isProjectContributor;

	return {
		isWorkspaceAdmin,
		isProjectLead,
		isProjectContributor,
		isProjectViewer,

		// Governance & Destruction
		canConfigureProject: isProjectElevated,
		canManageMembers: isProjectElevated,
		canDeleteProject: isProjectElevated,

		// Operational Contributions
		canCreateTasks: hasContributionRights,
		canManageResources: hasContributionRights,
		canCommentOnProject: hasContributionRights,
	};
}
