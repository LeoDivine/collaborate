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
import { MembersUsers } from "@/lib/types";
import { renderMemberStatusBadge, renderWorkspaceRoleBadge } from "@/lib/utils";
import { format } from "date-fns";
import { Ellipsis, Mail } from "lucide-react";
import { User } from "next-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceRoles } from "../../../../generated/prisma/enums";

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
				<Table>
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
							return (
								<TableRow key={i.id}>
									<TableCell className="font-medium">
										{i.user.fullName}
									</TableCell>
									<TableCell
										onClick={(e) => e.preventDefault()}
									>
										<a
											href={`mailto:${i.user.email}`}
											className=" cursor-pointer gap-3 flex"
										>
											<Mail className=" w-5 h-5" />
											<span>{i.user.email}</span>
										</a>
									</TableCell>
									<TableCell>@{i.user.userName}</TableCell>
									<TableCell className="">
										<Badge
											className={renderWorkspaceRoleBadge(
												i.role,
											)}
										>
											{i.role}
										</Badge>
									</TableCell>
									<TableCell className="">
										{format(new Date(i.createdAt), "PP")}
									</TableCell>
									<TableCell className="">
										<Badge
											className={renderMemberStatusBadge(
												i.status,
											)}
										>
											{i.status}
										</Badge>
									</TableCell>
									<TableCell className="">
										<DropdownMenu>
											<DropdownMenuTrigger
												disabled={
													i.role ===
													("OWNER" as WorkspaceRoles)
												}
												asChild
											>
												<Ellipsis
													className={` ${i.role === ("OWNER" as WorkspaceRoles) && " cursor-not-allowed text-accent"} cursor-pointer w-4 h-4`}
												/>
											</DropdownMenuTrigger>
											<DropdownMenuContent className=" bg-primary border-accent text-secondary">
												<DropdownMenuGroup>
													<DropdownMenuItem className="">
														View member
													</DropdownMenuItem>
													<DropdownMenuItem>
														Make admin
													</DropdownMenuItem>
												</DropdownMenuGroup>
												<DropdownMenuSeparator />
												<DropdownMenuGroup>
													<DropdownMenuItem>
														Disable member
													</DropdownMenuItem>
													<DropdownMenuItem>
														Remove member
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

				<PaginationControls
					totalItems={totalItems}
					pageSize={pageSize}
				/>
			</div>
		</div>
	);
}
