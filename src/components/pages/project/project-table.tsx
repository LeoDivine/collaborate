"use client";

import React, { useMemo, useState } from "react";
import PaginationControls from "@/components/shared/pagination-controls";
import ProjectTaskProgress from "@/components/shared/project-task-progress";
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
import { deleteProject, updateProjectDetails } from "@/lib/services/project.services";
import type { MembersUsers, Projects } from "@/lib/types";
import { renderPriority, renderStatus } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import {
	AlertCircle,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ArrowUpDown,
	Box,
	Calendar as CalendarIcon,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleCheck,
	CircleX,
	Columns3,
	ExternalLink,
	Flag,
	Layers,
	ListFilter,
	Loader2,
	Lock,
	MoreHorizontal,
	PanelRightOpen,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Squircle,
	Trash2,
	UserCheck,
	X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PriorityLevel, Status } from "../../../../generated/prisma/enums";
import AssigneeOverview from "./assignee-overview";
import ProjectPeekSheet from "./project-peek-sheet";

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
	| "assignees"
	| "createdAt"
	| "endPeriod"
	| "priority"
	| "status"
	| "progress";

type SortDirection = "asc" | "desc" | null;

type GroupByField = "none" | "status" | "priority";

interface GroupedProjectSection {
	id: string;
	label: string;
	status?: Status;
	priority?: PriorityLevel;
	projects: Projects[];
}

interface ColumnVisibility {
	assignees: boolean;
	createdAt: boolean;
	period: boolean;
	priority: boolean;
	status: boolean;
	progress: boolean;
}

