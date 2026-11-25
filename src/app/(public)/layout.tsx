import PublicNavbar from "@/components/shared/layout/public/public-navbar";
import PublicFooter from "@/components/shared/layout/public/public-footer";
import React from "react";

export default function PublicLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="min-h-screen flex flex-col bg-[#1c1c1e] text-[#c5bebe]">
			<PublicNavbar />
			<main className="flex-1 w-full">{children}</main>
			<PublicFooter />
		</div>
	);
}
