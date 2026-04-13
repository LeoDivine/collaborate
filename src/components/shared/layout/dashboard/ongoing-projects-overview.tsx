import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function OngoingProjectsOverview() {
	return (
		<div className="py-[20px] w-full rounded-[20px] px-[20px] bg-accent">
			<div className="  flex justify-between items-center ">
				<div className=" flex gap-1">
					<Badge>#design</Badge>
					<Badge>#design</Badge>
				</div>
				<AvatarGroup className=" *:data-[slot=avatar]:ring-transparent">
					<Avatar className=" ">
						<AvatarFallback className=" w-full border border-primary bg-secondary text-primary font-bold">
							{getInitials("Emmanuel Akhabue")}
						</AvatarFallback>
					</Avatar>
					<Avatar className=" ">
						<AvatarFallback className=" w-full border border-primary bg-secondary text-primary font-bold">
							{getInitials("Emmanuel Akhabue")}
						</AvatarFallback>
					</Avatar>
					<AvatarGroupCount className=" ring-0 bg-primary text-secondary">
						+3
					</AvatarGroupCount>
				</AvatarGroup>
			</div>
			<div className="">
				<p className=" text-primary text-[20px] mt-[4px]">
					Project One
				</p>
				<p className=" text-primary line-clamp-3 mt-[4px] text-[12px]">
					Lorem ipsum dolor sit amet consectetur adipisicing elit.
					Doloremque, dolore. Asperiores, ullam quibusdam non
					dignissimos voluptates in error laborum deserunt et
					praesentium! Soluta omnis eveniet, nostrum at ratione
					temporibus. Numquam!
				</p>
				<Link
					href={""}
					className=" flex gap-2 mt-[8px] items-center text-primary"
				>
					<p className=" text-[12px]">Details</p>
					<MoveRight strokeWidth={1} />
				</Link>
			</div>
		</div>
	);
}