export const computeProjectProgress = (p: Projects): number => {
	const totalTasks = p.tasks?.length || 0;
	if (totalTasks > 0) {
		const totalTaskProgressSum = p.tasks.reduce((acc, t) => {
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
		return Math.round(totalTaskProgressSum / totalTasks);
	}
	return p.status === Status.COMPLETED ? 100 : 0;
};

export default function ProjectTable({
	project: initialProjects = [],
	members = [],
	workspaceId,
	currentUserId,
	currentMemberId,
	totalItems,
	pageSize = 10,
}: {
	project: Projects[];
	members?: MembersUsers[];
	workspaceId?: string;
	currentUserId?: string;
	currentMemberId?: string;
	totalItems?: number;
	pageSize?: number;
}) {
	// Local project list state for instant optimistic updates
	const [projects, setProjects] = useState<Projects[]>(initialProjects);

	// Sync local projects when parent prop changes
	useMemo(() => {
		setProjects(initialProjects);
	}, [initialProjects]);

	// Resolve current member and RBAC permissions
	const currentMember = useMemo(() => {
		return (
			members.find(
				(m) =>
					m.id === currentMemberId ||
					(currentUserId && m.userId === currentUserId),
			) || null
		);
	}, [members, currentMemberId, currentUserId]);

	const checkCanEdit = (p: Projects) => {
		if (!currentMember) return false;
		const isWorkspaceAdmin =
			currentMember.role === "OWNER" || currentMember.role === "ADMIN";
		if (isWorkspaceAdmin) return true;

		const projectMember = p.projectMembers?.find(
			(pm) =>
				pm.memberId === currentMember.id ||
				(currentUserId && pm.member?.userId === currentUserId),
		);

		const isProjectLead = projectMember?.projectRole === "PROJECT_LEAD";
		const isProjectCreator = p.createdById === currentMember.id;

		return isProjectLead || isProjectCreator;
	};

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
	const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
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
		assignees: true,
		createdAt: false,
		period: true,
		priority: true,
		status: true,
		progress: true,
	});

	// Selection & Bulk actions
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);

	// Side Peek Sheet state
	const [peekProjectId, setPeekProjectId] = useState<string | null>(null);
	const [peekOpen, setPeekOpen] = useState(false);

	const activePeekProject = useMemo(() => {
		return projects.find((p) => p.id === peekProjectId) || null;
	}, [projects, peekProjectId]);

	// Counter stats for quick filter chips
	const stats = useMemo(() => {
		let assignedToMe = 0;
		let overdue = 0;
		let highUrgent = 0;

		projects.forEach((p) => {
			if (
				currentUserId &&
				p.projectMembers?.some(
					(pm) =>
						pm.member?.userId === currentUserId ||
						pm.memberId === currentUserId ||
						pm.memberId === currentMemberId,
				)
			) {
				assignedToMe++;
			}

			const end = new Date(p.endPeriod);
			if (
				isPast(end) &&
				!isToday(end) &&
				p.status !== Status.COMPLETED &&
				p.status !== Status.CANCELLED
			) {
				overdue++;
			}

			if (
				p.priority === PriorityLevel.URGENT ||
				p.priority === PriorityLevel.HIGH
			) {
				highUrgent++;
			}
		});

		return { assignedToMe, overdue, highUrgent };
	}, [projects, currentUserId, currentMemberId]);

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

	const handleResetFilters = () => {
		setSearchQuery("");
		setSelectedPriorities([]);
		setSelectedStatuses([]);
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

	// Filtered projects computation
	const filteredProjects = useMemo(() => {
		return projects.filter((item) => {
			const query = searchQuery.trim().toLowerCase();
			const matchesSearch =
				query === "" ||
				item.title.toLowerCase().includes(query) ||
				(item.description && item.description.toLowerCase().includes(query));

			const matchesPriority =
				selectedPriorities.length === 0 ||
				selectedPriorities.includes(item.priority);

			const matchesStatus =
				selectedStatuses.length === 0 ||
				selectedStatuses.includes(item.status);

			const isAssignedToUser =
				!filterAssignedToMe ||
				item.projectMembers?.some(
					(pm) =>
						pm.member?.userId === currentUserId ||
						pm.memberId === currentUserId ||
						pm.memberId === currentMemberId,
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
				isAssignedToUser &&
				isOverdueMatch &&
				isHighUrgentMatch &&
				isCompletedFilterMatch
			);
		});
	}, [
		projects,
		searchQuery,
		selectedPriorities,
		selectedStatuses,
		filterAssignedToMe,
		filterOverdue,
		filterHighUrgent,
		hideCompleted,
		currentUserId,
		currentMemberId,
	]);

	// Sorted projects computation
	const sortedProjects = useMemo(() => {
		if (!sortField || !sortDirection) return filteredProjects;

		return [...filteredProjects].sort((a, b) => {
			let comparison = 0;

			if (sortField === "title") {
				comparison = a.title.localeCompare(b.title);
			} else if (sortField === "assignees") {
				comparison =
					(a.projectMembers?.length || 0) - (b.projectMembers?.length || 0);
			} else if (sortField === "priority") {
				comparison =
					PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
			} else if (sortField === "status") {
				comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
			} else if (sortField === "createdAt") {
				comparison =
					new Date(a.createdAt).getTime() -
					new Date(b.createdAt).getTime();
			} else if (sortField === "endPeriod") {
				comparison =
					new Date(a.endPeriod).getTime() -
					new Date(b.endPeriod).getTime();
			} else if (sortField === "progress") {
				comparison = computeProjectProgress(a) - computeProjectProgress(b);
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [filteredProjects, sortField, sortDirection]);

	// Grouped projects computation
	const groupedProjectSections = useMemo((): GroupedProjectSection[] => {
		if (groupBy === "none") {
			return [{ id: "all", label: "All Projects", projects: sortedProjects }];
		}

		if (groupBy === "status") {
			const groups: Record<Status, Projects[]> = {
				[Status.TODO]: [],
				[Status.IN_PROGRESS]: [],
				[Status.ON_HOLD]: [],
				[Status.COMPLETED]: [],
				[Status.CANCELLED]: [],
			};
			sortedProjects.forEach((p) => {
				if (groups[p.status]) groups[p.status].push(p);
			});
			return Object.entries(groups)
				.filter(([_, groupProjects]) => groupProjects.length > 0)
				.map(([status, groupProjects]) => ({
					id: status,
					label: STATUS_LABELS[status as Status],
					status: status as Status,
					projects: groupProjects,
				}));
		}

		if (groupBy === "priority") {
			const groups: Record<PriorityLevel, Projects[]> = {
				[PriorityLevel.URGENT]: [],
				[PriorityLevel.HIGH]: [],
				[PriorityLevel.MEDIUM]: [],
				[PriorityLevel.LOW]: [],
				[PriorityLevel.NO_PRIORITY]: [],
			};
			sortedProjects.forEach((p) => {
				if (groups[p.priority]) groups[p.priority].push(p);
			});
			return Object.entries(groups)
				.filter(([_, groupProjects]) => groupProjects.length > 0)
				.map(([priority, groupProjects]) => ({
					id: priority,
					label: PRIORITY_LABELS[priority as PriorityLevel],
					priority: priority as PriorityLevel,
					projects: groupProjects,
				}));
		}

		return [{ id: "all", label: "All Projects", projects: sortedProjects }];
	}, [sortedProjects, groupBy]);

	const selectableProjects = useMemo(() => {
		return sortedProjects.filter((p) => checkCanEdit(p));
	}, [sortedProjects, currentMember]);

	// Selection handlers
	const toggleSelectProject = (projectId: string) => {
		const targetProj = projects.find((p) => p.id === projectId);
		if (targetProj && !checkCanEdit(targetProj)) {
			toast.error("You do not have permission to edit this project");
			return;
		}

		setSelectedProjectIds((prev) => {
			const next = new Set(prev);
			if (next.has(projectId)) {
				next.delete(projectId);
			} else {
				next.add(projectId);
			}
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (selectableProjects.length === 0) {
			toast.info("No projects you have permission to edit in this view");
			return;
		}

		const allSelectableSelected = selectableProjects.every((p) =>
			selectedProjectIds.has(p.id),
		);

		if (allSelectableSelected) {
			setSelectedProjectIds(new Set());
		} else {
			setSelectedProjectIds(new Set(selectableProjects.map((p) => p.id)));
		}
	};

	// Inline updates
	const handleInlineStatusChange = async (projectId: string, newStatus: Status) => {
		// Optimistic update
		setProjects((prev) =>
			prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)),
		);

		try {
			const res = await updateProjectDetails({
				projectId,
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
		projectId: string,
		newPriority: PriorityLevel,
	) => {
		// Optimistic update
		setProjects((prev) =>
			prev.map((p) =>
				p.id === projectId ? { ...p, priority: newPriority } : p,
			),
		);

		try {
			const res = await updateProjectDetails({
				projectId,
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

	const handleInlineQuickComplete = async (p: Projects) => {
		const newStatus =
			p.status === Status.COMPLETED ? Status.TODO : Status.COMPLETED;
		await handleInlineStatusChange(p.id, newStatus);
	};

	// Bulk operations
	const handleBulkStatusChange = async (newStatus: Status) => {
		const projectIds = Array.from(selectedProjectIds);
		if (projectIds.length === 0) return;

		const editableProjectIds = projectIds.filter((id) => {
			const p = projects.find((proj) => proj.id === id);
			return p ? checkCanEdit(p) : false;
		});

		if (editableProjectIds.length === 0) {
			toast.error("You do not have permission to update the selected projects");
			return;
		}

		setProjects((prev) =>
			prev.map((p) =>
				editableProjectIds.includes(p.id) ? { ...p, status: newStatus } : p,
			),
		);
		setSelectedProjectIds(new Set());

		toast.promise(
			Promise.all(
				editableProjectIds.map((projectId) =>
					updateProjectDetails({
						projectId,
						values: { status: newStatus },
					}),
				),
			),
			{
				loading: `Updating ${editableProjectIds.length} projects...`,
				success: `Updated ${editableProjectIds.length} projects to ${STATUS_LABELS[newStatus]}`,
				error: "Failed to update some projects",
			},
		);
	};

	const handleBulkPriorityChange = async (newPriority: PriorityLevel) => {
		const projectIds = Array.from(selectedProjectIds);
		if (projectIds.length === 0) return;

		const editableProjectIds = projectIds.filter((id) => {
			const p = projects.find((proj) => proj.id === id);
			return p ? checkCanEdit(p) : false;
		});

		if (editableProjectIds.length === 0) {
			toast.error("You do not have permission to update the selected projects");
			return;
		}

		setProjects((prev) =>
			prev.map((p) =>
				editableProjectIds.includes(p.id) ? { ...p, priority: newPriority } : p,
			),
		);
		setSelectedProjectIds(new Set());

		toast.promise(
			Promise.all(
				editableProjectIds.map((projectId) =>
					updateProjectDetails({
						projectId,
						values: { priority: newPriority },
					}),
				),
			),
			{
				loading: `Updating ${editableProjectIds.length} projects...`,
				success: `Updated ${editableProjectIds.length} projects to ${PRIORITY_LABELS[newPriority]}`,
				error: "Failed to update some projects",
			},
		);
	};

	const handleBulkDelete = async () => {
		const projectIds = Array.from(selectedProjectIds);
		if (projectIds.length === 0) return;

		const editableProjectIds = projectIds.filter((id) => {
			const p = projects.find((proj) => proj.id === id);
			return p ? checkCanEdit(p) : false;
		});

		if (editableProjectIds.length === 0) {
			toast.error("You do not have permission to delete the selected projects");
			setBulkDeleteDialogOpen(false);
			return;
		}

		setIsBulkDeleting(true);
		try {
			await Promise.all(editableProjectIds.map((id) => deleteProject(id)));
			setProjects((prev) => prev.filter((p) => !editableProjectIds.includes(p.id)));
			setSelectedProjectIds(new Set());
			setBulkDeleteDialogOpen(false);
			toast.success(`Deleted ${editableProjectIds.length} projects`);
		} catch {
			toast.error("Failed to delete some projects");
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
	const openProjectPeek = (projectId: string) => {
		setPeekProjectId(projectId);
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
								placeholder="Search projects, descriptions..."
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
							<UserCheck
								className={`w-3.5 h-3.5 mr-1.5 ${
									filterAssignedToMe ? "text-primary" : "text-accent"
								}`}
							/>
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
								<AlertCircle
									className={`w-3.5 h-3.5 mr-1.5 ${
										filterOverdue ? "text-primary" : "text-destructive"
									}`}
								/>
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
								<Flag
									className={`w-3.5 h-3.5 mr-1.5 ${
										filterHighUrgent ? "text-primary" : "text-destructive"
									}`}
								/>
								High Priority
								<span className="ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full bg-destructive text-primary text-[10px] font-bold">
									{stats.highUrgent}
								</span>
							</button>
						)}
					</div>

					{/* Right Controls: Group By, Filter, Columns, Reset */}
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
									Group Projects By
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
										hideCompleted
											? "border-accent text-accent font-semibold"
											: ""
									}`}
								>
									<SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
									Filter
									{(selectedPriorities.length > 0 ||
										selectedStatuses.length > 0 ||
										hideCompleted) && (
										<span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-primary text-[10px] font-bold">
											{selectedPriorities.length +
												selectedStatuses.length +
												(hideCompleted ? 1 : 0)}
										</span>
									)}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[240px] rounded-[14px] max-h-[440px] overflow-y-auto custom-scrollbar shadow-2xl p-2">
								{/* Quick Hide Completed Toggle */}
								<div className="px-2 py-1.5">
									<label className="flex items-center justify-between cursor-pointer select-none text-xs font-medium text-secondary">
										<span>Hide Completed Projects</span>
										<Checkbox
											checked={hideCompleted}
											onCheckedChange={() =>
												setHideCompleted((p) => !p)
											}
										/>
									</label>
								</div>

								<DropdownMenuSeparator className="bg-secondary/15" />

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
												onClick={(e) => e.stopPropagation()}
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
												onClick={(e) => e.stopPropagation()}
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
									checked={visibleColumns.progress}
									onCheckedChange={(v) =>
										setVisibleColumns((p) => ({
											...p,
											progress: !!v,
										}))
									}
									className="text-xs cursor-pointer"
								>
									Progress
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
							Showing {sortedProjects.length} of {projects.length} projects
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
					</div>
				)}
			</div>

			{/* Main Table Container */}
			<div className="relative rounded-[20px] border border-secondary/15 bg-primary/40 backdrop-blur-sm overflow-hidden shadow-sm">
				{sortedProjects.length === 0 ? (
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
								? "No matching projects found"
								: "No projects available"}
						</h3>
						<p className="text-xs text-secondary/60 max-w-sm mt-1">
							{isFilterActive
								? "None of the projects match your active filters or search term. Try resetting your filters."
								: "No projects have been created in this workspace yet. Get started by clicking New Project."}
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
											disabled={selectableProjects.length === 0}
											checked={
												selectableProjects.length > 0 &&
												selectedProjectIds.size > 0 &&
												selectableProjects.every((p) =>
													selectedProjectIds.has(p.id),
												)
													? true
													: selectedProjectIds.size > 0
													? "indeterminate"
													: false
											}
											onCheckedChange={toggleSelectAll}
											aria-label="Select all editable projects"
										/>
									</TableHead>

									{/* Project Title Header (Sortable) */}
									<TableHead
										onClick={() => handleColumnSort("title")}
										className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
									>
										<div className="flex items-center gap-1.5">
											<span>Project Title</span>
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

									{/* Assignees Header (Sortable) */}
									{visibleColumns.assignees && (
										<TableHead
											onClick={() => handleColumnSort("assignees")}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors"
										>
											<div className="flex items-center gap-1.5">
												<span>Assignees</span>
												{sortField === "assignees" ? (
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

									{/* Progress Header (Sortable) */}
									{visibleColumns.progress && (
										<TableHead
											onClick={() =>
												handleColumnSort("progress")
											}
											className="cursor-pointer select-none text-xs font-bold text-secondary hover:text-accent transition-colors w-[220px]"
										>
											<div className="flex items-center gap-1.5">
												<span>Progress</span>
												{sortField === "progress" ? (
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
								{groupedProjectSections.map((section) => {
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
																	section.projects
																		.length
																}
															</span>
														</div>
													</td>
												</tr>
											)}

											{/* Project Rows */}
											{!isCollapsed &&
												section.projects.map((proj) => {
													const startDate = new Date(
														proj.startPeriod,
													);
													const endDate = new Date(
														proj.endPeriod,
													);
													const createdAt = new Date(
														proj.createdAt,
													);

													const isOverdue =
														isPast(endDate) &&
														!isToday(endDate) &&
														proj.status !==
															Status.COMPLETED &&
														proj.status !==
															Status.CANCELLED;

													const isAssignedToCurrentUser =
														currentUserId &&
														proj.projectMembers?.some(
															(pm) =>
																pm.member
																	?.userId ===
																	currentUserId ||
																pm.memberId ===
																	currentUserId ||
																pm.memberId ===
																	currentMemberId,
														);

													const progressPercent =
														computeProjectProgress(
															proj,
														);
													const totalTasks =
														proj.tasks?.length || 0;
													const completedTasks =
														proj.tasks?.filter(
															(t) =>
																t.status ===
																Status.COMPLETED,
														).length || 0;

													const isSelected =
														selectedProjectIds.has(
															proj.id,
														);

													const canEdit = checkCanEdit(proj);

													return (
														<TableRow
															key={proj.id}
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
																		toggleSelectProject(
																			proj.id,
																		)
																	}
																	aria-label={`Select project ${proj.title}`}
																	title={
																		!canEdit
																			? "You do not have permission to edit this project"
																			: undefined
																	}
																/>
															</TableCell>

															{/* Project Title & Side Peek Trigger */}
															<TableCell>
																<div className="flex items-center gap-2">
																	{/* Quick Complete Button */}
																	<button
																		disabled={!canEdit}
																		onClick={() =>
																			canEdit &&
																			handleInlineQuickComplete(
																				proj,
																			)
																		}
																		className={`shrink-0 transition-colors p-0.5 rounded-full ${
																			proj.status ===
																			Status.COMPLETED
																				? canEdit
																					? "text-emerald-500 hover:text-emerald-600 cursor-pointer"
																					: "text-emerald-500 cursor-default"
																				: canEdit
																					? "text-secondary/40 hover:text-emerald-500 cursor-pointer"
																					: "text-secondary/25 cursor-default opacity-40"
																		}`}
																		title={
																			proj.status ===
																			Status.COMPLETED
																				? canEdit
																					? "Mark as Incomplete"
																					: "Project is Completed"
																				: canEdit
																					? "Mark as Completed"
																					: "You do not have permission to edit this project"
																		}
																	>
																		<CheckCircle2 className="w-4 h-4" />
																	</button>

																	<div className="flex flex-col gap-1 min-w-0">
																		<button
																			onClick={() =>
																				openProjectPeek(
																					proj.id,
																				)
																			}
																			className={`font-semibold text-xs text-left truncate hover:underline hover:text-accent transition-colors flex items-center gap-1.5 ${
																				proj.status ===
																				Status.COMPLETED
																					? "line-through text-secondary/60"
																					: "text-secondary"
																			}`}
																		>
																			<span className="truncate">
																				{
																					proj.title
																				}
																			</span>
																		</button>

																		{(proj as any).visibility === "PRIVATE" && (
																			<Badge className="w-fit text-[9px] py-0 px-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 border-0">
																				<Lock className="w-2.5 h-2.5" />
																				Private
																			</Badge>
																		)}

																		{isAssignedToCurrentUser && (
																			<Badge className="w-fit text-[9px] py-0 px-1.5 bg-secondary/15 text-secondary font-medium flex items-center gap-1">
																				<UserCheck className="w-2.5 h-2.5 text-accent" />
																				Assigned to me
																			</Badge>
																		)}
																	</div>
																</div>
															</TableCell>

															{/* Assignees Stack */}
															{visibleColumns.assignees && (
																<TableCell>
																	<AssigneeOverview
																		projectMembers={
																			proj.projectMembers
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
																							setProjects(
																								(
																									prev,
																								) =>
																									prev.map(
																										(
																											p,
																										) =>
																											p.id ===
																											proj.id
																												? {
																														...p,
																														startPeriod:
																															range.from!,
																														endPeriod:
																															range.to!,
																												  }
																												: p,
																									),
																							);
																							await updateProjectDetails(
																								{
																									projectId:
																										proj.id,
																									values: {
																										startDate:
																											range.from,
																										dueDate:
																											range.to,
																									},
																								},
																							);
																							toast.success(
																								"Project timeline updated",
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
																						proj.priority,
																					)} text-primary px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer hover:opacity-85 transition-opacity`}
																				>
																					<span>
																						{
																							PRIORITY_LABELS[
																								proj
																									.priority
																							]
																						}
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
																									proj.id,
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
																							{proj.priority ===
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
																				proj.priority,
																			)} text-primary px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center`}
																		>
																			{
																				PRIORITY_LABELS[
																					proj
																						.priority
																				]
																			}
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
																						proj.status,
																					)} text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity`}
																				>
																					<div className="mr-0.5">
																						{proj.status ===
																							Status.COMPLETED && (
																							<CircleCheck className="w-3 h-3" />
																						)}
																						{proj.status ===
																							Status.CANCELLED && (
																							<CircleX className="w-3 h-3" />
																						)}
																					</div>
																					<span>
																						{
																							STATUS_LABELS[
																								proj
																									.status
																							]
																						}
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
																									proj.id,
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
																							{proj.status ===
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
																				proj.status,
																			)} text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}
																		>
																			<div className="mr-0.5">
																				{proj.status ===
																					Status.COMPLETED && (
																					<CircleCheck className="w-3 h-3" />
																				)}
																				{proj.status ===
																					Status.CANCELLED && (
																					<CircleX className="w-3 h-3" />
																				)}
																			</div>
																			<span>
																				{
																					STATUS_LABELS[
																						proj
																							.status
																					]
																				}
																			</span>
																		</span>
																	)}
																</TableCell>
															)}

															{/* Progress Bar */}
															{visibleColumns.progress && (
																<TableCell className="w-[220px]">
																	<div className="flex items-center gap-2">
																		<div className="flex-1">
																			<ProjectTaskProgress
																				value={
																					progressPercent
																				}
																			/>
																		</div>
																		<span className="text-[10px] text-secondary/60 shrink-0 font-medium">
																			{completedTasks}/{totalTasks}
																		</span>
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
																			openProjectPeek(
																				proj.id,
																			)
																		}
																		className="h-7 w-7 rounded-full text-secondary hover:bg-secondary/10"
																		title="Inspect Project"
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
																					href={`/projects/${proj.id}`}
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
																					openProjectPeek(
																						proj.id,
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
																			{canEdit && (
																				<>
																					<DropdownMenuSeparator className="bg-secondary/15" />
																					<DropdownMenuItem
																						onClick={async () => {
																							const res = await deleteProject(
																								proj.id,
																							);
																							if (!res.success) {
																								toast.error(
																									res.message ||
																										"Failed to delete project",
																								);
																							} else {
																								setProjects(
																									(
																										p,
																									) =>
																										p.filter(
																											(
																												item,
																											) =>
																												item.id !==
																												proj.id,
																										),
																								);
																								toast.success(
																									"Project deleted",
																								);
																							}
																						}}
																						className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
																					>
																						<Trash2 className="w-3.5 h-3.5" />
																						Delete
																						Project
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
						Showing {sortedProjects.length} of {totalItems ?? projects.length} projects
					</span>
					<PaginationControls
						totalItems={totalItems ?? projects.length}
						pageSize={pageSize}
					/>
				</div>
			</div>

			{/* Floating Bottom Bulk Actions Toolbar */}
			{selectedProjectIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary border border-secondary/20 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
					<div className="flex items-center gap-2 pr-2 border-r border-secondary/20">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary text-xs font-bold">
							{selectedProjectIds.size}
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
						onClick={() => setSelectedProjectIds(new Set())}
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
							Delete {selectedProjectIds.size} Projects
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-sm">
							Are you sure you want to delete these{" "}
							<span className="font-semibold text-secondary">
								{selectedProjectIds.size} projects
							</span>
							? All associated tasks, milestones, comments, and resources will be
							permanently deleted. This action cannot be undone.
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
			<ProjectPeekSheet
				project={activePeekProject}
				open={peekOpen}
				onOpenChange={setPeekOpen}
				workspaceMembers={members}
				currentUserId={currentUserId}
				canEditProject={
					activePeekProject ? checkCanEdit(activePeekProject) : false
				}
				onProjectUpdated={(updatedPartial) => {
					setProjects((prev) =>
						prev.map((p) =>
							p.id === updatedPartial.id
								? { ...p, ...updatedPartial }
								: p,
						),
					);
				}}
				onProjectDeleted={(deletedProjectId) => {
					setProjects((prev) =>
						prev.filter((p) => p.id !== deletedProjectId),
					);
					setSelectedProjectIds((prev) => {
						const next = new Set(prev);
						next.delete(deletedProjectId);
						return next;
					});
				}}
			/>
		</div>
	);
}
