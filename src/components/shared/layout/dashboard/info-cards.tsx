import React from "react";
import { LucideIcon } from "lucide-react";

export default function InfoCards({
	title,
	value,
	icon: Icon,
	extraInfo,
}: {
	title: string;
	value: number;
	icon?: LucideIcon | React.ComponentType<{ className?: string }>;
	extraInfo?: React.ReactNode;
}) {
	return (
		<div className="text-primary py-[20px] rounded-[20px] px-[20px] bg-[#969696]">
			<div className="flex items-center gap-2">
				{Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
				<p className="font-medium">{title}</p>
			</div>
			<p className="text-6xl font-bold mt-1">{value}</p>
			{extraInfo}
		</div>
	);
}
