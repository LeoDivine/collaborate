import SideDisplay from "@/components/shared/layout/auth/side-display";

export default function IndividualSignUpLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className={` px-[20px] py-[20px] h-screen gap-5   flex w-full`}>
			<SideDisplay mode="WORKSPACE" />
			<div className=" grow flex   items-center ">{children}</div>
		</div>
	);
}
