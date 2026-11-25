"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { User } from "next-auth";
import Image from "next/image";
import {
	Box,
	CalendarDays,
	Check,
	Diamond,
	FlipHorizontal2,
	LayoutDashboard,
	LogOut,
	Menu,
	Plus,
	X,
} from "lucide-react";
import { renderNavigationByRole } from "@/lib/utils";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PresenceIndicator from "@/components/shared/presence-indicator";
import { toast } from "sonner";
import {
	DeskMode,
	MemberStatus,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";
import type { Workspace } from "../../../../../generated/prisma/client";

interface ProtectedMobileNavProps {
	user: User;
	workspaces: any[];
}

export default function ProtectedMobileNav({
	user,
	workspaces = [],
}: ProtectedMobileNavProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, update } = useSession();
	const currentUser = session?.user ?? user;
	const [sheetOpen, setSheetOpen] = useState(false);
	const [switchOpen, setSwitchOpen] = useState(false);
	const [activeWorkspaceId, setActiveWorkspaceId] = useState(
		currentUser.currentWorkspaceId,
	);

	useEffect(() => {
		setActiveWorkspaceId(currentUser.currentWorkspaceId);
	}, [currentUser.currentWorkspaceId]);

	const allNavItems = renderNavigationByRole(
		currentUser.currentWorkspaceRole as WorkspaceRoles,
		currentUser.currentWorkspaceMode as DeskMode,
	);

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
			setSwitchOpen(false);
			setSheetOpen(false);
			return;
		}

		setActiveWorkspaceId(id);
		setSwitchOpen(false);
		setSheetOpen(false);

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

	// 4 Primary bottom bar destinations
	const primaryBottomLinks = [
		{
			name: "Dashboard",
			link: "/dashboard",
			icon: LayoutDashboard,
			isActive: pathname === "/dashboard",
		},
		{
			name: "Projects",
			link: "/projects",
			icon: Box,
			isActive: pathname.startsWith("/projects"),
		},
		{
			name: "Tasks",
			link: "/tasks",
			icon: Diamond,
			isActive: pathname.startsWith("/tasks"),
		},
		{
			name: "Calendar",
			link: "/calendar",
			icon: CalendarDays,
			isActive: pathname.startsWith("/calendar"),
		},
	];

	return (
		<>
			{/* Bottom Mobile Navigation Bar - Fixed on small screens */}
			<nav
				aria-label="Mobile Navigation"
				className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary/95 backdrop-blur-lg border-t border-secondary/15 text-secondary px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] shadow-2xl transition-all"
			>
				<div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
					{primaryBottomLinks.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.link}
								href={item.link}
								className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 px-1 rounded-xl transition-all ${
									item.isActive
										? "text-accent font-semibold"
										: "text-secondary/60 hover:text-secondary active:scale-95"
								}`}
							>
								<div
									className={`p-1 rounded-lg transition-colors ${
										item.isActive ? "bg-accent/15" : ""
									}`}
								>
									<Icon className="w-5 h-5" />
								</div>
								<span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
									{item.name}
								</span>
							</Link>
						);
					})}

					{/* 5th slot: Menu Sheet Trigger */}
					<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
						<SheetTrigger asChild>
							<button
								type="button"
								aria-label="Open Workspace Navigation Menu"
								className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 px-1 rounded-xl transition-all ${
									sheetOpen
										? "text-accent font-semibold"
										: "text-secondary/60 hover:text-secondary active:scale-95"
								}`}
							>
								<div
									className={`p-1 rounded-lg transition-colors ${
										sheetOpen ? "bg-accent/15" : ""
									}`}
								>
									<Menu className="w-5 h-5" />
								</div>
								<span className="text-[10px] mt-0.5 tracking-tight">
									Menu
								</span>
							</button>
						</SheetTrigger>

						<SheetContent
							side="left"
							className="w-[85%] max-w-[320px] bg-primary text-secondary border-r border-secondary/15 p-0 flex flex-col justify-between"
						>
							<div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
								{/* Drawer Header: Logo & Workspace Info */}
								<div className="flex flex-col gap-3 pb-4 border-b border-secondary/15">
									<div className="flex items-center justify-between">
										<Link
											href="/dashboard"
											onClick={() => setSheetOpen(false)}
											className="flex items-center"
										>
											<Image
												src="/resources/logo.png"
												alt="Collaborate Logo"
												width={120}
												height={28}
												priority
												className="h-6 w-auto object-contain"
											/>
										</Link>
										<SheetClose className="rounded-full p-1.5 text-secondary/60 hover:text-secondary hover:bg-secondary/10">
											<X className="w-4 h-4" />
											<span className="sr-only">Close menu</span>
										</SheetClose>
									</div>

									<div className="flex flex-col gap-1.5 mt-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-accent truncate">
												{currentUser.currentWorkspaceName || "Workspace"}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-1.5">
											<Badge
												variant="secondary"
												className="text-[10px] py-0 px-2 bg-secondary/15 text-secondary border-none"
											>
												{currentUser.currentWorkspaceMode}
											</Badge>
											{currentUser.currentWorkspaceMode ===
												("WORKSPACE" as DeskMode) && (
												<Badge
													variant="secondary"
													className="text-[10px] py-0 px-2 bg-secondary/15 text-secondary border-none"
												>
													{currentUser.currentWorkspaceRole}
												</Badge>
											)}
										</div>
									</div>

									{/* Switch Workspace Button inside Sheet */}
									<Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="w-full mt-1 rounded-full border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary/20 hover:text-secondary text-xs h-8 gap-2 justify-start px-3"
											>
												<FlipHorizontal2 className="w-3.5 h-3.5 text-accent" />
												<span>Switch Workspace</span>
											</Button>
										</DialogTrigger>

										<DialogContent className="rounded-[20px] border-0 bg-primary text-secondary sm:max-w-md">
											<DialogHeader>
												<DialogTitle className="text-accent">
													Switch Workspace
												</DialogTitle>
												<DialogDescription className="text-secondary/70">
													Switch to another workspace you belong to
													and view your projects and tasks
												</DialogDescription>
											</DialogHeader>

											<Button
												asChild
												className="w-full rounded-full bg-secondary text-primary hover:bg-secondary/90 text-xs h-9"
											>
												<Link
													href="/create-workspace"
													onClick={() => {
														setSwitchOpen(false);
														setSheetOpen(false);
													}}
												>
													<Plus className="w-4 h-4 mr-1.5" />
													<span>Create workspace</span>
												</Link>
											</Button>

											<div>
												<ScrollArea className="max-h-[220px] h-full">
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

								{/* Navigation Links in Drawer */}
								<div className="flex flex-col gap-1">
									<p className="text-[10px] uppercase tracking-wider text-secondary/40 font-semibold px-2 mb-1">
										Navigation
									</p>
									{allNavItems.map((item, idx) => {
										const Icon = item.icon;
										const isActive = pathname.startsWith(item.link);
										return (
											<Link
												key={idx}
												href={item.link}
												onClick={() => setSheetOpen(false)}
												className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
													isActive
														? "bg-secondary text-primary font-bold shadow-sm"
														: "text-secondary hover:bg-secondary/10"
												}`}
											>
												<Icon className="w-4 h-4 shrink-0" />
												<span>{item.name}</span>
											</Link>
										);
									})}
								</div>
							</div>

							{/* Drawer Footer: User Profile & Sign Out */}
							<div className="p-4 border-t border-secondary/15 flex items-center justify-between bg-primary/40">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="relative shrink-0">
										<div className="w-8 h-8 rounded-full bg-secondary text-primary font-bold text-xs flex items-center justify-center">
											{user.fullName ? user.fullName[0].toUpperCase() : "U"}
										</div>
										<span className="absolute bottom-0 right-0 leading-none">
											<PresenceIndicator
												userId={user.id}
												size="sm"
												ringColor="ring-primary"
											/>
										</span>
									</div>
									<div className="min-w-0">
										<p className="text-xs font-semibold text-secondary truncate">
											{user.fullName}
										</p>
										<p className="text-[10px] text-secondary/60 truncate">
											@{user.userName || "user"}
										</p>
									</div>
								</div>

								<button
									type="button"
									onClick={async () => {
										await signOut({ redirectTo: "/sign-in" });
									}}
									title="Log out"
									aria-label="Log out of Collaborate"
									className="p-2 rounded-xl text-secondary/70 hover:text-destructive hover:bg-secondary/10 transition-colors cursor-pointer"
								>
									<LogOut className="w-4 h-4" />
								</button>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</>
	);
}
