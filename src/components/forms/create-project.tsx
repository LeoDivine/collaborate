"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	CircleSlash,
	Cloud,
	Flame,
	Info,
	ThermometerSnowflake,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { DialogClose } from "../ui/dialog";

export default function CreateProject() {
	const [date, setDate] = useState<Date | undefined>(new Date());

	return (
		<div className="  w-full">
			<div className=" flex gap-4">
				<div className=" grow">
					<input
						autoFocus
						placeholder="Project name"
						className="w-full outline-none bg-transparent placeholder:text-[40px] placeholder:font-bold  text-[40px] font-bold border-0"
					/>
					<Separator className=" bg-secondary/20 my-[10px]" />
					<div className=" w-full">
						<Textarea
							className="  break-all w-full h-[500px]  resize-none focus-visible:ring-0 border-0"
							placeholder="Type a description..."
						/>
					</div>
				</div>

				<div className=" px-[10px] flex flex-col gap-2.5 py-[10px] w-[20%] rounded-[20px]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className=" bg-accent text-[13px] hover:bg-accent text-primary rounded-full">
								Priority level
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="  border-0 bg-accent">
							<DropdownMenuItem className=" text-primary">
								<CircleSlash className=" text-primary" />
								<p className=" text-primary">No priority</p>
							</DropdownMenuItem>
							<DropdownMenuItem className=" text-primary">
								<Flame className=" text-primary" />
								<p className=" text-primary">High</p>
							</DropdownMenuItem>
							<DropdownMenuItem className=" text-primary">
								<Info className=" text-primary" />
								<p className=" text-primary">Urgent</p>
							</DropdownMenuItem>
							<DropdownMenuItem className=" text-primary">
								<Cloud className=" text-primary" />
								<p className=" text-primary">Medium</p>
							</DropdownMenuItem>
							<DropdownMenuItem className=" text-primary">
								<ThermometerSnowflake className=" text-primary" />
								<p className=" text-primary">Low</p>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className=" bg-accent hover:bg-accent text-primary rounded-full">
								Members
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="  border-0 bg-accent">
							<DropdownMenuItem className=" text-primary">
								<CircleSlash className=" text-primary" />
								<p className=" text-primary">No priority</p>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className=" bg-accent hover:bg-accent text-primary rounded-full">
								Project Lead
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="  border-0 bg-accent">
							<DropdownMenuItem className=" text-primary">
								<CircleSlash className=" text-primary" />
								<p className=" text-primary">No priority</p>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Popover>
						<PopoverTrigger asChild>
							<Button className=" bg-accent hover:bg-accent text-primary rounded-full">
								Start Date
							</Button>
						</PopoverTrigger>
						<PopoverContent className=" rounded-[20px] bg-accent text-primary border-0">
							<Calendar
								// hideNavigation
								mode="single"
								selected={date}
								onSelect={setDate}
								className="bg-primary text-secondary"
								classNames={{
									root: "w-full",
									month: "text-primary",
									weekday: "w-full font-normal",
									nav: "text-primary flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
									day_button:
										"text-primary data-[selected-single=true]:text-secondary data-[selected-single=true]:font-semibold",
								}}
							/>
						</PopoverContent>
					</Popover>
					<Popover>
						<PopoverTrigger asChild>
							<Button className=" bg-accent hover:bg-accent text-primary rounded-full">
								Due Date
							</Button>
						</PopoverTrigger>
						<PopoverContent className=" rounded-[20px] bg-accent text-primary border-0">
							<Calendar
								// hideNavigation
								mode="single"
								selected={date}
								onSelect={setDate}
								className="bg-primary text-secondary"
								classNames={{
									root: "w-full",
									month: "text-primary",
									weekday: "w-full font-normal",
									nav: "text-primary flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
									day_button:
										"text-primary data-[selected-single=true]:text-secondary data-[selected-single=true]:font-semibold",
								}}
							/>
						</PopoverContent>
					</Popover>
					<Popover>
						<PopoverTrigger asChild>
							<Button className=" bg-accent hover:bg-accent text-primary rounded-full">
								Labels
							</Button>
						</PopoverTrigger>
						<PopoverContent className=" rounded-[20px] bg-accent text-primary border-0">
							<Textarea />
						</PopoverContent>
					</Popover>
				</div>
			</div>
			<div className=" flex justify-end gap-4 ">
				<DialogClose asChild>
					<Button className=" rounded-full hover:bg-accent bg-accent text-primary ">
						Close
					</Button>
				</DialogClose>
				<Button className=" rounded-full hover:bg-accent bg-accent text-primary ">
					Creating Project
				</Button>
			</div>
		</div>
	);
}
