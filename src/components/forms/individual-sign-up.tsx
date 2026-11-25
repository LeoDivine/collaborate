"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema } from "@/lib/schemas/auth";
import {
	createAccountFromRequest,
	individualSignUp,
} from "@/lib/services/auth.services";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { FaGithub, FaRegEyeSlash } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { toast } from "sonner";
import z from "zod";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";

export type SignUpValues = z.infer<typeof signUpSchema>;
export default function IndividualSignUp() {
	const searchParams = useSearchParams();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const urlFullName = searchParams.get("fullName")?.replace("null", "") || null;
	const urlEmail = searchParams.get("email")?.replace("null", "") || null;
	const urlRequestWorkspaceId = searchParams.get("requestWorkspace");

	// console.log({ urlFullName, urlEmail, urlRequestWorkspaceId });

	const { update } = useSession();

	const form = useForm<SignUpValues>({
		defaultValues: {
			confirmPassword: "",
			email: urlEmail ?? "",
			fullName: urlFullName ?? "",
			password: "",
		},
		resolver: zodResolver(signUpSchema),
		mode: "all",
	});

	const router = useRouter();

	const handleSubmit = async (values: SignUpValues) => {
		setLoading(true);
		let res;
		try {
			if (urlRequestWorkspaceId) {
				toast.info(
					"Signing up to access the workspace you requested to join",
				);
				res = await createAccountFromRequest(
					values,
					urlRequestWorkspaceId,
				);
			} else {
				res = await individualSignUp({
					email: values.email,
					fullName: values.fullName,
					password: values.password,
					confirmPassword: values.confirmPassword,
				});
			}
			if (!res.success) {
				form.reset();
				toast.error(res.message);
			}
			await update({
				currentWorkspaceId: res.workspace?.id,
				currentWorkspaceMode: res.workspace?.mode,
				currentWorkspaceRole: res.member?.role,
				currentWorkspaceName: res.workspace?.name,
				currentMemberId: res.member?.id,
			});
			form.reset();
			router.push("/sign-up/individual-auth/username");
			toast.success(res.message);
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
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className=" w-full md:w-[80%] mt-[40px] flex flex-col gap-5"
			>
				<FormField
					name="fullName"
					control={form.control}
					render={({ field }) => (
						<FormItem className=" flex flex-col gap-2">
							<Label className=" text-primary">Full Name</Label>
							<Input
								disabled={loading || Boolean(urlFullName)}
								{...field}
								placeholder="Enter your full name"
								className=" text-primary py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem className=" flex flex-col gap-2">
							<Label className=" text-primary">
								Email Address
							</Label>
							<Input
								disabled={loading || Boolean(urlEmail)}
								{...field}
								placeholder="Enter your email address"
								className=" text-primary py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="password"
					control={form.control}
					render={({ field }) => (
						<FormItem className="">
							<div className="flex relative flex-col gap-2">
								<Label className=" text-primary">
									Password
								</Label>
								<Input
									disabled={loading}
									{...field}
									type={!showPassword ? "password" : "text"}
									placeholder="Enter your password"
									className=" text-primary  py-[20px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 rounded-[10px] outline-0 focus-visible:ring-0 bg-white  border-b-[4px] border-primary"
								/>
								<div
									onClick={() => setShowPassword(!showPassword)}
									className=" cursor-pointer"
								>
									{showPassword ?
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
						control={form.control}
						render={({ field }) => (
							<FormItem className="">
								<div className="flex relative flex-col gap-2">
									<Label className=" text-primary">
										Confirm Password
									</Label>
									<Input
										disabled={loading}
										{...field}
										type={!showConfirmPassword ? "password" : "text"}
										placeholder="Confirm your password"
										className=" text-primary  py-[20px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 rounded-[10px] outline-0 focus-visible:ring-0 bg-white  border-b-[4px] border-primary"
									/>
									<div
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className=" cursor-pointer"
									>
										{showConfirmPassword ?
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
							href={"/sign-in"}
						>
							Login
						</Link>
					</span>
				</div>

				<div className=" w-full  flex justify-center flex-col md:flex-row gap-3">
					<Button
						disabled={loading}
						type="submit"
						className=" grow  py-[20px] rounded-full text-secondary"
					>
						{loading ?
							<div className=" flex items-center gap-3">
								<LoaderCircle className=" animate-spin" />
								Signing up...
							</div>
						:	"Sign Up"}
					</Button>
					{!urlRequestWorkspaceId && (
						<>
							<Button
								onClick={() => handleOAuthUsage("google")}
								type="button"
								className=" py-[20px] bg-[#575757] hover:bg-[#575757]/90 rounded-full text-secondary flex items-center justify-center gap-2"
							>
								<AiOutlineGoogle className="size-5 mr-1" />
								Sign in with Google
							</Button>
							<Button
								onClick={() => handleOAuthUsage("github")}
								type="button"
								className=" py-[20px] bg-[#24292e] hover:bg-[#24292e]/90 rounded-full text-secondary flex items-center justify-center gap-2"
							>
								<FaGithub className="size-5 mr-1" />
								Sign in with GitHub
							</Button>
						</>
					)}
				</div>
			</form>
		</Form>
	);
}
