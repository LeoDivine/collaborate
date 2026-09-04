"use client";

import type { MembersUsers, Projects, Tasks } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TaskTable from "./task-table";
import TaskViewHeader from "./task-view-header";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";

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
	const [taskList, setTaskList] = useState<Tasks[]>(tasks || []);
	const [total, setTotal] = useState<number>(tasksTotal || 0);

	useEffect(() => {
		setTaskList((prev) => {
			const serverTasks = tasks || [];
			if (serverTasks.length === 0) return prev.length > 0 ? prev : [];
			const serverIds = new Set(serverTasks.map((t) => t.id));
			const localOnly = prev.filter((t) => !serverIds.has(t.id));
			return [...localOnly, ...serverTasks];
		});
		setTotal(tasksTotal || 0);
	}, [tasks, tasksTotal]);

	useWorkspaceRealtime(workspaceId, {
		onTaskCreated: (data: any) => {
			const newTask = data?.task || data;
			if (newTask && newTask.id) {
				setTaskList((prev) => {
					if (prev.some((t) => t.id === newTask.id)) {
						return prev.map((t) => (t.id === newTask.id ? { ...t, ...newTask } : t));
					}
					return [newTask, ...prev];
				});
				setTotal((prev) => prev + 1);
			}
		},
		onTaskUpdated: (data: any) => {
			const taskId = data?.taskId || data?.task?.id || data?.id;
			const updatedTask = data?.task;
			const updates = data?.updates || (data?.task ? undefined : data);
			if (taskId) {
				setTaskList((prev) =>
					prev.map((t) => {
						if (t.id === taskId) {
							return updatedTask ?
									{ ...t, ...updatedTask }
								:	{ ...t, ...(updates || {}) };
						}
						return t;
					}),
				);
			}
		},
		onTaskDeleted: (data: any) => {
			const taskId = data?.taskId || data?.id;
			if (taskId) {
				setTaskList((prev) => prev.filter((t) => t.id !== taskId));
				setTotal((prev) => Math.max(0, prev - 1));
			}
		},
	});

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
				tasksTotal={total}
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
				tasks={taskList}
				projects={projects}
				members={members}
				workspaceId={workspaceId}
				currentUserId={currentUserId}
				currentMemberId={currentMemberId}
				totalItems={total}
			/>
		</div>
	);
}
