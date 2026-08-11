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
import { ProjectMember } from "../../../../generated/prisma/client";
import type { ProjectMembers } from "@/lib/types";

export default function AssigneeOverview({
	projectMembers,
}: {
	projectMembers: ProjectMembers[];
}) {
	if (!projectMembers || projectMembers.length === 0) {
		return <p className=" text-sm text-muted-foreground">No assignees</p>;
	}

	const orderedMembers = [...projectMembers].sort((a, b) => {
		const aIsLead = a.projectRole === "PROJECT_LEAD";
		const bIsLead = b.projectRole === "PROJECT_LEAD";
		if (aIsLead === bIsLead) return 0;
		return aIsLead ? -1 : 1;
	});

	const visibleMembers = orderedMembers.slice(0, 3);
	const remainingCount = orderedMembers.length - visibleMembers.length;

	return (
		<div>
			<AvatarGroup className=" *:data-[slot=avatar]:ring-transparent">
				{visibleMembers.map((projectMember) => {
					const member = projectMember.member;
					const user = member.user;
					const displayName =
						user.fullName || user.userName || user.email;
					return (
						<HoverCard
							key={projectMember.id}
							openDelay={10}
							closeDelay={100}
						>
							<HoverCardTrigger asChild>
								<Avatar>
									<AvatarFallback className=" w-full border border-primary bg-secondary text-primary font-bold">
										{getInitials(displayName)}
									</AvatarFallback>
								</Avatar>
							</HoverCardTrigger>
							<HoverCardContent className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5">
								<div className=" items-center flex gap-4">
									<div className="  flex text-accent w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full bg-primary">
										{getInitials(displayName)}
									</div>
									<div>
										{user.userName && (
											<p className=" font-semibold text-[13px]">
												@{user.userName}
											</p>
										)}
										<p className=" font-semibold">
											{displayName}
										</p>
										<p className=" text-[13px]">
											{user.email}
										</p>
									</div>
								</div>
								<Badge className=" mt-[10px] text-[10px]">
									{projectMember.projectRole.replace(
										"_",
										" ",
									)}
								</Badge>
							</HoverCardContent>
						</HoverCard>
					);
				})}

				{remainingCount > 0 && (
					<HoverCard openDelay={10} closeDelay={100}>
						<HoverCardTrigger asChild>
							<AvatarGroupCount className=" ring-0 bg-accent text-primary">
								+{remainingCount}
							</AvatarGroupCount>
						</HoverCardTrigger>
						<HoverCardContent className=" w-50 bg-accent border-0 text-primary flex text-[13px] flex-col gap-2">
							{orderedMembers.slice(3).map((projectMember) => {
								const member = projectMember.member;
								const user = member.user;
								const displayName =
									user.fullName ||
									user.userName ||
									user.email;
								return (
									<HoverCard
										key={projectMember.id}
										openDelay={10}
										closeDelay={100}
									>
										<HoverCardTrigger asChild>
											<div
												key={projectMember.id}
												className=" flex items-center gap-2"
											>
												<div className="  flex text-accent w-[20px] h-[20px]  font-extrabold text-[6px] items-center justify-center  rounded-full bg-primary">
													{getInitials(displayName)}
												</div>
												<div className=" font-semibold">
													{user.userName ?
														`@${user.userName}`
													:	displayName}
												</div>
											</div>
										</HoverCardTrigger>
										<HoverCardContent
											side="right"
											className="flex w-full bg-accent border-accent text-primary flex-col gap-0.5"
										>
											<div className=" items-center flex gap-4">
												<div className="  flex text-accent w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full bg-primary">
													{getInitials(displayName)}
												</div>
												<div>
													{user.userName && (
														<p className=" font-semibold text-[13px]">
															@{user.userName}
														</p>
													)}
													<p className=" font-semibold">
														{displayName}
													</p>
													<p className=" text-[13px]">
														{user.email}
													</p>
												</div>
											</div>
											<Badge className=" mt-[10px] text-[10px]">
												{projectMember.projectRole.replace(
													"_",
													" ",
												)}
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
