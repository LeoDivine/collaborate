import { Progress } from "@/components/ui/progress";
import React from "react";
import { cn } from "@/lib/utils";

export default function ProjectTaskProgress({
	value = 0,
	isSelected = false,
	className,
	indicatorClassName,
	textClassName,
}: {
	value?: number;
	isSelected?: boolean;
	className?: string;
	indicatorClassName?: string;
	textClassName?: string;
}) {
	const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
	const isCompleted = clampedValue === 100;

	return (
		<div className="flex gap-2.5 items-center w-full">
			<Progress
				indicatorClassName={cn(
					"rounded-full transition-all duration-300",
					isCompleted
						? "bg-emerald-500"
						: isSelected
						? "bg-primary dark:bg-accent"
						: "bg-accent",
					indicatorClassName,
				)}
				className={cn(
					"h-2.5 w-full rounded-full",
					isSelected
						? "bg-primary/25 border border-primary/30 dark:bg-white/20 dark:border-white/20"
						: "bg-secondary/25 border border-secondary/20",
					className,
				)}
				value={clampedValue}
			/>
			<p
				className={cn(
					"font-bold text-[13px] shrink-0 min-w-[36px] text-right",
					isSelected
						? "text-primary dark:text-zinc-100"
						: "text-secondary",
					textClassName,
				)}
			>
				{clampedValue}%
			</p>
		</div>
	);
}
