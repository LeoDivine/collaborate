import CalendarView from "@/components/pages/calendar/calendar-view";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";
import { getProjectsByWorkspaceId } from "@/lib/services/project.services";
import { getTasksByWorkspaceId } from "@/lib/services/task.services";
import { auth } from "../../../../auth";
import type { MembersUsers, Projects, Tasks as TaskType } from "@/lib/types";

export default async function Calendar(props: {
	searchParams?: Promise<{ month?: string; year?: string }>;
}) {
	const searchParams = await props.searchParams;
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const userId = session?.user?.id;

	const now = new Date();
	const selectedMonth = searchParams?.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
	const selectedYear = searchParams?.year ? parseInt(searchParams.year, 10) : now.getFullYear();

	// Calculate start and end date for the calendar range (with buffer for leading/trailing days)
	const startDate = new Date(selectedYear, selectedMonth - 2, 20);
	const endDate = new Date(selectedYear, selectedMonth + 1, 15);

	const [tasksResponse, projectsResponse, membersResponse] = await Promise.all([
		getTasksByWorkspaceId(workspaceId!),
		getProjectsByWorkspaceId(workspaceId!),
		getMembersByWorkspaceId(1, 1000, workspaceId!),
	]);

	const allTasks: TaskType[] = (tasksResponse.tasks as TaskType[]) || [];
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
				initialMonth={selectedMonth}
				initialYear={selectedYear}
			/>
		</div>
	);
}

