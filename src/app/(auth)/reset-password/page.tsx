"use client";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/services/password-reset.services";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegEyeSlash } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { toast } from "sonner";
import z from "zod";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordFormInner() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const router = useRouter();

	const form = useForm<ResetPasswordValues>({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		resolver: zodResolver(resetPasswordSchema),
		mode: "all",
	});

	if (!token) {
		return (
			<div className="w-full md:w-[460px] flex flex-col items-center text-center gap-4 bg-primary p-8 rounded-2xl shadow-md border border-white/10 text-secondary">
				<h1 className="text-[22px] font-semibold text-secondary">
					Invalid or Missing Token
				</h1>
				<p className="text-sm text-secondary/80">
					This password reset link is invalid or incomplete. Please request a new link.
				</p>
				<Button
					asChild
					className="w-full py-[18px] rounded-full bg-secondary text-primary hover:bg-secondary/90 font-medium mt-2"
				>
					<Link href="/forgot-password">Request New Link</Link>
				</Button>
			</div>
		);
	}

	const handleSubmit = async (values: ResetPasswordValues) => {
		setLoading(true);
		try {
			const res = await resetPassword(token, values);
			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);
				router.push("/sign-in");
			}
		} catch (e) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-[500px] flex flex-col items-center">
			<p className="text-center text-[25px] text-primary font-medium">
				Choose a new password
			</p>
			<p className="text-center text-xs text-primary/70 mt-1 max-w-[360px]">
				Must be at least 8 characters and include uppercase, lowercase, number, and special character.
			</p>

			<Form {...form}>
				<form
					className="w-full max-w-[500px] mt-4"
					onSubmit={form.handleSubmit(handleSubmit)}
				>
					<div className="w-full max-w-[500px] flex flex-col gap-4">
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem className="w-full max-w-[500px]">
									<div className="w-full flex relative flex-col gap-2">
										<Label className="text-primary">
											New Password
										</Label>
										<Input
											{...field}
											disabled={loading}
											type={!showPassword ? "password" : "text"}
											placeholder="Enter your new password"
											className="text-primary w-full py-[20px] rounded-[10px] text-[12px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
										/>
										<div
											onClick={() => setShowPassword(!showPassword)}
											className="cursor-pointer"
										>
											{showPassword ? (
												<MdOutlineRemoveRedEye className="absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
											) : (
												<FaRegEyeSlash className="absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
											)}
										</div>
									</div>
									<FormMessage className="text-xs break-words whitespace-normal leading-snug" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem className="w-full max-w-[500px]">
									<div className="w-full flex relative flex-col gap-2">
										<Label className="text-primary">
											Confirm New Password
										</Label>
										<Input
											{...field}
											disabled={loading}
											type={!showConfirmPassword ? "password" : "text"}
											placeholder="Confirm your new password"
											className="text-primary w-full py-[20px] rounded-[10px] text-[12px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
										/>
										<div
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="cursor-pointer"
										>
											{showConfirmPassword ? (
												<MdOutlineRemoveRedEye className="absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
											) : (
												<FaRegEyeSlash className="absolute right-0 top-1/2 w-[20px] h-[20px] -translate-y-1 mr-[10px] text-primary" />
											)}
										</div>
									</div>
									<FormMessage className="text-xs break-words whitespace-normal leading-snug" />
								</FormItem>
							)}
						/>

						<Button
							disabled={loading}
							type="submit"
							className="w-full py-[20px] rounded-full text-secondary mt-2"
						>
							{loading ? (
								<div className="flex items-center gap-3">
									<LoaderCircle className="animate-spin" />
									Resetting password...
								</div>
							) : (
								"Reset Password"
							)}
						</Button>

						<div className="w-full flex justify-center mt-2">
							<Link
								href="/sign-in"
								className="text-sm underline text-primary"
							>
								Remember your password? Sign in
							</Link>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="px-[10px] flex flex-col items-center h-screen gap-8 justify-center">
			<Image
				className="md:w-[15%] w-[40%] object-cover"
				src={"/resources/dark-logo.png"}
				alt="logo"
				width={1000}
				height={1000}
			/>
			<Suspense
				fallback={
					<div className="flex items-center gap-3 text-primary">
						<LoaderCircle className="animate-spin size-6" />
						Loading...
					</div>
				}
			>
				<ResetPasswordFormInner />
			</Suspense>
		</div>
	);
}
