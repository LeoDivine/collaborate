"use client";

import React, { useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	MonthlyAnalysisItem,
	StatusDistributionItem,
	MilestoneDistributionItem,
	PriorityDistributionItem,
	ProjectTaskDistributionItem,
} from "@/lib/services/dashboard.services";

interface PersonalBarChartProps {
	monthlyAnalysis?: MonthlyAnalysisItem[];
	taskStatusDistribution?: StatusDistributionItem[];
	taskPriorityDistribution?: PriorityDistributionItem[];
	projectTaskDistribution?: ProjectTaskDistributionItem[];
	milestoneDistribution?: MilestoneDistributionItem[];
}

type ChartView = "monthly" | "status" | "priority" | "projects" | "milestones";

const DEFAULT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const VIEW_OPTIONS: Array<{ id: ChartView; label: string }> = [
	{ id: "monthly", label: "Monthly" },
	{ id: "status", label: "Task Status" },
	{ id: "priority", label: "By Priority" },
	{ id: "projects", label: "By Project" },
	{ id: "milestones", label: "Milestones" },
];

const CustomTooltip = ({ active, payload, label, view }: any) => {
	if (!active || !payload || !payload.length) return null;

	const item = payload[0].payload;

	return (
		<div className="rounded-[14px] bg-[#222222] text-[#c5bebe] px-3 py-2 text-xs shadow-xl font-medium">
			<p className="text-[12px] font-bold mb-1 text-[#c5bebe]">{label}</p>
			{view === "monthly" ? (
				<div className="space-y-0.5">
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">Total Items:</span>
						<span className="font-bold tabular-nums">{item.value}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">Projects:</span>
						<span className="font-bold tabular-nums">{item.projects}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">Tasks:</span>
						<span className="font-bold tabular-nums">{item.tasks}</span>
					</div>
				</div>
			) : view === "projects" ? (
				<div className="space-y-0.5">
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">Total Tasks:</span>
						<span className="font-bold tabular-nums">{item.value}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">Completed:</span>
						<span className="font-bold tabular-nums">{item.completed}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="opacity-80">In Progress:</span>
						<span className="font-bold tabular-nums">{item.inProgress}</span>
					</div>
				</div>
			) : (
				<div className="flex items-center gap-2">
					<span className="opacity-80">Count:</span>
					<span className="font-bold text-[#c5bebe] tabular-nums">{payload[0].value}</span>
				</div>
			)}
		</div>
	);
};

export default function PersonalBarChart({
	monthlyAnalysis = [],
	taskStatusDistribution = [],
	taskPriorityDistribution = [],
	projectTaskDistribution = [],
	milestoneDistribution = [],
}: PersonalBarChartProps) {
	const [view, setView] = useState<ChartView>("monthly");

	const monthlyData =
		monthlyAnalysis.length > 0
			? monthlyAnalysis.map((m) => ({
					label: m.month,
					value: m.value,
					projects: m.projects,
					tasks: m.tasks,
			  }))
			: DEFAULT_MONTHS.map((m) => ({ label: m, value: 0, projects: 0, tasks: 0 }));

	const statusData = taskStatusDistribution.map((s) => ({
		label: s.label,
		value: s.count,
	}));

	const priorityData = taskPriorityDistribution.map((p) => ({
		label: p.label,
		value: p.count,
	}));

	const projectData = projectTaskDistribution.map((p) => ({
		label: p.title.length > 12 ? `${p.title.slice(0, 11)}…` : p.title,
		value: p.total,
		completed: p.completed,
		inProgress: p.inProgress,
	}));

	const milestoneData = milestoneDistribution.map((m) => ({
		label: m.label,
		value: m.count,
	}));

	const chartData =
		view === "monthly"
			? monthlyData
			: view === "status"
			? statusData
			: view === "priority"
			? priorityData
			: view === "projects"
			? projectData
			: milestoneData;

	return (
		<div className="w-full rounded-[24px] bg-[#969696] p-6 text-primary flex flex-col justify-between">
			{/* Top Header with Title and View Switcher */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
				<div>
					<p className="text-[19px] font-bold text-primary tracking-tight">
						Personal Productivity
					</p>
					<p className="text-[12px] opacity-75 mt-0.5 text-primary">
						Track your output across months, task statuses, priorities, and milestones
					</p>
				</div>

				{/* View Switcher Pills */}
				<div className="flex items-center gap-1.5 bg-background/30 p-1 rounded-full border border-primary/10 flex-nowrap shrink-0 overflow-x-auto max-w-full">
					{VIEW_OPTIONS.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => setView(option.id)}
							className={`rounded-full text-[11px] font-semibold px-3 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
								view === option.id
									? "bg-primary text-secondary shadow-sm"
									: "text-primary hover:bg-background/40"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Capsule Bar Chart */}
			<div className="h-[240px] w-full">
				{chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={chartData}
							margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
						>
							<XAxis
								dataKey="label"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#222222", fontSize: 12, fontWeight: 700 }}
								dy={10}
							/>
							<YAxis hide={true} domain={[0, "auto"]} />
							<Tooltip
								content={<CustomTooltip view={view} />}
								cursor={{ fill: "rgba(34, 34, 34, 0.04)", radius: 16 }}
							/>
							<Bar
								dataKey="value"
								fill="#222222"
								radius={[50, 50, 50, 50]}
								maxBarSize={44}
								barSize={32}
							/>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<div className="h-full flex items-center justify-center text-[13px] opacity-70 text-primary">
						No personal project or task data recorded yet.
					</div>
				)}
			</div>
		</div>
	);
}
