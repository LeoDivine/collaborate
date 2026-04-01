import InfoCards from "@/components/shared/layout/dashboard/info-cards";
import React from "react";

export default function OwnerDashboard() {
	return (
		<div>
			<div className=" gap-4 grid-cols-1 md:grid-cols-4 grid">
				<InfoCards />
				<InfoCards />
				<InfoCards />
				<InfoCards />
			</div>
		</div>
	);
}
