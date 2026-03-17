import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaBell } from "react-icons/fa";

export default function ProtectedNavbar() {
	return (
		<div className=" w-[calc(100%-40px)]  flex justify-end py-[10px] px-[30px] rounded-[20px] bg-primary">
			<div className=" flex items-center gap-4">
				<FaBell className=" w-6 h-6 text-secondary" />
				<div className=" flex bg-secondary w-[50px] h-[50px]  font-extrabold text-[20px] items-center justify-center  rounded-full text-primary">
					CN
				</div>
				<div className="">
					<p className=" text-[14px] font-bold">
						Divine Onyekachukwu
					</p>
					<p className=" text-[12px]">@username</p>
				</div>
			</div>
		</div>
	);
}
