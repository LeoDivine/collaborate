"use client";

import React from "react";
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
	children: React.ReactNode;
};

export function TaskDialog({ tasks, children }: TaskDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="min-w-[300px] md:min-w-3xl border border-primary bg-primary text-secondary">
				<DialogHeader>
					<DialogTitle className="text-secondary font-bold">
						{tasks.length} scheduled {tasks.length === 1 ? "task" : "tasks"}
					</DialogTitle>
					<DialogDescription className="text-secondary/80">
						Here are the scheduled tasks for this day.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
					{tasks.map((task) => (
						<TaskProject key={task.id} task={task} isDialogView={true} />
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default TaskDialog;

