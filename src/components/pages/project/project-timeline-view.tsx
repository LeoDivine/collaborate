import { ProjectWithMembers } from "@/lib/types";
import AssigneeOverview from "./assignee-overview";

interface ProjectTimelineViewProps {
	projects: ProjectWithMembers[];
	formatDate: (value: Date | string | null) => string;
}

export default function ProjectTimelineView({
	projects,
	formatDate,
}: ProjectTimelineViewProps) {
	return (
		<div className=" rounded-[15px] bg-primary p-4 flex flex-col gap-4">
			{projects.length === 0 && (
				<p className=" text-center text-sm text-muted-foreground">
					No projects found.
				</p>
			)}
			{projects.map((project) => (
				<div
					key={project.id}
					className=" flex flex-col gap-2 rounded-[12px] bg-secondary p-3"
				>
					<div className=" flex items-center justify-between">
						<p className=" font-semibold text-primary">
							{project.title}
						</p>
						<p className=" text-xs text-muted-foreground">
							{formatDate(project.startPeriod)} -{" "}
							{formatDate(project.endPeriod)}
						</p>
					</div>
					<AssigneeOverview projectMembers={project.projectMembers} />
				</div>
			))}
		</div>
	);
}
