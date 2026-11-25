import JoinWorkspaceForm from "@/components/forms/join-workspace";
import { Suspense } from "react";
import { auth } from "../../../../auth";

export default async function JoinWorkspace() {
	const session = await auth();
	const user = session?.user;

	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full  flex flex-col items-center">
					<p className="text-[25px] text-primary">Join workspace</p>
					<Suspense fallback={<div className="text-sm text-muted-foreground mt-4">Loading form...</div>}>
						<JoinWorkspaceForm user={user} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
