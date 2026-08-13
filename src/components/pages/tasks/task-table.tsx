"use client";

import PaginationControls from "@/components/shared/pagination-controls";
import ProjectTaskProgress from "@/components/shared/project-task-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Projects, Tasks } from "@/lib/types";
import { renderPriority, renderStatus } from "@/lib/utils";
import { format } from "date-fns";
import {
	ArrowRight,
	Box,
	CircleCheck,
	CircleX,
	SlidersHorizontal,
	Squircle,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PriorityLevel, Status } from "../../../../generated/prisma/enums";
import TaskAssigneeOverview from "./task-assignee-overview";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
	[PriorityLevel.URGENT]: "Urgent",
	[PriorityLevel.HIGH]: "High",
	[PriorityLevel.MEDIUM]: "Medium",
	[PriorityLevel.LOW]: "Low",
	[PriorityLevel.NO_PRIORITY]: "No Priority",
};

const STATUS_LABELS: Record<Status, string> = {
	[Status.TODO]: "To Do",
	[Status.IN_PROGRESS]: "In Progress",
	[Status.ON_HOLD]: "On Hold",
	[Status.COMPLETED]: "Completed",
	[Status.CANCELLED]: "Cancelled",
};

const PRIORITY_OPTIONS = Object.values(PriorityLevel).map((value) => ({
	label: PRIORITY_LABELS[value],
	value,
}));

const STATUS_OPTIONS = Object.values(Status).map((value) => ({
	label: STATUS_LABELS[value],
	value,
}));

