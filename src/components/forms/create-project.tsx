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
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { createProject } from "@/lib/services/project.services";
import { MembersUsers } from "@/lib/types";
import {
	CalendarRange,
	Check,
	CircleSlash,
	FolderSymlink,
	Gauge,
	Globe,
	Hash,
	Loader2,
	LoaderCircle,
	Lock,
	LucideIcon,
	Search,
	User,
	Users,
	X,
	Zap,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PriorityLevel, ProjectVisibility } from "../../../generated/prisma/enums";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { DialogClose } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import WysiwygEditor from "../ui/wysiwyg-editor";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import Link from "next/link";

const PAGE_SIZE = 10;

export default function CreateProject({
	members,
	workspaceId,
	initialTotal,
}: {
	members: MembersUsers[];
	workspaceId: string;
	initialTotal: number;
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [priority, setPriority] = useState<{
		icon: LucideIcon;
		title: string;
		value: PriorityLevel;
	}>();

	const [visibility, setVisibility] = useState<ProjectVisibility>("PUBLIC");
	const [projectMembers, setProjectMembers] = useState<string[]>([]);
	const [projectLeadId, setProjectLeadId] = useState<string | undefined>();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [memberSearch, setMemberSearch] = useState("");
	const [memberPage, setMemberPage] = useState(1);
	const [displayedMembers, setDisplayedMembers] =
		useState<MembersUsers[]>(members);
	const [hasMoreMembers, setHasMoreMembers] = useState(
		members.length < initialTotal,
	);
	const [isFetchingMembers, setIsFetchingMembers] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const leadSentinelRef = useRef<HTMLDivElement>(null);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const isMounted = useRef(false);
	// Refs so the IntersectionObserver callback always reads the latest values
	const isFetchingRef = useRef(false);
	const memberPageRef = useRef(1);
	const hasMoreRef = useRef(members.length < initialTotal);
	const memberSearchRef = useRef("");
	const [labels, setLabels] = useState<string[]>([]);
	const [labelInput, setLabelInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
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
				name: resourceField.name!.trim(),
				url: resourceField.url!.trim(),
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
		setProjectMembers((prev) => {
			const next =
				prev.includes(id) ?
					prev.filter((m) => m !== id)
				:	[...prev, id];
			if (!next.includes(id) && projectLeadId === id) {
				setProjectLeadId(undefined);
			}
			return next;
		});
	};

	useEffect(() => {
		if (projectLeadId && !projectMembers.includes(projectLeadId)) {
			setProjectLeadId(undefined);
		}
	}, [projectLeadId, projectMembers]);

	// Debounced search -- resets list and fetches page 1
	useEffect(() => {
		memberSearchRef.current = memberSearch;
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}
		clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(async () => {
			setFetching(true);
			const res = await getMembersByWorkspaceId(
				1,
				PAGE_SIZE,
				workspaceId,
				memberSearchRef.current || undefined,
			);
			setDisplayedMembers(res.members as MembersUsers[]);
			const more = res.members.length === PAGE_SIZE;
			setHasMoreMembers(more);
			hasMoreRef.current = more;
			memberPageRef.current = 1;
			setMemberPage(1);
			setFetching(false);
		}, 300);
		return () => clearTimeout(searchTimerRef.current);
	}, [memberSearch, workspaceId]);

	// IntersectionObserver -- load next page when sentinel scrolls into view
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			async ([entry]) => {
				if (!entry.isIntersecting) return;
				if (isFetchingRef.current || !hasMoreRef.current) return;
				setFetching(true);
				const nextPage = memberPageRef.current + 1;
				const res = await getMembersByWorkspaceId(
					nextPage,
					PAGE_SIZE,
					workspaceId,
					memberSearchRef.current || undefined,
				);
				setDisplayedMembers((prev) => [
					...prev,
					...(res.members as MembersUsers[]),
				]);
				const more = res.members.length === PAGE_SIZE;
				setHasMoreMembers(more);
				hasMoreRef.current = more;
				memberPageRef.current = nextPage;
				setMemberPage(nextPage);
				setFetching(false);
			},
			{ threshold: 1.0 },
		);

		observer.observe(sentinel);
		if (leadSentinelRef.current) {
			observer.observe(leadSentinelRef.current);
		}
		return () => observer.disconnect();
	}, [workspaceId]);

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
	const handlSubmit = async () => {
		setIsSubmitting(true);
		try {
			const projectRes = await createProject({
				values: {
					description,
					dueDate: dueDate!,
					labels,
					priority: priority?.value!,
					projectLead: projectLeadId!,
					projectMembers,
					startDate: startDate!,
					title,
					visibility,
					resources: resources,
				},
			});

			if (!projectRes.success) {
				toast.error(projectRes.message);
			} else {
				toast.success(projectRes.message);
				router.push("/projects");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={`w-full text-left ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
		>
			<div className="flex flex-col md:flex-row gap-4">
				<div className="mt-[20px] w-full md:w-[78%] shrink-0">
					<input
						disabled={isSubmitting}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						autoFocus
						placeholder="Project title"
						className="w-full outline-none bg-transparent placeholder:text-2xl md:placeholder:text-[40px] placeholder:font-bold text-2xl md:text-[40px] font-bold border-0 text-accent placeholder:text-accent/50"
					/>
					<Separator className="bg-secondary/20 my-[10px]" />
					<div className="w-full mt-2">
						<WysiwygEditor
							disabled={isSubmitting}
							value={description}
							onChange={setDescription}
							placeholder="Type a detailed description for your project..."
							height="400px"
							maxHeight="400px"
							minHeight="350px"
							textColor="text-accent"
						/>
					</div>
				</div>

				<div className="px-[10px] flex flex-row flex-wrap justify-center md:justify-start md:flex-col gap-2.5 py-[10px] w-full md:w-[20%] rounded-[20px]">
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
											<Icon className="w-4 h-4" />
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

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full ${triggerOpacity(true)}`}
							>
								{visibility === "PUBLIC" ? (
									<>
										<Globe className="w-4 h-4" />
										<span className="md:inline hidden">
											Public
										</span>
									</>
								) : (
									<>
										<Lock className="w-4 h-4 text-amber-500" />
										<span className="md:inline hidden text-amber-500 font-medium">
											Private
										</span>
									</>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-[190px] flex flex-col gap-1 border-0 bg-accent p-1.5">
							<div
								onClick={() => setVisibility("PUBLIC" as ProjectVisibility)}
								className={`${visibility === "PUBLIC" ? "bg-primary text-accent" : "bg-accent text-primary"} py-[6px] cursor-pointer transition-all rounded-[10px] px-[10px] hover:bg-primary hover:text-accent items-center justify-between flex`}
							>
								<div className="flex flex-col">
									<div className="items-center gap-1.5 flex">
										<Globe className="w-3.5 h-3.5" />
										<p className="text-[13px] font-medium">Public</p>
									</div>
									<p className={`text-[11px] ${visibility === "PUBLIC" ? "text-accent/80" : "text-primary/60"}`}>
										Visible to workspace
									</p>
								</div>
								{visibility === "PUBLIC" && (
									<Check className="w-3 h-3 shrink-0" />
								)}
							</div>
							<div
								onClick={() => setVisibility("PRIVATE" as ProjectVisibility)}
								className={`${visibility === "PRIVATE" ? "bg-primary text-accent" : "bg-accent text-primary"} py-[6px] cursor-pointer transition-all rounded-[10px] px-[10px] hover:bg-primary hover:text-accent items-center justify-between flex`}
							>
								<div className="flex flex-col">
									<div className="items-center gap-1.5 flex">
										<Lock className="w-3.5 h-3.5" />
										<p className="text-[13px] font-medium">Private</p>
									</div>
									<p className={`text-[11px] ${visibility === "PRIVATE" ? "text-accent/80" : "text-primary/60"}`}>
										Assigned members only
									</p>
								</div>
								{visibility === "PRIVATE" && (
									<Check className="w-3 h-3 shrink-0" />
								)}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`bg-accent text-[13px] hover:bg-accent text-primary rounded-full ${triggerOpacity(projectMembers.length > 0)}`}
							>
								<Users />
								<p className="md:inline hidden">
									{projectMembers.length > 0 ?
										projectMembers.length +
										" Contributor(s)"
									:	"Contributors"}
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
									className="flex-1 outline-none bg-transparent text-sm placeholder:text-primary/30"
								/>
							</div>
							<div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
								{displayedMembers.map((i) => (
									<div
										key={i.id}
										onClick={() => toggleMember(i.id)}
										className="cursor-pointer flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-primary/10 transition-colors"
									>
										<Checkbox
											disabled={isSubmitting}
											checked={projectMembers.includes(
												i.id,
											)}
										/>
										<div>
											<p className="font-semibold text-[13px]">
												{i.user.fullName}
											</p>
											<p className="text-[13px] text-primary/60">
												@{i.user.userName}
											</p>
										</div>
									</div>
								))}
								{!isFetchingMembers &&
									displayedMembers.length === 0 && (
										<p className="px-2 py-3 text-xs text-primary text-center">
											{memberSearch.trim() ?
												"No members match your search."
											:	"No members in this workspace yet."
											}
										</p>
									)}
								{isFetchingMembers && (
									<div className="flex justify-center py-2">
										<Loader2 className="w-4 h-4 animate-spin text-primary/40" />
									</div>
								)}
								<div ref={sentinelRef} className="h-px" />
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(!!projectLeadId)}`}
							>
								<User />
								<p className="md:inline hidden">
									{projectLeadId ?
										((
											displayedMembers.find(
												(member) =>
													member.id === projectLeadId,
											) ||
											members.find(
												(member) =>
													member.id === projectLeadId,
											)
										)?.user.fullName ?? "Project Lead")
									:	"Project Lead"}
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
									className="flex-1 outline-none bg-transparent text-sm placeholder:text-primary/30"
								/>
							</div>
							<div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
								{displayedMembers
									.filter((member) =>
										projectMembers.includes(member.id),
									)
									.map((member) => (
										<div
											key={member.id}
											onClick={() =>
												setProjectLeadId(member.id)
											}
											className={`cursor-pointer flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-primary/10 transition-colors ${member.id === projectLeadId ? "bg-primary/10" : ""}`}
										>
											<Checkbox
												disabled={isSubmitting}
												checked={
													member.id === projectLeadId
												}
											/>
											<div>
												<p className="font-semibold text-[13px]">
													{member.user.fullName}
												</p>
												<p className="text-[13px] text-primary/60">
													@{member.user.userName}
												</p>
											</div>
										</div>
									))}
								{!isFetchingMembers &&
									projectMembers.length === 0 && (
										<div className="flex items-center gap-2 px-2 py-2 text-primary/50 text-xs">
											<CircleSlash className="w-4 h-4" />
											<p>
												Select contributors to assign a
												lead.
											</p>
										</div>
									)}
								{!isFetchingMembers &&
									projectMembers.length > 0 &&
									displayedMembers.filter((member) =>
										projectMembers.includes(member.id),
									).length === 0 && (
										<p className="px-2 py-3 text-xs text-primary text-center">
											No selected contributors match your
											search.
										</p>
									)}
								{isFetchingMembers && (
									<div className="flex justify-center py-2">
										<Loader2 className="w-4 h-4 animate-spin text-primary/40" />
									</div>
								)}
								<div ref={leadSentinelRef} className="h-px" />
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(!!startDate)}`}
							>
								<CalendarRange />
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

					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(!!dueDate)}`}
							>
								<Zap />
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

					<Popover>
						<PopoverTrigger asChild>
							<Button
								disabled={isSubmitting}
								className={`text-[13px] bg-accent hover:bg-accent text-primary rounded-full ${triggerOpacity(resources.length > 0)}`}
							>
								<FolderSymlink className="w-4 h-4 shrink-0" />
								<p className="md:inline hidden">
									{resources.length > 0 ?
										`Resources (${resources.length})`
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
								value={resourceField.name || ""}
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
								value={resourceField.url || ""}
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

			<div className="mt-[20px] flex justify-center md:justify-end gap-4">
				<DialogClose asChild>
					<Button
						disabled={isSubmitting}
						className="rounded-full hover:bg-accent bg-accent text-primary"
					>
						Close
					</Button>
				</DialogClose>
				<Button
					disabled={isSubmitting}
					onClick={() => handlSubmit()}
					className="rounded-full hover:bg-accent bg-accent text-primary"
				>
					{isSubmitting ?
						<div className=" flex items-center gap-3">
							<LoaderCircle className=" animate-spin" />
							Creating...
						</div>
					:	"Create Project"}
				</Button>
			</div>
		</div>
	);
}
