"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";
import { AiOutlineGoogle } from "react-icons/ai";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegEyeSlash } from "react-icons/fa";
import { GoChevronLeft } from "react-icons/go";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function IndividualAuth() {
	const [password, setPassword] = useState(false);

	const router = useRouter();

	const handlePassword = () => {
		setPassword(!password);
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
					<div className="  mt-[10px] items-center w-full flex flex-col gap-3">
						<div className="flex relative flex-col gap-2">
							<Label className=" text-primary">
								Email Address
							</Label>
							<Input
								placeholder="Enter your email address"
								className=" text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
						</div>
						<div className="w-full flex relative flex-col gap-2 ">
							<Label className=" text-primary">Password</Label>
							<Input
								type={!password ? "password" : "text"}
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
							<Button className=" grow  py-[20px] rounded-full text-secondary">
								Sign in
							</Button>
							<Button className=" py-[20px] bg-accent rounded-full text-secondary">
								<AiOutlineGoogle className=" w-60 h-60" />
								Sign in with Google
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
