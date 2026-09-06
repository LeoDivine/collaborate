import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatLabel, formatStatus, getInitials, stripHtml } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface ProjectOverviewProps {
	project: {
		id: string;
		title: string;
		description: string;
		labels: string[];
		status: string;
		projectMembers: Array<{
			member: {
				id: string;
				user: {
					fullName: string;
					userName: string | null;
					email: string;
				};
			};
		}>;
	};
}

export default function OngoingProjectsOverview({
	project,
}: ProjectOverviewProps) {
	const visibleMembers = project.projectMembers.slice(0, 2);
	const remainingMembersCount = project.projectMembers.length - 2;

	return (
		<div className="py-[20px] w-full rounded-[20px] px-[20px] bg-[#969696] flex flex-col justify-between">
			<div>
				<div className="flex justify-between items-center gap-2">
					<div className="flex flex-wrap gap-1">
						{project.labels && project.labels.length > 0 ?
							project.labels.slice(0, 2).map((label, index) => (
								<Badge key={index} className="bg-[#AD6B3D] text-white shadow-xs">
									{formatLabel(label)}
								</Badge>
							))
						:	<Badge>{formatStatus(project.status)}</Badge>}
					</div>
					{project.projectMembers.length > 0 && (
						<AvatarGroup className="*:data-[slot=avatar]:ring-transparent shrink-0">
							{visibleMembers.map((pm) => (
								<Avatar key={pm.member.id}>
									<AvatarFallback className="w-full border border-primary bg-secondary text-primary font-bold">
										{getInitials(
											pm.member.user.fullName || "User",
										)}
									</AvatarFallback>
								</Avatar>
							))}
							{remainingMembersCount > 0 && (
								<AvatarGroupCount className="ring-0 bg-primary text-secondary">
									+{remainingMembersCount}
								</AvatarGroupCount>
							)}
						</AvatarGroup>
					)}
				</div>
				<div className="mt-2">
					<p className="text-primary text-[18px] font-semibold line-clamp-1">
						{project.title}
					</p>
					<p className="text-primary line-clamp-3 mt-[4px] text-[12px] opacity-90">
						{stripHtml(project.description) || "No description provided."}
					</p>
				</div>
			</div>
			<div className="mt-[12px]">
				<Link
					href={`/projects/${project.id}`}
					className="flex gap-2 items-center text-primary font-medium hover:underline w-fit"
				>
					<p className="text-[12px]">Details</p>
					<MoveRight strokeWidth={1.5} className="w-4 h-4" />
				</Link>
			</div>
		</div>
	);
}

