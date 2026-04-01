import React from "react";
import { auth } from "../../../../auth";
import { DeskMode, WorkspaceRoles } from "../../../../generated/prisma/enums";
import PersonalDashboard from "@/components/pages/dashboard/personal-dashboard";
import AdminDashboard from "@/components/pages/dashboard/admin-dashboard";
import MemberDashboard from "@/components/pages/dashboard/member-dashboard";
import OwnerDashboard from "@/components/pages/dashboard/owner-dashboard";

export default async function Dashboard() {
	const session = await auth();
	const user = session?.user;
	const workspaceRole = user?.currentWorkspaceRole;
	const workspaceMode = user?.currentWorkspaceMode;

	const renderDashboard = (
		workspaceRole: WorkspaceRoles,
		workspaceMode: DeskMode,
	) => {
		if (workspaceMode === "INDIVIDUAL") {
			return <PersonalDashboard />;
		} else {
			switch (workspaceRole) {
				case "ADMIN":
					return <AdminDashboard />;
				case "MEMBER":
					return <MemberDashboard />;
				case "OWNER":
					return <OwnerDashboard />;
				default:
					return <MemberDashboard />;
			}
		}
	};

	return (
		<>
			{renderDashboard(
				workspaceRole as WorkspaceRoles,
				workspaceMode as DeskMode,
			)}
		</>
	);
}
