import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import MotivationalQuoteDisplay from "@/components/shared/motivational-quote-display";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { User } from "next-auth";

export default function OwnerDashboard({ user }: { user: User }) {
	return (
		<div>
			<div className=" flex justify-between items-center">
				<div className="">
					<p className=" text-[20px] font-bold text-primary">
						Welcome Back, {user.fullName}
					</p>
					{/* <MotivationalQuoteDisplay /> */}
				</div>
				<div className="">
					<Button className=" rounded-full">
						<Plus />
						Add Project
					</Button>
				</div>
			</div>
			<div className=" mt-[20px] gap-4 grid-cols-1 md:grid-cols-4 grid">
				<InfoCards />
				<InfoCards />
				<InfoCards />
				<InfoCards />
			</div>
		</div>
	);
}
