import React from "react";

export default function InfoCards({
	title,
	value,
	extraInfo,
}: {
	title: string;
	value: number;
	extraInfo?: React.ReactNode;
}) {
	return (
		<div className="text-primary py-[20px] rounded-[20px] px-[20px] bg-[#969696]">
			<p className="  font-medium">{title}</p>
			<p className=" text-6xl font-bold">{value}</p>
			{extraInfo}
		</div>
	);
}
