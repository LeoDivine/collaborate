import { db } from "@/lib/db";
import { signInSchema } from "@/lib/schemas/auth";
import { getUserByIdentifier } from "@/lib/services/auth.services";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
	adapter: PrismaAdapter(db),
	providers: [
		GitHub({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			allowDangerousEmailAccountLinking: true,
		}),
		Credentials({
			async authorize(credentials, _request) {
				const validatedFields = signInSchema.safeParse(credentials);
				if (validatedFields.success) {
					const { identifier, password } = validatedFields.data;
					const user = await getUserByIdentifier(identifier);
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
