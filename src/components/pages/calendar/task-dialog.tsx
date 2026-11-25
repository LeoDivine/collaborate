"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Diamond, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Tasks } from "@/lib/types";
import TaskProject from "./task-project";

type TaskDialogProps = {
	tasks: Tasks[];
	date?: Date;
	selectedProjectId?: string;
	onTaskUpdate?: (task: Tasks) => void;
	children: React.ReactNode;
};

export function TaskDialog({ tasks, date, selectedProjectId, onTaskUpdate, children }: TaskDialogProps) {
	const formattedDate = date ? format(date, "yyyy-MM-dd") : undefined;
	const projectQuery = selectedProjectId ? `&projectId=${selectedProjectId}` : "";

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="min-w-[300px] md:min-w-3xl border border-primary bg-primary text-secondary">
				<DialogHeader>
					<div className="flex items-center justify-between gap-4">
						<div>
							<DialogTitle className="text-secondary font-bold flex items-center gap-2">
								<Diamond className="w-4 h-4 text-accent shrink-0" />
								<span>
									{date ? `${format(date, "MMMM d, yyyy")} • ` : ""}
									{tasks.length} scheduled {tasks.length === 1 ? "task" : "tasks"}
								</span>
							</DialogTitle>
							<DialogDescription className="text-secondary/80">
								Here are the scheduled tasks for this day.
							</DialogDescription>
						</div>
						{formattedDate && (
							<Link href={`/tasks?creating=true&startDate=${formattedDate}${projectQuery}`}>
								<Button
									size="sm"
									variant="secondary"
									className="rounded-full text-xs gap-1 cursor-pointer shrink-0"
								>
									<Plus className="w-3.5 h-3.5" />
									New Task
								</Button>
							</Link>
						)}
					</div>
				</DialogHeader>
				<div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
					{tasks.map((task) => (
						<TaskProject
							key={task.id}
							task={task}
							isDialogView={true}
							onTaskUpdate={onTaskUpdate}
						/>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default TaskDialog;

