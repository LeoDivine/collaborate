"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
	Bell,
	Box,
	Check,
	CircleCheck,
	CircleX,
	ClipboardList,
	Clock,
	Crown,
	ChevronDown,
	Diamond,
	Eye,
	EyeOff,
	Globe,
	Loader2,
	LoaderCircle,
	Lock,
	LogOut,
	MoveLeft,
	PenLine,
	Plus,
	Search,
	Settings,
	Shield,
	Trash2,
	UserCheck,
	UserMinus,
	UserPlus,
	Users,
	UserStar,
	Workflow,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import TaskAssigneeOverview from "@/components/pages/tasks/task-assignee-overview";
import { PresenceAvatar } from "@/components/shared/presence-avatar";
import { PresenceIndicator } from "@/components/shared/presence-indicator";
import { AssignTeamTaskDialog } from "./assign-team-task-dialog";
import {
	updateTeamName,
	updateTeamDescription,
	updateTeamSettings,
	toggleTeamLead,
	removeMemberFromTeam,
	addMembersToTeam,
	joinTeam,
	handleTeamJoinRequest,
	cancelTeamJoinRequest,
	deleteTeam,
} from "@/lib/services/team.services";
import {
	formatPriority,
	formatStatus,
	getInitials,
	renderPriority,
	renderStatus,
} from "@/lib/utils";
import { Status, WorkspaceRoles } from "../../../../generated/prisma/enums";
import type {
	MembersUsers,
	Projects,
	Tasks,
	TeamMemberItem,
	TeamWithMembers,
} from "@/lib/types";

interface SingleTeamViewProps {
	team: TeamWithMembers;
	workspaceId: string;
	currentUserId?: string;
	currentMemberRole?: WorkspaceRoles;
	currentMemberId?: string;
	members?: MembersUsers[];
	projects?: Projects[];
}

