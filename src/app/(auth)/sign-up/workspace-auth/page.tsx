import WorkspaceSignUp from "@/components/forms/workspace-sign-up";

export default function WorkspaceAuth() {
	return (
		<div className=" w-full md:w-[50%] ">
			<p className="text-[25px] text-primary w-full text-center md:text-left  md:w-[300px] ">
				Create workspace account
			</p>
			<div className="">
				<WorkspaceSignUp />
			</div>
		</div>
	);
}
