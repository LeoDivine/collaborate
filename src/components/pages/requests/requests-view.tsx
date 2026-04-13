"use client";

import { Input } from "@/components/ui/input";
import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function RequestsView() {
	const handleClick = async () => {
		await fetch("/api/emails/requests", {
			method: "POST",
			body: JSON.stringify({
				fullName: "Divine",
				email: "tech.divine101@gmail.com",
				workspaceId: "8b682945-e822-4698-9596-ff0c85cbe0a1",
			}),
		});
	};

	return (
		<div className=" mt-[20px] flex gap-2 flex-col">
			<Input
				className=" bg-primary rounded-[15px] border-0"
				placeholder="Search with project name...."
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="">Full Name</TableHead>
						<TableHead>Email Address</TableHead>
						<TableHead>Requested At</TableHead>
						<TableHead>Message</TableHead>
						<TableHead>Status</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="font-medium">INV001</TableCell>
						<TableCell>Paid</TableCell>
						<TableCell>Credit Card</TableCell>
						<TableCell>Credit Card</TableCell>
						<TableCell>Credit Card</TableCell>
						<TableCell>
							<Button className=" rounded-full text-primary bg-secondary">
								Accept
							</Button>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>

			<Button onClick={() => handleClick()}>Click</Button>
		</div>
	);
}
