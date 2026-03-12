import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
	providers: [
		Credentials({
			// async authorize(credentials) {
			// const validatedFields = sigIn.safeParse(credentials);
			// const url = `${API}${URLS.auth.login}`;
			// if (validatedFields.success) {
			// 	const { email, password } = validatedFields.data;
			// 	try {
			// 		// const res = await axios.post<IAuthResponse>(url, {
			// 		//   email,
			// 		//   password,
			// 		// });
			// 		const res = await fetch(url, {
			// 			headers: { "Content-Type": "application/json" },
			// 			method: "POST",
			// 			body: JSON.stringify({
			// 				email,
			// 				password,
			// 			}),
			// 		});
			// 		if (!res.ok) {
			// 			// console.log("Something went wrong", res.status);
			// 			return null;
			// 		}
			// 		const data = await res.json();
			// 		//console.log(data);
			// 		const loginRes: IAuthResponse = data.data;
			// 		const user = loginRes.user;
			// 		const accessToken = loginRes.accessToken;
			// 		const refreshToken = loginRes.refreshToken;
			// 		console.log({ loginRes });
			// 		if (user) {
			// 			return {
			// 				id: user.id,
			// 				email: user.email,
			// 				role: user.role,
			// 				accessToken: accessToken,
			// 				refreshToken: refreshToken,
			// 				firstName: user.firstName,
			// 				lastName: user.lastName,
			// 			};
			// 		}
			// 		return null;
			// 	} catch (error: any) {
			// 		console.log("Login error:", error.message);
			// 		return null;
			// 	}
			// }
			// return null;
			// 	},
		}),
	],
} satisfies NextAuthConfig;
