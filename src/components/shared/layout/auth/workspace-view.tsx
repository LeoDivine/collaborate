import { MoveRight } from "lucide-react";
import React from "react";
import { DeskMode } from "../../../../../generated/prisma/enums";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default function WorkspaceView({
	mode,
	title,
	value,
	id,
}: {
	id: string;
	title: string;
	value: number;
	mode: DeskMode;
}) {
	return (
		<Link
			href={id}
			className=" text-primary px-[20px] rounded-[20px] py-[20px] bg-accent w-full"
		>
			<div className=" flex items-center justify-between ">
				<div className=" flex items-center gap-4">
					<div className="">
						<div className=" p-[10px] rounded-full bg-secondary font-extrabold">
							{getInitials(title)}
						</div>
					</div>
					<div className=" text-[13px]">
						<p>{title}</p>
						{mode === "INDIVIDUAL" ?
							<p>Projects: {value} project(s)</p>
						:	<p>Members: {value} member(s)</p>}
					</div>
				</div>
				<div className="">
					<MoveRight />
				</div>
			</div>
		</Link>
	);
}