export default function SingleTeamView({
	team: initialTeam,
	workspaceId,
	currentUserId,
	currentMemberRole,
	currentMemberId,
	members: workspaceMembers = [],
	projects: workspaceProjects = [],
}: SingleTeamViewProps) {
	const router = useRouter();

	const [team, setTeam] = useState<TeamWithMembers>(initialTeam);
	const [tasks, setTasks] = useState<Tasks[]>(initialTeam.tasks || []);

	// Lead IDs Set for reliable role resolution
	const leadIdSet = useMemo(() => {
		return new Set([
			...(team.leadIds || []),
			...(team.leads || []).map((l) => l.id),
			...(team.leads || []).map((l) => (l as any).userId).filter(Boolean),
		]);
	}, [team.leadIds, team.leads]);

	// Resolved Caller Membership & Permissions
	const resolvedMember = useMemo(() => {
		return (
			workspaceMembers.find(
				(m) =>
					(currentMemberId && m.id === currentMemberId) ||
					(currentUserId && m.userId === currentUserId),
			) ||
			team.members.find(
				(m) =>
					(currentMemberId && m.id === currentMemberId) ||
					(currentUserId && m.userId === currentUserId),
			)
		);
	}, [workspaceMembers, team.members, currentMemberId, currentUserId]);

	const effectiveRole = currentMemberRole || (resolvedMember as any)?.role;
	const isOwner =
		effectiveRole === WorkspaceRoles.OWNER || effectiveRole === "OWNER";
	const isAdmin =
		effectiveRole === WorkspaceRoles.ADMIN || effectiveRole === "ADMIN";
	const isCallerLead = Boolean(
		(currentMemberId && leadIdSet.has(currentMemberId)) ||
		(resolvedMember && leadIdSet.has(resolvedMember.id)) ||
		team.leads.some(
			(l) =>
				l.id === currentMemberId ||
				(currentUserId &&
					(l.userId === currentUserId ||
						l.user?.id === currentUserId)),
		),
	);
	const isCallerTeamMember = Boolean(
		team.members.some(
			(m) =>
				(currentMemberId && m.id === currentMemberId) ||
				(currentUserId &&
					(m.userId === currentUserId ||
						m.user?.id === currentUserId)),
		),
	);
	const canManageTeam = isOwner || isAdmin || isCallerLead;
	const canDeleteTeam = isOwner || isAdmin || isCallerLead;

	// Editable Title State
	const [title, setTitle] = useState(team.name);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isSavingTitle, setIsSavingTitle] = useState(false);

	// Editable Description State
	const [description, setDescription] = useState(team.description || "");
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);
	const [readMore, setReadMore] = useState(false);

	// Tasks State & Filtering
	const [taskSearch, setTaskSearch] = useState("");
	const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

	// Member Management State
	const [memberSearch, setMemberSearch] = useState("");
	const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
	const [selectedNewMemberIds, setSelectedNewMemberIds] = useState<string[]>(
		[],
	);
	const [isAddingMembers, setIsAddingMembers] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<TeamMemberItem | null>(
		null,
	);
	const [isRemovingMember, setIsRemovingMember] = useState(false);

	// Delete Team State
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
	const [isDeletingTeam, setIsDeletingTeam] = useState(false);

	// Team Settings & Join Request State
	const [teamVisibility, setTeamVisibility] = useState<"PUBLIC" | "PRIVATE">(
		initialTeam.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
	);
	const [allowSelfJoin, setAllowSelfJoin] = useState<boolean>(
		initialTeam.allowSelfJoin !== false,
	);
	const [requireApproval, setRequireApproval] = useState<boolean>(
		Boolean(initialTeam.requireApproval),
	);
	const [allowMemberTaskCreation, setAllowMemberTaskCreation] =
		useState<boolean>(Boolean(initialTeam.allowMemberTaskCreation));
	const [autoAssignAllMembers, setAutoAssignAllMembers] = useState<boolean>(
		Boolean(initialTeam.autoAssignAllMembers),
	);
	const [allowMemberInvites, setAllowMemberInvites] = useState<boolean>(
		Boolean(initialTeam.allowMemberInvites),
	);
	const [hideTasksFromNonMembers, setHideTasksFromNonMembers] =
		useState<boolean>(Boolean(initialTeam.hideTasksFromNonMembers));
	const [notifyAllOnNewTask, setNotifyAllOnNewTask] = useState<boolean>(
		initialTeam.notifyAllOnNewTask !== false,
	);
	const [notifyLeadsOnJoinLeave, setNotifyLeadsOnJoinLeave] =
		useState<boolean>(initialTeam.notifyLeadsOnJoinLeave !== false);
	const [isSavingSettings, setIsSavingSettings] = useState(false);
	const [isJoiningTeam, setIsJoiningTeam] = useState(false);
	const [processingRequestMemberId, setProcessingRequestMemberId] = useState<
		string | null
	>(null);

	const canCreateTeamTask =
		canManageTeam || (isCallerTeamMember && allowMemberTaskCreation);
	const canAddTeamMembers =
		canManageTeam || (isCallerTeamMember && allowMemberInvites);
	const canViewTeamTasks =
		canManageTeam || isCallerTeamMember || !hideTasksFromNonMembers;

	useEffect(() => {
		setTeam(initialTeam);
		setTitle(initialTeam.name);
		setDescription(initialTeam.description || "");
		setTasks(initialTeam.tasks || []);
		setTeamVisibility(
			initialTeam.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
		);
		setAllowSelfJoin(initialTeam.allowSelfJoin !== false);
		setRequireApproval(Boolean(initialTeam.requireApproval));
		setAllowMemberTaskCreation(
			Boolean(initialTeam.allowMemberTaskCreation),
		);
		setAutoAssignAllMembers(Boolean(initialTeam.autoAssignAllMembers));
		setAllowMemberInvites(Boolean(initialTeam.allowMemberInvites));
		setHideTasksFromNonMembers(
			Boolean(initialTeam.hideTasksFromNonMembers),
		);
		setNotifyAllOnNewTask(initialTeam.notifyAllOnNewTask !== false);
		setNotifyLeadsOnJoinLeave(initialTeam.notifyLeadsOnJoinLeave !== false);
	}, [initialTeam]);

	const handleSaveSettings = async (overrides?: {
		visibility?: "PUBLIC" | "PRIVATE";
		allowSelfJoin?: boolean;
		requireApproval?: boolean;
		allowMemberTaskCreation?: boolean;
		autoAssignAllMembers?: boolean;
		allowMemberInvites?: boolean;
		hideTasksFromNonMembers?: boolean;
		notifyAllOnNewTask?: boolean;
		notifyLeadsOnJoinLeave?: boolean;
	}) => {
		if (!canManageTeam) return;
		const nextVisibility = overrides?.visibility ?? teamVisibility;
		const nextAllowSelfJoin = overrides?.allowSelfJoin ?? allowSelfJoin;
		const nextRequireApproval =
			overrides?.requireApproval ?? requireApproval;
		const nextAllowMemberTaskCreation =
			overrides?.allowMemberTaskCreation ?? allowMemberTaskCreation;
		const nextAutoAssignAllMembers =
			overrides?.autoAssignAllMembers ?? autoAssignAllMembers;
		const nextAllowMemberInvites =
			overrides?.allowMemberInvites ?? allowMemberInvites;
		const nextHideTasksFromNonMembers =
			overrides?.hideTasksFromNonMembers ?? hideTasksFromNonMembers;
		const nextNotifyAllOnNewTask =
			overrides?.notifyAllOnNewTask ?? notifyAllOnNewTask;
		const nextNotifyLeadsOnJoinLeave =
			overrides?.notifyLeadsOnJoinLeave ?? notifyLeadsOnJoinLeave;

		setIsSavingSettings(true);
		try {
			const res = await updateTeamSettings({
				teamId: team.id,
				workspaceId,
				visibility: nextVisibility,
				allowSelfJoin: nextAllowSelfJoin,
				requireApproval: nextRequireApproval,
				allowMemberTaskCreation: nextAllowMemberTaskCreation,
				autoAssignAllMembers: nextAutoAssignAllMembers,
				allowMemberInvites: nextAllowMemberInvites,
				hideTasksFromNonMembers: nextHideTasksFromNonMembers,
				notifyAllOnNewTask: nextNotifyAllOnNewTask,
				notifyLeadsOnJoinLeave: nextNotifyLeadsOnJoinLeave,
			});
			if (res.success) {
				toast.success(res.message);
				setTeamVisibility(nextVisibility);
				setAllowSelfJoin(nextAllowSelfJoin);
				setRequireApproval(nextRequireApproval);
				setAllowMemberTaskCreation(nextAllowMemberTaskCreation);
				setAutoAssignAllMembers(nextAutoAssignAllMembers);
				setAllowMemberInvites(nextAllowMemberInvites);
				setHideTasksFromNonMembers(nextHideTasksFromNonMembers);
				setNotifyAllOnNewTask(nextNotifyAllOnNewTask);
				setNotifyLeadsOnJoinLeave(nextNotifyLeadsOnJoinLeave);
				setTeam((prev) => ({
					...prev,
					visibility: nextVisibility,
					allowSelfJoin: nextAllowSelfJoin,
					requireApproval: nextRequireApproval,
					allowMemberTaskCreation: nextAllowMemberTaskCreation,
					autoAssignAllMembers: nextAutoAssignAllMembers,
					allowMemberInvites: nextAllowMemberInvites,
					hideTasksFromNonMembers: nextHideTasksFromNonMembers,
					notifyAllOnNewTask: nextNotifyAllOnNewTask,
					notifyLeadsOnJoinLeave: nextNotifyLeadsOnJoinLeave,
				}));
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update team settings");
			}
		} catch {
			toast.error("Failed to update team settings");
		} finally {
			setIsSavingSettings(false);
		}
	};

	const handleReviewJoinRequest = async (
		memberId: string,
		action: "APPROVE" | "REJECT",
	) => {
		if (!canManageTeam) return;
		setProcessingRequestMemberId(memberId);
		try {
			const res = await handleTeamJoinRequest({
				teamId: team.id,
				workspaceId,
				memberId,
				action,
			});
			if (res.success) {
				toast.success(res.message);
				const pendingItem = (team.pendingMembers || []).find(
					(m) => m.id === memberId,
				);
				setTeam((prev) => {
					const updatedPendingMembers = (
						prev.pendingMembers || []
					).filter((m) => m.id !== memberId);
					const updatedPendingIds = (
						prev.pendingMemberIds || []
					).filter((id) => id !== memberId);
					const updatedMembers =
						(
							action === "APPROVE" &&
							pendingItem &&
							!prev.members.some((m) => m.id === memberId)
						) ?
							[...prev.members, { ...pendingItem, isLead: false }]
						:	prev.members;
					return {
						...prev,
						members: updatedMembers,
						memberIds: updatedMembers.map((m) => m.id),
						pendingMembers: updatedPendingMembers,
						pendingMemberIds: updatedPendingIds,
						_count: {
							...prev._count,
							members: updatedMembers.length,
						},
					};
				});
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to process join request");
		} finally {
			setProcessingRequestMemberId(null);
		}
	};

	const handleJoinCurrentTeam = async () => {
		setIsJoiningTeam(true);
		try {
			const res = await joinTeam({
				teamId: team.id,
				workspaceId,
			});
			if (res.success) {
				toast.success(res.message);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to join team");
		} finally {
			setIsJoiningTeam(false);
		}
	};

	const handleCancelJoinRequest = async () => {
		setIsJoiningTeam(true);
		try {
			const res = await cancelTeamJoinRequest({
				teamId: team.id,
				workspaceId,
			});
			if (res.success) {
				toast.success(res.message);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to cancel join request");
		} finally {
			setIsJoiningTeam(false);
		}
	};

	// Title Save Handler
	const handleSaveTitle = async () => {
		const newTitle = title.trim();
		if (!newTitle || newTitle === team.name) {
			setTitle(team.name);
			setIsEditingTitle(false);
			return;
		}

		setIsSavingTitle(true);
		try {
			const res = await updateTeamName({
				teamId: team.id,
				workspaceId,
				name: newTitle,
			});
			if (res.success) {
				toast.success("Team name updated");
				setTeam((prev) => ({ ...prev, name: newTitle }));
				setIsEditingTitle(false);
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update team name");
				setTitle(team.name);
			}
		} catch {
			toast.error("An error occurred while updating team name");
			setTitle(team.name);
		} finally {
			setIsSavingTitle(false);
		}
	};

	// Description Save Handler
	const handleSaveDescription = async () => {
		setIsSavingDescription(true);
		try {
			const res = await updateTeamDescription({
				teamId: team.id,
				workspaceId,
				description,
			});
			if (res.success) {
				toast.success("Team description updated");
				setTeam((prev) => ({ ...prev, description }));
				setIsEditingDescription(false);
				router.refresh();
			} else {
				toast.error(res.message || "Failed to update description");
			}
		} catch {
			toast.error("An error occurred while saving description");
		} finally {
			setIsSavingDescription(false);
		}
	};

	// Team Lead Toggle Handler
	const handleToggleLead = async (memberId: string) => {
		if (!canManageTeam) return;
		try {
			const res = await toggleTeamLead({
				teamId: team.id,
				workspaceId,
				memberId,
			});
			if (res.success) {
				toast.success(res.message);
				const isNowLead = !team.leadIds.includes(memberId);
				const updatedLeadIds =
					isNowLead ?
						[...team.leadIds, memberId]
					:	team.leadIds.filter((id) => id !== memberId);
				const updatedMembers = team.members.map((m) =>
					m.id === memberId ? { ...m, isLead: isNowLead } : m,
				);
				setTeam((prev) => ({
					...prev,
					leadIds: updatedLeadIds,
					members: updatedMembers,
					leads: updatedMembers.filter((m) => m.isLead),
				}));
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to toggle team lead");
		}
	};

	// Member Remove / Leave Handler
	const handleConfirmRemoveMember = async () => {
		if (!memberToRemove) return;
		const isLeavingSelf = Boolean(
			(currentMemberId && memberToRemove.id === currentMemberId) ||
			(currentUserId &&
				(memberToRemove.userId === currentUserId ||
					memberToRemove.user?.id === currentUserId)),
		);
		setIsRemovingMember(true);
		try {
			const res = await removeMemberFromTeam({
				teamId: team.id,
				workspaceId,
				memberId: memberToRemove.id,
			});
			if (res.success) {
				toast.success(
					isLeavingSelf ? `You left "${team.name}"` : res.message,
				);
				setTeam((prev) => {
					const updatedMembers = prev.members.filter(
						(m) => m.id !== memberToRemove.id,
					);
					const idsToRemove = new Set(
						[memberToRemove.id, memberToRemove.userId].filter(
							Boolean,
						),
					);
					const updatedLeadIds = (prev.leadIds || []).filter(
						(id) => !idsToRemove.has(id),
					);
					const updatedLeads = (prev.leads || []).filter(
						(lead) =>
							!idsToRemove.has(lead.id) &&
							(!lead.userId || !idsToRemove.has(lead.userId)),
					);
					return {
						...prev,
						members: updatedMembers,
						memberIds: (prev.memberIds || []).filter(
							(id) => !idsToRemove.has(id),
						),
						leadIds: updatedLeadIds,
						leads: updatedLeads,
						_count: {
							...prev._count,
							members: updatedMembers.length,
						},
					};
				});
				setMemberToRemove(null);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error(
				isLeavingSelf ?
					"Failed to leave team"
				:	"Failed to remove member",
			);
		} finally {
			setIsRemovingMember(false);
		}
	};

	// Add Members Handler
	const handleAddMembers = async () => {
		if (selectedNewMemberIds.length === 0) return;
		setIsAddingMembers(true);
		try {
			const res = await addMembersToTeam({
				teamId: team.id,
				workspaceId,
				memberIds: selectedNewMemberIds,
			});
			if (res.success) {
				toast.success(res.message);
				const newMembersToAdd: TeamMemberItem[] = workspaceMembers
					.filter((wm) => selectedNewMemberIds.includes(wm.id))
					.map((wm) => ({
						...wm,
						isLead: false,
					}));
				setTeam((prev) => {
					const merged = [...prev.members];
					newMembersToAdd.forEach((nm) => {
						if (!merged.some((m) => m.id === nm.id))
							merged.push(nm);
					});
					return {
						...prev,
						members: merged,
						memberIds: Array.from(
							new Set([
								...(prev.memberIds || []),
								...merged.map((m) => m.id),
							]),
						),
						_count: {
							...prev._count,
							members: merged.length,
						},
					};
				});
				setSelectedNewMemberIds([]);
				setIsAddMembersOpen(false);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Failed to add members");
		} finally {
			setIsAddingMembers(false);
		}
	};

	// Delete Team Handler
	const handleDeleteTeam = async () => {
		if (deleteConfirmInput.trim() !== team.name.trim()) {
			toast.error("Team name does not match");
			return;
		}

		setIsDeletingTeam(true);
		try {
			const res = await deleteTeam({
				teamId: team.id,
				workspaceId,
			});
			if (res.success) {
				toast.success(res.message);
				router.push("/teams");
			} else {
				toast.error(res.message);
				setIsDeletingTeam(false);
			}
		} catch {
			toast.error("Failed to delete team");
			setIsDeletingTeam(false);
		}
	};

	// Filtered Tasks
	const filteredTasks = useMemo(() => {
		return tasks.filter((t) => {
			if (!taskSearch.trim()) return true;
			const q = taskSearch.toLowerCase();
			return (
				t.title.toLowerCase().includes(q) ||
				t.project?.title?.toLowerCase().includes(q)
			);
		});
	}, [tasks, taskSearch]);

	const sortedTasks = useMemo(() => {
		return [...filteredTasks].sort((a, b) => {
			const isACompleted = a.status === Status.COMPLETED;
			const isBCompleted = b.status === Status.COMPLETED;
			if (isACompleted !== isBCompleted) {
				return isACompleted ? 1 : -1;
			}
			return 0;
		});
	}, [filteredTasks]);

	// Filtered Team Members (Team leads first, then regular team members)
	const filteredTeamMembers = useMemo(() => {
		let list = team.members || [];
		if (memberSearch.trim()) {
			const q = memberSearch.toLowerCase();
			list = list.filter(
				(m) =>
					m.user?.fullName?.toLowerCase().includes(q) ||
					m.user?.userName?.toLowerCase().includes(q) ||
					m.user?.email?.toLowerCase().includes(q),
			);
		}
		return [...list].sort((a, b) => {
			const aIsLead = Boolean(
				a.isLead ||
				leadIdSet.has(a.id) ||
				(a.userId && leadIdSet.has(a.userId)),
			);
			const bIsLead = Boolean(
				b.isLead ||
				leadIdSet.has(b.id) ||
				(b.userId && leadIdSet.has(b.userId)),
			);
			if (aIsLead !== bIsLead) {
				return aIsLead ? -1 : 1; // team leads first
			}
			return (a.user?.fullName || "").localeCompare(
				b.user?.fullName || "",
			);
		});
	}, [team.members, leadIdSet, memberSearch]);

	// Workspace members available to add
	const availableWorkspaceMembers = useMemo(() => {
		const currentTeamMemberIds = new Set(team.members.map((m) => m.id));
		return workspaceMembers.filter((m) => !currentTeamMemberIds.has(m.id));
	}, [workspaceMembers, team.members]);

	// Calculated Stats
	const totalTasksCount = tasks.length;
	const completedTasksCount = tasks.filter(
		(t) => t.status === Status.COMPLETED,
	).length;

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
		<div className="flex flex-col lg:flex-row gap-4 w-full items-start">
			{/* Left Column (Main Area) */}
			<div className="w-full lg:w-[75%] grow flex flex-col gap-4">
				{/* Top Bar: Responsive 2-tier header preventing buttons from blocking team title */}
				<div className="flex flex-col gap-3 w-full">
					{/* Actions & Navigation Row */}
					<div className="flex items-center justify-between gap-2.5 w-full">
						<Link
							href="/teams"
							className="py-2 px-3.5 rounded-full flex gap-2 items-center justify-center bg-primary shrink-0 text-secondary hover:bg-primary/90 transition-colors shadow-sm"
						>
							<MoveLeft className="w-4 h-4" />
							<span className="text-[14px]">Back</span>
						</Link>

						<div className="flex items-center gap-2 flex-wrap justify-end">
							{(() => {
								const currentMemberObj = team.members.find(
									(m) =>
										(currentMemberId &&
											m.id === currentMemberId) ||
										(currentUserId &&
											(m.userId === currentUserId ||
												m.user?.id === currentUserId)),
								);
								if (currentMemberObj) {
									return (
										<Button
											size="sm"
											variant="destructive"
											onClick={() =>
												setMemberToRemove(
													currentMemberObj,
												)
											}
											className="rounded-full flex items-center gap-2 h-9 px-4 bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm border-0"
											title="Leave this team"
										>
											<LogOut className="w-3.5 h-3.5 text-white shrink-0" />
											<span>Leave Team</span>
										</Button>
									);
								}

								const hasPendingRequest = Boolean(
									currentMemberId &&
									(team.pendingMemberIds?.includes(
										currentMemberId,
									) ||
										team.pendingMembers?.some(
											(m) => m.id === currentMemberId,
										)),
								);

								if (hasPendingRequest) {
									return (
										<Button
											size="sm"
											variant="outline"
											disabled={isJoiningTeam}
											onClick={handleCancelJoinRequest}
											className="rounded-full flex items-center gap-1.5 h-9 px-3 text-xs border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
											title="Click to cancel your pending join request"
										>
											{isJoiningTeam ?
												<LoaderCircle className="w-3.5 h-3.5 animate-spin" />
											:	<Clock className="w-3.5 h-3.5" />}
											<span>
												Pending Approval (Cancel)
											</span>
										</Button>
									);
								}

								if (allowSelfJoin && currentMemberId) {
									return (
										<Button
											size="sm"
											disabled={isJoiningTeam}
											onClick={handleJoinCurrentTeam}
											className="rounded-full flex items-center gap-1.5 h-9 px-3 text-xs cursor-pointer"
										>
											{isJoiningTeam ?
												<LoaderCircle className="w-3.5 h-3.5 animate-spin" />
											:	<UserPlus className="w-3.5 h-3.5" />
											}
											<span>
												{requireApproval ?
													"Request to Join"
												:	"Join Team"}
											</span>
										</Button>
									);
								}

								if (!allowSelfJoin && currentMemberId) {
									return (
										<Badge className="rounded-full h-9 px-3 text-xs bg-primary text-secondary border border-secondary/15 flex items-center gap-1.5">
											<Shield className="w-3.5 h-3.5" />
											<span>Invite Only</span>
										</Badge>
									);
								}

								return null;
							})()}

							{canManageTeam && (
								<Button
									size="sm"
									onClick={() =>
										setIsEditingDescription(
											!isEditingDescription,
										)
									}
									className="rounded-full flex items-center gap-2 h-9 px-3.5 text-xs font-semibold"
								>
									<PenLine className="w-3.5 h-3.5" />
									<span>
										{isEditingDescription ?
											"Close Editor"
										:	"Edit Description"}
									</span>
								</Button>
							)}
						</div>
					</div>

					{/* Team Title & Visibility Row */}
					<div className="flex items-center gap-2.5 flex-wrap min-w-0">
						{canManageTeam ?
							isEditingTitle ?
								<div className="flex items-center gap-2 flex-1 max-w-lg min-w-[200px]">
									<Input
										autoFocus
										disabled={isSavingTitle}
										value={title}
										onChange={(e) =>
											setTitle(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter")
												handleSaveTitle();
											if (e.key === "Escape") {
												setTitle(team.name);
												setIsEditingTitle(false);
											}
										}}
										onBlur={handleSaveTitle}
										placeholder="Team name"
										className="text-primary text-xl sm:text-2xl md:text-3xl font-bold bg-accent rounded-xl border-primary/20 placeholder:text-primary/50"
									/>
									{isSavingTitle && (
										<Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
									)}
								</div>
							:	<div
									onClick={() => setIsEditingTitle(true)}
									className="group flex items-center gap-2 cursor-pointer min-w-0 max-w-full"
								>
									<h1 className="text-primary text-xl sm:text-2xl md:text-3xl font-bold break-words leading-tight hover:opacity-80">
										{title}
									</h1>
									<PenLine className="w-4 h-4 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
								</div>

						:	<h1 className="text-primary text-xl sm:text-2xl md:text-3xl font-bold break-words leading-tight">
								{title}
							</h1>
						}

						{teamVisibility === "PRIVATE" ?
							<Badge className="bg-primary/10 text-primary/70 border-0 flex items-center gap-1 text-[11px] py-0.5 px-2 rounded-full shrink-0">
								<Lock className="w-3 h-3" />
								Private
							</Badge>
						:	<Badge className="bg-primary/10 text-primary/70 border-0 flex items-center gap-1 text-[11px] py-0.5 px-2 rounded-full shrink-0">
								<Globe className="w-3 h-3" />
								Public
							</Badge>
						}
					</div>
				</div>

				{/* Description */}
				<div>
					{isEditingDescription ?
						<div className="flex flex-col gap-2 bg-accent/30 p-3 rounded-[20px] text-primary">
							<WysiwygEditor
								disabled={isSavingDescription}
								value={description}
								onChange={setDescription}
								placeholder="Type description..."
								height="250px"
								minHeight="200px"
								textColor="text-primary"
								toolbarClassName="bg-[#969696]"
							/>
							<div className="flex justify-end gap-2 mt-2">
								<Button
									onClick={() => {
										setDescription(team.description || "");
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
										<LoaderCircle className="w-3.5 h-3.5 animate-spin mr-1" />
									:	null}
									Save Description
								</Button>
							</div>
						</div>
					:	<div className="text-primary text-[14px]">
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
									onClick={() => setReadMore(!readMore)}
									className="cursor-pointer underline text-xs mt-2 font-semibold hover:opacity-80 border-0 bg-transparent text-primary p-0 block"
								>
									{readMore ? "Show less" : "Read more"}
								</button>
							)}
						</div>
					}
				</div>

				{/* Summary Strip (Matches single-project-view exact layout) */}
				<div className="bg-[#969696] w-full py-2.5 px-3 sm:px-4 rounded-2xl">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						{/* Team Leads Badges */}
						<div className="flex items-center gap-1.5 flex-wrap">
							{team.leads.length === 0 ?
								<Badge className="py-[5px] px-[10px]">
									<Crown className="w-3.5 h-3.5 mr-1 text-amber-400" />
									<p>No Lead Assigned</p>
								</Badge>
							:	team.leads.map((lead) => (
									<Badge
										key={lead.id}
										className="py-[5px] px-[10px]"
									>
										<Crown className="w-3.5 h-3.5 mr-1 text-amber-400" />
										<p className="truncate max-w-[130px]">
											{lead.user.fullName}
										</p>
									</Badge>
								))
							}
						</div>

						{/* Tasks Done Badge (Visibility controlled by hideTasksFromNonMembers) */}
						{canViewTeamTasks ?
							<Badge className="py-[5px] px-[10px]">
								<Diamond className="w-3.5 h-3.5 mr-1" />
								<p>
									{completedTasksCount} out of{" "}
									{totalTasksCount} tasks done
								</p>
							</Badge>
						:	<Badge className="py-[5px] px-[10px]">
								<EyeOff className="w-3.5 h-3.5 mr-1" />
								<p>Tasks Hidden from Non-Members</p>
							</Badge>
						}

						{/* Members Count Badge */}
						<Badge className="py-[5px] px-[10px]">
							<Users className="w-3.5 h-3.5 mr-1" />
							<p>
								{team.members.length} team member
								{team.members.length === 1 ? "" : "s"}
							</p>
						</Badge>

						{/* Join Policy Badge (Visibility controlled by allowSelfJoin & requireApproval) */}
						{!allowSelfJoin ?
							<Badge className="py-[5px] px-[10px]">
								<Shield className="w-3.5 h-3.5 mr-1" />
								<p>Invite Only</p>
							</Badge>
						: requireApproval ?
							<Badge className="py-[5px] px-[10px]">
								<Shield className="w-3.5 h-3.5 mr-1" />
								<p>Approval Required</p>
							</Badge>
						:	null}
					</div>
				</div>

				{/* Tabs: Tasks, Members, Activity, Settings */}
				<Tabs defaultValue="tasks" className="w-full">
					<TabsList className="bg-primary/10 dark:bg-accent/40 p-1 rounded-full mb-3 flex-wrap h-auto">
						<TabsTrigger
							value="tasks"
							title={`Tasks (${tasks.length})`}
							className="group text-xs rounded-full px-2.5 py-1.5 data-[state=active]:px-4 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5 transition-all duration-200"
						>
							<Diamond className="w-3.5 h-3.5 shrink-0" />
							<span className="hidden group-data-[state=active]:inline whitespace-nowrap">
								Tasks ({tasks.length})
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="members"
							title={`Members (${team.members.length})`}
							className="group text-xs rounded-full px-2.5 py-1.5 data-[state=active]:px-4 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5 transition-all duration-200"
						>
							<Users className="w-3.5 h-3.5 shrink-0" />
							<span className="hidden group-data-[state=active]:inline-flex items-center gap-1 whitespace-nowrap">
								Members ({team.members.length})
								{canManageTeam &&
									(team.pendingMembers?.length || 0) > 0 && (
										<span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-primary text-[10px] font-bold">
											{team.pendingMembers?.length}
										</span>
									)}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="activity"
							title="Activity"
							className="group text-xs rounded-full px-2.5 py-1.5 data-[state=active]:px-4 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5 transition-all duration-200"
						>
							<Workflow className="w-3.5 h-3.5 shrink-0" />
							<span className="hidden group-data-[state=active]:inline whitespace-nowrap">
								Activity
							</span>
						</TabsTrigger>
						{canManageTeam && (
							<TabsTrigger
								value="settings"
								title="Settings"
								className="group text-xs rounded-full px-2.5 py-1.5 data-[state=active]:px-4 data-[state=active]:bg-primary data-[state=active]:text-secondary flex items-center gap-1.5 transition-all duration-200"
							>
								<Settings className="w-3.5 h-3.5 shrink-0" />
								<span className="hidden group-data-[state=active]:inline whitespace-nowrap">
									Settings
								</span>
							</TabsTrigger>
						)}
					</TabsList>

					{/* Tasks Tab */}
					<TabsContent
						value="tasks"
						className="mt-0 focus-visible:outline-none"
					>
						<div className="flex flex-col gap-3">
							{/* Task Permission Indicators Strip (Visible when autoAssignAllMembers, allowMemberTaskCreation, or hideTasksFromNonMembers are enabled) */}
							{canViewTeamTasks &&
								(autoAssignAllMembers ||
									hideTasksFromNonMembers ||
									(allowMemberTaskCreation &&
										isCallerTeamMember &&
										!canManageTeam)) && (
									<div className="flex flex-wrap items-center gap-2">
										{allowMemberTaskCreation &&
											isCallerTeamMember &&
											!canManageTeam && (
												<div className="bg-primary text-secondary border border-secondary/15 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
													<ClipboardList className="w-3.5 h-3.5 text-secondary shrink-0" />
													<span>
														Member task creation is
														enabled for this team
													</span>
												</div>
											)}
										{autoAssignAllMembers && (
											<div className="bg-primary text-secondary border border-secondary/15 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
												<UserCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
												<span>
													Auto-assigns all{" "}
													{team.members.length} team
													member
													{team.members.length === 1 ?
														""
													:	"s"}{" "}
													to new tasks
												</span>
											</div>
										)}
										{hideTasksFromNonMembers && (
											<div className="bg-primary text-secondary border border-secondary/15 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
												<EyeOff className="w-3.5 h-3.5 text-secondary shrink-0" />
												<span>
													Tasks are hidden from
													non-members
												</span>
											</div>
										)}
									</div>
								)}

							<div>
								<div className="flex items-center justify-between">
									<p className="font-bold text-primary">
										Tasks (
										{canViewTeamTasks ? tasks.length : 0})
									</p>
									{canCreateTeamTask && (
										<Button
											onClick={() =>
												setIsAssignTaskOpen(true)
											}
											className="rounded-full"
										>
											<Plus />
											Add Task
										</Button>
									)}
								</div>
								<div className="mt-[10px]">
									{!canViewTeamTasks ?
										<div className="bg-primary flex justify-center py-[28px] px-[20px] flex-col items-center rounded-[15px]">
											<div className="bg-secondary/10 border border-secondary/15 text-secondary py-[10px] px-[10px] rounded-full">
												<EyeOff className="w-4 h-4" />
											</div>
											<p className="text-xs font-semibold text-secondary mt-[10px]">
												Team Tasks Hidden
											</p>
											<p className="text-[11px] text-center text-secondary/60 max-w-sm mt-0.5">
												Only members of this team, Team
												Leads, and Workspace Admins can
												view tasks assigned to this
												team.
											</p>
										</div>
									:	<div className="flex flex-col gap-3">
											<Input
												placeholder="Search by task title..."
												value={taskSearch}
												onChange={(e) =>
													setTaskSearch(
														e.target.value,
													)
												}
												className="bg-primary rounded-[15px] border-0 text-secondary placeholder:text-secondary/70"
											/>
											{(() => {
												if (
													filteredTasks.length === 0
												) {
													return (
														<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
															<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
																{(
																	taskSearch.trim()
																) ?
																	<Search className="w-4 h-4" />
																:	<Diamond className="w-4 h-4" />
																}
															</div>
															<p className="text-xs font-semibold text-secondary mt-[10px]">
																{(
																	taskSearch.trim()
																) ?
																	"No Matching Tasks"
																:	"No Tasks Available"
																}
															</p>
															<p className="text-[11px] text-center text-secondary/60">
																{(
																	taskSearch.trim()
																) ?
																	"No tasks match your search query"
																:	"No tasks found yet in this team"
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
																		Project
																	</TableHead>
																	<TableHead>
																		Assignees
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
																{sortedTasks.map(
																	(t) => {
																		return (
																			<TableRow
																				key={
																					t.id
																				}
																			>
																				<TableCell className="font-medium">
																					<Link
																						href={`/tasks/${t.id}`}
																						className="text-left hover:underline hover:opacity-85 transition-opacity font-semibold text-xs text-secondary"
																					>
																						{
																							t.title
																						}
																					</Link>
																				</TableCell>
																				<TableCell>
																					{(
																						t.project
																					) ?
																						<Link
																							href={`/projects/${t.projectId}`}
																							className="hover:opacity-80 transition-opacity inline-block"
																						>
																							<Badge
																								variant="outline"
																								className="bg-primary/20 text-secondary border border-secondary/20 flex items-center gap-1 font-semibold text-[11px] w-fit"
																							>
																								<Box className="w-3 h-3 text-accent shrink-0" />
																								<span className="truncate max-w-[130px]">
																									{
																										t
																											.project
																											.title
																									}
																								</span>
																							</Badge>
																						</Link>
																					:	<span className="text-[11px] text-secondary/40 italic">
																							—
																						</span>
																					}
																				</TableCell>
																				<TableCell>
																					<TaskAssigneeOverview
																						taskMembers={
																							t.taskMembers
																						}
																						size="sm"
																					/>
																				</TableCell>
																				<TableCell className="text-xs text-secondary">
																					{(
																						t.endPeriod
																					) ?
																						format(
																							new Date(
																								t.endPeriod,
																							),
																							"PPP",
																						)
																					:	"No due date"
																					}
																				</TableCell>
																				<TableCell>
																					<Badge
																						className={`${renderPriority(
																							t.priority,
																						)} text-primary`}
																					>
																						{formatPriority(
																							t.priority,
																						)}
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
																								{formatStatus(
																									t.status,
																								)}
																							</span>
																						</div>
																					</Badge>
																				</TableCell>
																			</TableRow>
																		);
																	},
																)}
															</TableBody>
														</Table>
													</div>
												);
											})()}
										</div>
									}
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Members Tab */}
					<TabsContent
						value="members"
						className="mt-0 focus-visible:outline-none"
					>
						<div className="flex flex-col gap-4">
							{/* Member Permission Indicators Strip (Visible based on allowMemberInvites and allowSelfJoin) */}
							{(!allowSelfJoin ||
								(allowMemberInvites &&
									isCallerTeamMember &&
									!canManageTeam)) && (
								<div className="flex flex-wrap items-center gap-2">
									{allowMemberInvites &&
										isCallerTeamMember &&
										!canManageTeam && (
											<div className="bg-primary text-secondary border border-secondary/15 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
												<UserPlus className="w-3.5 h-3.5 text-secondary shrink-0" />
												<span>
													You can invite workspace
													peers to this team
												</span>
											</div>
										)}
									{!allowSelfJoin && (
										<div className="bg-primary text-secondary border border-secondary/15 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
											<Shield className="w-3.5 h-3.5 text-secondary shrink-0" />
											<span>
												Self-joining is disabled
												(Invite-only team)
											</span>
										</div>
									)}
								</div>
							)}

							{/* Pending Join Requests Component (Visible when requireApproval is enabled or requests exist) */}
							{canManageTeam &&
								(requireApproval ||
									(team.pendingMembers &&
										team.pendingMembers.length > 0)) && (
									<div className="rounded-[18px] border border-secondary/15 bg-primary p-4 text-secondary">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<Clock className="w-4 h-4 text-secondary" />
												<p className="font-bold text-sm text-secondary">
													Pending Join Requests (
													{team.pendingMembers
														?.length || 0}
													)
												</p>
											</div>
										</div>
										{(
											!team.pendingMembers ||
											team.pendingMembers.length === 0
										) ?
											<p className="text-xs text-secondary/60 py-2">
												Approval before joining is
												enabled. Any new member join
												requests will appear here for
												review.
											</p>
										:	<div className="flex flex-col gap-2">
												{team.pendingMembers.map(
													(pm) => {
														const isProcessing =
															processingRequestMemberId ===
															pm.id;
														return (
															<div
																key={pm.id}
																className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 px-3.5 py-2.5 border border-secondary/15"
															>
																<div className="flex items-center gap-2.5 min-w-0">
																	<PresenceAvatar
																		userId={
																			pm.userId ||
																			pm
																				.user
																				?.id
																		}
																		name={
																			pm
																				.user
																				.fullName
																		}
																		size="sm"
																		ringColor="ring-primary"
																	/>
																	<div className="flex flex-col min-w-0">
																		<span className="text-xs font-semibold text-secondary truncate">
																			{
																				pm
																					.user
																					.fullName
																			}
																		</span>
																		<span className="text-[11px] text-secondary/60 truncate">
																			{
																				pm
																					.user
																					.email
																			}
																		</span>
																	</div>
																</div>
																<div className="flex items-center gap-2">
																	<Button
																		size="sm"
																		disabled={
																			isProcessing
																		}
																		onClick={() =>
																			handleReviewJoinRequest(
																				pm.id,
																				"APPROVE",
																			)
																		}
																		className="h-7 px-3 rounded-full text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold cursor-pointer gap-1"
																	>
																		{(
																			isProcessing
																		) ?
																			<LoaderCircle className="w-3 h-3 animate-spin" />
																		:	<Check className="w-3 h-3" />
																		}
																		Approve
																	</Button>
																	<Button
																		size="sm"
																		variant="outline"
																		disabled={
																			isProcessing
																		}
																		onClick={() =>
																			handleReviewJoinRequest(
																				pm.id,
																				"REJECT",
																			)
																		}
																		className="h-7 px-3 rounded-full text-xs border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-semibold cursor-pointer gap-1"
																	>
																		<X className="w-3 h-3" />
																		Decline
																	</Button>
																</div>
															</div>
														);
													},
												)}
											</div>
										}
									</div>
								)}

							<div>
								<div className="flex items-center justify-between">
									<p className="font-bold text-primary">
										Members ({team.members.length})
									</p>
									{canAddTeamMembers && (
										<Button
											onClick={() =>
												setIsAddMembersOpen(true)
											}
											className="rounded-full flex items-center gap-2"
										>
											<UserPlus className="w-4 h-4" />
											Add Members
										</Button>
									)}
								</div>
								<div className="mt-[10px]">
									<div className="flex flex-col gap-3">
										<Input
											placeholder="Search members by name, email, or username..."
											value={memberSearch}
											onChange={(e) =>
												setMemberSearch(e.target.value)
											}
											className="bg-primary rounded-[15px] border-0 text-secondary placeholder:text-secondary/70"
										/>
										<div className="overflow-x-auto custom-scrollbar">
											<Table className="min-w-[600px]">
												<TableHeader>
													<TableRow>
														<TableHead>
															Member
														</TableHead>
														<TableHead>
															Role
														</TableHead>
														<TableHead>
															Email
														</TableHead>
														<TableHead className="w-[100px] text-right pr-4">
															Actions
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{(
														filteredTeamMembers.length ===
														0
													) ?
														<TableRow>
															<TableCell
																colSpan={4}
																className="text-center py-8 text-xs font-medium bg-[#a49f9f] text-[#222222]"
															>
																No members
																found.
															</TableCell>
														</TableRow>
													:	filteredTeamMembers.map(
															(m) => {
																const isLead =
																	Boolean(
																		m.isLead ||
																		leadIdSet.has(
																			m.id,
																		) ||
																		(m.userId &&
																			leadIdSet.has(
																				m.userId,
																			)),
																	);
																const isCurrent =
																	currentMemberId ===
																		m.id ||
																	currentUserId ===
																		m.userId;

																return (
																	<TableRow
																		key={
																			m.id
																		}
																	>
																		<TableCell>
																			<div className="flex items-center gap-2.5">
																				<PresenceAvatar
																					userId={
																						m.userId ||
																						m
																							.user
																							?.id
																					}
																					name={
																						m
																							.user
																							.fullName
																					}
																					size="default"
																					ringColor="ring-primary"
																					showPresence={
																						true
																					}
																				/>
																				<div className="flex flex-col">
																					<span className="font-semibold text-xs text-secondary flex items-center gap-1.5">
																						{
																							m
																								.user
																								.fullName
																						}
																						{isCurrent && (
																							<Badge className="text-[9px] py-0 px-1 font-medium bg-secondary/15 text-secondary">
																								You
																							</Badge>
																						)}
																					</span>
																					<span className="text-[11px] text-secondary/60">
																						@
																						{m
																							.user
																							.userName ||
																							"user"}
																					</span>
																				</div>
																			</div>
																		</TableCell>
																		<TableCell>
																			{(
																				isLead
																			) ?
																				<Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] px-2 py-0.5 flex items-center gap-1 font-semibold w-fit">
																					<Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
																					Team
																					Lead
																				</Badge>
																			:	<Badge
																					variant="outline"
																					className="text-[10px] px-2 py-0.5 font-medium border-secondary/20 bg-secondary/10 text-secondary/80 w-fit"
																				>
																					Member
																				</Badge>
																			}
																		</TableCell>
																		<TableCell className="text-xs text-secondary/70">
																			{m
																				.user
																				.email ||
																				"—"}
																		</TableCell>
																		<TableCell className="text-right pr-4">
																			{(() => {
																				const isSelf =
																					Boolean(
																						(currentMemberId &&
																							m.id ===
																								currentMemberId) ||
																						(currentUserId &&
																							(m.userId ===
																								currentUserId ||
																								m
																									.user
																									?.id ===
																									currentUserId)),
																					);
																				const canManageThisRow =
																					canManageTeam ||
																					isSelf;

																				if (
																					!canManageThisRow
																				) {
																					return (
																						<Button
																							size="sm"
																							variant="outline"
																							disabled
																							className="h-7 px-3 text-xs rounded-full border border-secondary/15 bg-secondary/5 text-secondary/40 font-medium inline-flex items-center gap-1.5 cursor-not-allowed opacity-50 ml-auto"
																							title="Only team leads and workspace admins can manage team members"
																						>
																							<span>
																								Manage
																							</span>
																						</Button>
																					);
																				}

																				return (
																					<DropdownMenu>
																						<DropdownMenuTrigger
																							asChild
																						>
																							<Button
																								size="sm"
																								variant={
																									(
																										isSelf &&
																										!canManageTeam
																									) ?
																										"destructive"
																									:	"outline"
																								}
																								className={`h-7 px-3 text-xs rounded-full inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ml-auto ${
																									(
																										isSelf &&
																										!canManageTeam
																									) ?
																										"bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90 text-white font-semibold border-0"
																									:	"border border-secondary/30 bg-secondary/15 text-secondary hover:bg-secondary/30 hover:text-white font-medium"
																								}`}
																							>
																								{(
																									isSelf &&
																									!canManageTeam
																								) ?
																									<>
																										<LogOut className="w-3 h-3 text-white shrink-0" />
																										<span>
																											Leave
																											Team
																										</span>
																									</>
																								:	<>
																										<span>
																											Manage
																										</span>
																										<ChevronDown className="w-3 h-3 text-secondary/70 shrink-0" />
																									</>
																								}
																							</Button>
																						</DropdownMenuTrigger>
																						<DropdownMenuContent
																							align="end"
																							className="w-48 bg-primary text-secondary border border-secondary/20 p-1.5 rounded-[14px] shadow-xl"
																						>
																							{canManageTeam && (
																								<>
																									<DropdownMenuItem
																										onClick={() =>
																											handleToggleLead(
																												m.id,
																											)
																										}
																										className="cursor-pointer text-xs flex items-center gap-2.5 py-2 px-2.5 rounded-[8px] text-secondary hover:text-white hover:bg-secondary/15 transition-colors"
																									>
																										<Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
																										<span>
																											{(
																												isLead
																											) ?
																												"Remove as Lead"
																											:	"Make Team Lead"
																											}
																										</span>
																									</DropdownMenuItem>
																									<DropdownMenuSeparator className="bg-secondary/15 my-1" />
																								</>
																							)}
																							<DropdownMenuItem
																								onClick={() =>
																									setMemberToRemove(
																										m,
																									)
																								}
																								className="cursor-pointer text-xs flex items-center gap-2.5 py-2 px-2.5 rounded-[8px] text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
																							>
																								{(
																									isSelf
																								) ?
																									<>
																										<LogOut className="w-3.5 h-3.5" />
																										<span>
																											Leave
																											Team
																										</span>
																									</>
																								:	<>
																										<UserMinus className="w-3.5 h-3.5" />
																										<span>
																											Remove
																											from
																											Team
																										</span>
																									</>
																								}
																							</DropdownMenuItem>
																						</DropdownMenuContent>
																					</DropdownMenu>
																				);
																			})()}
																		</TableCell>
																	</TableRow>
																);
															},
														)
													}
												</TableBody>
											</Table>
										</div>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Activity Tab */}
					<TabsContent
						value="activity"
						className="mt-0 focus-visible:outline-none"
					>
						<div className="bg-accent/30 dark:bg-accent/15 border border-primary/10 rounded-2xl p-4 sm:p-5">
							<p className="font-bold text-primary mb-3 text-sm sm:text-base">
								Activity
							</p>
							<div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-primary">
								<div className="p-3 rounded-full bg-primary/10">
									<Workflow className="w-6 h-6 text-primary" />
								</div>
								<p className="text-sm font-semibold text-primary">
									Team Activity Stream
								</p>
								<p className="text-xs text-primary/60 max-w-sm">
									Team activities and assignments are tracked
									and synchronized across the workspace.
								</p>
							</div>
						</div>
					</TabsContent>

					{/* Settings Tab */}
					{canManageTeam && (
						<TabsContent
							value="settings"
							className="mt-0 focus-visible:outline-none"
						>
							<div className="flex flex-col gap-4">
								{/* Access, Membership & Visibility Toggles Card */}
								<div className="bg-primary text-secondary border border-secondary/15 rounded-[20px] p-5 flex flex-col gap-1">
									<div className="pb-3 border-b border-secondary/15">
										<div className="flex items-center gap-2">
											<Settings className="w-4 h-4 text-secondary" />
											<h3 className="text-sm font-bold text-secondary">
												Team Settings & Permissions
											</h3>
										</div>
										<p className="text-xs text-secondary/70 mt-1">
											Configure member join rules,
											visibility controls, task and invite
											permissions, and notification
											preferences for this team.
										</p>
									</div>

									{/* Toggle Row 1: Require Approval Before Joining */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<Shield className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Require Approval Before
													Joining
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													When enabled, workspace
													members must submit a join
													request and wait for a Team
													Lead, Workspace Owner, or
													Admin to approve them before
													joining the team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={requireApproval}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextRequireApproval =
													Boolean(checked);
												const nextAllowSelfJoin =
													nextRequireApproval ? true
													:	allowSelfJoin;
												setRequireApproval(
													nextRequireApproval,
												);
												setAllowSelfJoin(
													nextAllowSelfJoin,
												);
												handleSaveSettings({
													requireApproval:
														nextRequireApproval,
													allowSelfJoin:
														nextAllowSelfJoin,
												});
											}}
											aria-label="Toggle require approval before joining"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 2: Allow Self-Joining */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<UserPlus className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Allow Members to Self-Join
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Allow workspace members to
													join or request to join this
													team on their own. Turn off
													to make the team strictly
													invite-only.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={allowSelfJoin}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextAllowSelfJoin =
													Boolean(checked);
												const nextRequireApproval =
													nextAllowSelfJoin ?
														requireApproval
													:	false;
												setAllowSelfJoin(
													nextAllowSelfJoin,
												);
												setRequireApproval(
													nextRequireApproval,
												);
												handleSaveSettings({
													allowSelfJoin:
														nextAllowSelfJoin,
													requireApproval:
														nextRequireApproval,
												});
											}}
											aria-label="Toggle allow members to self-join"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 3: Private Team Visibility */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												{teamVisibility === "PRIVATE" ?
													<Lock className="w-4 h-4" />
												:	<Globe className="w-4 h-4" />}
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Private Team
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													When enabled, only assigned
													team members, Team Leads,
													and Workspace Owners/Admins
													can view and access this
													team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={
												teamVisibility === "PRIVATE"
											}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVis =
													checked ? "PRIVATE" : (
														"PUBLIC"
													);
												setTeamVisibility(nextVis);
												handleSaveSettings({
													visibility: nextVis,
												});
											}}
											aria-label="Toggle private team visibility"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 4: Allow Members to Add Peers */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<Users className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Allow Members to Invite
													Peers
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Allow regular non-lead team
													members to add other
													workspace members directly
													to this team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={allowMemberInvites}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setAllowMemberInvites(nextVal);
												handleSaveSettings({
													allowMemberInvites: nextVal,
												});
											}}
											aria-label="Toggle allow members to invite peers"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 5: Allow Regular Members to Create Team Tasks */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<ClipboardList className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Allow Members to Create Team
													Tasks
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Allow regular team members
													(not just Team Leads and
													Admins) to create and assign
													tasks under this team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={allowMemberTaskCreation}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setAllowMemberTaskCreation(
													nextVal,
												);
												handleSaveSettings({
													allowMemberTaskCreation:
														nextVal,
												});
											}}
											aria-label="Toggle allow members to create team tasks"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 6: Auto-Assign New Team Tasks to All Members */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<UserCheck className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Auto-Assign New Tasks to All
													Members
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Automatically select and
													assign all active members of
													this team when a new team
													task is created.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={autoAssignAllMembers}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setAutoAssignAllMembers(
													nextVal,
												);
												handleSaveSettings({
													autoAssignAllMembers:
														nextVal,
												});
											}}
											aria-label="Toggle auto-assign new tasks to all team members"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 7: Hide Team Tasks from Non-Members */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<EyeOff className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Hide Team Tasks from
													Non-Members
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Keep the team discoverable
													in the directory, but hide
													its assigned tasks from
													workspace members who are
													not part of this team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={hideTasksFromNonMembers}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setHideTasksFromNonMembers(
													nextVal,
												);
												handleSaveSettings({
													hideTasksFromNonMembers:
														nextVal,
												});
											}}
											aria-label="Toggle hide team tasks from non-members"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 8: Notify All Team Members on New Tasks */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 py-4 border-b border-secondary/10 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<Bell className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Notify All Members on New
													Team Tasks
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Automatically notify all
													members of this team
													whenever a new task is
													created and assigned to the
													team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={notifyAllOnNewTask}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setNotifyAllOnNewTask(nextVal);
												handleSaveSettings({
													notifyAllOnNewTask: nextVal,
												});
											}}
											aria-label="Toggle notify all members on new team tasks"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>

									{/* Toggle Row 9: Notify Team Leads on Member Join / Leave */}
									<div
										title={
											!canManageTeam ?
												"Only team leads and workspace admins can update team settings"
											:	undefined
										}
										className={`flex items-center justify-between gap-4 pt-4 pb-1 ${
											!canManageTeam || isSavingSettings ?
												"opacity-60 cursor-not-allowed select-none"
											:	""
										}`}
									>
										<div className="flex items-start gap-3 min-w-0">
											<div className="size-9 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 mt-0.5">
												<Bell className="w-4 h-4" />
											</div>
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-xs sm:text-sm font-bold text-secondary">
													Notify Team Leads on Member
													Join or Leave
												</span>
												<p className="text-xs text-secondary/70 leading-relaxed">
													Send a real-time
													notification to Team Leads
													whenever someone joins,
													requests to join, or leaves
													the team.
												</p>
											</div>
										</div>
										<Switch
											disabled={
												!canManageTeam ||
												isSavingSettings
											}
											checked={notifyLeadsOnJoinLeave}
											onCheckedChange={(checked) => {
												if (
													!canManageTeam ||
													isSavingSettings
												)
													return;
												const nextVal =
													Boolean(checked);
												setNotifyLeadsOnJoinLeave(
													nextVal,
												);
												handleSaveSettings({
													notifyLeadsOnJoinLeave:
														nextVal,
												});
											}}
											aria-label="Toggle notify team leads on member join or leave"
											className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-secondary/25 cursor-pointer shrink-0"
										/>
									</div>
								</div>
							</div>
						</TabsContent>
					)}
				</Tabs>
			</div>

			{/* Sticky Right Sidebar (Matching single-project-view exact layout) */}
			<div className="bg-[#969696] px-3 sm:px-[20px] py-[15px] sm:py-[20px] lg:h-[calc(100vh-30px)] overflow-y-auto custom-scrollbar w-full lg:w-[25%] rounded-[20px] sm:rounded-[30px] lg:sticky lg:top-0 lg:self-start">
				<div className="flex flex-col h-full justify-between">
					<div className="flex flex-col gap-5">
						{/* Team Leads Selector */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<UserStar className="w-4 h-4" />
									<p className="font-bold">
										Team Lead
										{team.leads.length === 1 ? "" : "s"}
									</p>
								</div>
							</div>

							<div className="mt-[10px] flex flex-wrap gap-1 items-center">
								{team.leads.length === 0 ?
									<p className="text-[12px] text-primary/70">
										Unassigned
									</p>
								:	team.leads.map((lead) => {
										const isYou =
											currentUserId === lead.user.id ||
											currentMemberId === lead.id;
										return (
											<div
												key={lead.id}
												className="w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px] font-medium flex items-center gap-1.5"
											>
												<PresenceIndicator
													userId={
														lead.userId ||
														lead.user?.id
													}
													size="xs"
													ringColor="ring-primary"
												/>
												<Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
												<span className="truncate max-w-[130px]">
													{isYou ?
														"YOU"
													:	lead.user.fullName}
												</span>
											</div>
										);
									})
								}
							</div>
						</div>

						{/* Team Members List */}
						<div>
							<div className="flex text-primary gap-3 items-center justify-between">
								<div className="flex gap-2 items-center">
									<Users className="w-4 h-4" />
									<p className="font-bold">Members</p>
								</div>
							</div>

							<div className="mt-[10px] flex flex-row flex-wrap gap-1 items-center">
								{team.members.map((m) => {
									const isYou =
										currentUserId === m.user.id ||
										currentMemberId === m.id;
									return (
										<div
											key={m.id}
											className="w-fit px-[10px] py-[5px] rounded-[9px] bg-primary text-secondary text-[10px] font-medium flex items-center gap-1.5"
										>
											<PresenceIndicator
												userId={m.userId || m.user?.id}
												size="xs"
												ringColor="ring-primary"
											/>
											<span className="truncate max-w-[130px]">
												{isYou ?
													"YOU"
												:	m.user.fullName}
											</span>
										</div>
									);
								})}

								{canAddTeamMembers && (
									<button
										type="button"
										onClick={() =>
											setIsAddMembersOpen(true)
										}
										className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] cursor-pointer transition-colors"
										title="Add members"
									>
										<Plus className="w-3 h-3" />
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Danger Zone: Delete Team */}
					{canDeleteTeam && (
						<div className="w-full mt-6 pt-3 border-t border-primary/10">
							<Button
								variant="destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
								className="h-11 rounded-full bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90 text-white text-sm font-semibold w-full cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-sm border-0"
							>
								<Trash2 className="w-4 h-4 text-white shrink-0" />
								Delete Team
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Assign Team Task Dialog */}
			<AssignTeamTaskDialog
				team={team}
				workspaceId={workspaceId}
				currentMemberId={resolvedMember?.id ?? currentMemberId ?? ""}
				projects={workspaceProjects}
				open={isAssignTaskOpen}
				onOpenChange={setIsAssignTaskOpen}
				onTaskCreated={(newTask) => {
					setTasks((prev) => [newTask, ...prev]);
					setTeam((prev) => ({
						...prev,
						_count: {
							members:
								prev._count?.members ?? prev.members.length,
							tasks: (prev._count?.tasks ?? 0) + 1,
						},
					}));
				}}
			/>

			{/* Add Members Dialog */}
			<Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
				<DialogContent className="max-w-md rounded-2xl bg-primary text-secondary border border-secondary/20 p-6">
					<DialogHeader>
						<DialogTitle className="text-secondary font-bold flex items-center gap-2">
							<UserPlus className="w-4 h-4 text-accent" />
							Add Members to {team.name}
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-xs">
							Select workspace members to add to this team.
						</DialogDescription>
					</DialogHeader>

					<div className="max-h-[260px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 my-3">
						{availableWorkspaceMembers.length === 0 ?
							<p className="text-center py-6 text-xs text-secondary/50">
								All workspace members are already in this team.
							</p>
						:	availableWorkspaceMembers.map((m) => {
								const isSelected =
									selectedNewMemberIds.includes(m.id);
								return (
									<label
										key={m.id}
										className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/10 cursor-pointer transition-colors"
									>
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => {
												setSelectedNewMemberIds(
													(prev) =>
														prev.includes(m.id) ?
															prev.filter(
																(id) =>
																	id !== m.id,
															)
														:	[...prev, m.id],
												);
											}}
										/>
										<PresenceAvatar
											userId={m.userId || m.user?.id}
											name={m.user.fullName}
											size="xs"
											ringColor="ring-primary"
											showPresence={true}
										/>
										<div className="flex flex-col min-w-0">
											<span className="text-xs font-semibold text-secondary truncate">
												{m.user.fullName}
											</span>
											<span className="text-[10px] text-secondary/60 truncate">
												@{m.user.userName || "user"} •{" "}
												{m.user.email}
											</span>
										</div>
									</label>
								);
							})
						}
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setIsAddMembersOpen(false)}
							className="rounded-full text-xs"
						>
							Cancel
						</Button>
						<Button
							disabled={
								isAddingMembers ||
								selectedNewMemberIds.length === 0
							}
							onClick={handleAddMembers}
							className="rounded-full text-xs"
						>
							{isAddingMembers ?
								<LoaderCircle className="w-3.5 h-3.5 animate-spin mr-1" />
							:	null}
							Add {selectedNewMemberIds.length} Member
							{selectedNewMemberIds.length === 1 ? "" : "s"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove Member / Leave Team Confirmation Dialog */}
			<AlertDialog
				open={Boolean(memberToRemove)}
				onOpenChange={(open) => {
					if (!open) setMemberToRemove(null);
				}}
			>
				<AlertDialogContent className="rounded-[20px] border border-secondary/20 bg-primary text-secondary sm:max-w-md p-6">
					{(() => {
						const isLeavingSelf = Boolean(
							memberToRemove &&
							((currentMemberId &&
								memberToRemove.id === currentMemberId) ||
								(currentUserId &&
									(memberToRemove.userId === currentUserId ||
										memberToRemove.user?.id ===
											currentUserId))),
						);

						return (
							<>
								<AlertDialogHeader>
									<AlertDialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
										{isLeavingSelf ?
											<>
												<LogOut className="w-5 h-5 text-destructive shrink-0" />
												Leave Team
											</>
										:	<>
												<UserMinus className="w-5 h-5 text-destructive shrink-0" />
												Remove Member
											</>
										}
									</AlertDialogTitle>
									<AlertDialogDescription className="text-xs text-secondary/80 mt-2">
										{isLeavingSelf ?
											<>
												Are you sure you want to leave{" "}
												<strong className="text-secondary">
													{team.name}
												</strong>
												? You will remain in the
												workspace and any other teams
												you belong to.
											</>
										:	<>
												Are you sure you want to remove{" "}
												<strong className="text-secondary">
													{
														memberToRemove?.user
															.fullName
													}
												</strong>{" "}
												from{" "}
												<strong>{team.name}</strong>?
											</>
										}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter className="gap-2 mt-4">
									<AlertDialogCancel
										disabled={isRemovingMember}
										className="rounded-full text-xs"
									>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										disabled={isRemovingMember}
										onClick={handleConfirmRemoveMember}
										className="rounded-full text-xs bg-destructive text-white hover:bg-destructive/90 font-semibold"
									>
										{isRemovingMember ?
											isLeavingSelf ?
												"Leaving..."
											:	"Removing..."
										: isLeavingSelf ?
											"Leave Team"
										:	"Remove Member"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</>
						);
					})()}
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Team Dialog */}
			{canDeleteTeam && (
				<AlertDialog
					open={isDeleteDialogOpen}
					onOpenChange={(open) => {
						setIsDeleteDialogOpen(open);
						if (!open) setDeleteConfirmInput("");
					}}
				>
					<AlertDialogContent className="rounded-[20px] border border-secondary/20 bg-primary text-secondary sm:max-w-md p-6">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
								<Trash2 className="w-5 h-5 text-destructive shrink-0" />
								Delete Team
							</AlertDialogTitle>
							<AlertDialogDescription className="text-[13px] text-secondary/80 mt-2 leading-relaxed">
								This action cannot be undone. This will
								permanently delete the team{" "}
								<strong className="text-secondary font-semibold">
									{team.name}
								</strong>
								.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="flex flex-col gap-3 my-4">
							<label className="text-xs font-semibold text-secondary/90 text-center">
								Team name to verify:
							</label>
							<div className="flex items-center justify-center p-3 rounded-xl bg-secondary/10 border border-secondary/20">
								<span className="font-mono text-sm font-medium text-accent truncate select-all text-center">
									{team.name}
								</span>
							</div>

							<label className="text-xs font-semibold text-secondary/90 mt-1">
								Type team name to confirm:
							</label>
							<Input
								value={deleteConfirmInput}
								onChange={(e) =>
									setDeleteConfirmInput(e.target.value)
								}
								placeholder={`Type "${team.name}" to confirm`}
								className="h-10 rounded-xl bg-primary border-secondary/30 text-secondary placeholder:text-secondary/40 focus-visible:ring-accent"
							/>
						</div>

						<AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
							<AlertDialogCancel
								disabled={isDeletingTeam}
								className="w-full sm:w-auto rounded-full text-xs"
							>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								variant="destructive"
								onClick={async (e) => {
									e.preventDefault();
									await handleDeleteTeam();
								}}
								disabled={
									deleteConfirmInput.trim() !==
										team.name.trim() || isDeletingTeam
								}
								className="w-full sm:w-auto rounded-full bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 text-xs"
							>
								{isDeletingTeam ?
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
										Deleting...
									</>
								:	"Delete Team"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
