import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import React from "react";

export default function AcceptButton() {
	return (
		<Button>
			<Check />
			Accept
		</Button>
	);
}
