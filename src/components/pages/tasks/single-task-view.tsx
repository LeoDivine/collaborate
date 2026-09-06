"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LEVEL } from "@/lib/const";
import {
	addMilestone,
	addTaskComment,
	addTaskResource,
	deleteMilestone,
	deleteTask,
	deleteTaskComment,
	deleteTaskResource,
	toggleMilestoneStatus,
	updateTaskComment,
	updateTaskDetails,
	updateTaskMembers,
	updateTaskResource,
} from "@/lib/services/task.services";
import { computeTaskAccess } from "@/lib/permissions/task-permissions";
import { useTaskRealtime } from "@/hooks/use-pusher";
import type { MembersUsers, Tasks } from "@/lib/types";
import { cn, formatLabel, formatPriority, formatStatus, getInitials, renderPriority, renderStatus, STATUS_OPTIONS } from "@/lib/utils";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
	Box,
	CalendarDays,
	ChartNoAxesColumn,
	Check,
	CheckSquare,
	ChevronDown,
	CircleCheck,
	CircleX,
	CornerDownRight,
	ExternalLink,
	Flag,
	Loader2,
	LoaderCircle,
	Lock,
	LucideIcon,
	MessageSquare,
	MoreHorizontal,
	MoveLeft,
	MoveRight,
	MoveUp,
	Paperclip,
	Pencil,
	PenLine,
	Plus,
	Search,
	Squircle,
	Tags,
	Trash2,
	Users,
	UserStar,
	Workflow,
	X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
	MileStoneStatus,
	PriorityLevel,
	Status,
} from "../../../../generated/prisma/enums";

function formatRelativeTime(date: Date | string): string {
	try {
		const distance = formatDistanceToNowStrict(new Date(date), {
			addSuffix: true,
		});
		return distance
			.replace(" seconds ago", "s ago")
			.replace(" second ago", "s ago")
			.replace(" minutes ago", "m ago")
			.replace(" minute ago", "m ago")
			.replace(" hours ago", "h ago")
			.replace(" hour ago", "h ago")
			.replace(" days ago", "d ago")
			.replace(" day ago", "d ago")
			.replace(" months ago", "mo ago")
			.replace(" month ago", "mo ago")
			.replace(" years ago", "y ago")
			.replace(" year ago", "y ago");
	} catch {
		return "";
	}
}

function safeFormatDate(
	date: Date | string | number | undefined | null,
	fmtString: string,
): string {
	if (!date) return "N/A";
	try {
		const d = new Date(date);
		if (isNaN(d.getTime())) return "N/A";
		return format(d, fmtString);
	} catch {
		return "N/A";
	}
}

