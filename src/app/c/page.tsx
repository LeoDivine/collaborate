"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getWorkspaceBByID } from "@/lib/services/workspace.services";
import { WorkspaceRoles } from "../../../generated/prisma/client";
import { createMemberForWorkspace } from "@/lib/services/member.services";
import { toast } from "sonner";
import { PawPrint } from "lucide-react";

export default function InviteRedirect() {
	const { update, data: session, status } = useSession();
	const searchParams = useSearchParams();
	const requestWorkspaceID = searchParams.get("requestWorkspace");
	const urlFullName = searchParams.get("fullName");
	const urlEmail = searchParams.get("email");
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") return;

		if (!requestWorkspaceID) {
			router.push("/dashboard");
		}

		const handleRedirect = async () => {
			if (!session) {
				if (urlEmail === null || requestWorkspaceID === null) {
					router.push("/sign-in");
				} else {
					router.push(
						`/sign-in?fullName=${urlFullName}&email=${urlEmail}&requestWorkspace=${requestWorkspaceID}`,
					);
				}
				return;
			}

			if (requestWorkspaceID === session.user?.currentWorkspaceId) {
				router.push("/dashboard");
				return;
			}

			if (requestWorkspaceID) {
				const workspace = await getWorkspaceBByID(requestWorkspaceID);
				await createMemberForWorkspace(
					session.user?.id!,
					requestWorkspaceID,
				);
				await update({
					currentWorkspaceId: requestWorkspaceID,
					currentWorkspaceMode: workspace?.mode,
					currentWorkspaceRole: "MEMBER" as WorkspaceRoles,
					currentWorkspaceName: workspace?.name,
				});
				toast.success(`Welcome to ${workspace?.name}`);
				router.push("/dashboard");
			}
		};

		handleRedirect();
	}, [status, session, requestWorkspaceID]);

	return (
		<div className=" flex h-screen items-center justify-center flex-col text-primary">
			<PawPrint className=" animate-pulse w-6 h-6" />
			<p className=" mt-[6px]">Redirecting you....</p>
			<p className="  text-[13px]">Don't close this page yet</p>
		</div>
	);
}
