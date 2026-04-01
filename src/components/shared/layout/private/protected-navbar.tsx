"use client";

import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getInitials, renderNavigationByRole } from "@/lib/utils";
import { Check, FlipHorizontal2, LogOut } from "lucide-react";
import { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { Workspace } from "../../../../../generated/prisma/client";
import {
	DeskMode,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";
import { Button } from "@/components/ui/button";

export default function ProtectedNavbar({
	user,
	workspaces,
}: {
	user: User;
	workspaces: any[];
}) {
	const pathName = usePathname();
	const { update } = useSession();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState(
		user.currentWorkspaceId,
	);

	useEffect(() => {
		setActiveWorkspaceId(user.currentWorkspaceId);
	}, [user.currentWorkspaceId]);

	// console.log({ workspaces });
	async function handleWorkspaceSwitch({
		id,
		mode,
		role,
		name,
	}: {
		id: string;
		mode: DeskMode;
		role: WorkspaceRoles;
		name: string;
	}) {
		if (id === activeWorkspaceId) {
			setOpen(false);
			return;
		}

		setActiveWorkspaceId(id);
		setOpen(false);

		const updatedSession = await update({
			currentWorkspaceId: id,
			currentWorkspaceMode: mode,
			currentWorkspaceRole: role,
			currentWorkspaceName: name,
		});

		setActiveWorkspaceId(updatedSession?.user?.currentWorkspaceId ?? id);
		router.refresh();
	}

	// console.log({ activeWorkspaceId });

	// console.log({ user });
	return (
		<div className=" md:w-[calc(100%-20px)]  flex justify-between items-center py-[10px] px-[10px] md:px-[30px] rounded-[20px] bg-primary">
			<div className="">
				<div className=" items-center flex gap-3">
					<Badge
						variant={"secondary"}
						className=" py-[5px] hidden md:inline "
					>
						{user.currentWorkspaceName}
					</Badge>
					<Badge
						variant={"secondary"}
						className=" py-[5px] hidden md:inline "
					>
						{user.currentWorkspaceMode}
					</Badge>
					{user.currentWorkspaceMode ===
						("WORKSPACE" as DeskMode) && (
						<Badge
							variant={"secondary"}
							className="  py-[5px] hidden md:inline "
						>
							{user.currentWorkspaceRole}
						</Badge>
					)}

					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger className=" hidden md:flex" asChild>
							<Badge
								className=" flex items-center cursor-pointer py-[5px]"
								variant={"secondary"}
							>
								<FlipHorizontal2 className=" w-5 h-5" />
								<p>Switch workspace</p>
							</Badge>
						</DialogTrigger>
						<DialogContent className="  border-0 bg-primary">
							<DialogHeader>
								<DialogTitle className=" text-accent">
									Switch Workspace
								</DialogTitle>
								<DialogDescription>
									Switch to another workspace you belong to
									and view your projects and tasks
								</DialogDescription>
							</DialogHeader>

							<div>
								<ScrollArea className="  max-h-[200px] h-full ">
									<div className=" cursor-pointer flex gap-3 flex-col">
										{workspaces.map((i) => {
											const memberWorkspace =
												i.workspace as Workspace;
											return (
												<div
													key={i.id}
													onClick={() => {
														handleWorkspaceSwitch({
															id: memberWorkspace.id,
															mode: memberWorkspace.mode,
															name: memberWorkspace.name,
															role: i.role,
														});
													}}
													className={` ${activeWorkspaceId === memberWorkspace.id ? " bg-accent text-primary" : " bg-transparent text-accent"} hover:bg-accent hover:text-primary transition-all  flex items-center justify-between px-[20px] rounded-[10px] py-[10px]`}
												>
													<div className="">
														<p className=" text-[15px] line-clamp-1">
															{
																memberWorkspace.name
															}
														</p>
														<Badge
															variant={"default"}
														>
															{
																memberWorkspace.mode
															}
														</Badge>
													</div>
													{activeWorkspaceId ===
														memberWorkspace.id && (
														<div className=" flex gap-4 items-center">
															<Check />
														</div>
													)}
												</div>
											);
										})}
									</div>
									<ScrollBar orientation="vertical" />
								</ScrollArea>
							</div>
						</DialogContent>
					</Dialog>
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
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						className=" flex items-center justify-center md:hidden"
						asChild
					>
						<Button
							size={"icon"}
							className=" bg-secondary text-primary rounded-full"
						>
							<FlipHorizontal2 className=" w-5 h-5" />
						</Button>
					</DialogTrigger>
					<DialogContent className="  border-0 bg-primary">
						<DialogHeader>
							<DialogTitle className=" text-accent">
								Switch Workspace
							</DialogTitle>
							<DialogDescription>
								Switch to another workspace you belong to and
								view your projects and tasks
							</DialogDescription>
						</DialogHeader>

						<div>
							<ScrollArea className="  max-h-[200px] h-full ">
								<div className=" cursor-pointer flex gap-3 flex-col">
									{workspaces.map((i) => {
										const memberWorkspace =
											i.workspace as Workspace;
										return (
											<div
												key={i.id}
												onClick={() => {
													handleWorkspaceSwitch({
														id: memberWorkspace.id,
														mode: memberWorkspace.mode,
														name: memberWorkspace.name,
														role: i.role,
													});
												}}
												className={` ${activeWorkspaceId === memberWorkspace.id ? " bg-accent text-primary" : " bg-transparent text-accent"} hover:bg-accent hover:text-primary transition-all  flex items-center justify-between px-[20px] rounded-[10px] py-[10px]`}
											>
												<div className="">
													<p className=" text-[15px] line-clamp-1">
														{memberWorkspace.name}
													</p>
													<Badge variant={"default"}>
														{memberWorkspace.mode}
													</Badge>
												</div>
												{activeWorkspaceId ===
													memberWorkspace.id && (
													<div className=" flex gap-4 items-center">
														<Check />
													</div>
												)}
											</div>
										);
									})}
								</div>
								<ScrollBar orientation="vertical" />
							</ScrollArea>
						</div>
					</DialogContent>
				</Dialog>

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
						<DropdownMenuGroup className=" px-[5px] flex-wrap flex gap-3 py-[4px] ">
							<Badge variant={"secondary"}>
								{user.currentWorkspaceName}
							</Badge>
							<Badge variant={"secondary"}>
								{user.currentWorkspaceMode}
							</Badge>
							{user.currentWorkspaceMode ===
								("WORKSPACE" as DeskMode) && (
								<Badge variant={"secondary"}>
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
