"use client";

import type { MembersUsers, Projects } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProjectViewHeader from "./project-view-header";
import ProjectTable from "./project-table";
import { useWorkspaceRealtime } from "@/hooks/use-pusher";

export default function ProjectView({
	isCreating,
	members = [],
	workspaceId,
	initialTotal = 0,
	projects = [],
	projectsTotal = 0,
	currentUserId,
	currentMemberId,
}: {
	isCreating: string;
	members: MembersUsers[];
	workspaceId: string;
	initialTotal: number;
	projects: Projects[];
	projectsTotal: number;
	currentUserId?: string;
	currentMemberId?: string;
}) {
	const searchParams = useSearchParams();
	const creating = searchParams.get("creating") || isCreating;

	const [open, setOpen] = useState(creating === "false" ? false : true);
	const [projectList, setProjectList] = useState<Projects[]>(projects || []);
	const [total, setTotal] = useState<number>(projectsTotal || 0);

	useEffect(() => {
		setProjectList((prev) => {
			const serverProjects = projects || [];
			if (serverProjects.length === 0) return prev.length > 0 ? prev : [];
			const serverIds = new Set(serverProjects.map((p) => p.id));
			const localOnly = prev.filter((p) => !serverIds.has(p.id));
			return [...localOnly, ...serverProjects];
		});
		setTotal(projectsTotal || 0);
	}, [projects, projectsTotal]);

	useWorkspaceRealtime(workspaceId, {
		onProjectCreated: (data: any) => {
			const newProject = data?.project || data;
			if (newProject && newProject.id) {
				setProjectList((prev) => {
					if (prev.some((p) => p.id === newProject.id)) {
						return prev.map((p) => (p.id === newProject.id ? { ...p, ...newProject } : p));
					}
					return [newProject, ...prev];
				});
				setTotal((prev) => prev + 1);
			}
		},
		onProjectUpdated: (data: any) => {
			const projectId = data?.projectId || data?.project?.id || data?.id;
			const updatedProject = data?.project;
			const updates = data?.updates || (data?.project ? undefined : data);
			if (projectId) {
				setProjectList((prev) =>
					prev.map((p) => {
						if (p.id === projectId) {
							return updatedProject ?
									{ ...p, ...updatedProject }
								:	{ ...p, ...(updates || {}) };
						}
						return p;
					}),
				);
			}
		},
		onProjectDeleted: (data: any) => {
			const projectId = data?.projectId || data?.id;
			if (projectId) {
				setProjectList((prev) => prev.filter((p) => p.id !== projectId));
				setTotal((prev) => Math.max(0, prev - 1));
			}
		},
		onTaskCreated: (data: any) => {
			const newTask = data?.task || data;
			if (newTask && newTask.projectId) {
				setProjectList((prev) =>
					prev.map((p) => {
						if (p.id === newTask.projectId) {
							const existingTasks = p.tasks || [];
							if (existingTasks.some((t: any) => t.id === newTask.id)) return p;
							return { ...p, tasks: [newTask, ...existingTasks] };
						}
						return p;
					}),
				);
			}
		},
		onTaskUpdated: (data: any) => {
			const taskId = data?.taskId || data?.task?.id || data?.id;
			const updatedTask = data?.task;
			const updates = data?.updates;
			if (taskId) {
				setProjectList((prev) =>
					prev.map((p) => {
						if (!p.tasks || !p.tasks.some((t: any) => t.id === taskId)) return p;
						return {
							...p,
							tasks: p.tasks.map((t: any) => {
								if (t.id === taskId) {
									return updatedTask ? { ...t, ...updatedTask } : { ...t, ...(updates || {}) };
								}
								return t;
							}),
						};
					}),
				);
			}
		},
		onTaskDeleted: (data: any) => {
			const taskId = data?.taskId || data?.id;
			if (taskId) {
				setProjectList((prev) =>
					prev.map((p) => {
						if (!p.tasks || !p.tasks.some((t: any) => t.id === taskId)) return p;
						return {
							...p,
							tasks: p.tasks.filter((t: any) => t.id !== taskId),
						};
					}),
				);
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
			<ProjectViewHeader
				projectsTotal={total}
				open={open}
				members={members}
				workspaceId={workspaceId}
				initialTotal={initialTotal}
				onOpenDialog={handleOpenDialog}
				onDialogChange={handleDialogChange}
			/>
			<ProjectTable
				project={projectList}
				totalItems={total}
				members={members}
				workspaceId={workspaceId}
				currentUserId={currentUserId}
				currentMemberId={currentMemberId}
			/>
		</div>
	);
}
