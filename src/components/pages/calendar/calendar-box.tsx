import React from "react";
import { getDate, isSameDay } from "date-fns";
import { DUMMY_TASK } from "@/lib/const";
import { CalendarCellContent } from "./calendar-cell-content";
import { TaskDialog } from "./task-dialog";

export const CalendarBox = ({
	date,
	isCurrentMonth,
}: {
	date: Date;
	isCurrentMonth: boolean;
}) => {
	const today = new Date();

	const isToday =
		getDate(date) === getDate(today) &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear();

	const tasksForDay = DUMMY_TASK.filter((task) => isSameDay(task.date, date));

	const visibleTasks = tasksForDay.slice(0, 3);
	const remainingTasks = tasksForDay.slice(3);
	const hasMoreTasks = remainingTasks.length > 0;

	const cell = (
		<div className="border border-primary h-[180px] px-[10px] py-[10px] w-full overflow-hidden flex flex-col justify-between">
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
						<TaskDialog tasks={tasksForDay}>
							<div className="cursor-pointer font-bold text-primary text-[13px] hover:underline">
								View {remainingTasks.length} More
							</div>
						</TaskDialog>
					</div>
					<div className="md:hidden font-bold text-primary text-[13px]">
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
				<TaskDialog tasks={tasksForDay}>{cell}</TaskDialog>
			</div>
		</>
	);
};

export default CalendarBox;
