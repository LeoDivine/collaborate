import { ProjectWithMembers } from "@/lib/types";

interface ProjectGanttViewProps {
	projects: ProjectWithMembers[];
	formatDate: (value: Date | string | null) => string;
	getBarStyle: (project: ProjectWithMembers) => {
		left: string;
		width: string;
	};
}

export default function ProjectGanttView({
	projects,
	formatDate,
	getBarStyle,
}: ProjectGanttViewProps) {
	return (
		<div className=" rounded-[15px] bg-primary p-4 flex flex-col gap-4">
			<div className=" flex items-center justify-between">
				<div>
					<p className=" text-sm font-semibold text-accent">
						Project Timeline
					</p>
					<p className=" text-xs text-muted-foreground">
						Overview of active project schedules
					</p>
				</div>
				<div className=" hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
					<span className=" inline-flex items-center gap-1">
						<span className=" h-2 w-2 rounded-full bg-accent" />
						Planned
					</span>
					<span className=" inline-flex items-center gap-1">
						<span className=" h-2 w-2 rounded-full bg-secondary" />
						Timeline
					</span>
				</div>
			</div>
			{projects.length === 0 && (
				<p className=" text-center text-sm text-muted-foreground">
					No projects found.
				</p>
			)}
			<div className=" hidden sm:grid grid-cols-[200px_1fr] gap-3 text-xs text-muted-foreground">
				<div className=" font-medium">Project</div>
				<div className=" flex justify-between">
					<span>Start</span>
					<span>End</span>
				</div>
			</div>
			{projects.map((project) => {
				const barStyle = getBarStyle(project);
				const isHighPriority =
					project.priority?.toLowerCase?.() === "high";
				return (
					<div
						key={project.id}
						className=" grid gap-2 rounded-[12px] border border-transparent bg-secondary/30 p-3 sm:grid-cols-[200px_1fr] sm:items-center"
					>
						<div className=" flex flex-col gap-1">
							<p className=" text-sm font-semibold text-accent">
								{project.title}
							</p>
							<div className=" flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span>
									{formatDate(project.startPeriod)} -{" "}
									{formatDate(project.endPeriod)}
								</span>
								{project.status && (
									<span className=" rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
										{project.status}
									</span>
								)}
								{project.priority && (
									<span
										className={` rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
											isHighPriority ?
												" bg-accent text-primary"
											:	" bg-primary text-muted-foreground"
										}`}
									>
										{project.priority}
									</span>
								)}
							</div>
						</div>
						<div className=" flex flex-col gap-2">
							<div className=" relative h-3 rounded-full bg-secondary">
								<div
									className=" absolute h-3 rounded-full bg-accent"
									style={barStyle}
								/>
							</div>
							<div className=" flex justify-between text-[10px] text-muted-foreground">
								<span>{formatDate(project.startPeriod)}</span>
								<span>{formatDate(project.endPeriod)}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
