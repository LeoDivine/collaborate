"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import PusherClient, { Channel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_CHANNELS } from "@/lib/pusher/events";

interface PusherContextValue {
	pusher: PusherClient | null;
	isConnected: boolean;
	connectionState: string;
	subscribe: (channelName: string) => Channel | null;
	unsubscribe: (channelName: string) => void;
}

const PusherContext = createContext<PusherContextValue>({
	pusher: null,
	isConnected: false,
	connectionState: "disconnected",
	subscribe: () => null,
	unsubscribe: () => {},
});

interface PusherProviderProps {
	children: React.ReactNode;
	user?: {
		id?: string;
		email?: string;
		fullName?: string;
		userName?: string | null;
		currentWorkspaceId?: string;
	} | null;
}

export const PusherProvider: React.FC<PusherProviderProps> = ({ children, user }) => {
	const [pusher, setPusher] = useState<PusherClient | null>(null);
	const [connectionState, setConnectionState] = useState<string>("disconnected");
	const [isConnected, setIsConnected] = useState<boolean>(false);

	useEffect(() => {
		const client = getPusherClient();
		if (!client) {
			return;
		}

		setPusher(client);

		const handleStateChange = (states: { current: string; previous: string }) => {
			setConnectionState(states.current);
			setIsConnected(states.current === "connected");
		};

		client.connection.bind("state_change", handleStateChange);
		setConnectionState(client.connection.state);
		setIsConnected(client.connection.state === "connected");

		// Auto-subscribe to user notification channel
		let userChannel: Channel | null = null;
		if (user?.id) {
			userChannel = client.subscribe(PUSHER_CHANNELS.getUserChannel(user.id));
		}

		// Auto-subscribe to current workspace channel
		let workspaceChannel: Channel | null = null;
		if (user?.currentWorkspaceId) {
			workspaceChannel = client.subscribe(PUSHER_CHANNELS.getWorkspaceChannel(user.currentWorkspaceId));
		}

		return () => {
			client.connection.unbind("state_change", handleStateChange);
			if (user?.id) {
				client.unsubscribe(PUSHER_CHANNELS.getUserChannel(user.id));
			}
			if (user?.currentWorkspaceId) {
				client.unsubscribe(PUSHER_CHANNELS.getWorkspaceChannel(user.currentWorkspaceId));
			}
		};
	}, [user?.id, user?.currentWorkspaceId]);

	const subscribe = (channelName: string): Channel | null => {
		if (!pusher || !channelName) return null;
		return pusher.subscribe(channelName);
	};

	const unsubscribe = (channelName: string) => {
		if (!pusher || !channelName) return;
		pusher.unsubscribe(channelName);
	};

	return (
		<PusherContext.Provider
			value={{
				pusher,
				isConnected,
				connectionState,
				subscribe,
				unsubscribe,
			}}
		>
			{children}
		</PusherContext.Provider>
	);
};

export const usePusher = () => {
	const context = useContext(PusherContext);
	if (!context) {
		throw new Error("usePusher must be used within a PusherProvider");
	}
	return context;
};
