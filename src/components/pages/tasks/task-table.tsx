"use client";

import React from "react";
import PaginationControls from "@/components/shared/pagination-controls";
import ProjectTaskProgress from "@/components/shared/project-task-progress";
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
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { deleteTask, updateTaskDetails } from "@/lib/services/task.services";
import type { MembersUsers, Projects, Tasks } from "@/lib/types";
import { getInitials, renderPriority, renderStatus } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
	AlertCircle,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ArrowUpDown,
	Box,
	Calendar as CalendarIcon,
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleCheck,
	CircleX,
	Columns3,
	ExternalLink,
	Eye,
	EyeOff,
	Filter,
	Flag,
	Layers,
	ListFilter,
	Loader2,
	MoreHorizontal,
	PanelRightOpen,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Sparkles,
	Squircle,
	Trash2,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MileStoneStatus, PriorityLevel, Status } from "../../../../generated/prisma/enums";
import TaskAssigneeOverview from "./task-assignee-overview";
import TaskPeekSheet from "./task-peek-sheet";

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

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
	[PriorityLevel.URGENT]: 5,
	[PriorityLevel.HIGH]: 4,
	[PriorityLevel.MEDIUM]: 3,
	[PriorityLevel.LOW]: 2,
	[PriorityLevel.NO_PRIORITY]: 1,
};

const STATUS_ORDER: Record<Status, number> = {
	[Status.TODO]: 1,
	[Status.IN_PROGRESS]: 2,
	[Status.ON_HOLD]: 3,
	[Status.COMPLETED]: 4,
	[Status.CANCELLED]: 5,
};

type SortField =
	| "title"
	| "project"
	| "priority"
	| "status"
	| "createdAt"
	| "endPeriod"
	| "milestones";

type SortDirection = "asc" | "desc" | null;

type GroupByField = "none" | "status" | "priority" | "project";

interface GroupedTaskSection {
	id: string;
	label: string;
	status?: Status;
	priority?: PriorityLevel;
	tasks: Tasks[];
}

interface ColumnVisibility {
	project: boolean;
	assignees: boolean;
	createdAt: boolean;
	period: boolean;
	priority: boolean;
	status: boolean;
	milestones: boolean;
}

