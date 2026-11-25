import InviteCodesView from "@/components/pages/invite-codes/invite-codes-view";
import { getWorkspaceInviteCodes } from "@/lib/services/invite.services";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function InviteCodes() {
	const session = await auth();
	const user = session?.user;

	if (!user) {
		redirect("/sign-in");
	}

	const workspaceId = user.currentWorkspaceId;

	if (!workspaceId) {
		redirect("/dashboard");
	}

	const { inviteCodes = [], existingMemberEmails = [] } =
		await getWorkspaceInviteCodes(workspaceId);

	return (
		<div>
			<InviteCodesView
				inviteCodes={inviteCodes as any}
				existingMemberEmails={existingMemberEmails}
				workspaceId={workspaceId}
				workspaceName={user.currentWorkspaceName}
			/>
		</div>
	);
}
