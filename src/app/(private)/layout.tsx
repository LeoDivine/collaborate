import ProtectedNavbar from "@/components/shared/layout/private/protected-navbar";
import ProtectedSidebar from "@/components/shared/layout/private/protected-sidebar";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className=" w-full flex">
			<div className=" flex items-center w-[20%]  h-screen ml-[20px] ">
				<ProtectedSidebar />
			</div>
			<div className=" w-full">
				<div className=" flex justify-center mt-[15px]">
					<ProtectedNavbar />
				</div>
				<div className=" px-[20px] py-[15px]">{children}</div>
			</div>
		</div>
	);
}
