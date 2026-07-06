"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DAY } from "@/lib/const";
import { renderMonthByNumber } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { getDate, getMonth, getYear } from "date-fns";
import { CalendarBox } from "./calendar-box";

export default function CalendarView() {
	const today = new Date();

	const [currentMonthNumber, setCurrentMonthNumber] = useState(
		getMonth(today) + 1,
	);

	const [currentYear, setCurrentYear] = useState(getYear(today));

	const handleNextMonth = () => {
		if (currentMonthNumber === 12) {
			setCurrentMonthNumber(1);
			setCurrentYear((prev) => prev + 1);
		} else {
			setCurrentMonthNumber((prev) => prev + 1);
		}
	};

	const handlePreviousMonth = () => {
		if (currentMonthNumber === 1) {
			setCurrentMonthNumber(12);
			setCurrentYear((prev) => prev - 1);
		} else {
			setCurrentMonthNumber((prev) => prev - 1);
		}
	};

	const firstDayOfMonth = new Date(
		currentYear,
		currentMonthNumber - 1,
		1,
	).getDay();

	const daysInMonth = new Date(currentYear, currentMonthNumber, 0).getDate();

	const previousMonthDays = new Date(
		currentYear,
		currentMonthNumber - 1,
		0,
	).getDate();

	type CalendarItem = {
		date: Date;
		isCurrentMonth: boolean;
	};

	const calendarCells: CalendarItem[] = [];

	// Previous month days
	for (let i = firstDayOfMonth - 1; i >= 0; i--) {
		calendarCells.push({
			date: new Date(
				currentYear,
				currentMonthNumber - 2,
				previousMonthDays - i,
			),
			isCurrentMonth: false,
		});
	}

	// Current month days
	for (let day = 1; day <= daysInMonth; day++) {
		calendarCells.push({
			date: new Date(currentYear, currentMonthNumber - 1, day),
			isCurrentMonth: true,
		});
	}

	// Next month days
	let nextDay = 1;

	while (calendarCells.length % 7 !== 0) {
		calendarCells.push({
			date: new Date(currentYear, currentMonthNumber, nextDay++),
			isCurrentMonth: false,
		});
	}

	return (
		<div>
			{/* Header */}
			<div className=" flex justify-between">
				<div className="flex items-center gap-3">
					<Button
						className=" rounded-fu"
						onClick={handlePreviousMonth}
					>
						<ChevronLeft />
					</Button>

					<p className="text-primary font-medium">
						{renderMonthByNumber(currentMonthNumber)} {currentYear}
					</p>

					<Button onClick={handleNextMonth}>
						<ChevronRight />
					</Button>
				</div>
				<Button className=" rounded-full">
					<Plus />
					New Task
				</Button>
			</div>

			{/* Week days */}
			<div className="mt-[15px] flex">
				{DAY.map((day, index) => (
					<CalendarHeader key={index} value={day} />
				))}
			</div>

			{/* Calendar grid */}
			<div className="flex flex-wrap">
				{calendarCells.map((item) => (
					<CalendarBox
						key={item.date.toISOString()}
						date={item.date}
						isCurrentMonth={item.isCurrentMonth}
					/>
				))}
			</div>
		</div>
	);
}

export const CalendarHeader = ({ value }: { value: string }) => {
	return (
		<div className="border border-primary pb-[20px] pt-[5px] px-[10px] w-[14.28%]">
			<p className="text-[14px] md:hidden text-center  font-bold text-primary">
				{value.charAt(0)}
			</p>
			<p className="text-[14px] hidden md:inline  font-medium text-primary">
				{value}
			</p>
		</div>
	);
};
