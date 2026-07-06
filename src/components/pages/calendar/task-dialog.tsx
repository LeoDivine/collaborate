import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DUMMY_TASK } from "@/lib/const";
import TaskProject from "./task-project";

type TaskDialogProps = {
	tasks: typeof DUMMY_TASK;
	children: React.ReactNode;
};

export function TaskDialog({ tasks, children }: TaskDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="min-w-[300px] md:min-w-3xl border-0">
				<DialogHeader>
					<DialogTitle className="text-primary">
						{tasks.length} scheduled {tasks.length === 1 ? "task" : "tasks"}
					</DialogTitle>
					<DialogDescription>
						Here are the scheduled tasks for this day.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
					{tasks.map((task) => (
						<TaskProject key={task.id} {...task} isDialogView={true} />
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default TaskDialog;
