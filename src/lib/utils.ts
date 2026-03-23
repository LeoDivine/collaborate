import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeskMode, WorkspaceRoles } from "../../generated/prisma/enums";
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
