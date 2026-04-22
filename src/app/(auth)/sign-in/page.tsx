import SignInForm from "@/components/forms/sign-in";
import { Suspense } from "react";

export default function SignIn() {
	return (
		<div className=" w-full">
			<Suspense>
				<SignInForm />
			</Suspense>
		</div>
	);
}
