import CreateWorkspaceForm from "@/components/forms/create-workspace";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";

export default async function CreateWorkspace() {
	const session = await auth();
	// console.log({ session });
	const user = session?.user;

	if (!session) {
		redirect("sign-up");
	}

	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full  flex flex-col items-center">
					<p className="text-[25px] text-primary">Create workspace</p>
					<CreateWorkspaceForm {...user!} />
				</div>
			</div>
		</div>
	);
}
