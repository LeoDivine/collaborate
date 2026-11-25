"use client";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { requestPasswordReset } from "@/lib/services/password-reset.services";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { GoChevronLeft } from "react-icons/go";
import { toast } from "sonner";
import z from "zod";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [sentEmail, setSentEmail] = useState("");
	const router = useRouter();

	const form = useForm<ForgotPasswordValues>({
		defaultValues: {
			email: "",
		},
		resolver: zodResolver(forgotPasswordSchema),
		mode: "all",
	});

	const handleSubmit = async (values: ForgotPasswordValues) => {
		setLoading(true);
		try {
			const res = await requestPasswordReset(values);
			if (!res.success) {
				toast.error(res.message);
			} else {
				setSentEmail(values.email);
				setSubmitted(true);
				toast.success(res.message);
			}
		} catch (e) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<span
				onClick={() => {
					router.push("/sign-in");
				}}
				className="absolute cursor-pointer pt-[20px] left-4 text-primary flex flex-row items-center gap-2"
			>
				<GoChevronLeft />
				<p>Back to Sign In</p>
			</span>
			<div className="px-[10px] flex flex-col items-center h-screen gap-8 justify-center">
				<Image
					className="md:w-[15%] w-[40%] object-cover"
					src={"/resources/dark-logo.png"}
					alt="logo"
					width={1000}
					height={1000}
				/>
				<div className="w-full md:w-fit flex flex-col items-center">
					{submitted ? (
						<div className="w-full md:w-[460px] flex flex-col items-center text-center gap-4 bg-primary p-8 rounded-2xl shadow-md border border-white/10 text-secondary">
							<CheckCircle2 className="size-12 text-[#c5bebe]" />
							<h1 className="text-[24px] font-semibold text-secondary">
								Check your email
							</h1>
							<p className="text-sm text-secondary/80 leading-relaxed">
								We sent a password reset link to{" "}
								<strong className="text-secondary font-semibold">
									{sentEmail}
								</strong>
								. Please check your inbox and follow the instructions to reset your password.
							</p>
							<div className="flex flex-col gap-2 w-full mt-4">
								<Button
									onClick={() => {
										setSubmitted(false);
										form.reset();
									}}
									className="w-full py-[18px] rounded-full bg-secondary text-primary hover:bg-secondary/90 font-medium"
								>
									Send another email
								</Button>
								<Link
									href="/sign-in"
									className="text-sm text-secondary/90 hover:text-secondary underline mt-2 transition-colors"
								>
									Return to sign in
								</Link>
							</div>
						</div>
					) : (
						<>
							<p className="text-center text-[25px] text-primary font-medium">
								Reset your password
							</p>
							<p className="text-center text-xs text-primary/70 mt-1 max-w-[360px]">
								Enter your account email address and we&apos;ll send you a link to reset your password.
							</p>
							<Form {...form}>
								<form
									className="w-full mt-4"
									onSubmit={form.handleSubmit(handleSubmit)}
								>
									<div className="justify-center w-full flex flex-col gap-4">
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<div className="flex relative w-full flex-col gap-2">
														<Label className="text-primary">
															Email Address
														</Label>
														<Input
															{...field}
															disabled={loading}
															placeholder="name@example.com"
															className="text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[12px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
														/>
													</div>
													<FormMessage />
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
													Sending link...
												</div>
											) : (
												"Send Reset Link"
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
						</>
					)}
				</div>
			</div>
		</>
	);
}
