import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
	DeskMode,
	MemberStatus,
	PriorityLevel,
	RequestStatus,
	Status,
	WorkspaceRoles,
} from "../../generated/prisma/enums";
import {
	ALPHABET,
	MONTH,
	PROTECTEADMINNAVBAR,
	PROTECTEDMEMBERNAVBAR,
	PROTECTEDPERSONALNAVBAR,
} from "./const";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getInitials(value: string): string {
	if (!value) return "";

	const words = value.trim().split(/\s+/);

	if (words.length > 1) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}

	return words[0].slice(0, 2).toUpperCase();
}

export function generateSlug(text: string) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/--+/g, "-");
}

export function generateSuffix(length = 3) {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
	}
	return result;
}

export const renderNavigationByRole = (
	role: WorkspaceRoles,
	mode: DeskMode,
) => {
	if (role === "OWNER" && mode === "INDIVIDUAL") {
		return PROTECTEDPERSONALNAVBAR;
	}
	switch (role) {
		case "ADMIN":
			return PROTECTEADMINNAVBAR;
		case "MEMBER":
			return PROTECTEDMEMBERNAVBAR;
		case "OWNER":
			return PROTECTEADMINNAVBAR;
		default:
			return PROTECTEDPERSONALNAVBAR;
	}
};

export const renderRequestStatusBadge = (status: RequestStatus) => {
	switch (status) {
		case "ACCEPTED":
			return " bg-success";
		case "PENDING":
			return " bg-destructive";
	}
};

export const renderWorkspaceRoleBadge = (role: WorkspaceRoles) => {
	switch (role) {
		case "ADMIN":
			return " text-primary bg-[#B1AD44]";
		case "MEMBER":
			return " bg-accent text-primary";
		case "OWNER":
			return "bg-destructive";
	}
};

export const renderMemberStatusBadge = (status: MemberStatus) => {
	switch (status) {
		case "ACTIVE":
			return " bg-success";
		case "INACTIVE":
			return " bg-accent text-primary";
	}
};

export const renderMonthByNumber = (value: number) => {
	const month = MONTH[value - 1];
	return month;
};

export const renderPriority = (level: PriorityLevel) => {
	switch (level) {
		case "HIGH":
			return "bg-[#AD3D3D]";
		case "MEDIUM":
			return "bg-[#B1AD44]";
		case "LOW":
			return "bg-[#339D3A]";
		case "NO_PRIORITY":
			return "bg-[#555353]";
		case "URGENT":
			return "bg-[#8D0303]";
		default:
			return "bg-[#555353]";
	}
};

export const renderPriorityLight = (level: PriorityLevel) => {
	switch (level) {
		case "HIGH":
			return "bg-[#AD3D3D]/20";
		case "MEDIUM":
			return "bg-[#B1AD44]/20";
		case "LOW":
			return "bg-[#339D3A]/20";
		case "NO_PRIORITY":
			return "bg-[#555353]/20";
		case "URGENT":
			return "bg-[#8D0303]/20";
		default:
			return "bg-[#555353]/20";
	}
};

export const renderStatus = (status: Status) => {
	switch (status) {
		case "TODO":
			return "bg-[#555353]";
		case "IN_PROGRESS":
			return "bg-[#3B82F6] text-primary";
		case "ON_HOLD":
			return "bg-[#B1AD44] text-primary";
		case "COMPLETED":
			return "bg-[#339D3A]";
		case "CANCELLED":
			return "bg-[#AD3D3D]";
		default:
			return "bg-[#555353]";
	}
};

export const formatStatus = (status?: Status | string | null): string => {
	switch (status) {
		case Status.TODO:
			return "To Do";
		case Status.IN_PROGRESS:
			return "In Progress";
		case Status.ON_HOLD:
			return "On Hold";
		case Status.COMPLETED:
			return "Completed";
		case Status.CANCELLED:
			return "Canceled";
		default:
			return String(status || "").replaceAll("_", " ");
	}
};

export const STATUS_LABELS: Record<Status, string> = {
	[Status.TODO]: "To Do",
	[Status.IN_PROGRESS]: "In Progress",
	[Status.ON_HOLD]: "On Hold",
	[Status.COMPLETED]: "Completed",
	[Status.CANCELLED]: "Canceled",
};

export const STATUS_OPTIONS = [
	{ label: "To Do", value: Status.TODO },
	{ label: "In Progress", value: Status.IN_PROGRESS },
	{ label: "On Hold", value: Status.ON_HOLD },
	{ label: "Completed", value: Status.COMPLETED },
	{ label: "Canceled", value: Status.CANCELLED },
];

export const formatPriority = (priority?: PriorityLevel | string | null): string => {
	switch (priority) {
		case PriorityLevel.URGENT:
			return "Urgent";
		case PriorityLevel.HIGH:
			return "High";
		case PriorityLevel.MEDIUM:
			return "Medium";
		case PriorityLevel.LOW:
			return "Low";
		case PriorityLevel.NO_PRIORITY:
			return "No Priority";
		default:
			return String(priority || "").replaceAll("_", " ");
	}
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
	[PriorityLevel.URGENT]: "Urgent",
	[PriorityLevel.HIGH]: "High",
	[PriorityLevel.MEDIUM]: "Medium",
	[PriorityLevel.LOW]: "Low",
	[PriorityLevel.NO_PRIORITY]: "No Priority",
};

export const PRIORITY_OPTIONS = [
	{ label: "Urgent", value: PriorityLevel.URGENT },
	{ label: "High", value: PriorityLevel.HIGH },
	{ label: "Medium", value: PriorityLevel.MEDIUM },
	{ label: "Low", value: PriorityLevel.LOW },
	{ label: "No Priority", value: PriorityLevel.NO_PRIORITY },
];

export function stripHtml(html?: string | null): string {
	if (!html) return "";
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, " ")
		.trim();
}

export function formatLabel(label?: string | null): string {
	if (!label) return "";
	const cleaned = label.trim().replace(/^#+/, "");
	return cleaned ? `#${cleaned}` : "";
}

