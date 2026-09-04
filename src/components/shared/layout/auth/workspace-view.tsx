"use client";

import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
	DeskMode,
	WorkspaceRoles,
} from "../../../../../generated/prisma/enums";

export default function WorkspaceView({
	mode,
	title,
	value = 0,
	role,
	workspaceId,
	memberId,
}: {
	role: WorkspaceRoles;
	workspaceId: string;
	memberId: string;
	title: string;
	value?: number;
	mode: DeskMode;
}) {
	const { update } = useSession();
	const router = useRouter();

	const handleSelectWorkspace = async () => {
		await update({
			currentWorkspaceId: workspaceId,
			currentWorkspaceMode: mode,
			currentWorkspaceRole: role,
			currentWorkspaceName: title,
			currentMemberId: memberId,
		});
		router.push("/dashboard");
	};

	return (
		<div
			onClick={() => {
				void handleSelectWorkspace();
			}}
			className="group cursor-pointer text-primary px-4 py-3 sm:px-5 sm:py-4 rounded-2xl bg-[#969696] hover:bg-[#8c8c8c] border border-primary/10 transition-all duration-200 w-full"
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3.5 min-w-0">
					<div className="shrink-0 size-11 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-sm shadow-xs">
						{getInitials(title)}
					</div>
					<div className="text-sm min-w-0">
						<div className="flex items-center gap-2">
							<p className="font-semibold text-primary truncate max-w-[160px] sm:max-w-[220px]">
								{title}
							</p>
							{role && (
								<Badge
									className="text-[10px] uppercase tracking-wider px-1.5 py-0 bg-primary text-secondary border-none font-normal shrink-0"
								>
									{role}
								</Badge>
							)}
						</div>
						<p className="text-xs text-primary/70 mt-0.5">
							{mode === "INDIVIDUAL"
								? `${value} project${value === 1 ? "" : "s"}`
								: `${value} member${value === 1 ? "" : "s"}`}
						</p>
					</div>
				</div>
				<div className="shrink-0 text-primary/70 group-hover:text-primary transition-colors">
					<MoveRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
				</div>
			</div>
		</div>
	);
}
