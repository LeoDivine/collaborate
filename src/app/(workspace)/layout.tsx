"use client";

import SideDisplay from "@/components/shared/layout/workspace/side-display";
import { usePathname } from "next/navigation";

export default function WorkspaceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathName = usePathname();

	const mode = pathName === "/join-workspace" ? "join" : "create";

	return (
		<div className="px-[20px] py-[20px] h-screen gap-5 flex w-full">
			<SideDisplay mode={mode} />
			<div className="grow flex items-center">{children}</div>
		</div>
	);
}
