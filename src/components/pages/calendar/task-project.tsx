"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
	formatPriority,
	getInitials,
	renderPriority,
	renderPriorityLight,
	renderStatus,
	stripHtml,
} from "@/lib/utils";
import type { Tasks } from "@/lib/types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Box,
	Calendar,
	CheckCircle2,
	Circle,
	ExternalLink,
	Flag,
	Squircle,
	UserCheck,
} from "lucide-react";
import TaskAssigneeOverview from "@/components/pages/tasks/task-assignee-overview";
import { PRIORITY_LEVEL } from "@/lib/const";
import { updateTaskDetails } from "@/lib/services/task.services";

import { Status } from "../../../../generated/prisma/enums";

export interface TaskProjectProps {
	task: Tasks;
	cellDate?: Date;
	isDialogView?: boolean;
	showFullView?: boolean;
	onTaskUpdate?: (task: Tasks) => void;
}

export default function TaskProject({
	task,
	cellDate,
	isDialogView = false,
	showFullView = false,
	onTaskUpdate,
}: TaskProjectProps) {
	const isFull = isDialogView || showFullView;

	const title = task.title || "Untitled Task";
	const priority = task.priority;
	const status = task.status;
	const isCompleted = status === Status.COMPLETED;
	const project = task.project;
	const startPeriod = task.startPeriod ? new Date(task.startPeriod) : null;
	const endPeriod = task.endPeriod ? new Date(task.endPeriod) : null;
	const members = task.taskMembers || [];
	const milestones = task.milestones || [];

	const priorityMeta = PRIORITY_LEVEL.find((p) => p.value === priority);
	const PriorityIcon = priorityMeta?.icon;

	const handleQuickToggleComplete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		const nextStatus = isCompleted ? Status.TODO : Status.COMPLETED;
		try {
			await updateTaskDetails({
				taskId: task.id,
				values: { status: nextStatus },
			});
			if (onTaskUpdate) {
				onTaskUpdate({ ...task, status: nextStatus });
			}
		} catch (err) {
			console.error("Failed to toggle task completion:", err);
		}
	};

	return (
		<div className="mt-1">
			{!isFull && (
				<div className="md:hidden inline">
					<Dialog>
						<DialogTrigger asChild>
							<button
								type="button"
								aria-label={`${isCompleted ? "Completed: " : ""}Task: ${title} (${priorityMeta?.title || formatPriority(priority)})`}
								className={`w-[14px] rounded-full h-[14px] cursor-pointer inline-flex items-center justify-center ${renderPriority(priority)} ${isCompleted ? "opacity-60 ring-1 ring-secondary" : ""}`}
								title={title}
							>
								{isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-secondary" />}
							</button>
						</DialogTrigger>
						<DialogContent className="max-w-md rounded-2xl p-6 bg-primary text-secondary border-primary">
							<TaskDialogDetail task={task} onTaskUpdate={onTaskUpdate} />
						</DialogContent>
					</Dialog>
				</div>
			)}
			<div className={isFull ? "block" : "hidden md:inline"}>
				<Dialog>
					<DialogTrigger asChild>
						<div
							role="button"
							tabIndex={0}
							aria-label={`${isCompleted ? "Completed: " : ""}Task: ${title} (${priorityMeta?.title || priority})`}
							className={`flex cursor-pointer overflow-hidden rounded-md group hover:opacity-95 transition-all ${
								isCompleted ? "opacity-65" : ""
							}`}
						>
							<div
								className={`w-1.5 shrink-0 ${renderPriority(priority)}`}
							/>

							<div
								className={`flex-1 py-1 px-2 flex items-center gap-1.5 min-w-0 ${renderPriorityLight(priority)}`}
							>
								{/* Quick Complete Toggle Button */}
								<button
									type="button"
									onClick={handleQuickToggleComplete}
									className="shrink-0 p-0.5 rounded hover:bg-primary/20 text-primary transition-colors cursor-pointer"
									title={isCompleted ? "Mark incomplete" : "Mark completed"}
									aria-label={isCompleted ? "Mark incomplete" : "Mark completed"}
								>
									{isCompleted ? (
										<CheckCircle2 className="w-3.5 h-3.5 text-green-600 fill-green-600/20" />
									) : (
										<Circle className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
									)}
								</button>

								{PriorityIcon && (
									<PriorityIcon
										className={`w-3 h-3 shrink-0 ${isDialogView ? "text-secondary/80" : "text-primary/70"}`}
										aria-hidden="true"
									/>
								)}
								<p
									className={`text-[12px] font-medium truncate ${isDialogView ? "text-secondary" : "text-primary"} ${isCompleted ? "line-through opacity-75 italic" : ""}`}
								>
									{title}
								</p>
							</div>
						</div>
					</DialogTrigger>

					<DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-6 bg-primary text-secondary border-primary">
						<TaskDialogDetail task={task} onTaskUpdate={onTaskUpdate} />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

function TaskDialogDetail({
	task,
	onTaskUpdate,
}: {
	task: Tasks;
	onTaskUpdate?: (task: Tasks) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<Status>(task.status);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	const title = task.title || "Untitled Task";
	const priority = task.priority;
	const isCompleted = currentStatus === Status.COMPLETED;
	const project = task.project;
	const startPeriod = task.startPeriod ? new Date(task.startPeriod) : null;
	const endPeriod = task.endPeriod ? new Date(task.endPeriod) : null;
	const members = task.taskMembers || [];
	const milestones = task.milestones || [];

	const priorityMeta = PRIORITY_LEVEL.find((p) => p.value === priority);
	const PriorityIcon = priorityMeta?.icon;

	const handleStatusChange = async (newStatus: Status) => {
		setCurrentStatus(newStatus);
		setIsUpdatingStatus(true);
		try {
			await updateTaskDetails({
				taskId: task.id,
				values: { status: newStatus },
			});
			if (onTaskUpdate) {
				onTaskUpdate({ ...task, status: newStatus });
			}
		} catch (err) {
			console.error("Failed to update status", err);
			setCurrentStatus(task.status);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const descText = stripHtml(task.description);

	return (
		<div className="space-y-4 text-secondary">
			<DialogHeader className="text-left space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					{project && (
						<Link
							href={`/projects/${project.id || task.projectId}`}
						>
							<Badge
								variant="outline"
								className="py-[5px] px-[10px] text-xs flex items-center gap-1 border-secondary text-secondary cursor-pointer hover:opacity-80 transition-opacity"
							>
								<Box className="w-3.5 h-3.5 text-secondary" />
								{project.title}
							</Badge>
						</Link>
					)}
					<div className="relative">
						<Select
							value={currentStatus}
							onValueChange={(val) => handleStatusChange(val as Status)}
							disabled={isUpdatingStatus}
						>
							<SelectTrigger className={`h-7 py-1 px-2.5 text-xs rounded-full text-secondary font-medium border-0 ${renderStatus(currentStatus)} cursor-pointer`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="border-primary bg-primary text-secondary">
								<SelectItem value={Status.TODO}>To Do</SelectItem>
								<SelectItem value={Status.IN_PROGRESS}>In Progress</SelectItem>
								<SelectItem value={Status.ON_HOLD}>On Hold</SelectItem>
								<SelectItem value={Status.COMPLETED}>Completed</SelectItem>
								<SelectItem value={Status.CANCELLED}>Canceled</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Badge
						className={`py-[5px] px-[10px] text-xs rounded-full text-secondary font-medium border-0 flex items-center gap-1 ${renderPriority(priority)}`}
					>
						{PriorityIcon && <PriorityIcon className="w-3 h-3 text-secondary" />}
						{priorityMeta?.title || formatPriority(priority)}
					</Badge>
				</div>
				<DialogTitle
					className={`text-xl font-bold text-secondary ${isCompleted ? "line-through opacity-80" : ""}`}
				>
					{title}
				</DialogTitle>
				{descText && (
					<div>
						<DialogDescription
							className={`text-sm text-secondary/80 ${expanded ? "" : "line-clamp-3"}`}
						>
							{descText}
						</DialogDescription>
						{descText.length > 120 && (
							<button
								type="button"
								className="text-xs text-secondary/70 underline mt-1 hover:text-secondary cursor-pointer"
								onClick={() => setExpanded((prev) => !prev)}
							>
								{expanded ? "Show less" : "Show more"}
							</button>
						)}
					</div>
				)}
			</DialogHeader>

			<div className="space-y-3 pt-2 text-sm border-t border-secondary/20">
				{(startPeriod || endPeriod) && (
					<div className="flex items-center gap-2 text-secondary">
						<Calendar className="w-4 h-4 text-secondary shrink-0" />
						<span>
							{startPeriod ?
								format(startPeriod, "MMM d, yyyy")
							:	"No start"}
							{" - "}
							{endPeriod ?
								format(endPeriod, "MMM d, yyyy")
							:	"No end"}
						</span>
					</div>
				)}

				{members.length > 0 && (
					<div className="flex items-center gap-2 text-secondary">
						<UserCheck className="w-4 h-4 text-secondary shrink-0" />
						<span className="text-secondary mr-1">Assignees:</span>
						<TaskAssigneeOverview taskMembers={members} />
					</div>
				)}

				{milestones.length > 0 && (
					<div className="flex items-center gap-2 text-secondary">
						<Squircle className="w-4 h-4 text-secondary shrink-0" />
						<span>
							{
								milestones.filter((m) => m.status === "DONE")
									.length
							}{" "}
							/ {milestones.length} Milestones completed
						</span>
					</div>
				)}
			</div>

			<div className="pt-3 flex justify-end border-t border-secondary/20">
				<Link href={`/tasks/${task.id}`}>
					<Button className="rounded-full gap-2 text-sm bg-secondary text-primary hover:bg-secondary/90">
						Open Task Details
						<ExternalLink className="w-4 h-4 text-primary" />
					</Button>
				</Link>
			</div>
		</div>
	);
}
