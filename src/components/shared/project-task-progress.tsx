import { Progress } from "@/components/ui/progress";
import React from "react";

export default function ProjectTaskProgress() {
	return (
		<div className=" flex gap-1 items-center">
			<Progress
				indicatorClassName="bg-accent rounded-full"
				className=" bg-secondary"
				value={33}
			/>
			<p className=" font-bold text-[13px]">40%</p>
		</div>
	);
}
