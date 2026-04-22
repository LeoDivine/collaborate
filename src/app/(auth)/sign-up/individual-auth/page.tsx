import IndividualSignUp from "@/components/forms/individual-sign-up";
import { Suspense } from "react";

export default function IndividualAuth() {
	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full md:w-[60%]  flex flex-col items-center">
					<p className="text-[25px] text-primary">Create account</p>\
					<Suspense>
						<IndividualSignUp />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
