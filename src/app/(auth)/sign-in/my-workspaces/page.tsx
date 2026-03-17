"use client";
import WorkspaceView from "@/components/shared/layout/auth/workspace-view";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WORKSPACE } from "@/lib/const";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoChevronLeft } from "react-icons/go";
import { DeskMode } from "../../../../../generated/prisma/enums";

export default function MyWorkspaces() {
	const router = useRouter();

	const WORKSPACEARRAY = WORKSPACE.filter(
		(i) => i.mode === ("WORKSPACE" as DeskMode),
	);

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
			<div className=" px-[10px]  flex flex-col items-center h-screen gap-10 justify-center">
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
					<div className=" mt-[30px]">
						<p className=" text-primary font-bold">
							Workspace(s) you belong to:
						</p>
						<ScrollArea className="  h-[200px]">
							<div className=" flex flex-col gap-2">
								{WORKSPACEARRAY.map((i) => {
									return (
										<WorkspaceView
											key={i.id}
											id={i.id}
											mode={i.mode as DeskMode}
											title={i.name}
											value={i.value}
										/>
									);
								})}
							</div>
							<ScrollBar />
						</ScrollArea>
						<span className=" text-[15px] mt-[10px] flex gap-2 text-primary">
							Create a different team?
							<Link
								className=" underline"
								href={"/sign-in/individual-auth"}
							>
								Create Workspace
							</Link>
						</span>
					</div>
					<div className=" mt-[100px]">
						<p className=" text-primary font-bold">
							Continue to your personal desk?
						</p>
						<div className=" flex flex-col gap-2">
							<div className=" flex flex-col gap-2">
								{WORKSPACE.filter(
									(i) =>
										i.mode === ("INDIVIDUAL" as DeskMode),
								).map((i) => {
									return (
										<WorkspaceView
											key={i.id}
											id={i.id}
											mode={i.mode as DeskMode}
											title={i.name}
											value={i.value}
										/>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
