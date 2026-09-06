"use client";

import { useState, useEffect, useCallback } from "react";

const RECENT_PROJECTS_KEY_PREFIX = "collaborate_recent_projects_";
const MAX_RECENTS = 5;

export function getRecentProjectIds(workspaceId?: string): string[] {
	if (typeof window === "undefined" || !workspaceId) return [];
	try {
		const raw = localStorage.getItem(`${RECENT_PROJECTS_KEY_PREFIX}${workspaceId}`);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.error("Failed to read recent projects from localStorage:", e);
		return [];
	}
}

export function saveRecentProjectId(workspaceId?: string, projectId?: string): void {
	if (typeof window === "undefined" || !workspaceId || !projectId || projectId === "ALL") return;
	try {
		const existing = getRecentProjectIds(workspaceId);
		const filtered = existing.filter((id) => id !== projectId);
		const updated = [projectId, ...filtered].slice(0, MAX_RECENTS);
		localStorage.setItem(`${RECENT_PROJECTS_KEY_PREFIX}${workspaceId}`, JSON.stringify(updated));
		// Dispatch custom event to notify other mounted hooks/components in the window
		window.dispatchEvent(
			new CustomEvent("collaborate:recent_projects_updated", {
				detail: { workspaceId, recentProjectIds: updated },
			}),
		);
	} catch (e) {
		console.error("Failed to save recent project to localStorage:", e);
	}
}

export function useRecentProjects(workspaceId?: string) {
	const [recentProjectIds, setRecentProjectIds] = useState<string[]>(() =>
		getRecentProjectIds(workspaceId),
	);

	useEffect(() => {
		setRecentProjectIds(getRecentProjectIds(workspaceId));

		const handleUpdate = (e: Event) => {
			const customEvent = e as CustomEvent<{ workspaceId: string; recentProjectIds: string[] }>;
			if (customEvent.detail?.workspaceId === workspaceId) {
				setRecentProjectIds(customEvent.detail.recentProjectIds);
			}
		};

		window.addEventListener("collaborate:recent_projects_updated", handleUpdate);
		return () => {
			window.removeEventListener("collaborate:recent_projects_updated", handleUpdate);
		};
	}, [workspaceId]);

	const addRecentProject = useCallback(
		(projectId: string) => {
			saveRecentProjectId(workspaceId, projectId);
		},
		[workspaceId],
	);

	return { recentProjectIds, addRecentProject };
}
