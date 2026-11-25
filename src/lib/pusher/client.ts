import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient | null => {
	if (typeof window === "undefined") {
		return null;
	}

	if (pusherClientInstance) {
		return pusherClientInstance;
	}

	const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
	const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

	if (!key || !cluster) {
		console.warn(
			"[Pusher Client] NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER is not set. Real-time updates will be inactive until configured."
		);
		return null;
	}

	pusherClientInstance = new PusherClient(key, {
		cluster,
		authEndpoint: "/api/pusher/auth",
	});

	return pusherClientInstance;
};
