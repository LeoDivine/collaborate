import ActivitiesOverview from "@/components/shared/layout/dashboard/activities-overview";
import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import OngoingProjectsOverview from "@/components/shared/layout/dashboard/ongoing-projects-overview";
import OverviewCalender from "@/components/shared/layout/dashboard/overview-calender";
import OwnerBarChart from "@/components/shared/layout/dashboard/owner-bar-chart";
import UpcomingDeadlinesOverview from "@/components/shared/layout/dashboard/upcoming-deadlines-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OwnerDashboardData } from "@/lib/services/dashboard.services";
import { formatPriority, formatStatus, getInitials, renderPriority, renderStatus, stripHtml } from "@/lib/utils";
import { Box, CalendarDays, Diamond, Group, Info, MoveRight, Plus, Users, Workflow } from "lucide-react";
import { User } from "next-auth";
import Link from "next/link";
import React from "react";

interface OwnerDashboardProps {
	user: User;
	data?: OwnerDashboardData;
}

export default function OwnerDashboard({ user, data }: OwnerDashboardProps) {
	const completedProjects = data?.completedProjectsCount ?? 0;
	const pendingTasks = data?.pendingTasksCount ?? 0;
	const totalMembers = data?.totalMembersCount ?? 0;
	const totalTeams = data?.totalTeamsCount ?? 0;

	const taskStatusDistribution = data?.taskStatusDistribution ?? [];
	const taskPriorityDistribution = data?.taskPriorityDistribution ?? [];
	const projectTaskDistribution = data?.projectTaskDistribution ?? [];
	const monthlyAnalysis = data?.monthlyAnalysis ?? [];

	const ongoingProjects = data?.ongoingProjects ?? [];
	const mostActiveProject = data?.mostActiveProject;
	const upcomingDeadlines = data?.upcomingDeadlines ?? [];
	const recentActivities = data?.recentActivities ?? [];

	const myProjects = data?.myProjects ?? [];
	const myTasks = data?.myTasks ?? [];

	return (
		<div>
			{/* Top Header */}
			<div className="flex justify-between items-center">
				<div>
					<p className="text-[20px] font-bold text-primary">
						Welcome Back, {user.fullName}
					</p>
					<p className="text-[13px] text-primary opacity-80 mt-0.5">
						Overview of workspace performance, team activities, and projects
					</p>
				</div>
				<div>
					<Button asChild className="rounded-full">
						<Link href="/projects">
							<Plus className="w-4 h-4 mr-1" />
							New Project
						</Link>
					</Button>
				</div>
			</div>

			{/* Stat Cards */}
			<div className="mt-[20px] gap-4 flex flex-col lg:flex-row">
				<div className="w-full">
					<div className="gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid">
						<InfoCards
							title="Completed Projects"
							value={completedProjects}
							icon={Box}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Info className="w-3 h-3" />
									<p className="text-[13px]">
										Total projects finished
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Pending Tasks"
							value={pendingTasks}
							icon={Diamond}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Info className="w-3 h-3" />
									<p className="text-[13px]">
										Total pending tasks
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Total Members"
							value={totalMembers}
							icon={Users}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Info className="w-3 h-3" />
									<p className="text-[13px]">
										Total active members
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Total Teams"
							value={totalTeams}
							icon={Group}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<Info className="w-3 h-3" />
									<p className="text-[13px]">
										Total active teams
									</p>
								</div>
							}
						/>
					</div>

					{/* Project Analysis Bar Chart */}
					<div className="mt-[20px]">
						<OwnerBarChart
							monthlyAnalysis={monthlyAnalysis}
							taskStatusDistribution={taskStatusDistribution}
							taskPriorityDistribution={taskPriorityDistribution}
							projectTaskDistribution={projectTaskDistribution}
						/>
					</div>

					{/* Ongoing & Assigned Projects Section with Tabs */}
					<div className="mt-[20px]">
						<Tabs defaultValue="all" className="w-full">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
								<div className="flex items-center gap-2">
									<Box className="w-5 h-5 text-primary" />
									<p className="text-[20px] font-bold text-primary">
										Projects Overview
									</p>
								</div>
								<div className="flex items-center gap-3">
									<TabsList>
										<TabsTrigger value="all">
											All Projects ({ongoingProjects.length})
										</TabsTrigger>
										<TabsTrigger value="mine">
											Assigned to Me ({myProjects.length})
										</TabsTrigger>
									</TabsList>
									<Link
										href="/projects"
										className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1 shrink-0"
									>
										View All <MoveRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>

							<TabsContent value="all" className="mt-[10px]">
								{ongoingProjects.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{ongoingProjects.map((project) => (
											<OngoingProjectsOverview
												key={project.id}
												project={project}
											/>
										))}
									</div>
								) : (
									<div className="rounded-[20px] p-6 bg-[#969696] text-primary text-center">
										<p className="text-[14px]">
											No ongoing projects found.
										</p>
										<Button asChild className="mt-3 rounded-full" size="sm">
											<Link href="/projects">
												<Plus className="w-3.5 h-3.5 mr-1" />
												Create First Project
											</Link>
										</Button>
									</div>
								)}
							</TabsContent>

							<TabsContent value="mine" className="mt-[10px]">
								{myProjects.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{myProjects.map((project) => (
											<OngoingProjectsOverview
												key={project.id}
												project={project}
											/>
										))}
									</div>
								) : (
									<div className="rounded-[20px] p-6 bg-[#969696] text-primary text-center">
										<p className="text-[14px]">
											You are not currently assigned to any projects as a member.
										</p>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>

					{/* Most Active Project & My Assigned Tasks */}
					<div className="mt-[20px] grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Most Active Project */}
						<div className="rounded-[20px] px-[20px] py-[20px] bg-[#969696] flex flex-col justify-between md:col-span-1">
							<div>
								<div className="flex items-center gap-2">
									<Box className="w-4 h-4 text-primary" />
									<p className="text-primary font-medium">Most Active Project</p>
								</div>
								{mostActiveProject ? (
									<>
										<div className="font-extrabold text-primary text-3xl flex items-center justify-center py-[24px] my-[10px] rounded-[20px] bg-primary/10 border border-primary/15">
											{getInitials(mostActiveProject.title)}
										</div>
										<p className="text-primary font-semibold text-[15px]">
											{mostActiveProject.title}
										</p>
										<p className="text-primary line-clamp-3 text-[13px] opacity-90 mt-1">
											{stripHtml(mostActiveProject.description) || "No description available."}
										</p>
										<p className="mt-[6px] text-[13px] text-primary font-bold">
											{mostActiveProject.pendingTaskCount}{" "}
											{mostActiveProject.pendingTaskCount === 1 ? "task" : "tasks"} left
										</p>
									</>
								) : (
									<div className="py-8 text-center text-primary opacity-80 text-[13px]">
										No active projects yet
									</div>
								)}
							</div>
							{mostActiveProject && (
								<Button asChild className="w-full rounded-full mt-[10px]">
									<Link href={`/projects/${mostActiveProject.id}`}>
										View Project
									</Link>
								</Button>
							)}
						</div>

						{/* My Assigned Tasks Container */}
						<div className="rounded-[20px] px-[20px] py-[20px] bg-[#969696] md:col-span-2 flex flex-col justify-between">
							<div>
								<div className="flex justify-between items-center">
									<div className="flex items-center gap-2">
										<Diamond className="w-4 h-4 text-primary" />
										<p className="text-primary font-semibold text-[16px]">
											Tasks Assigned to Me ({myTasks.length})
										</p>
									</div>
									<Link
										href="/tasks"
										className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1 shrink-0"
									>
										All Tasks <MoveRight className="w-3 h-3" />
									</Link>
								</div>

								<div className="mt-3 divide-y divide-primary/10">
									{myTasks.length > 0 ? (
										myTasks.map((t) => {
											const progressPercentage =
												t.totalMilestonesCount > 0
													? Math.round((t.completedMilestonesCount / t.totalMilestonesCount) * 100)
													: t.status === "COMPLETED"
													? 100
													: 0;

											return (
												<div key={t.id} className="py-2.5 first:pt-0 last:pb-0">
													<div className="flex justify-between items-start gap-2">
														<div className="min-w-0 flex-1">
															<Link
																href={`/tasks`}
																className="text-[14px] font-semibold text-primary hover:underline line-clamp-1"
															>
																{t.title}
															</Link>
															<div className="flex flex-wrap items-center gap-2 mt-1">
																<span className="text-[11px] text-primary opacity-70">
																	{t.project.title}
																</span>
																<span className="text-[11px] text-primary opacity-50">•</span>
																<span className="text-[11px] text-primary opacity-70">
																	Due {new Date(t.endPeriod).toLocaleDateString()}
																</span>
															</div>
														</div>
														<div className="flex items-center gap-1.5 shrink-0">
															<Badge className={`text-[10px] text-white ${renderPriority(t.priority as any)}`}>
																{formatPriority(t.priority)}
															</Badge>
															<Badge className={`text-[10px] ${renderStatus(t.status as any)}`}>
																{formatStatus(t.status)}
															</Badge>
														</div>
													</div>
													<div className="mt-2">
														<Progress value={progressPercentage} />
													</div>
												</div>
											);
										})
									) : (
										<p className="text-[13px] text-primary opacity-70 py-4 text-center">
											No tasks assigned directly to you right now.
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Sidebar Column */}
				<div className="w-full lg:w-[320px] shrink-0">
					<OverviewCalender />

					{/* Upcoming Deadlines */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<div className="flex items-center gap-2">
							<CalendarDays className="w-4 h-4 text-primary" />
							<p className="text-primary font-semibold text-[16px]">
								Upcoming Deadlines
							</p>
						</div>
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

					{/* Recent Activities */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<div className="flex items-center gap-2">
							<Workflow className="w-4 h-4 text-primary" />
							<p className="text-primary font-semibold text-[16px]">
								Activities
							</p>
						</div>
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
