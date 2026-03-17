"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { FaRegEyeSlash } from "react-icons/fa";
import { GoChevronLeft } from "react-icons/go";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import z from "zod";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { LoaderCircle } from "lucide-react";
import { login } from "@/lib/services/auth.services";
import { toast } from "sonner";

export type SignInValues = z.infer<typeof signInSchema>;
export default function SignInForm() {
	const [loading, setLoading] = useState(false);
	const [password, setPassword] = useState(false);

	const form = useForm<SignInValues>({
		defaultValues: {
			email: "",
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
			}
			toast.success(res.message);
			router.push("/sign-in/my-workspaces");
		} catch (e: any) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<span
				onClick={() => {
					router.back();
				}}
				className=" absolute cursor-pointer pt-[20px] left-2 text-primary flex flex-row items-center gap-2 "
			>
				<GoChevronLeft />
				<p>Go Back</p>
			</span>
			<div className=" px-[10px] flex flex-col items-center h-screen gap-10 justify-center">
				<Image
					className=" md:w-[15%] w-[40%] object-cover"
					src={"/resources/dark-logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
				/>
				<div className=" w-full md:w-fit flex flex-col items-center ">
					<p className=" text-center text-[25px] text-primary">
						Enter your email to sign in
					</p>
					<Form {...form}>
						<form
							className="  w-full"
							onSubmit={form.handleSubmit(handleSubmit)}
						>
							<div className="  justify-center  mt-[10px]  w-full flex flex-col gap-3">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<div className="flex relative w-full flex-col gap-2">
												<Label className=" text-primary">
													Email Address
												</Label>
												<Input
													{...field}
													disabled={loading}
													placeholder="Enter your email address"
													className=" text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
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
											<div className="w-full flex relative flex-col gap-2 ">
												<Label className=" text-primary">
													Password
												</Label>
												<Input
													{...field}
													disabled={loading}
													type={
														!password ? "password"
														:	"text"
													}
													placeholder="Enter your password"
													className="text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
												/>
												<div
													onClick={handlePassword}
													className=" cursor-pointer"
												>
													{password ?
														<MdOutlineRemoveRedEye className=" absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
													:	<FaRegEyeSlash className=" absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
													}
												</div>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="  w-full flex flex-row justify-start items-start">
									<span className=" text-[15px] flex gap-2 text-primary">
										Forgot Password?
										<Link
											className=" underline"
											href={"/sign-in/individual-auth"}
										>
											Reset Password
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
												Signing in...
											</div>
										:	"Sign In"}
									</Button>
									<Button className="  py-[20px] bg-accent rounded-full text-secondary">
										<AiOutlineGoogle className=" w-60 h-60" />
										Sign in with Google
									</Button>
								</div>
							</div>
						</form>
					</Form>
				</div>
			</div>
		</>
	);
}
