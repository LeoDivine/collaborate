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
			return PROTECTEDPERSONALNAVBAR;
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
			return " bg-[#B1AD44]";
		case "MEMBER":
			return " bg-accent text-primary";
		case "OWNER":
			return "bg-destructive";
	}
};

export const renderStatusBadge = (status: MemberStatus) => {
	switch (status) {
		case "ACTIVE":
			return " bg-success";
		case "INACTIVE":
			return " bg-accent text-primary";
	}
};

const formatEnumLabel = (value: string) => value.replace(/_/g, " ");

export const PROJECT_STATUS_LABELS: Record<Status, string> = {
	TODO: formatEnumLabel(Status.TODO),
	IN_PROGRESS: formatEnumLabel(Status.IN_PROGRESS),
	ON_HOLD: formatEnumLabel(Status.ON_HOLD),
	COMPLETED: formatEnumLabel(Status.COMPLETED),
	CANCELLED: formatEnumLabel(Status.CANCELLED),
};

export const PROJECT_PRIORITY_LABELS: Record<PriorityLevel, string> = {
	NO_PRIORITY: formatEnumLabel(PriorityLevel.NO_PRIORITY),
	URGENT: formatEnumLabel(PriorityLevel.URGENT),
	HIGH: formatEnumLabel(PriorityLevel.HIGH),
	MEDIUM: formatEnumLabel(PriorityLevel.MEDIUM),
	LOW: formatEnumLabel(PriorityLevel.LOW),
};

export const getProjectStatusLabel = (status: Status) => {
	return formatEnumLabel(status);
};

export const getProjectPriorityLabel = (priority: PriorityLevel) => {
	return formatEnumLabel(priority);
};

export const PROJECT_STATUS_COLORS: Record<Status, string> = {
	TODO: "bg-destructive",
	IN_PROGRESS: "bg-[#33419D]",
	ON_HOLD: "bg-[#5D5252]",
	COMPLETED: "bg-success text-primary",
	CANCELLED: "bg-destructive text-primary",
};

export const PROJECT_PRIORITY_COLORS: Record<PriorityLevel, string> = {
	NO_PRIORITY: "bg-muted text-muted-foreground",
	URGENT: "bg-destructive text-primary",
	HIGH: "bg-accent text-primary",
	MEDIUM: "bg-secondary text-secondary-foreground",
	LOW: "bg-muted text-muted-foreground",
};

export const getProjectStatusColor = (status: Status) => {
	return PROJECT_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
};

export const getProjectPriorityColor = (priority: PriorityLevel) => {
	return (
		PROJECT_PRIORITY_COLORS[priority] ?? "bg-muted text-muted-foreground"
	);
};
