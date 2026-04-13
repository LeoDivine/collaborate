import ActivitiesOverview from "@/components/shared/layout/dashboard/activities-overview";
import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import OngoingProjectsOverview from "@/components/shared/layout/dashboard/ongoing-projects-overview";
import OverviewCalender from "@/components/shared/layout/dashboard/overview-calender";
import UpcomingDeadlinesOverview from "@/components/shared/layout/dashboard/upcoming-deadlines-overview";
import MotivationalQuoteDisplay from "@/components/shared/motivational-quote-display";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { Info, Plus } from "lucide-react";
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
						New Project
					</Button>
				</div>
			</div>
			<div className=" mt-[20px] gap-4 flex">
				<div className=" w-full">
					<div className="  gap-4 grid-cols-1 md:grid-cols-4 grid">
						<InfoCards
							title="Completed Projects"
							value={0}
							extraInfo={
								<div className=" mt-[10px] text-primary flex items-center gap-1">
									<Info className=" w-3 h-3" />
									<p className=" text-[13px]">
										Total projects finished
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Pending Tasks"
							value={0}
							extraInfo={
								<div className=" mt-[10px]  text-primary flex items-center gap-1">
									<Info className=" w-3 h-3" />
									<p className=" text-[13px]">
										Total pending tasks
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Total Members"
							value={0}
							extraInfo={
								<div className=" mt-[10px]  text-primary flex items-center gap-1">
									<Info className=" w-3 h-3" />
									<p className=" text-[13px]">
										Total active members
									</p>
								</div>
							}
						/>
						<InfoCards
							title="Total Teams"
							value={0}
							extraInfo={
								<div className=" mt-[10px]  text-primary flex items-center gap-1">
									<Info className=" w-3 h-3" />
									<p className=" text-[13px]">
										Total active teams
									</p>
								</div>
							}
						/>
					</div>
					<div className=" mt-[20px]">
						<p className=" text-[20px] text-primary">
							Ongoing Projects
						</p>
						<div className=" mt-[10px] grid grid-cols-3 gap-4">
							<OngoingProjectsOverview />
							<OngoingProjectsOverview />
							<OngoingProjectsOverview />
							<OngoingProjectsOverview />
							<OngoingProjectsOverview />
							<OngoingProjectsOverview />
						</div>
					</div>
					<div className=" mt-[15px] grid-cols-4 grid gap-4">
						<div className=" rounded-[20px] px-[20px] py-[20px] bg-accent">
							<p className=" text-primary">Most Active Project</p>
							<div className=" font-extrabold text-accent text-4xl flex items-center justify-center py-[30px] my-[10px] rounded-[20px]  bg-primary">
								{getInitials("Transpay Lagos")}
							</div>
							<p className=" text-primary text-[15px]">
								Transpay Lagos
							</p>
							<p className=" text-primary line-clamp-3 text-[13px]">
								Lorem ipsum, dolor sit amet consectetur
								adipisicing elit. Veniam unde, vero quibusdam
								ipsa natus ducimus earum ea porro aliquam nisi
								iure, perspiciatis corporis excepturi eveniet
								soluta harum rem delectus animi?
							</p>
							<p className=" mt-[3px] text-[13px] text-primary font-bold">
								20 tasks left
							</p>
							<Button className=" w-full rounded-full mt-[10px]">
								View Project
							</Button>
						</div>
						{/* <div className=" rounded-[20px] px-[20px] py-[20px] bg-accent">
							dfdfm
						</div> */}
					</div>
				</div>
				<div className=" w-[25%] ">
					<OverviewCalender />
					<div className=" mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-accent">
						<p className=" text-primary  text-[16px]">
							Upcoming Deadlines
						</p>
						<div className="">
							<UpcomingDeadlinesOverview />
							<UpcomingDeadlinesOverview />
							<UpcomingDeadlinesOverview />
							<UpcomingDeadlinesOverview />
						</div>
					</div>
					<div className=" mt-[15px] rounded-[20px] px-[20px] py-[20px] bg-accent">
						<p className=" text-primary  text-[16px]">Activities</p>
						<div className="">
							<ActivitiesOverview />
							<ActivitiesOverview />
							<ActivitiesOverview />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
