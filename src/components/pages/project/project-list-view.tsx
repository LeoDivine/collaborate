import { Progress } from "@/components/ui/progress";
import { ProjectWithMembers } from "@/lib/types";
import { Ellipsis } from "lucide-react";
import AssigneeOverview from "./assignee-overview";

interface ProjectListViewProps {
	projects: ProjectWithMembers[];
	getTaskProgress: (project: ProjectWithMembers) => number;
	formatDate: (value: Date | string | null) => string;
}

export default function ProjectListView({
	projects,
	getTaskProgress,
	formatDate,
}: ProjectListViewProps) {
	return (
		<div className=" flex flex-col gap-3">
			{projects.length === 0 && (
				<div className=" rounded-[15px] bg-primary p-6 text-center text-sm text-muted-foreground">
					No projects found.
				</div>
			)}
			{projects.map((project) => {
				const progressValue = getTaskProgress(project);
				return (
					<div
						key={project.id}
						className=" rounded-[15px] bg-primary p-4 flex items-center justify-between"
					>
						<div>
							<p className=" font-semibold text-accent">
								{project.title}
							</p>
							<p className=" text-sm text-muted-foreground">
								Due: {formatDate(project.endPeriod)}
							</p>
						</div>
						<div className=" flex items-center gap-3">
							<AssigneeOverview
								projectMembers={project.projectMembers}
							/>
							<div className=" flex items-center gap-1">
								<Progress
									className=" w-[80px] bg-secondary"
									indicatorClassName=" bg-accent"
									value={progressValue}
								/>
								<p className=" text-secondary text-sm">
									{progressValue}%
								</p>
							</div>
							<Ellipsis className="cursor-pointer w-4 h-4" />
						</div>
					</div>
				);
			})}
		</div>
	);
}
