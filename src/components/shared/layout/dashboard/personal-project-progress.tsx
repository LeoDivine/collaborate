import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PersonalProjectItem } from "@/lib/services/dashboard.services";
import { formatLabel, formatStatus, stripHtml } from "@/lib/utils";
import { CalendarDays, CheckCircle2, MoveRight } from "lucide-react";

interface PersonalProjectProgressProps {
	projects: PersonalProjectItem[];
}

export default function PersonalProjectProgress({ projects }: PersonalProjectProgressProps) {
	return (
		<div className="mt-[20px]">
			<div className="flex justify-between items-center">
				<p className="text-[20px] font-bold text-primary">
					Personal Projects
				</p>
				<Link
					href="/projects"
					className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
				>
					View All Projects <MoveRight className="w-3.5 h-3.5" />
				</Link>
			</div>

			{projects.length > 0 ? (
				<div className="mt-[10px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{projects.map((project) => {
						const progressPercentage =
							project.totalTasksCount > 0
								? Math.round((project.completedTasksCount / project.totalTasksCount) * 100)
								: project.status === "COMPLETED"
								? 100
								: 0;

						return (
							<div
								key={project.id}
								className="py-[20px] w-full rounded-[20px] px-[20px] bg-[#969696] flex flex-col justify-between"
							>
								<div>
									<div className="flex justify-between items-center gap-2">
										<div className="flex flex-wrap gap-1">
											{project.labels && project.labels.length > 0 ? (
												project.labels.slice(0, 2).map((label, index) => (
													<Badge key={index} className="bg-[#AD6B3D] text-white shadow-xs">
														{formatLabel(label)}
													</Badge>
												))
											) : (
												<Badge>{formatStatus(project.status)}</Badge>
											)}
										</div>
										<span className="text-[11px] font-semibold text-primary opacity-80 tabular-nums shrink-0">
											{progressPercentage}%
										</span>
									</div>

									<div className="mt-2.5">
										<p className="text-primary text-[18px] font-semibold line-clamp-1">
											{project.title}
										</p>
										<p className="text-primary line-clamp-2 mt-[4px] text-[12px] opacity-90">
											{stripHtml(project.description) || "No description provided."}
										</p>
									</div>
								</div>

								<div className="mt-[14px]">
									<Progress value={progressPercentage} />
									<div className="flex justify-between items-center text-[11px] mt-1.5 opacity-90 text-primary">
										<span className="flex items-center gap-1">
											<CheckCircle2 className="w-3 h-3 shrink-0" />
											{project.completedTasksCount}/{project.totalTasksCount} tasks
										</span>
										<span className="flex items-center gap-1">
											<CalendarDays className="w-3 h-3 shrink-0" />
											{new Date(project.endPeriod).toLocaleDateString()}
										</span>
									</div>

									<div className="mt-[12px]">
										<Link
											href={`/projects/${project.id}`}
											className="flex gap-2 items-center text-primary font-medium hover:underline w-fit"
										>
											<p className="text-[12px]">Details</p>
											<MoveRight strokeWidth={1.5} className="w-4 h-4" />
										</Link>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="mt-[10px] rounded-[20px] p-6 bg-[#969696] text-primary text-center">
					<p className="text-[14px] font-medium">
						No active personal projects yet.
					</p>
					<p className="text-[12px] opacity-75 mt-1">
						Create your first project on the{" "}
						<Link href="/projects" className="underline font-medium">
							Projects
						</Link>{" "}
						page to start organizing your work.
					</p>
				</div>
			)}
		</div>
	);
}
