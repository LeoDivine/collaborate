"use client";

import CreateProject from "@/components/forms/create-project";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Box, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectView({ isCreating }: { isCreating: string }) {
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
			<div className=" flex justify-between items-center">
				<p className=" text-[20px] font-bold text-primary">
					Projects (20)
				</p>

				<Dialog open={open} onOpenChange={handleDialogChange}>
					<DialogTrigger asChild>
						<Button
							onClick={handleOpenDialog}
							className=" rounded-full"
						>
							<Plus />
							New Project
						</Button>
					</DialogTrigger>
					<DialogContent className=" w-full min-w-6xl rounded-[20px]  border-0 bg-primary">
						<DialogHeader>
							<DialogTitle className=" text-accent flex items-center gap-3">
								<Box />
								New Project
							</DialogTitle>
							<CreateProject />
						</DialogHeader>
					</DialogContent>
				</Dialog>
			</div>

			<div className=" mt-[20px] flex gap-2 flex-col">
				<Input
					className=" bg-primary rounded-[15px] border-0"
					placeholder="Search with project name...."
				/>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Invoice</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Method</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">
								INV001
							</TableCell>
							<TableCell>Paid</TableCell>
							<TableCell>Credit Card</TableCell>
							<TableCell className="text-right">
								$250.00
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								INV001
							</TableCell>
							<TableCell>Paid</TableCell>
							<TableCell>Credit Card</TableCell>
							<TableCell className="text-right">
								$250.00
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								INV001
							</TableCell>
							<TableCell>Paid</TableCell>
							<TableCell>Credit Card</TableCell>
							<TableCell className="text-right">
								$250.00
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								INV001
							</TableCell>
							<TableCell>Paid</TableCell>
							<TableCell>Credit Card</TableCell>
							<TableCell className="text-right">
								$250.00
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
