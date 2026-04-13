"use client";
import { Calendar } from "@/components/ui/calendar";
import React from "react";

export default function OverviewCalender() {
	const [date, setDate] = React.useState<Date | undefined>(new Date());
	return (
		<Calendar
			hideNavigation
			mode="single"
			selected={date}
			onSelect={setDate}
			className="rounded-[20px]  bg-primary text-secondary "
			classNames={{
				root: " w-full",
			}}
		/>
	);
}
