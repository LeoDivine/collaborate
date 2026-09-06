"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DAY, MONTH, PRIORITY_LEVEL } from "@/lib/const";
import { renderMonthByNumber, renderPriority, renderPriorityLight, renderStatus } from "@/lib/utils";
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Eye,
	EyeOff,
	Plus,
	RotateCcw,
} from "lucide-react";
import {
	differenceInCalendarDays,
	format,
	getDate,
	getMonth,
	getYear,
	isSameDay,
	startOfDay,
} from "date-fns";
import { CalendarBox } from "./calendar-box";
import TaskProject from "./task-project";
import { TaskDialog } from "./task-dialog";
import { ProjectCombobox } from "@/components/shared/project-combobox";
import type { MembersUsers, Projects, Tasks } from "@/lib/types";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";
import { Status } from "../../../../generated/prisma/enums";

interface CalendarViewProps {
	tasks?: Tasks[];
	projects?: Projects[];
	members?: MembersUsers[];
	workspaceId?: string;
	currentMemberId?: string;
	initialTotal?: number;
	initialMonth?: number;
	initialYear?: number;
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

function isMultiDayTask(task: Tasks): boolean {
	if (!task.startPeriod || !task.endPeriod) return false;
	const s = startOfDay(new Date(task.startPeriod)).getTime();
	const e = startOfDay(new Date(task.endPeriod)).getTime();
	return e > s;
}

const SHORT_DAYS: Record<string, string> = {
	Sunday: "Su",
	Monday: "Mo",
	Tuesday: "Tu",
	Wednesday: "We",
	Thursday: "Th",
	Friday: "Fr",
	Saturday: "Sa",
};

export default function CalendarView({
	tasks = [],
	projects = [],
	members = [],
	workspaceId = "",
	currentMemberId = "",
	initialTotal = 0,
	initialMonth,
	initialYear,
}: CalendarViewProps) {
	const router = useRouter();
	const today = useMemo(() => new Date(), []);

	const [taskList, setTaskList] = useState<Tasks[]>(tasks || []);
	const [projectList, setProjectList] = useState<Projects[]>(projects || []);
	const [memberList, setMemberList] = useState<MembersUsers[]>(members || []);

	const [currentMonthNumber, setCurrentMonthNumber] = useState(
		initialMonth || getMonth(today) + 1,
	);
	const [currentYear, setCurrentYear] = useState(
		initialYear || getYear(today),
	);

	// Persistent filters via localStorage
	const [taskFilter, setTaskFilter] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("calendar_task_filter") || "ALL";
		}
		return "ALL";
	});
	const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("calendar_project_filter") || "ALL";
		}
		return "ALL";
	});
	const [showCompleted, setShowCompleted] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("calendar_show_completed");
			return saved !== null ? saved === "true" : true;
		}
		return true;
	});

	const handleTaskFilterChange = (val: string) => {
		setTaskFilter(val);
		if (typeof window !== "undefined") {
			localStorage.setItem("calendar_task_filter", val);
		}
	};

	const handleProjectFilterChange = (val: string) => {
		setSelectedProjectId(val);
		if (typeof window !== "undefined") {
			localStorage.setItem("calendar_project_filter", val);
		}
	};

	const toggleShowCompleted = useCallback(() => {
		setShowCompleted((prev) => {
			const next = !prev;
			if (typeof window !== "undefined") {
				localStorage.setItem("calendar_show_completed", String(next));
			}
			return next;
		});
	}, []);

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

	// Navigate to new month and update URL to query date range on server
	const navigateMonth = useCallback(
		(month: number, year: number) => {
			setCurrentMonthNumber(month);
			setCurrentYear(year);
			router.push(`/calendar?month=${month}&year=${year}`);
		},
		[router],
	);

	const handleNextMonth = useCallback(() => {
		if (currentMonthNumber === 12) {
			navigateMonth(1, currentYear + 1);
		} else {
			navigateMonth(currentMonthNumber + 1, currentYear);
		}
	}, [currentMonthNumber, currentYear, navigateMonth]);

	const handlePreviousMonth = useCallback(() => {
		if (currentMonthNumber === 1) {
			navigateMonth(12, currentYear - 1);
		} else {
			navigateMonth(currentMonthNumber - 1, currentYear);
		}
	}, [currentMonthNumber, currentYear, navigateMonth]);

	const handleJumpToToday = useCallback(() => {
		navigateMonth(getMonth(today) + 1, getYear(today));
	}, [today, navigateMonth]);

	// Keyboard shortcut navigation (Left/Right arrow keys, 'C' to toggle completed tasks)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Do not trigger if user is typing in an input/select
			if (
				["INPUT", "TEXTAREA", "SELECT"].includes(
					(e.target as HTMLElement)?.tagName,
				) ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return;
			}
			if (e.key === "ArrowLeft") {
				handlePreviousMonth();
			} else if (e.key === "ArrowRight") {
				handleNextMonth();
			} else if (e.key === "c" || e.key === "C") {
				toggleShowCompleted();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handlePreviousMonth, handleNextMonth, toggleShowCompleted]);

	// Touch swipe support for mobile
	const touchStartX = useRef<number | null>(null);
	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
	};
	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchStartX.current === null) return;
		const deltaX = e.changedTouches[0].clientX - touchStartX.current;
		if (deltaX > 60) {
			handlePreviousMonth();
		} else if (deltaX < -60) {
			handleNextMonth();
		}
		touchStartX.current = null;
	};

	const currentMember = useMemo(() => {
		return memberList.find(
			(m) => m.id === currentMemberId || m.userId === currentMemberId,
		);
	}, [memberList, currentMemberId]);

	const currentUserId = currentMember?.userId;

	// Filter tasks by task scope (All / My Tasks assigned to current user), project filter, and completed visibility
	const filteredTasks = useMemo(() => {
		return taskList.filter((t) => {
			if (!showCompleted && t.status === Status.COMPLETED) {
				return false;
			}

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
	}, [taskList, showCompleted, taskFilter, selectedProjectId, currentMemberId, currentUserId]);

	const isViewingCurrentMonth =
		currentMonthNumber === getMonth(today) + 1 &&
		currentYear === getYear(today);

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

	// Chunk calendarCells into weeks (7 days each) for multi-day task rendering
	const weeks = useMemo(() => {
		const result: CalendarItem[][] = [];
		for (let i = 0; i < calendarCells.length; i += 7) {
			result.push(calendarCells.slice(i, i + 7));
		}
		return result;
	}, [calendarCells]);

	// Year choices for dropdown (currentYear +- 5)
	const yearOptions = useMemo(() => {
		const baseYear = getYear(today);
		const years = [];
		for (let y = baseYear - 5; y <= baseYear + 5; y++) {
			years.push(y);
		}
		return years;
	}, [today]);

	// Local update callback for optimistic updates
	const handleTaskUpdate = (updated: Tasks) => {
		setTaskList((prev) =>
			prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
		);
	};

	return (
		<div className="space-y-4">
			{/* Controls and Filters */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="rounded-full border-primary text-primary hover:bg-primary/10 cursor-pointer"
						onClick={handlePreviousMonth}
						title="Previous Month (Left Arrow)"
						aria-label="Previous Month"
					>
						<ChevronLeft className="w-4 h-4 text-primary" />
					</Button>

					{/* Month Picker Select */}
					<Select
						value={currentMonthNumber.toString()}
						onValueChange={(val) => navigateMonth(parseInt(val, 10), currentYear)}
					>
						<SelectTrigger className="h-9 font-bold text-primary border-primary rounded-full px-3 text-sm min-w-[125px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="border-primary text-primary bg-background">
							{MONTH.map((m, idx) => (
								<SelectItem key={m} value={(idx + 1).toString()}>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Year Picker Select */}
					<Select
						value={currentYear.toString()}
						onValueChange={(val) => navigateMonth(currentMonthNumber, parseInt(val, 10))}
					>
						<SelectTrigger className="h-9 font-bold text-primary border-primary rounded-full px-3 text-sm min-w-[90px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="border-primary text-primary bg-background">
							{yearOptions.map((y) => (
								<SelectItem key={y} value={y.toString()}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="icon"
						className="rounded-full border-primary text-primary hover:bg-primary/10 cursor-pointer"
						onClick={handleNextMonth}
						title="Next Month (Right Arrow)"
						aria-label="Next Month"
					>
						<ChevronRight className="w-4 h-4 text-primary" />
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleJumpToToday}
						disabled={isViewingCurrentMonth}
						className={`rounded-full text-xs gap-1 ml-2 border-primary text-primary transition-opacity ${
							isViewingCurrentMonth
								? "opacity-40 cursor-not-allowed"
								: "hover:bg-primary/10 cursor-pointer"
						}`}
						title="Jump to today's month"
					>
						<RotateCcw className="w-3.5 h-3.5 text-primary" />
						Today
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
					{/* Task Filter Select */}
					<div className="relative">
						<Select
							value={taskFilter}
							onValueChange={handleTaskFilterChange}
						>
							<SelectTrigger className="w-[140px] h-9 rounded-full text-sm border-primary text-primary">
								<SelectValue placeholder="All Tasks" />
							</SelectTrigger>
							<SelectContent className="border-primary text-primary bg-background">
								<SelectItem value="ALL">All Tasks</SelectItem>
								<SelectItem value="MY_TASKS">My Tasks</SelectItem>
							</SelectContent>
						</Select>
						{taskFilter !== "ALL" && (
							<span
								className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background"
								title="Filter active"
							/>
						)}
					</div>

					{/* Project Filter Select */}
					<div className="relative">
						<ProjectCombobox
							projects={projectList}
							selectedProjectId={selectedProjectId}
							onSelectProject={handleProjectFilterChange}
							workspaceId={workspaceId}
							allowAllOption={true}
							variant="outline"
							popoverWidth="w-[280px]"
						/>
						{selectedProjectId !== "ALL" && (
							<span
								className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background pointer-events-none"
								title="Project filter active"
							/>
						)}
					</div>

					{/* Toggle Completed Tasks Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={toggleShowCompleted}
						className={`rounded-full text-xs gap-1.5 h-9 border-primary text-primary transition-all cursor-pointer ${
							!showCompleted
								? "bg-primary/15 font-semibold"
								: "hover:bg-primary/10"
						}`}
						aria-pressed={!showCompleted}
						title="Toggle completed tasks visibility (Press 'C')"
					>
						{showCompleted ? (
							<Eye className="w-3.5 h-3.5" />
						) : (
							<EyeOff className="w-3.5 h-3.5" />
						)}
						<span className="hidden sm:inline">
							{showCompleted ? "Hide Completed" : "Show Completed"}
						</span>
						<span className="sm:hidden">
							{showCompleted ? "Hide Done" : "Show Done"}
						</span>
					</Button>

					<Link
						href={
							selectedProjectId !== "ALL"
								? `/tasks?creating=true&projectId=${selectedProjectId}`
								: "/tasks?creating=true"
						}
					>
						<Button className="rounded-full gap-2 border-primary text-secondary cursor-pointer">
							<Plus className="w-4 h-4" />
							New Task
						</Button>
					</Link>
				</div>
			</div>

			{/* Accessibility & Swipe Container */}
			<div
				role="grid"
				aria-label={`${renderMonthByNumber(currentMonthNumber)} ${currentYear} calendar`}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				className="border-l border-t border-primary"
			>
				{/* Week days header */}
				<div role="row" className="grid grid-cols-7">
					{DAY.map((day, index) => (
						<CalendarHeader key={index} value={day} />
					))}
				</div>

				{/* Calendar week-by-week grid with multi-day spanning support */}
				{weeks.map((week, weekIdx) => {
					const weekStart = startOfDay(week[0].date).getTime();
					const weekEnd = startOfDay(week[6].date).getTime();

					return (
						<div key={weekIdx} role="row" className="relative">
							{/* Day Cells in this week */}
							<div className="grid grid-cols-7">
								{week.map((item) => {
									const dayTasks = filteredTasks.filter((t) =>
										isTaskOnDate(t, item.date),
									);

									return (
										<div
											key={item.date.toISOString()}
											role="gridcell"
											aria-label={format(item.date, "EEEE, MMMM d, yyyy")}
											className="w-full min-w-0"
										>
											<CalendarBox
												date={item.date}
												isCurrentMonth={item.isCurrentMonth}
												tasks={dayTasks}
												selectedProjectId={selectedProjectId !== "ALL" ? selectedProjectId : undefined}
												onTaskUpdate={handleTaskUpdate}
											/>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			{/* Empty State when filters yield 0 tasks */}
			{filteredTasks.length === 0 && (
				<div className="flex flex-col items-center justify-center py-10 text-primary/60 gap-2">
					<CalendarDays className="w-10 h-10 stroke-[1.5]" />
					<p className="font-semibold text-base">No tasks match your filters</p>
					<p className="text-xs text-primary/50 text-center max-w-sm">
						{taskFilter === "MY_TASKS"
							? "You have no tasks assigned in this date range. Try switching to 'All Tasks'."
							: "There are no tasks scheduled for this period. Click 'New Task' to schedule one."}
					</p>
				</div>
			)}
		</div>
	);
}

export const CalendarHeader = ({ value }: { value: string }) => {
	const short = SHORT_DAYS[value] || value.slice(0, 2);
	return (
		<div
			role="columnheader"
			aria-label={value}
			className="border-r border-b border-primary pb-[10px] pt-[8px] px-[10px] w-full min-w-0 bg-primary/5"
		>
			<p className="text-[13px] md:hidden text-center font-bold text-primary">
				{short}
			</p>
			<p className="text-[13px] hidden md:inline font-semibold text-primary">
				{value}
			</p>
		</div>
	);
};


