"use client";

import { userNameSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, MoveRight } from "lucide-react";
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

export type UsernameValue = z.infer<typeof userNameSchema>;

export default function UsernameForm() {
	const [loading, setLoading] = useState(false);
	const { update, data } = useSession();
	const user = data?.user;

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
		try {
			const res = await updateUserName(user?.id!, value.username);
			if (!res.success) {
				toast.error(res.message);
				form.reset();
			} else {
				toast.success(res.message);
			}
		} catch (e: any) {
		} finally {
		}

		await update({
			userName: value.username,
		});
	};

	return (
		<Form {...form}>
			<form className=" w-full md:w-[80%] mt-[40px] flex flex-col gap-5">
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
					<Button className=" w-full py-[20px] rounded-full text-secondary">
						Submit Username
						<MoveRight />
					</Button>
				</div>
			</form>
		</Form>
	);
}
