import UsernameForm from "@/components/forms/username";
import React from "react";
import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";

export default async function Username() {
	const session = await auth();
	const user = session?.user;
	// if (user) {
	// 	redirect("/sign-up");
	// }
	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full md:w-[60%]  flex flex-col items-center">
					<p className="text-[25px] text-primary">
						Choose a username
					</p>
					<UsernameForm user={user} />
				</div>
			</div>
		</div>
	);
}
