import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function WorkspaceSideDisplay({
	mode,
}: {
	mode: "join" | "create";
}) {
	return (
		<div className=" text-a px-[40px] py-[20px] hidden md:inline rounded-xl shadow w-[30%] bg-linear-to-br from-[#222222] to-[#383838]">
			<div className=" flex justify-between flex-col items-center h-full">
				<Image
					className=" w-[50%] object-cover"
					src={"/resources/logo.png"}
					alt="logo"
					width={1000}
					height={1000}
				/>

				<div>
					<p className=" text-[30px] font-bold ">
						{mode === "create" ?
							"Create a Workspace"
						:	"Join a Workspace"}
					</p>

					<p>
						{mode === "create" ?
							"Set up your workspace to manage projects, organize your team, and keep everyone aligned in one place."
						:	"Join an existing workspace to collaborate with your team, track tasks, and stay updated on progress."
						}
					</p>
				</div>

				{mode === "create" ?
					<span className=" text-accent text-[11px] gap-2 flex ">
						<p>Already have a workspace invite?</p>
						<Link className=" underline" href="/join">
							Join workspace
						</Link>
					</span>
				:	<span className=" text-accent text-[11px] gap-2 flex ">
						<p>Want to create your own workspace?</p>
						<Link className=" underline" href="/create">
							Create workspace
						</Link>
					</span>
				}
			</div>
		</div>
	);
}
