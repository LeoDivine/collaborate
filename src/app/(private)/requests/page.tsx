import RequestsView from "@/components/pages/requests/requests-view";
import { getAllRequest } from "@/lib/services/request.services";
import { auth } from "../../../../auth";

export default async function Requests({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { query, page, status, inviteType, sort } = await searchParams;
	const pageSize = 15;
	const rawPage = Number(Array.isArray(page) ? page[0] : (page ?? "1"));
	const currentPage = Number.isNaN(rawPage) ? 1 : rawPage;
	const session = await auth();
	const workspaceId = session?.user?.currentWorkspaceId;
	const requestsData = await getAllRequest(
		currentPage,
		pageSize,
		workspaceId!,
		typeof query === "string" ? query : undefined,
		typeof status === "string" ? status : undefined,
		typeof inviteType === "string" ? inviteType : undefined,
		sort === "asc" ? "asc" : "desc",
	);

	return (
		<div>
			<RequestsView
				requests={requestsData.requests}
				totalItems={requestsData.total ?? 0}
				pageSize={pageSize}
				workspaceId={workspaceId}
				stats={requestsData.stats}
				currentStatus={typeof status === "string" ? status : "ALL"}
				currentInviteType={typeof inviteType === "string" ? inviteType : "ALL"}
				currentSort={sort === "asc" ? "asc" : "desc"}
				initialQuery={typeof query === "string" ? query : ""}
			/>
		</div>
	);
}
