import ProtectedNavbar from "@/components/shared/layout/private/protected-navbar";
import ProtectedSidebar from "@/components/shared/layout/private/protected-sidebar";
import ProtectedMobileNav from "@/components/shared/layout/private/protected-mobile-nav";
import { PusherProvider } from "@/components/providers/pusher-provider";
import { getMembersByUserID } from "@/lib/services/member.services";
import NextTopLoader from "nextjs-toploader";
import React from "react";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const user = session?.user;

	if (!user) {
		redirect("/sign-in");
	}

	const { members } = await getMembersByUserID(user.id);

	// Check if user is trying to access a workspace where they are deactivated
	if (user.currentWorkspaceId) {
		const currentMembership = members.find(
			(m) => m.workspaceId === user.currentWorkspaceId,
		);
		if (currentMembership?.status === "INACTIVE") {
			redirect("/sign-in/my-workspaces");
		}
	}

	const userProps = {
		email: user?.email ?? "",
		fullName: user?.fullName ?? "",
		id: user?.id ?? "",
		userName: user?.userName ?? "",
		currentWorkspaceId: user?.currentWorkspaceId,
		currentWorkspaceMode: user?.currentWorkspaceMode,
		currentWorkspaceRole: user?.currentWorkspaceRole,
		currentWorkspaceName: user?.currentWorkspaceName,
	};

	return (
		<PusherProvider user={user}>
			<div className="h-screen w-full flex overflow-hidden bg-background">
				<NextTopLoader color="#222222" showSpinner={false} />

				{/* Desktop Sidebar: Hidden on mobile (< md) */}
				<aside
					aria-label="Desktop Sidebar"
					className="hidden md:flex items-center md:w-[22%] lg:w-[18%] xl:w-[16%] h-screen md:ml-4 lg:ml-5 md:mr-2 shrink-0 py-3"
				>
					<ProtectedSidebar user={user!} />
				</aside>

				{/* Main View Area */}
				<div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
					{/* Top Header Navbar */}
					<header className="w-full px-3 sm:px-4 md:px-5 pt-2.5 md:pt-3 shrink-0">
						<ProtectedNavbar
							user={userProps}
							workspaces={members}
						/>
					</header>

					{/* Scrollable Page Body */}
					<main className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-5 md:px-6 py-3 sm:py-4">
						<div className="max-w-7xl mx-auto pb-24 md:pb-12">
							{children}
						</div>
					</main>

					{/* Mobile Bottom Navigation Bar (< md) */}
					<ProtectedMobileNav
						user={userProps}
						workspaces={members}
					/>
				</div>
			</div>
		</PusherProvider>
	);
}
