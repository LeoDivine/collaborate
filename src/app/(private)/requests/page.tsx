import RequestsView from "@/components/pages/requests/requests-view";
import { getAllRequest } from "@/lib/services/request.services";
import { auth } from "../../../../auth";

export default async function Requests({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { query, page } = await searchParams;
	const pageSize = 15;
	const rawPage = Number(Array.isArray(page) ? page[0] : (page ?? "1"));
	const currentPage = Number.isNaN(rawPage) ? 1 : rawPage;
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const requestsData = await getAllRequest(
		currentPage,
		pageSize,
		workspaceId!,
		query as string,
	);

	return (
		<div>
			<p className=" text-[20px] font-bold text-primary">
				Requests ({requestsData.stats?.pending ?? 0})
			</p>
			<RequestsView
				requests={requestsData.requests}
				totalItems={requestsData.total ?? 0}
				pageSize={pageSize}
			/>
		</div>
	);
}
