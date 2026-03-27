import JoinWorkspaceForm from "@/components/forms/join-workspace";
import React from "react";
import { auth } from "../../../../auth";

export default async function JoinWorkspace() {
	const session = await auth();
	const user = session?.user;
	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full  flex flex-col items-center">
					<p className="text-[25px] text-primary">Join workspace</p>
					<JoinWorkspaceForm user={user} />
				</div>
			</div>
		</div>
	);
}
