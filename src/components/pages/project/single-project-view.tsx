"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
	MembersUsers,
	ProjectActivity,
	ProjectComment,
	Projects,
} from "@/lib/types";
import { getInitials, renderPriority, renderStatus } from "@/lib/utils";
import { format, formatDistanceToNowStrict } from "date-fns";

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
import {
	Activity,
	CalendarDays,
	ChartNoAxesColumn,
	Check,
	CircleCheck,
	CircleX,
	Copy,
	Diamond,
	Flag,
	Loader2,
	LoaderCircle,
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
	Tags,
	Trash2,
	Users,
	UserStar,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	PriorityLevel,
	ProjectAccess,
	Status,
} from "../../../../generated/prisma/enums";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import { PRIORITY_LEVEL } from "@/lib/const";
import {
	addProjectComment,
	addProjectResource,
	deleteProject,
	deleteProjectComment,
	deleteProjectResource,
	updateProjectComment,
	updateProjectDetails,
	updateProjectMembers,
	updateProjectResource,
} from "@/lib/services/project.services";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SingleProjectView({
	project,
	workspaceId,
	members = [],
	initialTotal = 0,
}: {
	project: Projects;
	workspaceId?: string;
	members?: MembersUsers[];
	initialTotal?: number;
}) {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

	// Editable field states
	const [title, setTitle] = useState(project.title);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isSavingTitle, setIsSavingTitle] = useState(false);

	const [description, setDescription] = useState(project.description || "");
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);

	const [status, setStatus] = useState<Status>(project.status);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	const [priority, setPriority] = useState<PriorityLevel>(project.priority);
	const [isSavingPriority, setIsSavingPriority] = useState(false);

	const [startDate, setStartDate] = useState<Date>(
		new Date(project.startPeriod),
	);
	const [isSavingStartDate, setIsSavingStartDate] = useState(false);

	const [dueDate, setDueDate] = useState<Date>(new Date(project.endPeriod));
	const [isSavingDueDate, setIsSavingDueDate] = useState(false);

	const [labels, setLabels] = useState<string[]>(project.labels || []);
	const [labelInput, setLabelInput] = useState("");
	const [isSavingLabels, setIsSavingLabels] = useState(false);
	const [taskSearch, setTaskSearch] = useState("");

	// Member selection state
	const initialLead = project.projectMembers.find(
		(e) => e.projectRole === ("PROJECT_LEAD" as ProjectAccess),
	)?.memberId;

	const initialMemberIds = project.projectMembers.map((e) => e.memberId);

	const [selectedMembers, setSelectedMembers] =
		useState<string[]>(initialMemberIds);
	const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(
		initialLead,
	);
	const [isSavingMembers, setIsSavingMembers] = useState(false);

	const [readMore, setReadMore] = useState(false);
	const [resources, setResources] = useState(project.resources);
	const [comments, setComments] = useState<ProjectComment[]>(
		project.comments || [],
	);
	const [commentInput, setCommentInput] = useState("");
	const [isPostingComment, setIsPostingComment] = useState(false);
	const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
		null,
	);
	const [editingCommentId, setEditingCommentId] = useState<string | null>(
		null,
	);
	const [editingMessage, setEditingMessage] = useState("");
	const [isSavingComment, setIsSavingComment] = useState(false);
	const [resourceField, setResourceField] = useState<{
		name: string;
		url: string;
	}>({ name: "", url: "" });
	const [isAddingResource, setIsAddingResource] = useState(false);
	const [activities, setActivities] = useState<ProjectActivity[]>(
		project.activities || [],
	);

	// Delete Project Dialog State
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
	const [hasCopiedName, setHasCopiedName] = useState(false);
	const [isDeletingProject, setIsDeletingProject] = useState(false);

	const handleCopyProjectName = async () => {
		try {
			await navigator.clipboard.writeText(title || project.title);
			setHasCopiedName(true);
			toast.success("Project name copied to clipboard");
			setTimeout(() => setHasCopiedName(false), 2000);
		} catch {
			toast.error("Failed to copy project name");
		}
	};

	const handleDeleteProject = async () => {
		const targetName = (title || project.title).trim();
		if (deleteConfirmInput.trim() !== targetName) {
			toast.error("Project name does not match");
			return;
		}

		setIsDeletingProject(true);
		try {
			const res = await deleteProject(project.id);
			if (res.success) {
				router.push("/projects");
				toast.success(res.message || "Project deleted successfully");
				setIsDeleteDialogOpen(false);
				router.refresh();
			} else {
				toast.error(res.message || "Failed to delete project");
			}
		} catch {
			toast.error("An error occurred while deleting the project");
		} finally {
			setIsDeletingProject(false);
		}
	};

	// Member search pagination inside dropdowns
	const [memberSearch, setMemberSearch] = useState("");
	const [displayedMembers, setDisplayedMembers] =
		useState<MembersUsers[]>(members);

	useEffect(() => {
		setTitle(project.title);
		setDescription(project.description || "");
		setStatus(project.status);
		setPriority(project.priority);
		setStartDate(new Date(project.startPeriod));
		setDueDate(new Date(project.endPeriod));
		setLabels(project.labels || []);
		setResources(project.resources);
		setComments(project.comments || []);

		const lead = project.projectMembers.find(
			(e) => e.projectRole === ("PROJECT_LEAD" as ProjectAccess),
		)?.memberId;
		setSelectedLeadId(lead);
		setSelectedMembers(project.projectMembers.map((e) => e.memberId));
		setActivities((project.activities || []).slice(0, 20));
	}, [project]);

	useEffect(() => {
		setDisplayedMembers(
			members.filter((m) =>
				memberSearch.trim() ?
					m.user.fullName
						.toLowerCase()
						.includes(memberSearch.toLowerCase()) ||
					m.user
						.userName!.toLowerCase()
						.includes(memberSearch.toLowerCase())
				:	true,
			),
		);
	}, [memberSearch, members]);

	// Auto-save title function
	const handleSaveTitle = async () => {
		setIsEditingTitle(false);
		const trimmedTitle = title.trim();
		if (!trimmedTitle || trimmedTitle === project.title) {
			setTitle(project.title);
			return;
		}

		setIsSavingTitle(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { title: trimmedTitle },
			});
			if (res.success) {
				toast.success("Project title updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update title");
				setTitle(project.title);
			}
		} catch (e) {
			toast.error("Error updating title");
			setTitle(project.title);
		} finally {
			setIsSavingTitle(false);
		}
	};

	// Auto-save description function
	const handleSaveDescription = async () => {
		setIsSavingDescription(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { description },
			});
			if (res.success) {
				toast.success("Description updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				setIsEditingDescription(false);
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update description");
			}
		} catch (e) {
			toast.error("Error updating description");
		} finally {
			setIsSavingDescription(false);
		}
	};

	// Auto-save status function
	const handleUpdateStatus = async (newStatus: Status) => {
		if (newStatus === status) return;
		setStatus(newStatus);
		setIsSavingStatus(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { status: newStatus },
			});
			if (res.success) {
				toast.success(
					`Status set to ${newStatus.replaceAll("_", " ")}`,
				);
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update status");
				setStatus(project.status);
			}
		} catch (e) {
			toast.error("Error updating status");
			setStatus(project.status);
		} finally {
			setIsSavingStatus(false);
		}
	};

	// Auto-save priority function
	const handleUpdatePriority = async (newPriority: PriorityLevel) => {
		if (newPriority === priority) return;
		setPriority(newPriority);
		setIsSavingPriority(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { priority: newPriority },
			});
			if (res.success) {
				toast.success("Priority updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update priority");
				setPriority(project.priority);
			}
		} catch (e) {
			toast.error("Error updating priority");
			setPriority(project.priority);
		} finally {
			setIsSavingPriority(false);
		}
	};

	// Auto-save start date
	const handleUpdateStartDate = async (date?: Date) => {
		if (!date) return;
		setStartDate(date);
		setIsSavingStartDate(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { startDate: date },
			});
			if (res.success) {
				toast.success("Start date updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update start date");
				setStartDate(new Date(project.startPeriod));
			}
		} catch (e) {
			toast.error("Error updating start date");
			setStartDate(new Date(project.startPeriod));
		} finally {
			setIsSavingStartDate(false);
		}
	};

	// Auto-save due date
	const handleUpdateDueDate = async (date?: Date) => {
		if (!date) return;
		setDueDate(date);
		setIsSavingDueDate(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { dueDate: date },
			});
			if (res.success) {
				toast.success("Due date updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update due date");
				setDueDate(new Date(project.endPeriod));
			}
		} catch (e) {
			toast.error("Error updating due date");
			setDueDate(new Date(project.endPeriod));
		} finally {
			setIsSavingDueDate(false);
		}
	};

	// Auto-save labels helper
	const handleSaveLabels = async (newLabels: string[]) => {
		setLabels(newLabels);
		setIsSavingLabels(true);
		try {
			const res = await updateProjectDetails({
				projectId: project.id,
				values: { labels: newLabels },
			});
			if (res.success) {
				toast.success("Labels updated");
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update labels");
				setLabels(project.labels || []);
			}
		} catch (e) {
			toast.error("Error updating labels");
			setLabels(project.labels || []);
		} finally {
			setIsSavingLabels(false);
		}
	};

	const extractLabels = (value: string) => value.match(/#[\w-]+/g) ?? [];
	const addLabels = (valuesToAdd: string[]) => {
		const normalized = valuesToAdd
			.map((v) => v.trim())
			.filter((v) => v.startsWith("#") && v.length > 1);
		if (normalized.length === 0) return;
		const nextSet = Array.from(new Set([...labels, ...normalized]));
		handleSaveLabels(nextSet);
	};

	const removeLabel = (labelToRemove: string) => {
		const updated = labels.filter((l) => l !== labelToRemove);
		handleSaveLabels(updated);
	};

	// Auto-save members helper
	const handleSaveMembers = async (
		updatedMembers: string[],
		leadId?: string,
	) => {
		setSelectedMembers(updatedMembers);
		if (leadId !== undefined) {
			setSelectedLeadId(leadId);
		}
		setIsSavingMembers(true);
		try {
			const res = await updateProjectMembers({
				projectId: project.id,
				projectMembers: updatedMembers,
				projectLeadId: leadId !== undefined ? leadId : selectedLeadId,
			});
			if (res.success) {
				toast.success("Project members updated");
				if (res.activities && res.activities.length > 0) {
					setActivities((prev) =>
						[
							...(res.activities as unknown as ProjectActivity[]),
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update members");
			}
		} catch (e) {
			toast.error("Error updating members");
		} finally {
			setIsSavingMembers(false);
		}
	};

	const toggleMember = (memberId: string) => {
		const nextMembers =
			selectedMembers.includes(memberId) ?
				selectedMembers.filter((m) => m !== memberId)
			:	[...selectedMembers, memberId];

		let nextLead = selectedLeadId;
		if (!nextMembers.includes(memberId) && selectedLeadId === memberId) {
			nextLead = undefined;
		}
		handleSaveMembers(nextMembers, nextLead);
	};

	const handleSetProjectLead = (memberId: string) => {
		const nextLead = selectedLeadId === memberId ? undefined : memberId;
		handleSaveMembers(selectedMembers, nextLead);
	};

	const [deletingResourceId, setDeletingResourceId] = useState<string | null>(
		null,
	);

	const handleDeleteResource = async (resourceId: string) => {
		setDeletingResourceId(resourceId);
		try {
			const res = await deleteProjectResource(resourceId);
			if (res.success) {
				toast.success("Resource deleted");
				setResources((prev) => prev.filter((r) => r.id !== resourceId));
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to delete resource");
			}
		} catch (e) {
			toast.error("Error deleting resource");
		} finally {
			setDeletingResourceId(null);
		}
	};

	const handleUpdateResourceItem = async (
		resourceId: string,
		name: string,
		url: string,
	) => {
		if (!name.trim() || !url.trim()) return;
		try {
			const res = await updateProjectResource({ resourceId, name, url });
			if (res.success && res.resource) {
				toast.success("Resource updated");
				setResources((prev) =>
					prev.map((r) => (r.id === resourceId ? res.resource! : r)),
				);
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update resource");
			}
		} catch (e) {
			toast.error("Error updating resource");
		}
	};

	const handleAddResource = async () => {
		if (!resourceField.name.trim() || !resourceField.url.trim()) return;

		setIsAddingResource(true);
		try {
			const res = await addProjectResource({
				projectId: project.id,
				name: resourceField.name,
				url: resourceField.url,
			});

			if (res.success && res.resource) {
				toast.success(res.message);
				setResources((prev) => [...prev, res.resource]);
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				setResourceField({ name: "", url: "" });
				router.refresh();
			} else {
				toast.error(res.message || "Failed to add resource");
			}
		} catch (err) {
			toast.error("An error occurred while adding resource");
		} finally {
			setIsAddingResource(false);
		}
	};

	const handleAddComment = async () => {
		const message = commentInput.trim();
		if (!message || isPostingComment) return;

		setIsPostingComment(true);
		try {
			const res = await addProjectComment({
				projectId: project.id,
				message,
			});
			if (res.success && res.comment) {
				toast.success("Comment posted");
				setComments((prev) => [res.comment as ProjectComment, ...prev]);
				setCommentInput("");
				router.refresh();
			} else {
				toast.error(res.message || "Failed to post comment");
			}
		} catch (e) {
			toast.error("Error posting comment");
		} finally {
			setIsPostingComment(false);
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		setDeletingCommentId(commentId);
		try {
			const res = await deleteProjectComment(commentId);
			if (res.success) {
				toast.success("Comment deleted");
				setComments((prev) => prev.filter((c) => c.id !== commentId));
				if (res.activity) {
					setActivities((prev) =>
						[
							res.activity as unknown as ProjectActivity,
							...prev,
						].slice(0, 20),
					);
				}
				router.refresh();
			} else {
				toast.error(res.message || "Failed to delete comment");
			}
		} catch (e) {
			toast.error("Error deleting comment");
		} finally {
			setDeletingCommentId(null);
		}
	};

	const handleEditComment = (commentId: string, currentMessage: string) => {
		setEditingCommentId(commentId);
		setEditingMessage(currentMessage);
	};

	const handleSaveEditComment = async (commentId: string) => {
		if (!editingMessage.trim()) return;
		setIsSavingComment(true);
		try {
			const res = await updateProjectComment({
				commentId,
				message: editingMessage,
			});
			if (res.success && res.comment) {
				toast.success("Comment updated");
				setComments((prev) =>
					prev.map((c) =>
						c.id === commentId ?
							(res.comment as ProjectComment)
						:	c,
					),
				);
				setEditingCommentId(null);
				setEditingMessage("");
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update comment");
			}
		} catch (e) {
			toast.error("Error updating comment");
		} finally {
			setIsSavingComment(false);
		}
	};

	const projectLeadName = (() => {
		const leadMember = project.projectMembers.find(
			(e) => e.projectRole === ("PROJECT_LEAD" as ProjectAccess),
		);
		if (!leadMember) return "Unassigned";
		return leadMember.member.user.id === user?.id ?
				"YOU"
			:	leadMember.member.user.fullName;
	})();

	const contributors = project.projectMembers.filter(
		(e) => e.projectRole === ("CONTRIBUTOR" as ProjectAccess),
	);

	const handleReadMore = () => {
		setReadMore(!readMore);
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

	return (
		<div className="flex flex-col lg:flex-row gap-3 w-full">
			<div className="w-full lg:w-[75%] grow">
				<div className="flex flex-wrap gap-3 justify-between items-center">
					<div className="gap-2 sm:gap-3 items-center flex min-w-0 flex-1">
						<Link
							href={"/projects"}
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
											setTitle(project.title);
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
						:	<div
								onClick={() => setIsEditingTitle(true)}
								className="group flex items-center gap-2 cursor-pointer min-w-0"
							>
								<p className="text-primary text-xl sm:text-2xl font-bold truncate hover:opacity-80">
									{title}
								</p>
								<PenLine className="w-4 h-4 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
							</div>
						}
					</div>

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
				</div>

				<div className="mt-3">
					{isEditingDescription ?
						<div className="flex flex-col gap-2 bg-accent/30 p-3 rounded-[20px] text-primary">
							<WysiwygEditor
								disabled={isSavingDescription}
								value={description}
								onChange={setDescription}
								placeholder="Type description..."
								height="250px"
								minHeight="200px"
							/>
							<div className="flex justify-end gap-2 mt-2">
								<Button
									onClick={() => {
										setDescription(
											project.description || "",
										);
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
					:	<div className="mt-[10px] text-primary text-[14px]">
							<div
								className={`wysiwyg-content text-primary transition-all duration-300 ${
									!readMore && isLongDescription ?
										"max-h-[100px] overflow-hidden relative"
									:	""
								}`}
								dangerouslySetInnerHTML={{
									__html: formatDescription(description),
								}}
							/>
							{isLongDescription && (
								<button
									type="button"
									onClick={handleReadMore}
									className="cursor-pointer underline text-xs mt-2 font-semibold hover:opacity-80 border-0 bg-transparent text-primary p-0 block"
								>
									{readMore ? "Show less" : "Read more"}
								</button>
							)}
						</div>
					}
				</div>

				<div className="bg-accent w-full mt-[10px] py-[10px] px-3 sm:px-[20px] rounded-[20px] sm:rounded-[30px]">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						{/* Interactive Priority Selector */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div
									className={`text-[12px] text-primary cursor-pointer w-fit rounded-[10px] px-2 py-1 ${renderPriority(priority)} flex items-center gap-1.5 hover:opacity-80 transition-opacity`}
								>
									{isSavingPriority ?
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									:	<Flag className="w-4 h-4" />}
									<span>{priority}</span>
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

						{/* Interactive Date Selectors */}
						<div className="flex items-center gap-2 text-primary">
							<CalendarDays className="w-4 h-4" />
							<div className="flex gap-2 items-center">
								<Popover>
									<PopoverTrigger asChild>
										<span className="text-[14px] cursor-pointer hover:underline">
											{format(startDate, "LLL d")}
										</span>
									</PopoverTrigger>
									<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
										<Calendar
											mode="single"
											selected={startDate}
											onSelect={handleUpdateStartDate}
											className="bg-primary text-secondary"
										/>
									</PopoverContent>
								</Popover>

								<MoveRight className="w-4 h-4" />

								<Popover>
									<PopoverTrigger asChild>
										<span className="text-[14px] cursor-pointer hover:underline">
											{format(dueDate, "LLL d")}
										</span>
									</PopoverTrigger>
									<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={handleUpdateDueDate}
											disabled={{ before: startDate }}
											className="bg-primary text-secondary"
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<Badge className="py-[5px] px-[10px]">
							<Diamond className="w-3.5 h-3.5 mr-1" />
							<p>
								{
									(project.tasks || []).filter(
										(t) => t.status === Status.COMPLETED,
									).length
								}{" "}
								out of {(project.tasks || []).length} tasks done
							</p>
						</Badge>
						<Badge className="py-[5px] px-[10px]">
							<Users className="w-3.5 h-3.5 mr-1" />
							<p>
								{(project.projectMembers || []).length} project
								member
								{(project.projectMembers || []).length === 1 ?
									""
								:	"s"}
							</p>
						</Badge>
					</div>

					<div className="mt-[10px] flex flex-wrap gap-2 items-center">
						{resources.map((i) => {
							return (
								<div
									key={i.id}
									className="flex items-center rounded-full gap-2 px-[15px] py-[8px] h-8 bg-primary text-secondary text-[11px]"
								>
									<Link
										target="__blank"
										href={i.url}
										className="flex items-center gap-1.5 hover:underline font-medium"
									>
										<Paperclip className="w-3.5 h-3.5" />
										<span>{i.name}</span>
									</Link>

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
										onClick={() =>
											handleDeleteResource(i.id)
										}
										className="p-0.5 hover:bg-secondary/20 rounded-full transition-colors text-secondary/70 hover:text-secondary disabled:opacity-50"
										title="Delete resource"
									>
										{deletingResourceId === i.id ?
											<LoaderCircle className="w-3 h-3 animate-spin" />
										:	<X className="w-3 h-3" />}
									</button>
								</div>
							);
						})}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="gap-2 bg-primary text-secondary px-[8px] py-[8px] h-8 flex items-center rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
									<Plus className="w-4 h-4" />
									{resources.length === 0 && (
										<p className="text-[12px]">
											Add project resource
										</p>
									)}
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="rounded-[20px] bg-accent max-w-[190px] text-primary px-[10px] py-2 border-0">
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
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="mt-[20px] flex flex-col gap-4">
					<div>
						<div className="flex items-center justify-between">
							<p className="text-xl text-primary font-bold">
								Project Progress
							</p>
							<p className="text-primary text-[12px]">
								{
									(project.tasks || []).filter(
										(t) => t.status === Status.COMPLETED,
									).length
								}{" "}
								of {(project.tasks || []).length} tasks done
							</p>
						</div>
						<Progress
							indicatorClassName="rounded-full"
							className="h-[25px]"
							value={
								(project.tasks || []).length > 0 ?
									Math.round(
										((project.tasks || []).filter(
											(t) =>
												t.status === Status.COMPLETED,
										).length /
											(project.tasks || []).length) *
											100,
									)
								:	0
							}
						/>
					</div>

					<div>
						<div className="flex items-center justify-between">
							<p className="font-bold text-primary">
								Tasks ({(project.tasks || []).length})
							</p>
							<Button className="rounded-full">
								<Plus />
							</Button>
						</div>
						<div className="mt-[10px]">
							<div className="flex flex-col gap-3">
								<Input
									placeholder="Search by task title..."
									value={taskSearch}
									onChange={(e) =>
										setTaskSearch(e.target.value)
									}
									className="bg-primary rounded-[15px] border-0 text-secondary placeholder:text-secondary/70"
								/>
								{(() => {
									const filteredTasks = (
										project.tasks || []
									).filter((t) =>
										taskSearch.trim() ?
											t.title
												.toLowerCase()
												.includes(
													taskSearch.toLowerCase(),
												)
										:	true,
									);

									if (filteredTasks.length === 0) {
										return (
											<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
												<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
													{taskSearch.trim() ?
														<Search className="w-4 h-4" />
													:	<Diamond className="w-4 h-4" />
													}
												</div>
												<p className="text-xs font-semibold text-secondary mt-[10px]">
													{taskSearch.trim() ?
														"No Matching Tasks"
													:	"No Tasks Available"}
												</p>
												<p className="text-[11px] text-center text-secondary/60">
													{taskSearch.trim() ?
														"No tasks match your search query"
													:	"No tasks found yet in this project"
													}
												</p>
											</div>
										);
									}

									return (
										<div className="overflow-x-auto custom-scrollbar">
											<Table className="min-w-[600px]">
												<TableHeader>
													<TableRow>
														<TableHead>
															Task
														</TableHead>
														<TableHead>
															Due Date
														</TableHead>
														<TableHead>
															Priority
														</TableHead>
														<TableHead>
															Status
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filteredTasks.map((t) => (
														<TableRow key={t.id}>
															<TableCell className="font-medium">
																{t.title}
															</TableCell>
															<TableCell>
																{t.endPeriod ?
																	format(
																		new Date(
																			t.endPeriod,
																		),
																		"PPP",
																	)
																:	"No due date"}
															</TableCell>
															<TableCell>
																<Badge
																	className={`${renderPriority(t.priority)} text-primary`}
																>
																	{t.priority}
																</Badge>
															</TableCell>
															<TableCell>
																<Badge
																	className={`${renderStatus(t.status)}`}
																>
																	<div className="flex items-center gap-1">
																		{t.status ===
																			Status.COMPLETED && (
																			<CircleCheck className="w-3 h-3" />
																		)}
																		{t.status ===
																			Status.CANCELLED && (
																			<CircleX className="w-3 h-3" />
																		)}
																		<span>
																			{t.status.replaceAll(
																				"_",
																				" ",
																			)}
																		</span>
																	</div>
																</Badge>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									);
								})()}
							</div>
						</div>
					</div>

					{/* Activity Section */}
					<div>
						<p className="font-bold text-primary mb-2.5">
							Activity
						</p>
						<div>
							{activities && activities.length > 0 ?
								<div className="flex flex-col gap-2">
									{activities.slice(0, 20).map((act) => {
										const user = act.member?.user;
										const actor =
											user?.userName ||
											user?.fullName ||
											"User";
										const displayName =
											user?.fullName ||
											user?.userName ||
											user?.email ||
											"User";
										const text =
											act.description || act.title;
										const timeAgo = formatRelativeTime(
											act.createdAt,
										);

										const projectMember =
											project.projectMembers?.find(
												(pm) =>
													pm.memberId ===
														act.memberId ||
													(act.member &&
														pm.memberId ===
															act.member.id) ||
													(pm.member?.userId &&
														act.member?.user?.id &&
														pm.member.userId ===
															act.member.user.id),
											);
										const projectRole =
											projectMember?.projectRole;

										return (
											<div
												key={act.id}
												className="text-xs text-primary/80 flex items-center gap-1.5 flex-wrap"
											>
												{user ?
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
																	{user.userName && (
																		<p className="font-semibold text-[13px]">
																			@
																			{
																				user.userName
																			}
																		</p>
																	)}
																	<p className="font-semibold">
																		{
																			displayName
																		}
																	</p>
																	{user.email && (
																		<p className="text-[13px]">
																			{
																				user.email
																			}
																		</p>
																	)}
																</div>
															</div>
															{projectRole ?
																<Badge className="mt-[10px] text-[10px] w-fit">
																	{projectRole.replace(
																		/_/g,
																		" ",
																	)}
																</Badge>
															: act.member?.role ?
																<Badge className="mt-[10px] text-[10px] w-fit">
																	{act.member.role.replace(
																		/_/g,
																		" ",
																	)}
																</Badge>
															:	null}
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

					{/* Comments Section */}
					<div className="bg-primary py-[15px] sm:py-[20px] rounded-[20px] sm:rounded-[30px] px-3 sm:px-[20px]">
						<p className="font-bold text-secondary">Comments</p>
						<div className="flex flex-col gap-4 mt-3">
							{comments && comments.length > 0 ?
								<div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
									{comments.map((comment) => {
										const isOwner =
											comment.member?.userId ===
												user?.id ||
											comment.member?.user?.id ===
												user?.id;

										return (
											<div
												key={comment.id}
												className="text-secondary flex flex-col gap-1"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<Avatar>
															<AvatarFallback className="w-full border border-primary bg-accent text-primary font-bold text-xs">
																{getInitials(
																	comment
																		.member
																		?.user
																		?.fullName ||
																		"User",
																)}
															</AvatarFallback>
														</Avatar>
														<div className="text-[12px]">
															<p className="font-bold">
																{comment.member
																	?.user
																	?.fullName ||
																	"Member"}
															</p>
															<p className="text-[10px]">
																@
																{comment.member
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
																	<MoreHorizontal className="w-4 h-4" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent className="w-[130px] bg-accent text-primary border-0 p-1 rounded-[12px]">
																<DropdownMenuItem
																	onClick={() =>
																		handleEditComment(
																			comment.id,
																			comment.message,
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
													<div className="mt-2 flex flex-col gap-2">
														<Textarea
															autoFocus
															disabled={
																isSavingComment
															}
															value={
																editingMessage
															}
															onChange={(e) =>
																setEditingMessage(
																	e.target
																		.value,
																)
															}
															onKeyDown={(e) => {
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
																)
																	setEditingCommentId(
																		null,
																	);
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
														<p className="text-[12px]">
															{comment.message} -{" "}
															<b className="text-xs">
																{formatRelativeTime(
																	comment.createdAt,
																)}
															</b>
														</p>
													</div>
												}
											</div>
										);
									})}
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

							<div className="relative mt-1">
								<Textarea
									disabled={isPostingComment}
									value={commentInput}
									onChange={(e) =>
										setCommentInput(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleAddComment();
										}
									}}
									placeholder="Start typing..."
									className="rounded-[20px] resize-none h-[120px] bg-accent border-0 focus-visible:ring-0 text-primary outline-0 ring-0"
								/>
								<div
									onClick={handleAddComment}
									className="w-[40px] h-[40px] rounded-full cursor-pointer flex items-center justify-center absolute bg-primary text-secondary right-0 bottom-0 mb-[15px] mr-[15px]"
								>
									{isPostingComment ?
										<Loader2 className="w-4 h-4 animate-spin" />
									:	<MoveUp className="w-4 h-4" />}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Sidebar with Interactive Auto-Saving Controls */}
			<div className="bg-accent px-3 sm:px-[20px] py-[15px] sm:py-[20px] lg:h-[calc(100vh-30px)] overflow-y-auto custom-scrollbar w-full lg:w-[25%] rounded-[20px] sm:rounded-[30px] lg:sticky lg:top-0">
				<div className="flex flex-col h-full justify-between">
					<div className="flex flex-col gap-7">
						{/* Status Auto-Save */}
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
							<div className="mt-[10px]">
								<RadioGroup
									value={status}
									onValueChange={(val) =>
										handleUpdateStatus(val as Status)
									}
								>
									{Object.values(Status).map((i, k) => {
										return (
											<div
												key={k}
												className="flex items-center gap-3"
											>
												<RadioGroupItem
													value={i}
													id={`status-${k}`}
												/>
												<Label
													className="text-[12px] uppercase text-primary cursor-pointer"
													htmlFor={`status-${k}`}
												>
													{i.replaceAll("_", " ")}
												</Label>
											</div>
										);
									})}
								</RadioGroup>
							</div>
						</div>

						{/* Project Lead Selector */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<UserStar className="w-4 h-4" />
									<p className="font-bold">Project Lead</p>
								</div>
								{isSavingMembers && (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								)}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<div className="mt-[10px] w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px] cursor-pointer hover:opacity-80 transition-opacity">
										{projectLeadName}
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[220px] border-0 bg-accent p-2">
									<div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2">
										<Search className="w-3.5 h-3.5 text-primary/40 shrink-0" />
										<input
											value={memberSearch}
											onChange={(e) =>
												setMemberSearch(e.target.value)
											}
											placeholder="Search members..."
											className="flex-1 outline-none bg-transparent text-sm placeholder:text-primary/30"
										/>
									</div>
									<div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
										{displayedMembers
											.filter((member) =>
												selectedMembers.includes(
													member.id,
												),
											)
											.map((member) => (
												<div
													key={member.id}
													onClick={() =>
														handleSetProjectLead(
															member.id,
														)
													}
													className={`cursor-pointer flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-primary/10 transition-colors ${
														(
															member.id ===
															selectedLeadId
														) ?
															"bg-primary/10"
														:	""
													}`}
												>
													<Checkbox
														checked={
															member.id ===
															selectedLeadId
														}
													/>
													<div>
														<p className="font-semibold text-[13px]">
															{
																member.user
																	.fullName
															}
														</p>
														<p className="text-[13px] text-primary/60">
															@
															{
																member.user
																	.userName
															}
														</p>
													</div>
												</div>
											))}
										{selectedMembers.length === 0 && (
											<p className="px-2 py-2 text-xs text-primary/50">
												Select contributors first.
											</p>
										)}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Contributors Selector */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<Users className="w-4 h-4" />
									<p className="font-bold">Contributors</p>
								</div>
							</div>

							<div className="mt-[10px] flex flex-row flex-wrap gap-1 items-center">
								{contributors.map((i) => {
									const fullName =
										i.member.userId === user?.id ?
											"YOU"
										:	i.member.user.fullName;
									return (
										<p
											key={i.memberId}
											className="w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px]"
										>
											{fullName}
										</p>
									);
								})}

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
											{displayedMembers.map((i) => (
												<div
													key={i.id}
													onClick={() =>
														toggleMember(i.id)
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
							</div>
						</div>

						{/* Due Date */}
						<div>
							<div className="flex text-primary gap-3 items-center">
								<CalendarDays className="w-4 h-4" />
								<p className="font-bold">Due Date</p>
							</div>
							<Popover>
								<PopoverTrigger asChild>
									<p className="text-[12px] mt-[10px] text-primary cursor-pointer hover:underline">
										{format(dueDate, "PPP")}
									</p>
								</PopoverTrigger>
								<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-2">
									<Calendar
										mode="single"
										selected={dueDate}
										onSelect={handleUpdateDueDate}
										disabled={{ before: startDate }}
										className="bg-primary text-secondary"
									/>
								</PopoverContent>
							</Popover>
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
							<div className="flex mt-[10px] flex-row flex-wrap gap-2 items-center">
								{labels.map((i, k) => {
									return (
										<Badge
											key={k}
											className="w-fit px-[10px] py-[3px] rounded-[9px] bg-[#AD6B3D] text-secondary text-[10px] flex items-center gap-1"
										>
											<span>{i}</span>
											<button
												type="button"
												onClick={() => removeLabel(i)}
												className="hover:opacity-70"
											>
												<X className="w-3 h-3" />
											</button>
										</Badge>
									);
								})}

								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
										>
											<Plus className="w-3 h-3" />
										</button>
									</PopoverTrigger>
									<PopoverContent className="rounded-[20px] bg-accent text-primary border-0 p-3">
										<div className="flex flex-col gap-2">
											<input
												placeholder="#tag"
												className="h-8 rounded-md text-[12px] bg-primary text-secondary px-2 outline-none"
												value={labelInput}
												onChange={(e) =>
													setLabelInput(
														e.target.value,
													)
												}
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
							</div>
						</div>
					</div>

					<div className=" w-full">
						<Button
							onClick={() => setIsDeleteDialogOpen(true)}
							className=" py-[25px] rounded-full bg-destructive hover:bg-destructive/90 w-full cursor-pointer"
						>
							<Trash2 />
							Delete Project
						</Button>
					</div>
				</div>
			</div>

			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					setIsDeleteDialogOpen(open);
					if (!open) {
						setDeleteConfirmInput("");
						setHasCopiedName(false);
					}
				}}
			>
				<DialogContent className="rounded-[20px] border-0 bg-primary text-secondary sm:max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold text-accent flex items-center gap-2">
							<Trash2 className="w-5 h-5 text-accent shrink-0" />
							Delete Project
						</DialogTitle>
						<DialogDescription className="text-[13px] text-secondary/80 mt-2 leading-relaxed">
							This action cannot be undone. This will permanently
							delete the project{" "}
							<strong className="text-accent">
								{title || project.title}
							</strong>{" "}
							and all associated tasks, comments, and resources.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-3 my-4">
						<label className="text-xs font-semibold text-secondary/90 text-center">
							Project name to verify:
						</label>
						<div className="flex items-center justify-center p-3 rounded-xl bg-secondary/10 border border-secondary/20">
							<span className="font-mono text-sm font-medium text-accent truncate select-all text-center">
								{title || project.title}
							</span>
						</div>

						<label className="text-xs font-semibold text-secondary/90 mt-1">
							Type project name to confirm:
						</label>
						<Input
							value={deleteConfirmInput}
							onChange={(e) =>
								setDeleteConfirmInput(e.target.value)
							}
							placeholder={`Type "${title || project.title}" to confirm`}
							className="h-10 rounded-xl bg-primary border-secondary/30 text-secondary placeholder:text-secondary/40 focus-visible:ring-accent"
						/>
					</div>

					<DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
						<DialogClose asChild>
							<Button
								type="button"
								disabled={isDeletingProject}
								className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 text-primary border-0 font-medium cursor-pointer"
							>
								Cancel
							</Button>
						</DialogClose>
						<Button
							type="button"
							onClick={handleDeleteProject}
							disabled={
								deleteConfirmInput.trim() !==
									(title || project.title).trim() ||
								isDeletingProject
							}
							className="w-full sm:w-auto rounded-full bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
						>
							{isDeletingProject ?
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Deleting...
								</>
							:	<>
									<Trash2 className="w-4 h-4" />
									Delete Project
								</>
							}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
