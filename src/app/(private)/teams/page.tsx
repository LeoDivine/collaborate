import TeamsView from "@/components/pages/teams/teams-view";
import { getTeamsByWorkspaceId } from "@/lib/services/team.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function Teams() {
	const session = await auth();
	const user = session?.user;

	if (!user) {
		redirect("/sign-in");
	}

	const workspaceId = user.currentWorkspaceId;

	if (!workspaceId) {
		redirect("/dashboard");
	}

	const [teamsData, projectsData] = await Promise.all([
		getTeamsByWorkspaceId(workspaceId),
		getProjectsByWorkspaceId(workspaceId),
	]);

	const {
		teams = [],
		stats = {
			totalTeams: 0,
			assignedMembersCount: 0,
			unassignedMembersCount: 0,
			totalLeadsCount: 0,
			avgTeamSize: 0,
		},
		unassignedMembers = [],
		allWorkspaceMembers = [],
		currentMemberRole,
		currentMemberId,
	} = teamsData;

	const projects = projectsData?.projects || [];

	return (
		<div>
			<TeamsView
				initialTeams={teams}
				initialStats={stats}
				unassignedMembers={unassignedMembers}
				allWorkspaceMembers={allWorkspaceMembers}
				workspaceId={workspaceId}
				callerRole={currentMemberRole}
				callerMemberId={currentMemberId}
				projects={projects}
			/>
		</div>
	);
}
