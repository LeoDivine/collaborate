"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeamCard } from "./team-card";
import {
	TeamTable,
	type TeamColumnVisibility,
	type TeamGroupByField,
} from "./team-table";
import { CreateTeamDialog } from "./create-team-dialog";
import { UnassignedMembersSheet } from "./unassigned-members-sheet";
import { deleteTeam } from "@/lib/services/team.services";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";
import { toast } from "sonner";
import {
	ChevronDown,
	Columns3,
	Crown,
	Grid,
	Group,
	Layers,
	Plus,
	RotateCcw,
	Search,
	Table as TableIcon,
	UserCheck,
	UserX,
	Users,
	X,
} from "lucide-react";
import type { TeamWithMembers, TeamMemberItem, TeamSummaryStats, Projects } from "@/lib/types";
import { WorkspaceRoles } from "../../../../generated/prisma/enums";

interface TeamsViewProps {
	initialTeams: TeamWithMembers[];
	initialStats: TeamSummaryStats;
	unassignedMembers: TeamMemberItem[];
	allWorkspaceMembers?: TeamMemberItem[];
	workspaceId: string;
	callerRole?: WorkspaceRoles;
	callerMemberId?: string;
	projects?: Projects[];
}

export default function TeamsView({
	initialTeams,
	initialStats,
	unassignedMembers,
	allWorkspaceMembers,
	workspaceId,
	callerRole,
	callerMemberId,
}: TeamsViewProps) {
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [filter, setFilter] = useState<"ALL" | "MY_TEAM" | "HAS_LEADS" | "NO_LEADS">("ALL");
	const [groupBy, setGroupBy] = useState<TeamGroupByField>("none");
	const [visibleColumns, setVisibleColumns] = useState<TeamColumnVisibility>({
		members: true,
		leads: true,
		description: false,
		memberCount: true,
		tasks: true,
	});

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);

	const [teamToDelete, setTeamToDelete] = useState<TeamWithMembers | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const isOwnerOrAdmin =
		callerRole === WorkspaceRoles.OWNER || callerRole === WorkspaceRoles.ADMIN;

	// Detect all teams caller belongs to (multi-team support)
	const myTeams = useMemo(() => {
		if (!callerMemberId) return [];
		return initialTeams.filter((t) => t.members.some((m) => m.id === callerMemberId));
	}, [initialTeams, callerMemberId]);

	// Debounced refresh wrapped in startTransition to prevent concurrent render collisions
	const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
	const debouncedRefresh = React.useCallback(() => {
		if (refreshTimeoutRef.current) {
			clearTimeout(refreshTimeoutRef.current);
		}
		refreshTimeoutRef.current = setTimeout(() => {
			React.startTransition(() => {
				router.refresh();
			});
		}, 300);
	}, [router]);

	React.useEffect(() => {
		return () => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current);
			}
		};
	}, []);

	// Handlers for navigating to team view
	const handleSelectTeam = React.useCallback(
		(team: TeamWithMembers) => {
			router.push(`/teams/${team.id}`);
		},
		[router]
	);

	const handleAddMembers = React.useCallback(
		(team: TeamWithMembers) => {
			router.push(`/teams/${team.id}`);
		},
		[router]
	);

	// Real-time synchronization via Pusher with memoized callbacks
	const realtimeCallbacks = useMemo(
		() => ({
			onTeamCreated: () => debouncedRefresh(),
			onTeamUpdated: () => debouncedRefresh(),
			onTeamDeleted: () => debouncedRefresh(),
			onTeamLeadsUpdated: () => debouncedRefresh(),
			onTeamMembersChanged: () => debouncedRefresh(),
			onMemberStatusUpdated: () => debouncedRefresh(),
		}),
		[debouncedRefresh]
	);

	useWorkspaceRealtime(workspaceId, realtimeCallbacks);

	// Filter and search logic
	const filteredTeams = useMemo(() => {
		return initialTeams.filter((team) => {
			const q = searchQuery.toLowerCase().trim();
			const matchesQuery =
				!q ||
				team.name.toLowerCase().includes(q) ||
				team.leads.some(
					(l) =>
						l.user.fullName.toLowerCase().includes(q) ||
						l.user.email.toLowerCase().includes(q)
				) ||
				team.members.some(
					(m) =>
						m.user.fullName.toLowerCase().includes(q) ||
						m.user.email.toLowerCase().includes(q)
				);

			if (!matchesQuery) return false;

			if (filter === "MY_TEAM") {
				return callerMemberId ? team.members.some((m) => m.id === callerMemberId) : false;
			}
			if (filter === "HAS_LEADS") return isOwnerOrAdmin && team.leads.length > 0;
			if (filter === "NO_LEADS") return isOwnerOrAdmin && team.leads.length === 0;

			return true;
		});
	}, [initialTeams, searchQuery, filter, callerMemberId, isOwnerOrAdmin]);

	// Handle Delete Team
	const handleConfirmDelete = async () => {
		if (!teamToDelete) return;

		setIsDeleting(true);
		try {
			const res = await deleteTeam({
				teamId: teamToDelete.id,
				workspaceId,
			});

			if (res.success) {
				toast.success(res.message);
				setTeamToDelete(null);
				debouncedRefresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to delete team");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Top Header & Page Title - Consistent with Members and Tasks pages */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-2.5">
					<Users className="w-5 h-5 text-primary" />
					<p className="text-[20px] font-bold text-primary">
						Teams {isOwnerOrAdmin && `(${initialStats.totalTeams})`}
					</p>
				</div>

				{isOwnerOrAdmin && (
					<div className="flex flex-wrap items-center gap-2">
						{/* Unassigned members quick access button (Owner/Admin only) */}
						<button
							type="button"
							onClick={() => setIsUnassignedOpen(true)}
							className="inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border border-secondary/20 bg-primary text-secondary hover:bg-primary/90 transition-colors cursor-pointer select-none"
						>
							<UserX className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
							Unassigned ({initialStats.unassignedMembersCount})
						</button>

						{/* Create Team CTA (Owner/Admin) */}
						<Button
							size="sm"
							onClick={() => setIsCreateOpen(true)}
							className="rounded-full text-xs h-9 px-4 bg-primary text-secondary hover:bg-primary/90 font-semibold cursor-pointer shadow-sm"
						>
							<Plus className="w-4 h-4 mr-1.5" />
							Create Team
						</Button>
					</div>
				)}
			</div>

			{/* KPI Statistics Cards - Only visible to Workspace Owners & Admins (analytics hidden from members) */}
			{isOwnerOrAdmin && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{/* Total Teams */}
					<div className="p-4 rounded-[18px] bg-primary text-secondary border border-secondary/15 shadow-sm flex items-center gap-3.5">
						<div className="size-11 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
							<Group className="w-5 h-5" />
						</div>
						<div>
							<p className="text-2xl font-bold text-secondary leading-tight">
								{initialStats.totalTeams}
							</p>
							<p className="text-[11px] text-secondary/70 font-medium">Total Teams</p>
						</div>
					</div>

					{/* Team Leads */}
					<div className="p-4 rounded-[18px] bg-primary text-secondary border border-secondary/15 shadow-sm flex items-center gap-3.5">
						<div className="size-11 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
							<Crown className="w-5 h-5 fill-amber-400" />
						</div>
						<div>
							<p className="text-2xl font-bold text-amber-300 leading-tight">
								{initialStats.totalLeadsCount}
							</p>
							<p className="text-[11px] text-secondary/70 font-medium">Active Leads</p>
						</div>
					</div>

					{/* Assigned Members */}
					<div className="p-4 rounded-[18px] bg-primary text-secondary border border-secondary/15 shadow-sm flex items-center gap-3.5">
						<div className="size-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
							<UserCheck className="w-5 h-5" />
						</div>
						<div>
							<p className="text-2xl font-bold text-emerald-300 leading-tight">
								{initialStats.assignedMembersCount}
							</p>
							<p className="text-[11px] text-secondary/70 font-medium">Assigned Members</p>
						</div>
					</div>

					{/* Unassigned Members */}
					<div
						onClick={() => setIsUnassignedOpen(true)}
						className="p-4 rounded-[18px] bg-primary text-secondary border border-secondary/15 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-secondary/35 transition-all group"
					>
						<div className="size-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
							<UserX className="w-5 h-5" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between">
								<p className="text-2xl font-bold text-secondary leading-tight">
									{initialStats.unassignedMembersCount}
								</p>
								{initialStats.unassignedMembersCount > 0 && (
									<span className="text-[10px] text-amber-400 font-semibold group-hover:underline">
										Assign →
									</span>
								)}
							</div>
							<p className="text-[11px] text-secondary/70 font-medium">Unassigned</p>
						</div>
					</div>
				</div>
			)}

			{/* Filter & Search Toolbar - Matching ProjectTable controls & layout */}
			<div className="flex flex-col gap-3 pt-1">
				<div className="flex flex-wrap gap-2.5 items-center justify-between">
					<div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
						{/* Search input with dark primary surface */}
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent pointer-events-none" />
							<Input
								placeholder="Search teams, leads, or members..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="bg-primary pl-9 pr-8 rounded-full border border-secondary/15 text-secondary placeholder:text-secondary/50 h-10 w-full focus-visible:ring-1 focus-visible:ring-accent text-xs"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary p-1 cursor-pointer"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Quick Filter: All */}
						<button
							type="button"
							onClick={() => setFilter("ALL")}
							className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none transition-colors ${
								filter === "ALL"
									? "bg-[#969696] text-primary border-[#969696]"
									: "bg-primary text-secondary border-secondary/15 hover:bg-primary/90"
							}`}
						>
							All
							<span
								className={`ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
									filter === "ALL"
										? "bg-primary text-secondary"
										: "bg-secondary text-primary"
								}`}
							>
								{initialTeams.length}
							</span>
						</button>

						{/* Quick Filter: My Teams (when user is in at least 1 team) */}
						{myTeams.length > 0 && (
							<button
								type="button"
								onClick={() => setFilter(filter === "MY_TEAM" ? "ALL" : "MY_TEAM")}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none transition-colors ${
									filter === "MY_TEAM"
										? "bg-[#969696] text-primary border-[#969696]"
										: "bg-primary text-secondary border-secondary/15 hover:bg-primary/90"
								}`}
							>
								<UserCheck
									className={`w-3.5 h-3.5 mr-1.5 ${
										filter === "MY_TEAM" ? "text-primary" : "text-accent"
									}`}
								/>
								My Teams
								<span
									className={`ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
										filter === "MY_TEAM"
											? "bg-primary text-secondary"
											: "bg-secondary text-primary"
									}`}
								>
									{myTeams.length}
								</span>
							</button>
						)}

						{/* Quick Filter: With Leads (Owner/Admin only) */}
						{isOwnerOrAdmin && (
							<button
								type="button"
								onClick={() => setFilter(filter === "HAS_LEADS" ? "ALL" : "HAS_LEADS")}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none transition-colors ${
									filter === "HAS_LEADS"
										? "bg-[#969696] text-primary border-[#969696]"
										: "bg-primary text-secondary border-secondary/15 hover:bg-primary/90"
								}`}
							>
								<Crown
									className={`w-3.5 h-3.5 mr-1.5 ${
										filter === "HAS_LEADS"
											? "text-primary fill-primary"
											: "text-amber-400 fill-amber-400"
									}`}
								/>
								With Leads
							</button>
						)}

						{/* Quick Filter: Without Leads (Owner/Admin only) */}
						{isOwnerOrAdmin && (
							<button
								type="button"
								onClick={() => setFilter(filter === "NO_LEADS" ? "ALL" : "NO_LEADS")}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none transition-colors ${
									filter === "NO_LEADS"
										? "bg-[#969696] text-primary border-[#969696]"
										: "bg-primary text-secondary border-secondary/15 hover:bg-primary/90"
								}`}
							>
								Without Leads
							</button>
						)}
					</div>

					{/* Controls Right: Group By, Columns, Reset, View Mode */}
					<div className="flex items-center gap-2 flex-wrap">
						{viewMode === "table" && (
							<>
								{/* Group By Dropdown */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs gap-1.5 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none ${
												groupBy !== "none" ? "border-accent text-accent" : ""
											}`}
										>
											<Layers className="w-3.5 h-3.5 text-accent" />
											<span>
												Group:{" "}
												<strong className="capitalize">
													{groupBy === "none"
														? "None"
														: groupBy === "leads"
														? "Lead Status"
														: "Membership"}
												</strong>
											</span>
											<ChevronDown className="w-3 h-3 text-accent/70" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary rounded-[14px]">
										<DropdownMenuLabel className="text-xs">
											Group Teams By
										</DropdownMenuLabel>
										<DropdownMenuSeparator className="bg-secondary/15" />
										<DropdownMenuItem
											onClick={() => setGroupBy("none")}
											className="cursor-pointer text-xs"
										>
											None (Flat list)
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setGroupBy("leads")}
											className="cursor-pointer text-xs"
										>
											Lead Status
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setGroupBy("membership")}
											className="cursor-pointer text-xs"
										>
											Membership
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>

								{/* Columns Visibility Toggle */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center justify-center rounded-full h-9 w-9 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none"
											title="Customize Columns"
										>
											<Columns3 className="w-3.5 h-3.5 text-accent" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[180px] rounded-[14px]">
										<DropdownMenuLabel className="text-xs">
											Toggle Columns
										</DropdownMenuLabel>
										<DropdownMenuSeparator className="bg-secondary/15" />
										<DropdownMenuCheckboxItem
											checked={visibleColumns.members}
											onCheckedChange={(v) =>
												setVisibleColumns((p) => ({
													...p,
													members: !!v,
												}))
											}
											className="text-xs cursor-pointer"
										>
											Members
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={visibleColumns.leads}
											onCheckedChange={(v) =>
												setVisibleColumns((p) => ({
													...p,
													leads: !!v,
												}))
											}
											className="text-xs cursor-pointer"
										>
											Team Leads
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={visibleColumns.description}
											onCheckedChange={(v) =>
												setVisibleColumns((p) => ({
													...p,
													description: !!v,
												}))
											}
											className="text-xs cursor-pointer"
										>
											Description
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={visibleColumns.memberCount}
											onCheckedChange={(v) =>
												setVisibleColumns((p) => ({
													...p,
													memberCount: !!v,
												}))
											}
											className="text-xs cursor-pointer"
										>
											Total Members
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={visibleColumns.tasks}
											onCheckedChange={(v) =>
												setVisibleColumns((p) => ({
													...p,
													tasks: !!v,
												}))
											}
											className="text-xs cursor-pointer"
										>
											Tasks
										</DropdownMenuCheckboxItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						)}

						{/* Reset Filters */}
						{(searchQuery.trim() !== "" || filter !== "ALL" || groupBy !== "none") && (
							<button
								type="button"
								onClick={() => {
									setSearchQuery("");
									setFilter("ALL");
									setGroupBy("none");
								}}
								className="inline-flex items-center justify-center rounded-full h-9 px-3 text-secondary text-xs gap-1 border border-secondary/15 bg-primary cursor-pointer select-none"
							>
								<RotateCcw className="w-3 h-3 text-accent" />
								Reset
							</button>
						)}

						{/* View Mode Switcher */}
						<div className="flex items-center rounded-full border border-secondary/15 p-0.5 bg-primary">
							<button
								onClick={() => setViewMode("grid")}
								className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
									viewMode === "grid"
										? "bg-secondary text-primary font-bold shadow-xs"
										: "text-secondary/60 hover:text-secondary"
								}`}
								title="Grid View"
							>
								<Grid className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={() => setViewMode("table")}
								className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
									viewMode === "table"
										? "bg-secondary text-primary font-bold shadow-xs"
										: "text-secondary/60 hover:text-secondary"
								}`}
								title="Table View"
							>
								<TableIcon className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				</div>

				{/* Active Filter Summary Bar */}
				{(searchQuery.trim() !== "" || filter !== "ALL") && (
					<div className="flex items-center gap-1.5 flex-wrap text-xs text-primary/70">
						<span className="font-semibold text-primary">
							Showing {filteredTeams.length} of {initialTeams.length} teams
						</span>
						{filter === "MY_TEAM" && (
							<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
								My Teams
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilter("ALL")}
								/>
							</Badge>
						)}
						{filter === "HAS_LEADS" && (
							<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
								With Leads
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilter("ALL")}
								/>
							</Badge>
						)}
						{filter === "NO_LEADS" && (
							<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
								Without Leads
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilter("ALL")}
								/>
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* Main Content Area */}
			{initialTeams.length === 0 ? (
				/* Empty State matching Members and Invite-codes pages */
				<div className="bg-primary text-secondary flex justify-center py-[50px] px-[20px] flex-col items-center rounded-[20px] border border-secondary/15 shadow-sm text-center">
					<div className="bg-secondary/15 text-secondary p-3.5 rounded-full mb-3">
						<Group className="w-6 h-6" />
					</div>
					<p className="text-secondary text-base font-bold">
						No Teams Created Yet
					</p>
					<p className="text-xs text-secondary/70 max-w-sm mx-auto mt-1 mb-6">
						Organize workspace members into functional teams, assign designated team leads, and streamline department workflows.
					</p>
					{isOwnerOrAdmin && (
						<Button
							size="sm"
							onClick={() => setIsCreateOpen(true)}
							className="rounded-full text-xs h-9 px-4 bg-secondary text-primary hover:bg-secondary/90 font-semibold cursor-pointer shadow-sm"
						>
							<Plus className="w-3.5 h-3.5 mr-1.5" />
							Create Your First Team
						</Button>
					)}
				</div>
			) : viewMode === "table" ? (
				/* Table View (handles its own filtered empty state & pagination matching ProjectTable) */
				<TeamTable
					teams={filteredTeams}
					callerRole={callerRole}
					callerMemberId={callerMemberId}
					workspaceId={workspaceId}
					groupBy={groupBy}
					visibleColumns={visibleColumns}
					isFilterActive={searchQuery.trim() !== "" || filter !== "ALL"}
					onResetFilters={() => {
						setSearchQuery("");
						setFilter("ALL");
						setGroupBy("none");
					}}
					onSelectTeam={handleSelectTeam}
					onDeleteTeam={(t) => setTeamToDelete(t)}
					onAddMembers={handleAddMembers}
					onTeamUpdated={debouncedRefresh}
				/>
			) : filteredTeams.length === 0 ? (
				/* Filtered out empty state for Grid view */
				<div className="bg-primary text-secondary py-12 text-center border border-secondary/15 rounded-[20px] p-6 shadow-sm">
					<Search className="w-6 h-6 text-secondary/40 mx-auto mb-2" />
					<p className="text-sm font-semibold text-secondary">No matching teams found</p>
					<p className="text-xs text-secondary/60 mt-0.5">
						Try clearing your search query or changing the filter.
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSearchQuery("");
							setFilter("ALL");
						}}
						className="mt-4 text-xs rounded-full border-secondary/20 bg-primary text-secondary hover:bg-secondary hover:text-primary font-semibold"
					>
						Clear Filters
					</Button>
				</div>
			) : (
				/* Grid View */
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTeams.map((team) => (
						<TeamCard
							key={team.id}
							team={team}
							callerRole={callerRole}
							callerMemberId={callerMemberId}
							workspaceId={workspaceId}
							onSelectTeam={handleSelectTeam}
							onDeleteTeam={(t) => setTeamToDelete(t)}
							onAddMembers={handleAddMembers}
							onTeamUpdated={debouncedRefresh}
						/>
					))}
				</div>
			)}

			{/* Create Team Dialog */}
			<CreateTeamDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				workspaceId={workspaceId}
				availableMembers={
					allWorkspaceMembers && allWorkspaceMembers.length > 0
						? allWorkspaceMembers
						: unassignedMembers
				}
				onSuccess={debouncedRefresh}
			/>

			{/* Unassigned Members Sheet */}
			<UnassignedMembersSheet
				open={isUnassignedOpen}
				onOpenChange={setIsUnassignedOpen}
				unassignedMembers={unassignedMembers}
				teams={initialTeams}
				workspaceId={workspaceId}
				canManage={isOwnerOrAdmin}
				onMemberAssigned={debouncedRefresh}
			/>

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={!!teamToDelete}
				onOpenChange={(open) => {
					if (!open) setTeamToDelete(null);
				}}
			>
				<AlertDialogContent className="bg-primary text-secondary border border-secondary/20 rounded-[20px]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-lg font-bold text-red-400">
							Delete Team?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-secondary/70">
							Are you sure you want to delete <strong>{teamToDelete?.name}</strong>?
							All members in this team will become unassigned and remain in the
							workspace.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isDeleting}
							className="rounded-full text-xs border-secondary/20 bg-primary text-secondary hover:bg-secondary/10"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="rounded-full text-xs bg-destructive text-white hover:bg-destructive/90 font-semibold"
						>
							{isDeleting ? "Deleting..." : "Yes, Delete Team"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
