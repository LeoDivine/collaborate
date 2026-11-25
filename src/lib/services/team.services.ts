"use server";

import { auth } from "../../../auth";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/events";
import { ActivityType, WorkspaceRoles } from "../../../generated/prisma/enums";
import type { TeamWithMembers, TeamMemberItem, TeamSummaryStats } from "@/lib/types";

/**
 * Helper to authenticate user and retrieve their workspace member record
 */
async function getCallerWorkspaceMember(workspaceId: string) {
	const session = await auth();
	const userId = session?.user?.id;

	if (!userId || !workspaceId) {
		return null;
	}

	const member = await db.member.findUnique({
		where: {
			userId_workspaceId: {
				userId,
				workspaceId,
			},
		},
		include: {
			user: true,
		},
	});

	return member;
}

let isSchemaEnsured = false;
async function ensureTeamSchema() {
	if (isSchemaEnsured) return;
	try {
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "memberIds" text[] DEFAULT '{}'`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "description" text`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'PUBLIC'`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "allowSelfJoin" boolean DEFAULT true`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "requireApproval" boolean DEFAULT false`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "pendingMemberIds" text[] DEFAULT '{}'`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "allowMemberTaskCreation" boolean DEFAULT false`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "autoAssignAllMembers" boolean DEFAULT false`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "allowMemberInvites" boolean DEFAULT false`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "hideTasksFromNonMembers" boolean DEFAULT false`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "notifyAllOnNewTask" boolean DEFAULT true`
		);
		await db.$executeRawUnsafe(
			`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "notifyLeadsOnJoinLeave" boolean DEFAULT true`
		);
		await db.$executeRawUnsafe(`
			UPDATE "teams" t
			SET "memberIds" = ARRAY(
				SELECT DISTINCT m.id 
				FROM "members" m 
				WHERE m."teamId" = t.id
			)
			WHERE t."memberIds" IS NULL OR cardinality(t."memberIds") = 0
		`);
		isSchemaEnsured = true;
	} catch (e) {
		console.error("Error ensuring team schema:", e);
	}
}

/**
 * Get all teams in a workspace with their members, leads, and summary stats
 */
export async function getTeamsByWorkspaceId(workspaceId: string): Promise<{
	success: boolean;
	message?: string;
	teams: TeamWithMembers[];
	stats: TeamSummaryStats;
	unassignedMembers: TeamMemberItem[];
	allWorkspaceMembers: TeamMemberItem[];
	currentMemberRole?: WorkspaceRoles;
	currentMemberId?: string;
}> {
	try {
		if (!workspaceId) {
			return {
				success: false,
				message: "Workspace ID is required",
				teams: [],
				stats: {
					totalTeams: 0,
					assignedMembersCount: 0,
					unassignedMembersCount: 0,
					totalLeadsCount: 0,
					avgTeamSize: 0,
				},
				unassignedMembers: [],
				allWorkspaceMembers: [],
			};
		}

		await ensureTeamSchema();

		const session = await auth();
		const userId = session?.user?.id;
		let currentMemberRole: WorkspaceRoles | undefined;
		let currentMemberId: string | undefined;

		if (userId) {
			const currentMember = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
				select: {
					id: true,
					role: true,
				},
			});
			if (currentMember) {
				currentMemberRole = currentMember.role;
				currentMemberId = currentMember.id;
			}
		}

		// Fetch all active members in the workspace
		const allWorkspaceMembersRaw = await db.member.findMany({
			where: {
				workspaceId,
				status: "ACTIVE",
			},
			include: {
				user: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		const allWorkspaceMembers: TeamMemberItem[] = allWorkspaceMembersRaw.map((m) => ({
			...m,
			isLead: false,
		}));

		const memberMap = new Map<string, TeamMemberItem>(
			allWorkspaceMembers.map((m) => [m.id, m])
		);

		// Fetch all teams for the workspace
		const teamsRaw = await db.team.findMany({
			where: { workspaceId },
			include: {
				members: {
					include: {
						user: true,
					},
					orderBy: {
						createdAt: "asc",
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		// Query stored memberIds and settings from teams table using raw SQL
		const teamMemberIdsMap = new Map<string, string[]>();
		const teamSettingsMap = new Map<
			string,
			{
				visibility: "PUBLIC" | "PRIVATE";
				allowSelfJoin: boolean;
				requireApproval: boolean;
				allowMemberTaskCreation: boolean;
				autoAssignAllMembers: boolean;
				allowMemberInvites: boolean;
				hideTasksFromNonMembers: boolean;
				notifyAllOnNewTask: boolean;
				notifyLeadsOnJoinLeave: boolean;
				pendingMemberIds: string[];
			}
		>();
		try {
			const rows: {
				id: string;
				memberIds?: string[];
				visibility?: string;
				allowSelfJoin?: boolean;
				requireApproval?: boolean;
				allowMemberTaskCreation?: boolean;
				autoAssignAllMembers?: boolean;
				allowMemberInvites?: boolean;
				hideTasksFromNonMembers?: boolean;
				notifyAllOnNewTask?: boolean;
				notifyLeadsOnJoinLeave?: boolean;
				pendingMemberIds?: string[];
			}[] = await db.$queryRawUnsafe(
				`SELECT id, "memberIds", "visibility", "allowSelfJoin", "requireApproval", "allowMemberTaskCreation", "autoAssignAllMembers", "allowMemberInvites", "hideTasksFromNonMembers", "notifyAllOnNewTask", "notifyLeadsOnJoinLeave", "pendingMemberIds" FROM "teams" WHERE "workspaceId" = $1`,
				workspaceId
			);
			for (const r of rows) {
				if (Array.isArray(r.memberIds)) {
					teamMemberIdsMap.set(r.id, r.memberIds);
				}
				teamSettingsMap.set(r.id, {
					visibility: r.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
					allowSelfJoin: r.allowSelfJoin !== false,
					requireApproval: Boolean(r.requireApproval),
					allowMemberTaskCreation: Boolean(r.allowMemberTaskCreation),
					autoAssignAllMembers: Boolean(r.autoAssignAllMembers),
					allowMemberInvites: Boolean(r.allowMemberInvites),
					hideTasksFromNonMembers: Boolean(r.hideTasksFromNonMembers),
					notifyAllOnNewTask: r.notifyAllOnNewTask !== false,
					notifyLeadsOnJoinLeave: r.notifyLeadsOnJoinLeave !== false,
					pendingMemberIds: Array.isArray(r.pendingMemberIds)
						? r.pendingMemberIds
						: [],
				});
			}
		} catch (err) {
			console.error("Error querying team memberIds and settings:", err);
		}

		const teamTaskCounts = new Map<string, number>();
		try {
			const counts: { teamId: string; count: number }[] = await db.$queryRawUnsafe(
				`SELECT "teamId", COUNT(*)::int as count FROM "tasks" WHERE "workspaceId" = $1 AND "teamId" IS NOT NULL GROUP BY "teamId"`,
				workspaceId
			);
			for (const c of counts) {
				if (c.teamId) {
					teamTaskCounts.set(c.teamId, Number(c.count) || 0);
				}
			}
		} catch {
			// table or column might not have rows yet
		}

		const distinctLeadIds = new Set<string>();
		const assignedMemberIds = new Set<string>();
		let totalAssignedMembers = 0;

		const isCallerAdmin =
			currentMemberRole === WorkspaceRoles.OWNER ||
			currentMemberRole === WorkspaceRoles.ADMIN;

		const allTeams: TeamWithMembers[] = teamsRaw.map((team) => {
			// Extract leadIds safely
			const leadIds: string[] = Array.isArray((team as any).leadIds)
				? ((team as any).leadIds as string[])
				: [];

			// Merge memberIds from column + legacy team.members relation to allow members in multiple teams
			const storedMemberIds: string[] = teamMemberIdsMap.get(team.id) || [];
			const legacyMemberIds = team.members.map((m) => m.id);
			const combinedTeamMemberIds = Array.from(
				new Set([...storedMemberIds, ...legacyMemberIds])
			);

			const settings = teamSettingsMap.get(team.id) || {
				visibility: "PUBLIC" as const,
				allowSelfJoin: true,
				requireApproval: false,
				allowMemberTaskCreation: false,
				autoAssignAllMembers: false,
				allowMemberInvites: false,
				hideTasksFromNonMembers: false,
				notifyAllOnNewTask: true,
				notifyLeadsOnJoinLeave: true,
				pendingMemberIds: [],
			};

			const members: TeamMemberItem[] = combinedTeamMemberIds
				.map((id) => memberMap.get(id))
				.filter((m): m is TeamMemberItem => Boolean(m))
				.map((member) => {
					const isLead = leadIds.includes(member.id);
					if (isLead) {
						distinctLeadIds.add(member.id);
					}
					assignedMemberIds.add(member.id);
					return {
						...member,
						isLead,
					};
				});

			totalAssignedMembers += members.length;

			const leads = members.filter((m) => m.isLead);
			const pendingMembers: TeamMemberItem[] = settings.pendingMemberIds
				.filter((id) => !combinedTeamMemberIds.includes(id))
				.map((id) => memberMap.get(id))
				.filter((m): m is TeamMemberItem => Boolean(m));

			return {
				id: team.id,
				name: team.name,
				description: (team as any).description || null,
				workspaceId: team.workspaceId,
				visibility: settings.visibility,
				allowSelfJoin: settings.allowSelfJoin,
				requireApproval: settings.requireApproval,
				allowMemberTaskCreation: settings.allowMemberTaskCreation,
				autoAssignAllMembers: settings.autoAssignAllMembers,
				allowMemberInvites: settings.allowMemberInvites,
				hideTasksFromNonMembers: settings.hideTasksFromNonMembers,
				notifyAllOnNewTask: settings.notifyAllOnNewTask,
				notifyLeadsOnJoinLeave: settings.notifyLeadsOnJoinLeave,
				leadIds,
				memberIds: combinedTeamMemberIds,
				pendingMemberIds: pendingMembers.map((m) => m.id),
				members,
				leads,
				pendingMembers,
				_count: {
					members: members.length,
					tasks: teamTaskCounts.get(team.id) || 0,
				},
			};
		});

		const teams = allTeams.filter((team) => {
			if (team.visibility !== "PRIVATE" || isCallerAdmin) return true;
			if (!currentMemberId) return false;
			return (
				team.memberIds?.includes(currentMemberId) ||
				team.leadIds.includes(currentMemberId) ||
				team.pendingMemberIds?.includes(currentMemberId)
			);
		});

		// A member is unassigned if they belong to 0 teams
		const unassignedMembers: TeamMemberItem[] = allWorkspaceMembers.filter(
			(m) => !assignedMemberIds.has(m.id)
		);

		const stats: TeamSummaryStats = {
			totalTeams: teams.length,
			assignedMembersCount: assignedMemberIds.size,
			unassignedMembersCount: unassignedMembers.length,
			totalLeadsCount: distinctLeadIds.size,
			avgTeamSize:
				teams.length > 0
					? Math.round((totalAssignedMembers / teams.length) * 10) / 10
					: 0,
		};

		return {
			success: true,
			teams,
			stats,
			unassignedMembers,
			allWorkspaceMembers,
			currentMemberRole,
			currentMemberId,
		};
	} catch (error) {
		console.error("Error fetching teams by workspace ID:", error);
		return {
			success: false,
			message: "Failed to fetch workspace teams",
			teams: [],
			stats: {
				totalTeams: 0,
				assignedMembersCount: 0,
				unassignedMembersCount: 0,
				totalLeadsCount: 0,
				avgTeamSize: 0,
			},
			unassignedMembers: [],
			allWorkspaceMembers: [],
		};
	}
}

/**
 * Create a new team with optional initial members and multiple team leads
 */
export async function createTeam({
	workspaceId,
	name,
	description,
	memberIds = [],
	leadIds = [],
}: {
	workspaceId: string;
	name: string;
	description?: string;
	memberIds?: string[];
	leadIds?: string[];
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized: not a workspace member" };
		}

		if (caller.role !== WorkspaceRoles.OWNER && caller.role !== WorkspaceRoles.ADMIN) {
			return {
				success: false,
				message: "Only workspace Owners and Admins can create teams",
			};
		}

		const trimmedName = name.trim();
		if (!trimmedName || trimmedName.length < 2) {
			return {
				success: false,
				message: "Team name must be at least 2 characters long",
			};
		}

		const trimmedDescription = description?.trim() || null;

		// Check name uniqueness within the workspace
		const existingTeam = await db.team.findFirst({
			where: {
				workspaceId,
				name: {
					equals: trimmedName,
					mode: "insensitive",
				},
			},
		});

		if (existingTeam) {
			return {
				success: false,
				message: `A team named "${trimmedName}" already exists in this workspace`,
			};
		}

		// Ensure all leadIds are included in memberIds
		const combinedMemberIds = Array.from(new Set([...memberIds, ...leadIds]));
		const validLeadIds = leadIds.filter((id) => combinedMemberIds.includes(id));

		if (validLeadIds.length > 2) {
			return {
				success: false,
				message: "A team can have a maximum of 2 team leads",
			};
		}

		// Ensure team schema is up to date
		await ensureTeamSchema();

		// Create team record (safely handling leadIds and description columns recognized by Prisma)
		let newTeam: any;
		try {
			newTeam = await db.team.create({
				data: {
					workspaceId,
					name: trimmedName,
					description: trimmedDescription,
					leadIds: validLeadIds,
				} as any,
			});
		} catch {
			try {
				newTeam = await db.team.create({
					data: {
						workspaceId,
						name: trimmedName,
						leadIds: validLeadIds,
					} as any,
				});
			} catch {
				newTeam = await db.team.create({
					data: {
						workspaceId,
						name: trimmedName,
					},
				});
			}
		}

		// Persist memberIds directly to PostgreSQL teams table using raw SQL
		if (combinedMemberIds.length > 0) {
			try {
				const placeholders = combinedMemberIds.map((_, i) => `$${i + 2}`).join(", ");
				await db.$executeRawUnsafe(
					`UPDATE "teams" SET "memberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
					newTeam.id,
					...combinedMemberIds
				);
			} catch (err) {
				console.error("Error setting team memberIds in createTeam:", err);
			}

			// Update members who don't have a team assigned yet for backwards compatibility
			try {
				await db.member.updateMany({
					where: {
						id: { in: combinedMemberIds },
						workspaceId,
						teamId: null,
					},
					data: {
						teamId: newTeam.id,
					},
				});
			} catch {
				// Ignore
			}
		}

		// Log activity
		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Team Created",
				description: `${caller.user.fullName} created team "${trimmedName}" with ${combinedMemberIds.length} member(s)`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		// Trigger Pusher real-time updates
		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_CREATED,
			{ teamId: newTeam.id, name: trimmedName, leadIds: validLeadIds }
		);

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ memberIds: combinedMemberIds }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		revalidatePath("/members");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: `Team "${trimmedName}" created successfully`,
			teamId: newTeam.id,
		};
	} catch (error) {
		console.error("Error creating team:", error);
		return {
			success: false,
			message: "An unexpected error occurred while creating the team",
		};
	}
}

