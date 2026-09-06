"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
	deleteTask,
	toggleMilestoneStatus,
	updateTaskDetails,
	updateTaskMembers,
} from "@/lib/services/task.services";
import type { MembersUsers, Tasks } from "@/lib/types";
import { formatPriority, formatStatus, getInitials, renderPriority, renderStatus } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
	AlertCircle,
	ArrowRight,
	Box,
	Calendar as CalendarIcon,
	Check,
	CheckCircle2,
	ChevronDown,
	Diamond,
	ExternalLink,
	Flag,
	Loader2,
	Plus,
	SlidersHorizontal,
	Squircle,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MileStoneStatus, PriorityLevel, Status } from "../../../../generated/prisma/enums";

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
	{ label: "Canceled", value: Status.CANCELLED },
];

interface TaskPeekSheetProps {
	task: Tasks | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceMembers?: MembersUsers[];
	currentUserId?: string;
	canEditTask?: boolean;
	canDeleteTask?: boolean;
	onTaskUpdated?: (updatedTask: Partial<Tasks> & { id: string }) => void;
	onTaskDeleted?: (taskId: string) => void;
}

export default function TaskPeekSheet({
	task,
	open,
	onOpenChange,
	workspaceMembers = [],
	currentUserId,
	canEditTask,
	canDeleteTask,
	onTaskUpdated,
	onTaskDeleted,
}: TaskPeekSheetProps) {
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
	const [isUpdatingDates, setIsUpdatingDates] = useState(false);
	const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [togglingMilestoneId, setTogglingMilestoneId] = useState<string | null>(
		null,
	);

	const currentMember = workspaceMembers.find(
		(m) => m.userId === currentUserId || m.id === currentUserId,
	);
	const isWorkspaceAdmin =
		currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
	const projectMember = task?.project?.projectMembers?.find(
		(pm) =>
			pm.member?.userId === currentUserId ||
			pm.memberId === currentMember?.id,
	);
	const isProjectLead = projectMember?.projectRole === "PROJECT_LEAD";
	const isCreator = task?.createdById === currentMember?.id;
	const isAssignee = task?.taskMembers?.some(
		(tm) =>
			tm.member?.userId === currentUserId ||
			tm.memberId === currentMember?.id,
	);

	const hasEditPermission =
		canEditTask !== undefined
			? canEditTask
			: isWorkspaceAdmin || isProjectLead || isCreator || isAssignee;

	const hasDeletePermission =
		canDeleteTask !== undefined
			? canDeleteTask
			: isWorkspaceAdmin || isProjectLead || isCreator;

	if (!task) return null;

	const startDate = new Date(task.startPeriod);
	const endDate = new Date(task.endPeriod);
	const isOverdue =
		isPast(endDate) &&
		!isToday(endDate) &&
		task.status !== Status.COMPLETED &&
		task.status !== Status.CANCELLED;

	const totalMilestones = task.milestones?.length || 0;
	const completedMilestones =
		task.milestones?.filter((m) => m.status === MileStoneStatus.DONE)
			.length || 0;
	const milestonePercent =
		totalMilestones > 0
			? Math.round((completedMilestones / totalMilestones) * 100)
			: task.status === Status.COMPLETED
			? 100
			: 0;

	const handleStatusChange = async (newStatus: Status) => {
		if (newStatus === task.status) return;
		setIsUpdatingStatus(true);
		let nextMilestones = task.milestones;
		if (newStatus === Status.COMPLETED) {
			nextMilestones = (task.milestones || []).map((m) => ({
				...m,
				status: MileStoneStatus.DONE,
				...(currentMember?.id ? { completedById: currentMember.id } : {}),
			}));
		} else if (newStatus === Status.IN_PROGRESS || newStatus === Status.TODO) {
			nextMilestones = (task.milestones || []).map((m) => ({
				...m,
				status: MileStoneStatus.NOT_STARTED,
				completedById: null,
			}));
		}
		onTaskUpdated?.({ id: task.id, status: newStatus, milestones: nextMilestones });

		try {
			const res = await updateTaskDetails({
				taskId: task.id,
				values: { status: newStatus },
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update status");
				onTaskUpdated?.({ id: task.id, status: task.status, milestones: task.milestones });
			} else {
				if (res?.task && (res.task as any).milestones) {
					onTaskUpdated?.({ id: task.id, status: newStatus, milestones: (res.task as any).milestones });
				}
				toast.success(`Status updated to ${formatStatus(newStatus)}`);
			}
		} catch {
			toast.error("An error occurred while updating status");
			onTaskUpdated?.({ id: task.id, status: task.status });
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handlePriorityChange = async (newPriority: PriorityLevel) => {
		if (newPriority === task.priority) return;
		setIsUpdatingPriority(true);
		onTaskUpdated?.({ id: task.id, priority: newPriority });

		try {
			const res = await updateTaskDetails({
				taskId: task.id,
				values: { priority: newPriority },
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update priority");
				onTaskUpdated?.({ id: task.id, priority: task.priority });
			} else {
				toast.success(`Priority set to ${formatPriority(newPriority)}`);
			}
		} catch {
			toast.error("An error occurred while updating priority");
			onTaskUpdated?.({ id: task.id, priority: task.priority });
		} finally {
			setIsUpdatingPriority(false);
		}
	};

	const handleDateRangeChange = async (range: { from?: Date; to?: Date }) => {
		if (!range.from || !range.to) return;
		setIsUpdatingDates(true);
		onTaskUpdated?.({
			id: task.id,
			startPeriod: range.from,
			endPeriod: range.to,
		});

		try {
			const res = await updateTaskDetails({
				taskId: task.id,
				values: {
					startPeriod: range.from,
					endPeriod: range.to,
				},
			});
			if (res && !res.success) {
				toast.error(res.message || "Failed to update timeline");
				onTaskUpdated?.({
					id: task.id,
					startPeriod: task.startPeriod,
					endPeriod: task.endPeriod,
				});
			} else {
				toast.success("Task timeline updated");
			}
		} catch {
			toast.error("An error occurred while updating dates");
			onTaskUpdated?.({
				id: task.id,
				startPeriod: task.startPeriod,
				endPeriod: task.endPeriod,
			});
		} finally {
			setIsUpdatingDates(false);
		}
	};

	const handleToggleMilestone = async (
		milestoneId: string,
		currentStatus: MileStoneStatus,
	) => {
		setTogglingMilestoneId(milestoneId);
		const newStatus =
			currentStatus === MileStoneStatus.DONE
				? MileStoneStatus.NOT_STARTED
				: MileStoneStatus.DONE;

		// Optimistic update
		const updatedMilestones = (task.milestones || []).map((m) =>
			m.id === milestoneId ? { ...m, status: newStatus } : m,
		);
		onTaskUpdated?.({ id: task.id, milestones: updatedMilestones });

		try {
			const res = await toggleMilestoneStatus({
				milestoneId,
				status: newStatus,
			});
			if (!res.success) {
				toast.error(res.message || "Failed to update milestone");
				onTaskUpdated?.({ id: task.id, milestones: task.milestones });
			} else {
				toast.success(
					newStatus === MileStoneStatus.DONE
						? "Milestone marked as complete"
						: "Milestone marked as pending",
				);
			}
		} catch {
			toast.error("Failed to update milestone");
			onTaskUpdated?.({ id: task.id, milestones: task.milestones });
		} finally {
			setTogglingMilestoneId(null);
		}
	};

	const handleMemberToggle = async (memberId: string) => {
		const currentMemberIds =
			task.taskMembers?.map((tm) => tm.memberId) || [];
		const isAssigned = currentMemberIds.includes(memberId);
		const newMemberIds = isAssigned
			? currentMemberIds.filter((id) => id !== memberId)
			: [...currentMemberIds, memberId];

		setIsUpdatingMembers(true);
		try {
			const res = await updateTaskMembers({
				taskId: task.id,
				memberIds: newMemberIds,
			});
			if (!res.success) {
				toast.error(res.message || "Failed to update assignees");
			} else {
				toast.success("Assignees updated");
				// Update task members optimistically
				const updatedTaskMembers = newMemberIds.map((id) => {
					const existing = task.taskMembers?.find(
						(tm) => tm.memberId === id,
					);
					if (existing) return existing;
					const foundMember = workspaceMembers.find(
						(m) => m.id === id,
					);
					return {
						id: `temp-${id}`,
						taskId: task.id,
						memberId: id,
						member: foundMember,
					} as any;
				});
				onTaskUpdated?.({
					id: task.id,
					taskMembers: updatedTaskMembers,
				});
			}
		} catch {
			toast.error("Failed to update assignees");
		} finally {
			setIsUpdatingMembers(false);
		}
	};

	const handleDeleteTask = async () => {
		setIsDeleting(true);
		try {
			const res = await deleteTask(task.id);
			if (!res.success) {
				toast.error(res.message || "Failed to delete task");
			} else {
				toast.success("Task deleted successfully");
				setDeleteDialogOpen(false);
				onOpenChange(false);
				onTaskDeleted?.(task.id);
			}
		} catch {
			toast.error("Failed to delete task");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-xl lg:max-w-2xl bg-primary text-secondary border-l border-primary/20 overflow-y-auto p-0 gap-0 shadow-2xl flex flex-col"
				>
					{/* Top Action Bar */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-secondary/10 bg-primary sticky top-0 z-10 backdrop-blur-md">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="bg-secondary/10 text-secondary border-secondary/20 flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold"
							>
								<Diamond className="w-3.5 h-3.5 text-accent" />
								<span>Task</span>
							</Badge>
							{task.project && (
								<Link
									href={`/projects/${task.projectId}`}
									className="hover:opacity-80 transition-opacity"
								>
									<Badge
										variant="outline"
										className="bg-secondary/10 text-secondary border-secondary/20 flex items-center gap-1.5 py-0.5 px-2.5 text-xs font-semibold"
									>
										<Box
											className={`w-3 h-3 ${
												task.status === Status.COMPLETED
													? "text-emerald-500"
													: "text-secondary/70"
											}`}
										/>
										<span className="truncate max-w-[150px]">
											{task.project.title}
										</span>
									</Badge>
								</Link>
							)}
							{isOverdue && (
								<Badge className="bg-destructive/20 text-destructive border-0 text-xs flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									Overdue
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-2 pr-6">
							<Link
								href={`/tasks/${task.id}`}
								className="text-secondary/70 hover:text-secondary hover:bg-secondary/10 p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium"
								title="Open in full page"
							>
								<ExternalLink className="w-4 h-4" />
								<span>Full Page</span>
							</Link>
							{hasDeletePermission && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setDeleteDialogOpen(true)}
									className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
									title="Delete Task"
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
									{task.title}
								</SheetTitle>
								<SheetDescription className="sr-only">
									Task details for {task.title}
								</SheetDescription>
							</SheetHeader>
						</div>

						{/* Quick Properties Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[16px] bg-secondary/5 border border-secondary/10">
							{/* Status */}
							<div className="flex flex-col gap-1 min-w-0">
								<span className="text-[11px] font-semibold text-secondary/60 uppercase tracking-wider">
									Status
								</span>
								{hasEditPermission ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												disabled={isUpdatingStatus}
												className={`${renderStatus(
													task.status,
												)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap shrink-0`}
											>
												{isUpdatingStatus ? (
													<Loader2 className="w-3 h-3 animate-spin shrink-0" />
												) : (
													<CheckCircle2 className="w-3 h-3 shrink-0" />
												)}
												<span className="whitespace-nowrap">
													{formatStatus(task.status)}
												</span>
												<ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[140px] rounded-[12px]">
											{STATUS_OPTIONS.map((opt) => (
												<DropdownMenuItem
													key={opt.value}
													onClick={() =>
														handleStatusChange(opt.value)
													}
													className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-2 whitespace-nowrap"
												>
													<span className="flex items-center gap-2 whitespace-nowrap">
														<span
															className={`w-2 h-2 rounded-full shrink-0 ${renderStatus(
																opt.value,
															)}`}
														/>
														{opt.label}
													</span>
													{task.status === opt.value && (
														<Check className="w-3.5 h-3.5 text-accent shrink-0" />
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<div
										className={`${renderStatus(
											task.status,
										)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0`}
									>
										<CheckCircle2 className="w-3 h-3 shrink-0" />
										<span className="whitespace-nowrap">{formatStatus(task.status)}</span>
									</div>
								)}
							</div>

							{/* Priority */}
							<div className="flex flex-col gap-1 min-w-0">
								<span className="text-[11px] font-semibold text-secondary/60 uppercase tracking-wider">
									Priority
								</span>
								{hasEditPermission ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												disabled={isUpdatingPriority}
												className={`${renderPriority(
													task.priority,
												)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold text-primary flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap shrink-0`}
											>
												{isUpdatingPriority ? (
													<Loader2 className="w-3 h-3 animate-spin shrink-0" />
												) : (
													<Flag className="w-3 h-3 shrink-0" />
												)}
												<span className="whitespace-nowrap">{formatPriority(task.priority)}</span>
												<ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[140px] rounded-[12px]">
											{PRIORITY_OPTIONS.map((opt) => (
												<DropdownMenuItem
													key={opt.value}
													onClick={() =>
														handlePriorityChange(opt.value)
													}
													className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-2 whitespace-nowrap"
												>
													<span className="flex items-center gap-2 whitespace-nowrap">
														<span
															className={`w-2 h-2 rounded-full shrink-0 ${renderPriority(
																opt.value,
															)}`}
														/>
														{opt.label}
													</span>
													{task.priority ===
														opt.value && (
														<Check className="w-3.5 h-3.5 text-accent shrink-0" />
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<div
										className={`${renderPriority(
											task.priority,
										)} w-fit px-2.5 py-1 rounded-full text-xs font-semibold text-primary flex items-center gap-1.5 whitespace-nowrap shrink-0`}
									>
										<Flag className="w-3 h-3 shrink-0" />
										<span className="whitespace-nowrap">{formatPriority(task.priority)}</span>
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
												className={`text-xs font-medium flex items-center gap-1.5 p-1 rounded-lg hover:bg-secondary/10 transition-colors w-fit ${
													isOverdue
														? "text-destructive font-semibold"
														: "text-secondary"
												}`}
											>
												<CalendarIcon className="w-3.5 h-3.5 opacity-80 shrink-0" />
												<span>
													{format(startDate, "MMM d")}
												</span>
												<ArrowRight className="w-3 h-3 opacity-60" />
												<span>
													{format(endDate, "MMM d, yyyy")}
												</span>
												{isToday(endDate) && (
													<span className="text-[10px] bg-accent text-primary px-1.5 py-0.2 rounded font-bold">
														Today
													</span>
												)}
												{isTomorrow(endDate) && (
													<span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.2 rounded font-semibold">
														Tomorrow
													</span>
												)}
											</button>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto p-0 bg-primary border border-secondary/20 text-secondary rounded-[16px] shadow-xl"
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
														handleDateRangeChange(range);
													}
												}}
												className="rounded-[16px] bg-primary text-secondary"
											/>
										</PopoverContent>
									</Popover>
								) : (
									<div
										className={`text-xs font-medium flex items-center gap-1.5 p-1 w-fit ${
											isOverdue
												? "text-destructive font-semibold"
												: "text-secondary"
										}`}
									>
										<CalendarIcon className="w-3.5 h-3.5 opacity-80 shrink-0" />
										<span>{format(startDate, "MMM d")}</span>
										<ArrowRight className="w-3 h-3 opacity-60" />
										<span>{format(endDate, "MMM d, yyyy")}</span>
										{isToday(endDate) && (
											<span className="text-[10px] bg-accent text-primary px-1.5 py-0.2 rounded font-bold">
												Today
											</span>
										)}
										{isTomorrow(endDate) && (
											<span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.2 rounded font-semibold">
												Tomorrow
											</span>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Assignees Section */}
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70 flex items-center gap-1.5">
									<Users className="w-3.5 h-3.5" />
									Assignees (
									{task.taskMembers?.length || 0})
								</h4>
								{hasEditPermission && (
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 text-xs rounded-full hover:bg-secondary/10 text-secondary gap-1 px-2.5"
											>
												<UserPlus className="w-3.5 h-3.5" />
												Manage
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className="w-[240px] p-2 bg-primary border border-secondary/20 text-secondary rounded-[14px] shadow-lg max-h-[300px] overflow-y-auto custom-scrollbar"
											align="end"
										>
											<p className="text-xs font-bold px-2 py-1 text-secondary/70">
												Assign Workspace Members
											</p>
											<div className="flex flex-col gap-1 mt-1">
												{workspaceMembers.map((member) => {
													const user = member.user;
													const isChecked =
														task.taskMembers?.some(
															(tm) =>
																tm.memberId ===
																member.id,
														);
													const name =
														user?.fullName ||
														user?.userName ||
														user?.email ||
														"Member";
													return (
														<label
															key={member.id}
															className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/10 cursor-pointer text-xs"
														>
															<Checkbox
																checked={isChecked}
																onCheckedChange={() =>
																	handleMemberToggle(
																		member.id,
																	)
																}
															/>
															<Avatar className="w-5 h-5">
																<AvatarFallback className="text-[9px] bg-secondary text-primary font-bold">
																	{getInitials(
																		name,
																	)}
																</AvatarFallback>
															</Avatar>
															<span className="truncate flex-1 font-medium">
																{name}
															</span>
														</label>
													);
												})}
											</div>
										</PopoverContent>
									</Popover>
								)}
							</div>

							<div className="flex flex-wrap gap-2 items-center">
								{(!task.taskMembers ||
									task.taskMembers.length === 0) && (
									<p className="text-xs text-secondary/60 italic">
										No assignees assigned to this task.
									</p>
								)}
								{task.taskMembers?.map((tm) => {
									const user = tm.member?.user;
									const name =
										user?.fullName ||
										user?.userName ||
										user?.email ||
										"Member";
									const isCurrentUser =
										currentUserId &&
										(user?.id === currentUserId ||
											tm.member?.userId === currentUserId);
									return (
										<div
											key={tm.id}
											className="flex items-center gap-1.5 bg-secondary/10 border border-secondary/15 rounded-full px-2.5 py-1 text-xs text-secondary"
										>
											<Avatar className="w-4 h-4">
												<AvatarFallback className="text-[8px] bg-secondary text-primary font-bold">
													{getInitials(name)}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium truncate max-w-[120px]">
												{name}
											</span>
											{isCurrentUser && (
												<span className="text-[9px] bg-accent text-primary px-1 rounded font-bold">
													You
												</span>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{/* Description */}
						<div className="flex flex-col gap-2">
							<h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70">
								Description
							</h4>
							{task.description ? (
								<div className="text-sm text-secondary/90 leading-relaxed whitespace-pre-wrap bg-secondary/5 p-3.5 rounded-[14px] border border-secondary/10 max-h-[220px] overflow-y-auto custom-scrollbar">
									{task.description}
								</div>
							) : (
								<p className="text-xs text-secondary/50 italic bg-secondary/5 p-3 rounded-[12px]">
									No description provided for this task.
								</p>
							)}
						</div>

						{/* Milestones Checklist */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70 flex items-center gap-1.5">
									<Squircle className="w-3.5 h-3.5 text-accent" />
									Milestones ({completedMilestones}/
									{totalMilestones})
								</h4>
								<span className="text-xs font-semibold text-secondary/70">
									{milestonePercent}%
								</span>
							</div>

							<Progress
								value={milestonePercent}
								className="h-2 bg-secondary/20"
							/>

							{totalMilestones > 0 ? (
								<div className="flex flex-col gap-2 mt-1">
									{task.milestones?.map((milestone) => {
										const isDone =
											milestone.status ===
											MileStoneStatus.DONE;
										const isToggling =
											togglingMilestoneId ===
											milestone.id;

										return (
											<div
												key={milestone.id}
												className="flex items-start gap-2.5 p-2.5 rounded-[12px] bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 transition-colors"
											>
												<Checkbox
													checked={isDone}
													disabled={
														isToggling ||
														!hasEditPermission
													}
													onCheckedChange={() =>
														handleToggleMilestone(
															milestone.id,
															milestone.status,
														)
													}
													className="mt-0.5"
												/>
												<div className="flex-1 min-w-0">
													<p
														className={`text-xs font-medium leading-tight ${
															isDone
																? "line-through text-secondary/50"
																: "text-secondary"
														}`}
													>
														{milestone.title}
													</p>
													{milestone.description && (
														<p className="text-[11px] text-secondary/60 mt-0.5 truncate">
															{
																milestone.description
															}
														</p>
													)}
												</div>
												{isToggling && (
													<Loader2 className="w-3 h-3 animate-spin text-secondary/60 shrink-0 mt-0.5" />
												)}
											</div>
										);
									})}
								</div>
							) : (
								<p className="text-xs text-secondary/50 italic">
									No milestones defined for this task.
								</p>
							)}
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent className="bg-primary text-secondary border border-secondary/20 rounded-[20px] max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-destructive flex items-center gap-2">
							<Trash2 className="w-5 h-5" />
							Delete Task
						</AlertDialogTitle>
						<AlertDialogDescription className="text-secondary/70 text-sm">
							Are you sure you want to delete{" "}
							<span className="font-semibold text-secondary">
								"{task.title}"
							</span>
							? This action cannot be undone and will remove all
							associated milestones, comments, and resources.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-3 sm:gap-3 mt-4">
						<AlertDialogCancel
							disabled={isDeleting}
							className="rounded-full border-secondary/20 text-secondary hover:bg-secondary/10"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={async (e) => {
								e.preventDefault();
								await handleDeleteTask();
							}}
							disabled={isDeleting}
							className="rounded-full bg-destructive text-white hover:bg-destructive/90 gap-2"
						>
							{isDeleting && (
								<Loader2 className="w-4 h-4 animate-spin" />
							)}
							Delete Task
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
