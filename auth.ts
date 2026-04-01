import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/services/auth.services";
import { generateSlug } from "@/lib/utils";
import NextAuth, { Session } from "next-auth";
import authConfig from "./auth.config";

export const { signIn, signOut, auth, handlers } = NextAuth({
	session: {
		strategy: "jwt",
		maxAge: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
	},

	callbacks: {
		async signIn({ user, account }) {
			let workspace;
			let member;

			if (
				account?.provider === "google" ||
				account?.provider === "github"
			) {
				if (!user.email) return false;

				const existingUser = await getUserByEmail(user.email);

				if (!existingUser) {
					const newUser = await db.user.create({
						data: {
							email: user.email,
							fullName: user.name!,
							userName: user.email.split("@")[0],
						},
					});

					user.id = newUser.id;
					user.userName = newUser.userName as string;

					const existingWorkspace = await db.workspace.findFirst({
						where: { createdById: newUser.id },
					});

					if (!existingWorkspace) {
						workspace = await db.workspace.create({
							data: {
								mode: "INDIVIDUAL",
								name: `${newUser.fullName}'s Personal Desk`,
								slug: `${generateSlug(newUser.fullName)}-${newUser.id.slice(0, 6)}`,
								createdById: newUser.id,
								teamSize: "1",
							},
						});

						member = await db.member.create({
							data: {
								role: "OWNER",
								userId: newUser.id,
								workspaceId: workspace.id,
							},
						});
					}
				} else {
					user.id = existingUser.id;
					user.userName = existingUser.userName as string;
				}
			}

			console.log({ account, user, workspace, member });

			return true;
		},

		async jwt({ token, user, trigger, session }) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.fullName = user.fullName;
				token.userName = user.userName;
				token.currentWorkspaceId = user.currentWorkspaceId;
				token.currentWorkspaceMode = user.currentWorkspaceMode;
				token.currentWorkspaceRole = user.currentWorkspaceRole;
				token.currentWorkspaceName = user.currentWorkspaceName;
			}

			if (trigger === "update") {
				if (session?.userName) {
					token.userName = session.userName;
				}

				if (session?.currentWorkspaceId && token.id) {
					const member = await db.member.findUnique({
						where: {
							userId_workspaceId: {
								userId: token.id as string,
								workspaceId: session.currentWorkspaceId,
							},
						},
						select: {
							role: true,
							workspace: {
								select: {
									mode: true,
									name: true,
								},
							},
						},
					});

					if (member) {
						token.currentWorkspaceId = session.currentWorkspaceId;
						token.currentWorkspaceMode = member.workspace.mode;
						token.currentWorkspaceRole = member.role;
						token.currentWorkspaceName = member.workspace.name;
					}
				}
			}

			if (token.id && !token.currentWorkspaceId) {
				const firstMembership = await db.member.findFirst({
					where: {
						userId: token.id as string,
					},
					orderBy: {
						createdAt: "asc",
					},
					select: {
						workspaceId: true,
						role: true,
						workspace: {
							select: {
								mode: true,
								name: true,
							},
						},
					},
				});

				if (firstMembership) {
					token.currentWorkspaceId = firstMembership.workspaceId;
					token.currentWorkspaceMode = firstMembership.workspace.mode;
					token.currentWorkspaceRole = firstMembership.role;
					token.currentWorkspaceName = firstMembership.workspace.name;
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
					currentWorkspaceId: token.currentWorkspaceId as string,
					currentWorkspaceMode: token.currentWorkspaceMode as string,
					currentWorkspaceRole: token.currentWorkspaceRole as string,
					currentWorkspaceName: token.currentWorkspaceName as string,
				};

				session.user = sessionUser;
			}

			return session as Session;
		},

		async redirect({ url, baseUrl }) {
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
	},

	...authConfig,
});
