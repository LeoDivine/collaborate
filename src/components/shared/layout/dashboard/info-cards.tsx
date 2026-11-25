import React from "react";
import { LucideIcon } from "lucide-react";

export default function InfoCards({
	title,
	value,
	icon: Icon,
	extraInfo,
}: {
	title: string;
	value: number | string;
	icon?: LucideIcon | React.ComponentType<{ className?: string }>;
	extraInfo?: React.ReactNode;
}) {
	return (
		<div className="min-w-0 text-primary py-[20px] rounded-[20px] px-[20px] bg-[#969696]">
			<div className="flex items-center gap-2 min-w-0">
				{Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
				<p className="font-medium whitespace-nowrap truncate">{title}</p>
			</div>
			<p className="text-6xl font-bold mt-1 whitespace-nowrap">{value}</p>
			{extraInfo && (
				<div className="min-w-0 whitespace-nowrap [&_p]:whitespace-nowrap [&_p]:truncate">
					{extraInfo}
				</div>
			)}
		</div>
	);
}
