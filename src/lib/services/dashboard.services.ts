"use server";

import { db } from "@/lib/db";

export interface StatusDistributionItem {
	status: string;
	label: string;
	count: number;
}

export interface PriorityDistributionItem {
	priority: string;
	label: string;
	count: number;
}

export interface ProjectTaskDistributionItem {
	id: string;
	title: string;
	total: number;
	completed: number;
	inProgress: number;
	pending: number;
}

export interface MilestoneDistributionItem {
	status: string;
	label: string;
	count: number;
}

export interface MonthlyAnalysisItem {
	month: string;
	value: number;
	projects: number;
	tasks: number;
}

export interface TeamInfo {
	id: string;
	name: string;
	members: Array<{
		id: string;
		role: string;
		user: {
			fullName: string;
			userName: string | null;
			email: string;
		};
	}>;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

function computeMonthlyAnalysis(
	projects: Array<{ createdAt: Date }>,
	tasks: Array<{ createdAt: Date }>,
): MonthlyAnalysisItem[] {
	const map = new Map<number, { projects: number; tasks: number }>();
	for (let i = 0; i < 10; i++) {
		map.set(i, { projects: 0, tasks: 0 });
	}

	for (const p of projects) {
		const month = new Date(p.createdAt).getMonth();
		if (month >= 0 && month < 10) {
			const entry = map.get(month) || { projects: 0, tasks: 0 };
			entry.projects += 1;
			map.set(month, entry);
		}
	}

	for (const t of tasks) {
		const month = new Date(t.createdAt).getMonth();
		if (month >= 0 && month < 10) {
			const entry = map.get(month) || { projects: 0, tasks: 0 };
			entry.tasks += 1;
			map.set(month, entry);
		}
	}

	return DEFAULT_MONTHS.map((month, index) => {
		const entry = map.get(index) || { projects: 0, tasks: 0 };
		return {
			month,
			value: entry.projects + entry.tasks,
			projects: entry.projects,
			tasks: entry.tasks,
		};
	});
}

const STATUS_LABELS: Record<string, string> = {
	TODO: "To Do",
	IN_PROGRESS: "In Progress",
	ON_HOLD: "On Hold",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

const PRIORITY_LABELS: Record<string, string> = {
	URGENT: "Urgent",
	HIGH: "High",
	MEDIUM: "Medium",
	LOW: "Low",
	NO_PRIORITY: "No Priority",
};

const MILESTONE_LABELS: Record<string, string> = {
	DONE: "Completed",
	IN_PROGRESS: "In Progress",
	NOT_STARTED: "Not Started",
};

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"] as const;
const MILESTONE_ORDER = ["DONE", "IN_PROGRESS", "NOT_STARTED"] as const;

export interface OwnerDashboardData {
	completedProjectsCount: number;
	pendingTasksCount: number;
	totalMembersCount: number;
	totalTeamsCount: number;
	taskStatusDistribution: StatusDistributionItem[];
	taskPriorityDistribution: PriorityDistributionItem[];
	projectTaskDistribution: ProjectTaskDistributionItem[];
	monthlyAnalysis: MonthlyAnalysisItem[];
	myTeam: TeamInfo | null;
	ongoingProjects: Array<{
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	mostActiveProject: {
		id: string;
		title: string;
		description: string;
		pendingTaskCount: number;
	} | null;
	upcomingDeadlines: Array<{
		id: string;
		title: string;
		description: string;
		endPeriod: Date;
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
	recentActivities: Array<{
		id: string;
		title: string;
		description: string;
		createdAt: Date;
		type: string;
	}>;
	myProjects: Array<{
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	myTasks: Array<{
		id: string;
		title: string;
		description: string;
		status: string;
		priority: string;
		endPeriod: Date;
		project: {
			id: string;
			title: string;
		};
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
}

export const getOwnerDashboardData = async (
	workspaceId: string,
	memberId?: string,
	userId?: string,
): Promise<{
	success: boolean;
	data?: OwnerDashboardData;
	message?: string;
}> => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
		};
	}

	try {
		let effectiveMemberId = memberId;
		if (!effectiveMemberId && userId) {
			const member = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
				select: { id: true },
			});
			effectiveMemberId = member?.id;
		}

		const [
			completedProjectsCount,
			pendingTasksCount,
			totalMembersCount,
			totalTeamsCount,
			ongoingProjectsRaw,
			allWorkspaceProjects,
			upcomingTasksRaw,
			recentActivitiesRaw,
			myProjectsRaw,
			myTasksRaw,
			taskStatusCountsRaw,
			taskPriorityCountsRaw,
			projectTaskDistributionRaw,
			ownerProjectsCreatedRaw,
			ownerTasksCreatedRaw,
			memberTeamRaw,
		] = await Promise.all([
			db.project.count({
				where: {
					workspaceId,
					status: "COMPLETED",
				},
			}),

			db.task.count({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
			}),

			db.member.count({
				where: {
					workspaceId,
					status: "ACTIVE",
				},
			}),

			db.team.count({
				where: {
					workspaceId,
				},
			}),

			db.project.findMany({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
				take: 6,
				orderBy: {
					updatedAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					labels: true,
					status: true,
					projectMembers: {
						select: {
							member: {
								select: {
									id: true,
									user: {
										select: {
											fullName: true,
											userName: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			}),

			db.project.findMany({
				where: {
					workspaceId,
				},
				select: {
					id: true,
					title: true,
					description: true,
					tasks: {
						where: {
							status: {
								not: "COMPLETED",
							},
						},
						select: {
							id: true,
						},
					},
				},
			}),

			db.task.findMany({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
				take: 5,
				orderBy: {
					endPeriod: "asc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					endPeriod: true,
					milestones: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.activity.findMany({
				where: {
					workspaceId,
				},
				take: 5,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					type: true,
					createdAt: true,
				},
			}),

			effectiveMemberId
				? db.project.findMany({
						where: {
							workspaceId,
							projectMembers: {
								some: { memberId: effectiveMemberId },
							},
						},
						take: 6,
						orderBy: {
							updatedAt: "desc",
						},
						select: {
							id: true,
							title: true,
							description: true,
							labels: true,
							status: true,
							projectMembers: {
								select: {
									member: {
										select: {
											id: true,
											user: {
												select: {
													fullName: true,
													userName: true,
													email: true,
												},
											},
										},
									},
								},
							},
						},
				  })
				: Promise.resolve([]),

			effectiveMemberId
				? db.task.findMany({
						where: {
							workspaceId,
							taskMembers: {
								some: { memberId: effectiveMemberId },
							},
						},
						take: 6,
						orderBy: {
							updatedAt: "desc",
						},
						select: {
							id: true,
							title: true,
							description: true,
							status: true,
							priority: true,
							endPeriod: true,
							project: {
								select: {
									id: true,
									title: true,
								},
							},
							milestones: {
								select: {
									id: true,
									status: true,
								},
							},
						},
				  })
				: Promise.resolve([]),

			db.task.groupBy({
				by: ["status"],
				where: { workspaceId },
				_count: { status: true },
			}),

			db.task.groupBy({
				by: ["priority"],
				where: { workspaceId },
				_count: { priority: true },
			}),

			db.project.findMany({
				where: { workspaceId },
				take: 5,
				orderBy: { updatedAt: "desc" },
				select: {
					id: true,
					title: true,
					tasks: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.project.findMany({
				where: { workspaceId },
				select: { createdAt: true },
			}),

			db.task.findMany({
				where: { workspaceId },
				select: { createdAt: true },
			}),

			effectiveMemberId
				? db.member.findUnique({
						where: { id: effectiveMemberId },
						select: {
							team: {
								select: {
									id: true,
									name: true,
									members: {
										select: {
											id: true,
											role: true,
											user: {
												select: {
													fullName: true,
													userName: true,
													email: true,
												},
											},
										},
									},
								},
							},
						},
				  })
				: Promise.resolve(null),
		]);

		let mostActiveProject: OwnerDashboardData["mostActiveProject"] = null;
		if (allWorkspaceProjects.length > 0) {
			const sortedByTasks = [...allWorkspaceProjects].sort(
				(a, b) => b.tasks.length - a.tasks.length,
			);
			const topProject = sortedByTasks[0];
			mostActiveProject = {
				id: topProject.id,
				title: topProject.title,
				description: topProject.description,
				pendingTaskCount: topProject.tasks.length,
			};
		}

		const ongoingProjects = ongoingProjectsRaw.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			labels: p.labels,
			status: p.status,
			projectMembers: p.projectMembers,
		}));

		const upcomingDeadlines = upcomingTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				endPeriod: t.endPeriod,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const recentActivities = recentActivitiesRaw.map((a) => ({
			id: a.id,
			title: a.title,
			description: a.description,
			createdAt: a.createdAt,
			type: a.type,
		}));

		const myProjects = myProjectsRaw.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			labels: p.labels,
			status: p.status,
			projectMembers: p.projectMembers,
		}));

		const myTasks = myTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				status: t.status,
				priority: t.priority,
				endPeriod: t.endPeriod,
				project: t.project,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const statusMap = new Map(
			(taskStatusCountsRaw || []).map((s) => [s.status, s._count.status]),
		);
		const taskStatusDistribution = STATUS_ORDER.map((status) => ({
			status,
			label: STATUS_LABELS[status] || status,
			count: statusMap.get(status) || 0,
		}));

		const priorityMap = new Map(
			(taskPriorityCountsRaw || []).map((p) => [p.priority, p._count.priority]),
		);
		const taskPriorityDistribution = PRIORITY_ORDER.map((priority) => ({
			priority,
			label: PRIORITY_LABELS[priority] || priority,
			count: priorityMap.get(priority) || 0,
		}));

		const projectTaskDistribution = (projectTaskDistributionRaw || []).map((p) => {
			const total = p.tasks.length;
			const completed = p.tasks.filter((t) => t.status === "COMPLETED").length;
			const inProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
			const pending = total - completed;
			return {
				id: p.id,
				title: p.title,
				total,
				completed,
				inProgress,
				pending,
			};
		});

		const monthlyAnalysis = computeMonthlyAnalysis(
			ownerProjectsCreatedRaw || [],
			ownerTasksCreatedRaw || [],
		);

		const myTeam: TeamInfo | null = memberTeamRaw?.team
			? {
					id: memberTeamRaw.team.id,
					name: memberTeamRaw.team.name,
					members: memberTeamRaw.team.members.map((m) => ({
						id: m.id,
						role: m.role,
						user: m.user,
					})),
			  }
			: null;

		return {
			success: true,
			data: {
				completedProjectsCount,
				pendingTasksCount,
				totalMembersCount,
				totalTeamsCount,
				taskStatusDistribution,
				taskPriorityDistribution,
				projectTaskDistribution,
				monthlyAnalysis,
				myTeam,
				ongoingProjects,
				mostActiveProject,
				upcomingDeadlines,
				recentActivities,
				myProjects,
				myTasks,
			},
		};
	} catch (error: any) {
		console.error("Error fetching owner dashboard data:", error);
		return {
			success: false,
			message: "Failed to fetch dashboard data",
		};
	}
};

export interface AdminDashboardData {
	completedProjectsCount: number;
	activeProjectsCount: number;
	pendingTasksCount: number;
	totalMembersCount: number;
	totalTeamsCount: number;
	pendingRequestsCount: number;
	taskStatusDistribution: StatusDistributionItem[];
	taskPriorityDistribution: PriorityDistributionItem[];
	projectTaskDistribution: ProjectTaskDistributionItem[];
	monthlyAnalysis: MonthlyAnalysisItem[];
	myTeam: TeamInfo | null;
	teams: Array<TeamInfo>;
	ongoingProjects: Array<{
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	mostActiveProject: {
		id: string;
		title: string;
		description: string;
		pendingTaskCount: number;
	} | null;
	recentTasks: Array<{
		id: string;
		title: string;
		description: string;
		status: string;
		priority: string;
		endPeriod: Date;
		project: {
			id: string;
			title: string;
		};
		taskMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	upcomingDeadlines: Array<{
		id: string;
		title: string;
		description: string;
		endPeriod: Date;
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
	recentActivities: Array<{
		id: string;
		title: string;
		description: string;
		createdAt: Date;
		type: string;
	}>;
	pendingJoinRequests: Array<{
		id: string;
		fullName: string;
		email: string;
		createdAt: Date;
		message: string | null;
	}>;
	myProjects: Array<{
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	myTasks: Array<{
		id: string;
		title: string;
		description: string;
		status: string;
		priority: string;
		endPeriod: Date;
		project: {
			id: string;
			title: string;
		};
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
}

export const getAdminDashboardData = async (
	workspaceId: string,
	memberId?: string,
	userId?: string,
): Promise<{
	success: boolean;
	data?: AdminDashboardData;
	message?: string;
}> => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
		};
	}

	try {
		let effectiveMemberId = memberId;
		if (!effectiveMemberId && userId) {
			const member = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
				select: { id: true },
			});
			effectiveMemberId = member?.id;
		}

		const [
			completedProjectsCount,
			activeProjectsCount,
			pendingTasksCount,
			totalMembersCount,
			totalTeamsCount,
			pendingRequestsCount,
			ongoingProjectsRaw,
			allWorkspaceProjects,
			recentTasksRaw,
			upcomingTasksRaw,
			recentActivitiesRaw,
			pendingJoinRequestsRaw,
			myProjectsRaw,
			myTasksRaw,
			taskStatusCountsRaw,
			taskPriorityCountsRaw,
			projectTaskDistributionRaw,
			adminProjectsCreatedRaw,
			adminTasksCreatedRaw,
			memberTeamRaw,
			teamsRaw,
		] = await Promise.all([
			db.project.count({
				where: {
					workspaceId,
					status: "COMPLETED",
				},
			}),

			db.project.count({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
			}),

			db.task.count({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
			}),

			db.member.count({
				where: {
					workspaceId,
					status: "ACTIVE",
				},
			}),

			db.team.count({
				where: {
					workspaceId,
				},
			}),

			db.joinRequest.count({
				where: {
					workspaceId,
					status: "PENDING",
				},
			}),

			db.project.findMany({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
				take: 6,
				orderBy: {
					updatedAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					labels: true,
					status: true,
					projectMembers: {
						select: {
							member: {
								select: {
									id: true,
									user: {
										select: {
											fullName: true,
											userName: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			}),

			db.project.findMany({
				where: {
					workspaceId,
				},
				select: {
					id: true,
					title: true,
					description: true,
					tasks: {
						where: {
							status: {
								not: "COMPLETED",
							},
						},
						select: {
							id: true,
						},
					},
				},
			}),

			db.task.findMany({
				where: {
					workspaceId,
				},
				take: 5,
				orderBy: {
					updatedAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					status: true,
					priority: true,
					endPeriod: true,
					project: {
						select: {
							id: true,
							title: true,
						},
					},
					taskMembers: {
						select: {
							member: {
								select: {
									id: true,
									user: {
										select: {
											fullName: true,
											userName: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			}),

			db.task.findMany({
				where: {
					workspaceId,
					status: {
						not: "COMPLETED",
					},
				},
				take: 5,
				orderBy: {
					endPeriod: "asc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					endPeriod: true,
					milestones: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.activity.findMany({
				where: {
					workspaceId,
				},
				take: 5,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					type: true,
					createdAt: true,
				},
			}),

			db.joinRequest.findMany({
				where: {
					workspaceId,
					status: "PENDING",
				},
				take: 4,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					fullName: true,
					email: true,
					createdAt: true,
					message: true,
				},
			}),

			effectiveMemberId
				? db.project.findMany({
						where: {
							workspaceId,
							projectMembers: {
								some: { memberId: effectiveMemberId },
							},
						},
						take: 6,
						orderBy: {
							updatedAt: "desc",
						},
						select: {
							id: true,
							title: true,
							description: true,
							labels: true,
							status: true,
							projectMembers: {
								select: {
									member: {
										select: {
											id: true,
											user: {
												select: {
													fullName: true,
													userName: true,
													email: true,
												},
											},
										},
									},
								},
							},
						},
				  })
				: Promise.resolve([]),

			effectiveMemberId
				? db.task.findMany({
						where: {
							workspaceId,
							taskMembers: {
								some: { memberId: effectiveMemberId },
							},
						},
						take: 6,
						orderBy: {
							updatedAt: "desc",
						},
						select: {
							id: true,
							title: true,
							description: true,
							status: true,
							priority: true,
							endPeriod: true,
							project: {
								select: {
									id: true,
									title: true,
								},
							},
							milestones: {
								select: {
									id: true,
									status: true,
								},
							},
						},
				  })
				: Promise.resolve([]),

			db.task.groupBy({
				by: ["status"],
				where: { workspaceId },
				_count: { status: true },
			}),

			db.task.groupBy({
				by: ["priority"],
				where: { workspaceId },
				_count: { priority: true },
			}),

			db.project.findMany({
				where: { workspaceId },
				take: 5,
				orderBy: { updatedAt: "desc" },
				select: {
					id: true,
					title: true,
					tasks: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.project.findMany({
				where: { workspaceId },
				select: { createdAt: true },
			}),

			db.task.findMany({
				where: { workspaceId },
				select: { createdAt: true },
			}),

			effectiveMemberId
				? db.member.findUnique({
						where: { id: effectiveMemberId },
						select: {
							team: {
								select: {
									id: true,
									name: true,
									members: {
										select: {
											id: true,
											role: true,
											user: {
												select: {
													fullName: true,
													userName: true,
													email: true,
												},
											},
										},
									},
								},
							},
						},
				  })
				: Promise.resolve(null),

			db.team.findMany({
				where: { workspaceId },
				select: {
					id: true,
					name: true,
					members: {
						select: {
							id: true,
							role: true,
							user: {
								select: {
									fullName: true,
									userName: true,
									email: true,
								},
							},
						},
					},
				},
			}),
		]);

		let mostActiveProject: AdminDashboardData["mostActiveProject"] = null;
		if (allWorkspaceProjects.length > 0) {
			const sortedByTasks = [...allWorkspaceProjects].sort(
				(a, b) => b.tasks.length - a.tasks.length,
			);
			const topProject = sortedByTasks[0];
			mostActiveProject = {
				id: topProject.id,
				title: topProject.title,
				description: topProject.description,
				pendingTaskCount: topProject.tasks.length,
			};
		}

		const ongoingProjects = ongoingProjectsRaw.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			labels: p.labels,
			status: p.status,
			projectMembers: p.projectMembers,
		}));

		const recentTasks = recentTasksRaw.map((t) => ({
			id: t.id,
			title: t.title,
			description: t.description,
			status: t.status,
			priority: t.priority,
			endPeriod: t.endPeriod,
			project: t.project,
			taskMembers: t.taskMembers,
		}));

		const upcomingDeadlines = upcomingTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				endPeriod: t.endPeriod,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const recentActivities = recentActivitiesRaw.map((a) => ({
			id: a.id,
			title: a.title,
			description: a.description,
			createdAt: a.createdAt,
			type: a.type,
		}));

		const pendingJoinRequests = pendingJoinRequestsRaw.map((r) => ({
			id: r.id,
			fullName: r.fullName,
			email: r.email,
			createdAt: r.createdAt,
			message: r.message,
		}));

		const myProjects = myProjectsRaw.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			labels: p.labels,
			status: p.status,
			projectMembers: p.projectMembers,
		}));

		const myTasks = myTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				status: t.status,
				priority: t.priority,
				endPeriod: t.endPeriod,
				project: t.project,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const statusMap = new Map(
			(taskStatusCountsRaw || []).map((s) => [s.status, s._count.status]),
		);
		const taskStatusDistribution = STATUS_ORDER.map((status) => ({
			status,
			label: STATUS_LABELS[status] || status,
			count: statusMap.get(status) || 0,
		}));

		const priorityMap = new Map(
			(taskPriorityCountsRaw || []).map((p) => [p.priority, p._count.priority]),
		);
		const taskPriorityDistribution = PRIORITY_ORDER.map((priority) => ({
			priority,
			label: PRIORITY_LABELS[priority] || priority,
			count: priorityMap.get(priority) || 0,
		}));

		const projectTaskDistribution = (projectTaskDistributionRaw || []).map((p) => {
			const total = p.tasks.length;
			const completed = p.tasks.filter((t) => t.status === "COMPLETED").length;
			const inProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
			const pending = total - completed;
			return {
				id: p.id,
				title: p.title,
				total,
				completed,
				inProgress,
				pending,
			};
		});

		const monthlyAnalysis = computeMonthlyAnalysis(
			adminProjectsCreatedRaw || [],
			adminTasksCreatedRaw || [],
		);

		const myTeam: TeamInfo | null = memberTeamRaw?.team
			? {
					id: memberTeamRaw.team.id,
					name: memberTeamRaw.team.name,
					members: memberTeamRaw.team.members.map((m) => ({
						id: m.id,
						role: m.role,
						user: m.user,
					})),
			  }
			: null;

		const teams: Array<TeamInfo> = (teamsRaw || []).map((t) => ({
			id: t.id,
			name: t.name,
			members: t.members.map((m) => ({
				id: m.id,
				role: m.role,
				user: m.user,
			})),
		}));

		return {
			success: true,
			data: {
				completedProjectsCount,
				activeProjectsCount,
				pendingTasksCount,
				totalMembersCount,
				totalTeamsCount,
				pendingRequestsCount,
				taskStatusDistribution,
				taskPriorityDistribution,
				projectTaskDistribution,
				monthlyAnalysis,
				myTeam,
				teams,
				ongoingProjects,
				mostActiveProject,
				recentTasks,
				upcomingDeadlines,
				recentActivities,
				pendingJoinRequests,
				myProjects,
				myTasks,
			},
		};
	} catch (error: any) {
		console.error("Error fetching admin dashboard data:", error);
		return {
			success: false,
			message: "Failed to fetch admin dashboard data",
		};
	}
};

export interface MemberDashboardData {
	assignedTasksCount: number;
	inProgressTasksCount: number;
	completedTasksCount: number;
	assignedProjectsCount: number;
	taskStatusDistribution: StatusDistributionItem[];
	taskPriorityDistribution: PriorityDistributionItem[];
	milestoneDistribution: MilestoneDistributionItem[];
	monthlyAnalysis: MonthlyAnalysisItem[];
	myTeam: TeamInfo | null;
	myTasks: Array<{
		id: string;
		title: string;
		description: string;
		priority: string;
		status: string;
		endPeriod: Date;
		project: {
			id: string;
			title: string;
		};
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
	myProjects: Array<{
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	}>;
	upcomingDeadlines: Array<{
		id: string;
		title: string;
		description: string;
		endPeriod: Date;
		completedMilestonesCount: number;
		totalMilestonesCount: number;
	}>;
	recentActivities: Array<{
		id: string;
		title: string;
		description: string;
		createdAt: Date;
		type: string;
	}>;
}

export const getMemberDashboardData = async (
	workspaceId: string,
	memberId?: string,
	userId?: string,
): Promise<{
	success: boolean;
	data?: MemberDashboardData;
	message?: string;
}> => {
	if (!workspaceId) {
		return {
			success: false,
			message: "Workspace ID is required",
		};
	}

	try {
		let effectiveMemberId = memberId;

		if (!effectiveMemberId && userId) {
			const member = await db.member.findUnique({
				where: {
					userId_workspaceId: {
						userId,
						workspaceId,
					},
				},
				select: { id: true },
			});
			effectiveMemberId = member?.id;
		}

		if (!effectiveMemberId) {
			return {
				success: true,
				data: {
					assignedTasksCount: 0,
					inProgressTasksCount: 0,
					completedTasksCount: 0,
					assignedProjectsCount: 0,
					taskStatusDistribution: STATUS_ORDER.map((status) => ({
						status,
						label: STATUS_LABELS[status] || status,
						count: 0,
					})),
					taskPriorityDistribution: PRIORITY_ORDER.map((priority) => ({
						priority,
						label: PRIORITY_LABELS[priority] || priority,
						count: 0,
					})),
					milestoneDistribution: MILESTONE_ORDER.map((status) => ({
						status,
						label: MILESTONE_LABELS[status] || status,
						count: 0,
					})),
					monthlyAnalysis: DEFAULT_MONTHS.map((month) => ({
						month,
						value: 0,
						projects: 0,
						tasks: 0,
					})),
					myTeam: null,
					myTasks: [],
					myProjects: [],
					upcomingDeadlines: [],
					recentActivities: [],
				},
			};
		}

		const [
			assignedTasksCount,
			inProgressTasksCount,
			completedTasksCount,
			assignedProjectsCount,
			myTasksRaw,
			myProjectsRaw,
			upcomingTasksRaw,
			recentActivitiesRaw,
			taskStatusCountsRaw,
			taskPriorityCountsRaw,
			milestonesRaw,
			memberProjectsCreatedRaw,
			memberTasksCreatedRaw,
			memberTeamRaw,
		] = await Promise.all([
			db.task.count({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
					status: {
						not: "COMPLETED",
					},
				},
			}),

			db.task.count({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
					status: "IN_PROGRESS",
				},
			}),

			db.task.count({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
					status: "COMPLETED",
				},
			}),

			db.project.count({
				where: {
					workspaceId,
					projectMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
			}),

			db.task.findMany({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
				take: 6,
				orderBy: {
					updatedAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					priority: true,
					status: true,
					endPeriod: true,
					project: {
						select: {
							id: true,
							title: true,
						},
					},
					milestones: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.project.findMany({
				where: {
					workspaceId,
					projectMembers: {
						some: { memberId: effectiveMemberId },
					},
					status: {
						not: "COMPLETED",
					},
				},
				take: 6,
				orderBy: {
					updatedAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					labels: true,
					status: true,
					projectMembers: {
						select: {
							member: {
								select: {
									id: true,
									user: {
										select: {
											fullName: true,
											userName: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			}),

			db.task.findMany({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
					status: {
						not: "COMPLETED",
					},
				},
				take: 5,
				orderBy: {
					endPeriod: "asc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					endPeriod: true,
					milestones: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			}),

			db.activity.findMany({
				where: {
					workspaceId,
				},
				take: 5,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					title: true,
					description: true,
					type: true,
					createdAt: true,
				},
			}),

			db.task.groupBy({
				by: ["status"],
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
				_count: { status: true },
			}),

			db.task.groupBy({
				by: ["priority"],
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
				_count: { priority: true },
			}),

			db.mileStone.groupBy({
				by: ["status"],
				where: {
					task: {
						workspaceId,
						taskMembers: {
							some: { memberId: effectiveMemberId },
						},
					},
				},
				_count: { status: true },
			}),

			db.project.findMany({
				where: {
					workspaceId,
					projectMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
				select: { createdAt: true },
			}),

			db.task.findMany({
				where: {
					workspaceId,
					taskMembers: {
						some: { memberId: effectiveMemberId },
					},
				},
				select: { createdAt: true },
			}),

			effectiveMemberId
				? db.member.findUnique({
						where: { id: effectiveMemberId },
						select: {
							team: {
								select: {
									id: true,
									name: true,
									members: {
										select: {
											id: true,
											role: true,
											user: {
												select: {
													fullName: true,
													userName: true,
													email: true,
												},
											},
										},
									},
								},
							},
						},
				  })
				: Promise.resolve(null),
		]);

		const myTasks = myTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				priority: t.priority,
				status: t.status,
				endPeriod: t.endPeriod,
				project: t.project,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const myProjects = myProjectsRaw.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			labels: p.labels,
			status: p.status,
			projectMembers: p.projectMembers,
		}));

		const upcomingDeadlines = upcomingTasksRaw.map((t) => {
			const totalMilestonesCount = t.milestones.length;
			const completedMilestonesCount = t.milestones.filter(
				(m) => m.status === "DONE",
			).length;
			return {
				id: t.id,
				title: t.title,
				description: t.description,
				endPeriod: t.endPeriod,
				completedMilestonesCount,
				totalMilestonesCount,
			};
		});

		const recentActivities = recentActivitiesRaw.map((a) => ({
			id: a.id,
			title: a.title,
			description: a.description,
			createdAt: a.createdAt,
			type: a.type,
		}));

		const statusMap = new Map(
			(taskStatusCountsRaw || []).map((s) => [s.status, s._count.status]),
		);
		const taskStatusDistribution = STATUS_ORDER.map((status) => ({
			status,
			label: STATUS_LABELS[status] || status,
			count: statusMap.get(status) || 0,
		}));

		const priorityMap = new Map(
			(taskPriorityCountsRaw || []).map((p) => [p.priority, p._count.priority]),
		);
		const taskPriorityDistribution = PRIORITY_ORDER.map((priority) => ({
			priority,
			label: PRIORITY_LABELS[priority] || priority,
			count: priorityMap.get(priority) || 0,
		}));

		const milestoneMap = new Map(
			(milestonesRaw || []).map((m) => [m.status, m._count.status]),
		);
		const milestoneDistribution = MILESTONE_ORDER.map((status) => ({
			status,
			label: MILESTONE_LABELS[status] || status,
			count: milestoneMap.get(status) || 0,
		}));

		const monthlyAnalysis = computeMonthlyAnalysis(
			memberProjectsCreatedRaw || [],
			memberTasksCreatedRaw || [],
		);

		const myTeam: TeamInfo | null = memberTeamRaw?.team
			? {
					id: memberTeamRaw.team.id,
					name: memberTeamRaw.team.name,
					members: memberTeamRaw.team.members.map((m) => ({
						id: m.id,
						role: m.role,
						user: m.user,
					})),
			  }
			: null;

		return {
			success: true,
			data: {
				assignedTasksCount,
				inProgressTasksCount,
				completedTasksCount,
				assignedProjectsCount,
				taskStatusDistribution,
				taskPriorityDistribution,
				milestoneDistribution,
				monthlyAnalysis,
				myTeam,
				myTasks,
				myProjects,
				upcomingDeadlines,
				recentActivities,
			},
		};
	} catch (error: any) {
		console.error("Error fetching member dashboard data:", error);
		return {
			success: false,
			message: "Failed to fetch member dashboard data",
		};
	}
};
