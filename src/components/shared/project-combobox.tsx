"use client";

import React, { useState, useMemo } from "react";
import {
	Check,
	ChevronsUpDown,
	Clock,
	Box,
	FolderKanban,
	Layers,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import type { Projects } from "@/lib/types";
import { useRecentProjects, saveRecentProjectId } from "@/lib/storage/recent-projects";
import { Status } from "../../../generated/prisma/enums";

interface ProjectComboboxProps {
	projects: Projects[];
	selectedProjectId?: string;
	onSelectProject: (projectId: string) => void;
	workspaceId?: string;
	placeholder?: string;
	allowAllOption?: boolean;
	allOptionLabel?: string;
	disabled?: boolean;
	variant?: "pill" | "outline" | "default";
	className?: string;
	triggerClassName?: string;
	popoverWidth?: string;
}

export function ProjectCombobox({
	projects = [],
	selectedProjectId,
	onSelectProject,
	workspaceId,
	placeholder = "Select Project",
	allowAllOption = false,
	allOptionLabel = "All Projects",
	disabled = false,
	variant = "pill",
	className = "",
	triggerClassName = "",
	popoverWidth = "w-[260px] sm:w-[280px]",
}: ProjectComboboxProps) {
	const [open, setOpen] = useState(false);
	const { recentProjectIds, addRecentProject } = useRecentProjects(workspaceId);

	const selectedProject = useMemo(() => {
		return projects.find((p) => p.id === selectedProjectId);
	}, [projects, selectedProjectId]);

	const selectedTitle = useMemo(() => {
		if (selectedProjectId === "ALL" && allowAllOption) {
			return allOptionLabel;
		}
		return selectedProject?.title || placeholder;
	}, [selectedProjectId, allowAllOption, allOptionLabel, selectedProject, placeholder]);

	// Partition into Recent and Others
	const { recentProjects, otherProjects } = useMemo(() => {
		const validProjectsMap = new Map(projects.map((p) => [p.id, p]));
		const recents: Projects[] = [];
		const recentSet = new Set<string>();

		for (const id of recentProjectIds) {
			const found = validProjectsMap.get(id);
			if (found) {
				recents.push(found);
				recentSet.add(id);
			}
		}

		const others = projects.filter((p) => !recentSet.has(p.id));
		return { recentProjects: recents, otherProjects: others };
	}, [projects, recentProjectIds]);

	const handleSelect = (projectId: string) => {
		if (projectId !== "ALL") {
			addRecentProject(projectId);
		}
		onSelectProject(projectId);
		setOpen(false);
	};

	const getStatusDot = (status?: Status | null) => {
		switch (status) {
			case Status.IN_PROGRESS:
				return "bg-amber-500";
			case Status.COMPLETED:
				return "bg-emerald-500";
			case Status.ON_HOLD:
				return "bg-blue-500";
			case Status.CANCELLED:
				return "bg-rose-500";
			case Status.TODO:
			default:
				return "bg-primary/40";
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				{variant === "outline" ? (
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={`h-9 rounded-full text-sm border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 px-3 ${triggerClassName}`}
					>
						<div className="flex items-center gap-2 truncate text-left">
							<Box className="w-3.5 h-3.5 shrink-0 opacity-70" />
							<span className="truncate max-w-[140px] font-normal">
								{selectedTitle}
							</span>
						</div>
						<ChevronsUpDown className="w-3.5 h-3.5 shrink-0 opacity-50 ml-1" />
					</Button>
				) : (
					<Button
						disabled={disabled}
						role="combobox"
						aria-expanded={open}
						className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full flex items-center justify-between gap-1.5 transition-all ${
							selectedProjectId ? "opacity-100" : "opacity-60"
						} ${triggerClassName}`}
					>
						<div className="flex items-center gap-1.5 truncate">
							<Box className="w-4 h-4 shrink-0" />
							<span className="md:inline hidden truncate max-w-[130px]">
								{selectedTitle}
							</span>
						</div>
						<ChevronsUpDown className="w-3 h-3 shrink-0 opacity-40 ml-1" />
					</Button>
				)}
			</PopoverTrigger>

			<PopoverContent
				className={`${popoverWidth} p-0 border border-primary/20 bg-background text-primary shadow-xl rounded-2xl overflow-hidden z-50`}
				align="start"
				sideOffset={6}
			>
				<Command className="bg-transparent">
					<CommandInput
						placeholder="Search projects..."
						className="h-10 text-xs text-primary placeholder:text-primary/40 border-b border-primary/10"
					/>
					<CommandList className="max-h-[260px] overflow-y-auto custom-scrollbar p-1">
						<CommandEmpty className="py-4 text-center text-xs text-primary/60">
							No projects found.
						</CommandEmpty>

						{/* All Projects Option (useful in filters) */}
						{allowAllOption && (
							<CommandGroup>
								<CommandItem
									value="ALL All Projects"
									onSelect={() => handleSelect("ALL")}
									className="flex items-center justify-between text-xs py-2 px-2.5 rounded-xl cursor-pointer hover:bg-primary/10 data-[selected=true]:bg-primary/15 transition-colors"
								>
									<div className="flex items-center gap-2 truncate">
										<Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
										<span className="font-semibold truncate">
											{allOptionLabel}
										</span>
									</div>
									{selectedProjectId === "ALL" && (
										<Check className="w-3.5 h-3.5 shrink-0 text-primary" />
									)}
								</CommandItem>
							</CommandGroup>
						)}

						{/* Recent Projects Group */}
						{recentProjects.length > 0 && (
							<>
								<CommandGroup
									heading={
										<span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 px-1">
											Recent Projects
										</span>
									}
								>
									{recentProjects.map((p) => {
										const isSelected = p.id === selectedProjectId;
										const memberCount = p.projectMembers?.length || 0;
										return (
											<CommandItem
												key={`recent-${p.id}`}
												value={`${p.title} ${p.id} recent`}
												onSelect={() => handleSelect(p.id)}
												className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl cursor-pointer transition-colors ${
													isSelected
														? "bg-primary text-secondary font-semibold"
														: "hover:bg-primary/10 text-primary data-[selected=true]:bg-primary/10"
												}`}
											>
												<div className="flex items-center gap-2 truncate">
													<Clock
														className={`w-3 h-3 shrink-0 ${
															isSelected
																? "text-secondary opacity-70"
																: "text-primary/50"
														}`}
													/>
													<span className="truncate">
														{p.title}
													</span>
												</div>
												<div className="flex items-center gap-1.5 shrink-0 ml-2">
													{memberCount > 0 && (
														<span
															className={`text-[10px] px-1.5 py-0.5 rounded-full ${
																isSelected
																	? "bg-secondary/20 text-secondary"
																	: "bg-primary/10 text-primary/70"
															}`}
														>
															{memberCount}m
														</span>
													)}
													{isSelected && (
														<Check className="w-3.5 h-3.5 shrink-0" />
													)}
												</div>
											</CommandItem>
										);
									})}
								</CommandGroup>
								{otherProjects.length > 0 && (
									<CommandSeparator className="my-1 bg-primary/10" />
								)}
							</>
						)}

						{/* All Other Projects Group */}
						{otherProjects.length > 0 && (
							<CommandGroup
								heading={
									<span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 px-1">
										{recentProjects.length > 0
											? "Other Projects"
											: "Projects"}
									</span>
								}
							>
								{otherProjects.map((p) => {
									const isSelected = p.id === selectedProjectId;
									const memberCount = p.projectMembers?.length || 0;
									return (
										<CommandItem
											key={p.id}
											value={`${p.title} ${p.id}`}
											onSelect={() => handleSelect(p.id)}
											className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl cursor-pointer transition-colors ${
												isSelected
													? "bg-primary text-secondary font-semibold"
													: "hover:bg-primary/10 text-primary data-[selected=true]:bg-primary/10"
											}`}
										>
											<div className="flex items-center gap-2 truncate">
												<span
													className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(
														p.status,
													)}`}
												/>
												<span className="truncate">
													{p.title}
												</span>
											</div>
											<div className="flex items-center gap-1.5 shrink-0 ml-2">
												{memberCount > 0 && (
													<span
														className={`text-[10px] px-1.5 py-0.5 rounded-full ${
															isSelected
																? "bg-secondary/20 text-secondary"
																: "bg-primary/10 text-primary/70"
														}`}
													>
														{memberCount}m
													</span>
												)}
												{isSelected && (
													<Check className="w-3.5 h-3.5 shrink-0" />
												)}
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
