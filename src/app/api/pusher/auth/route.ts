import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getPusherServer } from "@/lib/pusher/server";

export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const pusher = getPusherServer();
		if (!pusher) {
			return new NextResponse("Pusher server is not configured", { status: 500 });
		}

		const body = await req.formData();
		const socketId = body.get("socket_id") as string;
		const channel = body.get("channel_name") as string;

		if (!socketId || !channel) {
			return new NextResponse("Missing socket_id or channel_name", { status: 400 });
		}

		// Presence channel user data
		const presenceData = {
			user_id: session.user.id,
			user_info: {
				name: session.user.fullName || session.user.userName || "User",
				email: session.user.email,
			},
		};

		const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
		return NextResponse.json(authResponse);
	} catch (error) {
		console.error("[Pusher Auth] Error authorizing channel:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
