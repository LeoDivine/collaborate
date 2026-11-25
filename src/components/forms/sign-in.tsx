"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { FaGithub, FaRegEyeSlash } from "react-icons/fa";
import { GoChevronLeft } from "react-icons/go";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import z from "zod";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { LoaderCircle } from "lucide-react";
import { login } from "@/lib/services/auth.services";
import { toast } from "sonner";
import { signIn, useSession } from "next-auth/react";
import { DeskMode, WorkspaceRoles } from "../../../generated/prisma/enums";
import { getWorkspaceBByID } from "@/lib/services/workspace.services";
import { createMemberForWorkspace } from "@/lib/services/member.services";

export type SignInValues = z.infer<typeof signInSchema>;
export default function SignInForm() {
	const [loading, setLoading] = useState(false);
	const [password, setPassword] = useState(false);

	const searchParams = useSearchParams();
	const urlFullName = searchParams.get("fullName")?.replace("null", "");
	const urlEmail = searchParams.get("email")?.replace("null", "");
	const urlRequestWorkspaceId = searchParams
		.get("requestWorkspace")
		?.replace("null", "");
	const { update } = useSession();

	const form = useForm<SignInValues>({
		defaultValues: {
			identifier: urlEmail ?? "",
			password: "",
		},
		resolver: zodResolver(signInSchema),
		mode: "all",
	});

	const router = useRouter();

	const handlePassword = () => {
		setPassword(!password);
	};

	const handleSubmit = async (values: SignInValues) => {
		setLoading(true);
		try {
			const res = await login(values);
			if (!res.success) {
				toast.error(res.message);
				form.reset();
			} else {
				if (urlRequestWorkspaceId) {
					const memberRes = await createMemberForWorkspace(
						res.user?.id!,
						urlRequestWorkspaceId,
					);
					if (!memberRes.success && (memberRes as any).isDeactivated) {
						toast.error(memberRes.message);
						router.push("/sign-in/my-workspaces");
						return;
					}
					toast.info(
						"Signing in to access the workspace you requested to join",
					);
					const workspace = await getWorkspaceBByID(
						urlRequestWorkspaceId,
					);
					await update({
						currentWorkspaceId: urlRequestWorkspaceId,
						currentWorkspaceMode: workspace?.mode,
						currentWorkspaceRole: "MEMBER" as WorkspaceRoles,
						currentWorkspaceName: workspace?.name,
						currentMemberId: memberRes.member?.id,
					});
				} else {
					toast.success(res.message);
					router.push("/sign-in/my-workspaces");
				}
			}
		} catch (e: any) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleOAuthUsage = (provider: "google" | "github") => {
		try {
			signIn(provider, {
				redirectTo: "/sign-in/my-workspaces",
			});
		} catch (e) {
			toast.error("Something went wrong");
		}
	};

	return (
		<>
			<span
				onClick={() => {
					router.back();
				}}
				className="absolute cursor-pointer top-6 left-6 text-primary flex flex-row items-center gap-2"
			>
				<GoChevronLeft />
				<p>Go Back</p>
			</span>
			<div className="px-4 sm:px-6 flex flex-col items-center min-h-screen py-12 gap-8 sm:gap-10 justify-center overflow-y-auto">
				<Image
					className="md:w-[15%] w-[40%] object-cover"
					src={"/resources/dark-logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
				/>
				<div className="w-full max-w-[500px] flex flex-col items-center">
					<p className="text-center text-[25px] text-primary">
						Enter your email or username to sign in
					</p>
					<Form {...form}>
						<form
							className="w-full"
							onSubmit={form.handleSubmit(handleSubmit)}
						>
							<div className="justify-center mt-[10px] w-full flex flex-col gap-3">
								<FormField
									control={form.control}
									name="identifier"
									render={({ field }) => (
										<FormItem>
											<div className="flex w-full flex-col gap-2">
												<Label className="text-primary">
													Email Address / Username
												</Label>
												<Input
													{...field}
													disabled={loading}
													placeholder="Email address or username"
													className="text-primary w-full py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
												/>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<div className="w-full flex flex-col gap-2">
												<div className="flex justify-between items-center">
													<Label className="text-primary">
														Password
													</Label>
													<Link
														href={"/forgot-password"}
														className="text-sm underline text-primary"
													>
														Reset Password
													</Link>
												</div>
												<div className="relative w-full">
													<Input
														{...field}
														disabled={loading}
														type={
															!password ? "password"
															:	"text"
														}
														placeholder="Enter your password"
														className="text-primary w-full py-[20px] pr-10 rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
													/>
													<button
														type="button"
														onClick={handlePassword}
														className="absolute right-3 top-1/2 -translate-y-1/2 text-primary cursor-pointer focus:outline-none"
														aria-label={
															password ?
																"Hide password"
															:	"Show password"
														}
													>
														{password ?
															<MdOutlineRemoveRedEye className="w-5 h-5" />
														:	<FaRegEyeSlash className="w-5 h-5" />}
													</button>
												</div>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="w-full flex flex-row justify-start items-start">
									<span className="text-[15px] flex gap-2 text-primary">
										Don't have an account?
										<Link
											className="underline"
											href={"/sign-up"}
										>
											Create account
										</Link>
									</span>
								</div>

								<div className="w-full flex flex-col gap-3 mt-1">
									<Button
										disabled={loading}
										type="submit"
										className="w-full py-[20px] rounded-full text-secondary"
									>
										{loading ?
											<div className="flex items-center gap-3">
												<LoaderCircle className="animate-spin" />
												Signing in...
											</div>
										:	"Sign In"}
									</Button>
									{!urlRequestWorkspaceId && (
										<>
											<div className="relative flex items-center justify-center my-1 w-full">
												<div className="border-t border-primary/20 w-full" />
												<span className="bg-background px-3 text-xs text-primary/70 uppercase absolute">
													or
												</span>
											</div>
											<div className="w-full flex flex-col sm:flex-row gap-3">
												<Button
													onClick={() =>
														handleOAuthUsage("google")
													}
													type="button"
													className="flex-1 py-[20px] bg-[#575757] hover:bg-[#575757]/90 rounded-full text-secondary flex items-center justify-center gap-2"
												>
													<AiOutlineGoogle className="size-5 mr-1" />
													Sign in with Google
												</Button>
												<Button
													onClick={() =>
														handleOAuthUsage("github")
													}
													type="button"
													className="flex-1 py-[20px] bg-[#24292e] hover:bg-[#24292e]/90 rounded-full text-secondary flex items-center justify-center gap-2"
												>
													<FaGithub className="size-5 mr-1" />
													Sign in with GitHub
												</Button>
											</div>
										</>
									)}
								</div>
							</div>
						</form>
					</Form>
				</div>
			</div>
		</>
	);
}
