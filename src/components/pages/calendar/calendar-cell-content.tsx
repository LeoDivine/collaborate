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
};

export function CalendarCellContent({
	date,
	isToday,
	isCurrentMonth,
	tasks,
}: CalendarCellContentProps) {
	return (
		<>
			<div
				className={`flex items-center justify-center w-8 h-8 rounded-full ${
					isToday ? "bg-primary font-bold" : ""
				}`}
			>
				<p
					className={
						isToday
							? "text-secondary font-bold"
							: isCurrentMonth
							? "text-primary font-medium"
							: "text-primary/50"
					}
				>
					{getDate(date)}
				</p>
			</div>

			<div className="mt-2 space-y-1.5 overflow-hidden">
				{tasks.slice(0, 3).map((task) => (
					<TaskProject
						key={task.id}
						task={task}
						cellDate={date}
					/>
				))}
			</div>
		</>
	);
}

export default CalendarCellContent;

