"use client";

import CreateTask from "@/components/forms/create-task";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { MembersUsers, Projects } from "@/lib/types";
import { Diamond, Plus, Squircle } from "lucide-react";

interface TaskViewHeaderProps {
	tasksTotal: number;
	open: boolean;
	members: MembersUsers[];
	projects: Projects[];
	workspaceId: string;
	currentMemberId: string;
	initialTotal?: number;
	defaultStartDate?: Date;
	defaultProjectId?: string;
	onOpenDialog: () => void;
	onDialogChange: (nextOpen: boolean) => void;
}

export default function TaskViewHeader({
	tasksTotal,
	open,
	members,
	projects,
	workspaceId,
	currentMemberId,
	initialTotal = 0,
	defaultStartDate,
	defaultProjectId,
	onOpenDialog,
	onDialogChange,
}: TaskViewHeaderProps) {
	return (
		<div className="flex justify-between items-center">
			<div className="flex items-center gap-2.5">
				<Diamond className="w-5 h-5 text-primary" />
				<p className="text-[20px] font-bold text-primary">
					Tasks ({tasksTotal})
				</p>
			</div>

			<Dialog open={open} onOpenChange={onDialogChange}>
				<DialogTrigger asChild>
					<Button onClick={onOpenDialog} className="rounded-full hover:bg-primary hover:text-secondary">
						<Plus />
						New Task
					</Button>
				</DialogTrigger>
				<DialogContent className="w-full sm:max-w-3xl lg:max-w-6xl rounded-[20px] border-0 bg-primary">
					<DialogHeader>
						<DialogTitle className="text-secondary flex items-center gap-3">
							<Diamond className="text-accent" />
							New Task
						</DialogTitle>
						<CreateTask
							projects={projects}
							members={members}
							workspaceId={workspaceId}
							currentMemberId={currentMemberId}
							initialTotal={initialTotal}
							defaultStartDate={defaultStartDate}
							defaultProjectId={defaultProjectId}
							onSuccess={() => onDialogChange(false)}
						/>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	);
}
