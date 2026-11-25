export const publicRoutes = ["/", "/join-workspace"];
export const protectedRoutes = [
	"/dashboard",
	"/activity",
	"/calendar",
	"/invite-codes",
	"/members",
	"/teams",
	"/notifications",
	"/projects",
	"/requests",
	"/settings",
	"/tasks",
	"/create-workspace",
];
export const workspaceOnlyRoutes = [
	"/activity",
	"/invite-codes",
	"/members",
	"/notifications",
	"/requests",
	"/teams",
];
export const authRoutes = [
	"/sign-in",
	"/sign-up",
	"/sign-up/individual-auth",
	"/sign-up/workspace-auth",
	"/forgot-password",
	"/reset-password",
];
export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
export const extendedRoutes = ["/sign-in/my-workspaces"];
export const userNameRoutes = [
	"/sign-up/individual-auth/username",
	"/sign-up/workspace-auth/username",
];
