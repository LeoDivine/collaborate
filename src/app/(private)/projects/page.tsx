import ProjectView from "@/components/pages/project/project-view";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { auth } from "../../../../auth";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
export default async function Projects(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const createParam = searchParams.creating;

	const currentState =
		Array.isArray(createParam) ? createParam[0] : createParam || "false";

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;

	const membersResponse = await getMembersByWorkspaceId(1, 10, workspaceId!);
	const projectsResponse = await getProjectsByWorkspaceId(workspaceId!);
	return (
		<div>
			<ProjectView
				members={membersResponse.members}
				isCreating={currentState}
				workspaceId={workspaceId!}
				initialTotal={membersResponse.total}
				projects={projectsResponse.projects}
				projectsTotal={projectsResponse.total}
			/>
		</div>
	);
}
