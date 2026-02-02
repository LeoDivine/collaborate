import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function SideDisplay() {
	return (
		<div className=" text-a px-[40px] py-[20px]  rounded-xl shadow w-[30%] bg-linear-to-br from-[#222222] to-[#383838]">
			<div className=" flex justify-between flex-col items-center h-full">
				<Image
					className=" w-[50%] object-cover"
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
				/>
				<div className="">
					<p className=" text-[30px] font-bold ">
						Create an Individual Account
					</p>
					<p>
						As an individual, create an account to start keeping
						track of tasks you set, monitor your stats.
					</p>
				</div>
				<span className=" text-accent text-[11px] gap-2 flex ">
					<p>Want to create a workspace account instead? </p>
					<Link className=" underline" href={""}>
						Create account
					</Link>
				</span>
			</div>
		</div>
	);
}
