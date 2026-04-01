"use client";

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
	value,
	role,
	id,
}: {
	role: WorkspaceRoles;
	id: string;
	title: string;
	value?: number;
	mode: DeskMode;
}) {
	const { update } = useSession();
	const router = useRouter();

	const handleSelectWorkspace = async () => {
		await update({
			currentWorkspaceId: id,
			currentWorkspaceMode: mode,
			currentWorkspaceRole: role,
			currentWorkspaceName: title,
		});
		router.push("/dashboard");
	};
	return (
		<div
			onClick={() => {
				handleSelectWorkspace();
			}}
			className=" cursor-pointer text-primary px-[20px] rounded-[20px] py-[20px] bg-accent w-full"
		>
			<div className=" flex items-center justify-between ">
				<div className=" flex items-center gap-4">
					<div className="">
						<div className=" p-[10px] rounded-full bg-secondary font-extrabold">
							{getInitials(title)}
						</div>
					</div>
					<div className=" text-[13px]">
						<p>{title}</p>
						{mode === "INDIVIDUAL" ?
							<p>Projects: {value} project(s)</p>
						:	<p>Members: {value} member(s)</p>}
					</div>
				</div>
				<div className="">
					<MoveRight />
				</div>
			</div>
		</div>
	);
}
