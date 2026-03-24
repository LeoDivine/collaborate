import MaxWidthWrapper from "@/components/shared/layout/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
	return (
		<div className=" h-screen w-full bg-linear-to-br from-[#222222] to-[#383838]">
			<MaxWidthWrapper className=" h-screen">
				<div className=" flex md:justify-end  justify-center gap-10 md:h-full  h-screen items-center  flex-col">
					<div className=" flex flex-col items-center gap-2 text-secondary">
						<p className=" text-center text-[30px] md:text-[40px] md:w-[80%] mx-auto ">
							Stay Organized. Work Smarter. Collaborate Better.
						</p>
						<p className="text-[13px] md:w-[40%] text-center">
							Collaborate helps individuals and teams track tasks,
							manage projects, and stay productive.
						</p>
						<div className="">
							<Button
								className="text-[13px] rounded-full"
								variant={"secondary"}
							>
								Get Started
								<ChevronRight />
							</Button>
						</div>
					</div>
					<div className=" flex justify-center w-full">
						<Image
							src={"/resources/landing-page.png"}
							alt="logo"
							width={"1000"}
							height={"1000"}
							className="  md:inline    shadow hidden"
						/>
					</div>
				</div>
			</MaxWidthWrapper>
		</div>
	);
}
