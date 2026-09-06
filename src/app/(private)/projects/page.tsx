import ProjectView from "@/components/pages/project/project-view";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { auth } from "../../../../auth";
import type { Projects } from "@/lib/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
export default async function Projects(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const createParam = searchParams.creating;

	const currentState =
		Array.isArray(createParam) ? createParam[0] : createParam || "false";

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	const membersResponse = await getMembersByWorkspaceId(1, 10, workspaceId!);
	const projectsResponse = await getProjectsByWorkspaceId(workspaceId!);
	const allProjects: Projects[] = projectsResponse.projects;
	const allMembers = membersResponse.members || [];
	const currentMember = allMembers.find((m) => m.userId === userId);
	const pageSize = 20;

	return (
		<div>
			<ProjectView
				members={allMembers}
				isCreating={currentState}
				workspaceId={workspaceId!}
				initialTotal={membersResponse.total}
				projects={allProjects}
				projectsTotal={projectsResponse.total}
				currentUserId={userId}
				currentMemberId={currentMember?.id || ""}
				pageSize={pageSize}
			/>
		</div>
	);
}
