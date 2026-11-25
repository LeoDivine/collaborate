"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import PresenceIndicator from "@/components/shared/presence-indicator";
import { Check, FlipHorizontal2, LogOut, Plus } from "lucide-react";
import { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import type { Workspace } from "../../../../../generated/prisma/client";
import {
	DeskMode,
	MemberStatus,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";
import { toast } from "sonner";

export default function ProtectedNavbar({
	user,
	workspaces,
}: {
	user: User;
	workspaces: any[];
}) {
	const pathName = usePathname();
	const { data: session, update } = useSession();
	const currentUser = session?.user ?? user;
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState(
		currentUser.currentWorkspaceId,
	);

	useEffect(() => {
		setActiveWorkspaceId(currentUser.currentWorkspaceId);
	}, [currentUser.currentWorkspaceId]);

	async function handleWorkspaceSwitch({
		id,
		mode,
		role,
		name,
		memberId,
		status,
	}: {
		id: string;
		mode: DeskMode;
		role: WorkspaceRoles;
		name: string;
		memberId: string;
		status?: MemberStatus;
	}) {
		if (status === "INACTIVE") {
			toast.error(
				`Your membership in "${name}" has been deactivated. Please contact the workspace administrator.`,
			);
			return;
		}

		if (id === activeWorkspaceId) {
			setOpen(false);
			return;
		}

		setActiveWorkspaceId(id);
		setOpen(false);

		toast.success(`Switching workspace to ${name}`);

		const updatedSession = await update({
			currentWorkspaceId: id,
			currentWorkspaceMode: mode,
			currentWorkspaceRole: role,
			currentWorkspaceName: name,
			currentMemberId: memberId,
		});

		setActiveWorkspaceId(updatedSession?.user?.currentWorkspaceId ?? id);
		router.push("/dashboard");
		router.refresh();
	}

	return (
		<div className="w-full text-secondary flex justify-between items-center py-2.5 px-3.5 sm:px-5 md:px-7 rounded-[20px] bg-primary shadow-sm">
			{/* Left side: Logo on mobile, Workspace badges on desktop */}
			<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
				{/* Mobile Brand Logo */}
				<Link
					href="/dashboard"
					className="flex items-center md:hidden focus:outline-none shrink-0"
					aria-label="Dashboard"
				>
					<Image
						src="/resources/logo.png"
						alt="Collaborate Logo"
						width={110}
						height={26}
						priority
						className="h-6 w-auto object-contain"
					/>
				</Link>

				{/* Desktop Workspace Info Badges */}
				<Badge
					variant="secondary"
					className="py-1 px-3 hidden md:inline-flex text-xs font-semibold max-w-[180px] truncate"
				>
					{currentUser.currentWorkspaceName}
				</Badge>
				<Badge
					variant="secondary"
					className="py-1 px-2.5 hidden md:inline-flex text-xs"
				>
					{currentUser.currentWorkspaceMode}
				</Badge>
				{currentUser.currentWorkspaceMode === ("WORKSPACE" as DeskMode) && (
					<Badge
						variant="secondary"
						className="py-1 px-2.5 hidden md:inline-flex text-xs"
					>
						{currentUser.currentWorkspaceRole}
					</Badge>
				)}

				{/* Unified Switch Workspace Dialog */}
				<Dialog open={open} onOpenChange={setOpen}>
					{/* Desktop Trigger */}
					<DialogTrigger asChild>
						<Badge
							className="md:inline-flex items-center gap-1.5 hidden cursor-pointer py-1 px-3 text-xs font-medium hover:bg-secondary/90 transition-colors"
							variant="secondary"
						>
							<FlipHorizontal2 className="w-3.5 h-3.5 text-primary" />
							<span>Switch workspace</span>
						</Badge>
					</DialogTrigger>

					{/* Dialog Content */}
					<DialogContent className="rounded-[20px] border-0 bg-primary text-secondary sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-accent text-lg">
								Switch Workspace
							</DialogTitle>
							<DialogDescription className="text-secondary/70 text-xs">
								Switch to another workspace you belong to and view your
								projects and tasks
							</DialogDescription>
						</DialogHeader>

						<Button
							asChild
							className="w-full rounded-full bg-secondary text-primary hover:bg-secondary/90 text-xs h-9 font-semibold"
						>
							<Link
								href="/create-workspace"
								onClick={() => setOpen(false)}
							>
								<Plus className="w-4 h-4 mr-1.5" />
								<span>Create workspace</span>
							</Link>
						</Button>

						<div>
							<ScrollArea className="max-h-[240px] h-full">
								<div className="cursor-pointer flex gap-2 flex-col pr-2">
									{workspaces.map((i) => {
										const memberWorkspace =
											i.workspace as Workspace;
										const isSelected =
											activeWorkspaceId === memberWorkspace.id;
										return (
											<div
												key={i.id}
												onClick={() => {
													handleWorkspaceSwitch({
														id: memberWorkspace.id,
														mode: memberWorkspace.mode,
														name: memberWorkspace.name,
														role: i.role,
														memberId: i.id,
														status: i.status,
													});
												}}
												className={`${
													isSelected
														? "bg-accent text-primary font-semibold"
														: "bg-secondary/10 text-secondary hover:bg-secondary/20"
												} ${
													i.status === "INACTIVE"
														? "opacity-60 cursor-not-allowed"
														: "cursor-pointer"
												} transition-all flex items-center justify-between px-3.5 py-2.5 rounded-xl`}
											>
												<div className="min-w-0 flex-1 pr-2">
													<div className="flex items-center gap-1.5">
														<p className="text-[13px] truncate">
															{memberWorkspace.name}
														</p>
														{i.status === "INACTIVE" && (
															<Badge className="bg-destructive text-white text-[9px] px-1 py-0">
																Deactivated
															</Badge>
														)}
													</div>
													<p
														className={`text-[10px] ${
															isSelected
																? "text-primary/70"
																: "text-secondary/60"
														}`}
													>
														{memberWorkspace.mode} • {i.role}
													</p>
												</div>
												{isSelected && (
													<Check className="w-4 h-4 shrink-0 text-primary" />
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

			{/* Right side: Actions, Notifications, and Profile */}
			<div className="flex items-center gap-2 sm:gap-3">
				{/* Mobile Switch Workspace Trigger */}
				<button
					type="button"
					onClick={() => setOpen(true)}
					title="Switch workspace"
					aria-label="Switch workspace"
					className="md:hidden flex items-center justify-center p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
				>
					<FlipHorizontal2 className="w-4 h-4 text-accent" />
				</button>

				{/* Notifications Bell - Accessible Link */}
				<Link
					href="/notifications"
					title="Notifications"
					aria-label="View notifications"
					className={`p-2 rounded-full transition-colors ${
						pathName === "/notifications"
							? "bg-secondary/20 text-accent"
							: "text-secondary/80 hover:text-secondary hover:bg-secondary/10"
					}`}
				>
					<FaBell className="w-4 h-4" />
				</Link>

				{/* Desktop Avatar with Presence */}
				<div className="relative md:inline-flex hidden shrink-0">
					<div
						tabIndex={0}
						className="bg-secondary cursor-pointer w-10 h-10 font-bold text-sm flex items-center justify-center rounded-full text-primary shadow-sm"
					>
						{getInitials(user.fullName)}
					</div>
					<span className="absolute bottom-0 right-0 leading-none">
						<PresenceIndicator
							userId={user.id}
							size="md"
							ringColor="ring-primary"
						/>
					</span>
				</div>

				{/* Mobile Avatar with Dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<div
							role="button"
							tabIndex={0}
							aria-label="User profile menu"
							className="relative md:hidden inline-flex shrink-0 cursor-pointer"
						>
							<div className="bg-secondary w-9 h-9 font-bold text-xs flex items-center justify-center rounded-full text-primary shadow-sm">
								{getInitials(user.fullName)}
							</div>
							<span className="absolute bottom-0 right-0 leading-none">
								<PresenceIndicator
									userId={user.id}
									size="sm"
									ringColor="ring-primary"
								/>
							</span>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="border-secondary/20 shadow-xl bg-primary text-secondary w-[260px] rounded-2xl p-2"
					>
						<div className="px-2 py-2 flex flex-col gap-0.5">
							<p className="text-xs font-bold text-secondary truncate">
								{user.fullName}
							</p>
							<p className="text-[10px] text-secondary/60 truncate">
								@{user.userName || "user"}
							</p>
							<div className="flex flex-wrap gap-1 mt-1.5">
								<Badge
									variant="secondary"
									className="text-[9px] py-0 px-1.5"
								>
									{currentUser.currentWorkspaceName}
								</Badge>
								<Badge
									variant="secondary"
									className="text-[9px] py-0 px-1.5"
								>
									{currentUser.currentWorkspaceMode}
								</Badge>
							</div>
						</div>
						<DropdownMenuSeparator className="bg-secondary/15" />
						<DropdownMenuGroup>
							{renderNavigationByRole(
								currentUser.currentWorkspaceRole as WorkspaceRoles,
								currentUser.currentWorkspaceMode as DeskMode,
							).map((i, k) => {
								const Icon = i.icon;
								const isActive = pathName.startsWith(i.link);
								return (
									<DropdownMenuItem
										className={`cursor-pointer text-xs rounded-lg py-2 ${
											isActive
												? "bg-secondary text-primary font-semibold"
												: "text-secondary hover:bg-secondary/10"
										}`}
										asChild
										key={k}
									>
										<Link href={i.link}>
											<Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
											{i.name}
										</Link>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="bg-secondary/15" />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="text-secondary hover:text-destructive cursor-pointer text-xs rounded-lg py-2"
								onClick={async () => {
									await signOut({ redirectTo: "/sign-in" });
								}}
							>
								<LogOut className="w-3.5 h-3.5 mr-2 shrink-0" />
								<span>Log Out</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Desktop User Info Text */}
				<div className="md:inline hidden min-w-0 pr-1">
					<p className="text-xs font-bold truncate text-secondary leading-tight">
						{user.fullName}
					</p>
					<p className="text-[11px] text-secondary/70 truncate">
						@{user.userName || "user"}
					</p>
				</div>
			</div>
		</div>
	);
}
