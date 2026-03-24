import SideDisplay from "@/components/shared/layout/auth/side-display";
import Image from "next/image";
import Link from "next/link";

export default function WorkspaceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className={` px-[20px] py-[20px] h-screen gap-5   flex w-full`}>
			<div className=" text-a px-[40px] py-[20px] hidden md:inline  rounded-xl shadow w-[30%] bg-linear-to-br from-[#222222] to-[#383838]">
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
							Create Your Workspace
						</p>
						<p>
							Create your desk, either an individual workspace for
							just you or a shared workspace for you and your team
							members
						</p>
					</div>
					<span className=" text-accent text-[11px] gap-2 flex ">
						<p>Want to create an individual account instead? </p>
						<Link className=" underline" href={""}>
							Create account
						</Link>
					</span>
				</div>
			</div>
			<div className=" grow flex  items-center ">{children}</div>
		</div>
	);
}
