"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/shared/pagination-controls";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";
import {
	acceptRequestAdmin,
	deleteRequestAdmin,
	rejectRequestAdmin,
} from "@/lib/services/request.services";
import { renderRequestStatusBadge } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowUpDown,
	Ban,
	Blocks,
	Check,
	ChevronDown,
	Clock,
	Columns3,
	Ellipsis,
	ListFilter,
	LoaderCircle,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Ticket,
	Trash2,
	X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { JoinRequest } from "../../../../generated/prisma/client";

export default function RequestsView({
	requests,
	totalItems,
	pageSize = 15,
	workspaceId,
	stats,
	currentStatus = "ALL",
	currentInviteType = "ALL",
	currentSort = "desc",
	initialQuery = "",
}: {
	requests: JoinRequest[];
	totalItems: number;
	pageSize?: number;
	workspaceId?: string;
	stats?: {
		pending: number;
		accepted: number;
		rejected?: number;
		total?: number;
	};
	currentStatus?: string;
	currentInviteType?: string;
	currentSort?: "asc" | "desc";
	initialQuery?: string;
}) {
	const [requestList, setRequestList] = useState<JoinRequest[]>(requests);
	const [pendingCount, setPendingCount] = useState(stats?.pending ?? 0);
	const [acceptedCount, setAcceptedCount] = useState(stats?.accepted ?? 0);
	const [rejectedCount, setRejectedCount] = useState(stats?.rejected ?? 0);
	const [totalCount, setTotalCount] = useState(totalItems);

	const [query, setQuery] = useState(initialQuery);
	const [statusFilter, setStatusFilter] = useState(currentStatus);
	const [inviteFilter, setInviteFilter] = useState(currentInviteType);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(currentSort);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<{
		requestId: string | null;
	}>();

	// Visible columns state matching project-table
	const [visibleColumns, setVisibleColumns] = useState({
		email: true,
		inviteCode: true,
		requestedAt: true,
		message: true,
		status: true,
	});

	// Reject dialog state
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectingRequest, setRejectingRequest] = useState<JoinRequest | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectLoading, setRejectLoading] = useState(false);

	const pathName = usePathname();
	const router = useRouter();

	// Synchronize with server-rendered prop updates
	useEffect(() => {
		setRequestList(requests);
		setTotalCount(totalItems);
		if (stats) {
			setPendingCount(stats.pending ?? 0);
			setAcceptedCount(stats.accepted ?? 0);
			setRejectedCount(stats.rejected ?? 0);
		}
		setQuery(initialQuery);
		setStatusFilter(currentStatus);
		setInviteFilter(currentInviteType);
		setSortOrder(currentSort);
	}, [
		requests,
		totalItems,
		stats,
		initialQuery,
		currentStatus,
		currentInviteType,
		currentSort,
	]);

	// Real-time Pusher listener
	useWorkspaceRealtime(workspaceId, {
		onRequestReceived: (data) => {
			if (workspaceId && data.workspaceId !== workspaceId) return;

			setRequestList((prev) => {
				if (prev.some((r) => r.id === data.request.id)) return prev;
				if (statusFilter === "ALL" || statusFilter === "PENDING") {
					return [data.request as JoinRequest, ...prev];
				}
				return prev;
			});
			setPendingCount((prev) => prev + 1);
			setTotalCount((prev) => prev + 1);

			toast.info(`New join request received`, {
				description: `${data.request.fullName} (${data.request.email})`,
			});
		},
		onRequestUpdated: (data) => {
			if (workspaceId && data.workspaceId !== workspaceId) return;

			if (data.status === "DELETED") {
				setRequestList((prev) => prev.filter((r) => r.id !== data.requestId));
				setTotalCount((prev) => Math.max(0, prev - 1));
				return;
			}

			setRequestList((prev) =>
				prev.map((r) => {
					if (r.id === data.requestId) {
						return {
							...r,
							status: data.status as any,
							reviewedById: data.reviewedById ?? r.reviewedById,
							reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : r.reviewedAt,
						};
					}
					return r;
				}).filter((r) => {
					if (statusFilter === "ALL") return true;
					return r.status === statusFilter;
				})
			);

			if (data.status === "ACCEPTED") {
				setPendingCount((prev) => Math.max(0, prev - 1));
				setAcceptedCount((prev) => prev + 1);
			} else if (data.status === "REJECTED") {
				setPendingCount((prev) => Math.max(0, prev - 1));
				setRejectedCount((prev) => prev + 1);
			}
		},
	});

	// Debounced query search
	useEffect(() => {
		const handler = setTimeout(() => {
			const params = new URLSearchParams(window.location.search);
			const currentParamQuery = params.get("query") || "";

			if (query.trim() === currentParamQuery.trim()) {
				return;
			}

			if (query.trim()) {
				params.set("query", query.trim());
			} else {
				params.delete("query");
			}

			params.delete("page");

			const nextQuery = params.toString();
			router.push(nextQuery ? `${pathName}?${nextQuery}` : pathName);
		}, 400);

		return () => clearTimeout(handler);
	}, [query, pathName, router]);

	const handleStatusChange = (newStatus: string) => {
		setStatusFilter(newStatus);
		const params = new URLSearchParams(window.location.search);
		if (newStatus && newStatus !== "ALL") {
			params.set("status", newStatus);
		} else {
			params.delete("status");
		}
		params.delete("page");
		const nextQuery = params.toString();
		router.push(nextQuery ? `${pathName}?${nextQuery}` : pathName);
	};

	const handleInviteFilterChange = (newType: string) => {
		setInviteFilter(newType);
		const params = new URLSearchParams(window.location.search);
		if (newType && newType !== "ALL") {
			params.set("inviteType", newType);
		} else {
			params.delete("inviteType");
		}
		params.delete("page");
		const nextQuery = params.toString();
		router.push(nextQuery ? `${pathName}?${nextQuery}` : pathName);
	};

	const handleSortChange = (newSort: "asc" | "desc") => {
		setSortOrder(newSort);
		const params = new URLSearchParams(window.location.search);
		if (newSort && newSort !== "desc") {
			params.set("sort", newSort);
		} else {
			params.delete("sort");
		}
		params.delete("page");
		const nextQuery = params.toString();
		router.push(nextQuery ? `${pathName}?${nextQuery}` : pathName);
	};

	const handleResetFilters = () => {
		setQuery("");
		setStatusFilter("ALL");
		setInviteFilter("ALL");
		setSortOrder("desc");
		router.push(pathName);
	};

	const hasActiveFilters = Boolean(
		query.trim() ||
		statusFilter !== "ALL" ||
		inviteFilter !== "ALL" ||
		sortOrder !== "desc",
	);

	const handleAcceptRequest = async ({
		email,
		fullName,
		requestId,
		workspaceId: reqWorkspaceId,
	}: {
		requestId: string;
		fullName: string;
		workspaceId: string;
		email: string;
	}) => {
		setLoading(true);
		setSelected({
			requestId,
		});
		try {
			const res = await acceptRequestAdmin(requestId);

			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);

				// Send confirmation email
				try {
					await fetch(`/api/emails/workspace-requests`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							fullName,
							email,
							workspaceId: reqWorkspaceId,
							type: "ACCEPTED",
						}),
					});
				} catch (emailErr) {
					console.error("Email send failed:", emailErr);
				}
			}
		} catch (e) {
			toast.error("Something went wrong with accepting request");
		} finally {
			setLoading(false);
			setSelected({
				requestId: null,
			});
		}
	};

	const handleOpenRejectDialog = (request: JoinRequest) => {
		setRejectingRequest(request);
		setRejectionReason("");
		setRejectDialogOpen(true);
	};

	const handleConfirmReject = async () => {
		if (!rejectingRequest) return;
		setRejectLoading(true);

		try {
			const res = await rejectRequestAdmin(rejectingRequest.id, rejectionReason);

			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);

				// Send polite rejection email
				try {
					await fetch(`/api/emails/workspace-requests`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							fullName: rejectingRequest.fullName,
							email: rejectingRequest.email,
							workspaceId: rejectingRequest.workspaceId,
							type: "REJECTED",
							reason: rejectionReason,
						}),
					});
				} catch (emailErr) {
					console.error("Rejection email send failed:", emailErr);
				}

				setRejectDialogOpen(false);
				setRejectingRequest(null);
				setRejectionReason("");
			}
		} catch (e) {
			toast.error("Failed to decline request");
		} finally {
			setRejectLoading(false);
		}
	};

	const handleDeleteRequest = async (requestId: string) => {
		setLoading(true);
		try {
			const res = await deleteRequestAdmin(requestId);
			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);
			}
		} catch (e) {
			toast.error("Failed to delete request");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			{/* Top Header */}
			<div className="flex justify-between items-center">
				<p className="text-[20px] font-bold text-primary">
					Requests ({pendingCount})
				</p>
			</div>

			<div className="flex flex-col gap-4 py-4">
				{/* Top Controls & Search Bar */}
				<div className="flex flex-col gap-3">
					{/* Primary Search and Actions Row */}
					<div className="flex flex-wrap gap-2.5 items-center justify-between">
						<div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
							{/* Search Input */}
							<div className="relative flex-1 min-w-[200px]">
								<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent pointer-events-none" />
								<Input
									placeholder="Search requests by name or email..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="bg-primary pl-9 pr-8 rounded-full border border-secondary/15 text-secondary placeholder:text-secondary/50 h-10 w-full focus-visible:ring-1 focus-visible:ring-accent"
								/>
								{query && (
									<button
										onClick={() => setQuery("")}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/50 p-1 cursor-pointer"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								)}
							</div>

							{/* Quick Filter: Pending */}
							<button
								type="button"
								onClick={() =>
									handleStatusChange(
										statusFilter === "PENDING" ? "ALL" : "PENDING"
									)
								}
								className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
									statusFilter === "PENDING"
										? "bg-[#969696] text-primary border-[#969696]"
										: "bg-primary text-secondary border-secondary/15"
								}`}
							>
								<Clock
									className={`w-3.5 h-3.5 mr-1.5 ${
										statusFilter === "PENDING"
											? "text-primary"
											: "text-accent"
									}`}
								/>
								Pending
								{pendingCount > 0 && (
									<span
										className={`ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
											statusFilter === "PENDING"
												? "bg-primary text-secondary"
												: "bg-secondary text-primary"
										}`}
									>
										{pendingCount}
									</span>
								)}
							</button>

							{/* Quick Filter: Accepted */}
							{acceptedCount > 0 && (
								<button
									type="button"
									onClick={() =>
										handleStatusChange(
											statusFilter === "ACCEPTED" ? "ALL" : "ACCEPTED"
										)
									}
									className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
										statusFilter === "ACCEPTED"
											? "bg-[#969696] text-primary border-[#969696]"
											: "bg-primary text-secondary border-secondary/15"
									}`}
								>
									<Check
										className={`w-3.5 h-3.5 mr-1.5 ${
											statusFilter === "ACCEPTED"
												? "text-primary"
												: "text-accent"
										}`}
									/>
									Accepted
									<span
										className={`ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
											statusFilter === "ACCEPTED"
												? "bg-primary text-secondary"
												: "bg-secondary text-primary"
										}`}
									>
										{acceptedCount}
									</span>
								</button>
							)}

							{/* Quick Filter: Declined */}
							{rejectedCount > 0 && (
								<button
									type="button"
									onClick={() =>
										handleStatusChange(
											statusFilter === "REJECTED" ? "ALL" : "REJECTED"
										)
									}
									className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs font-semibold border cursor-pointer select-none ${
										statusFilter === "REJECTED"
											? "bg-destructive text-primary border-destructive"
											: "bg-primary text-secondary border-secondary/15"
									}`}
								>
									<Ban
										className={`w-3.5 h-3.5 mr-1.5 ${
											statusFilter === "REJECTED"
												? "text-primary"
												: "text-destructive"
										}`}
									/>
									Declined
									<span className="ml-1.5 flex h-4 px-1.5 items-center justify-center rounded-full bg-destructive text-primary text-[10px] font-bold">
										{rejectedCount}
									</span>
								</button>
							)}
						</div>

						{/* Right Controls: Sort, Filter, Columns, Reset */}
						<div className="flex items-center gap-2 flex-wrap">
							{/* Sort Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs gap-1.5 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none ${
											sortOrder !== "desc"
												? "border-accent text-accent font-semibold"
												: ""
										}`}
									>
										<ArrowUpDown className="w-3.5 h-3.5 text-accent" />
										<span>
											Sort:{" "}
											<strong className="capitalize">
												{sortOrder === "desc" ? "Newest" : "Oldest"}
											</strong>
										</span>
										<ChevronDown className="w-3 h-3 text-accent/70" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary rounded-[14px]">
									<DropdownMenuLabel className="text-xs">
										Sort Requests By
									</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-secondary/15" />
									<DropdownMenuItem
										onClick={() => handleSortChange("desc")}
										className="cursor-pointer text-xs"
									>
										Newest First
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleSortChange("asc")}
										className="cursor-pointer text-xs"
									>
										Oldest First
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Advanced Filter Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className={`inline-flex items-center justify-center rounded-full h-9 px-3.5 text-xs gap-1.5 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none ${
											statusFilter !== "ALL" || inviteFilter !== "ALL"
												? "border-accent text-accent font-semibold"
												: ""
										}`}
									>
										<SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
										Filter
										{(statusFilter !== "ALL" || inviteFilter !== "ALL") && (
											<span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-primary text-[10px] font-bold">
												{(statusFilter !== "ALL" ? 1 : 0) +
													(inviteFilter !== "ALL" ? 1 : 0)}
											</span>
										)}
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[240px] rounded-[14px] max-h-[440px] overflow-y-auto custom-scrollbar shadow-2xl p-2">
									{/* Filter by Status */}
									<DropdownMenuLabel className="text-xs font-bold text-secondary/70">
										Status
									</DropdownMenuLabel>
									<div className="flex flex-col gap-1 px-1 py-1">
										{[
											{ value: "ALL", label: "All Statuses" },
											{ value: "PENDING", label: "Pending" },
											{ value: "ACCEPTED", label: "Accepted" },
											{ value: "REJECTED", label: "Declined" },
										].map((opt) => {
											const isChecked = statusFilter === opt.value;
											return (
												<label
													key={opt.value}
													onClick={(e) => {
														e.stopPropagation();
														handleStatusChange(opt.value);
													}}
													className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs text-secondary"
												>
													<Checkbox checked={isChecked} />
													<span>{opt.label}</span>
												</label>
											);
										})}
									</div>

									<DropdownMenuSeparator className="bg-secondary/15" />

									{/* Filter by Source */}
									<DropdownMenuLabel className="text-xs font-bold text-secondary/70">
										Invite Source
									</DropdownMenuLabel>
									<div className="flex flex-col gap-1 px-1 py-1">
										{[
											{ value: "ALL", label: "All Sources" },
											{ value: "WITH_CODE", label: "With Invite Code" },
											{ value: "DIRECT", label: "Direct Request" },
										].map((opt) => {
											const isChecked = inviteFilter === opt.value;
											return (
												<label
													key={opt.value}
													onClick={(e) => {
														e.stopPropagation();
														handleInviteFilterChange(opt.value);
													}}
													className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary/10 cursor-pointer select-none text-xs text-secondary"
												>
													<Checkbox checked={isChecked} />
													<span>{opt.label}</span>
												</label>
											);
										})}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Columns Visibility Toggle */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="inline-flex items-center justify-center rounded-full h-9 w-9 border border-secondary/15 bg-primary text-secondary cursor-pointer select-none"
										title="Customize Columns"
									>
										<Columns3 className="w-3.5 h-3.5 text-accent" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-primary border border-secondary/20 text-secondary w-[180px] rounded-[14px]">
									<DropdownMenuLabel className="text-xs">
										Toggle Columns
									</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-secondary/15" />
									<DropdownMenuCheckboxItem
										checked={visibleColumns.email}
										onCheckedChange={(v) =>
											setVisibleColumns((p) => ({ ...p, email: !!v }))
										}
										className="text-xs cursor-pointer"
									>
										Email Address
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={visibleColumns.inviteCode}
										onCheckedChange={(v) =>
											setVisibleColumns((p) => ({ ...p, inviteCode: !!v }))
										}
										className="text-xs cursor-pointer"
									>
										Invite Code
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={visibleColumns.requestedAt}
										onCheckedChange={(v) =>
											setVisibleColumns((p) => ({ ...p, requestedAt: !!v }))
										}
										className="text-xs cursor-pointer"
									>
										Requested At
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={visibleColumns.message}
										onCheckedChange={(v) =>
											setVisibleColumns((p) => ({ ...p, message: !!v }))
										}
										className="text-xs cursor-pointer"
									>
										Message
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={visibleColumns.status}
										onCheckedChange={(v) =>
											setVisibleColumns((p) => ({ ...p, status: !!v }))
										}
										className="text-xs cursor-pointer"
									>
										Status
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Reset Filters */}
							{hasActiveFilters && (
								<button
									type="button"
									onClick={handleResetFilters}
									className="inline-flex items-center justify-center rounded-full h-9 px-3 text-secondary text-xs gap-1 border border-secondary/15 bg-primary cursor-pointer select-none"
								>
									<RotateCcw className="w-3 h-3 text-accent" />
									Reset
								</button>
							)}
						</div>
					</div>

					{/* Active Filter Summary Bar */}
					{hasActiveFilters && (
						<div className="flex items-center gap-1.5 flex-wrap text-xs text-primary/70">
							<span className="font-semibold text-primary">
								Showing {requestList.length} of {stats?.total ?? totalCount} requests
							</span>
							{query && (
								<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
									Query: "{query}"
									<X
										className="w-3 h-3 cursor-pointer hover:text-destructive"
										onClick={() => setQuery("")}
									/>
								</Badge>
							)}
							{statusFilter !== "ALL" && (
								<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
									Status: {statusFilter}
									<X
										className="w-3 h-3 cursor-pointer hover:text-destructive"
										onClick={() => handleStatusChange("ALL")}
									/>
								</Badge>
							)}
							{inviteFilter !== "ALL" && (
								<Badge className="bg-primary/10 text-primary border border-primary/15 gap-1 text-[11px] py-0.5 px-2 font-normal">
									{inviteFilter === "WITH_CODE" ? "With Invite Code" : "Direct Request"}
									<X
										className="w-3 h-3 cursor-pointer hover:text-destructive"
										onClick={() => handleInviteFilterChange("ALL")}
									/>
								</Badge>
							)}
						</div>
					)}
				</div>

				{/* Main Table Container */}
				<div className="relative rounded-[20px] border border-secondary/15 bg-primary/40 backdrop-blur-sm overflow-hidden shadow-sm">
					{requestList.length === 0 ? (
						/* Empty States */
						<div className="flex justify-center py-16 px-6 flex-col items-center text-center bg-[#a49f9f] text-[#222222]">
							<div className="bg-[#8b8686] text-[#222222] p-4 rounded-full mb-3">
								{hasActiveFilters ? (
									<ListFilter className="w-6 h-6 text-[#222222]" />
								) : (
									<Blocks className="w-6 h-6 text-[#222222]" />
								)}
							</div>
							<h3 className="text-base font-bold text-[#222222]">
								{hasActiveFilters
									? "No matching requests found"
									: "No requests available"}
							</h3>
							<p className="text-xs text-[#222222]/80 max-w-sm mt-1">
								{hasActiveFilters
									? "None of the requests match your active filters or search term. Try resetting your filters."
									: "When applicants request to join this workspace, their submissions will appear here live."}
							</p>
							{hasActiveFilters && (
								<Button
									variant="outline"
									onClick={handleResetFilters}
									className="mt-4 rounded-full text-xs h-8 gap-1.5 border-[#222222] bg-[#222222] hover:bg-[#222222]/90 text-white hover:text-white cursor-pointer"
								>
									<RotateCcw className="w-3 h-3" />
									Clear all filters
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto custom-scrollbar">
							<Table className="w-full min-w-[700px]">
								<TableHeader className="bg-secondary/5 border-b border-secondary/10">
									<TableRow className="hover:bg-transparent border-secondary/10">
										<TableHead className="text-xs font-bold text-secondary">
											Full Name
										</TableHead>
										{visibleColumns.email && (
											<TableHead className="text-xs font-bold text-secondary">
												Email Address
											</TableHead>
										)}
										{visibleColumns.inviteCode && (
											<TableHead className="text-xs font-bold text-secondary">
												Invite Code
											</TableHead>
										)}
										{visibleColumns.requestedAt && (
											<TableHead className="text-xs font-bold text-secondary">
												Requested At
											</TableHead>
										)}
										{visibleColumns.message && (
											<TableHead className="text-xs font-bold text-secondary">
												Message
											</TableHead>
										)}
										{visibleColumns.status && (
											<TableHead className="text-xs font-bold text-secondary">
												Status
											</TableHead>
										)}
										<TableHead className="w-[50px] text-right"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{requestList.map((i) => {
										const isPending = i.status === "PENDING";
										return (
											<TableRow
												key={i.id}
												className="hover:bg-secondary/5 border-secondary/10 transition-colors"
											>
												<TableCell className="font-medium">
													{i.fullName}
												</TableCell>
												{visibleColumns.email && (
													<TableCell className="truncate max-w-[180px]">
														{i.email}
													</TableCell>
												)}
												{visibleColumns.inviteCode && (
													<TableCell>
														{i.inviteCode ? (
															<Badge
																variant="outline"
																className="font-mono text-xs"
															>
																{i.inviteCode}
															</Badge>
														) : (
															<span className="text-muted-foreground text-xs">
																—
															</span>
														)}
													</TableCell>
												)}
												{visibleColumns.requestedAt && (
													<TableCell className="whitespace-nowrap text-sm text-muted-foreground">
														<div className="flex items-center gap-1.5">
															<Clock className="w-3.5 h-3.5" />
															{formatDistanceToNow(new Date(i.createdAt), {
																addSuffix: true,
															})}
														</div>
													</TableCell>
												)}
												{visibleColumns.message && (
													<TableCell className="max-w-[240px]">
														<span className="line-clamp-2 text-sm text-muted-foreground">
															{i.message ? (
																<span>{i.message}</span>
															) : (
																<span className="italic text-muted-foreground/60">
																	No message
																</span>
															)}
														</span>
													</TableCell>
												)}
												{visibleColumns.status && (
													<TableCell>
														<Badge
															className={`${renderRequestStatusBadge(i.status as any)} font-semibold text-[11px]`}
														>
															{i.status}
														</Badge>
													</TableCell>
												)}
												<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger
													disabled={loading}
													asChild
												>
													{loading && selected?.requestId === i.id ? (
														<LoaderCircle className="animate-spin w-4 h-4 text-secondary ml-auto" />
													) : (
														<button
															type="button"
															className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10 transition-colors inline-flex items-center justify-center focus:outline-none"
															aria-label="More options"
														>
															<Ellipsis className="cursor-pointer w-4 h-4" />
														</button>
													)}
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="bg-primary border border-secondary/20 text-secondary min-w-[170px] p-1.5 rounded-xl shadow-2xl">
													<DropdownMenuGroup>
														<DropdownMenuItem
															disabled={!isPending || loading}
															onClick={() =>
																handleAcceptRequest({
																	email: i.email,
																	fullName: i.fullName,
																	requestId: i.id,
																	workspaceId: i.workspaceId,
																})
															}
															className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 hover:bg-emerald-500/15 focus:bg-emerald-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
														>
															<Check className="w-4 h-4 text-emerald-400 shrink-0" />
															<span>Accept</span>
														</DropdownMenuItem>

														<DropdownMenuItem
															variant="destructive"
															disabled={!isPending || loading}
															onClick={() => handleOpenRejectDialog(i)}
															className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/15 focus:bg-destructive/15 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
														>
															<Ban className="w-4 h-4 text-destructive shrink-0" />
															<span>Decline Request</span>
														</DropdownMenuItem>

														<DropdownMenuSeparator className="bg-secondary/15 my-1" />

														<DropdownMenuItem
															variant="destructive"
															disabled={loading}
															onClick={() => handleDeleteRequest(i.id)}
															className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/15 focus:bg-destructive/15 rounded-lg transition-colors disabled:opacity-30"
														>
															<Trash2 className="w-4 h-4 text-destructive shrink-0" />
															<span>Remove</span>
														</DropdownMenuItem>
													</DropdownMenuGroup>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</div>

		<div className="mt-4">
			<PaginationControls
				totalItems={totalCount}
				pageSize={pageSize}
			/>
		</div>
	</div>

			{/* Decline / Reject Confirmation Dialog */}
			<Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<DialogContent className="bg-primary text-secondary border-accent rounded-[20px] max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold flex items-center gap-2">
							<Ban className="w-5 h-5 text-destructive" />
							Decline Join Request
						</DialogTitle>
						<DialogDescription className="text-secondary/70 text-xs mt-1">
							Are you sure you want to decline the request from{" "}
							<span className="font-semibold text-secondary">
								{rejectingRequest?.fullName}
							</span>{" "}
							({rejectingRequest?.email})? A polite notification email will be sent.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2 my-3">
						<label className="text-xs font-semibold text-secondary/80">
							Reason / Note for Applicant (Optional)
						</label>
						<Textarea
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="e.g. This workspace is currently at capacity or requires an internal company email..."
							className="bg-black/30 border border-muted/30 text-secondary placeholder:text-muted-foreground rounded-[10px] text-xs h-[90px] resize-none"
						/>
					</div>

					<DialogFooter className="flex gap-2 justify-end">
						<Button
							variant="ghost"
							disabled={rejectLoading}
							onClick={() => setRejectDialogOpen(false)}
							className="rounded-full text-secondary/80 hover:text-secondary hover:bg-white/10"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={rejectLoading}
							onClick={handleConfirmReject}
							className="rounded-full flex items-center gap-2"
						>
							{rejectLoading ? (
								<>
									<LoaderCircle className="w-4 h-4 animate-spin" />
									Declining...
								</>
							) : (
								"Decline & Notify"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