/**
 * Update a team's name
 */
export async function updateTeamName({
	teamId,
	workspaceId,
	name,
	description,
}: {
	teamId: string;
	workspaceId: string;
	name: string;
	description?: string | null;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER || caller.role === WorkspaceRoles.ADMIN;
		const leadIds: string[] = Array.isArray((team as any).leadIds)
			? ((team as any).leadIds as string[])
			: [];
		const isTeamLead = leadIds.includes(caller.id);

		if (!isOwnerOrAdmin && !isTeamLead) {
			return {
				success: false,
				message: "Only workspace Admins or Team Leads can edit this team",
			};
		}

		const trimmedName = name.trim();
		if (!trimmedName || trimmedName.length < 2) {
			return {
				success: false,
				message: "Team name must be at least 2 characters long",
			};
		}

		// Check name collision with another team in the same workspace
		const existingTeam = await db.team.findFirst({
			where: {
				workspaceId,
				id: { not: teamId },
				name: {
					equals: trimmedName,
					mode: "insensitive",
				},
			},
		});

		if (existingTeam) {
			return {
				success: false,
				message: `Another team named "${trimmedName}" already exists in this workspace`,
			};
		}

		const oldName = team.name;
		const trimmedDesc = description !== undefined ? (description?.trim() || null) : (team as any).description;

		try {
			await db.team.update({
				where: { id: teamId },
				data: {
					name: trimmedName,
					description: trimmedDesc,
				} as any,
			});
		} catch {
			await db.team.update({
				where: { id: teamId },
				data: { name: trimmedName },
			});
		}

		// Log activity
		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Team Renamed",
				description: `${caller.user.fullName} renamed team "${oldName}" to "${trimmedName}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_UPDATED,
			{ teamId, name: trimmedName }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		return {
			success: true,
			message: `Team renamed to "${trimmedName}" successfully`,
		};
	} catch (error) {
		console.error("Error updating team name:", error);
		return {
			success: false,
			message: "Failed to update team name",
		};
	}
}

/**
 * Toggle or update team leads for a team
 */
export async function toggleTeamLead({
	teamId,
	workspaceId,
	memberId,
}: {
	teamId: string;
	workspaceId: string;
	memberId: string;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER || caller.role === WorkspaceRoles.ADMIN;
		if (!isOwnerOrAdmin) {
			return {
				success: false,
				message: "Only workspace Owners and Admins can assign or remove Team Leads",
			};
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				members: {
					where: { id: memberId },
					include: { user: true },
				},
			},
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found" };
		}

		const targetMember = team.members[0];
		if (!targetMember) {
			return { success: false, message: "Member does not belong to this team" };
		}

		const currentLeads: string[] = Array.isArray((team as any).leadIds)
			? [...((team as any).leadIds as string[])]
			: [];

		const isCurrentlyLead = currentLeads.includes(memberId);
		if (!isCurrentlyLead && currentLeads.length >= 2) {
			return {
				success: false,
				message: "A team can only have up to 2 team leads",
			};
		}

		const newLeads = isCurrentlyLead
			? currentLeads.filter((id) => id !== memberId)
			: [...currentLeads, memberId];

		try {
			await db.team.update({
				where: { id: teamId },
				data: { leadIds: newLeads } as any,
			});
		} catch {
			return {
				success: false,
				message: "Database schema does not currently support team leads. Please run database migrations.",
			};
		}

		const actionVerb = isCurrentlyLead ? "removed as a Team Lead of" : "designated as a Team Lead of";

		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: isCurrentlyLead ? "Team Lead Removed" : "Team Lead Assigned",
				description: `${caller.user.fullName} ${actionVerb} team "${team.name}" (${targetMember.user.fullName})`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_LEADS_UPDATED,
			{ teamId, leadIds: newLeads, memberId, isLead: !isCurrentlyLead }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		return {
			success: true,
			message: isCurrentlyLead
				? `${targetMember.user.fullName} is no longer a Team Lead`
				: `${targetMember.user.fullName} is now a Team Lead`,
			isLead: !isCurrentlyLead,
			leadIds: newLeads,
		};
	} catch (error) {
		console.error("Error toggling team lead:", error);
		return {
			success: false,
			message: "Failed to update team lead status",
		};
	}
}

/**
 * Add members to a team
 */
export async function addMembersToTeam({
	teamId,
	workspaceId,
	memberIds,
}: {
	teamId: string;
	workspaceId: string;
	memberIds: string[];
}) {
	try {
		if (!memberIds || memberIds.length === 0) {
			return { success: false, message: "No members selected" };
		}

		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found" };
		}

		await ensureTeamSchema();

		let currentMemberIds: string[] = [];
		let currentPendingIds: string[] = [];
		let allowMemberInvites = false;
		try {
			const rows: {
				memberIds?: string[];
				pendingMemberIds?: string[];
				allowMemberInvites?: boolean;
			}[] = await db.$queryRawUnsafe(
				`SELECT "memberIds", "pendingMemberIds", "allowMemberInvites" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0) {
				if (Array.isArray(rows[0].memberIds)) {
					currentMemberIds = rows[0].memberIds;
				}
				if (Array.isArray(rows[0].pendingMemberIds)) {
					currentPendingIds = rows[0].pendingMemberIds;
				}
				allowMemberInvites = Boolean(rows[0].allowMemberInvites);
			}
		} catch {
			// Ignore
		}

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER || caller.role === WorkspaceRoles.ADMIN;
		const leadIds: string[] = Array.isArray((team as any).leadIds)
			? ((team as any).leadIds as string[])
			: [];
		const isTeamLead = leadIds.includes(caller.id);
		const isTeamMember =
			currentMemberIds.includes(caller.id) || caller.teamId === teamId;

		if (!isOwnerOrAdmin && !isTeamLead && !(allowMemberInvites && isTeamMember)) {
			return {
				success: false,
				message: "Only workspace Admins or Team Leads can add members to this team",
			};
		}

		const updatedMemberIds = Array.from(new Set([...currentMemberIds, ...memberIds]));
		const updatedPendingIds = currentPendingIds.filter(
			(id) => !memberIds.includes(id)
		);

		if (updatedMemberIds.length > 0) {
			try {
				const placeholders = updatedMemberIds.map((_, i) => `$${i + 2}`).join(", ");
				await db.$executeRawUnsafe(
					`UPDATE "teams" SET "memberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
					teamId,
					...updatedMemberIds
				);
			} catch (err) {
				console.error("Error updating team memberIds in addMembersToTeam:", err);
			}
		}

		if (updatedPendingIds.length !== currentPendingIds.length) {
			try {
				if (updatedPendingIds.length === 0) {
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "pendingMemberIds" = '{}'::text[] WHERE id = $1`,
						teamId
					);
				} else {
					const placeholders = updatedPendingIds
						.map((_, i) => `$${i + 2}`)
						.join(", ");
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "pendingMemberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
						teamId,
						...updatedPendingIds
					);
				}
			} catch {
				// Ignore
			}
		}

		// Also set teamId on members who do not have a team yet for backwards compatibility
		try {
			await db.member.updateMany({
				where: {
					id: { in: memberIds },
					workspaceId,
					teamId: null,
				},
				data: {
					teamId,
				},
			});
		} catch {
			// Ignore
		}

		// Log activity
		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Members Added to Team",
				description: `${caller.user.fullName} added ${memberIds.length} member(s) to team "${team.name}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_MEMBERS_CHANGED,
			{ teamId, addedMemberIds: memberIds }
		);

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ memberIds }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		revalidatePath("/members");

		return {
			success: true,
			message: `Added ${memberIds.length} member(s) to team "${team.name}"`,
		};
	} catch (error) {
		console.error("Error adding members to team:", error);
		return {
			success: false,
			message: "Failed to add members to team",
		};
	}
}

/**
 * Allow a workspace member to join a team
 */
export async function joinTeam({
	teamId,
	workspaceId,
}: {
	teamId: string;
	workspaceId: string;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized: not a workspace member" };
		}

		if (caller.status !== "ACTIVE") {
			return { success: false, message: "Your membership in this workspace is inactive" };
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
			include: { members: true },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		await ensureTeamSchema();

		let currentStoredIds: string[] = [];
		let currentPendingIds: string[] = [];
		let allowSelfJoin = true;
		let requireApproval = false;
		let notifyLeadsOnJoinLeave = true;
		let storedLeadIds: string[] = [];
		try {
			const rows: {
				memberIds?: string[];
				pendingMemberIds?: string[];
				allowSelfJoin?: boolean;
				requireApproval?: boolean;
				notifyLeadsOnJoinLeave?: boolean;
				leadIds?: string[];
			}[] = await db.$queryRawUnsafe(
				`SELECT "memberIds", "pendingMemberIds", "allowSelfJoin", "requireApproval", "notifyLeadsOnJoinLeave", "leadIds" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0) {
				if (Array.isArray(rows[0].memberIds)) {
					currentStoredIds = rows[0].memberIds;
				}
				if (Array.isArray(rows[0].pendingMemberIds)) {
					currentPendingIds = rows[0].pendingMemberIds;
				}
				if (Array.isArray(rows[0].leadIds)) {
					storedLeadIds = rows[0].leadIds;
				}
				allowSelfJoin = rows[0].allowSelfJoin !== false;
				requireApproval = Boolean(rows[0].requireApproval);
				notifyLeadsOnJoinLeave = rows[0].notifyLeadsOnJoinLeave !== false;
			}
		} catch {
			currentStoredIds = team.members.map((m) => m.id);
		}

		const combinedLeadIds = Array.from(
			new Set([
				...storedLeadIds,
				...(Array.isArray((team as any).leadIds)
					? ((team as any).leadIds as string[])
					: []),
			])
		);

		// Merge with legacy team.members in case some members weren't in memberIds
		const mergedCurrentIds = Array.from(
			new Set([...currentStoredIds, ...team.members.map((m) => m.id)])
		);

		if (mergedCurrentIds.includes(caller.id)) {
			return { success: false, message: "You are already a member of this team" };
		}

		if (!allowSelfJoin) {
			return {
				success: false,
				message:
					"This team is invite-only. Only Team Leads or Workspace Admins can add members.",
			};
		}

		if (requireApproval) {
			if (currentPendingIds.includes(caller.id)) {
				return {
					success: false,
					message: "Your request to join this team is already pending approval",
				};
			}

			const updatedPendingIds = [...currentPendingIds, caller.id];
			try {
				const placeholders = updatedPendingIds
					.map((_, i) => `$${i + 2}`)
					.join(", ");
				await db.$executeRawUnsafe(
					`UPDATE "teams" SET "pendingMemberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
					teamId,
					...updatedPendingIds
				);
			} catch (err) {
				console.error("Error updating pendingMemberIds in joinTeam:", err);
				return {
					success: false,
					message: "Failed to submit join request",
				};
			}

			const activity = await db.activity.create({
				data: {
					type: ActivityType.WORKSPACE,
					title: "Team Join Requested",
					description: `${caller.user.fullName} requested to join team "${team.name}"`,
					workspaceId,
					memberId: caller.id,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});

			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.TEAM_UPDATED,
				{ teamId, pendingMemberIds: updatedPendingIds }
			);

			if (activity) {
				await triggerPusherEvent(
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
					PUSHER_EVENTS.ACTIVITY_CREATED,
					{ activity }
				);
			}

			if (notifyLeadsOnJoinLeave && combinedLeadIds.length > 0) {
				try {
					const leadMembers = await db.member.findMany({
						where: {
							id: { in: combinedLeadIds },
							workspaceId,
						},
						select: { userId: true },
					});
					for (const lm of leadMembers) {
						if (lm.userId && lm.userId !== caller.userId) {
							await triggerPusherEvent(
								PUSHER_CHANNELS.getUserChannel(lm.userId),
								PUSHER_EVENTS.NOTIFICATION_NEW,
								{
									title: "New Team Join Request",
									message: `${caller.user.fullName} requested to join team "${team.name}"`,
									teamId,
								}
							);
						}
					}
				} catch {
					// Ignore notification errors
				}
			}

			revalidatePath("/teams");
			revalidatePath(`/teams/${teamId}`);

			return {
				success: true,
				pending: true,
				message: `Join request sent for "${team.name}". Awaiting approval from a Team Lead or Admin.`,
			};
		}

		const updatedMemberIds = [...mergedCurrentIds, caller.id];
		try {
			const placeholders = updatedMemberIds.map((_, i) => `$${i + 2}`).join(", ");
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "memberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
				teamId,
				...updatedMemberIds
			);
		} catch (err) {
			console.error("Error updating memberIds in joinTeam:", err);
		}

		if (currentPendingIds.includes(caller.id)) {
			const remainingPending = currentPendingIds.filter((id) => id !== caller.id);
			try {
				if (remainingPending.length === 0) {
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "pendingMemberIds" = '{}'::text[] WHERE id = $1`,
						teamId
					);
				} else {
					const placeholders = remainingPending
						.map((_, i) => `$${i + 2}`)
						.join(", ");
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "pendingMemberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
						teamId,
						...remainingPending
					);
				}
			} catch {
				// Ignore
			}
		}

		if (!caller.teamId) {
			try {
				await db.member.update({
					where: { id: caller.id },
					data: { teamId },
				});
			} catch {
				// Ignore
			}
		}

		// Log activity
		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Member Joined Team",
				description: `${caller.user.fullName} joined team "${team.name}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_MEMBERS_CHANGED,
			{ teamId, addedMemberIds: [caller.id] }
		);

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ memberIds: [caller.id] }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (notifyLeadsOnJoinLeave && combinedLeadIds.length > 0) {
			try {
				const leadMembers = await db.member.findMany({
					where: {
						id: { in: combinedLeadIds },
						workspaceId,
					},
					select: { userId: true },
				});
				for (const lm of leadMembers) {
					if (lm.userId && lm.userId !== caller.userId) {
						await triggerPusherEvent(
							PUSHER_CHANNELS.getUserChannel(lm.userId),
							PUSHER_EVENTS.NOTIFICATION_NEW,
							{
								title: "Member Joined Team",
								message: `${caller.user.fullName} joined team "${team.name}"`,
								teamId,
							}
						);
					}
				}
			} catch {
				// Ignore notification errors
			}
		}

		revalidatePath("/teams");
		revalidatePath("/members");

		return {
			success: true,
			message: `You have joined team "${team.name}"`,
		};
	} catch (error) {
		console.error("Error joining team:", error);
		return {
			success: false,
			message: "Failed to join team",
		};
	}
}

/**
 * Remove a member from a team
 */
export async function removeMemberFromTeam({
	teamId,
	workspaceId,
	memberId,
}: {
	teamId: string;
	workspaceId: string;
	memberId: string;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
			include: { members: true },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found" };
		}

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER || caller.role === WorkspaceRoles.ADMIN;
		const leadIds: string[] = Array.isArray((team as any).leadIds)
			? ((team as any).leadIds as string[])
			: [];
		const isTeamLead = leadIds.includes(caller.id);
		const isSelf = caller.id === memberId;

		if (!isOwnerOrAdmin && !isTeamLead && !isSelf) {
			return {
				success: false,
				message: "Only workspace Admins or Team Leads can remove members from this team",
			};
		}

		const member = await db.member.findUnique({
			where: { id: memberId },
			include: { user: true },
		});

		if (!member) {
			return { success: false, message: "Member not found" };
		}

		await ensureTeamSchema();

		let currentMemberIds: string[] = [];
		try {
			const rows: { memberIds: string[] }[] = await db.$queryRawUnsafe(
				`SELECT "memberIds" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0 && Array.isArray(rows[0].memberIds)) {
				currentMemberIds = rows[0].memberIds;
			}
		} catch {
			currentMemberIds = team.members?.map((m: any) => m.id) || [];
		}

		const mergedCurrentIds = Array.from(
			new Set([...currentMemberIds, ...(team.members?.map((m: any) => m.id) || [])])
		);

		const isMemberOfThisTeam = mergedCurrentIds.includes(memberId) || member.teamId === teamId;
		if (!isMemberOfThisTeam) {
			return { success: false, message: "Member is not in this team" };
		}

		const updatedMemberIds = mergedCurrentIds.filter((id) => id !== memberId);

		try {
			if (updatedMemberIds.length === 0) {
				await db.$executeRawUnsafe(
					`UPDATE "teams" SET "memberIds" = '{}'::text[] WHERE id = $1`,
					teamId
				);
			} else {
				const placeholders = updatedMemberIds.map((_, i) => `$${i + 2}`).join(", ");
				await db.$executeRawUnsafe(
					`UPDATE "teams" SET "memberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
					teamId,
					...updatedMemberIds
				);
			}
		} catch (err) {
			console.error("Error removing memberId from team:", err);
		}

		// If legacy teamId points to this team, unassign
		if (member.teamId === teamId) {
			try {
				await db.member.update({
					where: { id: memberId },
					data: { teamId: null },
				});
			} catch {
				// Ignore
			}
		}

		// If member was a team lead, also remove from leadIds
		let storedLeadIds: string[] = [];
		let notifyLeadsOnJoinLeave = true;
		try {
			const rows: { leadIds: string[]; notifyLeadsOnJoinLeave?: boolean }[] =
				await db.$queryRawUnsafe(
					`SELECT "leadIds", "notifyLeadsOnJoinLeave" FROM "teams" WHERE id = $1`,
					teamId
				);
			if (rows.length > 0) {
				if (Array.isArray(rows[0].leadIds)) {
					storedLeadIds = rows[0].leadIds;
				}
				notifyLeadsOnJoinLeave = rows[0].notifyLeadsOnJoinLeave !== false;
			}
		} catch {
			storedLeadIds = Array.isArray((team as any).leadIds)
				? ((team as any).leadIds as string[])
				: [];
		}

		const combinedLeadIds = Array.from(
			new Set([
				...storedLeadIds,
				...(Array.isArray((team as any).leadIds)
					? ((team as any).leadIds as string[])
					: []),
			])
		);

		const idsToRemove = new Set([memberId, member.userId].filter(Boolean));
		const wasLead = combinedLeadIds.some((id) => idsToRemove.has(id));
		const updatedLeadIds = combinedLeadIds.filter((id) => !idsToRemove.has(id));

		if (wasLead || combinedLeadIds.length !== updatedLeadIds.length) {
			try {
				await db.team.update({
					where: { id: teamId },
					data: { leadIds: updatedLeadIds } as any,
				});
			} catch {
				// Ignore if Prisma schema doesn't yet recognize leadIds
			}

			try {
				if (updatedLeadIds.length === 0) {
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "leadIds" = '{}'::text[] WHERE id = $1`,
						teamId
					);
				} else {
					const placeholders = updatedLeadIds
						.map((_, i) => `$${i + 2}`)
						.join(", ");
					await db.$executeRawUnsafe(
						`UPDATE "teams" SET "leadIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
						teamId,
						...updatedLeadIds
					);
				}
			} catch (err) {
				console.error("Error updating leadIds in removeMemberFromTeam:", err);
			}

			// Broadcast team leads updated event
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.TEAM_LEADS_UPDATED,
				{ teamId, leadIds: updatedLeadIds }
			);
		}

		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: isSelf ? "Member Left Team" : "Member Removed from Team",
				description: isSelf
					? `${caller.user.fullName} left team "${team.name}"`
					: `${caller.user.fullName} removed ${member.user.fullName} from team "${team.name}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_MEMBERS_CHANGED,
			{ teamId, removedMemberId: memberId }
		);

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ memberIds: [memberId] }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		if (isSelf && notifyLeadsOnJoinLeave && updatedLeadIds.length > 0) {
			try {
				const leadMembers = await db.member.findMany({
					where: {
						id: { in: updatedLeadIds },
						workspaceId,
					},
					select: { userId: true },
				});
				for (const lm of leadMembers) {
					if (lm.userId && lm.userId !== caller.userId) {
						await triggerPusherEvent(
							PUSHER_CHANNELS.getUserChannel(lm.userId),
							PUSHER_EVENTS.NOTIFICATION_NEW,
							{
								title: "Member Left Team",
								message: `${caller.user.fullName} left team "${team.name}"`,
								teamId,
							}
						);
					}
				}
			} catch {
				// Ignore notification errors
			}
		}

		revalidatePath("/teams");
		revalidatePath(`/teams/${teamId}`);
		revalidatePath("/members");

		return {
			success: true,
			message: isSelf
				? `You have left team "${team.name}"`
				: `${member.user.fullName} removed from team "${team.name}"`,
		};
	} catch (error) {
		console.error("Error removing member from team:", error);
		return {
			success: false,
			message: "Failed to remove member from team",
		};
	}
}

