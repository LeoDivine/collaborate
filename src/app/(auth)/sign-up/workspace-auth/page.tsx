import WorkspaceSignUp from "@/components/forms/workspace-sign-up";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
export default async function WorkspaceAuth(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const tab = searchParams.tab;

	const currentTab = Array.isArray(tab) ? tab[0] : tab || "owner";

	return (
		<div className=" w-full md:w-[50%] ">
			<p className="text-[25px] text-primary w-full text-center md:text-left  md:w-[300px] ">
				Create workspace account
			</p>
			<div className="">
				<WorkspaceSignUp initialTab="owner" />
			</div>
		</div>
	);
}
