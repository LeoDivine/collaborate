import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { MdOutlineArrowRightAlt } from "react-icons/md";

export default function SignIn() {
	return (
		<div className=" bg-primary flex justify-center gap-10  flex-col items-center  h-screen w-full">
			<Image
				className=" md:w-[15%] w-[40%] object-cover"
				src={"/resources/logo.png"}
				alt="logo"
				width={"1000"}
				height={"1000"}
			/>
			<div className=" text-secondary gap-2 flex items-center flex-col">
				<p className=" text-center text-[25px]">
					Sign in to your account
				</p>
				<p className=" text-center text-[16px]">
					Sign in to continue from where you stopped
				</p>
				<div className=" flex-row flex gap-3">
					<Button
						asChild
						className="text-[13px] px-[20px] py-[20px] rounded-full"
						variant={"secondary"}
					>
						<Link href={"/sign-in/workspace-auth"}>Workspace</Link>
					</Button>
					<Button
						asChild
						className=" text-[13px] px-[20px] py-[20px] rounded-full"
						variant={"secondary"}
					>
						<Link href={"/sign-in/individual-auth"}>
							Individual
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