/**
 * Delete a team, unlinking all of its members so they remain in the workspace
 */
export async function deleteTeam({
	teamId,
	workspaceId,
}: {
	teamId: string;
	workspaceId: string;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		const team = await db.team.findUnique({
			where: { id: teamId },
			include: {
				_count: {
					select: { members: true },
				},
			},
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		await ensureTeamSchema();

		let storedLeadIds: string[] = [];
		try {
			const rows: { leadIds?: string[] }[] = await db.$queryRawUnsafe(
				`SELECT "leadIds" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0 && Array.isArray(rows[0].leadIds)) {
				storedLeadIds = rows[0].leadIds;
			}
		} catch {
			// Fallback to model fields
		}

		const combinedLeadIds = Array.from(
			new Set([
				...storedLeadIds,
				...(Array.isArray((team as any).leadIds)
					? ((team as any).leadIds as string[])
					: []),
			])
		);

		const isTeamLead =
			combinedLeadIds.includes(caller.id) ||
			Boolean(caller.userId && combinedLeadIds.includes(caller.userId));
		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER ||
			caller.role === WorkspaceRoles.ADMIN;

		if (!isOwnerOrAdmin && !isTeamLead) {
			return {
				success: false,
				message:
					"Only Team Leads, Workspace Owners, and Workspace Admins can delete teams",
			};
		}

		const teamName = team.name;

		// Unlink all members from this team
		await db.member.updateMany({
			where: { teamId },
			data: { teamId: null },
		});

		// Delete the team
		await db.team.delete({
			where: { id: teamId },
		});

		// Log activity
		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Team Deleted",
				description: `${caller.user.fullName} deleted team "${teamName}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_DELETED,
			{ teamId, name: teamName }
		);

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.MEMBERS_UPDATED,
			{ teamId }
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		revalidatePath("/members");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: `Team "${teamName}" was deleted successfully`,
		};
	} catch (error) {
		console.error("Error deleting team:", error);
		return {
			success: false,
			message: "Failed to delete team",
		};
	}
}

/**
 * Get a single team by ID with its full members, leads, tasks, and caller role
 */
export async function getTeamById(
	teamId: string,
	workspaceId: string
): Promise<{
	success: boolean;
	message?: string;
	team: TeamWithMembers | null;
	currentMemberRole?: WorkspaceRoles;
	currentMemberId?: string;
}> {
	try {
		if (!teamId || !workspaceId) {
			return {
				success: false,
				message: "Team ID and Workspace ID are required",
				team: null,
			};
		}

		await ensureTeamSchema();

		const session = await auth();
		const userId = session?.user?.id;
		let currentMemberRole: WorkspaceRoles | undefined;
		let currentMemberId: string | undefined;

		if (userId) {
			const currentMember = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
				select: {
					id: true,
					role: true,
				},
			});
			if (currentMember) {
				currentMemberRole = currentMember.role;
				currentMemberId = currentMember.id;
			}
		}

		const teamRaw = await db.team.findUnique({
			where: {
				id: teamId,
				workspaceId,
			},
			include: {
				members: {
					include: {
						user: true,
					},
				},
			},
		});

		if (!teamRaw) {
			return {
				success: false,
				message: "Team not found",
				team: null,
			};
		}

		// Query stored memberIds and settings from teams table
		let storedMemberIds: string[] = [];
		let visibility: "PUBLIC" | "PRIVATE" = "PUBLIC";
		let allowSelfJoin = true;
		let requireApproval = false;
		let allowMemberTaskCreation = false;
		let autoAssignAllMembers = false;
		let allowMemberInvites = false;
		let hideTasksFromNonMembers = false;
		let notifyAllOnNewTask = true;
		let notifyLeadsOnJoinLeave = true;
		let pendingMemberIds: string[] = [];
		try {
			const rows: {
				memberIds?: string[];
				visibility?: string;
				allowSelfJoin?: boolean;
				requireApproval?: boolean;
				allowMemberTaskCreation?: boolean;
				autoAssignAllMembers?: boolean;
				allowMemberInvites?: boolean;
				hideTasksFromNonMembers?: boolean;
				notifyAllOnNewTask?: boolean;
				notifyLeadsOnJoinLeave?: boolean;
				pendingMemberIds?: string[];
			}[] = await db.$queryRawUnsafe(
				`SELECT "memberIds", "visibility", "allowSelfJoin", "requireApproval", "allowMemberTaskCreation", "autoAssignAllMembers", "allowMemberInvites", "hideTasksFromNonMembers", "notifyAllOnNewTask", "notifyLeadsOnJoinLeave", "pendingMemberIds" FROM "teams" WHERE "id" = $1 AND "workspaceId" = $2`,
				teamId,
				workspaceId
			);
			if (rows.length > 0) {
				if (Array.isArray(rows[0].memberIds)) {
					storedMemberIds = rows[0].memberIds;
				}
				visibility = rows[0].visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
				allowSelfJoin = rows[0].allowSelfJoin !== false;
				requireApproval = Boolean(rows[0].requireApproval);
				allowMemberTaskCreation = Boolean(rows[0].allowMemberTaskCreation);
				autoAssignAllMembers = Boolean(rows[0].autoAssignAllMembers);
				allowMemberInvites = Boolean(rows[0].allowMemberInvites);
				hideTasksFromNonMembers = Boolean(rows[0].hideTasksFromNonMembers);
				notifyAllOnNewTask = rows[0].notifyAllOnNewTask !== false;
				notifyLeadsOnJoinLeave = rows[0].notifyLeadsOnJoinLeave !== false;
				if (Array.isArray(rows[0].pendingMemberIds)) {
					pendingMemberIds = rows[0].pendingMemberIds;
				}
			}
		} catch (err) {
			console.error("Error querying team memberIds and settings:", err);
		}

		const legacyMemberIds = teamRaw.members.map((m) => m.id);
		const combinedMemberIds = Array.from(
			new Set([...storedMemberIds, ...legacyMemberIds])
		);

		const leadIds: string[] = Array.isArray((teamRaw as any).leadIds)
			? ((teamRaw as any).leadIds as string[])
			: [];

		const isCallerAdmin =
			currentMemberRole === WorkspaceRoles.OWNER ||
			currentMemberRole === WorkspaceRoles.ADMIN;
		const isCallerMemberOrLead = Boolean(
			currentMemberId &&
				(combinedMemberIds.includes(currentMemberId) ||
					leadIds.includes(currentMemberId) ||
					pendingMemberIds.includes(currentMemberId))
		);

		if (visibility === "PRIVATE" && !isCallerAdmin && !isCallerMemberOrLead) {
			return {
				success: false,
				message: "You do not have permission to view this private team",
				team: null,
			};
		}

		// Fetch all member records for these IDs (and any pending member IDs)
		const filteredPendingIds = pendingMemberIds.filter(
			(id) => !combinedMemberIds.includes(id)
		);
		const allTargetMemberIds = Array.from(
			new Set([...combinedMemberIds, ...filteredPendingIds])
		);

		const fullMembersRaw = await db.member.findMany({
			where: {
				id: { in: allTargetMemberIds },
				workspaceId,
			},
			include: {
				user: true,
			},
		});

		const members: TeamMemberItem[] = fullMembersRaw
			.filter((m) => combinedMemberIds.includes(m.id))
			.map((member) => ({
				...member,
				isLead: leadIds.includes(member.id),
			}));

		const pendingMembers: TeamMemberItem[] = fullMembersRaw
			.filter((m) => filteredPendingIds.includes(m.id))
			.map((member) => ({
				...member,
				isLead: false,
			}));

		const leads = members.filter((m) => m.isLead);

		const isCallerActiveMemberOrLead = Boolean(
			currentMemberId &&
				(combinedMemberIds.includes(currentMemberId) ||
					leadIds.includes(currentMemberId))
		);
		const canViewTasks =
			!hideTasksFromNonMembers || isCallerAdmin || isCallerActiveMemberOrLead;

		// Fetch all team tasks
		let teamTasks: any[] = [];
		if (canViewTasks) {
			try {
				teamTasks = await db.task.findMany({
					where: {
						teamId,
						workspaceId,
					},
					include: {
						project: {
							select: {
								id: true,
								title: true,
								startPeriod: true,
								endPeriod: true,
								status: true,
							},
						},
						taskMembers: {
							include: {
								member: {
									include: {
										user: true,
									},
								},
							},
						},
						milestones: {
							orderBy: {
								dueDate: "asc",
							},
						},
						resources: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				});
			} catch (err) {
				console.error("Error querying team tasks:", err);
			}
		}

		const team: TeamWithMembers = {
			id: teamRaw.id,
			name: teamRaw.name,
			description: teamRaw.description,
			workspaceId: teamRaw.workspaceId,
			visibility,
			allowSelfJoin,
			requireApproval,
			allowMemberTaskCreation,
			autoAssignAllMembers,
			allowMemberInvites,
			hideTasksFromNonMembers,
			notifyAllOnNewTask,
			notifyLeadsOnJoinLeave,
			leadIds,
			memberIds: combinedMemberIds,
			pendingMemberIds: pendingMembers.map((m) => m.id),
			members,
			leads,
			pendingMembers,
			tasks: teamTasks,
			_count: {
				members: members.length,
				tasks: teamTasks.length,
			},
		};

		return {
			success: true,
			team,
			currentMemberRole,
			currentMemberId,
		};
	} catch (error) {
		console.error("Error fetching team by ID:", error);
		return {
			success: false,
			message: "Failed to fetch team",
			team: null,
		};
	}
}

/**
 * Update team description
 */
export async function updateTeamDescription({
	teamId,
	workspaceId,
	description,
}: {
	teamId: string;
	workspaceId: string;
	description: string;
}): Promise<{
	success: boolean;
	message: string;
}> {
	try {
		if (!teamId || !workspaceId) {
			return {
				success: false,
				message: "Team ID and Workspace ID are required",
			};
		}

		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return {
				success: false,
				message: "Unauthorized: Caller must be a member of this workspace",
			};
		}

		await ensureTeamSchema();

		const team = await db.team.findUnique({
			where: { id: teamId, workspaceId },
			select: { id: true, name: true, leadIds: true },
		});

		if (!team) {
			return {
				success: false,
				message: "Team not found",
			};
		}

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER || caller.role === WorkspaceRoles.ADMIN;
		const isTeamLead = Array.isArray(team.leadIds) && team.leadIds.includes(caller.id);

		if (!isOwnerOrAdmin && !isTeamLead) {
			return {
				success: false,
				message: "Unauthorized: Only team leads or workspace admins can edit team description",
			};
		}

		await db.team.update({
			where: { id: teamId },
			data: { description: description.trim() },
		});

		revalidatePath("/teams");
		revalidatePath(`/teams/${teamId}`);

		return {
			success: true,
			message: "Team description updated successfully",
		};
	} catch (error) {
		console.error("Error updating team description:", error);
		return {
			success: false,
			message: "Failed to update team description",
		};
	}
}

