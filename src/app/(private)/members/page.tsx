import MembersView from "@/components/pages/members/members-view";
import React from "react";
import { auth } from "../../../../auth";
import { getMembersByWorkspaceId } from "@/lib/services/member.services";

export default async function Members({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { query, page } = await searchParams;
	const pageSize = 15;
	const rawPage = Number(Array.isArray(page) ? page[0] : (page ?? "1"));
	const currentPage = Number.isNaN(rawPage) ? 1 : rawPage;
	const session = await auth();
	const user = session?.user;
	const workspaceId = session?.user?.currentWorkspaceId;
	const memberData = await getMembersByWorkspaceId(
		currentPage,
		pageSize,
		workspaceId!,
		query as string,
	);

	return (
		<div>
			<p className=" text-[20px] font-bold text-primary">Members</p>
			<MembersView
				members={memberData.members}
				totalItems={memberData.total}
				pageSize={pageSize}
				user={user!}
			/>
		</div>
	);
}
