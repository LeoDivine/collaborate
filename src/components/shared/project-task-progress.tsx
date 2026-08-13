import { Progress } from "@/components/ui/progress";
import React from "react";

export default function ProjectTaskProgress({
	value = 0,
}: {
	value?: number;
}) {
	return (
		<div className="flex gap-2 items-center w-full">
			<Progress
				indicatorClassName="bg-accent rounded-full"
				className="bg-secondary/20"
				value={value}
			/>
			<p className="font-bold text-[13px] text-secondary shrink-0">
				{value}%
			</p>
		</div>
	);
}
