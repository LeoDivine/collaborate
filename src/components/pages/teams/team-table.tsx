"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaginationControls from "@/components/shared/pagination-controls";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import TeamMemberOverview from "./team-member-overview";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Crown,
	Diamond,
	ExternalLink,
	EyeOff,
	ListFilter,
	Loader2,
	LoaderCircle,
	Lock,
	LogOut,
	MoreHorizontal,
	RotateCcw,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import {
	cancelTeamJoinRequest,
	deleteTeam,
	joinTeam,
	removeMemberFromTeam,
} from "@/lib/services/team.services";
import { toast } from "sonner";
import type { TeamWithMembers } from "@/lib/types";
import { WorkspaceRoles } from "../../../../generated/prisma/enums";

export type TeamSortField = "name" | "members" | "leads" | "memberCount" | "tasks";
export type TeamSortDirection = "asc" | "desc" | null;
export type TeamGroupByField = "none" | "leads" | "membership";

export interface TeamColumnVisibility {
	members: boolean;
	leads: boolean;
	description: boolean;
	memberCount: boolean;
	tasks: boolean;
}

interface GroupedTeamSection {
	id: string;
	label: string;
	teams: TeamWithMembers[];
}

interface TeamTableProps {
	teams: TeamWithMembers[];
	callerRole?: WorkspaceRoles;
	callerMemberId?: string;
	workspaceId?: string;
	pageSize?: number;
	groupBy?: TeamGroupByField;
	visibleColumns?: TeamColumnVisibility;
	isFilterActive?: boolean;
	onResetFilters?: () => void;
	onSelectTeam: (team: TeamWithMembers) => void;
	onDeleteTeam?: (team: TeamWithMembers) => void;
	onAddMembers?: (team: TeamWithMembers) => void;
	onTeamUpdated?: () => void;
}

