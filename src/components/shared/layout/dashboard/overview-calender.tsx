"use client";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, isSameDay, isSameMonth, startOfDay } from "date-fns";
import { ArrowUpRight, CalendarDays, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

export interface OverviewDeadline {
	id: string;
	title: string;
	description: string;
	endPeriod: Date;
	completedMilestonesCount: number;
	totalMilestonesCount: number;
}

interface OverviewCalenderProps {
	deadlines?: OverviewDeadline[];
}

export default function OverviewCalender({
	deadlines = [],
}: OverviewCalenderProps) {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date());

	const todayStart = useMemo(() => startOfDay(new Date()), []);

	const { upcomingDates, overdueDates } = useMemo(() => {
		const upcoming: Date[] = [];
		const overdue: Date[] = [];

		for (const item of deadlines) {
			const dueDate = new Date(item.endPeriod);
			if (Number.isNaN(dueDate.getTime())) continue;
			if (isBefore(startOfDay(dueDate), todayStart)) {
				overdue.push(dueDate);
			} else {
				upcoming.push(dueDate);
			}
		}

		return { upcomingDates: upcoming, overdueDates: overdue };
	}, [deadlines, todayStart]);

	const selectedDayDeadlines = useMemo(() => {
		if (!selectedDate) return [];
		return deadlines.filter((item) =>
			isSameDay(new Date(item.endPeriod), selectedDate),
		);
	}, [deadlines, selectedDate]);

	const monthDeadlinesCount = useMemo(
		() =>
			deadlines.filter((item) =>
				isSameMonth(new Date(item.endPeriod), displayMonth),
			).length,
		[deadlines, displayMonth],
	);

	const calendarHref = `/calendar?month=${displayMonth.getMonth() + 1}&year=${displayMonth.getFullYear()}`;

	const handleSelect = (date: Date | undefined) => {
		if (date && selectedDate && isSameDay(date, selectedDate)) {
			setSelectedDate(undefined);
			return;
		}
		setSelectedDate(date);
	};

	return (
		<div className="rounded-[20px] bg-primary text-secondary overflow-hidden">
			<Calendar
				mode="single"
				month={displayMonth}
				onMonthChange={setDisplayMonth}
				selected={selectedDate}
				onSelect={handleSelect}
				modifiers={{
					hasDeadline: upcomingDates,
					hasOverdue: overdueDates,
				}}
				modifiersClassNames={{
					hasDeadline:
						"relative after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-amber-400",
					hasOverdue:
						"relative after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-red-400",
				}}
				className="p-4 pb-2 w-full"
			/>

			{selectedDate && (
				<div className="mx-4 mb-3 rounded-xl bg-secondary/10 px-3 py-2.5 text-secondary">
					<div className="flex items-center justify-between gap-2">
						<p className="text-[12px] font-semibold">
							{format(selectedDate, "EEE, MMM d")}
						</p>
						<button
							type="button"
							onClick={() => setSelectedDate(undefined)}
							aria-label="Clear selected date"
							className="rounded p-0.5 text-secondary/70 hover:bg-secondary/20 hover:text-secondary cursor-pointer transition-colors"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>

					{selectedDayDeadlines.length > 0 ? (
						<ul className="mt-2 space-y-1.5">
							{selectedDayDeadlines.map((task) => (
								<li key={task.id}>
									<Link
										href={`/tasks/${task.id}`}
										className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px] bg-secondary/10 hover:bg-secondary/20 transition-colors"
									>
										<span className="truncate font-medium group-hover:underline">
											{task.title}
										</span>
										{task.totalMilestonesCount > 0 && (
											<span className="shrink-0 flex items-center gap-1 text-[11px] text-secondary/75">
												<CheckCircle2 className="w-3 h-3" />
												{task.completedMilestonesCount}/
												{task.totalMilestonesCount}
											</span>
										)}
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-1.5 text-[11px] text-secondary/70">
							No deadlines due on this date.
						</p>
					)}
				</div>
			)}

			<div className="flex items-center justify-between border-t border-secondary/15 px-4 py-2.5 text-[12px]">
				<span className="text-secondary/75 flex items-center gap-1.5">
					<CalendarDays className="w-3.5 h-3.5 shrink-0" />
					{monthDeadlinesCount === 0
						? `No deadlines in ${format(displayMonth, "MMM")}`
						: `${monthDeadlinesCount} ${monthDeadlinesCount === 1 ? "deadline" : "deadlines"} in ${format(displayMonth, "MMM")}`}
				</span>
				<Link
					href={calendarHref}
					className="inline-flex items-center gap-0.5 font-semibold text-secondary hover:underline"
				>
					Full calendar
					<ArrowUpRight className="w-3.5 h-3.5" />
				</Link>
			</div>
		</div>
	);
}