export default function TaskTable({
	tasks,
	projects = [],
	currentUserId,
	totalItems,
	pageSize = 10,
}: {
	tasks: Tasks[];
	projects?: Projects[];
	currentUserId?: string;
	totalItems?: number;
	pageSize?: number;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPriorities, setSelectedPriorities] = useState<
		PriorityLevel[]
	>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
	const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
	const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);

	// Count how many tasks are assigned to current user
	const assignedToMeCount = useMemo(() => {
		if (!currentUserId) return 0;
		return tasks.filter((t) =>
			t.taskMembers?.some(
				(tm) => tm.member?.userId === currentUserId || tm.memberId === currentUserId,
			),
		).length;
	}, [tasks, currentUserId]);

	const togglePriority = (value: PriorityLevel) => {
		setSelectedPriorities((prev) =>
			prev.includes(value) ?
				prev.filter((item) => item !== value)
			:	[...prev, value],
		);
	};

	const toggleStatus = (value: Status) => {
		setSelectedStatuses((prev) =>
			prev.includes(value) ?
				prev.filter((item) => item !== value)
			:	[...prev, value],
		);
	};

	const toggleProject = (projectId: string) => {
		setSelectedProjectIds((prev) =>
			prev.includes(projectId) ?
				prev.filter((id) => id !== projectId)
			:	[...prev, projectId],
		);
	};

	const filteredTasks = useMemo(() => {
		return tasks.filter((item) => {
			const matchesSearch =
				searchQuery.trim() === "" ||
				item.title
					.toLowerCase()
					.includes(searchQuery.trim().toLowerCase()) ||
				(item.description &&
					item.description
						.toLowerCase()
						.includes(searchQuery.trim().toLowerCase()));

			const matchesPriority =
				selectedPriorities.length === 0 ||
				selectedPriorities.includes(item.priority);

			const matchesStatus =
				selectedStatuses.length === 0 ||
				selectedStatuses.includes(item.status);

			const matchesProject =
				selectedProjectIds.length === 0 ||
				selectedProjectIds.includes(item.projectId);

			const isAssignedToUser =
				!filterAssignedToMe ||
				item.taskMembers?.some(
					(tm) =>
						tm.member?.userId === currentUserId ||
						tm.memberId === currentUserId,
				);

			return (
				matchesSearch &&
				matchesPriority &&
				matchesStatus &&
				matchesProject &&
				isAssignedToUser
			);
		});
	}, [
		tasks,
		searchQuery,
		selectedPriorities,
		selectedStatuses,
		selectedProjectIds,
		filterAssignedToMe,
		currentUserId,
	]);

	return (
		<div className="flex flex-col gap-2 py-[15px]">
			{/* Controls & Search */}
			<div className="flex flex-wrap gap-3 items-center">
				<Input
					placeholder="Search by task title..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="bg-primary rounded-[15px] border-0 text-secondary placeholder:text-secondary/70 flex-1 min-w-[220px]"
				/>

				{/* Assigned to Me Toggle Button */}
				<Button
					type="button"
					onClick={() => setFilterAssignedToMe((prev) => !prev)}
					className={`rounded-full transition-all ${
						filterAssignedToMe ?
							"bg-accent text-primary hover:bg-accent/80 font-semibold"
						:	"bg-primary text-secondary hover:bg-primary/90"
					}`}
				>
					<UserCheck className="w-4 h-4 mr-1.5" />
					Assigned to me
					{assignedToMeCount > 0 && (
						<span className="ml-1.5 flex h-5 px-1.5 items-center justify-center rounded-full bg-secondary text-primary text-xs font-bold">
							{assignedToMeCount}
						</span>
					)}
				</Button>

				{/* Filter Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="rounded-full">
							<SlidersHorizontal />
							Filter
							{(selectedPriorities.length > 0 ||
								selectedStatuses.length > 0 ||
								selectedProjectIds.length > 0) && (
								<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary text-xs font-bold">
									{selectedPriorities.length +
										selectedStatuses.length +
										selectedProjectIds.length}
								</span>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="bg-accent w-[240px] mr-[10px] border-0 max-h-[400px] overflow-y-auto custom-scrollbar">
						{/* Filter by Project */}
						{projects.length > 0 && (
							<>
								<DropdownMenuGroup>
									<DropdownMenuLabel>
										Filter by Project
									</DropdownMenuLabel>
									<div className="flex flex-col gap-2 px-[10px] py-1 max-h-[120px] overflow-y-auto custom-scrollbar">
										{projects.map((proj) => {
											const isChecked =
												selectedProjectIds.includes(
													proj.id,
												);
											return (
												<label
													key={proj.id}
													onClick={(e) =>
														e.stopPropagation()
													}
													className="flex items-center gap-2 cursor-pointer select-none text-sm text-primary"
												>
													<Checkbox
														checked={isChecked}
														onCheckedChange={() =>
															toggleProject(
																proj.id,
															)
														}
													/>
													<span className="truncate">
														{proj.title}
													</span>
												</label>
											);
										})}
									</div>
								</DropdownMenuGroup>
								<DropdownMenuSeparator className="bg-primary" />
							</>
						)}

						{/* Filter by Priority */}
						<DropdownMenuGroup>
							<DropdownMenuLabel>
								Filter by priority
							</DropdownMenuLabel>
							<div className="flex flex-col gap-2 px-[10px] py-1">
								{PRIORITY_OPTIONS.map((opt) => {
									const isChecked =
										selectedPriorities.includes(opt.value);
									return (
										<label
											key={opt.value}
											onClick={(e) => e.stopPropagation()}
											className="flex items-center gap-2 cursor-pointer select-none text-sm text-primary"
										>
											<Checkbox
												checked={isChecked}
												onCheckedChange={() =>
													togglePriority(opt.value)
												}
											/>
											<span>{opt.label}</span>
										</label>
									);
								})}
							</div>
						</DropdownMenuGroup>

						<DropdownMenuSeparator className="bg-primary" />

						{/* Filter by Status */}
						<DropdownMenuGroup>
							<DropdownMenuLabel>
								Filter by status
							</DropdownMenuLabel>
							<div className="flex flex-col gap-2 px-[10px] py-1">
								{STATUS_OPTIONS.map((opt) => {
									const isChecked = selectedStatuses.includes(
										opt.value,
									);
									return (
										<label
											key={opt.value}
											onClick={(e) => e.stopPropagation()}
											className="flex items-center gap-2 cursor-pointer select-none text-sm text-primary"
										>
											<Checkbox
												checked={isChecked}
												onCheckedChange={() =>
													toggleStatus(opt.value)
												}
											/>
											<span>{opt.label}</span>
										</label>
									);
								})}
							</div>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Reset Button */}
				{(selectedPriorities.length > 0 ||
					selectedStatuses.length > 0 ||
					selectedProjectIds.length > 0 ||
					filterAssignedToMe ||
					searchQuery !== "") && (
					<Button
						variant="ghost"
						onClick={() => {
							setSearchQuery("");
							setSelectedPriorities([]);
							setSelectedStatuses([]);
							setSelectedProjectIds([]);
							setFilterAssignedToMe(false);
						}}
						className="rounded-full text-primary hover:bg-primary/10 text-sm"
					>
						Reset
					</Button>
				)}
			</div>

			{/* Table Container */}
			<div>
				{filteredTasks.length === 0 ?
					<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
						<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
							<Squircle className="w-4 h-4" />
						</div>
						<p className="text-primary text-[15px] mt-[10px] font-bold">
							No Tasks Available
						</p>
						<p className="text-[13px] text-center text-primary">
							No tasks found matching your filter criteria or in this workspace.
						</p>
					</div>
				:	<Table className="min-w-[800px]">
						<TableHeader>
							<TableRow>
								<TableHead>Task Title</TableHead>
								<TableHead>Project</TableHead>
								<TableHead>Assignees</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead>Period</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[200px]">
									Milestones
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredTasks.map((i) => {
								const startDate = new Date(i.startPeriod);
								const createdAt = new Date(i.createdAt);
								const normalizedStart = new Date(startDate);
								normalizedStart.setHours(0, 0, 0, 0);

								const endDate = new Date(i.endPeriod);
								const normalizedEnd = new Date(endDate);
								normalizedEnd.setHours(23, 59, 59, 999);

								// Check if assigned to current user
								const isAssignedToCurrentUser =
									currentUserId &&
									i.taskMembers?.some(
										(tm) =>
											tm.member?.userId ===
												currentUserId ||
											tm.memberId === currentUserId,
									);

								// Milestones progress
								const totalMilestones =
									i.milestones?.length || 0;
								const completedMilestones =
									i.milestones?.filter(
										(m) => m.status === "DONE",
									).length || 0;
								const milestonePercent =
									totalMilestones > 0 ?
										Math.round(
											(completedMilestones /
												totalMilestones) *
												100,
										)
									:	i.status === "COMPLETED" ?
										100
									:	0;

								return (
									<TableRow key={i.id}>
										{/* Task Title + Assigned Indicator */}
										<TableCell>
											<div className="flex flex-col gap-1">
												<Link
													href={`/tasks/${i.id}`}
													className="font-semibold text-secondary hover:underline hover:opacity-85 transition-opacity"
												>
													{i.title}
												</Link>
												{isAssignedToCurrentUser && (
													<Badge className="w-fit text-[10px] py-0 px-1.5 bg-secondary text-primary font-semibold flex items-center gap-1">
														<UserCheck className="w-2.5 h-2.5" />
														Assigned to you
													</Badge>
												)}
											</div>
										</TableCell>

										{/* Project Indicator Column */}
										<TableCell>
											{i.project ?
												<Link
													href={`/projects/${i.projectId}`}
													className="hover:opacity-85 transition-opacity"
												>
													<Badge
														variant="outline"
														className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 flex items-center gap-1.5 py-1 text-xs font-semibold w-fit truncate max-w-[180px]"
													>
														<Box className="w-3.5 h-3.5 text-secondary/70 shrink-0" />
														<span className="truncate">
															{i.project.title}
														</span>
													</Badge>
												</Link>
											:	<span className="text-xs text-muted-foreground">
													No project
												</span>
											}
										</TableCell>

										{/* Assignees Column */}
										<TableCell>
											<TaskAssigneeOverview
												taskMembers={i.taskMembers}
											/>
										</TableCell>

										{/* Created At Column */}
										<TableCell>
											<p className="text-sm font-medium text-secondary">
												{format(createdAt, "PPP")}
											</p>
										</TableCell>

										{/* Period HoverCard */}
										<TableCell>
											<HoverCard
												openDelay={10}
												closeDelay={100}
											>
												<HoverCardTrigger asChild>
													<div className="flex items-center flex-row gap-2 w-fit cursor-pointer text-sm font-medium text-secondary">
														<p>
															{format(
																startDate,
																"LLL d",
															)}
														</p>
														<ArrowRight className="w-3 h-3 text-secondary/70" />
														<p>
															{format(
																endDate,
																"LLL d",
															)}
														</p>
													</div>
												</HoverCardTrigger>
												<HoverCardContent className="w-auto p-0 rounded-[20px] bg-primary text-secondary border-0 shadow-md">
													<Calendar
														mode="range"
														defaultMonth={startDate}
														selected={{
															from: startDate,
															to: endDate,
														}}
														disabled={[
															{
																before: normalizedStart,
															},
															{
																after: normalizedEnd,
															},
														]}
														className="rounded-[20px] bg-primary text-secondary"
														classNames={{
															root: "w-full",
															today: "text-secondary",
															day_button:
																"data-[selected=true]:text-secondary data-[range-start=true]:text-secondary data-[range-middle=true]:text-secondary data-[range-end=true]:text-secondary data-[today=true]:text-secondary font-semibold",
														}}
													/>
												</HoverCardContent>
											</HoverCard>
										</TableCell>

										{/* Priority Badge */}
										<TableCell>
											<Badge
												className={`${renderPriority(i.priority)} text-primary`}
											>
												{i.priority}
											</Badge>
										</TableCell>

										{/* Status Badge */}
										<TableCell>
											<Badge
												className={`${renderStatus(i.status)}`}
											>
												<div className="mr-1">
													{(i.status as Status) ===
														"COMPLETED" && (
														<CircleCheck className="w-3 h-3" />
													)}
													{(i.status as Status) ===
														"CANCELLED" && (
														<CircleX className="w-3 h-3" />
													)}
												</div>
												{i.status.replaceAll("_", " ")}
											</Badge>
										</TableCell>

										{/* Milestones Progress Column */}
										<TableCell className="w-[200px]">
											<ProjectTaskProgress
												value={milestonePercent}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				}
				<PaginationControls
					totalItems={totalItems ?? tasks.length}
					pageSize={pageSize}
				/>
			</div>
		</div>
	);
}
