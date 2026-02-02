"use client";

import { Button } from "@/components/ui/button";
import { NAVLINKS } from "@/lib/const";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HiOutlineBars4 } from "react-icons/hi2";
import { TfiClose } from "react-icons/tfi";

export default function PublicNavbar() {
	const [openNav, setOpenNav] = useState(false);

	const pathName = usePathname();

	const handleOpenNav = () => {
		setOpenNav(!openNav);
	};

	return (
		<div>
			<div className=" hidden w-full text-[13px]  items-center justify-between md:flex flex-row px-[20px] pt-[20px] fixed bg-transparent">
				<Image
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className=" w-[12%]"
				/>

				<div className=" gap-9 items-center flex flex-row">
					{NAVLINKS.map((item, k) => {
						return (
							<div
								key={k}
								className={` ${pathName.startsWith(item.link) ? " text-secondary " : " text-[#646464]"}  `}
							>
								<Link href={item.link}>{item.name}</Link>
							</div>
						);
					})}
					<div className="  flex gap-3 flex-row">
						<Button
							asChild
							className="text-[13px] shadow rounded-full"
							variant={"secondary"}
						>
							<Link href={"/sign-up"}>Get started</Link>
						</Button>
						<Button
							className="text-[13px] rounded-full"
							variant={"secondary"}
						>
							<Link href={"/sign-in"}>Sign In</Link>
						</Button>
					</div>
				</div>
			</div>
			<div
				className={`w-full text-[13px] md:hidden  items-center justify-between flex flex-row px-[20px] pt-[20px] fixed bg-transparent`}
			>
				<Image
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className=" w-[30%]"
				/>
				<div className="">
					<div onClick={handleOpenNav} className="">
						{openNav ?
							<TfiClose className=" text-secondary w-[30px] h-[30px]" />
						:	<HiOutlineBars4 className=" text-secondary w-[30px] h-[30px]" />
						}
					</div>
					{openNav && (
						<div
							className={`px-[20px]  pt-[15px] mt-[20px]  absolute left-0 h-screen w-full  bg-linear-to-br from-[#222222] to-[#383838]`}
						>
							<div className=" flex mt-[10px] flex-col gap-6 text-[20px]">
								{NAVLINKS.map((item, k) => {
									return (
										<div
											key={k}
											className={` ${pathName.startsWith(item.link) ? " text-secondary " : " text-[#646464]"}  `}
										>
											<Link href={item.link}>
												{item.name}
											</Link>
										</div>
									);
								})}
								<div className=" w-full  flex gap-5 flex-col">
									<Button
										asChild
										className="text-[13px] py-[20px] shadow rounded-full"
										variant={"secondary"}
									>
										<Link href={"/sign-up"}>
											Get started
										</Link>
									</Button>
									<Button
										asChild
										className="text-[13px] py-[20px] rounded-full"
										variant={"secondary"}
									>
										<Link href={"/sign-in"}>Sign In</Link>
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
