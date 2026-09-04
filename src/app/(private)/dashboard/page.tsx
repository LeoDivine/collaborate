import React from "react";
import { auth } from "../../../../auth";
import PersonalDashboard from "@/components/pages/dashboard/personal-dashboard";
import AdminDashboard from "@/components/pages/dashboard/admin-dashboard";
import MemberDashboard from "@/components/pages/dashboard/member-dashboard";
import OwnerDashboard from "@/components/pages/dashboard/owner-dashboard";
import {
	getOwnerDashboardData,
	getAdminDashboardData,
	getMemberDashboardData,
	OwnerDashboardData,
	AdminDashboardData,
	MemberDashboardData,
} from "@/lib/services/dashboard.services";

import DashboardRealtimeWrapper from "@/components/pages/dashboard/dashboard-realtime-wrapper";

export default async function Dashboard() {
	const session = await auth();
	const user = session?.user;
	const workspaceRole = user?.currentWorkspaceRole;
	const workspaceMode = user?.currentWorkspaceMode;
	const workspaceId = user?.currentWorkspaceId;
	const memberId = user?.currentMemberId;
	const userId = user?.id;

	let ownerDashboardData: OwnerDashboardData | undefined;
	let adminDashboardData: AdminDashboardData | undefined;
	let memberDashboardData: MemberDashboardData | undefined;

	if (workspaceMode !== "INDIVIDUAL" && workspaceId) {
		if (workspaceRole === "OWNER") {
			const res = await getOwnerDashboardData(workspaceId, memberId, userId);
			if (res.success && res.data) {
				ownerDashboardData = res.data;
			}
		} else if (workspaceRole === "ADMIN") {
			const res = await getAdminDashboardData(workspaceId, memberId, userId);
			if (res.success && res.data) {
				adminDashboardData = res.data;
			}
		} else {
			const res = await getMemberDashboardData(workspaceId, memberId, userId);
			if (res.success && res.data) {
				memberDashboardData = res.data;
			}
		}
	}

	const renderDashboard = () => {
		if (workspaceMode === "INDIVIDUAL") {
			return <PersonalDashboard />;
		} else {
			switch (workspaceRole) {
				case "ADMIN":
					return <AdminDashboard user={user!} data={adminDashboardData} />;
				case "MEMBER":
					return <MemberDashboard user={user!} data={memberDashboardData} />;
				case "OWNER":
					return <OwnerDashboard user={user!} data={ownerDashboardData} />;
				default:
					return <MemberDashboard user={user!} data={memberDashboardData} />;
			}
		}
	};

	return (
		<DashboardRealtimeWrapper workspaceId={workspaceId}>
			{renderDashboard()}
		</DashboardRealtimeWrapper>
	);
}


