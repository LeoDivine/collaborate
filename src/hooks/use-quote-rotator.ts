"use client";

import { motivationalQuotes } from "@/lib/const";
import { Quote } from "@/lib/types";
import { useEffect, useState } from "react";

interface UseQuoteRotatorOptions {
	interval?: number;
	quotes?: Quote[];
	randomOrder?: boolean;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function useQuoteRotator({
	interval = 10000,
	quotes = motivationalQuotes,
	randomOrder = false,
}: UseQuoteRotatorOptions = {}) {
	const [quotesArray, setQuotesArray] = useState<Quote[]>(() =>
		randomOrder ? shuffleArray(quotes) : quotes,
	);
	const [currentQuote, setCurrentQuote] = useState<Quote>(quotesArray[0]);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (randomOrder) {
			setQuotesArray(shuffleArray(quotes));
		} else {
			setQuotesArray(quotes);
		}
		setIndex(0);
		setCurrentQuote(quotes[0]);
	}, [randomOrder, quotes]);

	useEffect(() => {
		const timer = setInterval(() => {
			setIndex((prevIndex) => {
				let nextIndex = prevIndex + 1;
				// If we reach the end and randomOrder is enabled, reshuffle
				if (nextIndex >= quotesArray.length && randomOrder) {
					const newQuotes = shuffleArray(quotes);
					setQuotesArray(newQuotes);
					nextIndex = 0;
				} else {
					nextIndex = nextIndex % quotesArray.length;
				}
				setCurrentQuote(quotesArray[nextIndex]);
				return nextIndex;
			});
		}, interval);

		return () => clearInterval(timer);
	}, [interval, quotesArray, randomOrder, quotes]);

	const goToNextQuote = () => {
		let nextIndex = index + 1;
		if (nextIndex >= quotesArray.length && randomOrder) {
			const newQuotes = shuffleArray(quotes);
			setQuotesArray(newQuotes);
			nextIndex = 0;
		} else {
			nextIndex = nextIndex % quotesArray.length;
		}
		setIndex(nextIndex);
		setCurrentQuote(quotesArray[nextIndex]);
	};

	const goToPreviousQuote = () => {
		const prevIndex = (index - 1 + quotesArray.length) % quotesArray.length;
		setIndex(prevIndex);
		setCurrentQuote(quotesArray[prevIndex]);
	};

	return {
		currentQuote,
		index,
		totalQuotes: quotesArray.length,
		goToNextQuote,
		goToPreviousQuote,
	};
}
