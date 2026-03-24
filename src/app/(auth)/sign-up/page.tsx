import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

export default function SignUp() {
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
				<p className=" text-center text-[25px]">Create an account</p>
				<p className=" text-center text-[16px]">
					Start a journey of seamless teamwork and collaboration
				</p>
				<div className=" flex-row flex gap-3">
					<Button
						asChild
						className="text-[13px] px-[20px] py-[20px] rounded-full"
						variant={"secondary"}
					>
						<Link href={"/sign-up/workspace-auth"}>Workspace</Link>
					</Button>
					<Button
						asChild
						className=" text-[13px] px-[20px] py-[20px] rounded-full"
						variant={"secondary"}
					>
						<Link href={"/sign-up/individual-auth"}>
							Individual
						</Link>
					</Button>
				</div>
				<Link
					href={"/join-workspace"}
					className=" text-accent flex items-center gap-2 flex-row"
				>
					<p className=" underline">
						Request to join a workspace instead
					</p>
					<HiOutlineArrowNarrowRight />
				</Link>
			</div>
		</div>
	);
}
