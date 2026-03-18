"use client"
import { useRouter } from "next/navigation";
import { GoChevronLeft } from "react-icons/go";

export default function BackButton() {
	const router = useRouter();
	return (
		<span
			onClick={() => {
				router.back();
			}}
			className=" absolute cursor-pointer pt-[20px] left-2 text-primary flex flex-row items-center gap-2 "
		>
			<GoChevronLeft />
			<p>Go Back</p>
		</span>
	);
}
