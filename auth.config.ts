import { signInSchema } from "@/lib/schemas/auth";
import { getUserByEmail } from "@/lib/services/auth.services";
import bcrypt from "bcryptjs";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
	providers: [
		Credentials({
			async authorize(credentials, _request) {
				const validatedFields = signInSchema.safeParse(credentials);
				if (validatedFields.success) {
					const { email, password } = validatedFields.data;
					const user = await getUserByEmail(email);
					if (!user || !user.password) {
						return null;
					}
					const passwordMatchCheck = await bcrypt.compare(
						password,
						user.password,
					);

					if (passwordMatchCheck) {
						return {
							id: user.id,
							email: user.email,
							fullName: user.fullName,
							userName: user.userName ?? "",
						};
					}
				}
				return null;
			},
		}),
	],
} satisfies NextAuthConfig;
