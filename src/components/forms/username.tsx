"use client";

import { userNameSchema } from "@/lib/schemas/sign-up";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { AtSign, MoveRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export type UsernameValue = z.infer<typeof userNameSchema>;
export default function UsernameForm() {
	const form = useForm<UsernameValue>({
		defaultValues: {
			username: "",
		},
		resolver: zodResolver(userNameSchema),
		mode: "all",
	});

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
