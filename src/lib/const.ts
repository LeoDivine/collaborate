import {
	Bell,
	Blocks,
	Box,
	CalendarDays,
	CircleDashed,
	CircleSlash,
	Group,
	Info,
	LayoutDashboard,
	Diamond,
	Settings,
	Users,
	Flame,
	Workflow,
	Cloud,
	ThermometerSnowflake,
} from "lucide-react";
import { PriorityLevel } from "../../generated/prisma/enums";
import type { Quote } from "./types";


export const NAVLINKS = [
	{
		name: "Home",
		link: "/",
	},
	{
		name: "Product",
		link: "/product",
	},
	{
		name: "Guides",
		link: "/guides",
	},
	{
		name: "Docs",
		link: "/docs",
	},
	{
		name: "Blogs",
		link: "/blogs",
	},
];

export const WORKSPACE = [
	{
		id: "132",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
	{
		id: "453",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
	{
		id: "565",
		name: "From Nothing To FAANG",
		mode: "INDIVIDUAL",
		value: 20,
	},
	{
		id: "233",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
];

export const INDUSTRY_TYPES = [
	"Technology / Software",
	"Marketing & Advertising",
	"Design & Creative",
	"Education",
	"Consulting",
	"Finance & Accounting",
	"Healthcare",
	"Real Estate",
	"E-commerce & Retail",
	"Media & Entertainment",
	"Construction & Engineering",
	"Legal Services",
	"Manufacturing",
	"Non-profit / NGO",
	"Government / Public Sector",
	"Hospitality & Tourism",
	"Human Resources",
	"Research & Development",
	"Startups",
	"Other",
];

export const TEAM_SIZE = [
	"2-5",
	"6-10",
	"11-20",
	"21-50",
	"51-100",
	"101-250",
	"251-500",
	"500+",
];

export const PROTECTEDPERSONALNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: Diamond,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const PROTECTEADMINNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: Diamond,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Members",
		link: "/members",
		icon: Users,
	},
	{
		name: "Teams",
		link: "/teams",
		icon: Group,
	},
	{
		name: "Activity",
		link: "/activity",
		icon: Workflow,
	},
	{
		name: "Notifications",
		link: "/notifications",
		icon: Bell,
	},
	{
		name: "Invite Codes",
		link: "/invite-codes",
		icon: CircleDashed,
	},
	{
		name: "Requests",
		link: "/requests",
		icon: Blocks,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const PROTECTEDMEMBERNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: Diamond,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Members",
		link: "/members",
		icon: Users,
	},
	{
		name: "Teams",
		link: "/teams",
		icon: Group,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const PRIORITY_LEVEL = [
	{
		icon: CircleSlash,
		title: "No Priority",
		value: "NO_PRIORITY" as PriorityLevel,
	},
	{
		icon: Info,
		title: "Urgent",
		value: "URGENT" as PriorityLevel,
	},
	{
		icon: Flame,
		title: "High",
		value: "HIGH" as PriorityLevel,
	},
	{
		icon: Cloud,
		title: "Medium",
		value: "MEDIUM" as PriorityLevel,
	},
	{
		icon: ThermometerSnowflake,
		title: "Low",
		value: "LOW" as PriorityLevel,
	},
];

export const MONTH = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export const DAY = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export const DUMMY_TASK = [
	...Array.from({ length: 200 }, (_, i) => {
		const today = new Date();

		const daysAgo = Math.floor(Math.random() * 60);

		const date = new Date(today);
		date.setDate(today.getDate() - daysAgo);

		return {
			id: `task-${i + 1}`,
			title: `Task ${i + 1} eodnmdnf d fdinfdifdnfdinfdi`,
			priority: [
				PriorityLevel.HIGH,
				PriorityLevel.MEDIUM,
				PriorityLevel.LOW,
				PriorityLevel.URGENT,
				PriorityLevel.NO_PRIORITY,
			][Math.floor(Math.random() * 5)],
			date,
		};
	}),
];

export const motivationalQuotes: Quote[] = [
	{
		text: "Alone we can do so little; together we can do so much.",
		author: "Helen Keller",
	},
	{
		text: "The secret of getting ahead is getting started.",
		author: "Mark Twain",
	},
	{
		text: "Great things in business are never done by one person. They're done by a team of people.",
		author: "Steve Jobs",
	},
	{
		text: "Focus on being productive instead of busy.",
		author: "Tim Ferriss",
	},
];
