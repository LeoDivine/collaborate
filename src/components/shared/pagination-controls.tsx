"use client";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const ELLIPSIS = "ellipsis" as const;

type PaginationControlsProps = {
	totalItems: number;
	pageSize?: number;
	siblingCount?: number;
	pageParam?: string;
	className?: string;
	onPageChange?: (page: number) => void;
};

function range(start: number, end: number) {
	const length = end - start + 1;
	return Array.from({ length }, (_, index) => index + start);
}

function getPaginationRange(
	currentPage: number,
	totalPages: number,
	siblingCount: number,
) {
	const totalPageNumbers = siblingCount * 2 + 5;

	if (totalPageNumbers >= totalPages) {
		return range(1, totalPages);
	}

	const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
	const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

	const showLeftEllipsis = leftSiblingIndex > 2;
	const showRightEllipsis = rightSiblingIndex < totalPages - 1;

	if (!showLeftEllipsis && showRightEllipsis) {
		const leftRange = range(1, 3 + siblingCount * 2);
		return [...leftRange, ELLIPSIS, totalPages];
	}

	if (showLeftEllipsis && !showRightEllipsis) {
		const rightRange = range(
			totalPages - (2 + siblingCount * 2),
			totalPages,
		);
		return [1, ELLIPSIS, ...rightRange];
	}

	const middleRange = range(leftSiblingIndex, rightSiblingIndex);
	return [1, ELLIPSIS, ...middleRange, ELLIPSIS, totalPages];
}

export default function PaginationControls({
	totalItems,
	pageSize = 10,
	siblingCount = 1,
	pageParam = "page",
	className,
	onPageChange,
}: PaginationControlsProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const rawPage = Number(searchParams.get(pageParam) ?? "1");
	const currentPage = Math.min(
		Math.max(Number.isNaN(rawPage) ? 1 : rawPage, 1),
		totalPages,
	);

	const pages = useMemo(
		() => getPaginationRange(currentPage, totalPages, siblingCount),
		[currentPage, totalPages, siblingCount],
	);

	if (totalItems <= pageSize) {
		return null;
	}

	const buildHref = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());

		if (page <= 1) {
			params.delete(pageParam);
		} else {
			params.set(pageParam, page.toString());
		}

		const query = params.toString();
		return query ? `${pathname}?${query}` : pathname;
	};

	const goToPage = (page: number) => {
		if (onPageChange) {
			onPageChange(page);
			return;
		}

		router.push(buildHref(page));
	};

	const canGoPrevious = currentPage > 1;
	const canGoNext = currentPage < totalPages;

	return (
		<Pagination className={cn("mt-4", className)}>
			<PaginationContent className="w-full">
				<div className="flex w-full items-center justify-between gap-2 sm:hidden">
					<PaginationItem className="text-[13px] text-primary">
						<PaginationPrevious
							href={buildHref(currentPage - 1)}
							aria-disabled={!canGoPrevious}
							className={
								!canGoPrevious ?
									"pointer-events-none opacity-50"
								:	""
							}
							onClick={(event) => {
								if (!canGoPrevious) {
									return;
								}
								event.preventDefault();
								goToPage(currentPage - 1);
							}}
						/>
					</PaginationItem>
					<span className="text-[12px] text-muted-foreground">
						Page {currentPage} of {totalPages}
					</span>
					<PaginationItem className="text-[13px] text-primary">
						<PaginationNext
							href={buildHref(currentPage + 1)}
							aria-disabled={!canGoNext}
							className={
								!canGoNext ?
									"pointer-events-none opacity-50"
								:	""
							}
							onClick={(event) => {
								if (!canGoNext) {
									return;
								}
								event.preventDefault();
								goToPage(currentPage + 1);
							}}
						/>
					</PaginationItem>
				</div>
				<div className="hidden w-full items-center justify-center gap-1 sm:flex">
					<PaginationItem className="text-[13px] text-primary">
						<PaginationPrevious
							href={buildHref(currentPage - 1)}
							aria-disabled={!canGoPrevious}
							className={
								!canGoPrevious ?
									"pointer-events-none opacity-50"
								:	""
							}
							onClick={(event) => {
								if (!canGoPrevious) {
									return;
								}
								event.preventDefault();
								goToPage(currentPage - 1);
							}}
						/>
					</PaginationItem>
					{pages.map((page, index) => {
						if (page === ELLIPSIS) {
							return (
								<PaginationItem
									className="text-primary"
									key={`ellipsis-${index}`}
								>
									<PaginationEllipsis />
								</PaginationItem>
							);
						}

						return (
							<PaginationItem key={page}>
								<PaginationLink
									className={` ${page === currentPage ? "bg-primary hover:bg-primary " : " text-primary"} border-0 text-[13px]`}
									href={buildHref(page)}
									isActive={page === currentPage}
									onClick={(event) => {
										event.preventDefault();
										goToPage(page);
									}}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						);
					})}
					<PaginationItem className="text-[13px] text-primary">
						<PaginationNext
							href={buildHref(currentPage + 1)}
							aria-disabled={!canGoNext}
							className={
								!canGoNext ?
									"pointer-events-none opacity-50"
								:	""
							}
							onClick={(event) => {
								if (!canGoNext) {
									return;
								}
								event.preventDefault();
								goToPage(currentPage + 1);
							}}
						/>
					</PaginationItem>
				</div>
			</PaginationContent>
		</Pagination>
	);
}
