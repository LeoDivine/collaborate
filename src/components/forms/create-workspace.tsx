"use client";

import { INDUSTRY_TYPES, TEAM_SIZE } from "@/lib/const";
import { extendedWorkspaceCreateSchema } from "@/lib/schemas/workspace";
import { generateSlug } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { DeskMode } from "../../../generated/prisma/enums";
import Link from "next/link";
import { createWorkspace } from "@/lib/services/workspace.services";
import { User } from "next-auth";

export type ExtendedWorkspaceCreateValues = z.infer<
	typeof extendedWorkspaceCreateSchema
>;
export default function CreateWorkspaceForm(user: User) {
	const [loading, setLoading] = useState(false);
	const { update } = useSession();
	const router = useRouter();

	const handleGenerateSlug = () => {
		const name = workspaceForm.getValues("name");
		const slug = generateSlug(name);

		if (slug) {
			workspaceForm.setValue("slug", slug, { shouldValidate: true });
		}
	};

	const workspaceForm = useForm<ExtendedWorkspaceCreateValues>({
		defaultValues: {
			industryType: "",
			name: "",
			teamSize: "",
			slug: "",
			workspaceMode: "INDIVIDUAL" as DeskMode,
		},
		resolver: zodResolver(extendedWorkspaceCreateSchema),
		mode: "all",
	});

	const handleSubmit = async (values: ExtendedWorkspaceCreateValues) => {
		setLoading(true);
		console.log({ values });
		try {
			const res = await createWorkspace(values, user);
			// console.log({ res });
			if (res.success) {
				await update({
					currenWorkspaceId: res.workspace?.id,
					currentWorkspaceMode: res.workspace?.mode,
					currentWorkspaceRole: res.member?.role,
				});
				workspaceForm.reset();
				router.push("/dashboard");
				toast.success(res.message);
			} else {
				toast.error(res.message);
				workspaceForm.reset();
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form {...workspaceForm}>
			<form
				onSubmit={workspaceForm.handleSubmit(handleSubmit)}
				className=" mt-[20px] w-full md:w-[50%]"
			>
				<div className=" w-full flex gap-3 flex-col">
					<FormField
						name="name"
						control={workspaceForm.control}
						render={({ field }) => (
							<FormItem className=" flex flex-col gap-2">
								<Label className=" text-primary">
									Workspace Name
								</Label>
								<Input
									disabled={loading}
									{...field}
									placeholder="Enter your workspace name"
									className=" text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="slug"
						control={workspaceForm.control}
						render={({ field }) => (
							<FormItem className=" flex flex-col gap-2">
								<Label className=" text-primary">Slug</Label>
								<div className=" flex gap-3 items-center">
									<Input
										disabled
										{...field}
										placeholder="Generate slug"
										className=" text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
									/>
									<Button
										onClick={() => {
											const name =
												workspaceForm.getValues("name");

											if (!name) {
												toast.error(
													"Enter workspace name first",
												);
												return;
											}
											handleGenerateSlug();
										}}
										type="button"
										className="py-[20px] rounded-[10px] text-secondary"
									>
										Generate
									</Button>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="workspaceMode"
						control={workspaceForm.control}
						render={({ field }) => (
							<FormItem className=" flex flex-col gap-2">
								<Label className=" text-primary">
									Workspace Mode
								</Label>
								<Select
									disabled={loading}
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger className=" w-full text-primary py-[20px] rounded-[10px]  border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary">
										<SelectValue
											className=""
											placeholder="Select workspace mode"
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{Object.values(DeskMode).map(
												(i, k) => (
													<SelectItem
														key={k}
														value={i}
													>
														{i}
													</SelectItem>
												),
											)}
										</SelectGroup>
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
					<FormField
						name="industryType"
						control={workspaceForm.control}
						render={({ field }) => (
							<FormItem className=" flex flex-col gap-2">
								<Label className=" text-primary">
									Industry Type
								</Label>
								<Select
									disabled={loading}
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger className=" w-full text-primary py-[20px] rounded-[10px]  border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary">
										<SelectValue
											className=""
											placeholder="Select industry type"
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{INDUSTRY_TYPES.map((i, k) => (
												<SelectItem key={k} value={i}>
													{i}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
					<FormField
						name="teamSize"
						control={workspaceForm.control}
						render={({ field }) => (
							<FormItem className=" flex flex-col gap-2">
								<Label className=" text-primary">
									Team Size
								</Label>
								<Select
									disabled={loading}
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger className=" w-full text-primary py-[20px] rounded-[10px]  border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary">
										<SelectValue
											className=""
											placeholder="Select team size"
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{TEAM_SIZE.map((i, k) => (
												<SelectItem key={k} value={i}>
													{i}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
					<span className=" text-[15px] flex gap-2 text-primary">
						Already have a workspace?{" "}
						<Link
							className=" underline"
							href={"/sign-in/individual-auth"}
						>
							Join Workspace
						</Link>
					</span>
				</div>
				<Button
					disabled={loading}
					type="submit"
					className="py-[20px]  w-full mt-[20px] rounded-full text-secondary"
				>
					{loading ?
						<div className=" flex items-center gap-3">
							<LoaderCircle className=" animate-spin" />
							Submitting...
						</div>
					:	"Submit"}
				</Button>
			</form>
		</Form>
	);
}
