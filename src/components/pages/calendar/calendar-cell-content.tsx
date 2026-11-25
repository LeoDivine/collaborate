"use client";

import React from "react";
import { getDate } from "date-fns";
import TaskProject from "./task-project";
import type { Tasks } from "@/lib/types";

type CalendarCellContentProps = {
	date: Date;
	isToday: boolean;
	isCurrentMonth: boolean;
	tasks: Tasks[];
	onTaskUpdate?: (task: Tasks) => void;
};

export function CalendarCellContent({
	date,
	isToday,
	isCurrentMonth,
	tasks,
	onTaskUpdate,
}: CalendarCellContentProps) {
	return (
		<>
			<div
				className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
					isToday ? "bg-primary font-bold shadow-xs" : ""
				}`}
			>
				<p
					className={`text-xs ${
						isToday
							? "text-secondary font-bold"
							: isCurrentMonth
							? "text-primary font-medium"
							: "text-primary/40"
					}`}
				>
					{getDate(date)}
				</p>
			</div>

			<div className="mt-2 space-y-1.5 overflow-hidden">
				{tasks.map((task) => (
					<TaskProject
						key={task.id}
						task={task}
						cellDate={date}
						onTaskUpdate={onTaskUpdate}
					/>
				))}
			</div>
		</>
	);
}

export default CalendarCellContent;

