import { renderPriority, renderPriorityLight } from "@/lib/utils";
import React from "react";
import { PriorityLevel } from "../../../../generated/prisma/client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export default function TaskProject({
	date,
	priority,
	title,
}: {
	id?: string;
	title: string;
	date: Date;
	priority: PriorityLevel;
}) {
	return (
		<div className=" mt-1">
			<div className=" md:hidden inline">
				<div
					className={` w-[14px] rounded-full h-[14px]  ${renderPriority(priority)}`}
				></div>
			</div>
			<div className=" hidden md:inline">
				<Dialog>
					<DialogTrigger asChild>
						<div className="flex cursor-pointer overflow-hidden rounded-md">
							<div
								className={`w-1.5 shrink-0 ${renderPriority(priority)}`}
							/>

							<div
								className={`flex-1 py-1 px-2 ${renderPriorityLight(priority)}`}
							>
								<p className="text-[12px] font-medium text-primary line-clamp-1">
									{title}
								</p>
							</div>
						</div>
					</DialogTrigger>

					<DialogContent>
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription>
								Task details for {date.toLocaleDateString()}.
							</DialogDescription>
						</DialogHeader>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
