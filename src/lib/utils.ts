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
