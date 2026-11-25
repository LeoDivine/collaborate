import { auth } from "../auth";
import {
	apiAuthPrefix,
	authRoutes,
	DEFAULT_LOGIN_REDIRECT,
	extendedRoutes,
	protectedRoutes,
	publicRoutes,
	userNameRoutes,
	workspaceOnlyRoutes,
} from "../routes";

export default auth((req) => {
	const { nextUrl } = req;
	const pathname = nextUrl.pathname;
	const session = req.auth;
	const user = session?.user;
	const isLoggedIn = !!req.auth;

	// console.log({ isLoggedIn, session });

	const isApiRoute = pathname.startsWith(apiAuthPrefix);
	const isPublicRoute = publicRoutes.includes(pathname);
	const isExtendedRoute = extendedRoutes.includes(pathname);
	const isUserNameRoute = userNameRoutes.includes(pathname);
	const isAuthRoute =
		!isExtendedRoute && !isUserNameRoute && authRoutes.includes(pathname);
	const isProtectedRoute = protectedRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);

	if (isApiRoute) {
		return null;
	}

	if (pathname === "/c") {
		return null;
	}

	if (isAuthRoute) {
		if (isLoggedIn) {
			return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
		}
		return null;
	}

	if (!isLoggedIn && !isPublicRoute) {
		return Response.redirect(new URL("/sign-in", nextUrl));
	}

	if (isLoggedIn && pathname === "/") {
		return Response.redirect(new URL("/dashboard", nextUrl));
	}

	if (isProtectedRoute && isLoggedIn && !user?.currentWorkspaceId) {
		return Response.redirect(new URL("/sign-in/my-workspaces", nextUrl));
	}

	const isWorkspaceOnlyRoute = workspaceOnlyRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);

	if (
		isLoggedIn &&
		user?.currentWorkspaceMode === "INDIVIDUAL" &&
		isWorkspaceOnlyRoute
	) {
		return Response.redirect(new URL("/dashboard", nextUrl));
	}

	if (isUserNameRoute && user?.userName) {
		return Response.redirect(new URL("/dashboard", nextUrl));
	}

	return null;
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
