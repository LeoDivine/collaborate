import UsernameForm from "@/components/forms/username";
import React from "react";

export default function Username() {
	return (
		<div className=" w-full   ">
			<div className=" flex h-full flex-col items-center justify-between">
				<div className=" justify-center w-full md:w-[60%]  flex flex-col items-center">
					<p className="text-[25px] text-primary">
						Choose a username
					</p>
					<UsernameForm />
				</div>
			</div>
		</div>
	);
}