/**
 * Update team settings (visibility, allowSelfJoin, requireApproval)
 * Restricted to Team Leads, Workspace Owners, and Workspace Admins
 */
export async function updateTeamSettings({
	teamId,
	workspaceId,
	visibility,
	allowSelfJoin,
	requireApproval,
	allowMemberTaskCreation,
	autoAssignAllMembers,
	allowMemberInvites,
	hideTasksFromNonMembers,
	notifyAllOnNewTask,
	notifyLeadsOnJoinLeave,
}: {
	teamId: string;
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
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		await ensureTeamSchema();

		const team = await db.team.findUnique({
			where: { id: teamId },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		let storedLeadIds: string[] = [];
		try {
			const rows: { leadIds?: string[] }[] = await db.$queryRawUnsafe(
				`SELECT "leadIds" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0 && Array.isArray(rows[0].leadIds)) {
				storedLeadIds = rows[0].leadIds;
			}
		} catch {
			// Ignore
		}

		const combinedLeadIds = Array.from(
			new Set([
				...storedLeadIds,
				...(Array.isArray((team as any).leadIds)
					? ((team as any).leadIds as string[])
					: []),
			])
		);

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER ||
			caller.role === WorkspaceRoles.ADMIN;
		const isTeamLead =
			combinedLeadIds.includes(caller.id) ||
			Boolean(caller.userId && combinedLeadIds.includes(caller.userId));

		if (!isOwnerOrAdmin && !isTeamLead) {
			return {
				success: false,
				message:
					"Only Team Leads, Workspace Owners, and Workspace Admins can update team settings",
			};
		}

		let currentVisibility: "PUBLIC" | "PRIVATE" = "PUBLIC";
		let currentAllowSelfJoin = true;
		let currentRequireApproval = false;
		let currentAllowMemberTaskCreation = false;
		let currentAutoAssignAllMembers = false;
		let currentAllowMemberInvites = false;
		let currentHideTasksFromNonMembers = false;
		let currentNotifyAllOnNewTask = true;
		let currentNotifyLeadsOnJoinLeave = true;
		try {
			const rows: {
				visibility?: string;
				allowSelfJoin?: boolean;
				requireApproval?: boolean;
				allowMemberTaskCreation?: boolean;
				autoAssignAllMembers?: boolean;
				allowMemberInvites?: boolean;
				hideTasksFromNonMembers?: boolean;
				notifyAllOnNewTask?: boolean;
				notifyLeadsOnJoinLeave?: boolean;
			}[] = await db.$queryRawUnsafe(
				`SELECT "visibility", "allowSelfJoin", "requireApproval", "allowMemberTaskCreation", "autoAssignAllMembers", "allowMemberInvites", "hideTasksFromNonMembers", "notifyAllOnNewTask", "notifyLeadsOnJoinLeave" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0) {
				currentVisibility =
					rows[0].visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
				currentAllowSelfJoin = rows[0].allowSelfJoin !== false;
				currentRequireApproval = Boolean(rows[0].requireApproval);
				currentAllowMemberTaskCreation = Boolean(
					rows[0].allowMemberTaskCreation
				);
				currentAutoAssignAllMembers = Boolean(rows[0].autoAssignAllMembers);
				currentAllowMemberInvites = Boolean(rows[0].allowMemberInvites);
				currentHideTasksFromNonMembers = Boolean(
					rows[0].hideTasksFromNonMembers
				);
				currentNotifyAllOnNewTask = rows[0].notifyAllOnNewTask !== false;
				currentNotifyLeadsOnJoinLeave =
					rows[0].notifyLeadsOnJoinLeave !== false;
			}
		} catch {
			// Ignore
		}

		const nextVisibility =
			visibility !== undefined
				? visibility === "PRIVATE"
					? "PRIVATE"
					: "PUBLIC"
				: currentVisibility;
		const nextAllowSelfJoin =
			allowSelfJoin !== undefined
				? Boolean(allowSelfJoin)
				: currentAllowSelfJoin;
		const nextRequireApproval =
			requireApproval !== undefined
				? Boolean(requireApproval)
				: currentRequireApproval;
		const nextAllowMemberTaskCreation =
			allowMemberTaskCreation !== undefined
				? Boolean(allowMemberTaskCreation)
				: currentAllowMemberTaskCreation;
		const nextAutoAssignAllMembers =
			autoAssignAllMembers !== undefined
				? Boolean(autoAssignAllMembers)
				: currentAutoAssignAllMembers;
		const nextAllowMemberInvites =
			allowMemberInvites !== undefined
				? Boolean(allowMemberInvites)
				: currentAllowMemberInvites;
		const nextHideTasksFromNonMembers =
			hideTasksFromNonMembers !== undefined
				? Boolean(hideTasksFromNonMembers)
				: currentHideTasksFromNonMembers;
		const nextNotifyAllOnNewTask =
			notifyAllOnNewTask !== undefined
				? Boolean(notifyAllOnNewTask)
				: currentNotifyAllOnNewTask;
		const nextNotifyLeadsOnJoinLeave =
			notifyLeadsOnJoinLeave !== undefined
				? Boolean(notifyLeadsOnJoinLeave)
				: currentNotifyLeadsOnJoinLeave;

		await db.$executeRawUnsafe(
			`UPDATE "teams" SET "visibility" = $2, "allowSelfJoin" = $3, "requireApproval" = $4, "allowMemberTaskCreation" = $5, "autoAssignAllMembers" = $6, "allowMemberInvites" = $7, "hideTasksFromNonMembers" = $8, "notifyAllOnNewTask" = $9, "notifyLeadsOnJoinLeave" = $10 WHERE id = $1`,
			teamId,
			nextVisibility,
			nextAllowSelfJoin,
			nextRequireApproval,
			nextAllowMemberTaskCreation,
			nextAutoAssignAllMembers,
			nextAllowMemberInvites,
			nextHideTasksFromNonMembers,
			nextNotifyAllOnNewTask,
			nextNotifyLeadsOnJoinLeave
		);

		const activity = await db.activity.create({
			data: {
				type: ActivityType.WORKSPACE,
				title: "Team Settings Updated",
				description: `${caller.user.fullName} updated settings for team "${team.name}"`,
				workspaceId,
				memberId: caller.id,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_UPDATED,
			{
				teamId,
				visibility: nextVisibility,
				allowSelfJoin: nextAllowSelfJoin,
				requireApproval: nextRequireApproval,
				allowMemberTaskCreation: nextAllowMemberTaskCreation,
				autoAssignAllMembers: nextAutoAssignAllMembers,
				allowMemberInvites: nextAllowMemberInvites,
				hideTasksFromNonMembers: nextHideTasksFromNonMembers,
				notifyAllOnNewTask: nextNotifyAllOnNewTask,
				notifyLeadsOnJoinLeave: nextNotifyLeadsOnJoinLeave,
			}
		);

		if (activity) {
			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.ACTIVITY_CREATED,
				{ activity }
			);
		}

		revalidatePath("/teams");
		revalidatePath(`/teams/${teamId}`);

		return {
			success: true,
			message: "Team settings updated successfully",
			settings: {
				visibility: nextVisibility,
				allowSelfJoin: nextAllowSelfJoin,
				requireApproval: nextRequireApproval,
				allowMemberTaskCreation: nextAllowMemberTaskCreation,
				autoAssignAllMembers: nextAutoAssignAllMembers,
				allowMemberInvites: nextAllowMemberInvites,
				hideTasksFromNonMembers: nextHideTasksFromNonMembers,
				notifyAllOnNewTask: nextNotifyAllOnNewTask,
				notifyLeadsOnJoinLeave: nextNotifyLeadsOnJoinLeave,
			},
		};
	} catch (error) {
		console.error("Error updating team settings:", error);
		return {
			success: false,
			message: "Failed to update team settings",
		};
	}
}

/**
 * Approve or reject a pending team join request
 * Restricted to Team Leads, Workspace Owners, and Workspace Admins
 */
export async function handleTeamJoinRequest({
	teamId,
	workspaceId,
	memberId,
	action,
}: {
	teamId: string;
	workspaceId: string;
	memberId: string;
	action: "APPROVE" | "REJECT";
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		await ensureTeamSchema();

		const team = await db.team.findUnique({
			where: { id: teamId },
			include: { members: true },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		let storedLeadIds: string[] = [];
		let currentMemberIds: string[] = [];
		let currentPendingIds: string[] = [];
		try {
			const rows: {
				leadIds?: string[];
				memberIds?: string[];
				pendingMemberIds?: string[];
			}[] = await db.$queryRawUnsafe(
				`SELECT "leadIds", "memberIds", "pendingMemberIds" FROM "teams" WHERE id = $1`,
				teamId
			);
			if (rows.length > 0) {
				if (Array.isArray(rows[0].leadIds)) {
					storedLeadIds = rows[0].leadIds;
				}
				if (Array.isArray(rows[0].memberIds)) {
					currentMemberIds = rows[0].memberIds;
				}
				if (Array.isArray(rows[0].pendingMemberIds)) {
					currentPendingIds = rows[0].pendingMemberIds;
				}
			}
		} catch {
			// Ignore
		}

		const combinedLeadIds = Array.from(
			new Set([
				...storedLeadIds,
				...(Array.isArray((team as any).leadIds)
					? ((team as any).leadIds as string[])
					: []),
			])
		);

		const isOwnerOrAdmin =
			caller.role === WorkspaceRoles.OWNER ||
			caller.role === WorkspaceRoles.ADMIN;
		const isTeamLead =
			combinedLeadIds.includes(caller.id) ||
			Boolean(caller.userId && combinedLeadIds.includes(caller.userId));

		if (!isOwnerOrAdmin && !isTeamLead) {
			return {
				success: false,
				message:
					"Only Team Leads, Workspace Owners, and Workspace Admins can review join requests",
			};
		}

		const targetMember = await db.member.findUnique({
			where: { id: memberId },
			include: { user: true },
		});

		if (!targetMember || targetMember.workspaceId !== workspaceId) {
			return { success: false, message: "Member not found in this workspace" };
		}

		const updatedPendingIds = currentPendingIds.filter((id) => id !== memberId);
		if (updatedPendingIds.length === 0) {
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "pendingMemberIds" = '{}'::text[] WHERE id = $1`,
				teamId
			);
		} else {
			const placeholders = updatedPendingIds
				.map((_, i) => `$${i + 2}`)
				.join(", ");
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "pendingMemberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
				teamId,
				...updatedPendingIds
			);
		}

		if (action === "APPROVE") {
			const mergedCurrentIds = Array.from(
				new Set([
					...currentMemberIds,
					...team.members.map((m) => m.id),
					memberId,
				])
			);
			const placeholders = mergedCurrentIds
				.map((_, i) => `$${i + 2}`)
				.join(", ");
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "memberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
				teamId,
				...mergedCurrentIds
			);

			if (!targetMember.teamId) {
				try {
					await db.member.update({
						where: { id: memberId },
						data: { teamId },
					});
				} catch {
					// Ignore
				}
			}

			const activity = await db.activity.create({
				data: {
					type: ActivityType.WORKSPACE,
					title: "Team Join Request Approved",
					description: `${caller.user.fullName} approved ${targetMember.user.fullName}'s request to join team "${team.name}"`,
					workspaceId,
					memberId: caller.id,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});

			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.TEAM_MEMBERS_CHANGED,
				{ teamId, addedMemberIds: [memberId] }
			);

			await triggerPusherEvent(
				PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
				PUSHER_EVENTS.MEMBERS_UPDATED,
				{ memberIds: [memberId] }
			);

			if (activity) {
				await triggerPusherEvent(
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
					PUSHER_EVENTS.ACTIVITY_CREATED,
					{ activity }
				);
			}
		} else {
			const activity = await db.activity.create({
				data: {
					type: ActivityType.WORKSPACE,
					title: "Team Join Request Declined",
					description: `${caller.user.fullName} declined ${targetMember.user.fullName}'s request to join team "${team.name}"`,
					workspaceId,
					memberId: caller.id,
				},
				include: {
					member: {
						include: {
							user: true,
						},
					},
				},
			});

			if (activity) {
				await triggerPusherEvent(
					PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
					PUSHER_EVENTS.ACTIVITY_CREATED,
					{ activity }
				);
			}
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_UPDATED,
			{ teamId, pendingMemberIds: updatedPendingIds }
		);

		revalidatePath("/teams");
		revalidatePath(`/teams/${teamId}`);
		revalidatePath("/members");

		return {
			success: true,
			message:
				action === "APPROVE"
					? `Approved ${targetMember.user.fullName} to join "${team.name}"`
					: `Declined ${targetMember.user.fullName}'s request to join "${team.name}"`,
		};
	} catch (error) {
		console.error("Error handling team join request:", error);
		return {
			success: false,
			message: "Failed to process team join request",
		};
	}
}

/**
 * Cancel a caller's own pending team join request
 */
export async function cancelTeamJoinRequest({
	teamId,
	workspaceId,
}: {
	teamId: string;
	workspaceId: string;
}) {
	try {
		const caller = await getCallerWorkspaceMember(workspaceId);
		if (!caller) {
			return { success: false, message: "Unauthorized" };
		}

		await ensureTeamSchema();

		const team = await db.team.findUnique({
			where: { id: teamId },
		});

		if (!team || team.workspaceId !== workspaceId) {
			return { success: false, message: "Team not found in this workspace" };
		}

		let currentPendingIds: string[] = [];
		try {
			const rows: { pendingMemberIds?: string[] }[] =
				await db.$queryRawUnsafe(
					`SELECT "pendingMemberIds" FROM "teams" WHERE id = $1`,
					teamId
				);
			if (rows.length > 0 && Array.isArray(rows[0].pendingMemberIds)) {
				currentPendingIds = rows[0].pendingMemberIds;
			}
		} catch {
			// Ignore
		}

		if (!currentPendingIds.includes(caller.id)) {
			return {
				success: false,
				message: "No pending join request found for this team",
			};
		}

		const updatedPendingIds = currentPendingIds.filter(
			(id) => id !== caller.id
		);
		if (updatedPendingIds.length === 0) {
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "pendingMemberIds" = '{}'::text[] WHERE id = $1`,
				teamId
			);
		} else {
			const placeholders = updatedPendingIds
				.map((_, i) => `$${i + 2}`)
				.join(", ");
			await db.$executeRawUnsafe(
				`UPDATE "teams" SET "pendingMemberIds" = ARRAY[${placeholders}]::text[] WHERE id = $1`,
				teamId,
				...updatedPendingIds
			);
		}

		await triggerPusherEvent(
			PUSHER_CHANNELS.getWorkspaceChannel(workspaceId),
			PUSHER_EVENTS.TEAM_UPDATED,
			{ teamId, pendingMemberIds: updatedPendingIds }
		);

		revalidatePath("/teams");
		revalidatePath(`/teams/${teamId}`);

		return {
			success: true,
			message: `Cancelled join request for "${team.name}"`,
		};
	} catch (error) {
		console.error("Error cancelling team join request:", error);
		return {
			success: false,
			message: "Failed to cancel join request",
		};
	}
}
