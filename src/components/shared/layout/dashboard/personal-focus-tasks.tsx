import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PersonalFocusTaskItem } from "@/lib/services/dashboard.services";
import { formatPriority, formatStatus, renderPriority, renderStatus, stripHtml } from "@/lib/utils";
import { AlertCircle, CalendarDays, MoveRight } from "lucide-react";

interface PersonalFocusTasksProps {
	tasks: PersonalFocusTaskItem[];
}

export default function PersonalFocusTasks({ tasks }: PersonalFocusTasksProps) {
	const now = new Date();

	return (
		<div className="mt-[20px]">
			<div className="flex justify-between items-center">
				<p className="text-[20px] font-bold text-primary">
					Focus Tasks
				</p>
				<Link
					href="/tasks"
					className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
				>
					View All Tasks <MoveRight className="w-3.5 h-3.5" />
				</Link>
			</div>

			{tasks.length > 0 ? (
				<div className="mt-[10px] grid grid-cols-1 md:grid-cols-2 gap-4">
					{tasks.map((task) => {
						const dueDate = new Date(task.endPeriod);
						const isOverdue = dueDate < now && task.status !== "COMPLETED";
						const progressPercentage =
							task.totalMilestonesCount > 0
								? Math.round((task.completedMilestonesCount / task.totalMilestonesCount) * 100)
								: task.status === "COMPLETED"
								? 100
								: task.status === "IN_PROGRESS"
								? 40
								: 0;

						return (
							<Link
								key={task.id}
								href={`/tasks/${task.id}`}
								className="group py-[20px] px-[20px] rounded-[20px] bg-[#969696] flex flex-col justify-between transition-opacity hover:opacity-95"
							>
								<div>
									<div className="flex items-center justify-between gap-2">
										<Badge variant="outline" className="text-[11px] border-primary/30 truncate max-w-[140px]">
											{task.project.title}
										</Badge>
										<div className="flex items-center gap-1.5 shrink-0">
											<Badge className={`text-[10px] text-white ${renderPriority(task.priority as any)}`}>
												{formatPriority(task.priority)}
											</Badge>
											<Badge className={`text-[10px] ${renderStatus(task.status as any)}`}>
												{formatStatus(task.status)}
											</Badge>
										</div>
									</div>

									<div className="mt-3">
										<p className="text-primary text-[16px] font-semibold line-clamp-1 group-hover:underline">
											{task.title}
										</p>
										<p className="text-primary line-clamp-2 mt-[4px] text-[12px] opacity-80">
											{stripHtml(task.description) || "No description provided."}
										</p>
									</div>
								</div>

								<div className="mt-[15px]">
									<Progress value={progressPercentage} />
									<div className="flex justify-between items-center text-[11px] mt-1.5 opacity-90 text-primary">
										<span className="flex items-center gap-1">
											{isOverdue ? (
												<AlertCircle className="w-3 h-3 text-destructive shrink-0" />
											) : (
												<CalendarDays className="w-3 h-3 shrink-0" />
											)}
											<span className={isOverdue ? "font-semibold" : ""}>
												{isOverdue ? "Overdue · " : "Due "}
												{dueDate.toLocaleDateString()}
											</span>
										</span>
										<span>
											{task.totalMilestonesCount > 0
												? `${task.completedMilestonesCount}/${task.totalMilestonesCount} milestones`
												: formatStatus(task.status)}
										</span>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			) : (
				<div className="mt-[10px] rounded-[20px] p-6 bg-[#969696] text-primary text-center">
					<p className="text-[14px] font-medium">
						You&apos;re all caught up! No active tasks right now.
					</p>
					<p className="text-[12px] opacity-75 mt-1">
						Head over to{" "}
						<Link href="/tasks" className="underline font-medium">
							Tasks
						</Link>{" "}
						to plan what to work on next.
					</p>
				</div>
			)}
		</div>
	);
}
