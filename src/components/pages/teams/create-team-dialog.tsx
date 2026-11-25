"use client";

import React, {
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Check,
	Crown,
	Filter,
	Group,
	LoaderCircle,
	Search,
	Users,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { createTeam } from "@/lib/services/team.services";
import { toast } from "sonner";
import type { TeamMemberItem } from "@/lib/types";

interface CreateTeamDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	availableMembers: TeamMemberItem[];
	onSuccess?: () => void;
}

const ROW_HEIGHT = 46; // Height per row + spacing (px)
const CONTAINER_HEIGHT = 256; // max-h-64 is 256px
const OVERSCAN = 6; // Buffer items to render above/below viewport

export function CreateTeamDialog({
	open,
	onOpenChange,
	workspaceId,
	availableMembers,
	onSuccess,
}: CreateTeamDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
	const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlySelected, setShowOnlySelected] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Virtual windowing scroll tracking
	const [scrollTop, setScrollTop] = useState(0);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Fast O(1) membership lookups for 400+ members
	const selectedMemberSet = useMemo(
		() => new Set(selectedMemberIds),
		[selectedMemberIds],
	);
	const selectedLeadSet = useMemo(
		() => new Set(selectedLeadIds),
		[selectedLeadIds],
	);

	// Non-blocking search with useDeferredValue for 60fps input responsiveness
	const deferredSearch = useDeferredValue(searchQuery);

	const filteredMembers = useMemo(() => {
		const q = deferredSearch.toLowerCase().trim();
		return availableMembers.filter((m) => {
			if (showOnlySelected && !selectedMemberSet.has(m.id)) {
				return false;
			}
			if (!q) return true;
			return (
				m.user.fullName.toLowerCase().includes(q) ||
				m.user.email.toLowerCase().includes(q) ||
				(m.user.userName && m.user.userName.toLowerCase().includes(q))
			);
		});
	}, [availableMembers, deferredSearch, showOnlySelected, selectedMemberSet]);

	// Reset scroll position when search or filter changes
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = 0;
			setScrollTop(0);
		}
	}, [deferredSearch, showOnlySelected]);

	const toggleMemberSelection = (memberId: string) => {
		setSelectedMemberIds((prev) =>
			selectedMemberSet.has(memberId) ?
				prev.filter((id) => id !== memberId)
			:	[...prev, memberId],
		);
		setSelectedLeadIds((prev) => prev.filter((id) => id !== memberId));
	};

	const toggleLeadSelection = (memberId: string) => {
		if (!selectedLeadSet.has(memberId) && selectedLeadIds.length >= 2) {
			toast.error("A team can have a maximum of 2 team leads");
			return;
		}
		setSelectedLeadIds((prev) =>
			selectedLeadSet.has(memberId) ?
				prev.filter((id) => id !== memberId)
			:	[...prev, memberId],
		);
		setSelectedMemberIds((prev) =>
			selectedMemberSet.has(memberId) ? prev : [...prev, memberId],
		);
	};

	// Quick Select / Deselect All Filtered Members
	const areAllFilteredSelected =
		filteredMembers.length > 0 &&
		filteredMembers.every((m) => selectedMemberSet.has(m.id));

	const toggleSelectAllFiltered = () => {
		if (areAllFilteredSelected) {
			const filteredIds = new Set(filteredMembers.map((m) => m.id));
			setSelectedMemberIds((prev) =>
				prev.filter((id) => !filteredIds.has(id)),
			);
			setSelectedLeadIds((prev) =>
				prev.filter((id) => !filteredIds.has(id)),
			);
		} else {
			const toAdd = filteredMembers
				.map((m) => m.id)
				.filter((id) => !selectedMemberSet.has(id));
			setSelectedMemberIds((prev) => [...prev, ...toAdd]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();

		if (!trimmedName || trimmedName.length < 2) {
			toast.error("Please enter a team name with at least 2 characters");
			return;
		}

		if (selectedLeadIds.length > 2) {
			toast.error("A team can have a maximum of 2 team leads");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await createTeam({
				workspaceId,
				name: trimmedName,
				description: description.trim() || undefined,
				memberIds: selectedMemberIds,
				leadIds: selectedLeadIds,
			});

			if (res.success) {
				toast.success(res.message);
				setName("");
				setDescription("");
				setSelectedMemberIds([]);
				setSelectedLeadIds([]);
				setSearchQuery("");
				onOpenChange(false);
				onSuccess?.();
			} else {
				toast.error(res.message || "Failed to create team");
			}
		} catch {
			toast.error("An error occurred while creating the team");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full max-w-2xl sm:max-w-3xl bg-primary text-secondary border border-secondary/20 rounded-[20px] shadow-2xl p-6">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl font-bold text-secondary">
						<Group className="w-5 h-5 text-accent" />
						Create New Team
					</DialogTitle>
					<DialogDescription className="text-xs text-secondary/70">
						Organize workspace members into functional squads or
						departments. You can add a description and designate one
						or more Team Leads.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					{/* Top row: Name & Description */}
					<div className="grid grid-cols-1 gap-3.5">
						<div className="space-y-1.5">
							<Label
								htmlFor="team-name"
								className="text-xs font-semibold text-secondary/90"
							>
								Team Name{" "}
								<span className="text-red-400">*</span>
							</Label>
							<Input
								id="team-name"
								placeholder="e.g. Frontend Engineering, Product Design, Marketing"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-black/30 border-secondary/20 focus:border-secondary text-secondary placeholder:text-secondary/40 text-xs h-10 rounded-[12px]"
								disabled={isSubmitting}
								autoFocus
							/>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="team-description"
								className="text-xs font-semibold text-secondary/90 flex items-center justify-between"
							>
								<span>Team Description</span>
								<span className="text-[11px] text-secondary/50 font-normal">
									Optional
								</span>
							</Label>
							<Textarea
								id="team-description"
								placeholder="Describe this team's goals, responsibilities, or scope..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
								className="bg-black/30 border-secondary/20 focus:border-secondary text-secondary placeholder:text-secondary/40 text-xs rounded-[12px] min-h-[64px] resize-none"
								disabled={isSubmitting}
							/>
						</div>
					</div>

					{/* Bottom: Assign Members & Leads */}
					<div className="space-y-2 pt-3 border-t border-secondary/15">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-secondary/90 flex items-center gap-1.5">
								<span>Assign Members & Team Leads</span>
								{selectedMemberIds.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] border-secondary/30 bg-secondary/10 text-secondary"
									>
										{selectedMemberIds.length} selected (
										{selectedLeadIds.length}/2 leads)
									</Badge>
								)}
							</Label>
							<span className="text-[11px] text-secondary/60">
								Click{" "}
								<Crown className="w-3 h-3 inline text-amber-400 fill-amber-400 mx-0.5" />{" "}
								to designate a Team Lead (max 2)
							</span>
						</div>

						{/* Member Toolbar: Search + Quick filters */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="relative flex-1">
									<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" />
									<Input
										placeholder="Search members by name, email, or username..."
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="pl-8 pr-8 text-xs h-9 bg-black/20 border-secondary/15 text-secondary placeholder:text-secondary/40 rounded-full"
										disabled={isSubmitting}
									/>
									{searchQuery && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary p-0.5"
										>
											<X className="w-3 h-3" />
										</button>
									)}
								</div>

								{/* Toggle: Show Selected Only */}
								<button
									type="button"
									onClick={() =>
										setShowOnlySelected((prev) => !prev)
									}
									className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold border transition-colors cursor-pointer shrink-0 select-none ${
										showOnlySelected ?
											"bg-secondary text-primary border-secondary"
										:	"bg-black/20 text-secondary/80 border-secondary/15 hover:bg-white/5"
									}`}
								>
									<Filter className="w-3 h-3" />
									<span>
										Selected ({selectedMemberIds.length})
									</span>
								</button>
							</div>

							{/* Secondary row: summary count and quick select/deselect all */}
							<div className="flex items-center justify-between text-[11px] text-secondary/60 px-1">
								<span>
									Showing {filteredMembers.length} of{" "}
									{availableMembers.length} members
									{showOnlySelected &&
										" (filtered to selected)"}
								</span>

								{filteredMembers.length > 0 && (
									<button
										type="button"
										onClick={toggleSelectAllFiltered}
										className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
									>
										{areAllFilteredSelected ?
											`Deselect all visible (${filteredMembers.length})`
										:	`Select all visible (${filteredMembers.length})`
										}
									</button>
								)}
							</div>
						</div>

						{/* Virtualized Members List Container */}
						<div
							ref={scrollContainerRef}
							onScroll={(e) =>
								setScrollTop(e.currentTarget.scrollTop)
							}
							className="max-h-64 overflow-y-auto custom-scrollbar border border-secondary/15 rounded-[12px] bg-black/20 p-1.5 relative"
						>
							{filteredMembers.length === 0 ?
								<div className="py-8 text-center text-xs text-secondary/50">
									{showOnlySelected ?
										"No members currently selected"
									: searchQuery ?
										"No members matching your search"
									:	"No available members to assign"}
								</div>
							:	(() => {
									const totalCount = filteredMembers.length;
									const totalHeight = totalCount * ROW_HEIGHT;
									const startIndex = Math.max(
										0,
										Math.floor(scrollTop / ROW_HEIGHT) -
											OVERSCAN,
									);
									const endIndex = Math.min(
										totalCount,
										Math.ceil(
											(scrollTop + CONTAINER_HEIGHT) /
												ROW_HEIGHT,
										) + OVERSCAN,
									);
									const visibleMembers =
										filteredMembers.slice(
											startIndex,
											endIndex,
										);
									const offsetY = startIndex * ROW_HEIGHT;

									return (
										<div
											style={{
												height: `${totalHeight}px`,
												position: "relative",
												width: "100%",
											}}
										>
											<div
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													right: 0,
													transform: `translateY(${offsetY}px)`,
												}}
												className="space-y-1"
											>
												{visibleMembers.map(
													(member) => {
														const isSelected =
															selectedMemberSet.has(
																member.id,
															);
														const isLead =
															selectedLeadSet.has(
																member.id,
															);
														const isLeadLimitReached =
															!isLead &&
															selectedLeadIds.length >=
																2;

														return (
															<div
																key={member.id}
																style={{
																	height: "42px",
																}}
																className={`flex items-center justify-between px-2 rounded-lg transition-colors text-xs ${
																	isSelected ?
																		"bg-white/10"
																	:	"hover:bg-white/5"
																}`}
															>
																<div
																	className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer h-full"
																	onClick={() =>
																		toggleMemberSelection(
																			member.id,
																		)
																	}
																>
																	<span
																		aria-checked={
																			isSelected
																		}
																		role="checkbox"
																		className={`size-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
																			(
																				isSelected
																			) ?
																				"bg-secondary border-secondary text-primary"
																			:	"border-secondary/40 bg-transparent"
																		}`}
																	>
																		{isSelected && (
																			<Check className="size-2.5 stroke-[3]" />
																		)}
																	</span>
																	<span className="size-5 rounded-full bg-accent text-primary text-[8px] font-bold flex items-center justify-center shrink-0 select-none">
																		{getInitials(
																			member
																				.user
																				.fullName ||
																				"U",
																		)}
																	</span>
																	<div className="min-w-0 flex-1">
																		<p className="font-semibold truncate text-secondary leading-snug">
																			{
																				member
																					.user
																					.fullName
																			}
																		</p>
																		<p className="text-[10px] text-secondary/60 truncate leading-none">
																			{
																				member
																					.user
																					.email
																			}
																		</p>
																	</div>
																</div>

																{/* Team Lead Toggle Button */}
																<button
																	type="button"
																	onClick={() =>
																		toggleLeadSelection(
																			member.id,
																		)
																	}
																	disabled={
																		isLeadLimitReached
																	}
																	title={
																		isLead ?
																			"Remove Team Lead status"
																		: (
																			isLeadLimitReached
																		) ?
																			"Maximum of 2 team leads allowed"
																		:	"Make Team Lead"

																	}
																	className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
																		isLead ?
																			"bg-amber-400/20 text-amber-300 border border-amber-400/40 cursor-pointer"
																		: (
																			isLeadLimitReached
																		) ?
																			"text-secondary/20 bg-transparent cursor-not-allowed opacity-40"
																		:	"text-secondary/40 hover:text-amber-300 hover:bg-amber-400/10 cursor-pointer"
																	}`}
																>
																	<Crown
																		className={`w-3 h-3 ${
																			(
																				isLead
																			) ?
																				"fill-amber-400 text-amber-400"
																			:	""
																		}`}
																	/>
																	<span>
																		{(
																			isLead
																		) ?
																			"Team Lead"
																		:	"Make Lead"
																		}
																	</span>
																</button>
															</div>
														);
													},
												)}
											</div>
										</div>
									);
								})()
							}
						</div>
					</div>

					<DialogFooter className="pt-3 sm:justify-end gap-2 border-t border-secondary/15">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="rounded-full text-xs h-9 px-4 border-secondary/20 bg-primary text-secondary hover:bg-white/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isSubmitting || !name.trim()}
							className="rounded-full text-xs h-9 px-5 bg-secondary text-primary font-bold hover:bg-secondary/90 cursor-pointer"
						>
							{isSubmitting ?
								<>
									<LoaderCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Creating...
								</>
							:	"Create Team"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
