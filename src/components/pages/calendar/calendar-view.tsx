"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DAY } from "@/lib/const";
import { renderMonthByNumber } from "@/lib/utils";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	RotateCcw,
} from "lucide-react";
import { getDate, getMonth, getYear, isSameDay, startOfDay } from "date-fns";
import { CalendarBox } from "./calendar-box";
import type { MembersUsers, Projects, Tasks } from "@/lib/types";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";

interface CalendarViewProps {
	tasks?: Tasks[];
	projects?: Projects[];
	members?: MembersUsers[];
	workspaceId?: string;
	currentMemberId?: string;
	initialTotal?: number;
}

export function isTaskOnDate(task: Tasks, targetDate: Date): boolean {
	const cellStart = startOfDay(targetDate).getTime();

	const start = task.startPeriod
		? startOfDay(new Date(task.startPeriod)).getTime()
		: null;
	const end = task.endPeriod
		? startOfDay(new Date(task.endPeriod)).getTime()
		: null;

	if (start !== null && end !== null) {
		return cellStart >= start && cellStart <= end;
	} else if (end !== null) {
		return isSameDay(new Date(task.endPeriod), targetDate);
	} else if (start !== null) {
		return isSameDay(new Date(task.startPeriod), targetDate);
	} else if (task.createdAt) {
		return isSameDay(new Date(task.createdAt), targetDate);
	}
	return false;
}

