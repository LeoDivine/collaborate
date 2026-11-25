"use client";

import { cn } from "@/lib/utils";
import { usePusher } from "@/components/providers/pusher-provider";

export interface PresenceIndicatorProps {
	userId?: string | null;
	isOnline?: boolean;
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
	ringColor?: string;
	showOffline?: boolean;
}

export function PresenceIndicator({
	userId,
	isOnline: propIsOnline,
	size = "sm",
	className,
	ringColor = "ring-primary",
	showOffline = true,
}: PresenceIndicatorProps) {
	const { isUserOnline } = usePusher();
	const online =
		propIsOnline !== undefined ? propIsOnline : isUserOnline(userId);

	if (!online && !showOffline) return null;

	const sizeClasses = {
		xs: "w-1.5 h-1.5",
		sm: "w-2 h-2",
		md: "w-2.5 h-2.5",
		lg: "w-3.5 h-3.5",
	}[size];

	return (
		<span
			className={cn(
				"rounded-full ring-2 shrink-0 transition-colors inline-block",
				ringColor,
				sizeClasses,
				online ? "bg-emerald-500" : "bg-zinc-500",
				className,
			)}
			title={online ? "Online" : "Offline"}
		/>
	);
}

export default PresenceIndicator;
