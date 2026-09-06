"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, User, Users, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DeskMode, WorkspaceRoles } from "../../../../../generated/prisma/enums";
import WorkspaceView from "./workspace-view";
import { cn } from "@/lib/utils";

export type WorkspaceMemberItem = {
	id: string;
	role: WorkspaceRoles;
	workspaceId: string;
	workspace: {
		id: string;
		name: string;
		mode: DeskMode;
		_count?: {
			members?: number;
			projects?: number;
		};
	};
};

export default function WorkspaceList({
	members,
}: {
	members: WorkspaceMemberItem[];
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"ALL" | "WORKSPACE" | "INDIVIDUAL">("ALL");

	const totalCount = members.length;
	const teamCount = useMemo(
		() => members.filter((m) => m.workspace.mode === "WORKSPACE").length,
		[members],
	);
	const individualCount = useMemo(
		() => members.filter((m) => m.workspace.mode === "INDIVIDUAL").length,
		[members],
	);

	const filteredMembers = useMemo(() => {
		return members.filter((item) => {
			const matchesTab =
				activeTab === "ALL" || item.workspace.mode === activeTab;
			const matchesSearch =
				searchQuery.trim() === "" ||
				item.workspace.name
					.toLowerCase()
					.includes(searchQuery.toLowerCase().trim());
			return matchesTab && matchesSearch;
		});
	}, [members, activeTab, searchQuery]);

	return (
		<div className="w-full flex flex-col gap-4">
			{/* Search Input */}
			<div className="relative w-full">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-secondary/60" />
				<Input
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search workspaces..."
					className="pl-10 pr-9 py-2 rounded-full bg-primary border-transparent text-secondary placeholder:text-secondary/50 focus-visible:ring-secondary/20"
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => setSearchQuery("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-secondary p-0.5 rounded-full cursor-pointer"
						aria-label="Clear search"
					>
						<X className="size-4" />
					</button>
				)}
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(val) =>
					setActiveTab(val as "ALL" | "WORKSPACE" | "INDIVIDUAL")
				}
				className="w-full"
			>
				<TabsList className="w-full grid grid-cols-3">
					<TabsTrigger
						value="ALL"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm"
					>
						<span>All</span>
						<span
							className={cn(
								"px-1.5 py-0.2 text-[10px] font-semibold rounded-full transition-colors",
								activeTab === "ALL"
									? "bg-white/20 text-white"
									: "bg-primary/15 text-primary",
							)}
						>
							{totalCount}
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="WORKSPACE"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm"
					>
						<Users className="size-3.5" />
						<span>Teams</span>
						<span
							className={cn(
								"px-1.5 py-0.2 text-[10px] font-semibold rounded-full transition-colors",
								activeTab === "WORKSPACE"
									? "bg-white/20 text-white"
									: "bg-primary/15 text-primary",
							)}
						>
							{teamCount}
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="INDIVIDUAL"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm"
					>
						<User className="size-3.5" />
						<span>Personal</span>
						<span
							className={cn(
								"px-1.5 py-0.2 text-[10px] font-semibold rounded-full transition-colors",
								activeTab === "INDIVIDUAL"
									? "bg-white/20 text-white"
									: "bg-primary/15 text-primary",
							)}
						>
							{individualCount}
						</span>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Workspaces Scrollable List */}
			<div className="w-full mt-1">
				{filteredMembers.length > 0 ? (
					<ScrollArea className="h-[320px] sm:h-[360px] pr-2">
						<div className="flex flex-col gap-2.5">
							{filteredMembers.map((item) => {
								const isIndividual =
									item.workspace.mode === "INDIVIDUAL";
								const count = isIndividual
									? item.workspace._count?.projects ?? 0
									: item.workspace._count?.members ?? 0;

								return (
									<WorkspaceView
										key={item.id}
										memberId={item.id}
										role={item.role}
										workspaceId={item.workspace.id}
										mode={item.workspace.mode}
										title={item.workspace.name}
										value={count}
									/>
								);
							})}
						</div>
						<ScrollBar orientation="vertical" />
					</ScrollArea>
				) : (
					<div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-primary/20 bg-secondary/10">
						{searchQuery ? (
							<>
								<p className="text-sm font-semibold text-primary">
									No workspaces found
								</p>
								<p className="text-xs text-primary/60 mt-1 max-w-[240px]">
									No workspace matches &quot;{searchQuery}&quot;. Try a different search term.
								</p>
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="mt-3 text-xs text-primary underline underline-offset-2 cursor-pointer"
								>
									Clear search
								</button>
							</>
						) : activeTab === "WORKSPACE" ? (
							<>
								<Users className="size-8 text-primary/40 mb-2" />
								<p className="text-sm font-semibold text-primary">
									No team workspaces yet
								</p>
								<p className="text-xs text-primary/60 mt-1 mb-3">
									Create a workspace to collaborate with teammates.
								</p>
								<Link
									href="/create-workspace"
									className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-secondary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
								>
									<Plus className="size-3.5" />
									Create Workspace
								</Link>
							</>
						) : activeTab === "INDIVIDUAL" ? (
							<>
								<User className="size-8 text-primary/40 mb-2" />
								<p className="text-sm font-semibold text-primary">
									No personal desk yet
								</p>
								<p className="text-xs text-primary/60 mt-1 mb-3">
									Set up an individual desk for your personal projects.
								</p>
								<Link
									href="/create-workspace"
									className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-secondary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
								>
									<Plus className="size-3.5" />
									Create Personal Desk
								</Link>
							</>
						) : (
							<>
								<p className="text-sm font-semibold text-primary">
									No workspaces yet
								</p>
								<p className="text-xs text-primary/60 mt-1 mb-3">
									Get started by creating or joining a workspace.
								</p>
								<Link
									href="/create-workspace"
									className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-secondary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
								>
									<Plus className="size-3.5" />
									Create Workspace
								</Link>
							</>
						)}
					</div>
				)}
			</div>

			{/* Quick Actions Footer */}
			<div className="flex items-center justify-between pt-2 border-t border-primary/10 text-xs text-primary/80">
				<span>Need a new team or desk?</span>
				<div className="flex items-center gap-3">
					<Link
						href="/join-workspace"
						className="underline hover:text-primary transition-colors"
					>
						Join Workspace
					</Link>
					<span>•</span>
					<Link
						href="/create-workspace"
						className="underline font-semibold hover:text-primary transition-colors flex items-center gap-1"
					>
						<Plus className="size-3" />
						Create New
					</Link>
				</div>
			</div>
		</div>
	);
}
