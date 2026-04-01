import ProtectedNavbar from "@/components/shared/layout/private/protected-navbar";
import ProtectedSidebar from "@/components/shared/layout/private/protected-sidebar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMembersByUserID } from "@/lib/services/member.services";
import NextTopLoader from "nextjs-toploader";
import React from "react";
import { auth } from "../../../auth";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const user = session?.user;

	const { members } = await getMembersByUserID(user?.id!);

	// console.log({ members });
	return (
		<div className=" h-screen w-full flex">
			<NextTopLoader color="#222222" showSpinner={false} />
			<div className=" flex items-center md:w-[20%]  h-screen md:mx-[20px] ">
				<ProtectedSidebar user={user!} />
			</div>
			<div className=" overflow-y-clip w-full">
				<div className=" md:flex md:w-full w-[96%] mx-auto md:justify-center mt-[10px]">
					<ProtectedNavbar
						user={{
							email: user?.email ?? "",
							fullName: user?.fullName ?? "",
							id: user?.id ?? "",
							userName: user?.userName ?? "",
							currentWorkspaceId: user?.currentWorkspaceId,
							currentWorkspaceMode: user?.currentWorkspaceMode,
							currentWorkspaceRole: user?.currentWorkspaceRole,
							currentWorkspaceName: user?.currentWorkspaceName,
						}}
						workspaces={members}
					/>
				</div>
				<ScrollArea className="  h-screen px-[10px]   py-[10px] md:py-[15px]">
					<div className="  h-screen  ">{children}</div>
					<ScrollBar orientation="vertical" />
				</ScrollArea>
			</div>
		</div>
	);
}
