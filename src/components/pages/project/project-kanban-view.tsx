import { Progress } from "@/components/ui/progress";
import { ProjectWithMembers } from "@/lib/types";
import AssigneeOverview from "./assignee-overview";

interface ProjectKanbanViewProps {
	projects: ProjectWithMembers[];
	statusLabels: Record<string, string>;
	getTaskProgress: (project: ProjectWithMembers) => number;
	formatDate: (value: Date | string | null) => string;
}

export default function ProjectKanbanView({
	projects,
	statusLabels,
	getTaskProgress,
	formatDate,
}: ProjectKanbanViewProps) {
	const statuses = Object.keys(statusLabels);

	return (
		<div className=" grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{statuses.map((status) => {
				const items = projects.filter(
					(project) => project.status === status,
				);
				return (
					<div
						key={status}
						className=" rounded-[15px] bg-primary p-4 flex flex-col gap-3"
					>
						<p className=" text-sm font-semibold text-accent">
							{statusLabels[status]}
						</p>
						{items.length === 0 && (
							<p className=" text-sm text-muted-foreground">
								No projects
							</p>
						)}
						{items.map((project) => {
							const progressValue = getTaskProgress(project);
							return (
								<div
									key={project.id}
									className=" rounded-[12px] bg-secondary p-3 flex flex-col gap-2"
								>
									<p className=" font-semibold text-primary">
										{project.title}
									</p>
									<p className=" text-xs text-muted-foreground">
										Due: {formatDate(project.endPeriod)}
									</p>
									<AssigneeOverview
										projectMembers={project.projectMembers}
									/>
									<div className=" flex items-center gap-2">
										<Progress
											className=" w-full bg-primary"
											indicatorClassName=" bg-accent"
											value={progressValue}
										/>
										<p className=" text-xs">
											{progressValue}%
										</p>
									</div>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
