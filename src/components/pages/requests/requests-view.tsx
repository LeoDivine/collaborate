"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import PaginationControls from "@/components/shared/pagination-controls";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { renderRequestStatusBadge } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Blocks, Check, Ellipsis, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { JoinRequest } from "../../../../generated/prisma/client";
import { acceptRequestAdmin } from "@/lib/services/request.services";
import { toast } from "sonner";

export default function RequestsView({
	requests,
	totalItems,
	pageSize,
}: {
	requests: JoinRequest[];
	totalItems: number;
	pageSize?: number;
}) {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<{
		requestId: string | null;
	}>();
	const pathName = usePathname();
	const router = useRouter();

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

	const handleAcceptRequest = async ({
		email,
		fullName,
		requestId,
		workspaceId,
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
				toast.success(res.message);
			} else {
				await fetch(`/api/emails/workspace-requests`, {
					method: "POST",
					body: JSON.stringify({
						fullName,
						email,
						workspaceId,
					}),
				});
				toast.error(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
			router.refresh();
			setSelected({
				requestId: null,
			});
		}
	};

	return (
		<div className="mt-[10px] flex gap-2 flex-col">
			<Input
				value={query}
				type="text"
				onChange={(e) => setQuery(e.target.value)}
				className="bg-primary rounded-[15px] border-0"
				placeholder="Search by fullname and email address...."
			/>
			<div className="">
				{requests.length === 0 ?
					<div className=" bg-primary flex justify-center py-[20px] px-[20px] flex-col items-center rounded-[15px] ">
						<div className=" bg-accent text-primary py-[10px] px-[10px] rounded-full">
							<Blocks className=" w-4 h-4" />
						</div>
						<p className=" text-accent text-[15px] mt-[10px] font-bold">
							No Requests Available
						</p>
						<p className=" text-[13px] text-center text-accent">
							No requests found yet with your query or in this
							workspace
						</p>
					</div>
				:	<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead>Full Name</TableHead>
								<TableHead>Email Address</TableHead>
								<TableHead>Requested At</TableHead>
								<TableHead>Message</TableHead>
								<TableHead>Status</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{requests.map((i) => {
								return (
									<TableRow key={i.id}>
										<TableCell className="font-medium">
											{i.fullName}
										</TableCell>
										<TableCell className="truncate max-w-[180px]">
											{i.email}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{formatDistanceToNow(i.createdAt, {
												addSuffix: true,
											})}
										</TableCell>
										<TableCell className="max-w-[260px]">
											<span className="line-clamp-2 text-sm text-muted-foreground">
												{i.message === "" ?
													<span>No message</span>
												:	<span>{i.message}</span>}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												className={`${renderRequestStatusBadge(i.status)}`}
											>
												{i.status}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger
													disabled={
														i.status ===
															"ACCEPTED" ||
														loading
													}
													asChild
												>
													{(
														loading &&
														selected?.requestId ===
															i.id
													) ?
														<LoaderCircle className=" animate-spin w-4 h-4" />
													:	<Ellipsis
															className={` ${i.status === "ACCEPTED" && " cursor-not-allowed text-accent"} cursor-pointer w-4 h-4`}
														/>
													}
												</DropdownMenuTrigger>
												<DropdownMenuContent className=" bg-primary border-accent text-secondary">
													<DropdownMenuGroup>
														<DropdownMenuItem
															onClick={() =>
																handleAcceptRequest(
																	{
																		email: i.email,
																		fullName:
																			i.fullName,
																		requestId:
																			i.id,
																		workspaceId:
																			i.workspaceId,
																	},
																)
															}
														>
															{(
																loading &&
																selected?.requestId ===
																	i.id
															) ?
																<LoaderCircle className=" animate-spin" />
															:	<Check />}
															{loading ?
																"Accepting"
															:	"Accept"}
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
				}
				<PaginationControls
					totalItems={totalItems}
					pageSize={pageSize}
				/>
			</div>
		</div>
	);
}
