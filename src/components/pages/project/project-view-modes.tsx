import { Button } from "@/components/ui/button";
import { JSX } from "react";

export type ProjectViewMode =
	| "list"
	| "kanban"
	| "table"
	| "timeline"
	| "gantt";

interface ProjectViewModesProps {
	modes: ProjectViewMode[];
	viewMode: ProjectViewMode;
	modeIcons: Record<ProjectViewMode, JSX.Element>;
	onModeChange: (mode: ProjectViewMode) => void;
}

export default function ProjectViewModes({
	modes,
	viewMode,
	modeIcons,
	onModeChange,
}: ProjectViewModesProps) {
	return (
		<div className=" flex flex-wrap items-center gap-2">
			{modes.map((mode) => (
				<Button
					key={mode}
					variant={viewMode === mode ? "default" : "outline"}
					className={
						viewMode === mode ?
							" rounded-full capitalize gap-2"
						:	" rounded-full capitalize gap-2 bg-accent border-0 text-primary"
					}
					onClick={() => onModeChange(mode)}
				>
					{modeIcons[mode]}
					{mode}
				</Button>
			))}
		</div>
	);
}
