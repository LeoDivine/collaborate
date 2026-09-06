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
import { ProjectCombobox } from "@/components/shared/project-combobox";
import { getRecentProjectIds, saveRecentProjectId } from "@/lib/storage/recent-projects";
import {
	CalendarDays,
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
	Squircle,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PriorityLevel, Status } from "../../../generated/prisma/enums";
import { formatLabel } from "@/lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { DialogClose } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "../ui/badge";

const PAGE_SIZE = 10;

export default function CreateTask({
	projects = [],
	members = [],
	workspaceId,
	currentMemberId,
	initialTotal = 0,
	defaultProjectId,
	defaultStartDate,
	onSuccess,
}: {
	projects: Projects[];
	members: MembersUsers[];
	workspaceId: string;
	currentMemberId: string;
	initialTotal?: number;
	defaultProjectId?: string;
	defaultStartDate?: Date;
	onSuccess?: (createdTask?: any, createdActivity?: any) => void;
}) {
	const searchParams = useSearchParams();

	const parsedStartDateFromParams = useMemo(() => {
		if (defaultStartDate) return defaultStartDate;
		const param = searchParams?.get("startDate");
		if (!param) return undefined;
		const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(param);
		if (ymdMatch) {
			const year = parseInt(ymdMatch[1], 10);
			const month = parseInt(ymdMatch[2], 10) - 1;
			const day = parseInt(ymdMatch[3], 10);
			const d = new Date(year, month, day);
			if (!isNaN(d.getTime())) return d;
		}
		const parsed = new Date(param);
		return isNaN(parsed.getTime()) ? undefined : parsed;
	}, [defaultStartDate, searchParams]);

	const effectiveStartDate = defaultStartDate || parsedStartDateFromParams;
	const projectIdFromParam = searchParams?.get("projectId") || defaultProjectId;
	const initialProjectId = useMemo(() => {
		if (projectIdFromParam) return projectIdFromParam;
		const recents = getRecentProjectIds(workspaceId);
		if (recents.length > 0) {
			const validRecent = projects.find((p) => p.id === recents[0]);
			if (validRecent) return validRecent.id;
		}
		return projects[0]?.id || "";
	}, [projectIdFromParam, projects, workspaceId]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
	const [startDate, setStartDate] = useState<Date | undefined>(effectiveStartDate);

	const calendarDateRef = useRef<Date | undefined>(effectiveStartDate);
	const lastCheckedProjectIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (effectiveStartDate) {
			calendarDateRef.current = effectiveStartDate;
		}
	}, [effectiveStartDate]);
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

	const [milestones, setMilestones] = useState<
		{
			title: string;
			description?: string;
			dueDate?: Date;
		}[]
	>([]);
	const [milestoneField, setMilestoneField] = useState<{
		title: string;
		description?: string;
		dueDate?: Date;
	}>({ title: "", description: "", dueDate: undefined });

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

	// Project boundary dates
	const projectStartDate = useMemo(() => {
		if (!selectedProject?.startPeriod) return undefined;
		const d = new Date(selectedProject.startPeriod);
		d.setHours(0, 0, 0, 0);
		return d;
	}, [selectedProject]);

	const projectEndDate = useMemo(() => {
		if (!selectedProject?.endPeriod) return undefined;
		const d = new Date(selectedProject.endPeriod);
		d.setHours(23, 59, 59, 999);
		return d;
	}, [selectedProject]);

	const formatStartDate = (date: Date) =>
		date.toLocaleDateString(undefined, {
			month: "short",
			day: "2-digit",
			year: "numeric",
		});

	// Reset dates and milestones if they fall outside newly selected project, and notify user
	useEffect(() => {
		if (selectedProject) {
			const pStart = selectedProject.startPeriod ? new Date(selectedProject.startPeriod) : undefined;
			const pEnd = selectedProject.endPeriod ? new Date(selectedProject.endPeriod) : undefined;
			if (pStart) pStart.setHours(0, 0, 0, 0);
			if (pEnd) pEnd.setHours(23, 59, 59, 999);

			const calendarDate = calendarDateRef.current;
			const dateToCheck = startDate || calendarDate;

			if (dateToCheck) {
				const target = new Date(dateToCheck);
				target.setHours(12, 0, 0, 0);
				const isOutside = (pStart && target < pStart) || (pEnd && target > pEnd);

				if (isOutside) {
					setStartDate(undefined);
					setDueDate(undefined);
					setMilestones([]);

					if (lastCheckedProjectIdRef.current !== selectedProject.id) {
						lastCheckedProjectIdRef.current = selectedProject.id;
						toast.warning(
							`The selected date (${formatStartDate(dateToCheck)}) is outside the scope duration of "${selectedProject.title}". You can change the project or select a date within its duration.`,
							{ duration: 6000 }
						);
					}
				} else {
					if (calendarDate && !startDate) {
						setStartDate(calendarDate);
					}
					lastCheckedProjectIdRef.current = selectedProject.id;
				}
			}

			if (dueDate) {
				const dTarget = new Date(dueDate);
				dTarget.setHours(12, 0, 0, 0);
				if ((pStart && dTarget < pStart) || (pEnd && dTarget > pEnd)) {
					setDueDate(undefined);
					setMilestones([]);
				}
			}
		}
	}, [selectedProjectId, selectedProject]);

	const setFetching = (val: boolean) => {
		isFetchingRef.current = val;
		setIsFetchingMembers(val);
	};

	const extractLabels = (value: string) => {
		if (!value.trim()) return [];
		const hashTags = value.match(/#+[\w-]+/g);
		if (hashTags && hashTags.length > 0) {
			return hashTags;
		}
		return value
			.split(/[\s,]+/)
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
	};

	const addLabels = (values: string[]) => {
		const normalized = values
			.map((value) => formatLabel(value))
			.filter((value) => value.length > 1);
		if (normalized.length === 0) return;
		setLabels((prev) => {
			const next = new Set(prev.map(formatLabel));
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
		const target = formatLabel(label);
		setLabels((prev) => prev.filter((item) => formatLabel(item) !== target && item !== label));
	};

	const removeResource = (name: string) => {
		setResources((prev) => prev.filter((item) => item.name !== name));
	};

	const addMilestoneItem = () => {
		if (!milestoneField.title.trim()) {
			toast.error("Milestone title is required");
			return;
		}
		if (milestoneField.dueDate) {
			if (startDate && milestoneField.dueDate < startDate) {
				toast.error("Milestone date cannot be before task start date");
				return;
			}
			if (dueDate && milestoneField.dueDate > dueDate) {
				toast.error("Milestone date cannot be after task due date");
				return;
			}
		}
		setMilestones((prev) => [
			...prev,
			{
				title: milestoneField.title.trim(),
				description: milestoneField.description?.trim() || undefined,
				dueDate: milestoneField.dueDate || dueDate || (startDate ? new Date(startDate) : undefined),
			},
		]);
		setMilestoneField({ title: "", description: "", dueDate: undefined });
	};

	const removeMilestoneItem = (index: number) => {
		setMilestones((prev) => prev.filter((_, idx) => idx !== index));
	};

	const toggleMember = (id: string) => {
		setTaskMembers((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
		);
	};

	const startDateDisabled = useMemo(() => {
		const matchers: any[] = [];
		if (projectStartDate) {
			matchers.push({ before: projectStartDate });
		} else if (startDate && startDate < today) {
			matchers.push({ before: startDate });
		} else {
			matchers.push({ before: today });
		}
		const maxAllowed = dueDate && projectEndDate
			? (dueDate < projectEndDate ? dueDate : projectEndDate)
			: (dueDate || projectEndDate);
		if (maxAllowed) {
			matchers.push({ after: maxAllowed });
		}
		return matchers;
	}, [projectStartDate, projectEndDate, dueDate, today, startDate]);

	const minDueDate = useMemo(() => {
		if (startDate) {
			const d = new Date(startDate);
			d.setHours(0, 0, 0, 0);
			return d;
		}
		if (projectStartDate) {
			return projectStartDate;
		}
		return today;
	}, [startDate, projectStartDate, today]);

	const dueDateDisabled = useMemo(() => {
		const matchers: any[] = [];
		matchers.push({ before: minDueDate });
		if (projectEndDate) {
			matchers.push({ after: projectEndDate });
		}
		return matchers;
	}, [minDueDate, projectEndDate]);

	const milestoneDateDisabled = useMemo(() => {
		const matchers: any[] = [];
		const minM = startDate || projectStartDate || today;
		const maxM = dueDate || projectEndDate;
		if (minM) matchers.push({ before: minM });
		if (maxM) matchers.push({ after: maxM });
		return matchers;
	}, [startDate, dueDate, projectStartDate, projectEndDate, today]);

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

		if (selectedProject) {
			const pStart = selectedProject.startPeriod ? new Date(selectedProject.startPeriod) : undefined;
			const pEnd = selectedProject.endPeriod ? new Date(selectedProject.endPeriod) : undefined;
			if (pStart) pStart.setHours(0, 0, 0, 0);
			if (pEnd) pEnd.setHours(23, 59, 59, 999);

			if (pStart && startDate < pStart) {
				toast.error("Task start date cannot be before the project's start date");
				return;
			}
			if (pEnd && startDate > pEnd) {
				toast.error("Task start date cannot be after the project's end date");
				return;
			}
			if (pEnd && dueDate > pEnd) {
				toast.error("Task due date cannot be after the project's end date");
				return;
			}
		}

		if (dueDate < startDate) {
			toast.error("Task due date cannot be before start date");
			return;
		}

		for (const m of milestones) {
			if (m.dueDate) {
				if (m.dueDate < startDate || m.dueDate > dueDate) {
					toast.error(`Milestone "${m.title}" date must be within the task date range`);
					return;
				}
			}
		}

		let finalLabels = [...labels];
		if (labelInput.trim()) {
			const pending = extractLabels(labelInput);
			const normalized = pending
				.map((value) => formatLabel(value))
				.filter((value) => value.length > 1);
			const set = new Set([...finalLabels.map(formatLabel), ...normalized]);
			finalLabels = Array.from(set);
		}

		let finalResources = [...resources];
		if (
			resourceField?.name &&
			resourceField?.url &&
			resourceField.name.trim() &&
			resourceField.url.trim()
		) {
			finalResources.push({
				name: resourceField.name.trim(),
				url: resourceField.url.trim(),
			});
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
				labels: finalLabels,
				resources: finalResources,
				milestones,
			});

			if (!taskRes.success) {
				toast.error(taskRes.message || "Failed to create task");
			} else {
				saveRecentProjectId(workspaceId, selectedProjectId);
				toast.success("Task created successfully!");
				if (onSuccess) onSuccess(taskRes.task, taskRes.activity);
				router.refresh();
			}
		} catch (error: any) {
			toast.error("An error occurred while creating task");
		} finally {
			setIsSubmitting(false);
		}
	};

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
					<ProjectCombobox
						projects={projects}
						selectedProjectId={selectedProjectId}
						onSelectProject={(id) => setSelectedProjectId(id)}
						workspaceId={workspaceId}
						disabled={isSubmitting}
						variant="pill"
						triggerClassName={triggerOpacity(!!selectedProjectId)}
					/>

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
											checked={taskMembers.includes(i.id)}
										/>
										<div className="min-w-0">
											<p className="font-semibold text-[13px] text-primary truncate">
												{i.user?.fullName || "Member"}
											</p>
											<p className="text-[11px] text-primary/60 truncate">
												@
												{i.user?.userName ||
													i.user?.email ||
													"user"}
											</p>
										</div>
									</div>
								))}
								{filteredProjectMembers.length === 0 && (
									<div className="px-2 py-3 text-xs text-primary text-center">
										<p className="opacity-70 mb-1">
											{memberSearch.trim() ?
												"No project members match search."
											:	"No members assigned to this project."
											}
										</p>
										<p className="text-[10px] text-primary/60 italic">
											To assign members, add them to this
											project first.
										</p>
									</div>
								)}
							</div>
							<div className="mt-1.5 pt-1.5 border-t border-primary/10 px-2 text-[10px] text-primary/60 text-center">
								To assign new members, add them to the project
								first.
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
						<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-3">
							{projectStartDate && projectEndDate && (
								<div className="text-[11px] font-medium text-primary/70 text-center pb-2 mb-1 border-b border-primary/10">
									Project: {formatStartDate(projectStartDate)} – {formatStartDate(projectEndDate)}
								</div>
							)}
							<Calendar
								mode="single"
								selected={startDate}
								onSelect={(d) => {
									setStartDate(d);
									calendarDateRef.current = d;
								}}
								defaultMonth={startDate || projectStartDate || today}
								disabled={startDateDisabled}
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
						<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-3">
							{projectStartDate && projectEndDate && (
								<div className="text-[11px] font-medium text-primary/70 text-center pb-2 mb-1 border-b border-primary/10">
									Project: {formatStartDate(projectStartDate)} – {formatStartDate(projectEndDate)}
								</div>
							)}
							<Calendar
								mode="single"
								selected={dueDate}
								onSelect={setDueDate}
								defaultMonth={dueDate || startDate || projectStartDate || today}
								disabled={dueDateDisabled}
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
											className="inline-flex items-center gap-1 rounded-full bg-[#AD6B3D] px-2.5 py-0.5 text-xs text-white shadow-xs"
										>
											{formatLabel(label)}
											<button
												type="button"
												className="text-white/80 hover:text-white"
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
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addResources();
									}
								}}
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
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addResources();
									}
								}}
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

					{/* Milestones Picker */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(milestones.length > 0)}`}
							>
								<Squircle className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{milestones.length > 0 ?
										`${milestones.length} Milestone${milestones.length === 1 ? "" : "s"}`
									:	"Milestones"}
								</p>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[280px] flex flex-col gap-2.5 rounded-[20px] bg-accent border-0 p-3">
							<p className="text-[11px] font-bold text-primary/60 uppercase">
								Add Milestone
							</p>
							<input
								disabled={isSubmitting}
								placeholder="Milestone title..."
								value={milestoneField.title}
								onChange={(e) =>
									setMilestoneField((prev) => ({
										...prev,
										title: e.target.value,
									}))
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addMilestoneItem();
									}
								}}
								className="outline-none bg-primary/10 rounded-[8px] p-2 text-xs text-primary placeholder:text-primary/40"
							/>
							<input
								disabled={isSubmitting}
								placeholder="Description (optional)..."
								value={milestoneField.description || ""}
								onChange={(e) =>
									setMilestoneField((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								className="outline-none bg-primary/10 rounded-[8px] p-2 text-xs text-primary placeholder:text-primary/40"
							/>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										className="w-full justify-start text-left font-normal bg-primary/10 text-primary border-0 rounded-[8px] h-8 px-2 text-xs hover:bg-primary/20"
									>
										<CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary/60" />
										{milestoneField.dueDate ?
											formatStartDate(milestoneField.dueDate)
										:	<span className="text-primary/50 truncate">
												{startDate && dueDate ?
													`Date (${formatStartDate(startDate)} - ${formatStartDate(dueDate)})`
												:	"Date (within task range)"}
											</span>
										}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2 z-[99999]">
									{startDate && dueDate && (
										<div className="text-[11px] font-medium text-primary/70 text-center pb-2 mb-1 border-b border-primary/10">
											Task: {formatStartDate(startDate)} – {formatStartDate(dueDate)}
										</div>
									)}
									<Calendar
										mode="single"
										selected={milestoneField.dueDate}
										onSelect={(d) =>
											setMilestoneField((prev) => ({
												...prev,
												dueDate: d,
											}))
										}
										defaultMonth={milestoneField.dueDate || startDate || projectStartDate || today}
										disabled={milestoneDateDisabled}
										initialFocus
										className="bg-primary text-secondary"
									/>
								</PopoverContent>
							</Popover>
							<Button
								type="button"
								onClick={addMilestoneItem}
								className="bg-primary text-secondary hover:bg-primary/90 text-xs rounded-full py-1 mt-0.5"
							>
								Add Milestone
							</Button>

							{milestones.length > 0 && (
								<div className="flex flex-col gap-1.5 mt-1 max-h-[120px] overflow-y-auto custom-scrollbar border-t border-primary/10 pt-2">
									{milestones.map((m, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between text-xs text-primary bg-primary/5 p-1.5 rounded-[8px] gap-2"
										>
											<div className="flex flex-col min-w-0 flex-1">
												<span className="truncate font-semibold text-xs">
													{m.title}
												</span>
												{m.dueDate && (
													<span className="text-[10px] text-primary/60">
														{formatStartDate(m.dueDate)}
													</span>
												)}
											</div>
											<X
												className="w-3.5 h-3.5 cursor-pointer text-primary/60 hover:text-primary shrink-0"
												onClick={() => removeMilestoneItem(idx)}
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
						disabled={isSubmitting}
						className="rounded-full hover:bg-accent bg-accent text-primary"
					>
						Close
					</Button>
				</DialogClose>
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="bg-accent text-primary rounded-full hover:bg-accent/80 px-6 text-sm"
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
