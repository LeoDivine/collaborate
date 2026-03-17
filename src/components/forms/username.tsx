"use client";

import { userNameSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, LoaderCircle, MoveRight } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "../ui/button";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useSession } from "next-auth/react";
import { updateUserName } from "@/lib/services/auth.services";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { User } from "../../../generated/prisma/client";
import { ExtendedUser } from "@/lib/types";

export type UsernameValue = z.infer<typeof userNameSchema>;

export default function UsernameForm({
	user,
}: {
	user: ExtendedUser | undefined;
}) {
	const [loading, setLoading] = useState(false);
	const { update } = useSession();

	const router = useRouter();
	// if (!user) {
	// 	router.push("/individual-auth");
	// }

	const form = useForm<UsernameValue>({
		defaultValues: {
			username: "",
		},
		resolver: zodResolver(userNameSchema),
		mode: "all",
	});

	const handleSubmit = async (value: UsernameValue) => {
		setLoading(true);
		try {
			const res = await updateUserName(value.username, user?.id!);
			console.log({ res });
			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);
				router.push("/dashboard");
				await update({
					userName: value.username,
				});
			}
		} catch (e: any) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className=" w-full md:w-[80%] mt-[40px] flex flex-col gap-5"
			>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => {
						return (
							<FormItem>
								<Label className=" text-primary">
									Username
								</Label>
								<div className=" relative">
									<Input
										{...field}
										maxLength={20}
										disabled={loading}
										placeholder="john_doe"
										className=" lowercase px-[60px]  text-primary py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
									/>
									<AtSign className=" absolute -translate-y-1/2 top-1/2 ml-[20px] text-primary" />
								</div>
								<FormMessage />
							</FormItem>
						);
					}}
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
				<div className="">
					<Button
						type="submit"
						disabled={loading}
						className=" w-full py-[20px] rounded-full text-secondary"
					>
						{loading ?
							<div className="flex items-center gap-3">
								<LoaderCircle className=" animate-spin" />
								Submitting
							</div>
						:	<div className=" flex items-center gap-3">
								Submit Username
								<MoveRight />
							</div>
						}
					</Button>
				</div>
			</form>
		</Form>
	);
}
