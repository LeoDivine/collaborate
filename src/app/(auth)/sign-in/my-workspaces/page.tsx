"use client";
import WorkspaceView from "@/components/shared/layout/auth/workspace-view";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoChevronLeft } from "react-icons/go";

export default function MyWorkspaces() {
	const router = useRouter();

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
				<div className="">
					<p className=" text-center text-[25px] text-primary">
						Welcome back, Divine Onyekachukwu
					</p>
					<div className="">
						<p className=" text-primary font-bold">
							Workspace(s) you belong to:
						</p>
						<div className="">
							<WorkspaceView mode="INDIVIDUAL" />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
