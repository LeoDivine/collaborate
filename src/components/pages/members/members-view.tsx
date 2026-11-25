"use client";

import PaginationControls from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import Link from "next/link";
import { MembersUsers } from "@/lib/types";
import {
	cn,
	getInitials,
	renderMemberStatusBadge,
	renderPresenceBadge,
	renderPriority,
	renderStatus,
	renderWorkspaceRoleBadge,
} from "@/lib/utils";
import { format } from "date-fns";
import {
	Box,
	Building2,
	Calendar,
	Check,
	ChevronDown,
	Clock,
	Copy,
	Diamond,
	Ellipsis,
	ExternalLink,
	Eye,
	FolderPlus,
	Layers,
	ListTodo,
	LoaderCircle,
	Mail,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	UserCheck,
	UserX,
	Users,
} from "lucide-react";
import { User } from "next-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MemberStatus, WorkspaceRoles } from "../../../../generated/prisma/enums";
import {
	getMemberDetails,
	removeMember,
	updateMemberRole,
	updateMemberStatus,
} from "@/lib/services/member.services";
import { useWorkspacePresence, useWorkspaceRealtime } from "@/hooks/use-pusher";
import { toast } from "sonner";

export default function MembersView({
	members,
	totalItems,
	pageSize,
	user,
}: {
	members: MembersUsers[];
	totalItems: number;
	pageSize?: number;
	user: User;
}) {
	const [memberList, setMemberList] = useState<MembersUsers[]>(members);
	const [query, setQuery] = useState("");
	const [presenceFilter, setPresenceFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
	const [loading, setLoading] = useState(false);
	const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

	// Synchronize with server-rendered prop updates
	useEffect(() => {
		setMemberList(members);
	}, [members]);

	const workspaceId = user?.currentWorkspaceId || members[0]?.workspaceId;

	// Real-time workspace presence tracking via Pusher
	const { isUserOnline } = useWorkspacePresence(workspaceId);

	const checkIsOnline = (memberUserId?: string | null) => {
		if (!memberUserId) return false;
		if (memberUserId === user?.id) return true;
		return isUserOnline(memberUserId);
	};

	const onlineMemberCount = memberList.filter((m) =>
		checkIsOnline(m.userId || m.user?.id),
	).length;
	const offlineMemberCount = memberList.length - onlineMemberCount;

	const displayedMembers = memberList.filter((m) => {
		if (presenceFilter === "ALL") return true;
		const online = checkIsOnline(m.userId || m.user?.id);
		if (presenceFilter === "ONLINE") return online;
		if (presenceFilter === "OFFLINE") return !online;
		return true;
	});

	// Real-time Pusher listener for member status updates
	useWorkspaceRealtime(workspaceId, {
		onMemberStatusUpdated: (data) => {
			setMemberList((prev) =>
				prev.map((m) =>
					m.id === data.memberId
						? { ...m, status: data.status as MemberStatus }
						: m,
				),
			);
			if (data.userId !== user?.id) {
				toast.info(
					`Member status updated: ${data.status === "INACTIVE" ? "Deactivated" : "Activated"}`,
				);
			}
		},
	});

	// View Member Dialog State
	const [selectedMember, setSelectedMember] = useState<MembersUsers | null>(null);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [detailedMember, setDetailedMember] = useState<any>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [copiedEmail, setCopiedEmail] = useState(false);
	const [canViewAssignments, setCanViewAssignments] = useState(false);
	const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks">("overview");

	const handleCopyEmail = (email?: string) => {
		if (!email) return;
		navigator.clipboard.writeText(email);
		setCopiedEmail(true);
		toast.success("Email copied to clipboard");
		setTimeout(() => setCopiedEmail(false), 2000);
	};

	const handleEmailClient = (recipientEmail?: string) => {
		if (!recipientEmail) return;
		const from = user?.email || "";
		const mailtoUrl = from
			? `mailto:${recipientEmail}?from=${encodeURIComponent(from)}&reply-to=${encodeURIComponent(from)}`
			: `mailto:${recipientEmail}`;

		try {
			const tempLink = document.createElement("a");
			tempLink.href = mailtoUrl;
			tempLink.target = "_top";
			document.body.appendChild(tempLink);
			tempLink.click();
			document.body.removeChild(tempLink);
		} catch {
			window.location.href = mailtoUrl;
		}
	};

	const handleOpenGmail = (recipientEmail?: string) => {
		if (!recipientEmail) return;
		const authUser = user?.email ? `&authuser=${encodeURIComponent(user.email)}` : "";
		const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}${authUser}`;
		window.open(gmailUrl, "_blank", "noopener,noreferrer");
	};

	const handleOpenOutlook = (recipientEmail?: string) => {
		if (!recipientEmail) return;
		const loginHint = user?.email ? `&login_hint=${encodeURIComponent(user.email)}` : "";
		const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(recipientEmail)}${loginHint}`;
		window.open(outlookUrl, "_blank", "noopener,noreferrer");
	};

	// Remove Member Alert Dialog State
	const [memberToRemove, setMemberToRemove] = useState<MembersUsers | null>(null);

	// Deactivate Member Dialog State
	const [memberToDeactivate, setMemberToDeactivate] = useState<MembersUsers | null>(null);
	const [deactivationReason, setDeactivationReason] = useState("");

	const pathName = usePathname();
	const router = useRouter();

	const currentUserMember = memberList.find(
		(m) => m.userId === user?.id || m.user?.id === user?.id,
	);
	const isUserAdminOrOwner =
		currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";
	const hasAssignmentAccess = isUserAdminOrOwner && canViewAssignments;

	const renderEmailDropdown = (email?: string, align: "start" | "end" = "end") => (
		<div className="flex items-center gap-2 min-w-0">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="font-medium text-secondary hover:underline truncate max-w-[200px] flex items-center gap-1.5 cursor-pointer text-left"
						title={`Email options for ${email}`}
					>
						<span className="truncate">{email}</span>
						<ChevronDown className="w-3 h-3 text-secondary/60 shrink-0" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align={align} className="bg-primary border border-secondary/20 text-secondary min-w-[210px] p-1.5 rounded-xl shadow-2xl">
					<DropdownMenuItem
						onClick={() => handleEmailClient(email)}
						className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
					>
						<Mail className="w-3.5 h-3.5 shrink-0" />
						<div className="flex flex-col">
							<span>Default Email App</span>
							{user?.email && (
								<span className="text-[10px] text-secondary/60">From: {user.email}</span>
							)}
						</div>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleOpenGmail(email)}
						className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
					>
						<ExternalLink className="w-3.5 h-3.5 shrink-0" />
						<div className="flex flex-col">
							<span>Open in Gmail</span>
							{user?.email && (
								<span className="text-[10px] text-secondary/60">From: {user.email}</span>
							)}
						</div>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleOpenOutlook(email)}
						className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
					>
						<ExternalLink className="w-3.5 h-3.5 shrink-0" />
						<div className="flex flex-col">
							<span>Open in Outlook Web</span>
							{user?.email && (
								<span className="text-[10px] text-secondary/60">From: {user.email}</span>
							)}
						</div>
					</DropdownMenuItem>
					<DropdownMenuSeparator className="bg-secondary/15 my-1" />
					<DropdownMenuItem
						onClick={() => handleCopyEmail(email)}
						className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
					>
						<Copy className="w-3.5 h-3.5 shrink-0" />
						<span>Copy Email Address</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<button
				type="button"
				onClick={() => handleCopyEmail(email)}
				className="p-1 rounded-md text-secondary/60 hover:text-secondary hover:bg-secondary/10 transition-colors shrink-0 cursor-pointer"
				title="Copy email"
			>
				{copiedEmail ? (
					<Check className="w-3.5 h-3.5 text-emerald-400" />
				) : (
					<Copy className="w-3.5 h-3.5" />
				)}
			</button>
		</div>
	);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		if (query) {
			params.set("query", query);
		} else {
			params.delete("query");
		}

		params.delete("page");

		const nextQuery = params.toString();
		router.push(nextQuery ? `${pathName}?${nextQuery}` : pathName);
	}, [query, pathName, router]);

	const handleViewMember = async (member: MembersUsers) => {
		setSelectedMember(member);
		setIsViewOpen(true);
		setLoadingDetails(true);
		setDetailedMember(null);
		setActiveTab("overview");
		setCanViewAssignments(false);

		try {
			const res = await getMemberDetails(member.id);
			if (res.success) {
				setDetailedMember(res.member);
				setCanViewAssignments(!!res.canViewAssignments);
			} else {
				toast.error(res.message || "Failed to load member details");
			}
		} catch (e) {
			toast.error("Something went wrong loading member details");
		} finally {
			setLoadingDetails(false);
		}
	};

	const handleRoleToggle = async (member: MembersUsers) => {
		const newRole: WorkspaceRoles = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
		setLoading(true);
		setSelectedActionId(member.id);

		try {
			const res = await updateMemberRole(member.id, newRole);
			if (res.success) {
				toast.success(res.message);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
			setSelectedActionId(null);
		}
	};

	const handleStatusToggle = async (member: MembersUsers) => {
		if (member.status === "ACTIVE") {
			setMemberToDeactivate(member);
			setDeactivationReason("");
			return;
		}

		// Activating from INACTIVE to ACTIVE
		setLoading(true);
		setSelectedActionId(member.id);

		try {
			const res = await updateMemberStatus(member.id, "ACTIVE");
			if (res.success) {
				toast.success(res.message);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
			setSelectedActionId(null);
		}
	};

	const handleConfirmDeactivate = async () => {
		if (!memberToDeactivate) return;
		const idToDeactivate = memberToDeactivate.id;
		setLoading(true);
		setSelectedActionId(idToDeactivate);

		try {
			const res = await updateMemberStatus(
				idToDeactivate,
				"INACTIVE",
				deactivationReason,
			);
			if (res.success) {
				toast.success("Member deactivated and notification email sent");
				setMemberToDeactivate(null);
				setDeactivationReason("");
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
			setSelectedActionId(null);
		}
	};

	const handleConfirmRemove = async () => {
		if (!memberToRemove) return;
		const idToRemove = memberToRemove.id;
		setLoading(true);
		setSelectedActionId(idToRemove);

		try {
			const res = await removeMember(idToRemove);
			if (res.success) {
				toast.success(res.message);
				setMemberToRemove(null);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
			setSelectedActionId(null);
		}
	};

	return (
		<div className="mt-[10px] flex gap-3 flex-col">
			<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
				<Input
					value={query}
					type="text"
					onChange={(e) => setQuery(e.target.value)}
					className="bg-primary rounded-[15px] border-0 flex-1 max-w-md"
					placeholder="Search by fullname, email address and username...."
				/>
				<div className="flex items-center gap-1.5 bg-primary p-1 rounded-[14px] border border-secondary/10 self-start sm:self-auto max-w-full overflow-x-auto custom-scrollbar">
					<button
						type="button"
						onClick={() => setPresenceFilter("ALL")}
						className={cn(
							"px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors cursor-pointer",
							presenceFilter === "ALL"
								? "bg-secondary/20 text-secondary font-semibold"
								: "text-secondary/60 hover:text-secondary hover:bg-secondary/10",
						)}
					>
						All ({memberList.length})
					</button>
					<button
						type="button"
						onClick={() => setPresenceFilter("ONLINE")}
						className={cn(
							"px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
							presenceFilter === "ONLINE"
								? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30"
								: "text-secondary/60 hover:text-emerald-400 hover:bg-emerald-500/10",
						)}
					>
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						Online ({onlineMemberCount})
					</button>
					<button
						type="button"
						onClick={() => setPresenceFilter("OFFLINE")}
						className={cn(
							"px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
							presenceFilter === "OFFLINE"
								? "bg-secondary/20 text-secondary font-semibold"
								: "text-secondary/60 hover:text-secondary hover:bg-secondary/10",
						)}
					>
						<span className="w-2 h-2 rounded-full bg-secondary/40" />
						Offline ({offlineMemberCount})
					</button>
				</div>
			</div>

			<div className="">
				{displayedMembers.length === 0 ? (
					<div className="bg-[#a49f9f] text-[#222222] flex justify-center py-16 px-6 flex-col items-center rounded-[20px] text-center">
						<div className="bg-[#8b8686] text-[#222222] p-4 rounded-full mb-3">
							<Users className="w-6 h-6 text-[#222222]" />
						</div>
						<p className="text-[#222222] text-base font-bold">
							No Members Available
						</p>
						<p className="text-xs text-center text-[#222222]/80 max-w-sm mt-1">
							{presenceFilter !== "ALL"
								? `No ${presenceFilter.toLowerCase()} members found with the current filter or search`
								: "No members found yet with your query or in this workspace"}
						</p>
					</div>
				) : (
					<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead>Fullname</TableHead>
								<TableHead>Email Address</TableHead>
								<TableHead>Username</TableHead>
								<TableHead className="">Role</TableHead>
								<TableHead className="">Joined At</TableHead>
								<TableHead className="">Status</TableHead>
								<TableHead className=""></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{displayedMembers.map((i) => {
								const isTargetOwner = i.role === ("OWNER" as WorkspaceRoles);
								const isSelf = i.userId === user?.id || i.user?.id === user?.id;
								const canManage = isUserAdminOrOwner && !isTargetOwner && !isSelf;
								const isRowLoading = loading && selectedActionId === i.id;
								const isOnline = checkIsOnline(i.userId || i.user?.id);

								return (
									<TableRow key={i.id}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2.5">
												<div className="relative shrink-0">
													<div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-semibold text-xs flex items-center justify-center uppercase">
														{getInitials(i.user.fullName || "User")}
													</div>
													<span
														className={cn(
															"absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-primary transition-colors",
															isOnline ? "bg-emerald-500" : "bg-zinc-500",
														)}
														title={isOnline ? "Online" : "Offline"}
													/>
												</div>
												<div className="flex flex-col">
													<div className="flex items-center gap-1.5">
														<span>{i.user.fullName}</span>
														{isSelf && (
															<span className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary/70 rounded-md font-normal">
																You
															</span>
														)}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<button
														type="button"
														className="cursor-pointer gap-2 flex items-center hover:underline text-secondary/90 hover:text-white transition-colors group text-left"
														title={`Email options for ${i.user?.email}`}
													>
														<Mail className="w-4 h-4 text-secondary/70 group-hover:text-white shrink-0" />
														<span className="truncate max-w-[170px]">{i.user?.email}</span>
														<ChevronDown className="w-3 h-3 text-secondary/40 group-hover:text-secondary/70 shrink-0" />
													</button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start" className="bg-primary border border-secondary/20 text-secondary min-w-[210px] p-1.5 rounded-xl shadow-2xl">
													<DropdownMenuItem
														onClick={() => handleEmailClient(i.user?.email)}
														className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
													>
														<Mail className="w-3.5 h-3.5 shrink-0" />
														<div className="flex flex-col">
															<span>Default Email App</span>
															{user?.email && (
																<span className="text-[10px] text-secondary/60">From: {user.email}</span>
															)}
														</div>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleOpenGmail(i.user?.email)}
														className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
													>
														<ExternalLink className="w-3.5 h-3.5 shrink-0" />
														<div className="flex flex-col">
															<span>Open in Gmail</span>
															{user?.email && (
																<span className="text-[10px] text-secondary/60">From: {user.email}</span>
															)}
														</div>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleOpenOutlook(i.user?.email)}
														className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
													>
														<ExternalLink className="w-3.5 h-3.5 shrink-0" />
														<div className="flex flex-col">
															<span>Open in Outlook Web</span>
															{user?.email && (
																<span className="text-[10px] text-secondary/60">From: {user.email}</span>
															)}
														</div>
													</DropdownMenuItem>
													<DropdownMenuSeparator className="bg-secondary/15 my-1" />
													<DropdownMenuItem
														onClick={() => handleCopyEmail(i.user?.email)}
														className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
													>
														<Copy className="w-3.5 h-3.5 shrink-0" />
														<span>Copy Email Address</span>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
										<TableCell>@{i.user.userName}</TableCell>
										<TableCell className="">
											<Badge className={renderWorkspaceRoleBadge(i.role)}>
												{i.role}
											</Badge>
										</TableCell>
										<TableCell className="">
											{format(new Date(i.createdAt), "PP")}
										</TableCell>
										<TableCell className="">
											<div className="flex items-center gap-2 flex-wrap">
												<Badge className={renderMemberStatusBadge(i.status)}>
													{i.status}
												</Badge>
												<Badge
													variant="outline"
													className={cn(
														"text-[10px] font-medium flex items-center gap-1.5 px-2 py-0.5 border rounded-full transition-colors",
														renderPresenceBadge(isOnline),
													)}
												>
													<span
														className={cn(
															"w-1.5 h-1.5 rounded-full shrink-0",
															isOnline
																? "bg-emerald-400 animate-pulse"
																: "bg-secondary/40",
														)}
													/>
													{isOnline ? "Online" : "Offline"}
												</Badge>
											</div>
										</TableCell>
										<TableCell className="">
											<DropdownMenu>
												<DropdownMenuTrigger
													disabled={isRowLoading}
													asChild
												>
													{isRowLoading ? (
														<LoaderCircle className="animate-spin w-4 h-4" />
													) : (
														<Ellipsis className="cursor-pointer w-4 h-4" />
													)}
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="bg-primary border border-secondary/20 text-secondary min-w-[180px] p-1.5 rounded-xl shadow-2xl">
													<DropdownMenuGroup>
														<DropdownMenuItem
															onClick={() => handleViewMember(i)}
															className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
														>
															<Eye className="w-4 h-4 text-secondary shrink-0" />
															<span>View member</span>
														</DropdownMenuItem>
														{canManage && (
															<DropdownMenuItem
																onClick={() => handleRoleToggle(i)}
																className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
															>
																{i.role === "ADMIN" ? (
																	<>
																		<ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
																		<span>Make member</span>
																	</>
																) : (
																	<>
																		<ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
																		<span>Make admin</span>
																	</>
																)}
															</DropdownMenuItem>
														)}
													</DropdownMenuGroup>
													{canManage && <DropdownMenuSeparator className="bg-secondary/15 my-1" />}
													{canManage && (
														<DropdownMenuGroup>
															<DropdownMenuItem
																onClick={() => handleStatusToggle(i)}
																className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 rounded-lg transition-colors"
															>
																{i.status === "ACTIVE" ? (
																	<>
																		<UserX className="w-4 h-4 text-amber-400 shrink-0" />
																		<span>Deactivate member</span>
																	</>
																) : (
																	<>
																		<UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
																		<span>Activate member</span>
																	</>
																)}
															</DropdownMenuItem>
															<DropdownMenuItem
																variant="destructive"
																onClick={() => setMemberToRemove(i)}
																className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/15 focus:bg-destructive/15 rounded-lg transition-colors"
															>
																<Trash2 className="w-4 h-4 text-destructive shrink-0" />
																<span>Remove member</span>
															</DropdownMenuItem>
														</DropdownMenuGroup>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
				<PaginationControls totalItems={totalItems} pageSize={pageSize} />
			</div>

			{/* View Member Dialog */}
			<Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
				<DialogContent
					className={cn(
						"w-full rounded-[24px] border border-secondary/20 bg-primary text-secondary shadow-2xl p-6",
						hasAssignmentAccess ? "sm:max-w-2xl" : "sm:max-w-md",
					)}
				>
					<DialogHeader className="pb-2">
						<DialogTitle className="text-secondary flex items-center gap-2.5 text-base font-bold">
							{hasAssignmentAccess ? (
								<>
									<ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
									<span>Member Workload & Management</span>
								</>
							) : (
								<>
									<Users className="w-5 h-5 text-accent shrink-0" />
									<span>Team Member Profile</span>
								</>
							)}
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-xs">
							{hasAssignmentAccess
								? "Inspect member workload, assigned projects and active task items."
								: "Contact information and workspace profile details."}
						</DialogDescription>
					</DialogHeader>

					{selectedMember && (
						<div className="space-y-4 text-secondary">
							{/* Profile Identity Card */}
							<div className="bg-secondary/5 border border-secondary/15 rounded-[18px] p-3.5 flex items-center gap-3.5">
								<div className="relative shrink-0">
									<div className="w-12 h-12 rounded-full bg-accent/20 text-accent font-bold text-sm flex items-center justify-center uppercase">
										{getInitials(selectedMember.user.fullName || "User")}
									</div>
									<span
										className={cn(
											"absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-primary transition-colors",
											checkIsOnline(
												selectedMember.userId || selectedMember.user?.id,
											)
												? "bg-emerald-500"
												: "bg-zinc-500",
										)}
										title={
											checkIsOnline(
												selectedMember.userId || selectedMember.user?.id,
											)
												? "Online"
												: "Offline"
										}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h4 className="text-sm font-bold text-secondary truncate">
											{selectedMember.user.fullName}
										</h4>
										{(selectedMember.userId === user?.id ||
											selectedMember.user?.id === user?.id) && (
											<span className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary/70 rounded-md font-normal shrink-0">
												You
											</span>
										)}
									</div>
									<p className="text-xs text-secondary/70 truncate">
										@{selectedMember.user.userName}
									</p>
									<div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
										<Badge
											className={cn(
												"text-[10px] px-2 py-0.5",
												renderWorkspaceRoleBadge(selectedMember.role),
											)}
										>
											{selectedMember.role}
										</Badge>
										<Badge
											className={cn(
												"text-[10px] px-2 py-0.5",
												renderMemberStatusBadge(selectedMember.status),
											)}
										>
											{selectedMember.status}
										</Badge>
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] font-medium flex items-center gap-1.5 px-2 py-0.5 border rounded-full transition-colors",
												renderPresenceBadge(
													checkIsOnline(
														selectedMember.userId || selectedMember.user?.id,
													),
												),
											)}
										>
											<span
												className={cn(
													"w-1.5 h-1.5 rounded-full shrink-0",
													checkIsOnline(
														selectedMember.userId || selectedMember.user?.id,
													)
														? "bg-emerald-400 animate-pulse"
														: "bg-secondary/40",
												)}
											/>
											{checkIsOnline(
												selectedMember.userId || selectedMember.user?.id,
											)
												? "Online"
												: "Offline"}
										</Badge>
									</div>
								</div>
							</div>

							{/* CONDITIONAL UI BASED ON ACCESS */}
							{!hasAssignmentAccess ? (
								/* ==================== REGULAR MEMBER VIEW ==================== */
								<div className="space-y-3.5">
									<div className="bg-secondary/5 border border-secondary/10 rounded-[16px] p-3.5 space-y-3 text-xs">
										<div className="flex items-center justify-between gap-4">
											<span className="text-secondary/80 flex items-center gap-2 shrink-0">
												<Mail className="w-3.5 h-3.5 text-secondary/70" /> Email
											</span>
											{renderEmailDropdown(selectedMember.user?.email)}
										</div>
										<div className="flex items-center justify-between gap-4">
											<span className="text-secondary/80 flex items-center gap-2 shrink-0">
												<Calendar className="w-3.5 h-3.5 text-secondary/70" /> Member Since
											</span>
											<span className="font-medium text-secondary">
												{format(new Date(selectedMember.createdAt), "PPP")}
											</span>
										</div>
										<div className="flex items-center justify-between gap-4">
											<span className="text-secondary/80 flex items-center gap-2 shrink-0">
												<Building2 className="w-3.5 h-3.5 text-secondary/70" /> Team
											</span>
											<span className="font-medium text-secondary truncate max-w-[180px]">
												{detailedMember?.team?.name || "Workspace Member"}
											</span>
										</div>
										{selectedMember.user?.timezone && (
											<div className="flex items-center justify-between gap-4">
												<span className="text-secondary/80 flex items-center gap-2 shrink-0">
													<Clock className="w-3.5 h-3.5 text-secondary/70" /> Timezone
												</span>
												<span className="font-medium text-secondary truncate max-w-[180px]">
													{selectedMember.user.timezone}
												</span>
											</div>
										)}
									</div>

									{/* Collaboration Info Card */}
									<div className="bg-accent/10 border border-accent/20 rounded-[16px] p-3 flex items-start gap-2.5 text-xs text-accent">
										<Users className="w-4 h-4 text-accent shrink-0 mt-0.5" />
										<p className="leading-relaxed">
											Collaborator in this workspace. You can connect and initiate contact directly via email.
										</p>
									</div>
								</div>
							) : (
								/* ==================== ADMIN & OWNER WORKLOAD VIEW ==================== */
								<div className="space-y-3.5">
									{/* Segmented Tab Navigation */}
									<div className="flex items-center gap-1.5 bg-secondary/10 p-1 rounded-[14px] border border-secondary/15">
										<button
											type="button"
											onClick={() => setActiveTab("overview")}
											className={cn(
												"flex-1 py-1.5 px-3 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
												activeTab === "overview"
													? "bg-secondary text-primary shadow-sm"
													: "text-secondary/70 hover:text-secondary hover:bg-secondary/10",
											)}
										>
											<Layers className="w-3.5 h-3.5" />
											<span>Overview</span>
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("projects")}
											className={cn(
												"flex-1 py-1.5 px-3 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
												activeTab === "projects"
													? "bg-secondary text-primary shadow-sm"
													: "text-secondary/70 hover:text-secondary hover:bg-secondary/10",
											)}
										>
											<Box className="w-3.5 h-3.5" />
											<span>
												Projects (
												{detailedMember?.projectMembers?.length ??
													detailedMember?._count?.projectMembers ??
													0}
												)
											</span>
										</button>
										<button
											type="button"
											onClick={() => setActiveTab("tasks")}
											className={cn(
												"flex-1 py-1.5 px-3 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
												activeTab === "tasks"
													? "bg-secondary text-primary shadow-sm"
													: "text-secondary/70 hover:text-secondary hover:bg-secondary/10",
											)}
										>
											<Diamond className="w-3.5 h-3.5" />
											<span>
												Tasks (
												{detailedMember?.taskMembers?.length ??
													detailedMember?._count?.taskMembers ??
													0}
												)
											</span>
										</button>
									</div>

									{loadingDetails ? (
										<div className="flex justify-center items-center py-10">
											<LoaderCircle className="animate-spin w-7 h-7 text-secondary" />
										</div>
									) : (
										<>
											{/* TAB: OVERVIEW */}
											{activeTab === "overview" && (
												<div className="space-y-3">
													{/* 2x2 Metric Cards */}
													<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
														<div className="bg-secondary/5 border border-secondary/15 rounded-[14px] p-3 text-center">
															<Box className="w-4 h-4 mx-auto mb-1 text-blue-400" />
															<p className="text-[11px] text-secondary/70">
																Assigned Projects
															</p>
															<p className="text-base font-bold text-secondary mt-0.5">
																{detailedMember?._count?.projectMembers ?? 0}
															</p>
														</div>
														<div className="bg-secondary/5 border border-secondary/15 rounded-[14px] p-3 text-center">
															<Diamond className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
															<p className="text-[11px] text-secondary/70">
																Assigned Tasks
															</p>
															<p className="text-base font-bold text-secondary mt-0.5">
																{detailedMember?._count?.taskMembers ?? 0}
															</p>
														</div>
														<div className="bg-secondary/5 border border-secondary/15 rounded-[14px] p-3 text-center">
															<FolderPlus className="w-4 h-4 mx-auto mb-1 text-amber-400" />
															<p className="text-[11px] text-secondary/70">
																Created Projects
															</p>
															<p className="text-base font-bold text-secondary mt-0.5">
																{detailedMember?._count?.createdProjects ?? 0}
															</p>
														</div>
														<div className="bg-secondary/5 border border-secondary/15 rounded-[14px] p-3 text-center">
															<ListTodo className="w-4 h-4 mx-auto mb-1 text-purple-400" />
															<p className="text-[11px] text-secondary/70">
																Created Tasks
															</p>
															<p className="text-base font-bold text-secondary mt-0.5">
																{detailedMember?._count?.createdTasks ?? 0}
															</p>
														</div>
													</div>

													{/* Overview Metadata */}
													<div className="bg-secondary/5 border border-secondary/10 rounded-[14px] p-3 space-y-2.5 text-xs">
														<div className="flex items-center justify-between gap-4">
															<span className="text-secondary/80 flex items-center gap-2 shrink-0">
																<Mail className="w-3.5 h-3.5 text-secondary/70" /> Email
															</span>
															{renderEmailDropdown(selectedMember.user?.email)}
														</div>
														<div className="flex items-center justify-between gap-4">
															<span className="text-secondary/80 flex items-center gap-2 shrink-0">
																<Calendar className="w-3.5 h-3.5 text-secondary/70" /> Member Since
															</span>
															<span className="font-medium text-secondary">
																{format(new Date(selectedMember.createdAt), "PPP")}
															</span>
														</div>
														<div className="flex items-center justify-between gap-4">
															<span className="text-secondary/80 flex items-center gap-2 shrink-0">
																<Building2 className="w-3.5 h-3.5 text-secondary/70" /> Team / Group
															</span>
															<span className="font-medium text-secondary truncate max-w-[200px]">
																{detailedMember?.team?.name || "General Team"}
															</span>
														</div>
													</div>
												</div>
											)}

											{/* TAB: PROJECTS */}
											{activeTab === "projects" && (
												<div>
													{!detailedMember?.projectMembers?.length ? (
														<div className="py-8 text-center bg-secondary/5 rounded-[16px] border border-secondary/10">
															<Box className="w-7 h-7 mx-auto text-secondary/40 mb-1.5" />
															<p className="text-xs font-semibold text-secondary">
																No Assigned Projects
															</p>
															<p className="text-[11px] text-secondary/60 mt-0.5">
																This member is not assigned to any projects currently.
															</p>
														</div>
													) : (
														<div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
															{detailedMember.projectMembers.map((pm: any) => (
																<div
																	key={pm.id}
																	className="bg-secondary/5 hover:bg-secondary/10 transition-colors p-2.5 rounded-[12px] border border-secondary/10 flex items-center justify-between gap-3"
																>
																	<div className="flex items-center gap-2.5 min-w-0">
																		<div className="w-7 h-7 rounded-[8px] bg-secondary/10 flex items-center justify-center shrink-0">
																			<Box className="w-3.5 h-3.5 text-secondary" />
																		</div>
																		<div className="min-w-0">
																			<Link
																				href={`/projects/${pm.project.id}`}
																				className="text-xs font-semibold text-secondary hover:underline truncate block"
																				title={pm.project.title}
																			>
																				{pm.project.title}
																			</Link>
																			<span className="text-[10px] text-secondary/60 uppercase tracking-wider block">
																				{pm.projectRole}
																			</span>
																		</div>
																	</div>
																	<div className="flex items-center gap-1.5 shrink-0">
																		<Badge
																			className={cn(
																				"text-[10px] px-1.5 py-0.5",
																				renderPriority(pm.project.priority),
																			)}
																		>
																			{pm.project.priority}
																		</Badge>
																		<Badge
																			className={cn(
																				"text-[10px] px-1.5 py-0.5",
																				renderStatus(pm.project.status),
																			)}
																		>
																			{pm.project.status}
																		</Badge>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)}

											{/* TAB: TASKS */}
											{activeTab === "tasks" && (
												<div>
													{!detailedMember?.taskMembers?.length ? (
														<div className="py-8 text-center bg-secondary/5 rounded-[16px] border border-secondary/10">
															<Diamond className="w-7 h-7 mx-auto text-secondary/40 mb-1.5" />
															<p className="text-xs font-semibold text-secondary">
																No Assigned Tasks
															</p>
															<p className="text-[11px] text-secondary/60 mt-0.5">
																This member has no active task assignments.
															</p>
														</div>
													) : (
														<div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
															{detailedMember.taskMembers.map((tm: any) => (
																<div
																	key={tm.id}
																	className="bg-secondary/5 hover:bg-secondary/10 transition-colors p-2.5 rounded-[12px] border border-secondary/10 flex items-center justify-between gap-3"
																>
																	<div className="flex items-center gap-2.5 min-w-0">
																		<div className="w-7 h-7 rounded-[8px] bg-secondary/10 flex items-center justify-center shrink-0">
																			<Diamond className="w-3.5 h-3.5 text-secondary" />
																		</div>
																		<div className="min-w-0">
																			<Link
																				href={`/tasks/${tm.task.id}`}
																				className="text-xs font-semibold text-secondary hover:underline truncate block"
																				title={tm.task.title}
																			>
																				{tm.task.title}
																			</Link>
																			{tm.task.project?.title && (
																				<p className="text-[10px] text-secondary/60 truncate">
																					in {tm.task.project.title}
																				</p>
																			)}
																		</div>
																	</div>
																	<div className="flex items-center gap-1.5 shrink-0">
																		<Badge
																			className={cn(
																				"text-[10px] px-1.5 py-0.5",
																				renderPriority(tm.task.priority),
																			)}
																		>
																			{tm.task.priority}
																		</Badge>
																		<Badge
																			className={cn(
																				"text-[10px] px-1.5 py-0.5",
																				renderStatus(tm.task.status),
																			)}
																		>
																			{tm.task.status}
																		</Badge>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)}
										</>
									)}
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Remove Member Alert Dialog */}
			<AlertDialog
				open={!!memberToRemove}
				onOpenChange={(open) => !open && setMemberToRemove(null)}
			>
				<AlertDialogContent className="rounded-[20px] border-0 bg-primary text-secondary">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-secondary">
							Remove Member
						</AlertDialogTitle>
						<AlertDialogDescription className="text-secondary">
							Are you sure you want to remove{" "}
							<span className="font-semibold text-secondary">
								{memberToRemove?.user.fullName}
							</span>{" "}
							from this workspace? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-3 sm:gap-3 mt-4">
						<AlertDialogCancel
							disabled={loading}
							className="rounded-full border-accent text-secondary hover:bg-accent hover:text-primary"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={handleConfirmRemove}
							disabled={loading}
							className="rounded-full bg-destructive text-white hover:bg-destructive/90"
						>
							{loading && selectedActionId === memberToRemove?.id ? (
								<LoaderCircle className="animate-spin w-4 h-4 mr-2" />
							) : null}
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* Deactivate Member Dialog */}
			<Dialog
				open={!!memberToDeactivate}
				onOpenChange={(open) => {
					if (!open) {
						setMemberToDeactivate(null);
						setDeactivationReason("");
					}
				}}
			>
				<DialogContent className="w-full sm:max-w-md rounded-[20px] border-0 bg-primary text-secondary">
					<DialogHeader>
						<DialogTitle className="text-secondary flex items-center gap-2">
							<UserX className="w-5 h-5 text-amber-400" />
							Deactivate Member
						</DialogTitle>
						<DialogDescription className="text-secondary text-[13px]">
							Deactivating{" "}
							<span className="font-semibold text-secondary">
								{memberToDeactivate?.user.fullName}
							</span>{" "}
							will revoke their access to this workspace and send them a custom notification email.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label className="text-xs text-secondary font-medium">
								Reason for deactivation (optional)
							</Label>
							<Textarea
								value={deactivationReason}
								onChange={(e) => setDeactivationReason(e.target.value)}
								placeholder="Provide a note or reason that will be included in their notification email..."
								rows={3}
								className="rounded-[12px] bg-secondary/10 border border-secondary/20 text-secondary placeholder:text-secondary/50 text-xs focus-visible:ring-1 focus-visible:ring-secondary/30 resize-none"
							/>
						</div>

						<div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-[12px] p-3 text-xs flex items-start gap-2.5">
							<ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
							<p>
								When deactivated, this user will be prevented from joining or switching into this workspace until reactivated.
							</p>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 mt-4">
						<button
							type="button"
							disabled={loading}
							onClick={() => {
								setMemberToDeactivate(null);
								setDeactivationReason("");
							}}
							className="px-4 py-2 rounded-full border border-secondary/30 text-xs text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={loading}
							onClick={handleConfirmDeactivate}
							className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
						>
							{loading && selectedActionId === memberToDeactivate?.id ? (
								<LoaderCircle className="animate-spin w-3.5 h-3.5" />
							) : null}
							Deactivate Member
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}


