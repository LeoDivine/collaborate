import React from "react";
import { auth } from "../../../../../auth";
import { getTeamById } from "@/lib/services/team.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import SingleTeamView from "@/components/pages/teams/single-team-view";
import { redirect } from "next/navigation";
import type { MembersUsers, Projects } from "@/lib/types";

export default async function SingleTeamPageRoute({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const currentUserId = session?.user?.id;

	if (!workspaceId) {
		redirect("/sign-in");
	}

	const [teamResponse, membersResponse, projectsResponse] = await Promise.all([
		getTeamById(id, workspaceId),
		getMembersByWorkspaceId(1, 100, workspaceId),
		getProjectsByWorkspaceId(workspaceId),
	]);

	if (!teamResponse.success || !teamResponse.team) {
		redirect("/teams");
	}

	return (
		<SingleTeamView
			team={teamResponse.team}
			workspaceId={workspaceId}
			currentUserId={currentUserId}
			currentMemberRole={teamResponse.currentMemberRole}
			currentMemberId={teamResponse.currentMemberId}
			members={(membersResponse.members || []) as MembersUsers[]}
			projects={(projectsResponse?.projects || []) as Projects[]}
		/>
	);
}
