"use client";

import { useQuoteRotator } from "@/hooks/use-quote-rotator";
import { Quote } from "@/lib/types";
import { useEffect, useState } from "react";

interface MotivationalQuoteDisplayProps {
	quotes?: Quote[];
	interval?: number;
	className?: string;
	quoteClassName?: string;
	authorClassName?: string;
	randomOrder?: boolean;
}

export default function MotivationalQuoteDisplay({
	quotes,
	interval = 10000,
	className = "",
	quoteClassName = "md:w-[50%] w-full text-[15px] text-accent",
	authorClassName = "text-sm text-accent/70",
	randomOrder = false,
}: MotivationalQuoteDisplayProps) {
	const [mounted, setMounted] = useState(false);
	const { currentQuote } = useQuoteRotator({ interval, quotes, randomOrder });

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div className={className}>
			<p className={quoteClassName}>"{currentQuote.text}"</p>
			<p className={authorClassName}>– {currentQuote.author}</p>
		</div>
	);
}
