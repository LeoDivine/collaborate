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
import { MembersUsers } from "@/lib/types";
import { renderMemberStatusBadge, renderWorkspaceRoleBadge } from "@/lib/utils";
import { format } from "date-fns";
import {
	Box,
	Calendar,
	Diamond,
	Ellipsis,
	Eye,
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
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

	// View Member Dialog State
	const [selectedMember, setSelectedMember] = useState<MembersUsers | null>(null);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [detailedMember, setDetailedMember] = useState<any>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);

	// Remove Member Alert Dialog State
	const [memberToRemove, setMemberToRemove] = useState<MembersUsers | null>(null);

	const pathName = usePathname();
	const router = useRouter();

	const currentUserMember = members.find(
		(m) => m.userId === user?.id || m.user?.id === user?.id,
	);
	const isUserAdminOrOwner =
		currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";

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

		try {
			const res = await getMemberDetails(member.id);
			if (res.success) {
				setDetailedMember(res.member);
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
		const newStatus: MemberStatus =
			member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
		setLoading(true);
		setSelectedActionId(member.id);

		try {
			const res = await updateMemberStatus(member.id, newStatus);
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
		<div className="mt-[10px] flex gap-2 flex-col">
			<Input
				value={query}
				type="text"
				onChange={(e) => setQuery(e.target.value)}
				className="bg-primary rounded-[15px] border-0"
				placeholder="Search by fullname, email address and username...."
			/>

			<div className="">
				{members.length === 0 ? (
					<div className="bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px]">
						<div className="bg-accent text-primary py-[10px] px-[10px] rounded-full">
							<Users className="w-4 h-4" />
						</div>
						<p className="text-accent text-[15px] mt-[10px] font-bold">
							No Members Available
						</p>
						<p className="text-[13px] text-center text-accent">
							No members found yet with your query or in this workspace
						</p>
					</div>
				) : (
					<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead className="">Fullname</TableHead>
								<TableHead>Email Address</TableHead>
								<TableHead>Username</TableHead>
								<TableHead className="">Role</TableHead>
								<TableHead className="">Joined At</TableHead>
								<TableHead className="">Status</TableHead>
								<TableHead className=""></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.map((i) => {
								const isTargetOwner = i.role === ("OWNER" as WorkspaceRoles);
								const isSelf = i.userId === user?.id || i.user?.id === user?.id;
								const canManage = isUserAdminOrOwner && !isTargetOwner && !isSelf;
								const isRowLoading = loading && selectedActionId === i.id;

								return (
									<TableRow key={i.id}>
										<TableCell className="font-medium">
											{i.user.fullName}
										</TableCell>
										<TableCell onClick={(e) => e.preventDefault()}>
											<a
												href={`mailto:${i.user.email}`}
												className="cursor-pointer gap-3 flex items-center"
											>
												<Mail className="w-5 h-5" />
												<span>{i.user.email}</span>
											</a>
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
											<Badge className={renderMemberStatusBadge(i.status)}>
												{i.status}
											</Badge>
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
												<DropdownMenuContent className="bg-primary border-accent text-secondary">
													<DropdownMenuGroup>
														<DropdownMenuItem
															onClick={() => handleViewMember(i)}
															className="cursor-pointer flex items-center gap-2"
														>
															<Eye className="w-4 h-4" />
															<span>View member</span>
														</DropdownMenuItem>
														{canManage && (
															<DropdownMenuItem
																onClick={() => handleRoleToggle(i)}
																className="cursor-pointer flex items-center gap-2"
															>
																{i.role === "ADMIN" ? (
																	<>
																		<ShieldAlert className="w-4 h-4" />
																		<span>Make member</span>
																	</>
																) : (
																	<>
																		<ShieldCheck className="w-4 h-4" />
																		<span>Make admin</span>
																	</>
																)}
															</DropdownMenuItem>
														)}
													</DropdownMenuGroup>
													{canManage && <DropdownMenuSeparator />}
													{canManage && (
														<DropdownMenuGroup>
															<DropdownMenuItem
																onClick={() => handleStatusToggle(i)}
																className="cursor-pointer flex items-center gap-2"
															>
																{i.status === "ACTIVE" ? (
																	<>
																		<UserX className="w-4 h-4" />
																		<span>Disable member</span>
																	</>
																) : (
																	<>
																		<UserCheck className="w-4 h-4" />
																		<span>Activate member</span>
																	</>
																)}
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => setMemberToRemove(i)}
																className="cursor-pointer flex items-center gap-2 text-destructive"
															>
																<Trash2 className="w-4 h-4" />
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
				<DialogContent className="w-full sm:max-w-lg rounded-[20px] border-0 bg-primary text-secondary">
					<DialogHeader>
						<DialogTitle className="text-secondary flex items-center gap-3">
							<Users className="w-5 h-5 text-secondary" />
							Member Profile
						</DialogTitle>
						<DialogDescription className="text-secondary text-[13px]">
							Profile and workspace details for this team member.
						</DialogDescription>
					</DialogHeader>

					{selectedMember && (
						<div className="space-y-4 py-2 text-secondary">
							<div className="flex items-center gap-4 border-b border-accent/20 pb-4">
								<div>
									<h4 className="text-base font-bold text-secondary">
										{selectedMember.user.fullName}
									</h4>
									<p className="text-xs text-secondary opacity-80">
										@{selectedMember.user.userName}
									</p>
									<div className="flex gap-2 mt-2">
										<Badge className={renderWorkspaceRoleBadge(selectedMember.role)}>
											{selectedMember.role}
										</Badge>
										<Badge className={renderMemberStatusBadge(selectedMember.status)}>
											{selectedMember.status}
										</Badge>
									</div>
								</div>
							</div>

							<div className="space-y-3 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-secondary flex items-center gap-2">
										<Mail className="w-4 h-4 text-secondary" /> Email:
									</span>
									<span className="font-medium text-secondary">
										{selectedMember.user.email}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-secondary flex items-center gap-2">
										<Calendar className="w-4 h-4 text-secondary" /> Joined:
									</span>
									<span className="font-medium text-secondary">
										{format(new Date(selectedMember.createdAt), "PPP")}
									</span>
								</div>
							</div>

							{loadingDetails ? (
								<div className="flex justify-center items-center py-4">
									<LoaderCircle className="animate-spin w-6 h-6 text-secondary" />
								</div>
							) : detailedMember?._count ? (
								<div className="grid grid-cols-2 gap-3 pt-2">
									<div className="border border-accent/20 rounded-[15px] p-3 text-center bg-primary">
										<Box className="w-5 h-5 mx-auto mb-1 text-secondary" />
										<p className="text-xs text-secondary">Assigned Projects</p>
										<p className="text-lg font-bold text-secondary">
											{detailedMember._count.projectMembers}
										</p>
									</div>
									<div className="border border-accent/20 rounded-[15px] p-3 text-center bg-primary">
										<Diamond className="w-5 h-5 mx-auto mb-1 text-secondary" />
										<p className="text-xs text-secondary">Assigned Tasks</p>
										<p className="text-lg font-bold text-secondary">
											{detailedMember._count.taskMembers}
										</p>
									</div>
								</div>
							) : null}
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
					<AlertDialogFooter className="mt-4">
						<AlertDialogCancel
							disabled={loading}
							className="rounded-full border-accent text-secondary hover:bg-accent hover:text-primary"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
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
		</div>
	);
}


