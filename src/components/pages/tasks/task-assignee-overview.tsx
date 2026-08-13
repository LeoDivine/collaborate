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
import type { TaskMembers } from "@/lib/types";

export default function TaskAssigneeOverview({
	taskMembers,
}: {
	taskMembers: TaskMembers[];
}) {
	if (!taskMembers || taskMembers.length === 0) {
		return <p className="text-xs text-muted-foreground">Unassigned</p>;
	}

	const visibleMembers = taskMembers.slice(0, 3);
	const remainingCount = taskMembers.length - visibleMembers.length;

	return (
		<div>
			<AvatarGroup className="*:data-[slot=avatar]:ring-transparent">
				{visibleMembers.map((taskMember) => {
					const member = taskMember.member;
					const user = member?.user;
					if (!user) return null;
					const displayName =
						user.fullName || user.userName || user.email;
					return (
						<HoverCard
							key={taskMember.id}
							openDelay={10}
							closeDelay={100}
						>
							<HoverCardTrigger asChild>
								<Avatar>
									<AvatarFallback className="w-full border border-primary bg-secondary text-primary font-bold">
										{getInitials(displayName)}
									</AvatarFallback>
								</Avatar>
							</HoverCardTrigger>
							<HoverCardContent className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5">
								<div className="items-center flex gap-4">
									<div className="flex text-secondary w-[50px] h-[50px] font-extrabold text-[20px] items-center justify-center rounded-full bg-primary">
										{getInitials(displayName)}
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
								<Badge className="mt-[10px] text-[10px] w-fit">
									Task Assignee
								</Badge>
							</HoverCardContent>
						</HoverCard>
					);
				})}

				{remainingCount > 0 && (
					<HoverCard openDelay={10} closeDelay={100}>
						<HoverCardTrigger asChild>
							<AvatarGroupCount className="ring-0 bg-accent text-primary">
								+{remainingCount}
							</AvatarGroupCount>
						</HoverCardTrigger>
						<HoverCardContent className="w-50 bg-accent border-0 text-primary flex text-[13px] flex-col gap-2">
							{taskMembers.slice(3).map((taskMember) => {
								const user = taskMember.member?.user;
								if (!user) return null;
								const displayName =
									user.fullName ||
									user.userName ||
									user.email;
								return (
									<div
										key={taskMember.id}
										className="flex items-center gap-2"
									>
										<div className="flex text-secondary w-[20px] h-[20px] font-extrabold text-[6px] items-center justify-center rounded-full bg-primary">
											{getInitials(displayName)}
										</div>
										<div className="font-semibold">
											{user.userName ?
												`@${user.userName}`
											:	displayName}
										</div>
									</div>
								);
							})}
						</HoverCardContent>
					</HoverCard>
				)}
			</AvatarGroup>
		</div>
	);
}
