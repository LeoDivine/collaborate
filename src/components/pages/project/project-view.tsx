"use client";

import { MembersUsers, ProjectWithMembers } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProjectViewHeader from "./project-view-header";

export default function ProjectView({
	isCreating,
	members,
	workspaceId,
	initialTotal,
	projects,
	projectsTotal,
}: {
	isCreating: string;
	members: MembersUsers[];
	workspaceId: string;
	initialTotal: number;
	projects: ProjectWithMembers[];
	projectsTotal: number;
}) {
	const searchParams = useSearchParams();
	const creating = searchParams.get("creating") || isCreating;

	const [open, setOpen] = useState(creating === "false" ? false : true);

	useEffect(() => {
		if (creating === "false") {
			setOpen(false);
		} else if (creating === "true") {
			setOpen(true);
		}
	}, [creating]);

	const router = useRouter();
	const pathname = usePathname();

	const handleOpenDialog = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("creating", "true");
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleDialogChange = (nextOpen: boolean) => {
		setOpen(nextOpen);

		if (!nextOpen) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("creating");
			const nextQuery = params.toString();

			router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
		}
	};

	return (
		<div>
			<ProjectViewHeader
				projectsTotal={projectsTotal}
				open={open}
				members={members}
				workspaceId={workspaceId}
				initialTotal={initialTotal}
				onOpenDialog={handleOpenDialog}
				onDialogChange={handleDialogChange}
			/>
			<div className="">dofdofo</div>
		</div>
	);
}
