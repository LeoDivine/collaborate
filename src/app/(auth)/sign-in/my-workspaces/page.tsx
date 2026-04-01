import BackButton from "@/components/shared/back-button";
import WorkspaceView from "@/components/shared/layout/auth/workspace-view";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMembersByUserID } from "@/lib/services/member.services";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { DeskMode } from "../../../../../generated/prisma/client";

export default async function MyWorkspaces() {
	const session = await auth();
	const user = session?.user;

	const { members } = await getMembersByUserID(user?.id!);

	const WORKSPACES = members.filter((i) => i.workspace.mode === "WORKSPACE");
	const INDIVIDUALS = members.filter(
		(i) => i.workspace.mode === "INDIVIDUAL",
	);

	// console.log({ user });

	// if (!user) {
	// 	redirect("/sign-in");
	// }

	// console.log({ WORKSPACES, INDIVIDUALS });

	return (
		<>
			<BackButton />
			<div className=" px-[10px]  flex flex-col items-center h-screen gap-10 justify-center">
				<Image
					className=" md:w-[15%] w-[40%] object-cover"
					src={"/resources/dark-logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
				/>
				<div className=" w-full md:w-[40%]">
					<p className=" text-center text-[25px] text-primary">
						Welcome back, {user?.fullName}
					</p>
					<div className=" w-full mt-[30px]">
						<p className=" text-primary font-bold">
							Workspace(s) you belong to:
						</p>
						<ScrollArea
							className={`${WORKSPACES.length >= 3 ? "h-[200px]" : " h-full"}`}
						>
							<div className="  flex flex-col gap-2">
								{WORKSPACES.map((i) => {
									return (
										<WorkspaceView
											role={i.role}
											key={i.id}
											workspaceId={i.workspace.id}
											mode={i.workspace.mode as DeskMode}
											title={i.workspace.name}
											// value={i.value}
										/>
									);
								})}
							</div>
							<ScrollBar orientation="vertical" />
						</ScrollArea>
						<span className=" text-[15px] mt-[10px] flex gap-2 text-primary">
							Create a different team?
							<Link
								className=" underline"
								href={"/create-workspace"}
							>
								Create Workspace
							</Link>
						</span>
					</div>
					<div className=" mt-[100px]">
						<p className=" text-primary font-bold">
							Continue to your personal desk?
						</p>
						{INDIVIDUALS.length === 0 ?
							<Link href={"/create-workspace"} className=" ">
								<div className=" flex items-center justify-center gap-4 bg-transparent  px-[20px] rounded-[20px] py-[20px]  text-accent border-accent border-2 w-full ">
									<Plus />
									<p>Create a personal desk</p>
								</div>
							</Link>
						:	<div className=" flex flex-col gap-2">
								<div className=" flex flex-col gap-2">
									{INDIVIDUALS.filter(
										(i) =>
											i.workspace.mode ===
											("INDIVIDUAL" as DeskMode),
									).map((i) => {
										return (
											<WorkspaceView
												role={i.role}
												key={i.id}
												workspaceId={i.workspace.id}
												mode={
													i.workspace.mode as DeskMode
												}
												title={i.workspace.name}
											/>
										);
									})}
								</div>
							</div>
						}
					</div>
				</div>
			</div>
		</>
	);
}
