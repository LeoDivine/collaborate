import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { User } from "next-auth";
import Image from "next/image";
import { FaBell } from "react-icons/fa";

export default function ProtectedNavbar({ user }: { user: User }) {
	return (
		<div className=" md:w-[calc(100%-20px)]  flex justify-between items-center py-[10px] px-[10px] md:px-[30px] rounded-[20px] bg-primary">
			<div className="">
				<Badge className=" hidden md:inline bg-secondary">
					{user.currentWorkspaceMode}
				</Badge>
				<Image
					src={"/resources/logo.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className=" inline md:hidden w-[50%]"
				/>
			</div>
			<div className=" flex items-center gap-4">
				<FaBell className=" w-6 h-6 text-secondary" />
				<div className=" md:flex bg-secondary cursor-pointer  hidden w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full text-primary">
					{getInitials(user.fullName)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger className=" " asChild>
						<div className=" md:hidden flex bg-secondary w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full text-primary">
							{getInitials(user.fullName)}
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className=" mr-[20px] w-[300px]">
						<DropdownMenuGroup>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuItem>Profile</DropdownMenuItem>
							<DropdownMenuItem>Billing</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>Team</DropdownMenuItem>
							<DropdownMenuItem>Subscription</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<div className=" md:inline hidden">
					<p className=" text-[14px] font-bold">{user.fullName}</p>
					<p className=" text-[12px]">@{user.userName}</p>
				</div>
			</div>
		</div>
	);
}
