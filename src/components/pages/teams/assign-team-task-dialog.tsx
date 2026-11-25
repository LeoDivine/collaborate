"use client";

import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PresenceAvatar } from "@/components/shared/presence-avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createTask } from "@/lib/services/task.services";
import { format, isBefore, isAfter } from "date-fns";
import { toast } from "sonner";
import {
	Bell,
	Calendar as CalendarIcon,
	Check,
	Crown,
	Diamond,
	Flag,
	FolderGit2,
	Loader2,
	Plus,
	Tag,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { PriorityLevel, Status } from "../../../../generated/prisma/enums";
import type { Projects, TeamMemberItem, TeamWithMembers } from "@/lib/types";

interface AssignTeamTaskDialogProps {
	team: TeamWithMembers;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	currentMemberId: string;
	projects: Projects[];
	onTaskCreated?: (task: any) => void;
}

const PRIORITY_OPTIONS = [
	{ label: "Urgent", value: PriorityLevel.URGENT, color: "text-red-400 bg-red-500/10 border-red-500/30" },
	{ label: "High", value: PriorityLevel.HIGH, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
	{ label: "Medium", value: PriorityLevel.MEDIUM, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
	{ label: "Low", value: PriorityLevel.LOW, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
	{ label: "No Priority", value: PriorityLevel.NO_PRIORITY, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30" },
];

export function AssignTeamTaskDialog({
	team,
	open,
	onOpenChange,
	workspaceId,
	currentMemberId,
	projects,
	onTaskCreated,
}: AssignTeamTaskDialogProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState<string>(
		projects[0]?.id || ""
	);
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
	const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.MEDIUM);
	const [startDateStr, setStartDateStr] = useState<string>(() =>
		format(new Date(), "yyyy-MM-dd")
	);
	const [dueDateStr, setDueDateStr] = useState<string>(() => {
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);
		return format(nextWeek, "yyyy-MM-dd");
	});
	const [labelInput, setLabelInput] = useState("");
	const [labels, setLabels] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Find the selected project object
	const selectedProject = useMemo(() => {
		return projects.find((p) => p.id === selectedProjectId) || null;
	}, [projects, selectedProjectId]);

	// Update default dates when project changes if current dates are out of bounds
	React.useEffect(() => {
		if (selectedProject) {
			const pStart = new Date(selectedProject.startPeriod);
			const pEnd = new Date(selectedProject.endPeriod);
			const now = new Date();

			const sDate = isBefore(now, pStart) ? pStart : isAfter(now, pEnd) ? pStart : now;
			setStartDateStr(format(sDate, "yyyy-MM-dd"));

			const dDate = isAfter(new Date(sDate.getTime() + 7 * 86400000), pEnd)
				? pEnd
				: new Date(sDate.getTime() + 7 * 86400000);
			setDueDateStr(format(dDate, "yyyy-MM-dd"));
		}
	}, [selectedProject?.id]);

	// Reset form when dialog opens
	React.useEffect(() => {
		if (open) {
			setTitle("");
			setDescription("");
			setSelectedMemberIds(
				team.autoAssignAllMembers ? team.members.map((m) => m.id) : []
			);
			setPriority(PriorityLevel.MEDIUM);
			setLabels([]);
			setLabelInput("");
			if (projects[0]?.id && !selectedProjectId) {
				setSelectedProjectId(projects[0].id);
			}
		}
	}, [open, projects, team.autoAssignAllMembers, team.members]);

	const toggleMemberSelection = (memberId: string) => {
		setSelectedMemberIds((prev) =>
			prev.includes(memberId)
				? prev.filter((id) => id !== memberId)
				: [...prev, memberId]
		);
	};

	const handleSelectAllMembers = () => {
		if (selectedMemberIds.length === team.members.length) {
			setSelectedMemberIds([]);
		} else {
			setSelectedMemberIds(team.members.map((m) => m.id));
		}
	};

	const handleAddLabel = () => {
		const trimmed = labelInput.trim();
		if (trimmed && !labels.includes(trimmed)) {
			setLabels((prev) => [...prev, trimmed]);
			setLabelInput("");
		}
	};

	const handleRemoveLabel = (lbl: string) => {
		setLabels((prev) => prev.filter((l) => l !== lbl));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) {
			toast.error("Please enter a task title");
			return;
		}

		if (!selectedProjectId) {
			toast.error("Please select a project for this task");
			return;
		}

		const start = new Date(startDateStr);
		const end = new Date(dueDateStr);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			toast.error("Please provide valid dates");
			return;
		}

		if (end < start) {
			toast.error("Task due date cannot be earlier than start date");
			return;
		}

		if (selectedProject) {
			const pStart = new Date(selectedProject.startPeriod);
			const pEnd = new Date(selectedProject.endPeriod);

			if (start < pStart || start > pEnd) {
				toast.error(
					`Task start date must be within project date range (${format(
						pStart,
						"MMM d, yyyy"
					)} - ${format(pEnd, "MMM d, yyyy")})`
				);
				return;
			}

			if (end > pEnd || end < pStart) {
				toast.error(
					`Task due date must be within project date range (${format(
						pStart,
						"MMM d, yyyy"
					)} - ${format(pEnd, "MMM d, yyyy")})`
				);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const res = await createTask({
				title: title.trim(),
				description: description.trim(),
				projectId: selectedProjectId,
				workspaceId,
				createdById: currentMemberId,
				priority,
				status: Status.TODO,
				startPeriod: start,
				endPeriod: end,
				memberIds: selectedMemberIds,
				labels,
				teamId: team.id,
			});

			if (res.success) {
				toast.success(res.message || "Task assigned successfully!");
				onTaskCreated?.(res.task);
				onOpenChange(false);
			} else {
				toast.error(res.message || "Failed to create task");
			}
		} catch {
			toast.error("An unexpected error occurred while assigning task");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full sm:max-w-2xl bg-primary text-secondary border border-secondary/20 rounded-[20px] max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
				<DialogHeader className="space-y-1 pb-3 border-b border-secondary/15">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
							<Diamond className="w-4 h-4" />
						</div>
						<div>
							<DialogTitle className="text-lg font-bold text-secondary">
								Assign Task — {team.name}
							</DialogTitle>
							<DialogDescription className="text-xs text-secondary/60">
								Create and assign a task to members of this team under an existing project.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					{/* Title Field */}
					<div>
						<label className="text-xs font-semibold text-secondary/80 block mb-1">
							Task Title <span className="text-red-400">*</span>
						</label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Implement user dashboard widgets"
							className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-10 text-sm focus-visible:ring-accent"
							disabled={isSubmitting}
							autoFocus
						/>
					</div>

					{/* Project Selector */}
					<div>
						<label className="text-xs font-semibold text-secondary/80 block mb-1">
							Project <span className="text-red-400">*</span>
						</label>
						{projects.length === 0 ? (
							<p className="text-xs text-amber-300 italic">
								No projects available in this workspace. Please create a project first.
							</p>
						) : (
							<Select
								value={selectedProjectId}
								onValueChange={(val) => setSelectedProjectId(val)}
								disabled={isSubmitting}
							>
								<SelectTrigger className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-10 text-xs">
									<div className="flex items-center gap-2 truncate">
										<FolderGit2 className="w-3.5 h-3.5 text-accent shrink-0" />
										<SelectValue placeholder="Select a project..." />
									</div>
								</SelectTrigger>
								<SelectContent className="bg-primary text-secondary border border-secondary/20 max-h-56">
									{projects.map((proj) => (
										<SelectItem
											key={proj.id}
											value={proj.id}
											className="cursor-pointer text-xs"
										>
											<div className="flex items-center justify-between gap-4 w-full">
												<span className="font-semibold truncate">{proj.title}</span>
												<span className="text-[10px] text-secondary/50 shrink-0">
													{format(new Date(proj.startPeriod), "MMM d")} -{" "}
													{format(new Date(proj.endPeriod), "MMM d, yyyy")}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					{/* Description Field */}
					<div>
						<label className="text-xs font-semibold text-secondary/80 block mb-1">
							Description
						</label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the scope, objectives, or acceptance criteria..."
							rows={3}
							className="bg-black/30 border-secondary/25 text-secondary placeholder:text-secondary/40 text-xs rounded-[10px] resize-y focus-visible:ring-accent"
							disabled={isSubmitting}
						/>
					</div>

					{/* Assign Team Members */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-xs font-semibold text-secondary/80 flex items-center gap-1.5">
								<Users className="w-3.5 h-3.5 text-accent" />
								Assign to Team Members ({selectedMemberIds.length}/{team.members.length})
							</label>
							<button
								type="button"
								onClick={handleSelectAllMembers}
								className="text-[11px] text-accent hover:underline font-medium cursor-pointer"
							>
								{selectedMemberIds.length === team.members.length
									? "Deselect All"
									: "Select All"}
							</button>
						</div>

						{team.autoAssignAllMembers && (
							<div className="mb-2 rounded-[10px] bg-secondary/10 border border-secondary/15 px-3 py-2 flex items-center gap-2 text-[11px] text-secondary/80">
								<UserCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
								<span>
									Auto-assign all members is enabled for this team. All {team.members.length} active member{team.members.length === 1 ? "" : "s"} are pre-selected by default.
								</span>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1 rounded-[12px] bg-black/20 border border-secondary/15">
							{team.members.map((member) => {
								const isSelected = selectedMemberIds.includes(member.id);
								const isLead = (team.leadIds || []).includes(member.id);

								return (
									<div
										key={member.id}
										onClick={() => toggleMemberSelection(member.id)}
										className={`flex items-center justify-between p-2 rounded-[10px] cursor-pointer transition-all border ${
											isSelected
												? "bg-accent/15 border-accent/40 text-secondary"
												: "bg-black/30 border-secondary/10 hover:bg-black/40 text-secondary/80"
										}`}
									>
										<div className="flex items-center gap-2 min-w-0">
											<PresenceAvatar
												userId={member.userId}
												name={member.user?.fullName}
												size="sm"
												ringColor="ring-primary"
											/>
											<div className="min-w-0">
												<div className="flex items-center gap-1">
													<p className="text-xs font-semibold truncate">
														{member.user?.fullName}
													</p>
													{isLead && (
														<Crown className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
													)}
												</div>
												<p className="text-[10px] text-secondary/50 truncate">
													{member.user?.email}
												</p>
											</div>
										</div>
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => toggleMemberSelection(member.id)}
											className="border-secondary/40 data-[state=checked]:bg-accent data-[state=checked]:text-primary"
										/>
									</div>
								);
							})}
						</div>
					</div>

					{/* Date Range & Priority Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="text-xs font-semibold text-secondary/80 block mb-1">
								Start Date
							</label>
							<Input
								type="date"
								value={startDateStr}
								onChange={(e) => setStartDateStr(e.target.value)}
								className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-9 text-xs focus-visible:ring-accent"
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="text-xs font-semibold text-secondary/80 block mb-1">
								Due Date
							</label>
							<Input
								type="date"
								value={dueDateStr}
								onChange={(e) => setDueDateStr(e.target.value)}
								className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-9 text-xs focus-visible:ring-accent"
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="text-xs font-semibold text-secondary/80 block mb-1">
								Priority
							</label>
							<Select
								value={priority}
								onValueChange={(val) => setPriority(val as PriorityLevel)}
								disabled={isSubmitting}
							>
								<SelectTrigger className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-9 text-xs">
									<SelectValue placeholder="Priority" />
								</SelectTrigger>
								<SelectContent className="bg-primary text-secondary border border-secondary/20">
									{PRIORITY_OPTIONS.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
											className="text-xs cursor-pointer"
										>
											<span className="font-semibold">{opt.label}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Labels */}
					<div>
						<label className="text-xs font-semibold text-secondary/80 block mb-1">
							Labels
						</label>
						<div className="flex items-center gap-2 mb-2">
							<Input
								value={labelInput}
								onChange={(e) => setLabelInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddLabel();
									}
								}}
								placeholder="Type a label and press Enter..."
								className="bg-black/30 border-secondary/25 text-secondary rounded-[10px] h-8 text-xs focus-visible:ring-accent"
								disabled={isSubmitting}
							/>
							<Button
								type="button"
								size="sm"
								onClick={handleAddLabel}
								className="h-8 px-2.5 rounded-full bg-secondary text-primary hover:bg-secondary/90 text-xs font-semibold"
								disabled={isSubmitting || !labelInput.trim()}
							>
								<Plus className="w-3.5 h-3.5 mr-1" /> Add
							</Button>
						</div>

						{labels.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{labels.map((lbl) => (
									<Badge
										key={lbl}
										className="bg-accent/15 text-accent border border-accent/30 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1"
									>
										<Tag className="w-2.5 h-2.5" />
										{lbl}
										<button
											type="button"
											onClick={() => handleRemoveLabel(lbl)}
											className="hover:text-red-400 ml-1"
										>
											<X className="w-2.5 h-2.5" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{team.notifyAllOnNewTask !== false && (
						<div className="rounded-[10px] bg-secondary/10 border border-secondary/15 px-3 py-2 flex items-center gap-2 text-[11px] text-secondary/80">
							<Bell className="w-3.5 h-3.5 text-secondary shrink-0" />
							<span>
								All members of {team.name} will be notified when this task is created.
							</span>
						</div>
					)}

					<DialogFooter className="pt-3 border-t border-secondary/15 flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="rounded-full text-secondary/70 hover:text-secondary text-xs h-9"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !title.trim() || !selectedProjectId}
							className="rounded-full bg-accent text-primary hover:bg-accent/90 font-bold text-xs h-9 px-5 cursor-pointer shadow-md"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Assigning...
								</>
							) : (
								<>
									<Plus className="w-3.5 h-3.5 mr-1.5" />
									Assign Task
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
