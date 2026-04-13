import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import React from "react";

export default function UpcomingDeadlinesOverview() {
	return (
		<div className=" mt-[10px] text-primary">
			<div className="">
				<p className="text-[15px]">Task 20</p>
				<p className=" text-[12px] line-clamp-2">
					Lorem ipsum dolor sit amet consectetur adipisicing elit.
					Possimus quas dolorum iusto magnam accusamus eligendi
					explicabo laudantium eos in. Dolores perferendis laudantium
					dolor! Fugiat qui cupiditate esse voluptatem ea quo.
				</p>
			</div>
			<div className=" mt-[10px]">
				<Progress value={33} />
				<p className=" text-[12px] text-right">10/20 milstones done</p>
			</div>
			<Separator className=" bg-primary/20 mt-[10px]" />
		</div>
	);
}
