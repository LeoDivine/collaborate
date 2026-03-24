import { auth } from "../auth";
import {
	apiAuthPrefix,
	authRoutes,
	DEFAULT_LOGIN_REDIRECT,
	extendedRoutes,
	protectedRoutes,
	publicRoutes,
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
	const isAuthRoute = authRoutes.includes(pathname);
	const isProtectedRoute = protectedRoutes.includes(pathname);
	const isExtendedRoute = extendedRoutes.includes(pathname);

	if (isApiRoute) {
		return null;
	}

	if (isAuthRoute) {
		if (isLoggedIn) {
			return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
		}
		return null;
	}

	if (isLoggedIn && isAuthRoute) {
		return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
	}

	if (!isLoggedIn && !isPublicRoute) {
		return Response.redirect(new URL("/sign-in", nextUrl));
	}

	if (isProtectedRoute && isLoggedIn && !user?.currenWorkspaceId) {
		return Response.redirect(new URL("/sign-in/my-workspaces", nextUrl));
	}
 
	if (isExtendedRoute && user?.currenWorkspaceId) {
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
