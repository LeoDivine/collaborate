"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema } from "@/lib/schemas/auth";
import { individualSignUp } from "@/lib/services/auth.services";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { FaRegEyeSlash } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { toast } from "sonner";
import z from "zod";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";

export type SignUpValues = z.infer<typeof signUpSchema>;
export default function IndividualSignUp() {
	const [password, setPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const { update } = useSession();

	const form = useForm<SignUpValues>({
		defaultValues: {
			confirmPassword: "",
			email: "",
			fullName: "",
			password: "",
		},
		resolver: zodResolver(signUpSchema),
		mode: "all",
	});

	const router = useRouter();

	const handlePassword = () => {
		setPassword(!password);
	};

	const handleSubmit = async (values: SignUpValues) => {
		setLoading(true);
		try {
			const res = await individualSignUp({
				email: values.email,
				fullName: values.fullName,
				password: values.password,
				confirmPassword: values.confirmPassword,
			});
			if (!res.success) {
				form.reset();
				toast.error(res.message);
			}
			await update({
				currentWorkspaceId: res.workspace?.id,
				currentWorkspaceMode: res.workspace?.mode,
				currentWorkspaceRole: res.member?.role,
				currentWorkspaceName: res.workspace?.name,
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
					control={form.control}
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
									type={!password ? "password" : "text"}
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
										type={!password ? "password" : "text"}
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
					<Button
						onClick={() => handleOAuthUsage("google")}
						type="button"
						className=" py-[20px] bg-accent rounded-full text-secondary"
					>
						<AiOutlineGoogle className=" w-60 h-60" />
						Sign in with Google
					</Button>
				</div>
			</form>
		</Form>
	);
}
