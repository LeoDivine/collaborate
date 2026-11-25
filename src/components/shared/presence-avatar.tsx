"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { PresenceIndicator } from "./presence-indicator";

export interface PresenceAvatarProps {
	userId?: string | null;
	name?: string | null;
	src?: string | null;
	size?: "xs" | "sm" | "default" | "md" | "lg" | "xl";
	className?: string;
	avatarClassName?: string;
	fallbackClassName?: string;
	ringColor?: string;
	indicatorSize?: "xs" | "sm" | "md" | "lg";
	showPresence?: boolean;
	isOnline?: boolean;
}

export function PresenceAvatar({
	userId,
	name,
	src,
	size = "default",
	className,
	avatarClassName,
	fallbackClassName,
	ringColor = "ring-primary",
	indicatorSize,
	showPresence = true,
	isOnline,
}: PresenceAvatarProps) {
	const sizeMap = {
		xs: { avatar: "size-5", textSize: "text-[8px] tracking-tight", ind: "xs" as const },
		sm: { avatar: "size-6", textSize: "text-[9px] tracking-tight", ind: "xs" as const },
		default: { avatar: "size-8", textSize: "text-xs", ind: "sm" as const },
		md: { avatar: "size-9", textSize: "text-xs", ind: "sm" as const },
		lg: { avatar: "size-10", textSize: "text-sm", ind: "md" as const },
		xl: { avatar: "size-12", textSize: "text-base", ind: "lg" as const },
	};

	const currentSize = sizeMap[size] || sizeMap.default;
	const effectiveIndicatorSize = indicatorSize || currentSize.ind;

	return (
		<div className={cn("relative inline-flex shrink-0 select-none", className)}>
			<Avatar className={cn(currentSize.avatar, avatarClassName)}>
				{src && <AvatarImage src={src} alt={name || "Avatar"} />}
				<AvatarFallback
					className={cn(
						"size-full font-bold bg-accent text-primary leading-none select-none",
						currentSize.textSize,
						fallbackClassName,
					)}
				>
					{getInitials(name || "User")}
				</AvatarFallback>
			</Avatar>
			{showPresence && (
				<span className="absolute bottom-0 right-0 leading-none">
					<PresenceIndicator
						userId={userId}
						isOnline={isOnline}
						size={effectiveIndicatorSize}
						ringColor={ringColor}
					/>
				</span>
			)}
		</div>
	);
}

export default PresenceAvatar;
