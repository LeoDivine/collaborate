"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	deleteProject,
	updateProjectDetails,
	updateProjectMembers,
} from "@/lib/services/project.services";
import type { MembersUsers, Projects } from "@/lib/types";
import { getInitials, renderPriority, renderStatus } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import {
	AlertCircle,
	ArrowRight,
	Box,
	Calendar as CalendarIcon,
	Check,
	CheckCircle2,
	ChevronDown,
	ExternalLink,
	Flag,
	Loader2,
	Plus,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PriorityLevel, Status } from "../../../../generated/prisma/enums";

const PRIORITY_OPTIONS = [
	{ label: "Urgent", value: PriorityLevel.URGENT },
	{ label: "High", value: PriorityLevel.HIGH },
	{ label: "Medium", value: PriorityLevel.MEDIUM },
	{ label: "Low", value: PriorityLevel.LOW },
	{ label: "No Priority", value: PriorityLevel.NO_PRIORITY },
];

const STATUS_OPTIONS = [
	{ label: "To Do", value: Status.TODO },
	{ label: "In Progress", value: Status.IN_PROGRESS },
	{ label: "On Hold", value: Status.ON_HOLD },
	{ label: "Completed", value: Status.COMPLETED },
	{ label: "Cancelled", value: Status.CANCELLED },
];

const formatDescription = (desc: string) => {
	if (!desc || !desc.trim()) return "<p>No description provided.</p>";
	const trimmed = desc.trim();
	if (trimmed.startsWith("<")) return trimmed;
	return trimmed
		.split(/\n\s*\n/)
		.map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
		.join("");
};

interface ProjectPeekSheetProps {
	project: Projects | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceMembers?: MembersUsers[];
	currentUserId?: string;
	canEditProject?: boolean;
	onProjectUpdated?: (updatedProject: Partial<Projects> & { id: string }) => void;
	onProjectDeleted?: (projectId: string) => void;
}

