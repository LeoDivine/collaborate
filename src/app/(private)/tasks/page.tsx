import TaskView from "@/components/pages/tasks/task-view";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { getTasksByWorkspaceId } from "@/lib/services/task.services";
import { auth } from "../../../../auth";
import type { Projects, Tasks as TaskType } from "@/lib/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function Tasks(props: { searchParams: SearchParams }) {
	return TasksContent(props);
}

async function TasksContent(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const createParam = searchParams.creating;
	const startDateParam = searchParams.startDate;
	const projectParam = searchParams.projectId;

	const currentState =
		Array.isArray(createParam) ? createParam[0] : createParam || "false";
	const initialStartDate =
		Array.isArray(startDateParam) ? startDateParam[0] : startDateParam;
	const initialProjectId =
		Array.isArray(projectParam) ? projectParam[0] : projectParam;

	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	const membersResponse = await getMembersByWorkspaceId(
		1,
		10,
		workspaceId!,
	);
	const projectsResponse = await getProjectsByWorkspaceId(workspaceId!);
	const tasksResponse = await getTasksByWorkspaceId(workspaceId!);

	const allMembers = membersResponse.members || [];
	const allProjects: Projects[] = projectsResponse.projects || [];
	const allTasks: TaskType[] = tasksResponse.tasks || [];

	const currentMember = allMembers.find((m) => m.userId === userId);
	const pageSize = 20;

	return (
		<div>
			<TaskView
				isCreating={currentState}
				initialStartDate={initialStartDate}
				defaultProjectId={initialProjectId}
				members={allMembers}
				projects={allProjects}
				tasks={allTasks}
				workspaceId={workspaceId!}
				currentUserId={userId}
				currentMemberId={currentMember?.id || ""}
				tasksTotal={tasksResponse.total || allTasks.length}
				initialTotal={membersResponse.total || allMembers.length}
				pageSize={pageSize}
			/>
		</div>
	);
}
