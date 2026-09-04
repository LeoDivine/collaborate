import CalendarView from "@/components/pages/calendar/calendar-view";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { getTasksByWorkspaceId } from "@/lib/services/task.services";
import { auth } from "../../../../auth";
import type { MembersUsers, Projects, Tasks as TaskType } from "@/lib/types";

export default async function Calendar() {
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	const [tasksResponse, projectsResponse, membersResponse] = await Promise.all([
		getTasksByWorkspaceId(workspaceId!),
		getProjectsByWorkspaceId(workspaceId!),
		getMembersByWorkspaceId(1, 50, workspaceId!),
	]);

	const allTasks: TaskType[] = tasksResponse.tasks || [];
	const allProjects: Projects[] = projectsResponse.projects || [];
	const allMembers: MembersUsers[] = membersResponse.members || [];

	const currentMember = allMembers.find((m) => m.userId === userId);

	return (
		<div className="overflow-x-hidden">
			<CalendarView
				tasks={allTasks}
				projects={allProjects}
				members={allMembers}
				workspaceId={workspaceId!}
				currentMemberId={currentMember?.id || ""}
				initialTotal={membersResponse.total || allMembers.length}
			/>
		</div>
	);
}

