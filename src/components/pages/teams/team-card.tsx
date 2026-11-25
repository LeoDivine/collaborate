"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PresenceAvatar } from "@/components/shared/presence-avatar";
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
	Check,
	Clock,
	Crown,
	Diamond,
	EllipsisVertical,
	ExternalLink,
	EyeOff,
	LoaderCircle,
	Lock,
	LogOut,
	Plus,
	Shield,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import {
	cancelTeamJoinRequest,
	joinTeam,
	removeMemberFromTeam,
} from "@/lib/services/team.services";
import { toast } from "sonner";
import type { TeamWithMembers } from "@/lib/types";
import { WorkspaceRoles } from "../../../../generated/prisma/enums";

interface TeamCardProps {
	team: TeamWithMembers;
	callerRole?: WorkspaceRoles;
	callerMemberId?: string;
	workspaceId?: string;
	onSelectTeam: (team: TeamWithMembers) => void;
	onDeleteTeam?: (team: TeamWithMembers) => void;
	onAddMembers?: (team: TeamWithMembers) => void;
	onTeamUpdated?: () => void;
}

export function TeamCard({
	team,
	callerRole,
	callerMemberId,
	workspaceId,
	onSelectTeam,
	onDeleteTeam,
	onAddMembers,
	onTeamUpdated,
}: TeamCardProps) {
	const [isJoining, setIsJoining] = useState(false);
	const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
	const [isLeaving, setIsLeaving] = useState(false);

	const isOwnerOrAdmin =
		callerRole === WorkspaceRoles.OWNER || callerRole === WorkspaceRoles.ADMIN;
	const isCallerTeamLead = callerMemberId
		? team.leadIds.includes(callerMemberId) ||
		  team.leads.some((l) => l.id === callerMemberId)
		: false;
	const isMemberInTeam = callerMemberId
		? team.members.some((m) => m.id === callerMemberId) ||
		  Boolean(team.memberIds?.includes(callerMemberId))
		: false;
	const hasPendingRequest = callerMemberId
		? Boolean(
				team.pendingMemberIds?.includes(callerMemberId) ||
					team.pendingMembers?.some((m) => m.id === callerMemberId)
		  )
		: false;
	const canManage = isOwnerOrAdmin || isCallerTeamLead;
	const canDelete = isOwnerOrAdmin || isCallerTeamLead;
	const canAddMembers =
		canManage || (isMemberInTeam && Boolean(team.allowMemberInvites));
	const canViewTasks =
		canManage || isMemberInTeam || !team.hideTasksFromNonMembers;

	const handleJoinTeam = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!workspaceId) return;

		setIsJoining(true);
		try {
			const res = hasPendingRequest
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
				hasPendingRequest
					? "Failed to cancel join request"
					: "Failed to join team"
			);
		} finally {
			setIsJoining(false);
		}
	};

	const handleLeaveTeam = async () => {
		if (!workspaceId || !callerMemberId) return;

		setIsLeaving(true);
		try {
			const res = await removeMemberFromTeam({
				teamId: team.id,
				workspaceId,
				memberId: callerMemberId,
			});

			if (res.success) {
				toast.success(res.message);
				setIsLeaveDialogOpen(false);
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

	const memberCount = team.members.length;
	const leadsCount = team.leads.length;

	return (
		<div
			onClick={() => onSelectTeam(team)}
			className={`group relative flex flex-col justify-between rounded-[20px] border bg-primary text-secondary p-5 transition-all duration-200 hover:shadow-lg cursor-pointer ${
				isMemberInTeam
					? "border-emerald-500/40 hover:border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-emerald-500/5"
					: "border-secondary/15 hover:border-secondary/35"
			}`}
		>
			<div>
				{/* Top Row: Team Name, Count Badge, and Action Menu */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-bold text-base text-secondary truncate group-hover:underline">
								{team.name}
							</h3>
							{team.visibility === "PRIVATE" && (
								<Badge className="bg-secondary/15 text-secondary border-0 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 shrink-0">
									<Lock className="w-2.5 h-2.5" />
									Private
								</Badge>
							)}
							{isMemberInTeam && (
								<Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 shrink-0">
									<Check className="w-3 h-3 text-emerald-400" />
									Your Team
								</Badge>
							)}
							{canManage &&
								(team.pendingMembers?.length || 0) > 0 && (
									<Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] px-1.5 py-0 font-semibold flex items-center gap-1 shrink-0">
										<Clock className="w-2.5 h-2.5 text-amber-400" />
										{team.pendingMembers?.length} Pending
									</Badge>
								)}
						</div>
						{team.description && (
							<p className="text-xs text-secondary/70 line-clamp-2 mt-1.5 leading-relaxed">
								{team.description}
							</p>
						)}
						<p className="text-xs text-secondary/50 mt-1">
							{memberCount} member{memberCount === 1 ? "" : "s"}
						</p>
					</div>

					<div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
						<Badge
							variant="outline"
							className="text-[11px] font-semibold border-secondary/20 bg-secondary/10 text-secondary"
							title={`${memberCount} members`}
						>
							<Users className="w-3 h-3 mr-1" />
							{memberCount}
						</Badge>
						{team._count?.tasks !== undefined && (
							canViewTasks ? (
								<Badge
									variant="outline"
									className="text-[11px] font-semibold border-accent/30 bg-accent/10 text-accent"
									title={`${team._count.tasks} tasks`}
								>
									<Diamond className="w-3 h-3 mr-1 text-accent" />
									{team._count.tasks}
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-[11px] font-semibold border-secondary/20 bg-secondary/10 text-secondary/70"
									title="Tasks hidden from non-members"
								>
									<EyeOff className="w-3 h-3" />
								</Badge>
							)
						)}

						{(canManage || canAddMembers) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 rounded-full text-secondary/60 hover:text-secondary hover:bg-secondary/10"
									>
										<EllipsisVertical className="w-3.5 h-3.5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-44 bg-primary text-secondary border border-secondary/20 shadow-xl"
								>
									<DropdownMenuItem asChild>
										<Link
											href={`/teams/${team.id}`}
											className="cursor-pointer text-xs flex items-center gap-2 text-secondary hover:text-white hover:bg-white/10"
										>
											<ExternalLink className="w-3.5 h-3.5 text-accent" />
											View Team
										</Link>
									</DropdownMenuItem>
									{canAddMembers && onAddMembers && (
										<DropdownMenuItem
											onSelect={(e) => {
												e.preventDefault();
												setTimeout(() => onAddMembers(team), 0);
											}}
											className="cursor-pointer text-xs flex items-center gap-2 text-secondary hover:text-white hover:bg-white/10"
										>
											<Plus className="w-3.5 h-3.5" />
											Add Members
										</DropdownMenuItem>
									)}
									{canDelete && onDeleteTeam && (
										<>
											<DropdownMenuSeparator className="bg-secondary/15" />
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setTimeout(() => onDeleteTeam(team), 0);
												}}
												className="cursor-pointer text-xs text-red-400 hover:text-red-300 focus:text-red-300 flex items-center gap-2 hover:bg-red-500/10"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Delete Team
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Team Leads Section */}
				<div className="mt-4 rounded-[14px] border border-amber-400/25 bg-amber-400/10 p-3">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
							<Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
							Team Lead{leadsCount === 1 ? "" : "s"} ({leadsCount})
						</span>
					</div>

					{leadsCount === 0 ? (
						<p className="text-xs text-secondary/50 italic">
							No team lead assigned
						</p>
					) : (
						<div className="flex flex-wrap gap-1.5 mt-1">
							{team.leads.map((lead) => (
								<div
									key={lead.id}
									className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/80 border border-amber-400/40 text-[11px] font-medium text-amber-200"
								>
									<PresenceAvatar
										userId={lead.userId}
										name={lead.user.fullName}
										size="xs"
										ringColor="ring-primary"
									/>
									<span className="font-semibold truncate max-w-[120px]">
										{lead.user.fullName}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Bottom Section: Member Avatar Stack & Action Buttons */}
			<div className="mt-5 pt-3 border-t border-secondary/15 flex flex-col gap-3">
				{/* Member View */}
				<div className="flex items-center justify-between">
					<TeamMemberOverview
						members={team.members}
						leadIds={team.leadIds}
						callerMemberId={callerMemberId}
					/>
				</div>

				{/* Action Buttons Below Member View */}
				<div className="flex items-center justify-between gap-2 pt-0.5">
					{isMemberInTeam && callerMemberId ? (
						<Button
							size="sm"
							variant="destructive"
							disabled={isLeaving}
							onClick={(e) => {
								e.stopPropagation();
								setIsLeaveDialogOpen(true);
							}}
							className="text-xs h-8 px-3 rounded-full bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90 text-white font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm border-0"
						>
							{isLeaving ? (
								<LoaderCircle className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
							) : (
								<LogOut className="w-3.5 h-3.5 text-white shrink-0" />
							)}
							{isLeaving ? "Leaving..." : "Leave Team"}
						</Button>
					) : !isMemberInTeam && callerMemberId ? (
						hasPendingRequest ? (
							<Button
								size="sm"
								variant="outline"
								onClick={handleJoinTeam}
								disabled={isJoining}
								className="text-xs h-8 px-3 rounded-full border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 font-semibold cursor-pointer"
							>
								{isJoining ? (
									<LoaderCircle className="w-3.5 h-3.5 mr-1 animate-spin" />
								) : (
									<Clock className="w-3.5 h-3.5 mr-1" />
								)}
								Pending Approval
							</Button>
						) : team.allowSelfJoin === false ? (
							<Badge
								variant="outline"
								className="text-[11px] h-7 px-2.5 rounded-full border-secondary/20 bg-secondary/10 text-secondary/70 font-medium flex items-center gap-1"
							>
								<Shield className="w-3 h-3" />
								Invite Only
							</Badge>
						) : (
							<Button
								size="sm"
								onClick={handleJoinTeam}
								disabled={isJoining}
								className="text-xs h-8 px-3 rounded-full bg-secondary text-primary hover:bg-secondary/90 font-semibold cursor-pointer"
							>
								{isJoining ? (
									<LoaderCircle className="w-3.5 h-3.5 mr-1 animate-spin" />
								) : (
									<UserPlus className="w-3.5 h-3.5 mr-1" />
								)}
								{team.requireApproval
									? "Request to Join"
									: "Join Team"}
							</Button>
						)
					) : null}

					<Button
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							onSelectTeam(team);
						}}
						className="text-xs h-8 px-3 rounded-full bg-secondary text-primary hover:bg-secondary/90 font-semibold cursor-pointer ml-auto"
					>
						View Details →
					</Button>
				</div>
			</div>

			{/* Leave Team Confirmation Alert Dialog */}
			<AlertDialog
				open={isLeaveDialogOpen}
				onOpenChange={(open) => {
					if (!isLeaving) setIsLeaveDialogOpen(open);
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
							Are you sure you want to leave <strong className="text-secondary">{team.name}</strong>? You will remain in the workspace and any other teams you belong to.
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
		</div>
	);
}
