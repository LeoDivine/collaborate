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
	PriorityDistributionItem,
	ProjectTaskDistributionItem,
} from "@/lib/services/dashboard.services";

interface OwnerBarChartProps {
	monthlyAnalysis?: MonthlyAnalysisItem[];
	taskStatusDistribution?: StatusDistributionItem[];
	taskPriorityDistribution?: PriorityDistributionItem[];
	projectTaskDistribution?: ProjectTaskDistributionItem[];
}

const DEFAULT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		const item = payload[0].payload;
		return (
			<div className="rounded-[14px] bg-[#222222] text-[#c5bebe] px-3 py-2 text-xs shadow-xl font-medium">
				<p className="text-[12px] font-bold mb-0.5 text-[#c5bebe]">{label}</p>
				<div className="flex items-center gap-2">
					<span className="opacity-80">Count:</span>
					<span className="font-bold text-[#c5bebe] tabular-nums">{payload[0].value}</span>
				</div>
				{item.projects !== undefined && item.tasks !== undefined && (
					<div className="text-[11px] text-[#c5bebe]/80 mt-1 flex gap-3">
						<span>Projects: {item.projects}</span>
						<span>Tasks: {item.tasks}</span>
					</div>
				)}
			</div>
		);
	}
	return null;
};

export default function OwnerBarChart({
	monthlyAnalysis = [],
	taskStatusDistribution = [],
	taskPriorityDistribution = [],
	projectTaskDistribution = [],
}: OwnerBarChartProps) {
	const [view, setView] = useState<"monthly" | "projects" | "status" | "priority">("monthly");

	// Direct live database records
	const monthlyData =
		monthlyAnalysis.length > 0
			? monthlyAnalysis.map((m) => ({
					label: m.month,
					value: m.value,
					projects: m.projects,
					tasks: m.tasks,
			  }))
			: DEFAULT_MONTHS.map((m) => ({ label: m, value: 0, projects: 0, tasks: 0 }));

	const projectData = projectTaskDistribution.map((p) => ({
		label: p.title.length > 12 ? `${p.title.slice(0, 11)}...` : p.title,
		value: p.total,
		completed: p.completed,
		inProgress: p.inProgress,
	}));

	const statusData = taskStatusDistribution.map((s) => ({
		label: s.label,
		value: s.count,
	}));

	const priorityData = taskPriorityDistribution.map((p) => ({
		label: p.label,
		value: p.count,
	}));

	const chartData =
		view === "monthly"
			? monthlyData
			: view === "projects"
			? projectData
			: view === "status"
			? statusData
			: priorityData;

	return (
		<div className="w-full rounded-[24px] bg-[#969696] p-6 text-primary flex flex-col justify-between">
			{/* Top Header with Title and View Switcher */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
				<div>
					<p className="text-[19px] font-bold text-primary tracking-tight">
						Project Analysis
					</p>
					<p className="text-[12px] opacity-75 mt-0.5 text-primary">
						Workspace project velocity, throughput, and status & priority distribution
					</p>
				</div>

				{/* View Switcher Pills */}
				<div className="flex items-center gap-1.5 bg-background/30 p-1 rounded-full border border-primary/10 flex-nowrap shrink-0 overflow-x-auto">
					<button
						type="button"
						onClick={() => setView("monthly")}
						className={`rounded-full text-[11px] font-semibold px-3 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
							view === "monthly"
								? "bg-primary text-secondary shadow-sm"
								: "text-primary hover:bg-background/40"
						}`}
					>
						Monthly
					</button>
					<button
						type="button"
						onClick={() => setView("projects")}
						className={`rounded-full text-[11px] font-semibold px-3 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
							view === "projects"
								? "bg-primary text-secondary shadow-sm"
								: "text-primary hover:bg-background/40"
						}`}
					>
						By Project
					</button>
					<button
						type="button"
						onClick={() => setView("status")}
						className={`rounded-full text-[11px] font-semibold px-3 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
							view === "status"
								? "bg-primary text-secondary shadow-sm"
								: "text-primary hover:bg-background/40"
						}`}
					>
						By Status
					</button>
					<button
						type="button"
						onClick={() => setView("priority")}
						className={`rounded-full text-[11px] font-semibold px-3 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
							view === "priority"
								? "bg-primary text-secondary shadow-sm"
								: "text-primary hover:bg-background/40"
						}`}
					>
						By Priority
					</button>
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
								tick={{ fill: "#222222", fontSize: 13, fontWeight: 700 }}
								dy={10}
							/>
							<YAxis hide={true} domain={[0, "auto"]} />
							<Tooltip
								content={<CustomTooltip />}
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
						No project or task data in database yet.
					</div>
				)}
			</div>
		</div>
	);
}
