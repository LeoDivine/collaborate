"use client";

import SideDisplay from "@/components/shared/layout/workspace/side-display";
import { PusherProvider } from "@/components/providers/pusher-provider";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function WorkspaceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathName = usePathname();
	const { data: session } = useSession();

	const mode = pathName === "/join-workspace" ? "join" : "create";

	return (
		<PusherProvider user={session?.user}>
			<div className="px-4 sm:px-6 py-4 sm:py-6 min-h-screen gap-5 flex w-full overflow-y-auto">
				<SideDisplay mode={mode} />
				<div className="grow flex items-center justify-center py-4">{children}</div>
			</div>
		</PusherProvider>
	);
}
