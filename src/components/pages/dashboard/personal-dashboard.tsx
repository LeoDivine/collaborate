import ActivitiesOverview from "@/components/shared/layout/dashboard/activities-overview";
import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import OverviewCalender from "@/components/shared/layout/dashboard/overview-calender";
import PersonalBarChart from "@/components/shared/layout/dashboard/personal-bar-chart";
import PersonalFocusTasks from "@/components/shared/layout/dashboard/personal-focus-tasks";
import PersonalProjectProgress from "@/components/shared/layout/dashboard/personal-project-progress";
import UpcomingDeadlinesOverview from "@/components/shared/layout/dashboard/upcoming-deadlines-overview";
import { Button } from "@/components/ui/button";
import { PersonalDashboardData } from "@/lib/services/dashboard.services";
import {
	AlertCircle,
	Box,
	CalendarDays,
	CheckCircle2,
	Clock,
	Diamond,
} from "lucide-react";
import { User } from "next-auth";
import Link from "next/link";
import React from "react";

interface PersonalDashboardProps {
	user: User;
	data?: PersonalDashboardData;
}

export default function PersonalDashboard({ user, data }: PersonalDashboardProps) {
	const activeProjects = data?.activeProjectsCount ?? 0;
	const completedProjects = data?.completedProjectsCount ?? 0;
	const pendingTasks = data?.pendingTasksCount ?? 0;
	const inProgressTasks = data?.inProgressTasksCount ?? 0;
	const completedTasks = data?.completedTasksCount ?? 0;
	const overdueTasks = data?.overdueTasksCount ?? 0;
	const completionRate = data?.completionRate ?? 0;

	const taskStatusDistribution = data?.taskStatusDistribution ?? [];
	const taskPriorityDistribution = data?.taskPriorityDistribution ?? [];
	const projectTaskDistribution = data?.projectTaskDistribution ?? [];
	const milestoneDistribution = data?.milestoneDistribution ?? [];
	const monthlyAnalysis = data?.monthlyAnalysis ?? [];

	const focusTasks = data?.focusTasks ?? [];
	const ongoingProjects = data?.ongoingProjects ?? [];
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
						Your personal workspace overview — manage projects, focus tasks, and deadlines
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" className="rounded-full" size="sm">
						<Link href="/calendar">
							<CalendarDays className="w-3.5 h-3.5 mr-1.5" />
							Calendar
						</Link>
					</Button>
					<Button asChild variant="outline" className="rounded-full" size="sm">
						<Link href="/projects">
							<Box className="w-3.5 h-3.5 mr-1.5" />
							My Projects
						</Link>
					</Button>
					<Button asChild className="rounded-full" size="sm">
						<Link href="/tasks">
							<Diamond className="w-3.5 h-3.5 mr-1.5" />
							My Tasks
						</Link>
					</Button>
				</div>
			</div>

			{/* Main Two-Column Layout */}
			<div className="mt-[20px] gap-4 flex flex-col lg:flex-row">
				{/* Left Main Content */}
				<div className="w-full">
					{/* Stat Cards */}
					<div className="gap-3 sm:gap-4 grid-cols-2 grid">
						<InfoCards
							title="Active Projects"
							value={activeProjects}
							icon={Box}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3 shrink-0" />
									<p className="text-[13px]">
										{completedProjects} completed
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
									<Clock className="w-3 h-3 shrink-0" />
									<p className="text-[13px]">
										{inProgressTasks} in progress
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Completion Rate"
							value={`${completionRate}%`}
							icon={CheckCircle2}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3 shrink-0" />
									<p className="text-[13px]">
										{completedTasks} tasks finished
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Overdue Tasks"
							value={overdueTasks}
							icon={AlertCircle}
							extraInfo={
								<div className="mt-[10px] text-primary flex items-center gap-1">
									<AlertCircle className="w-3 h-3 shrink-0" />
									<p className="text-[13px]">
										{overdueTasks > 0 ? "Needs attention" : "All on track"}
									</p>
								</div>
							}
						/>
					</div>

					{/* Personal Productivity Chart */}
					<div className="mt-[20px]">
						<PersonalBarChart
							monthlyAnalysis={monthlyAnalysis}
							taskStatusDistribution={taskStatusDistribution}
							taskPriorityDistribution={taskPriorityDistribution}
							projectTaskDistribution={projectTaskDistribution}
							milestoneDistribution={milestoneDistribution}
						/>
					</div>

					{/* Focus Tasks Section */}
					<PersonalFocusTasks tasks={focusTasks} />

					{/* Personal Projects Section */}
					<PersonalProjectProgress projects={ongoingProjects} />
				</div>

				{/* Right Sidebar Column */}
				<div className="w-full lg:w-[320px] shrink-0">
					<OverviewCalender deadlines={upcomingDeadlines} />

					{/* Upcoming Deadlines */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<p className="text-primary font-semibold text-[16px]">
							Upcoming Deadlines
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

					{/* Recent Activities */}
					<div className="mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-[#969696]">
						<p className="text-primary font-semibold text-[16px]">
							Recent Activity
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
