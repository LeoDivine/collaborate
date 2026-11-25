import SideDisplay from "@/components/shared/layout/auth/side-display";

export default function WorkspaceSignUpLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="px-4 sm:px-6 py-4 sm:py-6 min-h-screen gap-5 flex w-full overflow-y-auto">
			<SideDisplay mode="WORKSPACE" />
			<div className="grow flex items-center justify-center py-4">{children}</div>
		</div>
	);
}
