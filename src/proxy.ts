import { auth } from "../auth";
import {
	apiAuthPrefix,
	authRoutes,
	protectedRoutes,
	publicRoutes,
} from "../routes";

export default auth((req) => {
	const { nextUrl } = req;
	const pathname = nextUrl.pathname;
	const isLoggedIn = !!req.auth;

	const isApiRoute = pathname.startsWith(apiAuthPrefix);
	const isPublicRoute = publicRoutes.includes(pathname);
	const isAuthRoute = authRoutes.includes(pathname);
	const isProtectedRoute = protectedRoutes.includes(pathname);
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
