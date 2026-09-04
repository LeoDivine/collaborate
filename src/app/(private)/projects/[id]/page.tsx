import React from "react";
import { auth } from "../../../../../auth";
import {
	getProjectById,
	getProjectsByWorkspaceId,
} from "@/lib/services/project.services";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import SingleProjectView from "@/components/pages/project/single-project-view";
import type { MembersUsers, Projects } from "@/lib/types";

export default async function SinglePageView({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;

	const [projectResponse, membersResponse, projectsResponse] =
		await Promise.all([
			getProjectById(id, workspaceId!),
			getMembersByWorkspaceId(1, 100, workspaceId!),
			getProjectsByWorkspaceId(workspaceId!),
		]);

	return (
		<div>
			<SingleProjectView
				project={projectResponse.projectInfo!}
				workspaceId={workspaceId!}
				members={(membersResponse.members || []) as MembersUsers[]}
				initialTotal={membersResponse.total || 0}
				projects={(projectsResponse?.projects || []) as Projects[]}
			/>
		</div>
	);
}

