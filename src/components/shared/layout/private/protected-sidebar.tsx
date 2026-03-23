"use client";

import { PROTECTEDPERSONALNAVBAR } from "@/lib/const";
import { renderNavigationByRole } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
	DeskMode,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";

export default function ProtectedSidebar({ user }: { user: User }) {
	const pathName = usePathname();
	console.log({ user });
	return (
		<div className=" hidden  bg-primary rounded-[20px]  py-[20px] md:flex flex-col items-center justify-between  h-[calc(100vh-30px)] ">
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
						{renderNavigationByRole(
							user.currentWorkspaceRole as WorkspaceRoles,
							user.currentWorkspaceMode as DeskMode,
						).map((i, k) => {
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
			<div
				onClick={async () => {
					await signOut({ redirectTo: "/sign-in" });
				}}
				className=" flex items-center gap-3 cursor-pointer"
			>
				<LogOut className=" w-4 h-4" />
				<p className=" text-[13px]">Log Out</p>
			</div>
		</div>
	);
}
