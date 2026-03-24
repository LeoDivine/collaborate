import { signInSchema } from "@/lib/schemas/auth";
import { getUserByEmail } from "@/lib/services/auth.services";
import bcrypt from "bcryptjs";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export default {
	adapter: PrismaAdapter(db),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			allowDangerousEmailAccountLinking: true,
		}),
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