export default function SingleTaskView({
	task: initialTask,
	workspaceId,
	currentUserId,
	members = [],
}: {
	task: Tasks;
	workspaceId?: string;
	currentUserId?: string;
	members?: MembersUsers[];
}) {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

	const [task, setTask] = useState<Tasks>(initialTask);

	// Editable Field States
	const [title, setTitle] = useState(task?.title || "");
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isSavingTitle, setIsSavingTitle] = useState(false);

	const [description, setDescription] = useState(task?.description || "");
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);

	const [status, setStatus] = useState<Status>(task?.status || Status.TODO);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	const [priority, setPriority] = useState<PriorityLevel>(
		task?.priority || PriorityLevel.MEDIUM,
	);
	const [isSavingPriority, setIsSavingPriority] = useState(false);

	const [startDate, setStartDate] = useState<Date>(() => {
		try {
			return task?.startPeriod ? new Date(task.startPeriod) : new Date();
		} catch {
			return new Date();
		}
	});
	const [isSavingStartDate, setIsSavingStartDate] = useState(false);

	const [dueDate, setDueDate] = useState<Date>(() => {
		try {
			return task?.endPeriod ? new Date(task.endPeriod) : new Date();
		} catch {
			return new Date();
		}
	});
	const [isSavingDueDate, setIsSavingDueDate] = useState(false);

	const [labels, setLabels] = useState<string[]>(
		(((task as any).Labels || (task as any).labels || []) as string[]).map(
			formatLabel,
		),
	);
	const [labelInput, setLabelInput] = useState("");
	const [isSavingLabels, setIsSavingLabels] = useState(false);

	const [readMore, setReadMore] = useState(false);

	// Member selection state
	const initialAssignees = task.taskMembers?.map((tm) => tm.memberId) || [];
	const [selectedMembers, setSelectedMembers] =
		useState<string[]>(initialAssignees);
	const [isSavingMembers, setIsSavingMembers] = useState(false);
	const [memberSearch, setMemberSearch] = useState("");

	// Compute Permissions
	const currentMember = (members || []).find(
		(m) =>
			(currentUserId && (m.userId === currentUserId || m.id === currentUserId)) ||
			(user?.id && (m.userId === user?.id || m.id === user?.id)),
	);
	const currentMemberId = currentMember?.id;

	const projectMembers = task.project?.projectMembers || [];
	const currentProjectMember = projectMembers.find(
		(pm) =>
			(currentMemberId && pm.memberId === currentMemberId) ||
			(currentUserId && (pm.member?.userId === currentUserId || pm.memberId === currentUserId)) ||
			(user?.id && (pm.member?.userId === user?.id || pm.memberId === user?.id)),
	);

	const isTaskCreator = Boolean(
		currentMemberId && task.createdById === currentMemberId,
	);
	const isTaskAssignee = Boolean(
		currentMemberId && selectedMembers.includes(currentMemberId),
	);

	const taskAccess = computeTaskAccess({
		workspaceRole: currentMember?.role,
		projectRole: currentProjectMember?.projectRole,
		isTaskCreator,
		isTaskAssignee,
	});

	const {
		canEditTask,
		canCommentOnTask,
		isInsideTask,
		canManageMembers,
		canDeleteTask,
	} = taskAccess;

	// Milestones
	const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
	const [milestoneTitle, setMilestoneTitle] = useState("");
	const [milestoneDescription, setMilestoneDescription] = useState("");
	const [milestoneDueDate, setMilestoneDueDate] = useState<Date | undefined>(
		undefined,
	);
	const [isAddingMilestone, setIsAddingMilestone] = useState(false);

	// Resources
	const [resources, setResources] = useState(task.resources || []);
	const [resourceField, setResourceField] = useState({ name: "", url: "" });
	const [isAddingResource, setIsAddingResource] = useState(false);
	const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
	const [deletingResourceId, setDeletingResourceId] = useState<string | null>(
		null,
	);

	// Comments state
	const [comments, setComments] = useState(task.comments || []);
	const [commentInput, setCommentInput] = useState("");
	const [isPostingComment, setIsPostingComment] = useState(false);

	const [replyingToCommentId, setReplyingToCommentId] = useState<
		string | null
	>(null);
	const [replyInput, setReplyInput] = useState("");
	const [isPostingReply, setIsPostingReply] = useState(false);

	const [editingCommentId, setEditingCommentId] = useState<string | null>(
		null,
	);
	const [editingMessage, setEditingMessage] = useState("");
	const [isSavingComment, setIsSavingComment] = useState(false);
	const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
		null,
	);

	// Dedicated activities state for real-time reactivity
	const [activities, setActivities] = useState<any[]>(task.activities || []);

	// Real-time Pusher subscription for all single task activities and updates
	useTaskRealtime(task.id, {
		onActivityCreated: ({ activity }) => {
			if (activity) {
				setActivities((prev) => {
					if (prev.some((a: any) => a.id === activity.id)) return prev;
					return [activity, ...prev];
				});
				setTask((prev) => {
					if ((prev.activities || []).some((a: any) => a.id === activity.id)) return prev;
					return {
						...prev,
						activities: [activity as any, ...(prev.activities || [])],
					};
				});
			}
		},
		onTaskUpdated: ({ updates, task: updatedTaskData }: any) => {
			if (updates?.title !== undefined) setTitle(updates.title as string);
			if (updates?.description !== undefined) setDescription(updates.description as string);
			if (updates?.status !== undefined) setStatus(updates.status as Status);
			if (updates?.priority !== undefined) setPriority(updates.priority as PriorityLevel);
			if (updates?.startPeriod !== undefined) setStartDate(new Date(updates.startPeriod as string | Date));
			if (updates?.endPeriod !== undefined) setDueDate(new Date(updates.endPeriod as string | Date));
			if (updates?.Labels !== undefined) setLabels(((updates.Labels as string[]) || []).map(formatLabel));
			if (updates?.labels !== undefined) setLabels(((updates.labels as string[]) || []).map(formatLabel));
			setTask((prev) => {
				let nextMilestones = prev.milestones;
				if (updatedTaskData?.milestones) {
					nextMilestones = updatedTaskData.milestones;
				} else if (updates?.status === Status.COMPLETED) {
					nextMilestones = (prev.milestones || []).map((m) => ({
						...m,
						status: MileStoneStatus.DONE,
					}));
				} else if (updates?.status === Status.IN_PROGRESS || updates?.status === Status.TODO) {
					nextMilestones = (prev.milestones || []).map((m) => ({
						...m,
						status: MileStoneStatus.NOT_STARTED,
						completedById: null,
					}));
				}

				return {
					...prev,
					...(updates || {}),
					...(updatedTaskData || {}),
					milestones: nextMilestones,
				};
			});
		},
		onCommentCreated: ({ comment }) => {
			setComments((prev: any[]) => {
				if (prev.some((c: any) => c.id === comment.id)) return prev;
				return [comment, ...prev];
			});
		},
		onCommentUpdated: ({ commentId, message, comment }) => {
			setComments((prev: any[]) =>
				prev.map((c: any) =>
					c.id === commentId ? (comment || { ...c, message }) : c,
				),
			);
		},
		onCommentDeleted: ({ commentId }) => {
			setComments((prev: any[]) =>
				prev.filter((c: any) => c.id !== commentId && c.replyCommentId !== commentId),
			);
		},
		onMilestoneCreated: ({ milestone }) => {
			if (milestone) {
				setTask((prev) => {
					if ((prev.milestones || []).some((m) => m.id === (milestone as any).id)) return prev;
					return {
						...prev,
						milestones: [...(prev.milestones || []), milestone as any],
					};
				});
			}
		},
		onMilestoneUpdated: ({ milestone, taskStatus }: any) => {
			if (taskStatus) {
				setStatus(taskStatus as Status);
			}
			if (milestone) {
				setTask((prev) => ({
					...prev,
					...(taskStatus ? { status: taskStatus as Status } : {}),
					milestones: (prev.milestones || []).map((m) =>
						m.id === (milestone as any).id ? (milestone as any) : m,
					),
				}));
			}
		},
		onMilestoneDeleted: ({ milestoneId }) => {
			if (milestoneId) {
				setTask((prev) => ({
					...prev,
					milestones: (prev.milestones || []).filter((m) => m.id !== milestoneId),
				}));
			}
		},
		onResourceAdded: ({ resource }) => {
			if (resource) {
				setResources((prev) => {
					if (prev.some((r) => r.id === (resource as any).id)) return prev;
					return [...prev, resource as any];
				});
				setTask((prev) => ({
					...prev,
					resources: [...(prev.resources || []), resource as any],
				}));
			}
		},
		onResourceUpdated: ({ resource }) => {
			if (resource) {
				setResources((prev) =>
					prev.map((r) => (r.id === (resource as any).id ? (resource as any) : r)),
				);
				setTask((prev) => ({
					...prev,
					resources: (prev.resources || []).map((r) =>
						r.id === (resource as any).id ? (resource as any) : r,
					),
				}));
			}
		},
		onResourceDeleted: ({ resourceId }) => {
			if (resourceId) {
				setResources((prev) => prev.filter((r) => r.id !== resourceId));
				setTask((prev) => ({
					...prev,
					resources: (prev.resources || []).filter((r) => r.id !== resourceId),
				}));
			}
		},
		onMembersUpdated: ({ memberIds }) => {
			if (memberIds) {
				setSelectedMembers(memberIds);
			}
		},
	});


	// Member Mention State & Handlers
	interface ActiveMention {
		targetId: string;
		query: string;
		cursorIndex: number;
		selectedIndex: number;
	}
	const [activeMention, setActiveMention] = useState<ActiveMention | null>(
		null,
	);

	const getMentionSuggestions = (query: string) => {
		const taskMembersList =
			(task.taskMembers || [])
				.map((tm: any) => tm.member)
				.filter((m: any) => m && m.user) || [];

		return taskMembersList
			.filter((m: any) => {
				const uName = m.user?.userName?.toLowerCase() || "";
				const fName = m.user?.fullName?.toLowerCase() || "";
				return uName.includes(query) || fName.includes(query);
			})
			.slice(0, 5);
	};

	const handleTextareaChange = (
		targetId: string,
		value: string,
		selectionStart: number,
		setValue: (val: string) => void,
	) => {
		setValue(value);
		const textBeforeCursor = value.slice(0, selectionStart);
		const lastAtIndex = textBeforeCursor.lastIndexOf("@");

		if (lastAtIndex !== -1) {
			const charBeforeAt =
				lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
			const queryCandidate = textBeforeCursor.slice(lastAtIndex + 1);

			if (
				(lastAtIndex === 0 || /\s/.test(charBeforeAt)) &&
				!/\s/.test(queryCandidate)
			) {
				setActiveMention({
					targetId,
					query: queryCandidate.toLowerCase(),
					cursorIndex: selectionStart,
					selectedIndex: 0,
				});
				return;
			}
		}
		if (activeMention?.targetId === targetId) {
			setActiveMention(null);
		}
	};

	const insertMention = (
		targetId: string,
		currentValue: string,
		username: string,
		setValue: (val: string) => void,
	) => {
		if (!activeMention) return;
		const textBeforeCursor = currentValue.slice(
			0,
			activeMention.cursorIndex,
		);
		const lastAtIndex = textBeforeCursor.lastIndexOf("@");
		if (lastAtIndex === -1) return;

		const textAfterCursor = currentValue.slice(activeMention.cursorIndex);
		const newValue = `${currentValue.slice(0, lastAtIndex)}@${username} ${textAfterCursor}`;
		setValue(newValue);
		setActiveMention(null);
	};

	/**
	 * Handles ArrowUp / ArrowDown / Enter keyboard navigation inside the mention dropdown.
	 * Returns true if the event was consumed (caller should e.preventDefault() and stop).
	 */
	const handleMentionKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
		targetId: string,
		currentValue: string,
		setValue: (val: string) => void,
	): boolean => {
		if (!activeMention || activeMention.targetId !== targetId) return false;
		const suggestions = getMentionSuggestions(activeMention.query);
		if (suggestions.length === 0) return false;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveMention((prev) =>
				prev ?
					{
						...prev,
						selectedIndex:
							(prev.selectedIndex + 1) % suggestions.length,
					}
				:	prev,
			);
			return true;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveMention((prev) =>
				prev ?
					{
						...prev,
						selectedIndex:
							(prev.selectedIndex - 1 + suggestions.length) %
							suggestions.length,
					}
				:	prev,
			);
			return true;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			const chosen = suggestions[activeMention.selectedIndex];
			if (chosen) {
				insertMention(
					targetId,
					currentValue,
					chosen.user?.userName || "user",
					setValue,
				);
			}
			return true;
		}
		return false;
	};

	const renderMentionDropdown = (
		targetId: string,
		currentValue: string,
		setValue: (val: string) => void,
	) => {
		if (!activeMention || activeMention.targetId !== targetId) return null;
		const suggestions = getMentionSuggestions(activeMention.query);
		if (suggestions.length === 0) return null;

		const activeEl =
			typeof document !== "undefined" ?
				(document.activeElement as HTMLElement | null)
			:	null;
		const rect = activeEl?.getBoundingClientRect();

		const style: React.CSSProperties =
			rect ?
				{
					position: "fixed",
					top: `${Math.max(10, rect.top - 195)}px`,
					left: `${rect.left + 8}px`,
					zIndex: 99999,
				}
			:	{
					position: "absolute",
					bottom: "100%",
					left: "8px",
					zIndex: 99999,
				};

		return (
			<div
				style={style}
				className="w-[230px] bg-accent border border-primary/20 rounded-[15px] shadow-2xl p-1.5 max-h-[190px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
			>
				<p className="px-2 py-0.5 text-[10px] font-semibold text-primary/60 uppercase">
					Mention Member
				</p>
				{suggestions.map((m: any, idx: number) => {
					const isSelected = idx === activeMention.selectedIndex;
					const displayName = m.user?.fullName || "Member";
					const username = m.user?.userName || "user";

					return (
						<div
							key={m.id}
							onMouseDown={(e) => {
								e.preventDefault();
								insertMention(
									targetId,
									currentValue,
									username,
									setValue,
								);
							}}
							className={`flex items-center gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer text-xs transition-colors ${
								isSelected ?
									"bg-primary text-secondary"
								:	"hover:bg-primary/10 text-primary"
							}`}
						>
							<Avatar className="w-5 h-5 shrink-0">
								<AvatarFallback className="w-full h-full text-[9px] bg-primary text-secondary font-bold">
									{getInitials(displayName)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col min-w-0">
								<span className="font-semibold truncate leading-tight">
									{displayName}
								</span>
								<span className="text-[10px] opacity-70 truncate">
									@{username}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const renderMessageWithMentions = (msg: string) => {
		if (!msg) return null;
		const parts = msg.split(/(@[\w.-]+)/g);
		return parts.map((part, idx) => {
			if (part.startsWith("@")) {
				const usernameWithoutAt = part.slice(1);
				const taskMembersList =
					(task.taskMembers || [])
						.map((tm: any) => tm.member)
						.filter((m: any) => m && m.user) || [];
				const matchedMember = taskMembersList.find(
					(m: any) =>
						m.user?.userName?.toLowerCase() ===
						usernameWithoutAt.toLowerCase(),
				);

				if (matchedMember && matchedMember.user) {
					const user = matchedMember.user;
					const displayName = user.fullName || "Member";

					return (
						<HoverCard key={idx} openDelay={10} closeDelay={100}>
							<HoverCardTrigger asChild>
								<span className="font-semibold text-accent bg-secondary/20 px-1 py-0.5 rounded-[6px] mx-0.5 cursor-pointer hover:underline inline-block">
									{part}
								</span>
							</HoverCardTrigger>
							<HoverCardContent className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5 z-[99999]">
								<div className="items-center flex gap-4">
									<div className="flex text-accent w-[50px] h-[50px] font-extrabold text-[20px] items-center justify-center rounded-full bg-primary shrink-0">
										{getInitials(displayName)}
									</div>
									<div>
										{user.userName && (
											<p className="font-semibold text-[13px]">
												@{user.userName}
											</p>
										)}
										<p className="font-semibold">
											{displayName}
										</p>
										{user.email && (
											<p className="text-[13px]">
												{user.email}
											</p>
										)}
									</div>
								</div>
								{matchedMember.role && (
									<Badge className="mt-[10px] text-[10px] w-fit">
										{matchedMember.role.replace(/_/g, " ")}
									</Badge>
								)}
							</HoverCardContent>
						</HoverCard>
					);
				}

				// Unmatched @mention — still style it
				return (
					<span
						key={idx}
						className="font-semibold text-accent bg-secondary/20 px-1 py-0.5 rounded-[6px] mx-0.5 inline-block"
					>
						{part}
					</span>
				);
			}
			return part;
		});
	};

	// Delete Task modal
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
	const [isDeletingTask, setIsDeletingTask] = useState(false);

	// Creator Name
	const creatorUser = task.createdBy?.user;
	const activeUserId = currentUserId || user?.id;
	const isCreatorYou =
		activeUserId ?
			task.createdBy?.userId === activeUserId ||
			creatorUser?.id === activeUserId ||
			(Boolean(currentMember?.id) &&
				(task.createdById === currentMember?.id ||
					task.createdBy?.id === currentMember?.id))
		:	false;
	const creatorName =
		isCreatorYou ? "YOU" : (
			creatorUser?.fullName ||
			creatorUser?.userName ||
			creatorUser?.email ||
			"Creator"
		);

	// Calculate milestone metrics
	const totalMilestones = task.milestones?.length || 0;
	const completedMilestones =
		task.milestones?.filter((m) => m.status === MileStoneStatus.DONE)
			.length || 0;
	const milestonePercent =
		totalMilestones > 0 ?
			Math.round((completedMilestones / totalMilestones) * 100)
		: status === Status.COMPLETED ? 100
		: 0;

	// Save Title
	const handleSaveTitle = async () => {
		if (!title.trim() || title === task.title) {
			setIsEditingTitle(false);
			setTitle(task.title);
			return;
		}
		setIsSavingTitle(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { title: title.trim() },
			memberId: currentMember?.id,
		});
		setIsSavingTitle(false);
		if (res.success) {
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => ({
				...prev,
				title: title.trim(),
				activities:
					res.activity ?
						((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
							(prev.activities || [])
						:	[res.activity as any, ...(prev.activities || [])])
					:	prev.activities,
			}));
			setIsEditingTitle(false);
			toast.success("Task title updated");
		} else {
			toast.error(res.message || "Failed to update title");
		}
	};

	// Save Description
	const handleSaveDescription = async () => {
		if (description === task.description) {
			setIsEditingDescription(false);
			return;
		}
		setIsSavingDescription(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { description: description.trim() },
			memberId: currentMember?.id,
		});
		setIsSavingDescription(false);
		if (res.success) {
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => ({
				...prev,
				description: description.trim(),
				activities:
					res.activity ?
						((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
							(prev.activities || [])
						:	[res.activity as any, ...(prev.activities || [])])
					:	prev.activities,
			}));
			setIsEditingDescription(false);
			toast.success("Task description updated");
		} else {
			toast.error(res.message || "Failed to update description");
		}
	};

	// Update Status
	const handleUpdateStatus = async (nextStatus: Status) => {
		if (nextStatus === status) return;
		setIsSavingStatus(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { status: nextStatus },
			memberId: currentMember?.id,
		});
		setIsSavingStatus(false);
		if (res.success) {
			setStatus(nextStatus);
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => {
				let nextMilestones = prev.milestones;
				if (res.task && (res.task as any).milestones) {
					nextMilestones = (res.task as any).milestones;
				} else if (nextStatus === Status.COMPLETED) {
					nextMilestones = (prev.milestones || []).map((m) => ({
						...m,
						status: MileStoneStatus.DONE,
						...(currentMember?.id ? { completedById: currentMember.id } : {}),
					}));
				} else if (nextStatus === Status.IN_PROGRESS || nextStatus === Status.TODO) {
					nextMilestones = (prev.milestones || []).map((m) => ({
						...m,
						status: MileStoneStatus.NOT_STARTED,
						completedById: null,
					}));
				}

				return {
					...prev,
					status: nextStatus,
					milestones: nextMilestones,
					activities:
						res.activity ?
							((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
								(prev.activities || [])
							:	[res.activity as any, ...(prev.activities || [])])
						:	prev.activities,
				};
			});
			toast.success(
				`Status updated to ${formatStatus(nextStatus)}`,
			);
			if (res.projectAutoCompleted) {
				toast.success(
					"All tasks completed! Project marked as Completed.",
				);
			} else if (res.projectSetToInProgress) {
				toast.success(
					"Task moved from To Do! Project status set to In Progress.",
				);
			}
		} else {
			toast.error(res.message || "Failed to update status");
		}
	};

	// Update Priority
	const handleUpdatePriority = async (nextPriority: PriorityLevel) => {
		if (nextPriority === priority) return;
		setIsSavingPriority(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { priority: nextPriority },
			memberId: currentMember?.id,
		});
		setIsSavingPriority(false);
		if (res.success) {
			setPriority(nextPriority);
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => ({
				...prev,
				priority: nextPriority,
				activities:
					res.activity ?
						((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
							(prev.activities || [])
						:	[res.activity as any, ...(prev.activities || [])])
					:	prev.activities,
			}));
			toast.success(`Priority updated to ${formatPriority(nextPriority)}`);
		} else {
			toast.error(res.message || "Failed to update priority");
		}
	};

	// Update Start Date
	const handleUpdateStartDate = async (date: Date | undefined) => {
		if (!date) return;
		const projStart = task.project?.startPeriod ? new Date(task.project.startPeriod) : undefined;
		const projEnd = task.project?.endPeriod ? new Date(task.project.endPeriod) : undefined;
		if (projStart) projStart.setHours(0, 0, 0, 0);
		if (projEnd) projEnd.setHours(23, 59, 59, 999);

		if (projStart && date < projStart) {
			toast.error("Task start date cannot be before project start date");
			return;
		}
		if (projEnd && date > projEnd) {
			toast.error("Task start date cannot be after project end date");
			return;
		}
		if (dueDate && date > dueDate) {
			toast.error("Task start date cannot be after due date");
			return;
		}
		const hasEarlierMilestone = (task.milestones || []).some(
			(m) => m.dueDate && new Date(m.dueDate) < date,
		);
		if (hasEarlierMilestone) {
			toast.error("Cannot set start date after an existing milestone date");
			return;
		}

		setIsSavingStartDate(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { startPeriod: date },
			memberId: currentMember?.id,
		});
		setIsSavingStartDate(false);
		if (res.success) {
			setStartDate(date);
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => ({
				...prev,
				startPeriod: date,
				activities:
					res.activity ?
						((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
							(prev.activities || [])
						:	[res.activity as any, ...(prev.activities || [])])
					:	prev.activities,
			}));
			toast.success("Start date updated");
		} else {
			toast.error(res.message || "Failed to update start date");
		}
	};

	// Update Due Date
	const handleUpdateDueDate = async (date: Date | undefined) => {
		if (!date) return;
		const projEnd = task.project?.endPeriod ? new Date(task.project.endPeriod) : undefined;
		if (projEnd) projEnd.setHours(23, 59, 59, 999);

		if (startDate && date < startDate) {
			toast.error("Task due date cannot be before start date");
			return;
		}
		if (projEnd && date > projEnd) {
			toast.error("Task due date cannot be after project end date");
			return;
		}
		const hasLaterMilestone = (task.milestones || []).some(
			(m) => m.dueDate && new Date(m.dueDate) > date,
		);
		if (hasLaterMilestone) {
			toast.error("Cannot set due date before an existing milestone date");
			return;
		}

		setIsSavingDueDate(true);
		const res = await updateTaskDetails({
			taskId: task.id,
			values: { endPeriod: date },
			memberId: currentMember?.id,
		});
		setIsSavingDueDate(false);
		if (res.success) {
			setDueDate(date);
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => ({
				...prev,
				endPeriod: date,
				activities:
					res.activity ?
						((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
							(prev.activities || [])
						:	[res.activity as any, ...(prev.activities || [])])
					:	prev.activities,
			}));
			toast.success("Due date updated");
		} else {
			toast.error(res.message || "Failed to update due date");
		}
	};

	// Auto-save labels helper
	const handleSaveLabels = async (newLabels: string[]) => {
		setLabels(newLabels);
		setIsSavingLabels(true);
		try {
			const res = await updateTaskDetails({
				taskId: task.id,
				values: { Labels: newLabels },
				memberId: currentMember?.id,
			});
			if (res.success) {
				toast.success("Labels updated");
				if (res.activity) {
					setActivities((prev) => {
						if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
						return [res.activity as any, ...prev];
					});
				}
				setTask((prev) => ({
					...prev,
					Labels: newLabels,
					activities:
						res.activity ?
							((prev.activities || []).some((a) => a.id === (res.activity as any).id) ?
								(prev.activities || [])
							:	[res.activity as any, ...(prev.activities || [])])
						:	prev.activities,
				}));
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update labels");
				setLabels((((task as any).Labels || (task as any).labels || []) as string[]).map(formatLabel));
			}
		} catch (e) {
			toast.error("Error updating labels");
			setLabels((((task as any).Labels || (task as any).labels || []) as string[]).map(formatLabel));
		} finally {
			setIsSavingLabels(false);
		}
	};

	const extractLabels = (value: string) => {
		const hashTags = value.match(/#+[\w-]+/g);
		if (hashTags && hashTags.length > 0) {
			return hashTags;
		}
		return value
			.split(/[\s,]+/)
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
	};

	const addLabels = (valuesToAdd: string[]) => {
		const normalized = valuesToAdd
			.map((v) => formatLabel(v))
			.filter((v) => v.length > 1);
		if (normalized.length === 0) return;
		const nextSet = Array.from(new Set([...labels.map(formatLabel), ...normalized]));
		handleSaveLabels(nextSet);
	};

	const removeLabel = (labelToRemove: string) => {
		const target = formatLabel(labelToRemove);
		const updated = labels.filter((l) => formatLabel(l) !== target && l !== labelToRemove);
		handleSaveLabels(updated);
	};

	// Save Milestone
	const handleAddMilestone = async () => {
		if (!milestoneTitle.trim()) {
			toast.error("Milestone title is required");
			return;
		}

		const taskStart = startDate ? new Date(startDate) : new Date(task.startPeriod);
		taskStart.setHours(0, 0, 0, 0);
		const taskEnd = dueDate ? new Date(dueDate) : new Date(task.endPeriod);
		taskEnd.setHours(23, 59, 59, 999);

		if (milestoneDueDate) {
			if (milestoneDueDate < taskStart || milestoneDueDate > taskEnd) {
				toast.error("Milestone date must be within the task date range");
				return;
			}
		}

		setIsAddingMilestone(true);
		const res = await addMilestone({
			taskId: task.id,
			title: milestoneTitle.trim(),
			description: milestoneDescription.trim() || undefined,
			dueDate: milestoneDueDate || undefined,
		});
		setIsAddingMilestone(false);
		if (res.success && res.milestone) {
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => {
				const hasMilestone = (prev.milestones || []).some(
					(m) => m.id === (res.milestone as any).id,
				);
				const hasActivity = res.activity ?
					(prev.activities || []).some((a) => a.id === (res.activity as any).id)
					: true;

				return {
					...prev,
					milestones: hasMilestone ?
						(prev.milestones || [])
					:	[...(prev.milestones || []), res.milestone as any],
					activities: res.activity && !hasActivity ?
						[res.activity as any, ...(prev.activities || [])]
					:	(prev.activities || []),
				};
			});
			setMilestoneTitle("");
			setMilestoneDescription("");
			setMilestoneDueDate(undefined);
			setIsMilestoneDialogOpen(false);
			toast.success("Milestone created");
		} else {
			toast.error(res.message || "Failed to add milestone");
		}
	};

	// Toggle Milestone
	const handleToggleMilestone = async (
		mId: string,
		currentStatus: MileStoneStatus,
	) => {
		const nextStatus =
			currentStatus === MileStoneStatus.DONE ?
				MileStoneStatus.NOT_STARTED
			:	MileStoneStatus.DONE;
		const res = await toggleMilestoneStatus({
			milestoneId: mId,
			status: nextStatus,
		});
		if (res.success) {
			const updatedTaskStatus =
				res.taskStatus ||
				(res.taskAutoCompleted ? Status.COMPLETED
				: res.taskSetToInProgress ? Status.IN_PROGRESS
				: undefined);
			if (updatedTaskStatus) {
				setStatus(updatedTaskStatus);
			}
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => {
				const hasActivity = res.activity ?
					(prev.activities || []).some((a) => a.id === (res.activity as any).id)
					: true;

				return {
					...prev,
					...(updatedTaskStatus ? { status: updatedTaskStatus } : {}),
					milestones: (prev.milestones || []).map((m) =>
						m.id === mId ? { ...m, status: nextStatus } : m,
					),
					activities: res.activity && !hasActivity ?
						[res.activity as any, ...(prev.activities || [])]
					:	(prev.activities || []),
				};
			});
			if (res.taskAutoCompleted) {
				toast.success(
					"All milestones completed! Task marked as Completed.",
				);
			} else if (res.taskSetToInProgress) {
				toast.success(
					"Milestone completed! Task status changed to In Progress.",
				);
			}
			if (res.projectAutoCompleted) {
				toast.success(
					"All tasks completed! Project marked as Completed.",
				);
			} else if (res.projectSetToInProgress) {
				toast.success(
					"Task moved from To Do! Project status changed to In Progress.",
				);
			}
		} else {
			toast.error(res.message || "Failed to update milestone");
		}
	};

	// Delete Milestone
	const handleDeleteMilestone = async (mId: string) => {
		const res = await deleteMilestone(mId);
		if (res.success) {
			const autoCompletedTask =
				res.taskAutoCompleted || res.taskStatus === Status.COMPLETED;
			if (autoCompletedTask) {
				setStatus(Status.COMPLETED);
			}
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => {
				const hasActivity = res.activity ?
					(prev.activities || []).some((a) => a.id === (res.activity as any).id)
					: true;

				return {
					...prev,
					...(autoCompletedTask ? { status: Status.COMPLETED } : {}),
					milestones: (prev.milestones || []).filter((m) => m.id !== mId),
					activities: res.activity && !hasActivity ?
						[res.activity as any, ...(prev.activities || [])]
					:	(prev.activities || []),
				};
			});
			toast.success("Milestone deleted");
			if (res.taskAutoCompleted) {
				toast.success(
					"All milestones completed! Task marked as Completed.",
				);
			}
			if (res.projectAutoCompleted) {
				toast.success(
					"All tasks completed! Project marked as Completed.",
				);
			}
		} else {
			toast.error(res.message || "Failed to delete milestone");
		}
	};

	// Toggle Task Member Assignees
	const toggleAssigneeMember = async (memberId: string) => {
		const next =
			selectedMembers.includes(memberId) ?
				selectedMembers.filter((id) => id !== memberId)
			:	[...selectedMembers, memberId];
		setSelectedMembers(next);
		setIsSavingMembers(true);
		const res = await updateTaskMembers({
			taskId: task.id,
			memberIds: next,
			actorMemberId: currentMember?.id,
		});
		setIsSavingMembers(false);
		if (res.success) {
			const updatedMembers = members
				.filter((m) => next.includes(m.id))
				.map((m) => ({
					id: `tm-${m.id}`,
					taskId: task.id,
					memberId: m.id,
					assignedAt: new Date(),
					member: m,
				}));
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
			}
			setTask((prev) => {
				const hasActivity = res.activity ?
					(prev.activities || []).some((a) => a.id === (res.activity as any).id)
					: true;

				return {
					...prev,
					taskMembers: updatedMembers as any,
					activities: res.activity && !hasActivity ?
						[res.activity as any, ...(prev.activities || [])]
					:	(prev.activities || []),
				};
			});
			toast.success("Assignees updated");
		} else {
			toast.error(res.message || "Failed to update assignees");
		}
	};

	// Add Resource
	const handleAddResource = async () => {
		if (!resourceField.name.trim() || !resourceField.url.trim()) return;
		let url = resourceField.url.trim();
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			url = `https://${url}`;
		}
		setIsAddingResource(true);
		const res = await addTaskResource({
			taskId: task.id,
			name: resourceField.name.trim(),
			url,
		});
		setIsAddingResource(false);
		if (res.success && res.resource) {
			setResources((prev) => {
				if (prev.some((r) => r.id === (res.resource as any).id)) return prev;
				return [...prev, res.resource!];
			});
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
				setTask((prev) => {
					const hasActivity = (prev.activities || []).some(
						(a) => a.id === (res.activity as any).id,
					);
					return {
						...prev,
						activities: hasActivity ?
							(prev.activities || [])
						:	[res.activity!, ...(prev.activities || [])],
					};
				});
			}
			setResourceField({ name: "", url: "" });
			setIsAddResourceOpen(false);
			toast.success("Resource added");
		} else {
			toast.error(res.message || "Failed to add resource");
		}
	};

	// Update Resource
	const handleUpdateResourceItem = async (
		resourceId: string,
		name: string,
		url: string,
	) => {
		const res = await updateTaskResource({
			resourceId,
			name,
			url,
			currentTaskId: task.id,
		});
		if (res.success && res.resource) {
			setResources((prev) =>
				prev.map((r) => (r.id === resourceId ? res.resource! : r)),
			);
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
				setTask((prev) => {
					const hasActivity = (prev.activities || []).some(
						(a) => a.id === (res.activity as any).id,
					);
					return {
						...prev,
						activities: hasActivity ?
							(prev.activities || [])
						:	[res.activity!, ...(prev.activities || [])],
					};
				});
			}
			toast.success("Resource updated");
		} else {
			toast.error(res.message || "Failed to update resource");
		}
	};

	// Delete Resource
	const handleDeleteResource = async (rId: string) => {
		setDeletingResourceId(rId);
		const res = await deleteTaskResource(rId, task.id);
		setDeletingResourceId(null);
		if (res.success) {
			setResources((prev) => prev.filter((r) => r.id !== rId));
			if (res.activity) {
				setActivities((prev) => {
					if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
					return [res.activity as any, ...prev];
				});
				setTask((prev) => {
					const hasActivity = (prev.activities || []).some(
						(a) => a.id === (res.activity as any).id,
					);
					return {
						...prev,
						activities: hasActivity ?
							(prev.activities || [])
						:	[res.activity!, ...(prev.activities || [])],
					};
				});
			}
			toast.success("Resource removed");
		} else {
			toast.error(res.message || "Failed to remove resource");
		}
	};

	// Post Main Comment
	const handleAddComment = async () => {
		const message = commentInput.trim();
		if (!message || isPostingComment) return;
		setIsPostingComment(true);
		try {
			const res = await addTaskComment({
				taskId: task.id,
				message,
			});
			if (res.success && "comment" in res && res.comment) {
				toast.success("Comment posted");
				setComments((prev) => {
					if (prev.some((c) => c.id === (res.comment as any).id)) return prev;
					return [res.comment as any, ...prev];
				});
				if ("activity" in res && res.activity) {
					setActivities((prev) => {
						if (prev.some((a) => a.id === (res.activity as any).id)) return prev;
						return [res.activity as any, ...prev];
					});
					setTask((prev) => {
						const hasActivity = (prev.activities || []).some(
							(a) => a.id === (res.activity as any).id,
						);
						return {
							...prev,
							activities: hasActivity ?
								(prev.activities || [])
							:	[res.activity as any, ...(prev.activities || [])],
						};
					});
				}
				setCommentInput("");
			} else {
				toast.error(res.message || "Failed to post comment");
			}
		} catch {
			toast.error("Error posting comment");
		} finally {
			setIsPostingComment(false);
		}
	};

	// Edit Comment
	const handleEditComment = (commentId: string, currentMessage: string) => {
		setEditingCommentId(commentId);
		setEditingMessage(currentMessage);
	};

	const handleSaveEditComment = async (commentId: string) => {
		if (!editingMessage.trim()) return;
		setIsSavingComment(true);
		try {
			const res = await updateTaskComment({
				commentId,
				message: editingMessage,
			});
			if (res.success && "comment" in res && res.comment) {
				toast.success("Comment updated");
				setComments((prev) =>
					prev.map((c) =>
						c.id === commentId ? (res.comment as any) : c,
					),
				);
				if ("activity" in res && res.activity) {
					setTask((prev) => ({
						...prev,
						activities: [
							res.activity as any,
							...(prev.activities || []),
						],
					}));
				}
				setEditingCommentId(null);
				setEditingMessage("");
			} else {
				toast.error(res.message || "Failed to update comment");
			}
		} catch {
			toast.error("Error updating comment");
		} finally {
			setIsSavingComment(false);
		}
	};

	// Delete Comment
	const handleDeleteComment = async (commentId: string) => {
		setDeletingCommentId(commentId);
		try {
			const res = await deleteTaskComment(commentId);
			if (res.success) {
				toast.success("Comment deleted");
				setComments((prev) =>
					prev.filter(
						(c) =>
							c.id !== commentId &&
							c.replyCommentId !== commentId,
					),
				);
				if ("activity" in res && res.activity) {
					setTask((prev) => ({
						...prev,
						activities: [res.activity!, ...(prev.activities || [])],
					}));
				}
			} else {
				toast.error(res.message || "Failed to delete comment");
			}
		} catch {
			toast.error("Error deleting comment");
		} finally {
			setDeletingCommentId(null);
		}
	};

	// Post Reply
	const handlePostReply = async (parentCommentId: string) => {
		const message = replyInput.trim();
		if (!message || isPostingReply) return;
		setIsPostingReply(true);
		try {
			const res = await addTaskComment({
				taskId: task.id,
				message,
				replyCommentId: parentCommentId,
			});
			if (res.success && "comment" in res && res.comment) {
				toast.success("Reply posted");
				setComments((prev) => {
					if (prev.some((c: any) => c.id === (res.comment as any).id)) return prev;
					return [res.comment as any, ...prev];
				});
				setReplyInput("");
				setReplyingToCommentId(null);
			} else {
				toast.error(res.message || "Failed to post reply");
			}
		} catch {
			toast.error("Error posting reply");
		} finally {
			setIsPostingReply(false);
		}
	};

	// Delete Task
	const handleDeleteTask = async () => {
		setIsDeletingTask(true);
		try {
			const res = await deleteTask(task.id, currentMember?.id);
			if (res.success) {
				toast.success("Task deleted successfully");
				setIsDeleteDialogOpen(false);
				window.location.href =
					task.projectId ? `/projects/${task.projectId}` : "/tasks";
			} else {
				toast.error(res.message || "Failed to delete task");
				setIsDeletingTask(false);
			}
		} catch {
			toast.error("Error deleting task");
			setIsDeletingTask(false);
		}
	};

	const formatDescription = (desc: string) => {
		if (!desc || !desc.trim()) return "<p>No description provided.</p>";
		const trimmed = desc.trim();
		if (trimmed.startsWith("<")) return trimmed;
		return trimmed
			.split(/\n\s*\n/)
			.map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
			.join("");
	};

	const plainTextDesc = (description || "").replace(/<[^>]*>/g, "").trim();
	const isLongDescription = plainTextDesc.length > 220;

	const projectMembersList =
		(task.project?.projectMembers || [])
			.map((pm: any) => pm.member)
			.filter((m: any) => m && m.user) || [];

	const availableTaskAssigneeMembers =
		projectMembersList.length > 0 ? projectMembersList : members;

	const displayedMembers = availableTaskAssigneeMembers.filter((m: any) => {
		if (!m || !m.user) return false;
		if (!memberSearch.trim()) return true;
		const name = m.user.fullName || m.user.userName || m.user.email || "";
		return name.toLowerCase().includes(memberSearch.toLowerCase().trim());
	});

	return (
		<div className="flex flex-col lg:flex-row gap-4 w-full items-start">
			{/* Main Left Content Area */}
			<div className="w-full lg:w-[75%] grow flex flex-col gap-4">
				{/* Top Bar: Back Button, Title, Edit Description */}
				<div className="flex flex-wrap gap-3 justify-between items-center">
					<div className="gap-2 sm:gap-3 items-center flex min-w-0 flex-1">
						<Link
							href="/tasks"
							className="py-2 px-3.5 rounded-full flex gap-2 items-center justify-center bg-primary shrink-0 text-secondary"
						>
							<MoveLeft className="w-4 h-4" />
							<p className="text-[14px]">Back</p>
						</Link>

						{isEditingTitle ?
							<div className="flex items-center gap-2 flex-1 max-w-lg">
								<Input
									autoFocus
									disabled={isSavingTitle}
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter")
											handleSaveTitle();
										if (e.key === "Escape") {
											setTitle(task.title);
											setIsEditingTitle(false);
										}
									}}
									onBlur={handleSaveTitle}
									className="text-primary text-xl sm:text-2xl font-bold bg-accent rounded-xl border-primary/20"
								/>
								{isSavingTitle && (
									<Loader2 className="w-4 h-4 animate-spin text-primary" />
								)}
							</div>
						: canEditTask ?
							<div
								onClick={() => setIsEditingTitle(true)}
								className="group flex items-center gap-2 cursor-pointer min-w-0"
							>
								<p className="text-primary text-xl sm:text-2xl font-bold truncate hover:opacity-80">
									{title}
								</p>
								<PenLine className="w-4 h-4 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
							</div>
						:	<div className="flex items-center gap-2 min-w-0">
								<p className="text-primary text-xl sm:text-2xl font-bold truncate">
									{title}
								</p>
							</div>
						}
					</div>

					{canEditTask && (
						<Button
							onClick={() =>
								setIsEditingDescription(!isEditingDescription)
							}
							className="rounded-full flex items-center gap-2"
						>
							<PenLine className="w-4 h-4" />
							{isEditingDescription ?
								"Close Editor"
							:	"Edit Description"}
						</Button>
					)}
				</div>

				{/* Task Description Card */}
				<div>
					{isEditingDescription ?
						<div className="flex flex-col gap-2 bg-accent/30 p-3 rounded-[20px] text-primary">
							<Textarea
								disabled={isSavingDescription}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Type task description..."
								className="w-full min-h-[160px] p-3 bg-accent text-primary rounded-[15px] border-0 text-sm placeholder:text-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none resize-y"
							/>
							<div className="flex justify-end gap-2 mt-2">
								<Button
									onClick={() => {
										setDescription(task.description || "");
										setIsEditingDescription(false);
									}}
									className="rounded-full text-xs bg-accent hover:bg-accent text-primary border-0"
								>
									Cancel
								</Button>
								<Button
									disabled={isSavingDescription}
									onClick={handleSaveDescription}
									className="rounded-full text-xs"
								>
									{isSavingDescription ?
										<LoaderCircle className="w-3.5 h-3.5 animate-spin" />
									:	"Save Description"}
								</Button>
							</div>
						</div>
					:	<div className="text-primary text-[14px]">
							<div
								className={`text-primary transition-all duration-300 whitespace-pre-wrap ${
									!readMore && isLongDescription ?
										"max-h-[100px] overflow-hidden relative"
									:	""
								}`}
							>
								{description || "No description provided."}
							</div>
							{isLongDescription && (
								<button
									type="button"
									onClick={() => setReadMore(!readMore)}
									className="cursor-pointer underline text-xs mt-2 font-semibold hover:opacity-80 border-0 bg-transparent text-primary p-0 block"
								>
									{readMore ? "Show less" : "Read more"}
								</button>
							)}
						</div>
					}
				</div>

				{/* Properties Pill Bar */}
				<div className="bg-[#969696] w-full py-2.5 px-3 sm:px-4 rounded-2xl">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						{/* Interactive Priority Selector */}
						{canEditTask ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<div
										className={`text-[12px] text-primary cursor-pointer w-fit rounded-[10px] px-2 py-1 ${renderPriority(priority)} flex items-center gap-1.5 hover:opacity-80 transition-opacity`}
									>
										{isSavingPriority ?
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										:	<Flag className="w-4 h-4" />}
										<span>{formatPriority(priority)}</span>
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[160px] flex flex-col gap-1 border-0 bg-accent p-1">
									{PRIORITY_LEVEL.map((item, idx) => {
										const Icon: LucideIcon = item.icon;
										const isSelected = item.value === priority;
										return (
											<div
												key={idx}
												onClick={() =>
													handleUpdatePriority(item.value)
												}
												className={`${isSelected ? "bg-primary text-secondary" : "bg-accent text-primary"} py-[4px] cursor-pointer transition-all rounded-[12px] px-[10px] hover:bg-primary hover:text-secondary items-center justify-between flex`}
											>
												<div className="items-center gap-1.5 flex">
													<Icon className="w-4 h-4" />
													<p className="text-[13px]">
														{item.title}
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
						) : (
							<div
								className={`text-[12px] text-primary w-fit rounded-[10px] px-2 py-1 ${renderPriority(priority)} flex items-center gap-1.5`}
							>
								<Flag className="w-4 h-4" />
								<span>{formatPriority(priority)}</span>
							</div>
						)}

						{/* Interactive Date Selectors */}
						<div className="flex items-center gap-2 text-primary">
							<CalendarDays className="w-4 h-4" />
							<div className="flex gap-2 items-center">
								{canEditTask ? (
									<Popover>
										<PopoverTrigger asChild>
											<span className="text-[14px] cursor-pointer hover:underline">
												{safeFormatDate(startDate, "LLL d")}
											</span>
										</PopoverTrigger>
										<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
											<Calendar
												mode="single"
												selected={startDate}
												onSelect={handleUpdateStartDate}
												disabled={{
													before: task.project?.startPeriod ? new Date(task.project.startPeriod) : undefined,
													after: dueDate || (task.project?.endPeriod ? new Date(task.project.endPeriod) : undefined),
												}}
												className="bg-primary text-secondary"
											/>
										</PopoverContent>
									</Popover>
								) : (
									<span className="text-[14px]">
										{safeFormatDate(startDate, "LLL d")}
									</span>
								)}

								<MoveRight className="w-4 h-4" />

								{canEditTask ? (
									<Popover>
										<PopoverTrigger asChild>
											<span className="text-[14px] cursor-pointer hover:underline">
												{safeFormatDate(dueDate, "LLL d")}
											</span>
										</PopoverTrigger>
										<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
											<Calendar
												mode="single"
												selected={dueDate}
												onSelect={handleUpdateDueDate}
												disabled={{
													before: startDate || (task.project?.startPeriod ? new Date(task.project.startPeriod) : undefined),
													after: task.project?.endPeriod ? new Date(task.project.endPeriod) : undefined,
												}}
												className="bg-primary text-secondary"
											/>
										</PopoverContent>
									</Popover>
								) : (
									<span className="text-[14px]">
										{safeFormatDate(dueDate, "LLL d")}
									</span>
								)}
							</div>
						</div>

						{/* Project Badge */}
						{task.project && (
							<Link href={`/projects/${task.projectId}`}>
								<Badge className="py-[5px] px-[10px] cursor-pointer hover:opacity-80 transition-opacity">
									<Box
										className={`w-3.5 h-3.5 mr-1 ${
											status === Status.COMPLETED ||
											task.status === Status.COMPLETED
												? "text-emerald-500"
												: ""
										}`}
									/>
									<p className="truncate max-w-[220px]">
										{task.project.title}
									</p>
								</Badge>
							</Link>
						)}

						{/* Metrics Badges */}
						<Badge className="py-[5px] px-[10px]">
							<Squircle className="w-3.5 h-3.5 mr-1" />
							<p>
								{completedMilestones} out of {totalMilestones}{" "}
								milestones done
							</p>
						</Badge>
						<Badge className="py-[5px] px-[10px]">
							<Users className="w-3.5 h-3.5 mr-1" />
							<p>
								{(task.taskMembers || []).length} assignee
								{(task.taskMembers || []).length === 1 ?
									""
								:	"s"}
							</p>
						</Badge>
					</div>

					{/* Resources Row */}
					<div className="mt-[10px] flex flex-wrap gap-2 items-center">
						{/* Project-Level Resources */}
						{(task.project?.resources || [])
							.filter((pr) => !pr.taskId)
							.map((pr) => (
								<div
									key={`proj-res-${pr.id}`}
									className="flex items-center rounded-full gap-2 px-[15px] py-[8px] h-8 bg-primary/80 text-secondary text-[11px] border border-secondary/20"
								>
									<Link
										target="_blank"
										href={pr.url}
										className="flex items-center gap-1.5 hover:underline font-medium"
									>
										<Paperclip className="w-3.5 h-3.5 shrink-0" />
										<span>{pr.name}</span>
									</Link>
									<Link
										href={`/projects/${task.projectId}`}
										className="bg-secondary/20 text-secondary hover:bg-secondary/30 px-1.5 py-0.5 rounded-full text-[9px] font-semibold truncate max-w-[110px]"
										title={`Project Resource (${task.project?.title || "Project"})`}
									>
										Project Resource
									</Link>
								</div>
							))}

						{/* Task-Level Resources */}
						{(resources || [])
							.filter((tr) => !!tr.taskId)
							.map((i) => (
							<div
								key={i.id}
								className="flex items-center rounded-full gap-2 px-[15px] py-[8px] h-8 bg-primary text-secondary text-[11px]"
							>
								<Link
									target="_blank"
									href={i.url}
									className="flex items-center gap-1.5 hover:underline font-medium"
								>
									<Paperclip className="w-3.5 h-3.5" />
									<span>{i.name}</span>
								</Link>

								{canEditTask && (
									<>
										<Popover>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="p-0.5 hover:bg-secondary/20 rounded-full transition-colors text-secondary/70 hover:text-secondary"
													title="Edit resource"
												>
													<PenLine className="w-3 h-3" />
												</button>
											</PopoverTrigger>
											<PopoverContent className="rounded-[20px] bg-accent max-w-[200px] text-primary p-3 border-0">
												<EditResourcePopoverContent
													resource={i}
													onSave={(name, url) =>
														handleUpdateResourceItem(
															i.id,
															name,
															url,
														)
													}
												/>
											</PopoverContent>
										</Popover>

										<button
											type="button"
											disabled={deletingResourceId === i.id}
											onClick={() => handleDeleteResource(i.id)}
											className="p-0.5 hover:bg-secondary/20 rounded-full transition-colors text-secondary/70 hover:text-secondary disabled:opacity-50"
											title="Delete resource"
										>
											{deletingResourceId === i.id ?
												<LoaderCircle className="w-3 h-3 animate-spin" />
											:	<X className="w-3 h-3" />}
										</button>
									</>
								)}
							</div>
						))}

						{canEditTask && (
							<Popover
								open={isAddResourceOpen}
								onOpenChange={setIsAddResourceOpen}
							>
								<PopoverTrigger asChild>
									<div className="gap-2 bg-primary text-secondary px-[8px] py-[8px] h-8 flex items-center rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
										<Plus className="w-4 h-4" />
										{resources.length === 0 &&
											(task.project?.resources || []).length ===
												0 && (
												<p className="text-[12px]">
													Add task resource
												</p>
											)}
									</div>
								</PopoverTrigger>
								<PopoverContent className="rounded-[20px] bg-accent max-w-[190px] text-primary px-[10px] py-2 border-0">
									<div className="flex flex-col gap-2">
										<div className="flex flex-col gap-1 items-center w-full">
											<input
												disabled={isAddingResource}
												placeholder="Resource name"
												value={resourceField.name}
												onChange={(e) =>
													setResourceField((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter")
														handleAddResource();
												}}
												className="flex-1 w-full py-[5px] text-[12px] rounded-md bg-primary text-secondary px-2 text-sm outline-none"
											/>
											<input
												disabled={isAddingResource}
												placeholder="Link"
												value={resourceField.url}
												onChange={(e) =>
													setResourceField((prev) => ({
														...prev,
														url: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter")
														handleAddResource();
												}}
												className="flex-1 w-full py-[5px] text-[12px] rounded-md bg-primary text-secondary px-2 text-sm outline-none"
											/>
											<Button
												onClick={handleAddResource}
												disabled={
													!resourceField.name.trim() ||
													!resourceField.url.trim() ||
													isAddingResource
												}
												className="w-full rounded-full text-[12px]"
											>
												{isAddingResource ?
													<LoaderCircle className="w-4 h-4 animate-spin" />
												:	"Add"}
											</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						)}
					</div>
				</div>

				{/* Progress & Milestones Section */}
				<div className="bg-[#969696] rounded-2xl p-3.5 sm:px-4">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<Squircle className="w-4 h-4 text-primary" />
							<p className="text-xs sm:text-sm font-bold text-primary">
								Milestones Progress
							</p>
						</div>
						<p className="text-xs text-primary/70 font-medium">
							{completedMilestones} of {totalMilestones} milestones done ({milestonePercent}%)
						</p>
					</div>
					<div
						role="progressbar"
						aria-valuenow={milestonePercent}
						aria-valuemin={0}
						aria-valuemax={100}
						className="w-full h-[18px] sm:h-5 bg-black/20 dark:bg-black/30 rounded-full overflow-hidden"
					>
						<div
							className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
							style={{ width: `${milestonePercent}%` }}
						/>
					</div>
				</div>

				<Tabs defaultValue="milestones" className="w-full">
					<TabsList className="bg-primary/10 dark:bg-accent/40 p-1 rounded-full mb-3 flex-wrap h-auto">
						<TabsTrigger
							value="milestones"
							className="text-xs rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5"
						>
							<Squircle className="w-3.5 h-3.5" />
							Milestones ({totalMilestones})
						</TabsTrigger>
						<TabsTrigger
							value="activity"
							className="text-xs rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5"
						>
							<Workflow className="w-3.5 h-3.5" />
							Activity ({activities.length})
						</TabsTrigger>
						<TabsTrigger
							value="comments"
							className="text-xs rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5"
						>
							<MessageSquare className="w-3.5 h-3.5" />
							Comments ({comments.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="milestones" className="mt-0 focus-visible:outline-none">

					{/* Milestones List & Table */}
					<div>
						<div className="flex items-center justify-between">
							<p className="font-bold text-primary">
								Milestones ({totalMilestones})
							</p>
							{canEditTask && (
								<Button
									onClick={() => setIsMilestoneDialogOpen(true)}
									className="rounded-full text-xs font-semibold"
								>
									<Plus className="w-4 h-4 mr-1" />
									Add Milestone
								</Button>
							)}
						</div>

						<div className="mt-[10px]">
							{totalMilestones === 0 ?
								<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
									<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
										<Squircle className="w-4 h-4" />
									</div>
									<p className="text-secondary text-[15px] mt-[10px] font-bold">
										No Milestones Available
									</p>
									<p className="text-[13px] text-center text-secondary mb-3">
										Add milestones to track key steps for
										this task.
									</p>
									{canEditTask && (
										<Button
											onClick={() =>
												setIsMilestoneDialogOpen(true)
											}
											className="rounded-full text-xs font-semibold bg-accent text-primary hover:bg-accent/90"
										>
											<Plus className="w-4 h-4 mr-1" />
											Add Milestone
										</Button>
									)}
								</div>
							:	<Table className="min-w-[500px]">
									<TableHeader>
										<TableRow>
											<TableHead>Done</TableHead>
											<TableHead>
												Milestone Title
											</TableHead>
											<TableHead>Status</TableHead>
											{canEditTask && (
												<TableHead className="text-right">
													Action
												</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{task.milestones?.map((m) => {
											const isDone =
												m.status ===
												MileStoneStatus.DONE;
											return (
												<TableRow key={m.id}>
													<TableCell className="w-[50px]">
														<Checkbox
															checked={isDone}
															disabled={!canEditTask}
															onCheckedChange={() =>
																handleToggleMilestone(
																	m.id,
																	m.status,
																)
															}
															className="border-secondary data-[state=checked]:bg-accent data-[state=checked]:text-primary"
														/>
													</TableCell>
													<TableCell className="font-medium max-w-[150px]">
														<div className="flex flex-col">
															<span
																className={
																	isDone ?
																		"line-through opacity-70 break-words whitespace-normal"
																	:	"break-words whitespace-normal"
																}
															>
																{m.title}
															</span>
															{m.description && (
																<span
																	className={
																		isDone ?
																			"text-[12px] font-normal mt-0.5 line-through opacity-70 whitespace-pre-wrap break-words"
																		:	"text-[12px] font-normal mt-0.5 whitespace-pre-wrap break-words"
																	}
																>
																	{
																		m.description
																	}
																</span>
															)}
														</div>
													</TableCell>
													<TableCell>
														<Badge
															className={
																isDone ?
																	renderStatus(
																		Status.COMPLETED,
																	)
																:	renderStatus(
																		Status.TODO,
																	)
															}
														>
															{isDone ?
																"Completed"
															:	"To Do"}
														</Badge>
													</TableCell>
													{canEditTask && (
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	handleDeleteMilestone(
																		m.id,
																	)
																}
																className="text-secondary/60 hover:text-destructive hover:bg-destructive/10 rounded-full h-7 w-7 p-0"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</Button>
														</TableCell>
													)}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							}
						</div>
					</div>
				</TabsContent>

				{/* Activity Feed Section */}
				<TabsContent value="activity" className="mt-0 focus-visible:outline-none">
					<div className="bg-accent/30 dark:bg-accent/15 border border-primary/10 rounded-2xl p-4 sm:p-5">
						<p className="font-bold text-primary mb-3 text-sm sm:text-base">
							Activity
						</p>
						<div>
							{activities && activities.length > 0 ?
								<div className="flex flex-col gap-2">
									{activities.slice(0, 20).map((act) => {
										const actUser = act.member?.user;
										const actor =
											actUser?.userName ||
											actUser?.fullName ||
											"User";
										const displayName =
											actUser?.fullName ||
											actUser?.userName ||
											actUser?.email ||
											"User";
										const text =
											act.description || act.title;
										const timeAgo = formatRelativeTime(
											act.createdAt,
										);

										return (
											<div
												key={act.id}
												className="text-xs text-primary/80 flex items-center gap-1.5 flex-wrap"
											>
												{actUser ?
													<HoverCard
														openDelay={10}
														closeDelay={100}
													>
														<HoverCardTrigger
															asChild
														>
															<span className="font-medium text-primary cursor-pointer hover:underline">
																{actor}
															</span>
														</HoverCardTrigger>
														<HoverCardContent className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5">
															<div className="items-center flex gap-4">
																<div className="flex text-accent w-[50px] h-[50px] font-extrabold text-[20px] items-center justify-center rounded-full bg-primary shrink-0">
																	{getInitials(
																		displayName,
																	)}
																</div>
																<div>
																	{actUser.userName && (
																		<p className="font-semibold text-[13px]">
																			@
																			{
																				actUser.userName
																			}
																		</p>
																	)}
																	<p className="font-semibold">
																		{
																			displayName
																		}
																	</p>
																	{actUser.email && (
																		<p className="text-[13px]">
																			{
																				actUser.email
																			}
																		</p>
																	)}
																</div>
															</div>
														</HoverCardContent>
													</HoverCard>
												:	<span className="font-medium text-primary">
														{actor}
													</span>
												}
												<span>{text}</span>
												<span className="text-primary/40 font-normal">
													· {timeAgo}
												</span>
											</div>
										);
									})}
								</div>
							:	<p className="text-xs text-primary/50">
									No recent activity recorded
								</p>
							}
						</div>
						</div>
				</TabsContent>

				{/* Comments Section */}
				<TabsContent value="comments" className="mt-0 focus-visible:outline-none">
					<div className="bg-primary py-4 sm:py-5 rounded-2xl px-3 sm:px-5">
						<p className="font-bold text-secondary">Comments</p>
						<div className="flex flex-col gap-4 mt-3">
							{comments && comments.length > 0 ?
								<div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
									{(() => {
										const renderCommentItem = (
											comment: any,
											depth: number = 0,
										) => {
											const isOwner =
												comment.member?.userId ===
													(currentUserId ||
														user?.id) ||
												comment.member?.user?.id ===
													(currentUserId || user?.id);
											const replies = comments
												.filter(
													(c) =>
														c.replyCommentId ===
														comment.id,
												)
												.sort(
													(a, b) =>
														new Date(
															b.createdAt,
														).getTime() -
														new Date(
															a.createdAt,
														).getTime(),
												);

											const authorName =
												comment.member?.user
													?.fullName ||
												comment.member?.user
													?.userName ||
												comment.member?.user?.email ||
												"Member";

											return (
												<div
													key={comment.id}
													className={`text-secondary flex flex-col gap-1 ${
														depth > 0 ?
															"pl-3 border-l-2 border-secondary/30 mt-2"
														:	""
													}`}
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2.5">
															<Avatar
																className={
																	depth > 0 ?
																		"w-6 h-6"
																	:	"w-8 h-8"
																}
															>
																<AvatarFallback
																	className={`w-full border border-primary bg-accent text-primary font-bold ${
																		(
																			depth >
																			0
																		) ?
																			"text-[10px]"
																		:	"text-xs"
																	}`}
																>
																	{getInitials(
																		authorName,
																	)}
																</AvatarFallback>
															</Avatar>
															<div className="text-[12px]">
																<p className="font-bold leading-tight">
																	{authorName}
																</p>
																<p className="text-[10px] opacity-70">
																	@
																	{comment
																		.member
																		?.user
																		?.userName ||
																		"user"}
																</p>
															</div>
														</div>

														{isOwner && (
															<DropdownMenu>
																<DropdownMenuTrigger
																	asChild
																>
																	<button
																		type="button"
																		className="p-1 hover:bg-secondary/20 rounded-full transition-colors text-secondary/70 hover:text-secondary"
																	>
																		<MoreHorizontal
																			className={
																				(
																					depth >
																					0
																				) ?
																					"w-3.5 h-3.5"
																				:	"w-4 h-4"
																			}
																		/>
																	</button>
																</DropdownMenuTrigger>
																<DropdownMenuContent className="w-[130px] bg-accent text-primary border-0 p-1 rounded-[12px]">
																	<DropdownMenuItem
																		onClick={() =>
																			handleEditComment(
																				comment.id,
																				comment.message ||
																					comment.content ||
																					"",
																			)
																		}
																		className="cursor-pointer flex items-center gap-2 text-xs py-1.5 px-2 rounded-[8px] hover:bg-primary/10 text-primary"
																	>
																		<Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
																		<span>
																			Edit
																		</span>
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			handleDeleteComment(
																				comment.id,
																			)
																		}
																		disabled={
																			deletingCommentId ===
																			comment.id
																		}
																		className="cursor-pointer flex items-center gap-2 text-xs py-1.5 px-2 rounded-[8px] text-primary hover:bg-primary/10"
																	>
																		{(
																			deletingCommentId ===
																			comment.id
																		) ?
																			<Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
																		:	<Trash2 className="w-3.5 h-3.5 text-primary shrink-0" />
																		}
																		<span>
																			Delete
																		</span>
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</div>

													{(
														editingCommentId ===
														comment.id
													) ?
														<div className="mt-2 flex flex-col gap-2 relative">
															{renderMentionDropdown(
																`edit-${comment.id}`,
																editingMessage,
																setEditingMessage,
															)}
															<Textarea
																autoFocus
																disabled={
																	isSavingComment
																}
																value={
																	editingMessage
																}
																onChange={(e) =>
																	handleTextareaChange(
																		`edit-${comment.id}`,
																		e.target
																			.value,
																		e.target
																			.selectionStart,
																		setEditingMessage,
																	)
																}
																onKeyDown={(
																	e,
																) => {
																	if (
																		handleMentionKeyDown(
																			e,
																			`edit-${comment.id}`,
																			editingMessage,
																			setEditingMessage,
																		)
																	)
																		return;
																	if (
																		e.key ===
																			"Enter" &&
																		!e.shiftKey
																	) {
																		e.preventDefault();
																		handleSaveEditComment(
																			comment.id,
																		);
																	}
																	if (
																		e.key ===
																		"Escape"
																	) {
																		setEditingCommentId(
																			null,
																		);
																		setActiveMention(
																			null,
																		);
																	}
																}}
																className="bg-accent text-primary text-[12px] rounded-[15px] resize-none h-[80px] border-0 focus-visible:ring-0 outline-0 ring-0 p-3"
															/>
															<div className="flex items-center gap-2 justify-end">
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() =>
																		setEditingCommentId(
																			null,
																		)
																	}
																	className="h-7 text-xs text-secondary hover:text-secondary/80 hover:bg-secondary/10 rounded-full"
																>
																	Cancel
																</Button>
																<Button
																	size="sm"
																	disabled={
																		isSavingComment ||
																		!editingMessage.trim()
																	}
																	onClick={() =>
																		handleSaveEditComment(
																			comment.id,
																		)
																	}
																	className="h-7 text-xs rounded-full"
																>
																	{(
																		isSavingComment
																	) ?
																		<Loader2 className="w-3 h-3 animate-spin" />
																	:	"Save"}
																</Button>
															</div>
														</div>
													:	<div className="mt-1">
															<p className="text-[12px] whitespace-pre-wrap break-words">
																{renderMessageWithMentions(
																	comment.message ||
																		comment.content,
																)}{" "}
																-{" "}
																<b className="text-xs">
																	{formatRelativeTime(
																		comment.createdAt,
																	)}
																</b>
															</p>

															{canCommentOnTask && (
																<button
																	type="button"
																	onClick={() => {
																		setReplyingToCommentId(
																			(
																				replyingToCommentId ===
																					comment.id
																			) ?
																				null
																			:	comment.id,
																		);
																		setReplyInput(
																			"",
																		);
																	}}
																	className="flex items-center gap-1 text-[11px] font-semibold text-secondary/70 hover:text-secondary mt-1 w-fit cursor-pointer"
																>
																	<CornerDownRight className="w-3 h-3 text-secondary" />
																	<span>
																		Reply
																	</span>
																</button>
															)}
														</div>
													}

													{replyingToCommentId ===
														comment.id && (
														<div className="mt-2.5 pl-3 border-l-2 border-secondary/30 flex flex-col gap-2 relative">
															{renderMentionDropdown(
																`reply-${comment.id}`,
																replyInput,
																setReplyInput,
															)}
															<div className="flex items-center justify-between text-[11px] text-secondary/80">
																<span>
																	Replying to{" "}
																	<b className="text-secondary">
																		@
																		{comment
																			.member
																			?.user
																			?.userName ||
																			"user"}
																	</b>
																</span>
															</div>
															<Textarea
																autoFocus
																disabled={
																	isPostingReply
																}
																value={
																	replyInput
																}
																onChange={(e) =>
																	handleTextareaChange(
																		`reply-${comment.id}`,
																		e.target
																			.value,
																		e.target
																			.selectionStart,
																		setReplyInput,
																	)
																}
																onKeyDown={(
																	e,
																) => {
																	if (
																		handleMentionKeyDown(
																			e,
																			`reply-${comment.id}`,
																			replyInput,
																			setReplyInput,
																		)
																	)
																		return;
																	if (
																		e.key ===
																			"Enter" &&
																		!e.shiftKey
																	) {
																		e.preventDefault();
																		handlePostReply(
																			comment.id,
																		);
																	}
																	if (
																		e.key ===
																		"Escape"
																	) {
																		setReplyingToCommentId(
																			null,
																		);
																		setActiveMention(
																			null,
																		);
																	}
																}}
																placeholder="Write a reply... (use @ to mention)"
																className="bg-accent text-primary text-[12px] rounded-[15px] resize-none h-[75px] border-0 focus-visible:ring-0 outline-0 ring-0 p-3"
															/>
															<div className="flex items-center justify-end gap-2">
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() =>
																		setReplyingToCommentId(
																			null,
																		)
																	}
																	className="h-7 text-xs text-secondary hover:text-secondary/80 hover:bg-secondary/10 rounded-full"
																>
																	Cancel
																</Button>
																<Button
																	size="sm"
																	disabled={
																		isPostingReply ||
																		!replyInput.trim()
																	}
																	onClick={() =>
																		handlePostReply(
																			comment.id,
																		)
																	}
																	className="h-7 text-xs rounded-full"
																>
																	{(
																		isPostingReply
																	) ?
																		<Loader2 className="w-3 h-3 animate-spin" />
																	:	"Reply"}
																</Button>
															</div>
														</div>
													)}

													{replies.length > 0 && (
														<div className="flex flex-col gap-2">
															{replies.map(
																(reply) =>
																	renderCommentItem(
																		reply,
																		depth +
																			1,
																	),
															)}
														</div>
													)}
												</div>
											);
										};

										return comments
											.filter((c) => !c.replyCommentId)
											.sort(
												(a, b) =>
													new Date(
														b.createdAt,
													).getTime() -
													new Date(
														a.createdAt,
													).getTime(),
											)
											.map((rootComment) =>
												renderCommentItem(
													rootComment,
													0,
												),
											);
									})()}
								</div>
							:	<div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-secondary/80">
									<div className="p-2.5 rounded-full bg-secondary/10 text-secondary">
										<MessageSquare className="w-5 h-5" />
									</div>
									<p className="text-xs font-semibold text-secondary">
										No comments yet
									</p>
									<p className="text-[11px] text-secondary/60">
										Start the conversation by posting a
										comment below.
									</p>
								</div>
							}

							{/* Add Comment Input */}
							{canCommentOnTask ? (
								<div className="flex flex-col gap-2 relative mt-2">
									{renderMentionDropdown(
										"main",
										commentInput,
										setCommentInput,
									)}
									<Textarea
										disabled={isPostingComment}
										value={commentInput}
										onChange={(e) =>
											handleTextareaChange(
												"main",
												e.target.value,
												e.target.selectionStart,
												setCommentInput,
											)
										}
										onKeyDown={(e) => {
											if (
												handleMentionKeyDown(
													e,
													"main",
													commentInput,
													setCommentInput,
												)
											)
												return;
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleAddComment();
											}
											if (e.key === "Escape") {
												setActiveMention(null);
											}
										}}
										placeholder="Start typing a comment... (use @ to mention)"
										className="rounded-[20px] resize-none h-[110px] bg-accent border-0 focus-visible:ring-0 text-primary outline-0 ring-0 p-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<div
										onClick={
											isPostingComment ? undefined : (
												handleAddComment
											)
										}
										className={`w-[40px] h-[40px] rounded-full flex items-center justify-center absolute bg-primary text-secondary right-0 bottom-0 mb-[12px] mr-[12px] transition-opacity ${
											isPostingComment ?
												"opacity-50 cursor-not-allowed"
											:	"cursor-pointer hover:opacity-90"
										}`}
									>
										{isPostingComment ?
											<Loader2 className="w-4 h-4 animate-spin" />
										:	<MoveUp className="w-4 h-4" />}
									</div>
								</div>
							) : (
								<div className="flex items-center gap-2.5 p-3.5 bg-accent/20 rounded-[20px] text-xs text-secondary/80 mt-2 border border-secondary/20">
									<Lock className="w-4 h-4 text-secondary/70 shrink-0" />
									<span>
										Only assigned task members, the task creator, and project leads can comment on this task.
									</span>
								</div>
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>

		{/* Right Sidebar with Interactive Auto-Saving Controls */}
		<div className="bg-[#969696] px-3 sm:px-[20px] py-[15px] sm:py-[20px] lg:h-[calc(100vh-30px)] overflow-y-auto custom-scrollbar w-full lg:w-[25%] rounded-[20px] sm:rounded-[30px] lg:sticky lg:top-0 lg:self-start">
			<div className="flex flex-col h-full justify-between gap-6">
				<div className="flex flex-col gap-5">
					{/* Status Radio Selector */}
					<div>
						<div className="flex text-primary gap-3 items-center justify-between">
							<div className="flex gap-2 items-center">
								<ChartNoAxesColumn className="w-4 h-4" />
								<p className="font-bold">Status</p>
							</div>
							{isSavingStatus && (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							)}
						</div>
						<div className="mt-3 flex flex-col gap-3.5">
							{STATUS_OPTIONS.map((item) => {
								const isSelected = item.value === status;
								return (
									<button
										key={item.value}
										type="button"
										disabled={!canEditTask || isSavingStatus}
										onClick={() => {
											if (canEditTask && !isSavingStatus) {
												handleUpdateStatus(item.value);
											}
										}}
										title={
											!canEditTask
												? "You do not have permission to edit this task's status"
												: undefined
										}
										className={cn(
											"flex items-center gap-3.5 text-left transition-all text-primary focus-visible:outline-none w-fit",
											canEditTask && !isSavingStatus
												? "cursor-pointer hover:opacity-80"
												: isSavingStatus
													? "cursor-wait opacity-70"
													: "cursor-not-allowed opacity-60 select-none",
										)}
									>
										<div className="size-6 rounded-full bg-[#c5bebe] flex items-center justify-center shrink-0 transition-all">
											{isSelected && (
												<div className="size-3.5 rounded-full bg-primary" />
											)}
										</div>
										<span className="text-sm font-medium text-primary">
											{item.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>

						{/* Task Creator */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<UserStar className="w-4 h-4" />
									<p className="font-bold">Created By</p>
								</div>
							</div>
							<div className="mt-[10px] w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px] ">
								{creatorName}
							</div>
						</div>

						{/* Task Assignees */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<Users className="w-4 h-4" />
									<p className="font-bold">Assignees</p>
								</div>
								{isSavingMembers && (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								)}
							</div>

							<div className="mt-[10px] flex flex-row flex-wrap gap-1 items-center">
								{availableTaskAssigneeMembers
									.filter((m: any) =>
										selectedMembers.includes(m.id),
									)
									.map((m: any) => {
										const isYou =
											m.userId ===
											(currentUserId || user?.id);
										const name =
											isYou ? "YOU" : (
												m.user.fullName ||
												m.user.userName
											);
										return (
											<p
												key={m.id}
												className="w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px] "
											>
												{name}
											</p>
										);
									})}

								{canManageMembers && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												type="button"
												className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px]"
											>
												<Plus className="w-3 h-3" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-[220px] border-0 bg-accent p-2">
											<div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2">
												<Search className="w-3.5 h-3.5 text-primary/40 shrink-0" />
												<input
													value={memberSearch}
													onChange={(e) =>
														setMemberSearch(
															e.target.value,
														)
													}
													placeholder="Search members..."
													className="flex-1 outline-none bg-transparent text-sm placeholder:text-primary/30"
												/>
											</div>
											<div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
												{displayedMembers.map((i: any) => (
													<div
														key={i.id}
														onClick={() =>
															toggleAssigneeMember(
																i.id,
															)
														}
														className="cursor-pointer flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-primary/10 transition-colors"
													>
														<Checkbox
															checked={selectedMembers.includes(
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
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>

						{/* Due Date */}
						<div>
							<div className="flex text-primary gap-3 items-center">
								<CalendarDays className="w-4 h-4" />
								<p className="font-bold">Due Date</p>
							</div>

							{canEditTask ? (
								<Popover>
									<PopoverTrigger asChild>
										<p className="text-[12px] mt-[10px] text-primary cursor-pointer hover:underline">
											{safeFormatDate(dueDate, "PPP")}
										</p>
									</PopoverTrigger>
									<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={handleUpdateDueDate}
											disabled={{
												before: startDate || (task.project?.startPeriod ? new Date(task.project.startPeriod) : undefined),
												after: task.project?.endPeriod ? new Date(task.project.endPeriod) : undefined,
											}}
											className="bg-primary text-secondary"
										/>
									</PopoverContent>
								</Popover>
							) : (
								<p className="text-[12px] mt-[10px] text-primary">
									{safeFormatDate(dueDate, "PPP")}
								</p>
							)}
						</div>

						{/* Labels */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<Tags className="w-4 h-4" />
									<p className="font-bold">Labels</p>
								</div>
								{isSavingLabels && (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								)}
							</div>
							<div className="flex mt-[10px] flex-wrap gap-1.5 items-center">
								{labels.map((lbl) => (
									<span
										key={lbl}
										className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#AD6B3D] text-white shadow-xs"
									>
										{formatLabel(lbl)}
										{canEditTask && (
											<button
												type="button"
												onClick={() => removeLabel(lbl)}
												className="hover:opacity-75 cursor-pointer ml-0.5 text-white/80 hover:text-white"
											>
												<X className="w-3 h-3" />
											</button>
										)}
									</span>
								))}

								{canEditTask && (
									<Popover>
										<PopoverTrigger asChild>
											<button
												type="button"
												className="p-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] cursor-pointer"
												title="Add label"
											>
												<Plus className="w-3 h-3" />
											</button>
										</PopoverTrigger>
										<PopoverContent
											className="rounded-[15px] bg-accent text-primary border-0 p-2.5 w-[200px]"
											align="start"
										>
											<div className="flex flex-col gap-1.5">
												<p className="text-[11px] font-semibold text-primary/70">
													Type tag & press Enter
												</p>
												<Input
													placeholder="e.g. backend, ui"
													value={labelInput}
													onChange={(e) =>
														setLabelInput(
															e.target.value,
														)
													}
													className="h-7 text-xs bg-primary text-secondary placeholder:text-secondary/50 rounded-lg border-0"
													onKeyDown={(e) => {
														if (
															e.key === "Enter" ||
															e.key === " "
														) {
															e.preventDefault();
															addLabels(
																extractLabels(
																	labelInput,
																),
															);
															setLabelInput("");
														}
													}}
												/>
											</div>
										</PopoverContent>
									</Popover>
								)}
							</div>
						</div>
					</div>

					{/* Delete Task Action */}
					{canDeleteTask && (
						<div className="w-full mt-6 pt-3 border-t border-primary/10">
							<Button
								variant="destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
								className="h-11 rounded-full bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90 text-white text-sm font-semibold w-full cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-sm border-0"
							>
								<Trash2 className="w-4 h-4 text-white shrink-0" />
								Delete Task
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Create Milestone Dialog */}
			<Dialog
				open={isMilestoneDialogOpen}
				onOpenChange={setIsMilestoneDialogOpen}
			>
				<DialogContent className="rounded-[20px] border-0 bg-primary text-secondary sm:max-w-lg p-6">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold text-secondary flex items-center gap-2">
							<Squircle className="w-5 h-5 text-accent shrink-0" />
							Create Milestone
						</DialogTitle>
						<DialogDescription className="text-[13px] text-secondary/80 mt-1 leading-relaxed">
							Add a new milestone to track key progress steps for
							this task.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4 my-2">
						<div className="flex flex-col gap-1.5">
							<Label className="text-xs font-semibold text-secondary/90">
								Milestone Title{" "}
								<span className="text-destructive">*</span>
							</Label>
							<Input
								autoFocus
								placeholder="Enter milestone title..."
								value={milestoneTitle}
								onChange={(e) =>
									setMilestoneTitle(e.target.value)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleAddMilestone();
								}}
								className="bg-accent text-primary rounded-[12px] border-0 placeholder:text-primary/60 text-sm"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label className="text-xs font-semibold text-secondary/90">
								Description (Optional)
							</Label>
							<Textarea
								placeholder="Enter milestone description..."
								value={milestoneDescription}
								onChange={(e) =>
									setMilestoneDescription(e.target.value)
								}
								className="bg-accent text-primary rounded-[12px] border-0 placeholder:text-primary/60 text-sm min-h-[70px] resize-y p-3 outline-none"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label className="text-xs font-semibold text-secondary/90">
								Start Date / Due Date (Optional)
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start text-left font-normal bg-accent text-primary border-0 rounded-[12px] h-10 px-3 hover:bg-accent/90"
									>
										<CalendarDays className="mr-2 h-4 w-4 text-primary/70" />
										{milestoneDueDate ?
											format(milestoneDueDate, "PPP")
										:	<span className="text-primary/60">
												Select date (within task period)
											</span>
										}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2 z-[99999]">
									{(startDate || task.startPeriod) && (dueDate || task.endPeriod) && (
										<div className="text-[11px] font-medium text-primary/70 text-center pb-2 mb-1 border-b border-primary/10">
											Task: {safeFormatDate(startDate || new Date(task.startPeriod), "PPP")} – {safeFormatDate(dueDate || new Date(task.endPeriod), "PPP")}
										</div>
									)}
									<Calendar
										mode="single"
										selected={milestoneDueDate}
										onSelect={setMilestoneDueDate}
										defaultMonth={milestoneDueDate || startDate || new Date(task.startPeriod)}
										disabled={{
											before: startDate ? new Date(startDate) : new Date(task.startPeriod),
											after: dueDate ? new Date(dueDate) : new Date(task.endPeriod),
										}}
										initialFocus
										className="bg-primary text-secondary"
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
						<DialogClose asChild>
							<Button
								type="button"
								disabled={isAddingMilestone}
								onClick={() => {
									setMilestoneTitle("");
									setMilestoneDescription("");
									setMilestoneDueDate(undefined);
								}}
								className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 text-primary border-0 font-medium cursor-pointer"
							>
								Cancel
							</Button>
						</DialogClose>
						<Button
							type="button"
							onClick={handleAddMilestone}
							disabled={
								isAddingMilestone || !milestoneTitle.trim()
							}
							className="w-full sm:w-auto rounded-full bg-accent text-primary hover:bg-accent/90  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
						>
							{isAddingMilestone ?
								<>
									<LoaderCircle className="w-4 h-4 animate-spin" />
									Creating...
								</>
							:	<>
									<Plus className="w-4 h-4" />
									Create Milestone
								</>
							}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Task Confirmation Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent className="rounded-[20px] border border-secondary/20 bg-primary text-secondary sm:max-w-md p-6">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
							<Trash2 className="w-5 h-5 text-destructive shrink-0" />
							Delete Task
						</AlertDialogTitle>
						<AlertDialogDescription className="text-[13px] text-secondary/80 mt-2 leading-relaxed">
							This action cannot be undone. This will permanently
							delete the task{" "}
							<strong className="text-secondary font-semibold">
								"{title || task.title}"
							</strong>{" "}
							and all associated milestones, comments, and
							resources.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3 mt-4">
						<AlertDialogCancel
							disabled={isDeletingTask}
							className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 text-primary border-0 font-medium cursor-pointer"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={async (e) => {
								e.preventDefault();
								await handleDeleteTask();
							}}
							disabled={isDeletingTask}
							className="w-full sm:w-auto rounded-full bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
						>
							{isDeletingTask ?
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Deleting...
								</>
							:	<>
									<Trash2 className="w-4 h-4" />
									Delete Task
								</>
							}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function EditResourcePopoverContent({
	resource,
	onSave,
}: {
	resource: { id: string; name: string; url: string };
	onSave: (name: string, url: string) => Promise<void>;
}) {
	const [name, setName] = useState(resource.name);
	const [url, setUrl] = useState(resource.url);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!name.trim() || !url.trim()) return;
		setIsSubmitting(true);
		await onSave(name, url);
		setIsSubmitting(false);
	};

	return (
		<div className="flex flex-col gap-2 p-1">
			<p className="text-xs font-semibold text-primary">Edit Resource</p>
			<input
				placeholder="Resource name"
				value={name}
				onChange={(e) => setName(e.target.value)}
				className="w-full py-[5px] text-[12px] rounded-md bg-primary text-secondary px-2 outline-none"
			/>
			<input
				placeholder="Link"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") handleSubmit();
				}}
				className="w-full py-[5px] text-[12px] rounded-md bg-primary text-secondary px-2 outline-none"
			/>
			<Button
				disabled={!name.trim() || !url.trim() || isSubmitting}
				onClick={handleSubmit}
				className="w-full rounded-full text-[12px] h-7"
			>
				{isSubmitting ?
					<LoaderCircle className="w-3 h-3 animate-spin text-secondary" />
				:	"Save"}
			</Button>
		</div>
	);
}
