import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ProjectWithMembers } from "@/lib/types";
import { Ellipsis } from "lucide-react";
import AssigneeOverview from "./assignee-overview";

interface ProjectTableViewProps {
	projects: ProjectWithMembers[];
	getTaskProgress: (project: ProjectWithMembers) => number;
	formatDate: (value: Date | string | null) => string;
}

export default function ProjectTableView({
	projects,
	getTaskProgress,
	formatDate,
}: ProjectTableViewProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="">Project Name</TableHead>
					<TableHead className="">Assignees</TableHead>
					<TableHead>Due Date</TableHead>
					<TableHead className="">Priority</TableHead>
					<TableHead className="">Progress</TableHead>
					<TableHead className="">Status</TableHead>
					<TableHead className=""></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{projects.length === 0 && (
					<TableRow>
						<TableCell
							colSpan={7}
							className=" text-center text-sm text-muted-foreground"
						>
							No projects found.
						</TableCell>
					</TableRow>
				)}
				{projects.map((project) => {
					const progressValue = getTaskProgress(project);
					return (
						<TableRow key={project.id}>
							<TableCell className="font-medium">
								{project.title}
							</TableCell>
							<TableCell className="">
								<AssigneeOverview
									projectMembers={project.projectMembers}
								/>
							</TableCell>
							<TableCell>
								{formatDate(project.endPeriod)}
							</TableCell>
							<TableCell className="">
								{project.priority}
							</TableCell>
							<TableCell className="">
								<div className=" flex items-center gap-1">
									<Progress
										className=" w-[60%] bg-secondary"
										indicatorClassName=" bg-accent"
										value={progressValue}
									/>
									<p>{progressValue}%</p>
								</div>
							</TableCell>
							<TableCell className="">{project.status}</TableCell>
							<TableCell className="">
								<Ellipsis className="cursor-pointer w-4 h-4" />
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
