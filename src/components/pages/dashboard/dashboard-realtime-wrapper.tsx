"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";

export default function DashboardRealtimeWrapper({
	workspaceId,
	children,
}: {
	workspaceId?: string;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const triggerRefresh = () => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		debounceTimerRef.current = setTimeout(() => {
			router.refresh();
		}, 300);
	};

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	useWorkspaceRealtime(workspaceId, {
		onActivityCreated: () => triggerRefresh(),
		onProjectCreated: () => triggerRefresh(),
		onProjectUpdated: () => triggerRefresh(),
		onProjectDeleted: () => triggerRefresh(),
		onTaskCreated: () => triggerRefresh(),
		onTaskUpdated: () => triggerRefresh(),
		onTaskDeleted: () => triggerRefresh(),
		onMemberJoined: () => triggerRefresh(),
	});

	return <>{children}</>;
}
