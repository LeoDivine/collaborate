"use client";

import { PROTECTEDPERSONALNAVBAR } from "@/lib/const";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function ProtectedSidebar() {
	const pathName = usePathname();
	return (
		<div className=" bg-primary rounded-[20px]  py-[20px] flex flex-col items-center justify-between  h-[calc(100vh-30px)] ">
			<div className="flex flex-col gap-11 items-start">
				<div className=" flex items-center justify-center">
					<Image
						src={"/resources/logo.png"}
						alt="logo"
						width={"1000"}
						height={"1000"}
						className=" w-[60%]"
					/>
				</div>

				<div className=" w-full px-[20px] ">
					<div className=" w-full flex flex-col gap-2">
						{PROTECTEDPERSONALNAVBAR.map((i, k) => {
							const Icon = i.icon;
							return (
								<Link
									href={i.link}
									key={k}
									className={`${pathName.includes(i.link) ? "bg-secondary text-primary" : " bg-transparent"}  px-[20px] rounded-[13px] py-[10px] w-full text-[13px]  items-center flex gap-4`}
								>
									<span className=" text-[10px]">
										<Icon className=" w-4 h-4" />
									</span>
									<p>{i.name}</p>
								</Link>
							);
						})}
					</div>
				</div>
			</div>
			<div className=" flex items-center gap-3 cursor-pointer">
				<LogOut className=" w-4 h-4" />
				<p className=" text-[13px]">Log Out</p>
			</div>
		</div>
	);
}
