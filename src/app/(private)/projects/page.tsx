import ProjectView from "@/components/pages/project/project-view";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
export default async function Projects(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const createParam = searchParams.creating;

	const currentState =
		Array.isArray(createParam) ? createParam[0] : createParam || "false";
	return (
		<div>
			<ProjectView isCreating={currentState} />
		</div>
	);
}