export function TeamTable({
	teams,
	callerRole,
	callerMemberId,
	workspaceId,
	pageSize = 20,
	groupBy = "none",
	visibleColumns = {
		members: true,
		leads: true,
		description: false,
		memberCount: true,
		tasks: true,
	},
	isFilterActive = false,
	onResetFilters,
	onSelectTeam,
	onDeleteTeam,
	onAddMembers,
	onTeamUpdated,
}: TeamTableProps) {
	const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
	const [teamToLeave, setTeamToLeave] = useState<TeamWithMembers | null>(null);
	const [isLeaving, setIsLeaving] = useState(false);

	// Sorting & Collapsing states
	const [sortField, setSortField] = useState<TeamSortField | null>(null);
	const [sortDirection, setSortDirection] = useState<TeamSortDirection>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

	// Selection & Bulk actions
	const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);

	const isOwnerOrAdmin =
		callerRole === WorkspaceRoles.OWNER || callerRole === WorkspaceRoles.ADMIN;

	const checkCanManage = (team: TeamWithMembers) => {
		if (isOwnerOrAdmin) return true;
		if (
			callerMemberId &&
			(team.leadIds.includes(callerMemberId) ||
				team.leads.some((l) => l.id === callerMemberId))
		)
			return true;
		return false;
	};

	const checkCanDelete = (team: TeamWithMembers) => {
		if (isOwnerOrAdmin) return true;
		if (
			callerMemberId &&
			(team.leadIds.includes(callerMemberId) ||
				team.leads.some((l) => l.id === callerMemberId))
		)
			return true;
		return false;
	};

	const handleColumnSort = (field: TeamSortField) => {
		if (sortField !== field) {
			setSortField(field);
			setSortDirection("asc");
		} else if (sortDirection === "asc") {
			setSortDirection("desc");
		} else if (sortDirection === "desc") {
			setSortField(null);
			setSortDirection(null);
		}
	};

	const toggleGroupCollapse = (groupId: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Sorted teams computation
	const sortedTeams = useMemo(() => {
		if (!sortField || !sortDirection) return teams;

		return [...teams].sort((a, b) => {
			let comparison = 0;

			if (sortField === "name") {
				comparison = a.name.localeCompare(b.name);
			} else if (sortField === "members" || sortField === "memberCount") {
				comparison = a.members.length - b.members.length;
			} else if (sortField === "leads") {
				comparison = a.leads.length - b.leads.length;
			} else if (sortField === "tasks") {
				comparison = (a._count?.tasks ?? 0) - (b._count?.tasks ?? 0);
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [teams, sortField, sortDirection]);

	// Pagination computation
	const searchParams = useSearchParams();
	const rawPage = Number(searchParams?.get("page") ?? "1");
	const currentPage = Math.max(Number.isNaN(rawPage) ? 1 : rawPage, 1);
	const totalPages = Math.max(1, Math.ceil(sortedTeams.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);

	const paginatedTeams = useMemo(() => {
		const start = (safePage - 1) * pageSize;
		return sortedTeams.slice(start, start + pageSize);
	}, [sortedTeams, safePage, pageSize]);

	// Grouped teams computation
	const groupedTeamSections = useMemo((): GroupedTeamSection[] => {
		if (groupBy === "none") {
			return [
				{
					id: "all",
					label: "All Teams",
					teams: paginatedTeams,
				},
			];
		}

		if (groupBy === "leads") {
			const withLeads = paginatedTeams.filter((t) => t.leads.length > 0);
			const withoutLeads = paginatedTeams.filter((t) => t.leads.length === 0);
			const sections: GroupedTeamSection[] = [];
			if (withLeads.length > 0) {
				sections.push({
					id: "has-leads",
					label: "With Team Leads",
					teams: withLeads,
				});
			}
			if (withoutLeads.length > 0) {
				sections.push({
					id: "no-leads",
					label: "Without Team Leads",
					teams: withoutLeads,
				});
			}
			return sections;
		}

		if (groupBy === "membership") {
			const myTeamsList = paginatedTeams.filter(
				(t) => callerMemberId && t.members.some((m) => m.id === callerMemberId)
			);
			const otherTeamsList = paginatedTeams.filter(
				(t) => !callerMemberId || !t.members.some((m) => m.id === callerMemberId)
			);
			const sections: GroupedTeamSection[] = [];
			if (myTeamsList.length > 0) {
				sections.push({
					id: "my-teams",
					label: "My Teams",
					teams: myTeamsList,
				});
			}
			if (otherTeamsList.length > 0) {
				sections.push({
					id: "other-teams",
					label: "Other Teams",
					teams: otherTeamsList,
				});
			}
			return sections;
		}

		return [{ id: "all", label: "All Teams", teams: paginatedTeams }];
	}, [paginatedTeams, groupBy, callerMemberId]);

	const selectableTeams = useMemo(() => {
		return paginatedTeams.filter((t) => checkCanDelete(t));
	}, [paginatedTeams, isOwnerOrAdmin, callerMemberId]);

	const toggleSelectTeam = (teamId: string) => {
		const targetTeam = teams.find((t) => t.id === teamId);
		if (targetTeam && !checkCanDelete(targetTeam)) {
			toast.error("You do not have permission to delete this team");
			return;
		}

		setSelectedTeamIds((prev) => {
			const next = new Set(prev);
			if (next.has(teamId)) {
				next.delete(teamId);
			} else {
				next.add(teamId);
			}
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (selectableTeams.length === 0) {
			toast.info("No teams you have permission to delete in this view");
			return;
		}

		const allSelectableSelected = selectableTeams.every((t) =>
			selectedTeamIds.has(t.id)
		);

		if (allSelectableSelected) {
			setSelectedTeamIds(new Set());
		} else {
			setSelectedTeamIds(new Set(selectableTeams.map((t) => t.id)));
		}
	};

	const handleJoinTeam = async (team: TeamWithMembers) => {
		if (!workspaceId) return;
		const hasPending = Boolean(
			callerMemberId &&
				(team.pendingMemberIds?.includes(callerMemberId) ||
					team.pendingMembers?.some((m) => m.id === callerMemberId))
		);
		setJoiningTeamId(team.id);
		try {
			const res = hasPending
				? await cancelTeamJoinRequest({
						teamId: team.id,
						workspaceId,
				  })
				: await joinTeam({
						teamId: team.id,
						workspaceId,
				  });
			if (res.success) {
				toast.success(res.message);
				onTeamUpdated?.();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error(
				hasPending ? "Failed to cancel join request" : "Failed to join team"
			);
		} finally {
			setJoiningTeamId(null);
		}
	};

	const handleLeaveTeam = async () => {
		if (!workspaceId || !callerMemberId || !teamToLeave) return;

		setIsLeaving(true);
		try {
			const res = await removeMemberFromTeam({
				teamId: teamToLeave.id,
				workspaceId,
				memberId: callerMemberId,
			});

			if (res.success) {
				toast.success(res.message);
				setTeamToLeave(null);
				onTeamUpdated?.();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to leave team");
		} finally {
			setIsLeaving(false);
		}
	};

	const handleBulkDelete = async () => {
		if (!workspaceId) return;

		const teamIds = Array.from(selectedTeamIds).filter((teamId) => {
			const targetTeam = teams.find((t) => t.id === teamId);
			return targetTeam ? checkCanDelete(targetTeam) : false;
		});
		if (teamIds.length === 0) {
			toast.error("You do not have permission to delete the selected team(s)");
			setBulkDeleteDialogOpen(false);
			return;
		}

		setIsBulkDeleting(true);
		try {
			const results = await Promise.all(
				teamIds.map((teamId) =>
					deleteTeam({
						teamId,
						workspaceId,
					})
				)
			);
			const deletedCount = results.filter((r) => r.success).length;
			setSelectedTeamIds(new Set());
			setBulkDeleteDialogOpen(false);
			if (deletedCount > 0) {
				toast.success(`Deleted ${deletedCount} team(s)`);
				onTeamUpdated?.();
			} else {
				toast.error(results[0]?.message || "Failed to delete selected teams");
			}
		} catch {
			toast.error("Failed to delete some teams");
		} finally {
			setIsBulkDeleting(false);
		}
	};

	return (
		<>
			{/* Main Table Container */}
			<div className="relative rounded-[20px] border border-secondary/15 bg-primary/40 backdrop-blur-sm overflow-hidden shadow-sm">
				{sortedTeams.length === 0 ? (
					/* Empty States */
					<div className="flex justify-center py-16 px-6 flex-col items-center text-center bg-[#a49f9f] text-[#222222]">
						<div className="bg-[#8b8686] text-[#222222] p-4 rounded-full mb-3">
							{isFilterActive ? (
								<ListFilter className="w-6 h-6 text-[#222222]" />
							) : (
								<Users className="w-6 h-6 text-[#222222]" />
							)}
						</div>
						<h3 className="text-base font-bold text-[#222222]">
							{isFilterActive ? "No matching teams found" : "No teams available"}
						</h3>
						<p className="text-xs text-[#222222]/80 max-w-sm mt-1">
							{isFilterActive
								? "None of the teams match your active filters or search term. Try resetting your filters."
								: "No teams have been created in this workspace yet."}
						</p>
						{isFilterActive && onResetFilters && (
							<Button
								variant="outline"
								onClick={onResetFilters}
								className="mt-4 rounded-full text-xs h-8 gap-1.5 border-[#222222] bg-[#222222] hover:bg-[#222222]/90 text-white hover:text-white"
							>
								<RotateCcw className="w-3 h-3" />
								Clear all filters
							</Button>
						)}
					</div>
				) : (
					<div className="overflow-x-auto custom-scrollbar">
						<Table className="w-full">
							<TableHeader className="bg-secondary/5 border-b border-secondary/10">
								<TableRow className="hover:bg-transparent border-secondary/10">
									{/* Selection Checkbox Header */}
									<TableHead className="w-[44px] px-3">
										<Checkbox
											disabled={selectableTeams.length === 0}
											checked={
												selectableTeams.length > 0 &&
												selectedTeamIds.size > 0 &&
												selectableTeams.every((t) =>
													selectedTeamIds.has(t.id)
												)
													? true
													: selectedTeamIds.size > 0
													? "indeterminate"
													: false
											}
											onCheckedChange={toggleSelectAll}
											aria-label="Select all manageable teams"
										/>
									</TableHead>

									{/* Team Name Header (Sortable) */}
									<TableHead
										onClick={() => handleColumnSort("name")}
										className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
									>
										<div className="flex items-center gap-1.5">
											<span>Team Name</span>
											{sortField === "name" ? (
												sortDirection === "asc" ? (
													<ArrowUp className="w-3.5 h-3.5 text-accent" />
												) : (
													<ArrowDown className="w-3.5 h-3.5 text-accent" />
												)
											) : (
												<ArrowUpDown className="w-3 h-3 text-accent/50" />
											)}
										</div>
									</TableHead>

									{/* Members Avatar Stack Header (Sortable) */}
									{visibleColumns.members && (
										<TableHead
											onClick={() => handleColumnSort("members")}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Members</span>
												{sortField === "members" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Team Leads Header (Sortable) */}
									{visibleColumns.leads && (
										<TableHead
											onClick={() => handleColumnSort("leads")}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Team Leads</span>
												{sortField === "leads" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Description Header */}
									{visibleColumns.description && (
										<TableHead className="select-none text-xs font-bold text-secondary">
											<span>Description</span>
										</TableHead>
									)}

									{/* Member Count Header (Sortable) */}
									{visibleColumns.memberCount && (
										<TableHead
											onClick={() => handleColumnSort("memberCount")}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Total Members</span>
												{sortField === "memberCount" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Tasks Count Header (Sortable) */}
									{visibleColumns.tasks && (
										<TableHead
											onClick={() => handleColumnSort("tasks")}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Tasks</span>
												{sortField === "tasks" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Actions Header */}
									<TableHead className="w-[50px] text-right pr-4"></TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{groupedTeamSections.map((section) => {
									const isCollapsed = collapsedGroups[section.id];

									return (
										<React.Fragment key={section.id}>
											{/* Group Header Row (if grouping enabled) */}
											{groupBy !== "none" && (
												<tr className="bg-secondary/5 border-y border-secondary/10">
													<td colSpan={8} className="px-4 py-2">
														<div
															onClick={() => toggleGroupCollapse(section.id)}
															className="flex items-center gap-2 cursor-pointer select-none group w-fit"
														>
															<button className="text-secondary/70 group-hover:text-secondary p-0.5">
																{isCollapsed ? (
																	<ChevronRight className="w-4 h-4 text-accent" />
																) : (
																	<ChevronDown className="w-4 h-4 text-accent" />
																)}
															</button>
															<span className="text-xs font-bold text-secondary group-hover:text-accent transition-colors flex items-center gap-2">
																{section.id === "has-leads" && (
																	<Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
																)}
																{section.id === "my-teams" && (
																	<UserCheck className="w-3 h-3 text-emerald-400" />
																)}
																{section.label}
															</span>
															<span className="text-[11px] font-semibold bg-secondary/10 px-2 py-0.5 rounded-full text-secondary/80">
																{section.teams.length}
															</span>
														</div>
													</td>
												</tr>
											)}

											{/* Team Rows */}
											{!isCollapsed &&
												section.teams.map((team) => {
													const isMemberInTeam = callerMemberId
														? team.members.some((m) => m.id === callerMemberId) ||
														  Boolean(team.memberIds?.includes(callerMemberId))
														: false;
													const hasPendingRequest = callerMemberId
														? Boolean(
																team.pendingMemberIds?.includes(callerMemberId) ||
																	team.pendingMembers?.some(
																		(m) => m.id === callerMemberId
																	)
														  )
														: false;
													const canManage = checkCanManage(team);
													const canDelete = checkCanDelete(team);
													const canAddMembers =
														canManage ||
														(isMemberInTeam &&
															Boolean(team.allowMemberInvites));
													const canViewTasks =
														canManage ||
														isMemberInTeam ||
														!team.hideTasksFromNonMembers;
													const isSelected = selectedTeamIds.has(team.id);
													const taskCount = team._count?.tasks ?? 0;

													return (
														<TableRow
															key={team.id}
															data-state={isSelected ? "selected" : undefined}
															className={`group border-secondary/10 transition-colors ${
																isSelected
																	? "bg-secondary text-primary dark:bg-zinc-800 dark:text-zinc-100 font-medium border-primary/20"
																	: "hover:bg-secondary/[0.08]"
															}`}
														>
															{/* Selection Checkbox */}
															<TableCell className="px-3">
																<Checkbox
																	disabled={!canDelete}
																	checked={isSelected}
																	onCheckedChange={() =>
																		canDelete && toggleSelectTeam(team.id)
																	}
																	aria-label={`Select team ${team.name}`}
																	title={
																		!canDelete
																			? "You do not have permission to delete this team"
																			: undefined
																	}
																	className={
																		isSelected
																			? "border-primary/60 data-[state=checked]:bg-primary data-[state=checked]:text-secondary"
																			: ""
																	}
																/>
															</TableCell>

															{/* Team Name & Side Peek Trigger */}
															<TableCell>
																<div className="flex items-center gap-2">
																	{/* Quick Join / Membership Status Button (Respective flow to ProjectTable CheckCircle2) */}
																	<button
																		disabled={
																			!callerMemberId ||
																			joiningTeamId === team.id ||
																			(!isMemberInTeam &&
																				!hasPendingRequest &&
																				team.allowSelfJoin === false)
																		}
																		onClick={(e) => {
																			e.stopPropagation();
																			if (!callerMemberId) return;
																			if (isMemberInTeam) {
																				setTeamToLeave(team);
																			} else if (
																				hasPendingRequest ||
																				team.allowSelfJoin !== false
																			) {
																				handleJoinTeam(team);
																			}
																		}}
																		className={`shrink-0 transition-colors p-0.5 rounded-full ${
																			isMemberInTeam
																				? "text-emerald-500 hover:text-emerald-600 cursor-pointer"
																				: hasPendingRequest
																				? "text-amber-400 hover:text-amber-500 cursor-pointer"
																				: callerMemberId &&
																				  team.allowSelfJoin !== false
																				? isSelected
																					? "text-primary/60 hover:text-emerald-600 cursor-pointer dark:text-zinc-300"
																					: "text-secondary/40 hover:text-emerald-500 cursor-pointer"
																				: isSelected
																				? "text-primary/30 cursor-default opacity-40 dark:text-zinc-500"
																				: "text-secondary/25 cursor-default opacity-40"
																		}`}
																		title={
																			isMemberInTeam
																				? "Member of this team (Click to leave)"
																				: hasPendingRequest
																				? "Join request pending approval (Click to cancel)"
																				: team.allowSelfJoin === false
																				? "Invite-only team"
																				: callerMemberId
																				? team.requireApproval
																					? "Click to request to join team"
																					: "Click to join team"
																				: "Team membership"
																		}
																	>
																		{joiningTeamId === team.id ? (
																			<Loader2 className="w-4 h-4 animate-spin text-accent" />
																		) : hasPendingRequest ? (
																			<Clock className="w-4 h-4" />
																		) : (
																			<CheckCircle2 className="w-4 h-4" />
																		)}
																	</button>

																	<div className="flex flex-col gap-1 min-w-0">
																		<div className="flex items-center gap-1.5 min-w-0">
																			<Link
																				href={`/teams/${team.id}`}
																				className={`font-semibold text-xs text-left truncate hover:underline transition-colors flex items-center gap-1.5 cursor-pointer ${
																					isSelected
																						? "text-primary font-bold dark:text-white hover:text-primary/80"
																						: "text-secondary hover:text-white dark:hover:text-white group-hover:text-white/90 dark:group-hover:text-white"
																				}`}
																			>
																				<span className="truncate">
																					{team.name}
																				</span>
																			</Link>
																		</div>

																		<div className="flex items-center gap-1 flex-wrap">
																			{team.visibility === "PRIVATE" && (
																				<Badge className="w-fit text-[9px] py-0 px-1.5 bg-secondary/15 text-secondary font-medium flex items-center gap-1 border-0">
																					<Lock className="w-2.5 h-2.5" />
																					Private
																				</Badge>
																			)}
																			{isMemberInTeam && (
																				<Badge
																					className={`w-fit text-[9px] py-0 px-1.5 font-medium flex items-center gap-1 ${
																						isSelected
																							? "bg-primary/15 text-primary border border-primary/25 dark:bg-white/15 dark:text-white"
																							: "bg-secondary/15 text-secondary"
																					}`}
																				>
																					<UserCheck
																						className={`w-2.5 h-2.5 ${
																							isSelected
																								? "text-primary dark:text-accent"
																								: "text-accent"
																						}`}
																					/>
																					Your Team
																				</Badge>
																			)}
																			{hasPendingRequest && (
																				<Badge className="w-fit text-[9px] py-0 px-1.5 font-medium flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/40">
																					<Clock className="w-2.5 h-2.5 text-amber-400" />
																					Pending
																				</Badge>
																			)}
																			{canManage &&
																				(team.pendingMembers?.length || 0) > 0 && (
																					<Badge className="w-fit text-[9px] py-0 px-1.5 font-medium flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/40">
																						<Clock className="w-2.5 h-2.5 text-amber-400" />
																						{team.pendingMembers?.length} Request
																						{team.pendingMembers?.length === 1
																							? ""
																							: "s"}
																					</Badge>
																				)}
																		</div>
																	</div>
																</div>
															</TableCell>

															{/* Members Avatar Stack */}
															{visibleColumns.members && (
																<TableCell>
																	<TeamMemberOverview
																		members={team.members}
																		leadIds={team.leadIds}
																		callerMemberId={callerMemberId}
																		isSelected={isSelected}
																		size="sm"
																	/>
																</TableCell>
															)}

															{/* Team Leads */}
															{visibleColumns.leads && (
																<TableCell>
																	{team.leads.length === 0 ? (
																		<span
																			className={`text-xs italic ${
																				isSelected
																					? "text-primary/60 dark:text-zinc-400"
																					: "text-secondary/50"
																			}`}
																		>
																			No lead
																		</span>
																	) : (
																		<div className="flex flex-wrap gap-1 items-center">
																			{team.leads.map((lead) => (
																				<Badge
																					key={lead.id}
																					className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
																						isSelected
																							? "bg-primary/15 text-primary border border-primary/25 dark:bg-amber-400/20 dark:text-amber-300"
																							: "bg-amber-400/20 text-amber-300 border border-amber-400/40"
																					}`}
																				>
																					<Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
																					<span className="truncate max-w-[110px]">
																						{lead.user.fullName}
																					</span>
																				</Badge>
																			))}
																		</div>
																	)}
																</TableCell>
															)}

															{/* Description */}
															{visibleColumns.description && (
																<TableCell>
																	{team.description ? (
																		<span
																			className={`text-xs line-clamp-1 max-w-[220px] ${
																				isSelected
																					? "text-primary/80 dark:text-zinc-300"
																					: "text-secondary/70"
																			}`}
																		>
																			{team.description}
																		</span>
																	) : (
																		<span
																			className={`text-[11px] italic ${
																				isSelected
																					? "text-primary/50 dark:text-zinc-400"
																					: "text-secondary/40"
																			}`}
																		>
																			—
																		</span>
																	)}
																</TableCell>
															)}

															{/* Total Members Badge */}
															{visibleColumns.memberCount && (
																<TableCell>
																	<Badge
																		variant="outline"
																		className={`flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold w-fit rounded-full ${
																			isSelected
																				? "bg-primary/10 text-primary border-primary/30 dark:bg-white/10 dark:text-white dark:border-white/20"
																				: "bg-secondary/10 text-secondary border-secondary/20"
																		}`}
																	>
																		<Users
																			className={`w-3 h-3 shrink-0 ${
																				isSelected
																					? "text-primary dark:text-accent"
																					: "text-accent"
																			}`}
																		/>
																		<span>{team.members.length}</span>
																	</Badge>
																</TableCell>
															)}

															{/* Tasks Count Badge */}
															{visibleColumns.tasks && (
																<TableCell>
																	{canViewTasks ? (
																		<Badge
																			variant="outline"
																			className={`flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold w-fit rounded-full ${
																				isSelected
																					? "bg-primary/10 text-primary border-primary/30 dark:bg-white/10 dark:text-white dark:border-white/20"
																					: "bg-secondary/10 text-secondary border-secondary/20"
																			}`}
																		>
																			<Diamond
																				className={`w-3 h-3 shrink-0 ${
																					isSelected
																						? "text-primary dark:text-accent"
																						: "text-accent"
																				}`}
																			/>
																			<span>{taskCount}</span>
																		</Badge>
																	) : (
																		<Badge
																			variant="outline"
																			title="Tasks hidden from non-members"
																			className={`flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold w-fit rounded-full ${
																				isSelected
																					? "bg-primary/10 text-primary border-primary/30 dark:bg-white/10 dark:text-white dark:border-white/20"
																					: "bg-secondary/10 text-secondary/70 border-secondary/20"
																			}`}
																		>
																			<EyeOff className="w-3 h-3 shrink-0" />
																			<span>Hidden</span>
																		</Badge>
																	)}
																</TableCell>
															)}

															{/* Row Actions Menu (Same icons & structure as ProjectTable) */}
															<TableCell
																className="text-right pr-3"
																onClick={(e) => e.stopPropagation()}
															>
																<div className="flex items-center justify-end gap-1">
																	<DropdownMenu>
																		<DropdownMenuTrigger asChild>
																			<Button
																				variant="ghost"
																				size="icon"
																				className={`h-7 w-7 rounded-full transition-colors cursor-pointer ${
																					isSelected
																						? "text-primary hover:bg-primary/15 hover:text-primary dark:text-zinc-200"
																						: "text-secondary hover:bg-secondary/10 hover:text-secondary"
																				}`}
																			>
																				<MoreHorizontal
																					className={`w-3.5 h-3.5 ${
																						isSelected
																							? "text-primary dark:text-accent"
																							: "text-accent"
																					}`}
																				/>
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent
																			align="end"
																			className="bg-primary border border-secondary/20 text-secondary rounded-[14px]"
																		>
																			<DropdownMenuItem asChild>
																				<Link
																					href={`/teams/${team.id}`}
																					className="cursor-pointer text-xs flex items-center gap-2"
																				>
																					<ExternalLink className="w-3.5 h-3.5 text-accent" />
																					View Team
																				</Link>
																			</DropdownMenuItem>
																			{canAddMembers && onAddMembers && (
																				<DropdownMenuItem
																					onSelect={(e) => {
																						e.preventDefault();
																						setTimeout(
																							() => onAddMembers(team),
																							0
																						);
																					}}
																					className="cursor-pointer text-xs flex items-center gap-2"
																				>
																					<UserPlus className="w-3.5 h-3.5 text-accent" />
																					Add Members
																				</DropdownMenuItem>
																			)}
																			{callerMemberId &&
																				!isMemberInTeam &&
																				(hasPendingRequest ||
																					team.allowSelfJoin !== false) && (
																					<DropdownMenuItem
																						disabled={
																							joiningTeamId === team.id
																						}
																						onSelect={(e) => {
																							e.preventDefault();
																							handleJoinTeam(team);
																						}}
																						className="cursor-pointer text-xs flex items-center gap-2"
																					>
																						{hasPendingRequest ? (
																							<>
																								<Clock className="w-3.5 h-3.5 text-amber-400" />
																								Cancel Join Request
																							</>
																						) : (
																							<>
																								<UserPlus className="w-3.5 h-3.5 text-accent" />
																								{team.requireApproval
																									? "Request to Join"
																									: "Join Team"}
																							</>
																						)}
																					</DropdownMenuItem>
																				)}
																			{callerMemberId && isMemberInTeam && (
																				<>
																					<DropdownMenuSeparator className="bg-secondary/15" />
																					<DropdownMenuItem
																						onSelect={(e) => {
																							e.preventDefault();
																							setTimeout(
																								() =>
																									setTeamToLeave(team),
																								0
																							);
																						}}
																						className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
																					>
																						<LogOut className="w-3.5 h-3.5" />
																						Leave Team
																					</DropdownMenuItem>
																				</>
																			)}
																			{canDelete && onDeleteTeam && (
																				<>
																					<DropdownMenuSeparator className="bg-secondary/15" />
																					<DropdownMenuItem
																						onSelect={(e) => {
																							e.preventDefault();
																							setTimeout(
																								() =>
																									onDeleteTeam(team),
																								0
																							);
																						}}
																						className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
																					>
																						<Trash2 className="w-3.5 h-3.5" />
																						Delete Team
																					</DropdownMenuItem>
																				</>
																			)}
																		</DropdownMenuContent>
																	</DropdownMenu>
																</div>
															</TableCell>
														</TableRow>
													);
												})}
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				{/* Pagination Controls */}
				<div className="p-3 border-t border-secondary/10 bg-secondary/5 flex items-center justify-between">
					<span className="text-xs text-primary font-medium">
						Showing {paginatedTeams.length} of {sortedTeams.length} teams
					</span>
					<PaginationControls
						totalItems={sortedTeams.length}
						pageSize={pageSize}
					/>
				</div>
			</div>

			{/* Floating Bottom Bulk Actions Toolbar */}
			{selectedTeamIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary border border-secondary/20 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
					<div className="flex items-center gap-2 pr-2 border-r border-secondary/20">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary text-xs font-bold">
							{selectedTeamIds.size}
						</span>
						<span className="text-xs font-semibold text-secondary">
							Selected
						</span>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => setBulkDeleteDialogOpen(true)}
						className="rounded-full text-xs h-8 text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Delete
					</Button>

					{/* Deselect All */}
					<button
						onClick={() => setSelectedTeamIds(new Set())}
						className="text-secondary/60 hover:text-secondary p-1 rounded-full text-xs font-medium ml-1 cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Bulk Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={bulkDeleteDialogOpen}
				onOpenChange={setBulkDeleteDialogOpen}
			>
				<AlertDialogContent className="bg-primary text-secondary border border-secondary/20 rounded-[20px] max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-destructive flex items-center gap-2">
							<Trash2 className="w-5 h-5" />
							Delete {selectedTeamIds.size} Teams
						</AlertDialogTitle>
						<AlertDialogDescription className="text-secondary/70 text-sm">
							Are you sure you want to delete these{" "}
							<span className="font-semibold text-secondary">
								{selectedTeamIds.size} teams
							</span>
							? All members in these teams will remain in the workspace. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-3 sm:gap-3 mt-4">
						<AlertDialogCancel
							disabled={isBulkDeleting}
							className="rounded-full border-secondary/20 text-secondary hover:bg-secondary/10"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={async (e) => {
								e.preventDefault();
								await handleBulkDelete();
							}}
							disabled={isBulkDeleting}
							className="rounded-full bg-destructive text-white hover:bg-destructive/90 gap-2"
						>
							{isBulkDeleting && (
								<Loader2 className="w-4 h-4 animate-spin" />
							)}
							Delete Selected
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Leave Team Confirmation Alert Dialog */}
			<AlertDialog
				open={!!teamToLeave}
				onOpenChange={(open) => {
					if (!isLeaving && !open) setTeamToLeave(null);
				}}
			>
				<AlertDialogContent
					onClick={(e) => e.stopPropagation()}
					className="bg-primary text-secondary border border-secondary/20 rounded-[20px]"
				>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-lg font-bold text-secondary">
							Leave Team?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-secondary/70">
							Are you sure you want to leave{" "}
							<strong className="text-secondary">{teamToLeave?.name}</strong>?
							You will remain in the workspace and any other teams you belong to.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isLeaving}
							className="rounded-full text-xs border-secondary/20 bg-primary text-secondary hover:bg-secondary/10"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={(e) => {
								e.preventDefault();
								handleLeaveTeam();
							}}
							disabled={isLeaving}
							className="rounded-full text-xs bg-destructive text-white hover:bg-destructive/90 font-semibold"
						>
							{isLeaving ? (
								<>
									<LoaderCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Leaving...
								</>
							) : (
								"Leave Team"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
