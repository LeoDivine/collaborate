"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { joinWorkspaceSchema } from "@/lib/schemas/workspace";
import {
	searchForWorkspace,
	workspaceRequest,
} from "@/lib/services/workspace.services";
import { getInitials } from "@/lib/utils";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { User } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Workspace } from "../../../generated/prisma/client";
import { Button } from "../ui/button";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

export type JoinWorkspaceValues = z.infer<typeof joinWorkspaceSchema>;

export default function JoinWorkspaceForm({ user }: { user?: User }) {
	const [loading, setLoading] = useState(false);
	const [workspace, setWorkspace] = useState<{
		id: string;
		name: string;
	}>();
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [hasMore, setHasMore] = useState(true);
	const [fetchingMore, setFetchingMore] = useState(false);
	const [searching, setSearching] = useState(false);
	const shouldShowNoWorkspaceAlert =
		debouncedQuery.length > 0 &&
		!searching &&
		!workspace &&
		workspaces.length === 0;

	const scrollViewportRef = useRef<HTMLDivElement>(null);

	const form = useForm<JoinWorkspaceValues>({
		defaultValues: {
			email: "",
			name: "",
			inviteToken: "",
			message: "",
		},
		mode: "all",
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query.trim());
		}, 500);
		return () => clearTimeout(handler);
	}, [query]);

	useEffect(() => {
		setPage(1);
		setHasMore(true);
	}, [debouncedQuery]);

	const fetchData = async () => {
		if (!debouncedQuery || workspace) {
			setSearching(false);
			setFetchingMore(false);
			setWorkspaces([]);
			setHasMore(false);
			return;
		}

		setSearching(true);

		try {
			if (page > 1) setFetchingMore(true);

			const res = await searchForWorkspace({
				query: debouncedQuery,
				limit,
				page,
			});

			if (!res.success) {
				setWorkspaces([]);
				setHasMore(false);
			} else {
				setWorkspaces((prev) =>
					page === 1 ? res.workspace : [...prev, ...res.workspace],
				);
				setHasMore(res.workspace.length === limit);
			}
		} catch (e) {
			setWorkspaces([]);
			setHasMore(false);
		} finally {
			setSearching(false);
			setFetchingMore(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [debouncedQuery, page]);

	const handleSelectWorkspace = (id: string, name: string) => {
		setSearching(false);
		setFetchingMore(false);
		setHasMore(false);
		setWorkspace({
			id,
			name,
		});
		setQuery(name);
		setWorkspaces([]);
	};

	const handleSubmit = async (values: JoinWorkspaceValues) => {
		setLoading(true);

		try {
			const res = await workspaceRequest(
				values,
				workspace?.id ?? "",
				user,
			);
			if (!res.success) {
				toast.error(res.message);
			}
			toast.success(res.message);
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form
				className="w-full md:w-[60%] mt-[40px] flex flex-col gap-5"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<FormField
					name="name"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">Full Name</Label>
							<Input
								disabled={loading}
								{...field}
								placeholder="Enter your full name"
								className="text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">
								Email Address
							</Label>
							<Input
								disabled={loading}
								{...field}
								placeholder="Enter your email address"
								className="text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="inviteToken"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">
								Invite Token (Optional)
							</Label>
							<Input
								disabled={loading}
								{...field}
								placeholder="Enter your invite token"
								className="text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="relative">
					<div className="flex flex-col gap-2">
						<Label className="text-primary">Workspace</Label>
						<div className=" relative">
							<Input
								disabled={loading}
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setWorkspace(undefined);
								}}
								placeholder="Search for workspace"
								className="text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							{searching && query !== "" && (
								<LoaderCircle className=" right-0 top-1/2 mr-[10px] animate-spin -translate-y-1/2 absolute text-primary" />
							)}
							{shouldShowNoWorkspaceAlert && (
								<Tooltip>
									<TooltipTrigger>
										<TriangleAlert className=" right-0 top-1/2 mr-[10px]  -translate-y-1/2 absolute text-red-600" />
									</TooltipTrigger>
									<TooltipContent side="right" className=" ">
										<p>No workspaces found</p>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
						<FormMessage />
					</div>

					{workspaces.length > 0 && (
						<div className="bg-white rounded-[10px] py-[4px] px-[4px] shadow mt-[5px] border-t-0 border-l-0 border-b-[4px] border-primary border-r-0 absolute w-full max-h-[200px]">
							<ScrollArea className="h-full">
								<div
									ref={scrollViewportRef}
									className="max-h-[200px] h-full overflow-y-auto"
									onScroll={(e) => {
										const target = e.currentTarget;
										const isBottom =
											target.scrollHeight -
												target.scrollTop <=
											target.clientHeight + 20;

										if (
											isBottom &&
											hasMore &&
											!fetchingMore
										) {
											setPage((prev) => prev + 1);
										}
									}}
								>
									{workspaces.map((i, k) => (
										<div
											key={k}
											onClick={() => {
												handleSelectWorkspace(
													i.id,
													i.name,
												);
											}}
											className="cursor-pointer transition-all hover:bg-accent/25 py-[5px] px-[5px] rounded-[5px] gap-3 flex items-center"
										>
											<div className="text-primary w-[50px] h-[50px] flex items-center justify-center rounded-full bg-secondary font-extrabold">
												{getInitials(i.name)}
											</div>
											<div className=" text-[13px] text-primary grow">
												<p>{i.name}</p>
											</div>
										</div>
									))}
									{fetchingMore && (
										<div className="py-2 flex justify-center">
											<LoaderCircle className="animate-spin text-primary" />
										</div>
									)}
								</div>
								<ScrollBar orientation="vertical" />
							</ScrollArea>
						</div>
					)}
				</div>

				<FormField
					name="message"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">Message</Label>
							<Textarea
								disabled={loading}
								{...field}
								placeholder="Start typing...."
								className="text-primary h-[100px] resize-none py-[10px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="w-full">
					<Button
						disabled={loading}
						type="submit"
						className="w-full py-[20px] rounded-full text-secondary"
					>
						{loading ?
							<div className="flex items-center gap-3">
								<LoaderCircle className="animate-spin" />
								Joining...
							</div>
						:	"Join workspace"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
