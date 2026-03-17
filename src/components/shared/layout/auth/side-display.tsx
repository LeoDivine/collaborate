import Image from "next/image";
import Link from "next/link";
import React from "react";
import { DeskMode } from "../../../../../generated/prisma/enums";

export default function SideDisplay({ mode }: { mode: DeskMode }) {
	return (
		<div className=" text-a px-[40px] py-[20px] hidden md:inline  rounded-xl shadow w-[30%] bg-linear-to-br from-[#222222] to-[#383838]">
			<div className=" flex justify-between flex-col items-center h-full">
				<Image
					className=" w-[50%] object-cover"
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
				/>
				<div className="">
					<p className=" text-[30px] font-bold ">
						{mode === "INDIVIDUAL" ?
							"Create an Individual Account"
						:	"Create a Workspace Account"}
					</p>
					<p>
						{mode === "INDIVIDUAL" ?
							"As an individual, create an account to start keeping track of tasks you set, monitor your stats."
						:	"Set up your workspace to manage projects, organize your team, and keep everyone aligned in one place."
						}
					</p>
				</div>
				{mode === "INDIVIDUAL" ?
					<span className=" text-accent text-[11px] gap-2 flex ">
						<p>Want to create a workspace account instead? </p>
						<Link className=" underline" href={""}>
							Create account
						</Link>
					</span>
				:	<span className=" text-accent text-[11px] gap-2 flex ">
						<p>Want to create an individual account instead? </p>
						<Link className=" underline" href={""}>
							Create account
						</Link>
					</span>
				}
			</div>
		</div>
	);
}
