"use client";

import React, { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PresenceAvatar } from "@/components/shared/presence-avatar";
import { addMembersToTeam } from "@/lib/services/team.services";
import { toast } from "sonner";
import { LoaderCircle, Search, UserCheck, UserX, Users } from "lucide-react";
import type { TeamWithMembers, TeamMemberItem } from "@/lib/types";

interface UnassignedMembersSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	unassignedMembers: TeamMemberItem[];
	teams: TeamWithMembers[];
	workspaceId: string;
	canManage: boolean;
	onMemberAssigned?: () => void;
}

export function UnassignedMembersSheet({
	open,
	onOpenChange,
	unassignedMembers,
	teams,
	workspaceId,
	canManage,
	onMemberAssigned,
}: UnassignedMembersSheetProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);

	const filtered = unassignedMembers.filter((m) => {
		const q = searchQuery.toLowerCase();
		return (
			m.user.fullName.toLowerCase().includes(q) ||
			m.user.email.toLowerCase().includes(q) ||
			(m.user.userName && m.user.userName.toLowerCase().includes(q))
		);
	});

	const handleAssignTeam = async (memberId: string, teamId: string) => {
		if (!teamId || !canManage) return;

		setAssigningMemberId(memberId);
		try {
			const res = await addMembersToTeam({
				teamId,
				workspaceId,
				memberIds: [memberId],
			});

			if (res.success) {
				toast.success(res.message);
				onMemberAssigned?.();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to assign member to team");
		} finally {
			setAssigningMemberId(null);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-lg p-0 flex flex-col bg-primary text-secondary border-l border-secondary/20 overflow-hidden shadow-2xl"
			>
				{/* Sheet Header */}
				<div className="p-6 border-b border-secondary/15 bg-black/20">
					<SheetTitle className="flex items-center gap-2 text-lg font-bold text-secondary">
						<UserX className="w-5 h-5 text-amber-400" />
						Unassigned Members ({unassignedMembers.length})
					</SheetTitle>
					<SheetDescription className="text-xs text-secondary/70 mt-1">
						Members of this workspace who have not yet been assigned to a team. You can assign them to a team directly below.
					</SheetDescription>

					{/* Search input */}
					{unassignedMembers.length > 3 && (
						<div className="relative mt-4">
							<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" />
							<Input
								placeholder="Search unassigned members..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-9 pl-9 text-xs bg-black/30 border-secondary/20 text-secondary placeholder:text-secondary/40 rounded-full"
							/>
						</div>
					)}
				</div>

				{/* Sheet Body */}
				<div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
					{filtered.length === 0 ? (
						<div className="py-12 text-center text-xs text-secondary/50 border border-dashed border-secondary/20 rounded-[16px] bg-black/20">
							{searchQuery ? (
								"No members match your search query."
							) : (
								<div className="space-y-1">
									<UserCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
									<p className="font-semibold text-secondary">All members assigned!</p>
									<p className="text-[11px] text-secondary/60">
										Every active member in this workspace belongs to a team.
									</p>
								</div>
							)}
						</div>
					) : (
						filtered.map((member) => {
							const isAssigning = assigningMemberId === member.id;

							return (
								<div
									key={member.id}
									className="flex items-center justify-between p-3 rounded-[14px] border border-secondary/15 bg-black/20 hover:border-secondary/30 transition-all text-xs gap-3"
								>
									<div className="flex items-center gap-2.5 min-w-0 flex-1">
										<PresenceAvatar
											userId={member.userId}
											name={member.user.fullName}
											size="sm"
											ringColor="ring-primary"
										/>
										<div className="min-w-0 flex-1">
											<p className="font-semibold truncate text-secondary">
												{member.user.fullName}
											</p>
											<p className="text-[10px] text-secondary/60 truncate">
												{member.user.email}
											</p>
										</div>
									</div>

									{/* Team Assignment Dropdown */}
									{canManage ? (
										<div className="shrink-0 w-36">
											{teams.length === 0 ? (
												<span className="text-[10px] text-secondary/40 italic">
													Create a team first
												</span>
											) : (
												<Select
													disabled={isAssigning}
													onValueChange={(teamId) =>
														handleAssignTeam(member.id, teamId)
													}
												>
													<SelectTrigger className="h-8 text-xs bg-black/40 border-secondary/20 text-secondary rounded-[10px] cursor-pointer">
														{isAssigning ? (
															<div className="flex items-center gap-1.5 text-secondary/70">
																<LoaderCircle className="w-3 h-3 animate-spin" />
																<span>Assigning...</span>
															</div>
														) : (
															<SelectValue placeholder="Assign to..." />
														)}
													</SelectTrigger>
													<SelectContent className="bg-primary text-secondary border border-secondary/20 shadow-xl">
														{teams.map((t) => (
															<SelectItem
																key={t.id}
																value={t.id}
																className="text-xs cursor-pointer text-secondary hover:text-white hover:bg-white/10"
															>
																{t.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										</div>
									) : (
										<span className="text-[10px] text-secondary/40 italic shrink-0">
											Unassigned
										</span>
									)}
								</div>
							);
						})
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
