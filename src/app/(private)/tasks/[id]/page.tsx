import React from "react";
import { auth } from "../../../../../auth";
import { getTaskById } from "@/lib/services/task.services";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import SingleTaskView from "@/components/pages/tasks/single-task-view";
import type { MembersUsers, Tasks } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function SingleTaskPageRoute({
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

	const [taskResponse, membersResponse] = await Promise.all([
		getTaskById(id),
		getMembersByWorkspaceId(1, 50, workspaceId),
	]);

	if (!taskResponse.success || !taskResponse.task) {
		redirect("/tasks");
	}

	return (
		<SingleTaskView
			task={taskResponse.task as unknown as Tasks}
			workspaceId={workspaceId}
			currentUserId={currentUserId}
			members={(membersResponse.members || []) as MembersUsers[]}
		/>
	);
}
