import CreateProject from "@/components/forms/create-project";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { MembersUsers } from "@/lib/types";
import { Box, Plus } from "lucide-react";

interface ProjectViewHeaderProps {
	projectsTotal: number;
	open: boolean;
	members: MembersUsers[];
	workspaceId: string;
	initialTotal: number;
	onOpenDialog: () => void;
	onDialogChange: (nextOpen: boolean) => void;
}

export default function ProjectViewHeader({
	projectsTotal,
	open,
	members,
	workspaceId,
	initialTotal,
	onOpenDialog,
	onDialogChange,
}: ProjectViewHeaderProps) {
	return (
		<div className="flex justify-between items-center">
			<div className="flex items-center gap-2.5">
				<Box className="w-5 h-5 text-primary" />
				<p className="text-[20px] font-bold text-primary">
					Projects ({projectsTotal})
				</p>
			</div>

			<Dialog open={open} onOpenChange={onDialogChange}>
				<DialogTrigger asChild>
					<Button onClick={onOpenDialog} className=" rounded-full">
						<Plus />
						New Project
					</Button>
				</DialogTrigger>
				<DialogContent className="w-full sm:max-w-3xl lg:max-w-6xl rounded-[20px] border-0 bg-primary">
					<DialogHeader>
						<DialogTitle className=" text-accent flex items-center gap-3">
							<Box />
							New Project
						</DialogTitle>
						<CreateProject
							members={members}
							workspaceId={workspaceId}
							initialTotal={initialTotal}
						/>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	);
}
