import React from "react";
import { auth } from "../../../../../auth";
import { getProjectById } from "@/lib/services/project.services";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import SingleProjectView from "@/components/pages/project/single-project-view";
import type { MembersUsers } from "@/lib/types";

export default async function SinglePageView({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;

	const [projectResponse, membersResponse] = await Promise.all([
		getProjectById(id, workspaceId!),
		getMembersByWorkspaceId(1, 10, workspaceId!),
	]);

	return (
		<div>
			<SingleProjectView
				project={projectResponse.projectInfo!}
				workspaceId={workspaceId!}
				members={(membersResponse.members || []) as MembersUsers[]}
				initialTotal={membersResponse.total || 0}
			/>
		</div>
	);
}

