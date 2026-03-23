"use client";

import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, renderNavigationByRole } from "@/lib/utils";
import { User } from "next-auth";
import Image from "next/image";
import { FaBell } from "react-icons/fa";
import {
	DeskMode,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProtectedNavbar({ user }: { user: User }) {
	const pathName = usePathname();

	// console.log({ user });
	return (
		<div className=" md:w-[calc(100%-20px)]  flex justify-between items-center py-[10px] px-[10px] md:px-[30px] rounded-[20px] bg-primary">
			<div className="">
				<div className=" flex gap-3">
					<Badge className=" hidden md:inline bg-secondary">
						{user.currentWorkspaceMode}
					</Badge>
					{user.currentWorkspaceMode ===
						("WORKSPACE" as DeskMode) && (
						<Badge className=" hidden md:inline bg-secondary">
							{user.currentWorkspaceRole}
						</Badge>
					)}
				</div>
				<Image
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className=" inline md:hidden w-[50%]"
				/>
			</div>
			<div className=" flex items-center gap-4">
				<FaBell className=" w-6 h-6 text-secondary" />
				<div className=" md:flex bg-secondary cursor-pointer  hidden w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full text-primary">
					{getInitials(user.fullName)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger className=" " asChild>
						<div className=" md:hidden flex bg-secondary w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full text-primary">
							{getInitials(user.fullName)}
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className=" border-secondary shadow bg-primary  mr-[20px] w-[300px]">
						<DropdownMenuGroup className=" flex gap-3 py-[4px] ">
							<Badge className=" bg-secondary">
								{user.currentWorkspaceMode}
							</Badge>
							{user.currentWorkspaceMode ===
								("WORKSPACE" as DeskMode) && (
								<Badge className=" bg-secondary">
									{user.currentWorkspaceRole}
								</Badge>
							)}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{renderNavigationByRole(
								user.currentWorkspaceRole as WorkspaceRoles,
								user.currentWorkspaceMode as DeskMode,
							).map((i, k) => {
								const Icon = i.icon;
								return (
									<DropdownMenuItem
										className={`${pathName.includes(i.link) ? "bg-secondary text-primary" : "text-secondary"}`}
										asChild
										key={k}
									>
										<Link href={i.link}>
											<Icon className=" w-4 h-4" />
											{i.name}
										</Link>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className=" text-secondary"
								onClick={async () => {
									await signOut({ redirectTo: "/sign-in" });
								}}
							>
								<LogOut className=" w-4 h-4" />
								<p className=" text-[13px]">Log Out</p>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<div className=" md:inline hidden">
					<p className=" text-[14px] font-bold">{user.fullName}</p>
					<p className=" text-[12px]">@{user.userName}</p>
				</div>
			</div>
		</div>
	);
}
