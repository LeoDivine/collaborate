"use client";

import React from "react";
import Link from "next/link";
import { format, getDate, isSameDay } from "date-fns";
import { Plus } from "lucide-react";
import type { Tasks } from "@/lib/types";
import { CalendarCellContent } from "./calendar-cell-content";
import { TaskDialog } from "./task-dialog";

export const CalendarBox = ({
	date,
	isCurrentMonth,
	tasks = [],
	selectedProjectId,
	onTaskUpdate,
}: {
	date: Date;
	isCurrentMonth: boolean;
	tasks: Tasks[];
	selectedProjectId?: string;
	onTaskUpdate?: (task: Tasks) => void;
}) => {
	const today = new Date();

	const isToday = isSameDay(date, today);

	const visibleTasks = tasks.slice(0, 3);
	const remainingTasks = tasks.slice(3);
	const hasMoreTasks = remainingTasks.length > 0;
	const formattedDate = format(date, "yyyy-MM-dd");
	const projectQuery = selectedProjectId ? `&projectId=${selectedProjectId}` : "";

	const cell = (
		<div
			className={`border-r border-b border-primary min-h-[170px] md:min-h-[180px] p-2 w-full overflow-hidden flex flex-col justify-between transition-colors group ${
				isCurrentMonth ? "bg-background" : "bg-primary/5 opacity-70"
			}`}
		>
			<div>
				<CalendarCellContent
					date={date}
					isToday={isToday}
					isCurrentMonth={isCurrentMonth}
					tasks={visibleTasks}
					onTaskUpdate={onTaskUpdate}
				/>
				{visibleTasks.length < 3 && (
					<Link
						href={`/tasks?creating=true&startDate=${formattedDate}${projectQuery}`}
						className="block mt-2"
					>
						<div
							className={`${
								tasks.length === 0
									? "flex md:hidden md:group-hover:flex"
									: "hidden group-hover:flex"
							} items-center justify-center text-primary/40 hover:text-primary text-[11px] gap-1 py-1 rounded border border-dashed border-primary/20 hover:border-primary/50 transition-colors cursor-pointer`}
						>
							<Plus className="w-3 h-3" />
							<span>New task</span>
						</div>
					</Link>
				)}
			</div>
			{hasMoreTasks && (
				<div className="mt-1">
					<div className="hidden md:block">
						<TaskDialog tasks={remainingTasks} date={date} selectedProjectId={selectedProjectId} onTaskUpdate={onTaskUpdate}>
							<div className="cursor-pointer font-semibold text-primary text-[12px] hover:underline">
								View {remainingTasks.length} More
							</div>
						</TaskDialog>
					</div>
					<div className="md:hidden">
						<TaskDialog tasks={remainingTasks} date={date} selectedProjectId={selectedProjectId} onTaskUpdate={onTaskUpdate}>
							<button
								type="button"
								className="cursor-pointer font-semibold text-primary text-[12px] hover:underline"
							>
								+{remainingTasks.length}
							</button>
						</TaskDialog>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<div className="w-full h-full">
			<div className="hidden md:block h-full">{cell}</div>

			<div className="md:hidden h-full">
				{tasks.length > 0 ? (
					<TaskDialog tasks={tasks} date={date} selectedProjectId={selectedProjectId} onTaskUpdate={onTaskUpdate}>
						{cell}
					</TaskDialog>
				) : (
					cell
				)}
			</div>
		</div>
	);
};

export default CalendarBox;

