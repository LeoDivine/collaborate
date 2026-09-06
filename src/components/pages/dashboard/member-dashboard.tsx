import ActivitiesOverview from "@/components/shared/layout/dashboard/activities-overview";
import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import MemberBarChart from "@/components/shared/layout/dashboard/member-bar-chart";
import OngoingProjectsOverview from "@/components/shared/layout/dashboard/ongoing-projects-overview";
import OverviewCalender from "@/components/shared/layout/dashboard/overview-calender";
import UpcomingDeadlinesOverview from "@/components/shared/layout/dashboard/upcoming-deadlines-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MemberDashboardData } from "@/lib/services/dashboard.services";
import { formatPriority, formatStatus, renderPriority, renderStatus, stripHtml } from "@/lib/utils";
import { Box, CheckCircle2, Clock, Diamond, FolderKanban, Info, ListTodo, MoveRight } from "lucide-react";
import { User } from "next-auth";
import Link from "next/link";
import React from "react";

interface MemberDashboardProps {
	user: User;
	data?: MemberDashboardData;
}

export default function MemberDashboard({ user, data }: MemberDashboardProps) {
	const assignedTasks = data?.assignedTasksCount ?? 0;
	const inProgressTasks = data?.inProgressTasksCount ?? 0;
	const completedTasks = data?.completedTasksCount ?? 0;
	const assignedProjects = data?.assignedProjectsCount ?? 0;

	const taskStatusDistribution = data?.taskStatusDistribution ?? [];
	const taskPriorityDistribution = data?.taskPriorityDistribution ?? [];
	const milestoneDistribution = data?.milestoneDistribution ?? [];
	const monthlyAnalysis = data?.monthlyAnalysis ?? [];

	const myTasks = data?.myTasks ?? [];
	const myProjects = data?.myProjects ?? [];
	const upcomingDeadlines = data?.upcomingDeadlines ?? [];
	const recentActivities = data?.recentActivities ?? [];

	return (
		<div>
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<p className="text-[20px] font-bold text-primary">
						Welcome Back, {user.fullName}
					</p>
					<p className="text-[13px] text-primary opacity-80 mt-0.5">
						Track your assigned tasks, project progress, and upcoming deadlines
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" className="rounded-full size-sm" size="sm">
						<Link href="/projects">
							<Box className="w-3.5 h-3.5 mr-1.5" />
							My Projects
						</Link>
					</Button>
					<Button asChild className="rounded-full size-sm" size="sm">
						<Link href="/tasks">
							<Diamond className="w-3.5 h-3.5 mr-1.5" />
							My Tasks
						</Link>
					</Button>
				</div>
			</div>

			{/* Stat Cards */}
			<div className="mt-[20px] gap-4 flex flex-col lg:flex-row">
				<div className="w-full">
					<div className="gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid">
						<InfoCards
							title="Assigned Tasks"
							value={assignedTasks}
							icon={Diamond}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Diamond className="w-3 h-3" />
									<p className="text-[13px]">
										Pending workload
									</p>
								</div>
							}
						/>
						<InfoCards
							title="In Progress"
							value={inProgressTasks}
							icon={Diamond}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Clock className="w-3 h-3" />
									<p className="text-[13px]">
										Currently working on
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Completed Tasks"
							value={completedTasks}
							icon={Diamond}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3" />
									<p className="text-[13px]">
										Finished tasks
									</p>
								</div>
							}
						/>
						<InfoCards
							title="My Projects"
							value={assignedProjects}
							icon={Box}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Box className="w-3 h-3" />
									<p className="text-[13px]">
										Contributed projects
									</p>
								</div>
							}
						/>
					</div>

					{/* Project Analysis Bar Chart */}
					<div className="mt-[20px]">
						<MemberBarChart
							monthlyAnalysis={monthlyAnalysis}
							taskStatusDistribution={taskStatusDistribution}
							taskPriorityDistribution={taskPriorityDistribution}
							milestoneDistribution={milestoneDistribution}
						/>
					</div>

					{/* Active Workload Section */}
					<div className="mt-[20px]">
						<div className="flex justify-between items-center">
							<p className="text-[20px] font-bold text-primary">
								My Active Workload
							</p>
							<Link
								href="/tasks"
								className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
							>
								View All Tasks <MoveRight className="w-3.5 h-3.5" />
							</Link>
						</div>

						{myTasks.length > 0 ? (
							<div className="mt-[10px] grid grid-cols-1 md:grid-cols-2 gap-4">
								{myTasks.map((task) => {
									const progressPercentage =
										task.totalMilestonesCount > 0
											? Math.round((task.completedMilestonesCount / task.totalMilestonesCount) * 100)
											: task.status === "COMPLETED"
											? 100
											: 0;

									return (
										<div
											key={task.id}
											className="py-[20px] px-[20px] rounded-[20px] bg-[#969696] flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between gap-2">
													<Badge variant="outline" className="text-[11px] border-primary/30">
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
													<p className="text-primary text-[16px] font-semibold line-clamp-1">
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
													<span>
														Due {new Date(task.endPeriod).toLocaleDateString()}
													</span>
													<span>
														{task.totalMilestonesCount > 0
															? `${task.completedMilestonesCount}/${task.totalMilestonesCount} milestones`
															: task.status}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="mt-[10px] rounded-[20px] p-6 bg-[#969696] text-primary text-center">
								<p className="text-[14px] font-medium">
									You're all caught up! No active tasks assigned to you right now.
								</p>
								<p className="text-[12px] opacity-75 mt-1">
									Check assigned projects or consult with your workspace admin.
								</p>
							</div>
						)}
					</div>

					{/* Assigned Projects Section */}
					<div className="mt-[20px]">
						<div className="flex justify-between items-center">
							<p className="text-[20px] font-bold text-primary">
								My Assigned Projects
							</p>
							<Link
								href="/projects"
								className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
							>
								View All Projects <MoveRight className="w-3.5 h-3.5" />
							</Link>
						</div>

						{myProjects.length > 0 ? (
							<div className="mt-[10px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{myProjects.map((project) => (
									<OngoingProjectsOverview
										key={project.id}
										project={project}
									/>
								))}
							</div>
						) : (
							<div className="mt-[10px] rounded-[20px] p-6 bg-[#969696] text-primary text-center">
								<p className="text-[14px]">
									You are not currently assigned to any active projects.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Right Sidebar Column */}
				<div className="w-full lg:w-[320px] shrink-0">
					<OverviewCalender />

					{/* Upcoming Deadlines */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<p className="text-primary font-semibold text-[16px]">
							My Upcoming Deadlines
						</p>
						<div>
							{upcomingDeadlines.length > 0 ? (
								upcomingDeadlines.map((task) => (
									<UpcomingDeadlinesOverview
										key={task.id}
										task={task}
									/>
								))
							) : (
								<p className="text-[13px] text-primary opacity-70 mt-3">
									No upcoming deadlines.
								</p>
							)}
						</div>
					</div>

					{/* Recent Workspace Activities */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<p className="text-primary font-semibold text-[16px]">
							Workspace Activities
						</p>
						<div>
							{recentActivities.length > 0 ? (
								recentActivities.map((act) => (
									<ActivitiesOverview
										key={act.id}
										activity={act}
									/>
								))
							) : (
								<p className="text-[13px] text-primary opacity-70 mt-3">
									No recent activities.
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