export default function ProjectPeekSheet({
	project,
	open,
	onOpenChange,
	workspaceMembers = [],
	currentUserId,
	canEditProject,
	onProjectUpdated,
	onProjectDeleted,
}: ProjectPeekSheetProps) {
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
	const [isUpdatingDates, setIsUpdatingDates] = useState(false);
	const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const currentMember = workspaceMembers.find(
		(m) => m.userId === currentUserId,
	);
	const isWorkspaceAdmin =
		currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
	const projectMember = project?.projectMembers?.find(
		(pm) =>
			pm.member?.userId === currentUserId ||
			pm.memberId === currentMember?.id,
	);
	const isProjectLead = projectMember?.projectRole === "PROJECT_LEAD";
	const isProjectCreator = project?.createdById === currentMember?.id;

	const hasEditPermission =
		canEditProject !== undefined
			? canEditProject
			: isWorkspaceAdmin || isProjectLead || isProjectCreator;

	if (!project) return null;

	const startDate = new Date(project.startPeriod);
	const endDate = new Date(project.endPeriod);
	const isOverdue =
		isPast(endDate) &&
		!isToday(endDate) &&
		project.status !== Status.COMPLETED &&
		project.status !== Status.CANCELLED;

	const totalTasks = project.tasks?.length || 0;
	let projectProgress = 0;
	if (totalTasks > 0) {
		const totalTaskProgressSum = project.tasks.reduce((acc, t) => {
			const totalMilestones = t.milestones?.length || 0;
			if (totalMilestones > 0) {
				const doneMilestones =
					t.milestones?.filter((m) => m.status === "DONE").length || 0;
				return acc + (doneMilestones / totalMilestones) * 100;
			}
			if (t.status === Status.COMPLETED) return acc + 100;
			if (t.status === Status.IN_PROGRESS) return acc + 50;
			return acc;
		}, 0);
		projectProgress = Math.round(totalTaskProgressSum / totalTasks);
	} else {
		projectProgress = project.status === Status.COMPLETED ? 100 : 0;
	}

	const completedTasksCount =
		project.tasks?.filter((t) => t.status === Status.COMPLETED).length || 0;

	const handleStatusChange = async (newStatus: Status) => {
		if (newStatus === project.status) return;
		setIsUpdatingStatus(true);
		onProjectUpdated?.({ id: project.id, status: newStatus });

		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { status: newStatus },
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update status");
				onProjectUpdated?.({ id: project.id, status: project.status });
			} else {
				toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
			}
		} catch {
			toast.error("An error occurred while updating status");
			onProjectUpdated?.({ id: project.id, status: project.status });
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handlePriorityChange = async (newPriority: PriorityLevel) => {
		if (newPriority === project.priority) return;
		setIsUpdatingPriority(true);
		onProjectUpdated?.({ id: project.id, priority: newPriority });

		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { priority: newPriority },
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update priority");
				onProjectUpdated?.({ id: project.id, priority: project.priority });
			} else {
				toast.success(`Priority set to ${newPriority}`);
			}
		} catch {
			toast.error("An error occurred while updating priority");
			onProjectUpdated?.({ id: project.id, priority: project.priority });
		} finally {
			setIsUpdatingPriority(false);
		}
	};

	const handleDateRangeChange = async (range: { from?: Date; to?: Date }) => {
		if (!range.from || !range.to) return;
		setIsUpdatingDates(true);
		onProjectUpdated?.({
			id: project.id,
			startPeriod: range.from,
			endPeriod: range.to,
		});

		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: {
					startDate: range.from,
					dueDate: range.to,
				},
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update timeline");
				onProjectUpdated?.({
					id: project.id,
					startPeriod: project.startPeriod,
					endPeriod: project.endPeriod,
				});
			} else {
				toast.success("Project timeline updated");
			}
		} catch {
			toast.error("An error occurred while updating dates");
			onProjectUpdated?.({
				id: project.id,
				startPeriod: project.startPeriod,
				endPeriod: project.endPeriod,
			});
		} finally {
			setIsUpdatingDates(false);
		}
	};

	const handleMemberToggle = async (memberId: string) => {
		const currentMemberIds =
			project.projectMembers?.map((pm) => pm.memberId) || [];
		const isAssigned = currentMemberIds.includes(memberId);
		const newMemberIds = isAssigned
			? currentMemberIds.filter((id) => id !== memberId)
			: [...currentMemberIds, memberId];

		setIsUpdatingMembers(true);
		try {
			const res = await updateProjectMembers({
				projectId: project.id,
				projectMembers: newMemberIds,
			});
			if (!res.success) {
				toast.error(res.message || "Failed to update members");
			} else {
				toast.success("Project members updated");
				const updatedProjectMembers = newMemberIds.map((id) => {
					const existing = project.projectMembers?.find(
						(pm) => pm.memberId === id,
					);
					if (existing) return existing;
					const foundMember = workspaceMembers.find((m) => m.id === id);
					return {
						id: `temp-${id}`,
						projectId: project.id,
						memberId: id,
						projectRole: "CONTRIBUTOR",
						member: foundMember,
					} as any;
				});
				onProjectUpdated?.({
					id: project.id,
					projectMembers: updatedProjectMembers,
				});
			}
		} catch {
			toast.error("Failed to update project members");
		} finally {
			setIsUpdatingMembers(false);
		}
	};

	const handleDeleteProject = async () => {
		setIsDeleting(true);
		try {
			const res = await deleteProject(project.id);
			if (!res.success) {
				toast.error(res.message || "Failed to delete project");
			} else {
				toast.success("Project deleted successfully");
				setDeleteDialogOpen(false);
				onOpenChange(false);
				onProjectDeleted?.(project.id);
			}
		} catch {
			toast.error("Failed to delete project");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-xl lg:max-w-2xl bg-primary text-secondary border-l border-secondary/20 overflow-y-auto p-0 gap-0 shadow-2xl flex flex-col"
				>
					{/* Top Action Bar */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-secondary/10 bg-primary sticky top-0 z-10 backdrop-blur-md">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="bg-secondary/10 text-secondary border-secondary/20 flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold"
							>
								<Box className="w-3.5 h-3.5 text-accent" />
								<span>Project</span>
							</Badge>
							{isOverdue && (
								<Badge className="bg-destructive/20 text-destructive border-0 text-xs flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									Overdue
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-2 pr-6">
							<Link
								href={`/projects/${project.id}`}
								className="text-secondary/70 hover:text-secondary hover:bg-secondary/10 p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium"
								title="Open in full page"
							>
								<ExternalLink className="w-4 h-4" />
								<span>Full Page</span>
							</Link>
							{hasEditPermission && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setDeleteDialogOpen(true)}
									className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
									title="Delete Project"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							)}
						</div>
					</div>

					{/* Sheet Body */}
					<div className="flex-1 px-6 py-5 flex flex-col gap-6">
						{/* Title */}
						<div>
							<SheetHeader className="p-0 text-left">
								<SheetTitle className="text-xl sm:text-2xl font-bold text-secondary leading-snug">
									{project.title}
								</SheetTitle>
								<SheetDescription className="sr-only">
									Project details for {project.title}
								</SheetDescription>
							</SheetHeader>
						</div>

						{/* Quick Properties Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[16px] bg-secondary/5 border border-secondary/10">
							{/* Status */}
							<div className="flex flex-col gap-1">
								<span className="text-[11px] font-semibold text-secondary/60 uppercase tracking-wider">
									Status
								</span>
								{hasEditPermission ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												disabled={isUpdatingStatus}
												className={`${renderStatus(
													project.status,
												)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity`}
											>
												{isUpdatingStatus ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<CheckCircle2 className="w-3 h-3" />
												)}
												<span>{project.status.replace("_", " ")}</span>
												<ChevronDown className="w-3 h-3 opacity-70" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[140px] rounded-[12px]">
											{STATUS_OPTIONS.map((opt) => (
												<DropdownMenuItem
													key={opt.value}
													onClick={() => handleStatusChange(opt.value)}
													className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-2"
												>
													<span className="flex items-center gap-2">
														<span
															className={`w-2 h-2 rounded-full ${renderStatus(
																opt.value,
															)}`}
														/>
														{opt.label}
													</span>
													{project.status === opt.value && (
														<Check className="w-3.5 h-3.5 text-accent" />
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<div
										className={`${renderStatus(
											project.status,
										)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5`}
									>
										<CheckCircle2 className="w-3 h-3" />
										<span>{project.status.replace("_", " ")}</span>
									</div>
								)}
							</div>

							{/* Priority */}
							<div className="flex flex-col gap-1">
								<span className="text-[11px] font-semibold text-secondary/60 uppercase tracking-wider">
									Priority
								</span>
								{hasEditPermission ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												disabled={isUpdatingPriority}
												className={`${renderPriority(
													project.priority,
												)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold text-primary flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity`}
											>
												{isUpdatingPriority ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<Flag className="w-3 h-3" />
												)}
												<span>{project.priority}</span>
												<ChevronDown className="w-3 h-3 opacity-70" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[140px] rounded-[12px]">
											{PRIORITY_OPTIONS.map((opt) => (
												<DropdownMenuItem
													key={opt.value}
													onClick={() => handlePriorityChange(opt.value)}
													className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-2"
												>
													<span className="flex items-center gap-2">
														<span
															className={`w-2 h-2 rounded-full ${renderPriority(
																opt.value,
															)}`}
														/>
														{opt.label}
													</span>
													{project.priority === opt.value && (
														<Check className="w-3.5 h-3.5 text-accent" />
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<div
										className={`${renderPriority(
											project.priority,
										)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold text-primary flex items-center gap-1.5`}
									>
										<Flag className="w-3 h-3" />
										<span>{project.priority}</span>
									</div>
								)}
							</div>

							{/* Due Date / Timeline */}
							<div className="flex flex-col gap-1 col-span-2">
								<span className="text-[11px] font-semibold text-secondary/60 uppercase tracking-wider">
									Timeline
								</span>
								{hasEditPermission ? (
									<Popover>
										<PopoverTrigger asChild>
											<button
												disabled={isUpdatingDates}
												className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-lg border border-secondary/15 hover:bg-secondary/10 transition-colors w-fit ${
													isOverdue
														? "text-destructive font-semibold bg-destructive/10"
														: "text-secondary"
												}`}
											>
												{isUpdatingDates ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<CalendarIcon className="w-3.5 h-3.5 text-accent" />
												)}
												<span>{format(startDate, "MMM d, yyyy")}</span>
												<ArrowRight className="w-3 h-3 text-secondary/40" />
												<span>{format(endDate, "MMM d, yyyy")}</span>
											</button>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto p-0 bg-primary border border-secondary/20 text-secondary rounded-[16px] shadow-2xl"
											align="start"
										>
											<Calendar
												mode="range"
												defaultMonth={startDate}
												selected={{
													from: startDate,
													to: endDate,
												}}
												onSelect={(range) => {
													if (range?.from && range?.to) {
														handleDateRangeChange({
															from: range.from,
															to: range.to,
														});
													}
												}}
												className="rounded-[16px] bg-primary text-secondary"
											/>
										</PopoverContent>
									</Popover>
								) : (
									<div
										className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-lg border border-secondary/15 w-fit ${
											isOverdue
												? "text-destructive font-semibold bg-destructive/10"
												: "text-secondary"
										}`}
									>
										<CalendarIcon className="w-3.5 h-3.5 text-accent" />
										<span>{format(startDate, "MMM d, yyyy")}</span>
										<ArrowRight className="w-3 h-3 text-secondary/40" />
										<span>{format(endDate, "MMM d, yyyy")}</span>
									</div>
								)}
							</div>
						</div>

						{/* Overall Progress */}
						<div className="flex flex-col gap-2 p-4 rounded-[16px] bg-secondary/5 border border-secondary/10">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
									Overall Progress
								</span>
								<span className="text-xs font-bold text-accent">
									{projectProgress}%
								</span>
							</div>
							<Progress value={projectProgress} className="h-2 bg-secondary/15" />
							<div className="flex items-center justify-between text-[11px] text-secondary/60">
								<span>
									{completedTasksCount} of {totalTasks} tasks completed
								</span>
								<span>
									{totalTasks === 0
										? "No tasks yet"
										: `${totalTasks - completedTasksCount} remaining`}
								</span>
							</div>
						</div>

						{/* Project Description */}
						{project.description && (
							<div className="flex flex-col gap-2">
								<h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
									Description
								</h4>
								<div
									className="wysiwyg-content text-xs text-secondary/80 leading-relaxed bg-secondary/5 p-3.5 rounded-[12px] border border-secondary/10 max-h-[260px] overflow-y-auto custom-scrollbar"
									dangerouslySetInnerHTML={{
										__html: formatDescription(project.description),
									}}
								/>
							</div>
						)}

						{/* Assignees / Team Members */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
									<Users className="w-3.5 h-3.5 text-accent" />
									Team Members ({project.projectMembers?.length || 0})
								</h4>

								{/* Add Member Dropdown */}
								{hasEditPermission && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={isUpdatingMembers}
												className="h-7 rounded-full text-xs border-secondary/20 hover:bg-secondary/10 text-secondary gap-1"
											>
												{isUpdatingMembers ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<UserPlus className="w-3 h-3 text-accent" />
												)}
												<span>Manage Members</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[230px] rounded-[14px] max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
											<div className="px-2 py-1 text-xs font-bold text-secondary/70">
												Workspace Members
											</div>
											{workspaceMembers.map((m) => {
												const isAssigned = project.projectMembers?.some(
													(pm) => pm.memberId === m.id,
												);
												return (
													<div
														key={m.id}
														onClick={() => handleMemberToggle(m.id)}
														className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs"
													>
														<div className="flex items-center gap-2 truncate">
															<Avatar className="w-5 h-5">
																<AvatarFallback className="text-[9px] bg-secondary/15 text-secondary">
																	{getInitials(
																		m.user?.fullName || m.user?.email || "U",
																	)}
																</AvatarFallback>
															</Avatar>
															<span className="truncate">
																{m.user?.fullName || m.user?.email}
															</span>
														</div>
														<Checkbox checked={isAssigned} />
													</div>
												);
											})}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>

							{/* Members List */}
							<div className="flex flex-wrap gap-2">
								{project.projectMembers && project.projectMembers.length > 0 ? (
									project.projectMembers.map((pm) => {
										const user = pm.member?.user;
										const name = user?.fullName || user?.email || "Member";
										return (
											<div
												key={pm.id}
												className="flex items-center gap-2 bg-secondary/10 border border-secondary/15 rounded-full pl-1.5 pr-3 py-1 text-xs text-secondary"
											>
												<Avatar className="w-6 h-6">
													<AvatarFallback className="text-[10px] bg-accent text-primary font-bold">
														{getInitials(name)}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium truncate max-w-[120px]">
													{name}
												</span>
												<Badge
													variant="outline"
													className="text-[9px] py-0 px-1.5 border-secondary/20 bg-secondary/5 font-semibold text-secondary/70"
												>
													{pm.projectRole?.toLowerCase().replace("_", " ")}
												</Badge>
											</div>
										);
									})
								) : (
									<p className="text-xs text-secondary/50 italic py-1">
										No team members assigned yet
									</p>
								)}
							</div>
						</div>

						{/* Associated Tasks List */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5 text-accent" />
									Tasks ({totalTasks})
								</h4>
								<Link
									href={`/projects/${project.id}`}
									className="text-xs text-accent hover:underline flex items-center gap-1"
								>
									<span>View all</span>
									<ArrowRight className="w-3 h-3" />
								</Link>
							</div>

							<div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
								{project.tasks && project.tasks.length > 0 ? (
									project.tasks.map((task) => (
										<Link
											key={task.id}
											href={`/tasks/${task.id}`}
											className="flex items-center justify-between p-2.5 rounded-[12px] bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 transition-colors group"
										>
											<div className="flex items-center gap-2.5 min-w-0 flex-1">
												<CheckCircle2
													className={`w-4 h-4 shrink-0 ${
														task.status === Status.COMPLETED
															? "text-success"
															: "text-secondary/40"
													}`}
												/>
												<span
													className={`text-xs font-medium truncate group-hover:text-accent transition-colors ${
														task.status === Status.COMPLETED
															? "line-through text-secondary/60"
															: "text-secondary"
													}`}
												>
													{task.title}
												</span>
											</div>

											<div className="flex items-center gap-2 shrink-0">
												<span
													className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${renderPriority(
														task.priority,
													)} text-primary`}
												>
													{task.priority}
												</span>
												<span
													className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${renderStatus(
														task.status,
													)} text-primary`}
												>
													{task.status.replace("_", " ")}
												</span>
											</div>
										</Link>
									))
								) : (
									<div className="p-4 rounded-[12px] bg-secondary/5 border border-secondary/10 text-center text-xs text-secondary/50">
										No tasks created in this project yet
									</div>
								)}
							</div>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="bg-primary text-secondary border border-secondary/20 rounded-[20px] max-w-md">
					<DialogHeader>
						<DialogTitle className="text-destructive flex items-center gap-2">
							<Trash2 className="w-5 h-5" />
							Delete Project
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-sm">
							Are you sure you want to delete{" "}
							<span className="font-semibold text-secondary">
								"{project.title}"
							</span>
							? All tasks, milestones, comments, and resources associated with this
							project will be permanently deleted. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0 mt-4">
						<DialogClose asChild>
							<Button
								variant="ghost"
								className="rounded-full text-secondary hover:bg-secondary/10"
							>
								Cancel
							</Button>
						</DialogClose>
						<Button
							variant="destructive"
							onClick={handleDeleteProject}
							disabled={isDeleting}
							className="rounded-full gap-2"
						>
							{isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
							Delete Project
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
