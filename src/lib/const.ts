import {
	Bell,
	Blocks,
	Box,
	CalendarDays,
	LayoutDashboard,
	ListTodo,
	Settings,
	Users,
	CircleDashed,
	Workflow,
	Group,
} from "lucide-react";

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
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
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
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
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
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
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
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
