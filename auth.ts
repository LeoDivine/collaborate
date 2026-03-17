import NextAuth, { Session } from "next-auth";
import authConfig from "./auth.config";

export const { signIn, signOut, auth, handlers } = NextAuth({
	session: {
		strategy: "jwt",
	},

	callbacks: {
		async jwt({ token, user, trigger, session }) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.fullName = user.fullName;
				token.userName = user.userName;
				token.currenWorkspaceId = user.currenWorkspaceId;
				token.currentWorkspaceMode = user.currentWorkspaceMode;
			}

			if (trigger === "update") {
				if (session?.userName) {
					token.userName = session.userName;
				}
				if (session?.currenWorkspaceId) {
					token.currenWorkspaceId = session.currenWorkspaceId;
				}
				if (session?.currentWorkspaceMode) {
					token.currentWorkspaceMode = session.currentWorkspaceMode;
				}
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				const sessionUser = {
					...session.user,
					id: token.id as string,
					email: token.email as string,
					fullName: token.fullName as string,
					userName: token.userName as string,
				};

				session.user = sessionUser;
			}

			return session as Session;
		},
	},

	...authConfig,
});
