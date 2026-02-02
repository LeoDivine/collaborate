import PublicNavbar from "@/components/shared/layout/public/public-navbar";
import React from "react";

export default function PublicLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<PublicNavbar />
			<div className="">{children}</div>
		</div>
	);
}
