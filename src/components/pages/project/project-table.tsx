"use client";

import PaginationControls from "@/components/shared/pagination-controls";
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
import type { Projects } from "@/lib/types";
import { renderPriority, renderStatus } from "@/lib/utils";
import { format } from "date-fns";
import {
	ArrowRight,
	Box,
	CircleCheck,
	CircleX,
	SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PriorityLevel, Status } from "../../../../generated/prisma/enums";
import AssigneeOverview from "./assignee-overview";
import ProjectTaskProgress from "@/components/shared/project-task-progress";

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

export default function ProjectTable({
	project,
	totalItems,
	pageSize = 10,
}: {
	project: Projects[];
	totalItems?: number;
	pageSize?: number;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPriorities, setSelectedPriorities] = useState<
		PriorityLevel[]
	>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);

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

	const filteredProjects = useMemo(() => {
		return project.filter((item) => {
			const matchesSearch =
				searchQuery.trim() === "" ||
				item.title
					.toLowerCase()
					.includes(searchQuery.trim().toLowerCase()) ||
				item.description
					.toLowerCase()
					.includes(searchQuery.trim().toLowerCase());

			const matchesPriority =
				selectedPriorities.length === 0 ||
				selectedPriorities.includes(item.priority);

			const matchesStatus =
				selectedStatuses.length === 0 ||
				selectedStatuses.includes(item.status);

			return matchesSearch && matchesPriority && matchesStatus;
		});
	}, [project, searchQuery, selectedPriorities, selectedStatuses]);

	return (
		<div className=" flex flex-col gap-2 py-[15px]">
			<div className=" flex gap-3 items-center">
				<Input
					placeholder="Search by project title..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="bg-primary rounded-[15px] border-0 text-secondary placeholder:text-secondary/70"
				/>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className=" rounded-full">
							<SlidersHorizontal />
							Filter
							{(selectedPriorities.length > 0 ||
								selectedStatuses.length > 0) && (
								<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-secondary text-xs font-bold">
									{selectedPriorities.length +
										selectedStatuses.length}
								</span>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className=" bg-accent w-[220px] mr-[10px] border-0">
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
						<DropdownMenuSeparator className=" bg-primary" />
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

				{(selectedPriorities.length > 0 ||
					selectedStatuses.length > 0 ||
					searchQuery !== "") && (
					<Button
						variant="ghost"
						onClick={() => {
							setSearchQuery("");
							setSelectedPriorities([]);
							setSelectedStatuses([]);
						}}
						className="rounded-full text-primary hover:bg-primary/10 text-sm"
					>
						Reset
					</Button>
				)}
			</div>
			<div className="">
				{filteredProjects.length === 0 ?
					<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
						<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
							<Box className="w-4 h-4" />
						</div>
						<p className="text-accent text-[15px] mt-[10px] font-bold">
							No Projects Available
						</p>
						<p className="text-[13px] text-center text-accent">
							No projects found yet with your query or in this
							workspace
						</p>
					</div>
				:	<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead className="">
									Product Title
								</TableHead>
								<TableHead>Assignees</TableHead>
								<TableHead className=" ">Created At</TableHead>
								<TableHead>Period</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[320px]">
									Progress
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProjects.map((i) => {
								const startDate = new Date(i.startPeriod);
								const createdAt = new Date(i.createdAt);
								const normalizedStart = new Date(startDate);
								normalizedStart.setHours(0, 0, 0, 0);

								const endDate = new Date(i.endPeriod);
								const normalizedEnd = new Date(endDate);
								normalizedEnd.setHours(23, 59, 59, 999);

								const totalTasks = i.tasks?.length || 0;
								let projectProgress = 0;
								if (totalTasks > 0) {
									const totalTaskProgressSum = i.tasks.reduce(
										(acc, t) => {
											const totalMilestones =
												t.milestones?.length || 0;
											if (totalMilestones > 0) {
												const doneMilestones =
													t.milestones?.filter(
														(m) => m.status === "DONE",
													).length || 0;
												return (
													acc +
													(doneMilestones /
														totalMilestones) *
														100
												);
											}
											if (t.status === "COMPLETED")
												return acc + 100;
											if (t.status === "IN_PROGRESS")
												return acc + 50;
											return acc;
										},
										0,
									);
									projectProgress = Math.round(
										totalTaskProgressSum / totalTasks,
									);
								} else {
									projectProgress =
										i.status === "COMPLETED" ? 100 : 0;
								}

								return (
									<TableRow key={i.id}>
										<TableCell className="">
											<Link
												className=" hover:underline"
												href={`/projects/${i.id}`}
											>
												{i.title}
											</Link>
										</TableCell>
										<TableCell>
											<AssigneeOverview
												projectMembers={
													i.projectMembers
												}
											/>
										</TableCell>
										<TableCell className="">
											<p>{format(createdAt, "PPP")}</p>
										</TableCell>
										<TableCell>
											<HoverCard
												openDelay={10}
												closeDelay={100}
											>
												<HoverCardTrigger asChild>
													<div className=" flex items-center flex-row gap-2 w-fit cursor-pointer">
														<p>
															{format(
																startDate,
																"LLL d",
															)}
														</p>
														<ArrowRight className=" w-3 h-3" />
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
										<TableCell>
											<Badge
												className={`${renderPriority(i.priority)} text-primary `}
											>
												{i.priority}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												className={`${renderStatus(i.status)}`}
											>
												<div className="">
													{(i.status as Status) ===
														"COMPLETED" && (
														<CircleCheck className=" w-3 h-3" />
													)}
													{(i.status as Status) ===
														"CANCELLED" && (
														<CircleX className=" w-3 h-3" />
													)}
												</div>
												{i.status.replaceAll("_", " ")}
											</Badge>
										</TableCell>
										<TableCell className=" w-[320px]">
											<ProjectTaskProgress
												value={projectProgress}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				}
				<PaginationControls
					totalItems={totalItems ?? project.length}
					pageSize={pageSize}
				/>
			</div>
		</div>
	);
}
