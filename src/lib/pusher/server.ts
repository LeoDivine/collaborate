import Pusher from "pusher";
import { PusherEventType } from "./events";

// Lazy / Singleton initialization for Pusher Server
let pusherServerInstance: Pusher | null = null;

export const getPusherServer = (): Pusher | null => {
	if (pusherServerInstance) {
		return pusherServerInstance;
	}

	const appId = process.env.PUSHER_APP_ID;
	const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
	const secret = process.env.PUSHER_SECRET;
	const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

	if (!appId || !key || !secret || !cluster) {
		console.warn(
			"[Pusher Server] Pusher environment variables are missing. Please configure PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER."
		);
		return null;
	}

	pusherServerInstance = new Pusher({
		appId,
		key,
		secret,
		cluster,
		useTLS: true,
	});

	return pusherServerInstance;
};

/**
 * Trigger an event on one or more Pusher channels safely.
 */
export async function triggerPusherEvent<T = unknown>(
	channel: string | string[],
	event: PusherEventType | string,
	data: T
): Promise<boolean> {
	try {
		const pusher = getPusherServer();
		if (!pusher) {
			return false;
		}

		await pusher.trigger(channel, event, data);
		return true;
	} catch (error) {
		console.error(`[Pusher Server] Failed to trigger event "${event}" on channel "${channel}":`, error);
		return false;
	}
}

export const pusherServer = {
	trigger: triggerPusherEvent,
	getInstance: getPusherServer,
};
