"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { AiOutlineGoogle } from "react-icons/ai";
import { FaRegEyeSlash } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";

export default function IndividualAuth() {
	const [password, setPassword] = useState(false);

	const router = useRouter();

	const handlePassword = () => {
		setPassword(!password);
	};
	return (
		<div className=" h-full  ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" mt-[150px] flex flex-col items-center">
					<p className="text-[25px] text-primary">Create account</p>

					<div className=" mt-[40px] flex flex-col gap-5">
						<div className=" flex flex-col gap-2">
							<Label className=" text-primary">Full Name</Label>
							<Input
								placeholder="Enter your full name"
								className=" text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
						</div>
						<div className=" flex flex-col gap-2">
							<Label className=" text-primary">
								Email Address
							</Label>
							<Input
								placeholder="Enter your email address"
								className=" text-primary w-full md:w-[500px] py-[20px] rounded-[10px] text-[10px] border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
						</div>
						<div className="flex relative flex-col gap-2">
							<Label className=" text-primary">Password</Label>
							<Input
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
				<div className=" flex items-start w-full">
					<span className=" text-primary text-[11px] gap-2 flex ">
						<p>Already have an account? </p>
						<Link className=" underline" href={""}>
							Sign in
						</Link>
					</span>
				</div>
			</div>
		</div>
	);
}
