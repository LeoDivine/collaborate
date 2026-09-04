"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
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
	Box,
	Calendar,
	ExternalLink,
	Flag,
	Squircle,
	UserCheck,
} from "lucide-react";
import TaskAssigneeOverview from "@/components/pages/tasks/task-assignee-overview";

import { Status } from "../../../../generated/prisma/enums";

export interface TaskProjectProps {
	task: Tasks;
	cellDate?: Date;
	isDialogView?: boolean;
	showFullView?: boolean;
}

export default function TaskProject({
	task,
	cellDate,
	isDialogView = false,
	showFullView = false,
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

	return (
		<div className="mt-1">
			{!isFull && (
				<div className="md:hidden inline">
					<Dialog>
						<DialogTrigger asChild>
							<div
								className={`w-[14px] rounded-full h-[14px] cursor-pointer ${renderPriority(priority)} ${isCompleted ? "opacity-60" : ""}`}
								title={title}
							/>
						</DialogTrigger>
						<DialogContent className="max-w-md rounded-2xl p-6 bg-primary text-secondary border-primary">
							<TaskDialogDetail task={task} />
						</DialogContent>
					</Dialog>
				</div>
			)}
			<div className={isFull ? "block" : "hidden md:inline"}>
				<Dialog>
					<DialogTrigger asChild>
						<div className="flex cursor-pointer overflow-hidden rounded-md group hover:opacity-90 transition-opacity">
							<div
								className={`w-1.5 shrink-0 ${renderPriority(priority)}`}
							/>

							<div
								className={`flex-1 py-1 px-2 ${renderPriorityLight(priority)}`}
							>
								<p
									className={`text-[12px] font-medium ${isDialogView ? "text-secondary" : "text-primary"} ${isCompleted ? "line-through opacity-70" : ""} line-clamp-1`}
								>
									{title}
								</p>
							</div>
						</div>
					</DialogTrigger>

					<DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-6 bg-primary text-secondary border-primary">
						<TaskDialogDetail task={task} />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

function TaskDialogDetail({ task }: { task: Tasks }) {
	const title = task.title || "Untitled Task";
	const priority = task.priority;
	const status = task.status;
	const isCompleted = status === Status.COMPLETED;
	const project = task.project;
	const startPeriod = task.startPeriod ? new Date(task.startPeriod) : null;
	const endPeriod = task.endPeriod ? new Date(task.endPeriod) : null;
	const members = task.taskMembers || [];
	const milestones = task.milestones || [];

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
					<Badge
						className={`py-[5px] px-[10px] text-xs rounded-full text-secondary font-medium border-0 ${renderStatus(status)}`}
					>
						{status.replaceAll("_", " ")}
					</Badge>
					<Badge
						className={`py-[5px] px-[10px] text-xs rounded-full text-secondary font-medium border-0 ${renderPriority(priority)}`}
					>
						{priority}
					</Badge>
				</div>
				<DialogTitle
					className={`text-xl font-bold text-secondary ${isCompleted ? "line-through opacity-80" : ""}`}
				>
					{title}
				</DialogTitle>
				{stripHtml(task.description) && (
					<DialogDescription className="text-sm text-secondary/80 line-clamp-3">
						{stripHtml(task.description)}
					</DialogDescription>
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