export default function CalendarView({
	tasks = [],
	projects = [],
	members = [],
	workspaceId = "",
	currentMemberId = "",
	initialTotal = 0,
}: CalendarViewProps) {
	const today = new Date();

	const [taskList, setTaskList] = useState<Tasks[]>(tasks || []);
	const [projectList, setProjectList] = useState<Projects[]>(projects || []);
	const [memberList, setMemberList] = useState<MembersUsers[]>(members || []);

	const [currentMonthNumber, setCurrentMonthNumber] = useState(
		getMonth(today) + 1,
	);
	const [currentYear, setCurrentYear] = useState(getYear(today));
	const [taskFilter, setTaskFilter] = useState<string>("ALL");
	const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

	useEffect(() => {
		setTaskList((prev) => {
			const serverTasks = tasks || [];
			if (serverTasks.length === 0) return prev.length > 0 ? prev : [];
			const serverIds = new Set(serverTasks.map((t) => t.id));
			const localOnly = prev.filter((t) => !serverIds.has(t.id));
			return [...localOnly, ...serverTasks];
		});
	}, [tasks]);

	useEffect(() => {
		setProjectList((prev) => {
			const serverProjects = projects || [];
			if (serverProjects.length === 0) return prev.length > 0 ? prev : [];
			const serverIds = new Set(serverProjects.map((p) => p.id));
			const localOnly = prev.filter((p) => !serverIds.has(p.id));
			return [...localOnly, ...serverProjects];
		});
	}, [projects]);

	useEffect(() => {
		setMemberList(members || []);
	}, [members]);

	useWorkspaceRealtime(workspaceId, {
		onTaskCreated: (data: any) => {
			const newTask = data?.task || data;
			if (newTask && newTask.id) {
				setTaskList((prev) => {
					if (prev.some((t) => t.id === newTask.id)) {
						return prev.map((t) =>
							t.id === newTask.id ? { ...t, ...newTask } : t,
						);
					}
					return [newTask, ...prev];
				});
			}
		},
		onTaskUpdated: (data: any) => {
			const taskId = data?.taskId || data?.task?.id || data?.id;
			const updatedTask = data?.task;
			const updates = data?.updates || (data?.task ? undefined : data);
			if (taskId) {
				setTaskList((prev) =>
					prev.map((t) => {
						if (t.id === taskId) {
							return updatedTask
								? { ...t, ...updatedTask }
								: { ...t, ...(updates || {}) };
						}
						return t;
					}),
				);
			}
		},
		onTaskDeleted: (data: any) => {
			const taskId = data?.taskId || data?.id;
			if (taskId) {
				setTaskList((prev) => prev.filter((t) => t.id !== taskId));
			}
		},
		onProjectCreated: (data: any) => {
			const newProject = data?.project || data;
			if (newProject && newProject.id) {
				setProjectList((prev) => {
					if (prev.some((p) => p.id === newProject.id)) {
						return prev.map((p) =>
							p.id === newProject.id ? { ...p, ...newProject } : p,
						);
					}
					return [...prev, newProject];
				});
			}
		},
		onProjectUpdated: (data: any) => {
			const projectId = data?.projectId || data?.project?.id || data?.id;
			const updatedProject = data?.project;
			const updates = data?.updates || (data?.project ? undefined : data);
			if (projectId) {
				setProjectList((prev) =>
					prev.map((p) => {
						if (p.id === projectId) {
							return updatedProject
								? { ...p, ...updatedProject }
								: { ...p, ...(updates || {}) };
						}
						return p;
					}),
				);
			}
		},
		onProjectDeleted: (data: any) => {
			const projectId = data?.projectId || data?.id;
			if (projectId) {
				setProjectList((prev) => prev.filter((p) => p.id !== projectId));
				setSelectedProjectId((prev) => (prev === projectId ? "ALL" : prev));
			}
		},
	});

	const handleNextMonth = () => {
		if (currentMonthNumber === 12) {
			setCurrentMonthNumber(1);
			setCurrentYear((prev) => prev + 1);
		} else {
			setCurrentMonthNumber((prev) => prev + 1);
		}
	};

	const handlePreviousMonth = () => {
		if (currentMonthNumber === 1) {
			setCurrentMonthNumber(12);
			setCurrentYear((prev) => prev - 1);
		} else {
			setCurrentMonthNumber((prev) => prev - 1);
		}
	};

	const handleJumpToToday = () => {
		setCurrentMonthNumber(getMonth(today) + 1);
		setCurrentYear(getYear(today));
	};

	const currentMember = useMemo(() => {
		return memberList.find(
			(m) => m.id === currentMemberId || m.userId === currentMemberId,
		);
	}, [memberList, currentMemberId]);

	const currentUserId = currentMember?.userId;

	// Filter tasks by task scope (All / My Tasks assigned to current user) and project filter
	const filteredTasks = useMemo(() => {
		return taskList.filter((t) => {
			const isAssignedToUser = Boolean(
				t.taskMembers?.some(
					(tm) =>
						tm.memberId === currentMemberId ||
						tm.member?.id === currentMemberId ||
						(Boolean(currentUserId) &&
							(tm.member?.userId === currentUserId ||
								tm.member?.user?.id === currentUserId)),
				),
			);

			const matchesTaskFilter =
				taskFilter === "ALL" ? true : isAssignedToUser;

			const matchesProject =
				selectedProjectId === "ALL"
					? true
					: t.projectId === selectedProjectId;

			return matchesTaskFilter && matchesProject;
		});
	}, [taskList, taskFilter, selectedProjectId, currentMemberId, currentUserId]);

	const firstDayOfMonth = new Date(
		currentYear,
		currentMonthNumber - 1,
		1,
	).getDay();

	const daysInMonth = new Date(currentYear, currentMonthNumber, 0).getDate();

	const previousMonthDays = new Date(
		currentYear,
		currentMonthNumber - 1,
		0,
	).getDate();

	type CalendarItem = {
		date: Date;
		isCurrentMonth: boolean;
	};

	const calendarCells: CalendarItem[] = [];

	// Previous month days
	for (let i = firstDayOfMonth - 1; i >= 0; i--) {
		calendarCells.push({
			date: new Date(
				currentYear,
				currentMonthNumber - 2,
				previousMonthDays - i,
			),
			isCurrentMonth: false,
		});
	}

	// Current month days
	for (let day = 1; day <= daysInMonth; day++) {
		calendarCells.push({
			date: new Date(currentYear, currentMonthNumber - 1, day),
			isCurrentMonth: true,
		});
	}

	// Next month days
	let nextDay = 1;

	while (calendarCells.length % 7 !== 0) {
		calendarCells.push({
			date: new Date(currentYear, currentMonthNumber, nextDay++),
			isCurrentMonth: false,
		});
	}

	return (
		<div className="space-y-4">
			{/* Controls and Filters */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="rounded-full border-primary text-primary hover:bg-primary/10"
						onClick={handlePreviousMonth}
						title="Previous Month"
						aria-label="Previous Month"
					>
						<ChevronLeft className="w-4 h-4 text-primary" />
					</Button>

					<p className="text-primary font-bold text-lg min-w-[150px] text-center">
						{renderMonthByNumber(currentMonthNumber)} {currentYear}
					</p>

					<Button
						variant="outline"
						size="icon"
						className="rounded-full border-primary text-primary hover:bg-primary/10"
						onClick={handleNextMonth}
						title="Next Month"
						aria-label="Next Month"
					>
						<ChevronRight className="w-4 h-4 text-primary" />
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleJumpToToday}
						className="rounded-full text-xs gap-1 ml-2 border-primary text-primary hover:bg-primary/10"
					>
						<RotateCcw className="w-3.5 h-3.5 text-primary" />
						Today
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
					<Select
						value={taskFilter}
						onValueChange={setTaskFilter}
					>
						<SelectTrigger className="w-[140px] h-9 rounded-full text-sm border-primary text-primary">
							<SelectValue placeholder="All Tasks" />
						</SelectTrigger>
						<SelectContent className="border-primary text-primary">
							<SelectItem value="ALL">All Tasks</SelectItem>
							<SelectItem value="MY_TASKS">My Tasks</SelectItem>
						</SelectContent>
					</Select>

					{projectList.length > 0 && (
						<Select
							value={selectedProjectId}
							onValueChange={setSelectedProjectId}
						>
							<SelectTrigger className="w-[170px] h-9 rounded-full text-sm border-primary text-primary">
								<SelectValue placeholder="All Projects" />
							</SelectTrigger>
							<SelectContent className="border-primary text-primary">
								<SelectItem value="ALL">All Projects</SelectItem>
								{projectList.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					<Link href="/tasks?creating=true">
						<Button className="rounded-full gap-2 border-primary text-secondary">
							<Plus className="w-4 h-4" />
							New Task
						</Button>
					</Link>
				</div>
			</div>

			{/* Week days header */}
			<div className="flex">
				{DAY.map((day, index) => (
					<CalendarHeader key={index} value={day} />
				))}
			</div>

			{/* Calendar grid */}
			<div className="flex flex-wrap border-l border-t border-primary">
				{calendarCells.map((item) => {
					const dayTasks = filteredTasks.filter((t) =>
						isTaskOnDate(t, item.date),
					);

					return (
						<CalendarBox
							key={item.date.toISOString()}
							date={item.date}
							isCurrentMonth={item.isCurrentMonth}
							tasks={dayTasks}
						/>
					);
				})}
			</div>
		</div>
	);
}

export const CalendarHeader = ({ value }: { value: string }) => {
	return (
		<div className="border border-primary pb-[10px] pt-[8px] px-[10px] w-[14.28%] bg-primary/5">
			<p className="text-[13px] md:hidden text-center font-bold text-primary">
				{value.charAt(0)}
			</p>
			<p className="text-[13px] hidden md:inline font-semibold text-primary">
				{value}
			</p>
		</div>
	);
};


