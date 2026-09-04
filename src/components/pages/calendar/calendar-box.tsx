"use client";

import React from "react";
import { getDate, isSameDay } from "date-fns";
import type { Tasks } from "@/lib/types";
import { CalendarCellContent } from "./calendar-cell-content";
import { TaskDialog } from "./task-dialog";

export const CalendarBox = ({
	date,
	isCurrentMonth,
	tasks = [],
}: {
	date: Date;
	isCurrentMonth: boolean;
	tasks: Tasks[];
}) => {
	const today = new Date();

	const isToday = isSameDay(date, today);

	const visibleTasks = tasks.slice(0, 3);
	const remainingTasks = tasks.slice(3);
	const hasMoreTasks = remainingTasks.length > 0;

	const cell = (
		<div
			className={`border border-primary h-[170px] md:h-[180px] px-[8px] py-[8px] w-full overflow-hidden flex flex-col justify-between transition-colors ${
				isCurrentMonth ? "bg-background" : "bg-primary/5 opacity-70"
			}`}
		>
			<div>
				<CalendarCellContent
					date={date}
					isToday={isToday}
					isCurrentMonth={isCurrentMonth}
					tasks={visibleTasks}
				/>
			</div>
			{hasMoreTasks && (
				<div className="mt-1">
					<div className="hidden md:block">
						<TaskDialog tasks={tasks}>
							<div className="cursor-pointer font-semibold text-primary text-[12px] hover:underline">
								View {remainingTasks.length} More
							</div>
						</TaskDialog>
					</div>
					<div className="md:hidden font-semibold text-primary text-[12px]">
						+{remainingTasks.length}
					</div>
				</div>
			)}
		</div>
	);

	return (
		<>
			<div className="hidden md:block w-[14.28%]">{cell}</div>

			<div className="md:hidden w-[14.28%]">
				{tasks.length > 0 ? (
					<TaskDialog tasks={tasks}>{cell}</TaskDialog>
				) : (
					cell
				)}
			</div>
		</>
	);
};

export default CalendarBox;

