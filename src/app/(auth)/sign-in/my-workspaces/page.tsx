import BackButton from "@/components/shared/back-button";
import WorkspaceList, {
	WorkspaceMemberItem,
} from "@/components/shared/layout/auth/workspace-list";
import { getMembersByUserID } from "@/lib/services/member.services";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";

export default async function MyWorkspaces() {
	const session = await auth();
	const user = session?.user;

	if (!user) {
		redirect("/sign-in");
	}

	const { members } = await getMembersByUserID(user.id!);

	return (
		<>
			<BackButton />
			<div className="px-4 py-8 sm:py-12 flex flex-col items-center min-h-screen gap-6 justify-center">
				<Image
					className="w-[120px] sm:w-[140px] object-contain"
					src={"/resources/dark-logo.png"}
					alt="logo"
					width={1000}
					height={1000}
					priority
				/>
				<div className="w-full max-w-[500px] flex flex-col items-center">
					<div className="text-center mb-6">
						<h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
							Welcome back, {user?.fullName}
						</h1>
						<p className="text-sm text-primary/70 mt-1">
							Select a workspace to continue
						</p>
					</div>

					<WorkspaceList
						members={(members as unknown as WorkspaceMemberItem[]) ?? []}
					/>
				</div>
			</div>
		</>
	);
}
