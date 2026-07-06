import React from "react";
import { getDate } from "date-fns";
import TaskProject from "./task-project";
import { DUMMY_TASK } from "@/lib/const";

type CalendarCellContentProps = {
	date: Date;
	isToday: boolean;
	isCurrentMonth: boolean;
	tasks: typeof DUMMY_TASK;
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
					isToday ? "bg-primary text-white" : ""
				}`}
			>
				<p
					className={
						isCurrentMonth && !isToday
							? "text-primary"
							: "text-muted-foreground"
					}
				>
					{getDate(date)}
				</p>
			</div>

			<div className="mt-2 space-y-2">
				{tasks.slice(0, 3).map((task) => (
					<TaskProject
						key={task.id}
						{...task}
					/>
				))}
			</div>
		</>
	);
}

export default CalendarCellContent;
