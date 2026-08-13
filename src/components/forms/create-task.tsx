"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { PRIORITY_LEVEL } from "@/lib/const";
import { createTask } from "@/lib/services/task.services";
import type { MembersUsers, Projects } from "@/lib/types";
import {
	CalendarRange,
	Check,
	CircleSlash,
	Box,
	FolderSymlink,
	Gauge,
	Hash,
	Loader2,
	LucideIcon,
	Plus,
	Search,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PriorityLevel, Status } from "../../../generated/prisma/enums";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { DialogClose } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";

const PAGE_SIZE = 10;

export default function CreateTask({
	projects = [],
	members = [],
	workspaceId,
	currentMemberId,
	initialTotal = 0,
	onSuccess,
}: {
	projects: Projects[];
	members: MembersUsers[];
	workspaceId: string;
	currentMemberId: string;
	initialTotal?: number;
	onSuccess?: () => void;
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState<string>(
		projects[0]?.id || "",
	);
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [priority, setPriority] = useState<{
		icon: LucideIcon;
		title: string;
		value: PriorityLevel;
	}>();

	const [taskMembers, setTaskMembers] = useState<string[]>([]);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [memberSearch, setMemberSearch] = useState("");
	const [labels, setLabels] = useState<string[]>([]);
	const [labelInput, setLabelInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetchingMembers, setIsFetchingMembers] = useState(false);
	const isFetchingRef = useRef(false);
	const [resources, setResources] = useState<
		{
			name: string;
			url: string;
		}[]
	>([]);
	const [resourceField, setResourceField] = useState<{
		name?: string;
		url?: string;
	}>({ name: "", url: "" });

	// Selected project & project members
	const selectedProject = useMemo(() => {
		return projects.find((p) => p.id === selectedProjectId);
	}, [projects, selectedProjectId]);

	const projectMembersList = useMemo(() => {
		if (!selectedProject || !selectedProject.projectMembers) return [];
		return selectedProject.projectMembers.map((pm) => pm.member);
	}, [selectedProject]);

	// Filter project members based on search query
	const filteredProjectMembers = useMemo(() => {
		if (!memberSearch.trim()) return projectMembersList;
		const query = memberSearch.toLowerCase();
		return projectMembersList.filter((m) => {
			const fullName = m.user?.fullName?.toLowerCase() || "";
			const userName = m.user?.userName?.toLowerCase() || "";
			const email = m.user?.email?.toLowerCase() || "";
			return (
				fullName.includes(query) ||
				userName.includes(query) ||
				email.includes(query)
			);
		});
	}, [projectMembersList, memberSearch]);

	// Clear task members that do not belong to newly selected project
	useEffect(() => {
		if (!selectedProject || !selectedProject.projectMembers) {
			setTaskMembers([]);
			return;
		}
		const validMemberIds = new Set(
			selectedProject.projectMembers.map((pm) => pm.memberId),
		);
		setTaskMembers((prev) => prev.filter((id) => validMemberIds.has(id)));
	}, [selectedProjectId, selectedProject]);

	const setFetching = (val: boolean) => {
		isFetchingRef.current = val;
		setIsFetchingMembers(val);
	};

	const addLabels = (values: string[]) => {
		const normalized = values
			.map((value) => value.trim())
			.filter((value) => value.startsWith("#") && value.length > 1);
		if (normalized.length === 0) return;
		setLabels((prev) => {
			const next = new Set(prev);
			for (const label of normalized) {
				next.add(label);
			}
			return Array.from(next);
		});
	};

	const addResources = () => {
		if (
			resourceField?.name === undefined ||
			resourceField?.url === undefined ||
			!resourceField.name.trim() ||
			!resourceField.url.trim()
		) {
			return;
		}

		setResources((prev) => [
			...prev,
			{
				name: resourceField.name!,
				url: resourceField.url!,
			},
		]);
		setResourceField({ name: "", url: "" });
	};

	const removeLabel = (label: string) => {
		setLabels((prev) => prev.filter((item) => item !== label));
	};

	const removeResource = (name: string) => {
		setResources((prev) => prev.filter((item) => item.name !== name));
	};

	const toggleMember = (id: string) => {
		setTaskMembers((prev) =>
			prev.includes(id) ?
				prev.filter((m) => m !== id)
			:	[...prev, id],
		);
	};



	const formatStartDate = (date: Date) =>
		date.toLocaleDateString(undefined, {
			month: "short",
			day: "2-digit",
			year: "numeric",
		});

	const minDueDate = startDate ? new Date(startDate) : today;
	minDueDate.setHours(0, 0, 0, 0);

	const extractLabels = (value: string) => value.match(/#[\w-]+/g) ?? [];
	const triggerOpacity = (selected: boolean) =>
		selected ? "opacity-100" : "opacity-60 md:opacity-100";
	const router = useRouter();

	const handleSubmit = async () => {
		if (!title.trim()) {
			toast.error("Please enter a task title");
			return;
		}

		if (!selectedProjectId) {
			toast.error("Please select a project for this task");
			return;
		}

		if (!startDate || !dueDate) {
			toast.error("Please select both start date and due date");
			return;
		}

		setIsSubmitting(true);
		try {
			const taskRes = await createTask({
				title: title.trim(),
				description: description.trim(),
				projectId: selectedProjectId,
				workspaceId,
				createdById: currentMemberId,
				priority: priority?.value || PriorityLevel.MEDIUM,
				status: Status.TODO,
				startPeriod: startDate,
				endPeriod: dueDate,
				memberIds: taskMembers,
				labels,
			});

			if (!taskRes.success) {
				toast.error(taskRes.message || "Failed to create task");
			} else {
				toast.success("Task created successfully!");
				if (onSuccess) onSuccess();
				router.refresh();
			}
		} catch (error: any) {
			toast.error("An error occurred while creating task");
		} finally {
			setIsSubmitting(false);
		}
	};

	const selectedProjectTitle =
		projects.find((p) => p.id === selectedProjectId)?.title ||
		"Select Project";

	return (
		<div
			className={`w-full text-left ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
		>
			<div className="flex flex-col md:flex-row gap-4">
				{/* Main Content Area: Title & Wysiwyg Editor */}
				<div className="mt-[20px] w-full md:w-[78%] shrink-0">
					<input
						disabled={isSubmitting}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						autoFocus
						placeholder="Task title"
						className="w-full outline-none bg-transparent placeholder:text-2xl md:placeholder:text-[40px] placeholder:font-bold text-2xl md:text-[40px] font-bold border-0 text-accent"
					/>
					<Separator className="bg-secondary/20 my-[10px]" />
					<div className="w-full mt-2">
						<Textarea
							disabled={isSubmitting}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Type a detailed description for your task..."
							className="w-full outline-none bg-transparent border-0 text-accent placeholder:text-accent/40 text-[12px] placeholder:text-[12px] min-h-[350px] max-h-[400px] resize-y p-0 focus-visible:ring-0 focus-visible:border-0 focus:outline-none"
						/>
					</div>
				</div>

				{/* Right Sidebar Options: Project, Priority, Members, Dates, Labels, Resources */}
				<div className="px-[10px] flex flex-row flex-wrap justify-center md:justify-start md:flex-col gap-2.5 py-[10px] w-full md:w-[20%] rounded-[20px]">
					{/* Project Selector */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full ${triggerOpacity(!!selectedProjectId)}`}
							>
								<Box className="w-4 h-4 shrink-0" />
								<span className="md:inline hidden truncate max-w-[120px]">
									{selectedProjectTitle}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-[200px] flex flex-col gap-1 border-0 bg-accent p-2 max-h-[220px] overflow-y-auto custom-scrollbar">
							<p className="text-[10px] font-bold text-primary/60 px-2 py-1 uppercase">
								Select Project
							</p>
							{projects.map((p) => {
								const isSelected = p.id === selectedProjectId;
								return (
									<div
										key={p.id}
										onClick={() => setSelectedProjectId(p.id)}
										className={`${isSelected ? "bg-primary text-accent font-semibold" : "bg-accent text-primary"} py-[6px] cursor-pointer transition-all rounded-[12px] px-[10px] hover:bg-primary hover:text-accent items-center justify-between flex text-xs`}
									>
										<span className="truncate">{p.title}</span>
										{isSelected && (
											<Check className="w-3 h-3 shrink-0" />
										)}
									</div>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Priority Level Selector */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full ${triggerOpacity(!!priority)}`}
							>
								{(() => {
									const Icon = priority?.icon ?? Gauge;
									return (
										<>
											<Icon className="w-4 h-4 shrink-0" />
											<span className="md:inline hidden">
												{priority?.title ??
													"Priority level"}
											</span>
										</>
									);
								})()}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-[160px] flex flex-col gap-1 border-0 bg-accent">
							{PRIORITY_LEVEL.map((i, k) => {
								const Icon: LucideIcon = i.icon;
								const isSelected = i.value === priority?.value;
								return (
									<div
										key={k}
										onClick={() =>
											setPriority({
												icon: i.icon,
												title: i.title,
												value: i.value,
											})
										}
										className={`${isSelected ? "bg-primary text-accent" : "bg-accent text-primary"} py-[4px] cursor-pointer transition-all rounded-[12px] px-[10px] hover:bg-primary hover:text-accent items-center justify-between flex`}
									>
										<div className="items-center gap-1.5 flex">
											<Icon className="w-4 h-4" />
											<p className="text-[13px]">
												{i.title}
											</p>
										</div>
										{isSelected && (
											<Check className="w-3 h-3" />
										)}
									</div>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Task Members / Assignees Selector */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full ${triggerOpacity(taskMembers.length > 0)}`}
							>
								<Users className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{taskMembers.length > 0 ?
										taskMembers.length + " Assignee(s)"
									:	"Assignees"}
								</p>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-[220px] border-0 bg-accent p-2">
							<div
								className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2"
								onPointerDown={(e) => e.stopPropagation()}
							>
								<Search className="w-3.5 h-3.5 text-primary/40 shrink-0" />
								<input
									disabled={isSubmitting}
									value={memberSearch}
									onChange={(e) =>
										setMemberSearch(e.target.value)
									}
									onKeyDown={(e) => e.stopPropagation()}
									placeholder="Search members..."
									className="flex-1 outline-none bg-transparent text-sm placeholder:text-primary/30 text-primary"
								/>
							</div>
							<div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
								{filteredProjectMembers.map((i) => (
									<div
										key={i.id}
										onClick={() => toggleMember(i.id)}
										className="cursor-pointer flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-primary/10 transition-colors"
									>
										<Checkbox
											disabled={isSubmitting}
											checked={taskMembers.includes(
												i.id,
											)}
										/>
										<div className="min-w-0">
											<p className="font-semibold text-[13px] text-primary truncate">
												{i.user?.fullName || "Member"}
											</p>
											<p className="text-[11px] text-primary/60 truncate">
												@{i.user?.userName || i.user?.email || "user"}
											</p>
										</div>
									</div>
								))}
								{filteredProjectMembers.length === 0 && (
									<div className="px-2 py-3 text-xs text-primary text-center">
										<p className="opacity-70 mb-1">
											{memberSearch.trim() ?
												"No project members match search."
											:	"No members assigned to this project."}
										</p>
										<p className="text-[10px] text-primary/60 italic">
											To assign members, add them to this project first.
										</p>
									</div>
								)}
							</div>
							<div className="mt-1.5 pt-1.5 border-t border-primary/10 px-2 text-[10px] text-primary/60 text-center">
								To assign new members, add them to the project first.
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Start Date Picker */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(!!startDate)}`}
							>
								<CalendarRange className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{startDate ?
										formatStartDate(startDate)
									:	"Start Date"}
								</p>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="rounded-[20px] bg-accent text-primary border-0">
							<Calendar
								mode="single"
								selected={startDate}
								onSelect={setStartDate}
								disabled={{ before: today }}
								className="bg-primary text-secondary"
								classNames={{
									root: "w-full",
									month: "text-primary",
									weekday: "w-full font-normal",
									nav: "text-primary flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
									day_button:
										"text-primary data-[selected-single=true]:text-secondary data-[selected-single=true]:font-semibold",
								}}
							/>
						</PopoverContent>
					</Popover>

					{/* Due Date Picker */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(!!dueDate)}`}
							>
								<Zap className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{dueDate ?
										formatStartDate(dueDate)
									:	"Due Date"}
								</p>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="rounded-[20px] bg-accent text-primary border-0">
							<Calendar
								mode="single"
								selected={dueDate}
								onSelect={setDueDate}
								disabled={{ before: minDueDate }}
								className="bg-primary text-secondary"
								classNames={{
									root: "w-full",
									month: "text-primary",
									weekday: "w-full font-normal",
									nav: "text-primary flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
									day_button:
										"text-primary data-[selected-single=true]:text-secondary data-[selected-single=true]:font-semibold",
								}}
							/>
						</PopoverContent>
					</Popover>

					{/* Labels Picker */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(labels.length > 0)}`}
							>
								<Hash />
								<p className="md:inline hidden">
									{labels.length > 0 ?
										`Labels (${labels.length})`
									:	"Labels"}
								</p>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="rounded-[20px] bg-accent text-primary border-0">
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<input
										disabled={isSubmitting}
										placeholder="Start typing with a hashtag..."
										className="flex-1 h-9 rounded-md text-[12px] bg-primary text-secondary px-2 text-sm outline-none"
										value={labelInput}
										onChange={(e) =>
											setLabelInput(e.currentTarget.value)
										}
										onKeyDown={(e) => {
											if (
												e.key !== "Enter" &&
												e.key !== " "
											)
												return;
											e.preventDefault();
											const tags =
												extractLabels(labelInput);
											addLabels(tags);
											setLabelInput("");
										}}
										onBlur={() => {
											const tags =
												extractLabels(labelInput);
											addLabels(tags);
											setLabelInput("");
										}}
									/>
								</div>
								<div className="flex flex-wrap gap-2">
									{labels.map((label) => (
										<span
											key={label}
											className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-secondary"
										>
											{label}
											<button
												type="button"
												className="text-secondary/70 hover:text-secondary"
												disabled={isSubmitting}
												onClick={() =>
													removeLabel(label)
												}
											>
												<X className="h-3 w-3" />
											</button>
										</span>
									))}
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{/* Resources Picker */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(resources.length > 0)}`}
							>
								<FolderSymlink className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{resources.length > 0 ?
										resources.length + " Resources"
									:	"Resources"}
								</p>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[260px] flex flex-col gap-2 rounded-[20px] bg-accent border-0 p-3">
							<p className="text-[11px] font-bold text-primary/60 uppercase">
								Add Resource Link
							</p>
							<input
								disabled={isSubmitting}
								value={resourceField.name}
								onChange={(e) =>
									setResourceField((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								placeholder="Resource name..."
								className="outline-none bg-primary/10 rounded-[8px] p-2 text-xs text-primary placeholder:text-primary/40"
							/>
							<input
								disabled={isSubmitting}
								value={resourceField.url}
								onChange={(e) =>
									setResourceField((prev) => ({
										...prev,
										url: e.target.value,
									}))
								}
								placeholder="https://..."
								className="outline-none bg-primary/10 rounded-[8px] p-2 text-xs text-primary placeholder:text-primary/40"
							/>
							<Button
								type="button"
								onClick={addResources}
								className="bg-primary text-secondary hover:bg-primary/90 text-xs rounded-full py-1 mt-1"
							>
								Add Link
							</Button>

							{resources.length > 0 && (
								<div className="flex flex-col gap-1.5 mt-2 max-h-[100px] overflow-y-auto custom-scrollbar border-t border-primary/10 pt-2">
									{resources.map((r) => (
										<div
											key={r.name}
											className="flex items-center justify-between text-xs text-primary bg-primary/5 p-1.5 rounded-[8px]"
										>
											<span className="truncate font-semibold max-w-[180px]">
												{r.name}
											</span>
											<X
												className="w-3.5 h-3.5 cursor-pointer text-primary/60 hover:text-primary"
												onClick={() =>
													removeResource(r.name)
												}
											/>
										</div>
									))}
								</div>
							)}
						</PopoverContent>
					</Popover>
				</div>
			</div>

			<Separator className="bg-secondary/20 my-[15px]" />

			{/* Footer Actions */}
			<div className="flex justify-end items-center gap-3">
				<DialogClose asChild>
					<Button
						type="button"
						variant="ghost"
						disabled={isSubmitting}
						className="rounded-full text-secondary hover:bg-secondary/20 text-sm font-semibold"
					>
						Cancel
					</Button>
				</DialogClose>
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="bg-accent text-primary rounded-full hover:bg-accent/80 font-bold px-6 text-sm"
				>
					{isSubmitting ?
						<div className="flex items-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Creating...</span>
						</div>
					:	"Create Task"}
				</Button>
			</div>
		</div>
	);
}
