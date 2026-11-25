"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getInitials } from "@/lib/utils";
import PresenceIndicator from "@/components/shared/presence-indicator";
import type { TeamMemberItem } from "@/lib/types";

export default function TeamMemberOverview({
	members,
	leadIds = [],
	callerMemberId,
	isSelected = false,
	size = "default",
}: {
	members: TeamMemberItem[];
	leadIds?: string[];
	callerMemberId?: string;
	isSelected?: boolean;
	size?: "sm" | "default";
}) {
	const isCompact = size === "sm";

	if (!members || members.length === 0) {
		return (
			<p
				className={`text-sm ${
					isSelected
						? "text-primary/60 dark:text-zinc-400"
						: "text-secondary/60"
				}`}
			>
				No assignees
			</p>
		);
	}

	const orderedMembers = [...members].sort((a, b) => {
		const aIsLead = leadIds.includes(a.id);
		const bIsLead = leadIds.includes(b.id);
		if (aIsLead === bIsLead) return 0;
		return aIsLead ? -1 : 1;
	});

	const visibleMembers = orderedMembers.slice(0, 3);
	const remainingCount = orderedMembers.length - visibleMembers.length;

	return (
		<div onClick={(e) => e.stopPropagation()}>
			<AvatarGroup
				className={`flex ${isCompact ? "-space-x-1.5" : "-space-x-2"} ${
					isSelected
						? "*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-secondary"
						: "*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-primary"
				}`}
			>
				{visibleMembers.map((member) => {
					const user = member.user;
					const displayName =
						user.fullName || user.userName || user.email;
					const userId = user.id || member.userId;
					const isLead = leadIds.includes(member.id);
					return (
						<HoverCard
							key={member.id}
							openDelay={10}
							closeDelay={100}
						>
							<HoverCardTrigger asChild>
								<Avatar
									className={`${isCompact ? "size-6" : "size-8"} cursor-pointer`}
								>
									<AvatarFallback
										className={`w-full font-bold ${isCompact ? "text-[10px]" : "text-xs"} shadow-xs transition-colors ${
											isSelected
												? "border border-primary bg-primary text-secondary"
												: "border border-secondary bg-secondary text-primary"
										}`}
									>
										{getInitials(displayName)}
									</AvatarFallback>
								</Avatar>
							</HoverCardTrigger>
							<HoverCardContent className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5">
								<div className="items-center flex gap-4">
									<div className="relative inline-flex shrink-0">
										<div className="flex text-accent w-[50px] h-[50px] font-extrabold text-[20px] items-center justify-center rounded-full bg-primary">
											{getInitials(displayName)}
										</div>
										<span className="absolute bottom-0 right-0 leading-none">
											<PresenceIndicator
												userId={userId}
												size="sm"
												ringColor="ring-accent"
											/>
										</span>
									</div>
									<div>
										{user.userName && (
											<p className="font-semibold text-[13px]">
												@{user.userName}
											</p>
										)}
										<p className="font-semibold">
											{displayName}
										</p>
										<p className="text-[13px]">
											{user.email}
										</p>
									</div>
								</div>
								<Badge className="mt-[10px] text-[10px]">
									{isLead ? "TEAM LEAD" : "TEAM MEMBER"}
								</Badge>
							</HoverCardContent>
						</HoverCard>
					);
				})}

				{remainingCount > 0 && (
					<HoverCard openDelay={10} closeDelay={100}>
						<HoverCardTrigger asChild>
							<AvatarGroupCount
								className={`${isCompact ? "size-6 text-[10px]" : "size-8 text-xs"} rounded-full font-bold ring-2 shadow-xs transition-colors flex items-center justify-center ${
									isSelected
										? "ring-secondary bg-primary text-secondary border border-primary"
										: "ring-primary bg-secondary text-primary border border-secondary"
								}`}
							>
								+{remainingCount}
							</AvatarGroupCount>
						</HoverCardTrigger>
						<HoverCardContent className="w-50 bg-accent border-0 text-primary flex text-[13px] flex-col gap-2">
							{orderedMembers.slice(3).map((member) => {
								const user = member.user;
								const displayName =
									user.fullName ||
									user.userName ||
									user.email;
								const userId = user.id || member.userId;
								const isLead = leadIds.includes(member.id);
								return (
									<HoverCard
										key={member.id}
										openDelay={10}
										closeDelay={100}
									>
										<HoverCardTrigger asChild>
											<div
												key={member.id}
												className="flex items-center gap-2 cursor-pointer"
											>
												<div className="relative inline-flex shrink-0">
													<div className="flex text-accent w-[20px] h-[20px] font-extrabold text-[6px] items-center justify-center rounded-full bg-primary">
														{getInitials(displayName)}
													</div>
													<span className="absolute -bottom-0.5 -right-0.5 leading-none">
														<PresenceIndicator
															userId={userId}
															size="xs"
															ringColor="ring-accent"
														/>
													</span>
												</div>
												<div className="font-semibold">
													{user.userName
														? `@${user.userName}`
														: displayName}
												</div>
											</div>
										</HoverCardTrigger>
										<HoverCardContent
											side="right"
											className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5"
										>
											<div className="items-center flex gap-4">
												<div className="relative inline-flex shrink-0">
													<div className="flex text-accent w-[50px] h-[50px] font-extrabold text-[20px] items-center justify-center rounded-full bg-primary">
														{getInitials(displayName)}
													</div>
													<span className="absolute bottom-0 right-0 leading-none">
														<PresenceIndicator
															userId={userId}
															size="sm"
															ringColor="ring-accent"
														/>
													</span>
												</div>
												<div>
													{user.userName && (
														<p className="font-semibold text-[13px]">
															@{user.userName}
														</p>
													)}
													<p className="font-semibold">
														{displayName}
													</p>
													<p className="text-[13px]">
														{user.email}
													</p>
												</div>
											</div>
											<Badge className="mt-[10px] text-[10px]">
												{isLead
													? "TEAM LEAD"
													: "TEAM MEMBER"}
											</Badge>
										</HoverCardContent>
									</HoverCard>
								);
							})}
						</HoverCardContent>
					</HoverCard>
				)}
			</AvatarGroup>
		</div>
	);
}
