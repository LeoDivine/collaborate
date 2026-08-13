"use client";

import type { MembersUsers, Projects, Tasks } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TaskTable from "./task-table";
import TaskViewHeader from "./task-view-header";

export default function TaskView({
	isCreating,
	members = [],
	projects = [],
	tasks = [],
	workspaceId,
	currentUserId,
	currentMemberId,
	tasksTotal = 0,
	initialTotal = 0,
}: {
	isCreating: string;
	members: MembersUsers[];
	projects: Projects[];
	tasks: Tasks[];
	workspaceId: string;
	currentUserId?: string;
	currentMemberId: string;
	tasksTotal: number;
	initialTotal?: number;
}) {
	const searchParams = useSearchParams();
	const creating = searchParams.get("creating") || isCreating;

	const [open, setOpen] = useState(creating === "true");

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
			<TaskViewHeader
				tasksTotal={tasksTotal}
				open={open}
				members={members}
				projects={projects}
				workspaceId={workspaceId}
				currentMemberId={currentMemberId}
				initialTotal={initialTotal}
				onOpenDialog={handleOpenDialog}
				onDialogChange={handleDialogChange}
			/>
			<TaskTable
				tasks={tasks}
				projects={projects}
				currentUserId={currentUserId}
				totalItems={tasksTotal}
			/>
		</div>
	);
}