export default function TaskTable({
	tasks: initialTasks,
	projects = [],
	members = [],
	workspaceId,
	currentUserId,
	currentMemberId,
	totalItems,
	pageSize = 10,
}: {
	tasks: Tasks[];
	projects?: Projects[];
	members?: MembersUsers[];
	workspaceId?: string;
	currentUserId?: string;
	currentMemberId?: string;
	totalItems?: number;
	pageSize?: number;
}) {
	// Local task list state for optimistic instant updates
	const [tasks, setTasks] = useState<Tasks[]>(initialTasks);

	// Sync local tasks when parent tasks prop changes
	useMemo(() => {
		setTasks(initialTasks);
	}, [initialTasks]);

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
	const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
	const [filterAssignedToMe, setFilterAssignedToMe] = useState(true);
	const [filterOverdue, setFilterOverdue] = useState(false);
	const [filterHighUrgent, setFilterHighUrgent] = useState(false);
	const [hideCompleted, setHideCompleted] = useState(false);

	// Grouping & Sorting states
	const [groupBy, setGroupBy] = useState<GroupByField>("none");
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

	// Column Visibility state
	const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
		project: true,
		assignees: true,
		createdAt: false,
		period: true,
		priority: true,
		status: true,
		milestones: true,
	});

	// Selection & Bulk actions
	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);

	// RBAC member identification
	const currentMember = useMemo(() => {
		return (
			members?.find(
				(m) =>
					(currentMemberId && m.id === currentMemberId) ||
					(currentUserId && m.userId === currentUserId),
			) || null
		);
	}, [members, currentMemberId, currentUserId]);

	const checkCanEditTask = (t: Tasks) => {
		if (!currentMember) return false;
		const isWorkspaceAdmin =
			currentMember.role === "OWNER" || currentMember.role === "ADMIN";
		if (isWorkspaceAdmin) return true;

		// Check if user is project lead on the task's project
		const projectMember = t.project?.projectMembers?.find(
			(pm) =>
				pm.memberId === currentMember.id ||
				(currentUserId && pm.member?.userId === currentUserId),
		);
		const isProjectLead = projectMember?.projectRole === "PROJECT_LEAD";
		if (isProjectLead) return true;

		// Check if user is task creator
		const isCreator = t.createdById === currentMember.id;
		if (isCreator) return true;

		// Check if user is assigned to the task
		const isAssignee = t.taskMembers?.some(
			(tm) =>
				tm.memberId === currentMember.id ||
				(currentUserId && tm.member?.userId === currentUserId),
		);
		if (isAssignee) return true;

		return false;
	};

	const checkCanDeleteTask = (t: Tasks) => {
		if (!currentMember) return false;
		const isWorkspaceAdmin =
			currentMember.role === "OWNER" || currentMember.role === "ADMIN";
		if (isWorkspaceAdmin) return true;

		const projectMember = t.project?.projectMembers?.find(
			(pm) =>
				pm.memberId === currentMember.id ||
				(currentUserId && pm.member?.userId === currentUserId),
		);
		const isProjectLead = projectMember?.projectRole === "PROJECT_LEAD";
		const isCreator = t.createdById === currentMember.id;

		return isProjectLead || isCreator;
	};

	// Side Peek Sheet state
	const [peekTaskId, setPeekTaskId] = useState<string | null>(null);
	const [peekOpen, setPeekOpen] = useState(false);

	const activePeekTask = useMemo(() => {
		return tasks.find((t) => t.id === peekTaskId) || null;
	}, [tasks, peekTaskId]);

	// Counter stats for quick filter chips
	const stats = useMemo(() => {
		const now = new Date();
		let assignedToMe = 0;
		let overdue = 0;
		let highUrgent = 0;

		tasks.forEach((t) => {
			if (
				(currentUserId || currentMemberId) &&
				t.taskMembers?.some(
					(tm) =>
						(currentUserId && tm.member?.userId === currentUserId) ||
						(currentUserId && tm.memberId === currentUserId) ||
						(currentMember?.id && tm.memberId === currentMember.id) ||
						(currentMemberId && tm.memberId === currentMemberId),
				)
			) {
				assignedToMe++;
			}

			const end = new Date(t.endPeriod);
			if (
				isPast(end) &&
				!isToday(end) &&
				t.status !== Status.COMPLETED &&
				t.status !== Status.CANCELLED
			) {
				overdue++;
			}

			if (
				t.priority === PriorityLevel.URGENT ||
				t.priority === PriorityLevel.HIGH
			) {
				highUrgent++;
			}
		});

		return { assignedToMe, overdue, highUrgent };
	}, [tasks, currentUserId, currentMemberId, currentMember]);

	// Filter toggle handlers
	const togglePriority = (value: PriorityLevel) => {
		setSelectedPriorities((prev) =>
			prev.includes(value)
				? prev.filter((item) => item !== value)
				: [...prev, value],
		);
	};

	const toggleStatus = (value: Status) => {
		setSelectedStatuses((prev) =>
			prev.includes(value)
				? prev.filter((item) => item !== value)
				: [...prev, value],
		);
	};

	const toggleProject = (projectId: string) => {
		setSelectedProjectIds((prev) =>
			prev.includes(projectId)
				? prev.filter((id) => id !== projectId)
				: [...prev, projectId],
		);
	};

	const handleResetFilters = () => {
		setSearchQuery("");
		setSelectedPriorities([]);
		setSelectedStatuses([]);
		setSelectedProjectIds([]);
		setFilterAssignedToMe(false);
		setFilterOverdue(false);
		setFilterHighUrgent(false);
		setHideCompleted(false);
		setSortField(null);
		setSortDirection(null);
	};

	const isFilterActive =
		searchQuery.trim() !== "" ||
		selectedPriorities.length > 0 ||
		selectedStatuses.length > 0 ||
		selectedProjectIds.length > 0 ||
		filterAssignedToMe ||
		filterOverdue ||
		filterHighUrgent ||
		hideCompleted;

	// Sorting handler
	const handleColumnSort = (field: SortField) => {
		if (sortField !== field) {
			setSortField(field);
			setSortDirection("asc");
		} else if (sortDirection === "asc") {
			setSortDirection("desc");
		} else if (sortDirection === "desc") {
			setSortField(null);
			setSortDirection(null);
		}
	};

	// Filtered tasks computation
	const filteredTasks = useMemo(() => {
		return tasks.filter((item) => {
			const query = searchQuery.trim().toLowerCase();
			const matchesSearch =
				query === "" ||
				item.title.toLowerCase().includes(query) ||
				(item.description && item.description.toLowerCase().includes(query)) ||
				(item.project?.title &&
					item.project.title.toLowerCase().includes(query));

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
						(currentUserId && tm.member?.userId === currentUserId) ||
						(currentUserId && tm.memberId === currentUserId) ||
						(currentMember?.id && tm.memberId === currentMember.id) ||
						(currentMemberId && tm.memberId === currentMemberId),
				);

			const isOverdueMatch =
				!filterOverdue ||
				(isPast(new Date(item.endPeriod)) &&
					!isToday(new Date(item.endPeriod)) &&
					item.status !== Status.COMPLETED &&
					item.status !== Status.CANCELLED);

			const isHighUrgentMatch =
				!filterHighUrgent ||
				item.priority === PriorityLevel.URGENT ||
				item.priority === PriorityLevel.HIGH;

			const isCompletedFilterMatch =
				!hideCompleted ||
				(item.status !== Status.COMPLETED &&
					item.status !== Status.CANCELLED);

			return (
				matchesSearch &&
				matchesPriority &&
				matchesStatus &&
				matchesProject &&
				isAssignedToUser &&
				isOverdueMatch &&
				isHighUrgentMatch &&
				isCompletedFilterMatch
			);
		});
	}, [
		tasks,
		searchQuery,
		selectedPriorities,
		selectedStatuses,
		selectedProjectIds,
		filterAssignedToMe,
		filterOverdue,
		filterHighUrgent,
		hideCompleted,
		currentUserId,
		currentMemberId,
		currentMember,
	]);

	// Sorted tasks computation
	const sortedTasks = useMemo(() => {
		if (!sortField || !sortDirection) return filteredTasks;

		return [...filteredTasks].sort((a, b) => {
			let comparison = 0;

			if (sortField === "title") {
				comparison = a.title.localeCompare(b.title);
			} else if (sortField === "project") {
				const projA = a.project?.title || "";
				const projB = b.project?.title || "";
				comparison = projA.localeCompare(projB);
			} else if (sortField === "priority") {
				comparison =
					PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
			} else if (sortField === "status") {
				comparison =
					STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
			} else if (sortField === "createdAt") {
				comparison =
					new Date(a.createdAt).getTime() -
					new Date(b.createdAt).getTime();
			} else if (sortField === "endPeriod") {
				comparison =
					new Date(a.endPeriod).getTime() -
					new Date(b.endPeriod).getTime();
			} else if (sortField === "milestones") {
				const aTotal = a.milestones?.length || 0;
				const aDone =
					a.milestones?.filter((m) => m.status === MileStoneStatus.DONE)
						.length || 0;
				const aPct = aTotal > 0 ? aDone / aTotal : 0;

				const bTotal = b.milestones?.length || 0;
				const bDone =
					b.milestones?.filter((m) => m.status === MileStoneStatus.DONE)
						.length || 0;
				const bPct = bTotal > 0 ? bDone / bTotal : 0;

				comparison = aPct - bPct;
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [filteredTasks, sortField, sortDirection]);

	// Grouped tasks computation
	const groupedTaskSections = useMemo((): GroupedTaskSection[] => {
		if (groupBy === "none") {
			return [{ id: "all", label: "All Tasks", tasks: sortedTasks }];
		}

		if (groupBy === "status") {
			const groups: Record<Status, Tasks[]> = {
				[Status.TODO]: [],
				[Status.IN_PROGRESS]: [],
				[Status.ON_HOLD]: [],
				[Status.COMPLETED]: [],
				[Status.CANCELLED]: [],
			};
			sortedTasks.forEach((t) => {
				if (groups[t.status]) groups[t.status].push(t);
			});
			return Object.entries(groups)
				.filter(([_, groupTasks]) => groupTasks.length > 0)
				.map(([status, groupTasks]) => ({
					id: status,
					label: STATUS_LABELS[status as Status],
					status: status as Status,
					tasks: groupTasks,
				}));
		}

		if (groupBy === "priority") {
			const groups: Record<PriorityLevel, Tasks[]> = {
				[PriorityLevel.URGENT]: [],
				[PriorityLevel.HIGH]: [],
				[PriorityLevel.MEDIUM]: [],
				[PriorityLevel.LOW]: [],
				[PriorityLevel.NO_PRIORITY]: [],
			};
			sortedTasks.forEach((t) => {
				if (groups[t.priority]) groups[t.priority].push(t);
			});
			return Object.entries(groups)
				.filter(([_, groupTasks]) => groupTasks.length > 0)
				.map(([priority, groupTasks]) => ({
					id: priority,
					label: PRIORITY_LABELS[priority as PriorityLevel],
					priority: priority as PriorityLevel,
					tasks: groupTasks,
				}));
		}

		if (groupBy === "project") {
			const groups: Record<string, { label: string; tasks: Tasks[] }> = {};
			sortedTasks.forEach((t) => {
				const key = t.projectId || "no-project";
				const label = t.project?.title || "No Project";
				if (!groups[key]) {
					groups[key] = { label, tasks: [] };
				}
				groups[key].tasks.push(t);
			});
			return Object.entries(groups).map(([id, grp]) => ({
				id,
				label: grp.label,
				tasks: grp.tasks,
			}));
		}

		return [{ id: "all", label: "All Tasks", tasks: sortedTasks }];
	}, [sortedTasks, groupBy]);

	const selectableTasks = useMemo(() => {
		return sortedTasks.filter((t) => checkCanEditTask(t));
	}, [sortedTasks, currentMember]);

	// Selection handlers
	const toggleSelectTask = (taskId: string) => {
		const targetTask = tasks.find((t) => t.id === taskId);
		if (targetTask && !checkCanEditTask(targetTask)) {
			toast.error("You do not have permission to edit this task");
			return;
		}

		setSelectedTaskIds((prev) => {
			const next = new Set(prev);
			if (next.has(taskId)) {
				next.delete(taskId);
			} else {
				next.add(taskId);
			}
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (selectableTasks.length === 0) {
			toast.info("No tasks you have permission to edit in this view");
			return;
		}

		const allSelectableSelected = selectableTasks.every((t) =>
			selectedTaskIds.has(t.id),
		);

		if (allSelectableSelected) {
			setSelectedTaskIds(new Set());
		} else {
			setSelectedTaskIds(new Set(selectableTasks.map((t) => t.id)));
		}
	};

	// Inline updates
	const handleInlineStatusChange = async (taskId: string, newStatus: Status) => {
		// Optimistic update
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
		);

		try {
			const res = await updateTaskDetails({
				taskId,
				values: { status: newStatus },
			});
			if (!res.success) {
				toast.error(res.message || "Failed to update status");
			} else {
				toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
			}
		} catch {
			toast.error("An error occurred while updating status");
		}
	};

	const handleInlinePriorityChange = async (
		taskId: string,
		newPriority: PriorityLevel,
	) => {
		// Optimistic update
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t)),
		);

		try {
			const res = await updateTaskDetails({
				taskId,
				values: { priority: newPriority },
			});
			if (!res.success) {
				toast.error(res.message || "Failed to update priority");
			} else {
				toast.success(`Priority set to ${PRIORITY_LABELS[newPriority]}`);
			}
		} catch {
			toast.error("An error occurred while updating priority");
		}
	};

	const handleInlineQuickComplete = async (task: Tasks) => {
		const newStatus =
			task.status === Status.COMPLETED ? Status.TODO : Status.COMPLETED;
		await handleInlineStatusChange(task.id, newStatus);
	};

	// Bulk operations
	const handleBulkStatusChange = async (newStatus: Status) => {
		const taskIds = Array.from(selectedTaskIds);
		if (taskIds.length === 0) return;

		const editableTaskIds = taskIds.filter((id) => {
			const t = tasks.find((task) => task.id === id);
			return t ? checkCanEditTask(t) : false;
		});

		if (editableTaskIds.length === 0) {
			toast.error("You do not have permission to update the selected tasks");
			return;
		}

		setTasks((prev) =>
			prev.map((t) =>
				editableTaskIds.includes(t.id) ? { ...t, status: newStatus } : t,
			),
		);
		setSelectedTaskIds(new Set());

		toast.promise(
			Promise.all(
				editableTaskIds.map((taskId) =>
					updateTaskDetails({
						taskId,
						values: { status: newStatus },
					}),
				),
			),
			{
				loading: `Updating ${editableTaskIds.length} tasks...`,
				success: `Updated ${editableTaskIds.length} tasks to ${STATUS_LABELS[newStatus]}`,
				error: "Failed to update some tasks",
			},
		);
	};

	const handleBulkPriorityChange = async (newPriority: PriorityLevel) => {
		const taskIds = Array.from(selectedTaskIds);
		if (taskIds.length === 0) return;

		const editableTaskIds = taskIds.filter((id) => {
			const t = tasks.find((task) => task.id === id);
			return t ? checkCanEditTask(t) : false;
		});

		if (editableTaskIds.length === 0) {
			toast.error("You do not have permission to update the selected tasks");
			return;
		}

		setTasks((prev) =>
			prev.map((t) =>
				editableTaskIds.includes(t.id) ? { ...t, priority: newPriority } : t,
			),
		);
		setSelectedTaskIds(new Set());

		toast.promise(
			Promise.all(
				editableTaskIds.map((taskId) =>
					updateTaskDetails({
						taskId,
						values: { priority: newPriority },
					}),
				),
			),
			{
				loading: `Updating ${editableTaskIds.length} tasks...`,
				success: `Updated ${editableTaskIds.length} tasks to ${PRIORITY_LABELS[newPriority]}`,
				error: "Failed to update some tasks",
			},
		);
	};

	const handleBulkDelete = async () => {
		const taskIds = Array.from(selectedTaskIds);
		if (taskIds.length === 0) return;

		const deletableTaskIds = taskIds.filter((id) => {
			const t = tasks.find((task) => task.id === id);
			return t ? checkCanDeleteTask(t) : false;
		});

		if (deletableTaskIds.length === 0) {
			toast.error("You do not have permission to delete the selected tasks");
			setBulkDeleteDialogOpen(false);
			return;
		}

		setIsBulkDeleting(true);
		try {
			await Promise.all(deletableTaskIds.map((id) => deleteTask(id)));
			setTasks((prev) => prev.filter((t) => !deletableTaskIds.includes(t.id)));
			setSelectedTaskIds(new Set());
			setBulkDeleteDialogOpen(false);
			toast.success(`Deleted ${deletableTaskIds.length} tasks`);
		} catch {
			toast.error("Failed to delete some tasks");
		} finally {
			setIsBulkDeleting(false);
		}
	};

	const toggleGroupCollapse = (groupId: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Open Side Peek Sheet
	const openTaskPeek = (taskId: string) => {
		setPeekTaskId(taskId);
		setPeekOpen(true);
	};

	return (
		<div className="flex flex-col gap-4 py-4">
			{/* Top Controls & Search Bar */}
			<div className="flex flex-col gap-3">
				{/* Primary Search and Actions Row */}
				<div className="flex flex-wrap gap-2.5 items-center justify-between">
					<div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
						{/* Search Input */}
						<div className="relative flex-1 min-w-[200px] max-w-md">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent pointer-events-none" />
							<Input
								placeholder="Search tasks, descriptions, projects..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="bg-primary pl-9 pr-8 rounded-full border border-secondary/15 text-secondary placeholder:text-secondary/50 h-10 w-full focus-visible:ring-1 focus-visible:ring-accent"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/50 p-1"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Quick Filter: Assigned to me */}
						<button
							type="button"
							onClick={() => setFilterAssignedToMe((prev) => !prev)}
							className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
								filterAssignedToMe
									? "bg-[#969696] text-primary border-[#969696]"
									: "bg-primary text-secondary border-secondary/15"
							}`}
						>
							<UserCheck className={`w-3.5 h-3.5 mr-1.5 ${filterAssignedToMe ? "text-primary" : "text-accent"}`} />
							Assigned to me
							{stats.assignedToMe > 0 && (
								<span
									className={`ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
										filterAssignedToMe
											? "bg-primary text-secondary"
											: "bg-secondary text-primary"
									}`}
								>
									{stats.assignedToMe}
								</span>
							)}
						</button>

						{/* Quick Filter: Overdue */}
						{stats.overdue > 0 && (
							<button
								type="button"
								onClick={() => setFilterOverdue((prev) => !prev)}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
									filterOverdue
										? "bg-destructive text-primary border-destructive"
										: "bg-primary text-secondary border-secondary/15"
								}`}
							>
								<AlertCircle className={`w-3.5 h-3.5 mr-1.5 ${filterOverdue ? "text-primary" : "text-destructive"}`} />
								Overdue
								<span className="ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full bg-destructive text-primary text-[10px] font-bold">
									{stats.overdue}
								</span>
							</button>
						)}

						{/* Quick Filter: Urgent & High */}
						{stats.highUrgent > 0 && (
							<button
								type="button"
								onClick={() => setFilterHighUrgent((prev) => !prev)}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
									filterHighUrgent
										? "bg-destructive text-primary border-destructive"
										: "bg-primary text-secondary border-secondary/15"
								}`}
							>
								<Flag className={`w-3.5 h-3.5 mr-1.5 ${filterHighUrgent ? "text-primary" : "text-destructive"}`} />
								High Priority
								<span className="ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full bg-destructive text-primary text-[10px] font-bold">
									{stats.highUrgent}
								</span>
							</button>
						)}
					</div>

					{/* Right Controls: Filter, Group By, Columns, Reset */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* Group By Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs gap-1.5 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none ${
										groupBy !== "none" ? "border-accent text-accent" : ""
									}`}
								>
									<Layers className="w-3.5 h-3.5 text-accent" />
									<span>
										Group:{" "}
										<strong className="capitalize">
											{groupBy === "none" ? "None" : groupBy}
										</strong>
									</span>
									<ChevronDown className="w-3 h-3 text-accent/70" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary rounded-[14px]">
								<DropdownMenuLabel className="text-xs">
									Group Tasks By
								</DropdownMenuLabel>
								<DropdownMenuSeparator className="bg-secondary/15" />
								<DropdownMenuItem
									onClick={() => setGroupBy("none")}
									className="cursor-pointer text-xs"
								>
									None (Flat list)
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setGroupBy("status")}
									className="cursor-pointer text-xs"
								>
									Status
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setGroupBy("priority")}
									className="cursor-pointer text-xs"
								>
									Priority
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setGroupBy("project")}
									className="cursor-pointer text-xs"
								>
									Project
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Advanced Filter Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs gap-1.5 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none ${
										selectedPriorities.length > 0 ||
										selectedStatuses.length > 0 ||
										selectedProjectIds.length > 0 ||
										hideCompleted
											? "border-accent text-accent font-semibold"
											: ""
									}`}
								>
									<SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
									Filter
									{(selectedPriorities.length > 0 ||
										selectedStatuses.length > 0 ||
										selectedProjectIds.length > 0 ||
										hideCompleted) && (
										<span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-primary text-[10px] font-bold">
											{selectedPriorities.length +
												selectedStatuses.length +
												selectedProjectIds.length +
												(hideCompleted ? 1 : 0)}
										</span>
									)}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[260px] rounded-[14px] max-h-[440px] overflow-y-auto custom-scrollbar shadow-2xl p-2">
								{/* Quick Hide Completed Toggle */}
								<div className="px-2 py-1.5">
									<label className="flex items-center justify-between cursor-pointer select-none text-xs font-medium text-secondary">
										<span>Hide Completed Tasks</span>
										<Checkbox
											checked={hideCompleted}
											onCheckedChange={() =>
												setHideCompleted((p) => !p)
											}
										/>
									</label>
								</div>

								<DropdownMenuSeparator className="bg-secondary/15" />

								{/* Filter by Project */}
								{projects.length > 0 && (
									<>
										<DropdownMenuLabel className="text-xs font-bold text-secondary/70">
											Projects
										</DropdownMenuLabel>
										<div className="flex flex-col gap-1 px-1 py-1 max-h-[120px] overflow-y-auto custom-scrollbar">
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
														className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs text-secondary"
													>
														<Checkbox
															checked={isChecked}
															onCheckedChange={() =>
																toggleProject(proj.id)
															}
														/>
														<span className="truncate">
															{proj.title}
														</span>
													</label>
												);
											})}
										</div>
										<DropdownMenuSeparator className="bg-secondary/15" />
									</>
								)}

								{/* Filter by Priority */}
								<DropdownMenuLabel className="text-xs font-bold text-secondary/70">
									Priority
								</DropdownMenuLabel>
								<div className="flex flex-col gap-1 px-1 py-1">
									{PRIORITY_OPTIONS.map((opt) => {
										const isChecked =
											selectedPriorities.includes(opt.value);
										return (
											<label
												key={opt.value}
												onClick={(e) =>
													e.stopPropagation()
												}
												className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs text-secondary"
											>
												<Checkbox
													checked={isChecked}
													onCheckedChange={() =>
														togglePriority(opt.value)
													}
												/>
												<span
													className={`w-2 h-2 rounded-full ${renderPriority(
														opt.value,
													)}`}
												/>
												<span>{opt.label}</span>
											</label>
										);
									})}
								</div>

								<DropdownMenuSeparator className="bg-secondary/15" />

								{/* Filter by Status */}
								<DropdownMenuLabel className="text-xs font-bold text-secondary/70">
									Status
								</DropdownMenuLabel>
								<div className="flex flex-col gap-1 px-1 py-1">
									{STATUS_OPTIONS.map((opt) => {
										const isChecked =
											selectedStatuses.includes(opt.value);
										return (
											<label
												key={opt.value}
												onClick={(e) =>
													e.stopPropagation()
												}
												className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs text-secondary"
											>
												<Checkbox
													checked={isChecked}
													onCheckedChange={() =>
														toggleStatus(opt.value)
													}
												/>
												<span
													className={`w-2 h-2 rounded-full ${renderStatus(
														opt.value,
													)}`}
												/>
												<span>{opt.label}</span>
											</label>
										);
									})}
								</div>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Columns Visibility Toggle */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="inline-flex items-center justify-center rounded-full h-9 w-9 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none"
									title="Customize Columns"
								>
									<Columns3 className="w-3.5 h-3.5 text-accent" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[180px] rounded-[14px]">
								<DropdownMenuLabel className="text-xs">
									Toggle Columns
								</DropdownMenuLabel>
								<DropdownMenuSeparator className="bg-secondary/15" />
								<DropdownMenuCheckboxItem
									checked={visibleColumns.project}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											project: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Project
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.assignees}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											assignees: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Assignees
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.period}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											period: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Period & Timeline
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.priority}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											priority: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Priority
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.status}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											status: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Status
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.milestones}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											milestones: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Milestones
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={visibleColumns.createdAt}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											createdAt: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Created Date
								</DropdownMenuCheckboxItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Reset Filters */}
						{isFilterActive && (
							<button
								type="button"
								onClick={handleResetFilters}
								className="inline-flex items-center justify-center rounded-full h-9 px-3 text-secondary text-xs gap-1 border border-secondary/15 bg-primary cursor-pointer select-none"
							>
								<RotateCcw className="w-3 h-3 text-accent" />
								Reset
							</button>
						)}
					</div>
				</div>

				{/* Active Filter Summary Bar */}
				{isFilterActive && (
					<div className="flex items-center gap-1.5 flex-wrap text-xs text-primary/70">
						<span className="font-semibold text-primary">
							Showing {sortedTasks.length} of {tasks.length} tasks
						</span>
						{filterAssignedToMe && (
							<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
								Assigned to me
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilterAssignedToMe(false)}
								/>
							</Badge>
						)}
						{filterOverdue && (
							<Badge className="bg-destructive/20 text-destructive border-0 gap-1 text-[11px] py-0.5 px-2 font-normal">
								Overdue
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilterOverdue(false)}
								/>
							</Badge>
						)}
						{filterHighUrgent && (
							<Badge className="bg-destructive/20 text-destructive border-0 gap-1 text-[11px] py-0.5 px-2 font-normal">
								High/Urgent
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setFilterHighUrgent(false)}
								/>
							</Badge>
						)}
						{hideCompleted && (
							<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
								Hiding completed
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => setHideCompleted(false)}
								/>
							</Badge>
						)}
						{selectedPriorities.map((p) => (
							<Badge
								key={p}
								className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal"
							>
								Priority: {PRIORITY_LABELS[p]}
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => togglePriority(p)}
								/>
							</Badge>
						))}
						{selectedStatuses.map((s) => (
							<Badge
								key={s}
								className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal"
							>
								Status: {STATUS_LABELS[s]}
								<X
									className="w-3 h-3 cursor-pointer hover:text-destructive"
									onClick={() => toggleStatus(s)}
								/>
							</Badge>
						))}
						{selectedProjectIds.map((pid) => {
							const proj = projects.find((p) => p.id === pid);
							return (
								<Badge
									key={pid}
									className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal"
								>
									Project: {proj?.title || pid}
									<X
										className="w-3 h-3 cursor-pointer hover:text-destructive"
										onClick={() => toggleProject(pid)}
									/>
								</Badge>
							);
						})}
					</div>
				)}
			</div>

			{/* Main Table Container */}
			<div className="relative rounded-[20px] border border-secondary/15 bg-primary/40 backdrop-blur-sm overflow-hidden shadow-sm">
				{sortedTasks.length === 0 ? (
					/* Empty States */
					<div className="flex justify-center py-16 px-6 flex-col items-center text-center">
						<div className="bg-secondary/10 text-secondary p-4 rounded-full mb-3">
							{isFilterActive ? (
								<ListFilter className="w-6 h-6 text-accent" />
							) : (
								<Squircle className="w-6 h-6 text-accent" />
							)}
						</div>
						<h3 className="text-base font-bold text-secondary">
							{isFilterActive
								? "No matching tasks found"
								: "No tasks available"}
						</h3>
						<p className="text-xs text-secondary/60 max-w-sm mt-1">
							{isFilterActive
								? "None of the tasks match your active filters or search term. Try resetting your filters."
								: "No tasks have been created in this workspace yet. Get started by clicking New Task."}
						</p>
						{isFilterActive && (
							<Button
								variant="outline"
								onClick={handleResetFilters}
								className="mt-4 rounded-full text-xs h-8 gap-1.5 border-secondary/20 hover:bg-secondary/10 text-secondary"
							>
								<RotateCcw className="w-3 h-3" />
								Clear all filters
							</Button>
						)}
					</div>
				) : (
					<div className="overflow-x-auto custom-scrollbar">
						<Table className="w-full">
							<TableHeader className="bg-secondary/5 border-b border-secondary/10">
								<TableRow className="hover:bg-transparent border-secondary/10">
									{/* Selection Checkbox Header */}
									<TableHead className="w-[44px] px-3">
										<Checkbox
											disabled={selectableTasks.length === 0}
											checked={
												selectableTasks.length > 0 &&
												selectedTaskIds.size > 0 &&
												selectableTasks.every((t) =>
													selectedTaskIds.has(t.id),
												)
													? true
													: selectedTaskIds.size > 0
													? "indeterminate"
													: false
											}
											onCheckedChange={toggleSelectAll}
											aria-label="Select all editable tasks"
										/>
									</TableHead>

									{/* Task Title Header (Sortable) */}
									<TableHead
										onClick={() => handleColumnSort("title")}
										className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
									>
										<div className="flex items-center gap-1.5">
											<span>Task Title</span>
											{sortField === "title" ? (
												sortDirection === "asc" ? (
													<ArrowUp className="w-3.5 h-3.5 text-accent" />
												) : (
													<ArrowDown className="w-3.5 h-3.5 text-accent" />
												)
											) : (
												<ArrowUpDown className="w-3 h-3 text-accent/50" />
											)}
										</div>
									</TableHead>

									{/* Project Header (Sortable) */}
									{visibleColumns.project && (
										<TableHead
											onClick={() =>
												handleColumnSort("project")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Project</span>
												{sortField === "project" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Assignees Header */}
									{visibleColumns.assignees && (
										<TableHead className="text-xs font-bold text-secondary">
											Assignees
										</TableHead>
									)}

									{/* Created At Header (Sortable) */}
									{visibleColumns.createdAt && (
										<TableHead
											onClick={() =>
												handleColumnSort("createdAt")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Created</span>
												{sortField === "createdAt" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Period / Timeline Header (Sortable) */}
									{visibleColumns.period && (
										<TableHead
											onClick={() =>
												handleColumnSort("endPeriod")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Timeline / Due</span>
												{sortField === "endPeriod" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Priority Header (Sortable) */}
									{visibleColumns.priority && (
										<TableHead
											onClick={() =>
												handleColumnSort("priority")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Priority</span>
												{sortField === "priority" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Status Header (Sortable) */}
									{visibleColumns.status && (
										<TableHead
											onClick={() =>
												handleColumnSort("status")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Status</span>
												{sortField === "status" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Milestones Header (Sortable) */}
									{visibleColumns.milestones && (
										<TableHead
											onClick={() =>
												handleColumnSort("milestones")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors w-[180px]"
										>
											<div className="flex items-center gap-1.5">
												<span>Milestones</span>
												{sortField === "milestones" ? (
													sortDirection === "asc" ? (
														<ArrowUp className="w-3.5 h-3.5 text-accent" />
													) : (
														<ArrowDown className="w-3.5 h-3.5 text-accent" />
													)
												) : (
													<ArrowUpDown className="w-3 h-3 text-accent/50" />
												)}
											</div>
										</TableHead>
									)}

									{/* Actions Header */}
									<TableHead className="w-[50px] text-right pr-4"></TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{groupedTaskSections.map((section) => {
									const isCollapsed =
										collapsedGroups[section.id];

									return (
										<React.Fragment key={section.id}>
											{/* Group Header Row (if grouping enabled) */}
											{groupBy !== "none" && (
												<tr className="bg-secondary/5 border-y border-secondary/10">
													<td
														colSpan={10}
														className="px-4 py-2"
													>
														<div
															onClick={() =>
																toggleGroupCollapse(
																	section.id,
																)
															}
															className="flex items-center gap-2 cursor-pointer select-none group w-fit"
														>
															<button className="text-secondary/70 group-hover:text-secondary p-0.5">
																{isCollapsed ? (
																	<ChevronRight className="w-4 h-4 text-accent" />
																) : (
																	<ChevronDown className="w-4 h-4 text-accent" />
																)}
															</button>
															<span className="text-xs font-bold text-secondary group-hover:text-accent transition-colors flex items-center gap-2">
																{section.status && (
																	<span
																		className={`w-2 h-2 rounded-full ${renderStatus(
																			section.status,
																		)}`}
																	/>
																)}
																{section.priority && (
																	<span
																		className={`w-2 h-2 rounded-full ${renderPriority(
																			section.priority,
																		)}`}
																	/>
																)}
																{section.label}
															</span>
															<span className="text-[11px] font-semibold bg-secondary/10 px-2 py-0.5 rounded-full text-secondary/80">
																{
																	section.tasks
																		.length
																}
															</span>
														</div>
													</td>
												</tr>
											)}

											{/* Task Rows */}
											{!isCollapsed &&
												section.tasks.map((task) => {
													const startDate = new Date(
														task.startPeriod,
													);
													const endDate = new Date(
														task.endPeriod,
													);
													const createdAt = new Date(
														task.createdAt,
													);

													const isOverdue =
														isPast(endDate) &&
														!isToday(endDate) &&
														task.status !==
															Status.COMPLETED &&
														task.status !==
															Status.CANCELLED;

													const isAssignedToCurrentUser =
														currentUserId &&
														task.taskMembers?.some(
															(tm) =>
																tm.member
																	?.userId ===
																	currentUserId ||
																tm.memberId ===
																	currentUserId,
														);

													const totalMilestones =
														task.milestones
															?.length || 0;
													const completedMilestones =
														task.milestones?.filter(
															(m) =>
																m.status ===
																MileStoneStatus.DONE,
														).length || 0;
													const milestonePercent =
														totalMilestones > 0
															? Math.round(
																	(completedMilestones /
																		totalMilestones) *
																		100,
															  )
															: task.status ===
															  Status.COMPLETED
															? 100
															: 0;

													const isSelected =
														selectedTaskIds.has(
															task.id,
														);

													const canEdit = checkCanEditTask(task);
													const canDelete = checkCanDeleteTask(task);

													return (
														<TableRow
															key={task.id}
															className={`border-secondary/10 ${
																isSelected
																	? "bg-secondary/10"
																	: ""
															}`}
														>
															{/* Selection Checkbox */}
															<TableCell className="px-3">
																<Checkbox
																	disabled={!canEdit}
																	checked={
																		isSelected
																	}
																	onCheckedChange={() =>
																		canEdit &&
																		toggleSelectTask(
																			task.id,
																		)
																	}
																	aria-label={`Select task ${task.title}`}
																	title={
																		!canEdit
																			? "You do not have permission to edit this task"
																			: undefined
																	}
																/>
															</TableCell>

															{/* Task Title & Side Peek Trigger */}
															<TableCell>
																<div className="flex items-center gap-2">
																	{/* Quick Complete Button */}
																	<button
																		disabled={!canEdit}
																		onClick={() =>
																			canEdit &&
																			handleInlineQuickComplete(
																				task,
																			)
																		}
																		className={`shrink-0 transition-colors p-0.5 rounded-full ${
																			task.status ===
																			Status.COMPLETED
																				? canEdit
																					? "text-emerald-500 hover:text-emerald-600 cursor-pointer"
																					: "text-emerald-500 cursor-default"
																				: canEdit
																					? "text-secondary/40 hover:text-emerald-500 cursor-pointer"
																					: "text-secondary/25 cursor-default opacity-40"
																		}`}
																		title={
																			task.status ===
																			Status.COMPLETED
																				? canEdit
																					? "Mark as Incomplete"
																					: "Task is Completed"
																				: canEdit
																					? "Mark as Completed"
																					: "You do not have permission to edit this task"
																		}
																	>
																		<CheckCircle2 className="w-4 h-4" />
																	</button>

																	<div className="flex flex-col gap-1 min-w-0">
																		<button
																			onClick={() =>
																				openTaskPeek(
																					task.id,
																				)
																			}
																			className={`font-semibold text-xs text-left truncate hover:underline hover:text-accent transition-colors flex items-center gap-1.5 ${
																				task.status ===
																				Status.COMPLETED
																					? "line-through text-secondary/60"
																					: "text-secondary"
																			}`}
																		>
																			<span className="truncate">
																				{
																					task.title
																				}
																			</span>
																		</button>

																		{isAssignedToCurrentUser && (
																			<Badge className="w-fit text-[9px] py-0 px-1.5 bg-secondary/15 text-secondary font-medium flex items-center gap-1">
																				<UserCheck className="w-2.5 h-2.5 text-accent" />
																				Assigned to me
																			</Badge>
																		)}
																	</div>
																</div>
															</TableCell>

															{/* Project Badge */}
															{visibleColumns.project && (
																<TableCell>
																	{task.project ? (
																		<Link
																			href={`/projects/${task.projectId}`}
																			className="hover:opacity-80 transition-opacity inline-block"
																		>
																			<Badge
																				variant="outline"
																				className="bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 flex items-center gap-1.5 py-0.5 px-2 text-xs font-medium w-fit truncate max-w-[160px]"
																			>
																				<Box
																					className={`w-3 h-3 shrink-0 ${
																						task.status ===
																						Status.COMPLETED
																							? "text-emerald-500"
																							: "text-accent"
																					}`}
																				/>
																				<span className="truncate">
																					{
																						task
																							.project
																							.title
																					}
																				</span>
																			</Badge>
																		</Link>
																	) : (
																		<span className="text-[11px] text-secondary/40 italic">
																			No
																			project
																		</span>
																	)}
																</TableCell>
															)}

															{/* Assignees Stack */}
															{visibleColumns.assignees && (
																<TableCell>
																	<TaskAssigneeOverview
																		taskMembers={
																			task.taskMembers
																		}
																	/>
																</TableCell>
															)}

															{/* Created At */}
															{visibleColumns.createdAt && (
																<TableCell>
																	<span className="text-xs text-secondary/70">
																		{format(
																			createdAt,
																			"MMM d, yyyy",
																		)}
																	</span>
																</TableCell>
															)}

															{/* Period & Due Date with Overdue Indicator */}
															{visibleColumns.period && (
																<TableCell>
																	{canEdit ? (
																		<Popover>
																			<PopoverTrigger
																				asChild
																			>
																				<button
																					className={`flex items-center gap-1 text-xs font-medium p-1 rounded-md hover:bg-secondary/10 transition-colors w-fit ${
																						isOverdue
																							? "text-destructive font-semibold bg-destructive/10 px-1.5"
																							: "text-secondary"
																					}`}
																				>
																					{isOverdue && (
																						<AlertCircle className="w-3 h-3 text-destructive shrink-0" />
																					)}
																					<span>
																						{format(
																							startDate,
																							"MMM d",
																						)}
																					</span>
																					<ArrowRight className="w-2.5 h-2.5 text-accent/60" />
																					<span>
																						{format(
																							endDate,
																							"MMM d",
																						)}
																					</span>
																					{isToday(
																						endDate,
																					) && (
																						<span className="text-[9px] bg-accent text-primary px-1 rounded font-bold ml-0.5">
																							Today
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
																					defaultMonth={
																						startDate
																					}
																					selected={{
																						from: startDate,
																						to: endDate,
																					}}
																					onSelect={async (
																						range,
																					) => {
																						if (
																							range?.from &&
																							range?.to
																						) {
																							setTasks(
																								(
																									prev,
																								) =>
																									prev.map(
																										(
																											t,
																										) =>
																											t.id ===
																											task.id
																												? {
																														...t,
																														startPeriod:
																															range.from!,
																														endPeriod:
																															range.to!,
																												  }
																												: t,
																									),
																							);
																							await updateTaskDetails(
																								{
																									taskId: task.id,
																									values: {
																										startPeriod:
																											range.from,
																										endPeriod:
																											range.to,
																									},
																								},
																							);
																							toast.success(
																								"Timeline updated",
																							);
																						}
																					}}
																					className="rounded-[16px] bg-primary text-secondary"
																				/>
																			</PopoverContent>
																		</Popover>
																	) : (
																		<div
																			className={`flex items-center gap-1 text-xs font-medium p-1 w-fit ${
																				isOverdue
																					? "text-destructive font-semibold bg-destructive/10 px-1.5 rounded-md"
																					: "text-secondary/70"
																			}`}
																		>
																			{isOverdue && (
																				<AlertCircle className="w-3 h-3 text-destructive shrink-0" />
																			)}
																			<span>
																				{format(
																					startDate,
																					"MMM d",
																				)}
																			</span>
																			<ArrowRight className="w-2.5 h-2.5 text-accent/60" />
																			<span>
																				{format(
																					endDate,
																					"MMM d",
																				)}
																			</span>
																			{isToday(
																				endDate,
																			) && (
																				<span className="text-[9px] bg-accent text-primary px-1 rounded font-bold ml-0.5">
																					Today
																				</span>
																			)}
																		</div>
																	)}
																</TableCell>
															)}

															{/* Interactive Priority Badge */}
															{visibleColumns.priority && (
																<TableCell>
																	{canEdit ? (
																		<DropdownMenu>
																			<DropdownMenuTrigger
																				asChild
																			>
																				<button
																					className={`${renderPriority(
																						task.priority,
																					)} text-primary px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer hover:opacity-85 transition-opacity`}
																				>
																					<span>
																						{PRIORITY_LABELS[task.priority]}
																					</span>
																					<ChevronDown className="w-2.5 h-2.5 opacity-70" />
																				</button>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[130px] rounded-[14px] shadow-lg">
																				{PRIORITY_OPTIONS.map(
																					(
																						opt,
																					) => (
																						<DropdownMenuItem
																							key={
																								opt.value
																							}
																							onClick={() =>
																								handleInlinePriorityChange(
																									task.id,
																									opt.value,
																								)
																							}
																							className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-1.5"
																						>
																							<span className="flex items-center gap-2">
																								<span
																									className={`w-2 h-2 rounded-full ${renderPriority(
																										opt.value,
																									)}`}
																								/>
																								{
																									opt.label
																								}
																							</span>
																							{task.priority ===
																								opt.value && (
																								<Check className="w-3 h-3 text-accent" />
																							)}
																						</DropdownMenuItem>
																					),
																				)}
																			</DropdownMenuContent>
																		</DropdownMenu>
																	) : (
																		<span
																			className={`${renderPriority(
																				task.priority,
																			)} text-primary px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center`}
																		>
																			{PRIORITY_LABELS[task.priority]}
																		</span>
																	)}
																</TableCell>
															)}

															{/* Interactive Status Badge */}
															{visibleColumns.status && (
																<TableCell>
																	{canEdit ? (
																		<DropdownMenu>
																			<DropdownMenuTrigger
																				asChild
																			>
																				<button
																					className={`${renderStatus(
																						task.status,
																					)} text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity`}
																				>
																					<div className="mr-0.5">
																						{task.status ===
																							Status.COMPLETED && (
																							<CircleCheck className="w-3 h-3" />
																						)}
																						{task.status ===
																							Status.CANCELLED && (
																							<CircleX className="w-3 h-3" />
																						)}
																					</div>
																					<span>
																						{STATUS_LABELS[task.status]}
																					</span>
																					<ChevronDown className="w-2.5 h-2.5 opacity-70" />
																				</button>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary min-w-[140px] rounded-[14px] shadow-lg">
																				{STATUS_OPTIONS.map(
																					(
																						opt,
																					) => (
																						<DropdownMenuItem
																							key={
																								opt.value
																							}
																							onClick={() =>
																								handleInlineStatusChange(
																									task.id,
																									opt.value,
																								)
																							}
																							className="cursor-pointer hover:bg-secondary/10 flex items-center justify-between text-xs py-1.5"
																						>
																							<span className="flex items-center gap-2">
																								<span
																									className={`w-2 h-2 rounded-full ${renderStatus(
																										opt.value,
																									)}`}
																								/>
																								{
																									opt.label
																								}
																							</span>
																							{task.status ===
																								opt.value && (
																								<Check className="w-3 h-3 text-accent" />
																							)}
																						</DropdownMenuItem>
																					),
																				)}
																			</DropdownMenuContent>
																		</DropdownMenu>
																	) : (
																		<span
																			className={`${renderStatus(
																				task.status,
																			)} text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}
																		>
																			<div className="mr-0.5">
																				{task.status ===
																					Status.COMPLETED && (
																					<CircleCheck className="w-3 h-3" />
																				)}
																				{task.status ===
																					Status.CANCELLED && (
																					<CircleX className="w-3 h-3" />
																				)}
																			</div>
																			<span>
																				{STATUS_LABELS[task.status]}
																			</span>
																		</span>
																	)}
																</TableCell>
															)}

															{/* Milestones Progress */}
															{visibleColumns.milestones && (
																<TableCell className="w-[180px]">
																	<div className="flex items-center gap-2">
																		<div className="flex-1">
																			<ProjectTaskProgress
																				value={
																					milestonePercent
																				}
																			/>
																		</div>
																		{totalMilestones >
																			0 && (
																			<span className="text-[10px] text-secondary/60 shrink-0 font-medium">
																				{
																					completedMilestones
																				}
																				/
																				{
																					totalMilestones
																				}
																			</span>
																		)}
																	</div>
																</TableCell>
															)}

															{/* Row Actions Menu */}
															<TableCell className="text-right pr-3">
																<div className="flex items-center justify-end gap-1">
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() =>
																			openTaskPeek(
																				task.id,
																			)
																		}
																		className="h-7 w-7 rounded-full text-secondary hover:bg-secondary/10"
																		title="Inspect Task"
																	>
																		<PanelRightOpen className="w-3.5 h-3.5 text-accent" />
																	</Button>
																	<DropdownMenu>
																		<DropdownMenuTrigger
																			asChild
																		>
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-7 w-7 rounded-full text-secondary hover:bg-secondary/10"
																			>
																				<MoreHorizontal className="w-3.5 h-3.5 text-accent" />
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent
																			align="end"
																			className="bg-primary border border-secondary/20 text-secondary rounded-[14px]"
																		>
																			<DropdownMenuItem asChild>
																				<Link
																					href={`/tasks/${task.id}`}
																					className="cursor-pointer text-xs flex items-center gap-2"
																				>
																					<ExternalLink className="w-3.5 h-3.5 text-accent" />
																					Open
																					Full
																					Page
																				</Link>
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={() =>
																					openTaskPeek(
																						task.id,
																					)
																				}
																				className="cursor-pointer text-xs flex items-center gap-2"
																			>
																				<PanelRightOpen className="w-3.5 h-3.5 text-accent" />
																				Inspect
																				in
																				Side
																				Panel
																			</DropdownMenuItem>
																			{canDelete && (
																				<>
																					<DropdownMenuSeparator className="bg-secondary/15" />
																					<DropdownMenuItem
																						onClick={async () => {
																							await deleteTask(
																								task.id,
																							);
																							setTasks(
																								(
																									p,
																								) =>
																									p.filter(
																										(
																											t,
																										) =>
																											t.id !==
																											task.id,
																									),
																							);
																							toast.success(
																								"Task deleted",
																							);
																						}}
																						className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
																					>
																						<Trash2 className="w-3.5 h-3.5" />
																						Delete
																						Task
																					</DropdownMenuItem>
																				</>
																			)}
																		</DropdownMenuContent>
																	</DropdownMenu>
																</div>
															</TableCell>
														</TableRow>
													);
												})}
											</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				{/* Pagination Controls */}
				<div className="p-3 border-t border-secondary/10 bg-secondary/5 flex items-center justify-between">
					<span className="text-xs text-primary font-medium">
						Showing {sortedTasks.length} of {totalItems ?? tasks.length} tasks
					</span>
					<PaginationControls
						totalItems={totalItems ?? tasks.length}
						pageSize={pageSize}
					/>
				</div>
			</div>

			{/* Floating Bottom Bulk Actions Toolbar */}
			{selectedTaskIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary border border-secondary/20 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
					<div className="flex items-center gap-2 pr-2 border-r border-secondary/20">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary text-xs font-bold">
							{selectedTaskIds.size}
						</span>
						<span className="text-xs font-semibold text-secondary">
							Selected
						</span>
					</div>

					{/* Bulk Status Update */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="rounded-full text-xs h-8 text-secondary hover:bg-secondary/10 gap-1.5"
							>
								<CircleCheck className="w-3.5 h-3.5 text-accent" />
								Set Status
								<ChevronDown className="w-3 h-3 text-accent/70" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary rounded-[14px]">
							{STATUS_OPTIONS.map((opt) => (
								<DropdownMenuItem
									key={opt.value}
									onClick={() =>
										handleBulkStatusChange(opt.value)
									}
									className="cursor-pointer text-xs flex items-center gap-2"
								>
									<span
										className={`w-2 h-2 rounded-full ${renderStatus(
											opt.value,
										)}`}
									/>
									{opt.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Bulk Priority Update */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="rounded-full text-xs h-8 text-secondary hover:bg-secondary/10 gap-1.5"
							>
								<Flag className="w-3.5 h-3.5 text-accent" />
								Set Priority
								<ChevronDown className="w-3 h-3 text-accent/70" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary rounded-[14px]">
							{PRIORITY_OPTIONS.map((opt) => (
								<DropdownMenuItem
									key={opt.value}
									onClick={() =>
										handleBulkPriorityChange(opt.value)
									}
									className="cursor-pointer text-xs flex items-center gap-2"
								>
									<span
										className={`w-2 h-2 rounded-full ${renderPriority(
											opt.value,
										)}`}
									/>
									{opt.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Bulk Delete */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setBulkDeleteDialogOpen(true)}
						className="rounded-full text-xs h-8 text-destructive hover:bg-destructive/10 gap-1.5"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Delete
					</Button>

					{/* Deselect All */}
					<button
						onClick={() => setSelectedTaskIds(new Set())}
						className="text-secondary/60 hover:text-secondary p-1 rounded-full text-xs font-medium ml-1"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Bulk Delete Confirmation Dialog */}
			<Dialog
				open={bulkDeleteDialogOpen}
				onOpenChange={setBulkDeleteDialogOpen}
			>
				<DialogContent className="bg-primary text-secondary border border-secondary/20 rounded-[20px] max-w-md">
					<DialogHeader>
						<DialogTitle className="text-destructive flex items-center gap-2">
							<Trash2 className="w-5 h-5" />
							Delete {selectedTaskIds.size} Tasks
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-sm">
							Are you sure you want to delete these{" "}
							<span className="font-semibold text-secondary">
								{selectedTaskIds.size} tasks
							</span>
							? This action cannot be undone.
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
							onClick={handleBulkDelete}
							disabled={isBulkDeleting}
							className="rounded-full gap-2"
						>
							{isBulkDeleting && (
								<Loader2 className="w-4 h-4 animate-spin" />
							)}
							Delete Selected
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Side Peek Drawer */}
			<TaskPeekSheet
				task={activePeekTask}
				open={peekOpen}
				onOpenChange={setPeekOpen}
				workspaceMembers={members}
				currentUserId={currentUserId}
				canEditTask={
					activePeekTask ? checkCanEditTask(activePeekTask) : false
				}
				canDeleteTask={
					activePeekTask ? checkCanDeleteTask(activePeekTask) : false
				}
				onTaskUpdated={(updatedPartial) => {
					setTasks((prev) =>
						prev.map((t) =>
							t.id === updatedPartial.id
								? { ...t, ...updatedPartial }
								: t,
						),
					);
				}}
				onTaskDeleted={(deletedTaskId) => {
					setTasks((prev) =>
						prev.filter((t) => t.id !== deletedTaskId),
					);
					setSelectedTaskIds((prev) => {
						const next = new Set(prev);
						next.delete(deletedTaskId);
						return next;
					});
				}}
			/>
		</div>
	);
}
