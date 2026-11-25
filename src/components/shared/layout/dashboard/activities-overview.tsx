import React from "react";

export interface ActivitiesOverviewProps {
	activity: {
		id: string;
		title: string;
		description: string;
		createdAt: Date;
		type: string;
	};
}

export default function ActivitiesOverview({
	activity,
}: ActivitiesOverviewProps) {
	const formattedDate = new Date(activity.createdAt).toLocaleDateString(
		undefined,
		{
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		},
	);

	return (
		<div className="mt-[10px] text-primary border-b border-primary/10 pb-2 last:border-b-0">
			<div>
				<div className="flex justify-between items-baseline gap-2">
					<p className="text-[14px] font-medium line-clamp-1">
						{activity.title}
					</p>
					<span className="text-[10px] opacity-75 shrink-0">
						{formattedDate}
					</span>
				</div>
				<p className="text-[12px] line-clamp-2 opacity-80 mt-0.5">
					{activity.description}
				</p>
			</div>
		</div>
	);
}

