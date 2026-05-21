"use client";

import { Input } from "@/components/ui/input";
import { MembersUsers, ProjectWithMembers } from "@/lib/types";
import {
	Clock,
	GanttChartSquare,
	LayoutGrid,
	List,
	Table2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JSX, useEffect, useState } from "react";
import ProjectGanttView from "./project-gantt-view";
import ProjectKanbanView from "./project-kanban-view";
import ProjectListView from "./project-list-view";
import ProjectTableView from "./project-table-view";
import ProjectTimelineView from "./project-timeline-view";
import ProjectViewHeader from "./project-view-header";
import ProjectViewModes, { ProjectViewMode } from "./project-view-modes";

const VIEW_MODE_STORAGE_KEY = "projectViewMode";
const VIEW_MODES: ProjectViewMode[] = [
	"list",
	"kanban",
	"table",
	"timeline",
	"gantt",
];
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "2-digit",
	timeZone: "UTC",
});

export default function ProjectView({
	isCreating,
	members,
	workspaceId,
	initialTotal,
	projects,
	projectsTotal,
}: {
	isCreating: string;
	members: MembersUsers[];
	workspaceId: string;
	initialTotal: number;
	projects: ProjectWithMembers[];
	projectsTotal: number;
}) {
	const searchParams = useSearchParams();
	const creating = searchParams.get("creating") || isCreating;

	const [open, setOpen] = useState(creating === "false" ? false : true);
	const [viewMode, setViewMode] = useState<ProjectViewMode>("list");

	useEffect(() => {
		if (creating === "false") {
			setOpen(false);
		} else if (creating === "true") {
			setOpen(true);
		}
	}, [creating]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const storedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
		if (storedMode && VIEW_MODES.includes(storedMode as ProjectViewMode)) {
			setViewMode(storedMode as ProjectViewMode);
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
	}, [viewMode]);

	const router = useRouter();
	const pathname = usePathname();

	const statusLabels: Record<string, string> = {
		TODO: "To Do",
		IN_PROGRESS: "In Progress",
		ON_HOLD: "On Hold",
		COMPLETED: "Completed",
		CANCELLED: "Cancelled",
	};

	const modeIcons: Record<ProjectViewMode, JSX.Element> = {
		list: <List className=" h-4 w-4" />,
		kanban: <LayoutGrid className=" h-4 w-4" />,
		table: <Table2 className=" h-4 w-4" />,
		timeline: <Clock className=" h-4 w-4" />,
		gantt: <GanttChartSquare className=" h-4 w-4" />,
	};

	const getTaskProgress = (project: ProjectWithMembers) => {
		const totalTasks = project.tasks.length;
		if (totalTasks === 0) return 0;
		const completedTasks = project.tasks.filter(
			(task) => task.status === "COMPLETED",
		).length;
		return Math.round((completedTasks / totalTasks) * 100);
	};

	const formatDate = (value: Date | string | null) => {
		if (!value) return "N/A";
		return DATE_FORMATTER.format(new Date(value));
	};

	const toDate = (value: Date | string) => new Date(value);

	const sortedByStart = [...projects].sort((a, b) => {
		return (
			toDate(a.startPeriod).getTime() - toDate(b.startPeriod).getTime()
		);
	});

	const minStart =
		sortedByStart.length > 0 ?
			toDate(sortedByStart[0].startPeriod).getTime()
		:	0;
	const maxEnd =
		sortedByStart.length > 0 ?
			Math.max(
				...sortedByStart.map((project) =>
					toDate(project.endPeriod).getTime(),
				),
			)
		:	0;
	const totalRange = maxEnd - minStart || 1;

	const getBarStyle = (project: ProjectWithMembers) => {
		const start = toDate(project.startPeriod).getTime();
		const end = toDate(project.endPeriod).getTime();
		const left = ((start - minStart) / totalRange) * 100;
		const width = ((end - start) / totalRange) * 100;
		return {
			left: `${left}%`,
			width: `${Math.max(width, 2)}%`,
		};
	};

	const handleOpenDialog = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("creating", "true");
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleDialogChange = (nextOpen: boolean) => {
		setOpen(nextOpen);

		if (!nextOpen) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("creating");
			const nextQuery = params.toString();

			router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
		}
	};

	return (
		<div>
			<ProjectViewHeader
				projectsTotal={projectsTotal}
				open={open}
				members={members}
				workspaceId={workspaceId}
				initialTotal={initialTotal}
				onOpenDialog={handleOpenDialog}
				onDialogChange={handleDialogChange}
			/>

			<div className=" mt-[20px] flex gap-4 flex-col">
				<ProjectViewModes
					modes={VIEW_MODES}
					viewMode={viewMode}
					modeIcons={modeIcons}
					onModeChange={setViewMode}
				/>
				<Input
					className=" bg-primary rounded-[15px] border-0"
					placeholder="Search with project name...."
				/>
				{viewMode === "list" && (
					<ProjectListView
						projects={projects}
						getTaskProgress={getTaskProgress}
						formatDate={formatDate}
					/>
				)}
				{viewMode === "kanban" && (
					<ProjectKanbanView
						projects={projects}
						statusLabels={statusLabels}
						getTaskProgress={getTaskProgress}
						formatDate={formatDate}
					/>
				)}
				{viewMode === "table" && (
					<ProjectTableView
						projects={projects}
						getTaskProgress={getTaskProgress}
						formatDate={formatDate}
					/>
				)}
				{viewMode === "timeline" && (
					<ProjectTimelineView
						projects={sortedByStart}
						formatDate={formatDate}
					/>
				)}
				{viewMode === "gantt" && (
					<ProjectGanttView
						projects={sortedByStart}
						formatDate={formatDate}
						getBarStyle={getBarStyle}
					/>
				)}
			</div>
		</div>
	);
}
