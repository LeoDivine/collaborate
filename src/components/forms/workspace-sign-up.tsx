"use client";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { INDUSTRY_TYPES, TEAM_SIZE } from "@/lib/const";
import { signUpSchema } from "@/lib/schemas/auth";
import { workspaceCreateSchema } from "@/lib/schemas/workspace";
import { workspaceSignUp } from "@/lib/services/auth.services";
import { generateSlug } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegEyeSlash } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SignUpValues } from "./individual-sign-up";
import { LoaderCircle } from "lucide-react";

export type WorkspaceCreateValues = z.infer<typeof workspaceCreateSchema>;
type UserSignUpValues = SignUpValues;
export default function WorkspaceSignUp({
	initialTab,
}: {
	initialTab: string;
}) {
	const [password, setPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const { update } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab") || initialTab;

	const workspaceForm = useForm<WorkspaceCreateValues>({
		defaultValues: {
			industryType: "",
			name: "",
			teamSize: "",
			slug: "",
		},
		resolver: zodResolver(workspaceCreateSchema),
		mode: "all",
	});

	const ownerForm = useForm<UserSignUpValues>({
		defaultValues: {
			confirmPassword: "",
			email: "",
			fullName: "",
			password: "",
		},
		resolver: zodResolver(signUpSchema),
		mode: "all",
	});

	const handleChange = (value: string) => {
		if (value === tab) return;
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const handlePassword = () => {
		setPassword(!password);
	};
	const name = workspaceForm.getValues("name");

	const handleGenerateSlug = () => {
		const name = workspaceForm.getValues("name");
		const slug = generateSlug(name);

		if (slug) {
			workspaceForm.setValue("slug", slug, { shouldValidate: true });
		}
	};

	const handleSubmit = async ({
		workspaceData,
		userData,
	}: {
		workspaceData: WorkspaceCreateValues;
		userData: UserSignUpValues;
	}) => {
		setLoading(true);
		try {
			const res = await workspaceSignUp(userData, workspaceData);
			if (!res.success) {
				// ownerForm.reset();
				// workspaceForm.reset();
				toast.error(res.message);
			}
			await update({
				currenWorkspaceId: res.workspace?.id,
				currentWorkspaceMode: res.workspace?.mode,
				currentWorkspaceRole: res.member?.role,
			});
			ownerForm.reset();
			workspaceForm.reset();
			router.push("/sign-up/workspace-auth/username");
			toast.success(res.message);
		} catch (e: any) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className=" w-full">
			<Tabs
				onValueChange={handleChange}
				value={tab}
				className=" w-full mt-[10px]"
			>
				<TabsList className=" md:w-[50%] w-full">
					<TabsTrigger value="owner">Owner</TabsTrigger>
					<TabsTrigger value="workspace">Workspace</TabsTrigger>
				</TabsList>
				<TabsContent className=" mt-[20px] w-full" value="owner">
					<Form {...ownerForm}>
						<form>
							<div className=" flex gap-3 flex-col">
								<FormField
									name="fullName"
									control={ownerForm.control}
									render={({ field }) => (
										<FormItem className=" flex flex-col gap-2">
											<Label className=" text-primary">
												Full Name
											</Label>
											<Input
												disabled={loading}
												{...field}
												placeholder="Enter your full name"
												className=" text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
											/>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="email"
									control={ownerForm.control}
									render={({ field }) => (
										<FormItem className=" flex flex-col gap-2">
											<Label className=" text-primary">
												Email Address
											</Label>
											<Input
												disabled={loading}
												{...field}
												placeholder="Enter your email address"
												className=" text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
											/>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="password"
									control={ownerForm.control}
									render={({ field }) => (
										<FormItem className="">
											<div className="flex relative flex-col gap-2">
												<Label className=" text-primary">
													Password
												</Label>
												<Input
													disabled={loading}
													{...field}
													type={
														!password ? "password"
														:	"text"
													}
													placeholder="Enter your password"
													className=" text-primary  py-[20px] text-[10px] border-t-0 border-l-0 border-r-0 rounded-[10px] outline-0 focus-visible:ring-0 bg-white  border-b-[4px] border-primary"
												/>
												<div
													onClick={handlePassword}
													className=" cursor-pointer"
												>
													{password ?
														<MdOutlineRemoveRedEye className=" absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
													:	<FaRegEyeSlash className="  absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
													}
												</div>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="">
									<FormField
										name="confirmPassword"
										control={ownerForm.control}
										render={({ field }) => (
											<FormItem className="">
												<div className="flex relative flex-col gap-2">
													<Label className=" text-primary">
														Confirm Password
													</Label>
													<Input
														disabled={loading}
														{...field}
														type={
															!password ?
																"password"
															:	"text"
														}
														placeholder="Confirm your password"
														className=" text-primary  py-[20px] text-[10px] border-t-0 border-l-0 border-r-0 rounded-[10px] outline-0 focus-visible:ring-0 bg-white  border-b-[4px] border-primary"
													/>
													<div
														onClick={handlePassword}
														className=" cursor-pointer"
													>
														{password ?
															<MdOutlineRemoveRedEye className=" absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
														:	<FaRegEyeSlash className="  absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
														}
													</div>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>

									<span className=" text-[15px] flex gap-2 text-primary">
										Already have an account?{" "}
										<Link
											className=" underline"
											href={"/sign-in/individual-auth"}
										>
											Login
										</Link>
									</span>
								</div>
							</div>
							<div className=" items-center justify-end w-full flex mt-[20px]">
								<Button
									disabled={loading}
									type="button"
									onClick={() => {
										router.push(
											"/sign-up/workspace-auth?tab=workspace",
										);
									}}
									className="py-[20px] w-full md:w-[40%] rounded-full text-secondary"
								>
									Create Workspace
								</Button>
							</div>
						</form>
					</Form>
				</TabsContent>
				<TabsContent className=" mt-[20px] w-full" value="workspace">
					<Form {...workspaceForm}>
						<form>
							<div className=" flex gap-3 flex-col">
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
											<Label className=" text-primary">
												Slug
											</Label>
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
															workspaceForm.getValues(
																"name",
															);

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
									name="industryType"
									control={workspaceForm.control}
									render={({ field }) => (
										<FormItem className=" flex flex-col gap-2">
											<Label className=" text-primary">
												Industry Type
											</Label>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<SelectTrigger className=" w-full text-primary py-[20px] rounded-[10px]  border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary">
													<SelectValue
														className=""
														placeholder="Select industry type"
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{INDUSTRY_TYPES.map(
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
									name="teamSize"
									control={workspaceForm.control}
									render={({ field }) => (
										<FormItem className=" flex flex-col gap-2">
											<Label className=" text-primary">
												Team Size
											</Label>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<SelectTrigger className=" w-full text-primary py-[20px] rounded-[10px]  border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary">
													<SelectValue
														className=""
														placeholder="Select team size"
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{TEAM_SIZE.map(
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
							</div>
							<div className=" items-center justify-end w-full flex mt-[20px]">
								<Button
									disabled={loading}
									type="button"
									onClick={async () => {
										const userValid =
											await ownerForm.trigger();
										const workspaceValid =
											await workspaceForm.trigger();

										if (!userValid || !workspaceValid)
											return;

										const userData = ownerForm.getValues();
										const workspaceData =
											workspaceForm.getValues();
										handleSubmit({
											userData,
											workspaceData,
										});
									}}
									className="py-[20px] w-full md:w-[40%] rounded-full text-secondary"
								>
									{loading ?
										<div className=" flex items-center gap-3">
											<LoaderCircle className=" animate-spin" />
											Submitting...
										</div>
									:	"Submit"}
								</Button>
							</div>
						</form>
					</Form>
				</TabsContent>
			</Tabs>
		</div>
	);
}
