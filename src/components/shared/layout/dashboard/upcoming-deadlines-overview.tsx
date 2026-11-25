import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { stripHtml } from "@/lib/utils";
import { CalendarDays, Squircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface UpcomingDeadlinesOverviewProps {
	task: {
		id: string;
		title: string;
		description: string;
		endPeriod: Date;
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	};
}

export default function UpcomingDeadlinesOverview({
	task,
}: UpcomingDeadlinesOverviewProps) {
	const progressPercentage =
		task.totalMilestonesCount > 0 ?
			Math.round(
				(task.completedMilestonesCount / task.totalMilestonesCount) * 100,
			)
		:	0;

	return (
		<div className="mt-[12px] text-primary">
			<Link href={`/tasks/${task.id}`} className="group block">
				<p className="text-[15px] font-semibold group-hover:underline line-clamp-1">
					{task.title}
				</p>
				<p className="text-[12px] line-clamp-2 opacity-80 mt-0.5">
					{stripHtml(task.description) || "No description provided."}
				</p>
			</Link>
			<div className="mt-[8px]">
				<Progress value={progressPercentage} />
				<div className="flex justify-between text-[11px] mt-1 opacity-90 items-center">
					<span className="flex items-center gap-1">
						<CalendarDays className="w-3 h-3 text-primary shrink-0" />
						Due {new Date(task.endPeriod).toLocaleDateString()}
					</span>
					<span className="flex items-center gap-1">
						<Squircle className="w-3 h-3 text-primary shrink-0" />
						{task.completedMilestonesCount}/{task.totalMilestonesCount} milestones done
					</span>
				</div>
			</div>
			<Separator className="bg-primary/20 mt-[12px]" />
		</div>
	);
}

