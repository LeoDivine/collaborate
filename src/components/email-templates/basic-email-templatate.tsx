import React from "react";

export default function BasicEmailTemplatate({ name }: { name: string }) {
	return (
		<div className=" bg-red-800">
			<p className=" text-5xl">{name}</p>
		</div>
	);
}
