"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PusherClient, { Channel, PresenceChannel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher/client";
import {
	PUSHER_CHANNELS,
	PUSHER_EVENTS,
	MemberStatusUpdatedEventPayload,
} from "@/lib/pusher/events";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PusherContextValue {
	pusher: PusherClient | null;
	isConnected: boolean;
	connectionState: string;
	user?: PusherProviderProps["user"];
	onlineUserIds: Set<string>;
	isUserOnline: (userId: string | null | undefined) => boolean;
	onlineCount: number;
	subscribe: (channelName: string) => Channel | null;
	unsubscribe: (channelName: string) => void;
}

const PusherContext = createContext<PusherContextValue>({
	pusher: null,
	isConnected: false,
	connectionState: "disconnected",
	onlineUserIds: new Set(),
	isUserOnline: () => false,
	onlineCount: 0,
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
	const router = useRouter();
	const [pusher, setPusher] = useState<PusherClient | null>(null);
	const [connectionState, setConnectionState] = useState<string>("disconnected");
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

	const isUserOnline = useCallback(
		(userId: string | null | undefined): boolean => {
			if (!userId) return false;
			if (user?.id && String(userId) === String(user.id)) return true;
			return onlineUserIds.has(String(userId));
		},
		[user?.id, onlineUserIds],
	);

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

		const handleStatusUpdated = (data: MemberStatusUpdatedEventPayload) => {
			if (
				data.userId === user?.id &&
				data.status === "INACTIVE" &&
				(!user?.currentWorkspaceId || data.workspaceId === user.currentWorkspaceId)
			) {
				toast.error(
					data.reason
						? `Your access to ${data.workspaceName || "this workspace"} has been deactivated: "${data.reason}"`
						: `Your access to ${data.workspaceName || "this workspace"} has been deactivated by an administrator.`,
					{ duration: 8000 },
				);
				router.push("/sign-in/my-workspaces");
			}
		};

		// Auto-subscribe to user notification channel
		let userChannel: Channel | null = null;
		if (user?.id) {
			userChannel = client.subscribe(PUSHER_CHANNELS.getUserChannel(user.id));
			userChannel.bind(
				PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
				handleStatusUpdated,
			);
		}

		// Auto-subscribe to current workspace channel
		let workspaceChannel: Channel | null = null;
		if (user?.currentWorkspaceId) {
			workspaceChannel = client.subscribe(PUSHER_CHANNELS.getWorkspaceChannel(user.currentWorkspaceId));
			workspaceChannel.bind(
				PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
				handleStatusUpdated,
			);
		}

		// Auto-subscribe to presence channel for current workspace
		let presenceChannel: PresenceChannel | null = null;
		if (user?.currentWorkspaceId) {
			const presenceChannelName = PUSHER_CHANNELS.getPresenceWorkspaceChannel(
				user.currentWorkspaceId,
			);
			presenceChannel = client.subscribe(presenceChannelName) as PresenceChannel;

			const handleSubscriptionSucceeded = (members: any) => {
				const ids = new Set<string>();
				if (members?.each && typeof members.each === "function") {
					members.each((member: any) => {
						if (member?.id) ids.add(String(member.id));
					});
				} else if (members?.members) {
					Object.keys(members.members).forEach((id) => ids.add(String(id)));
				}
				setOnlineUserIds(ids);
			};

			const handleMemberAdded = (member: any) => {
				if (member?.id) {
					setOnlineUserIds((prev) => {
						const next = new Set(prev);
						next.add(String(member.id));
						return next;
					});
				}
			};

			const handleMemberRemoved = (member: any) => {
				if (member?.id) {
					setOnlineUserIds((prev) => {
						const next = new Set(prev);
						next.delete(String(member.id));
						return next;
					});
				}
			};

			presenceChannel.bind(
				"pusher:subscription_succeeded",
				handleSubscriptionSucceeded,
			);
			presenceChannel.bind("pusher:member_added", handleMemberAdded);
			presenceChannel.bind("pusher:member_removed", handleMemberRemoved);
		}

		return () => {
			client.connection.unbind("state_change", handleStateChange);
			if (user?.id) {
				if (userChannel) {
					userChannel.unbind(
						PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
						handleStatusUpdated,
					);
				}
				client.unsubscribe(PUSHER_CHANNELS.getUserChannel(user.id));
			}
			if (user?.currentWorkspaceId) {
				if (workspaceChannel) {
					workspaceChannel.unbind(
						PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED,
						handleStatusUpdated,
					);
				}
				client.unsubscribe(PUSHER_CHANNELS.getWorkspaceChannel(user.currentWorkspaceId));
				if (presenceChannel) {
					presenceChannel.unbind("pusher:subscription_succeeded");
					presenceChannel.unbind("pusher:member_added");
					presenceChannel.unbind("pusher:member_removed");
					client.unsubscribe(
						PUSHER_CHANNELS.getPresenceWorkspaceChannel(user.currentWorkspaceId),
					);
				}
			}
		};
	}, [user?.id, user?.currentWorkspaceId, router]);

	const subscribe = useCallback(
		(channelName: string): Channel | null => {
			if (!pusher || !channelName) return null;
			return pusher.subscribe(channelName);
		},
		[pusher],
	);

	const unsubscribe = useCallback(
		(channelName: string) => {
			if (!pusher || !channelName) return;
			pusher.unsubscribe(channelName);
		},
		[pusher],
	);

	const contextValue = useMemo(
		() => ({
			pusher,
			isConnected,
			connectionState,
			user,
			onlineUserIds,
			isUserOnline,
			onlineCount: onlineUserIds.size,
			subscribe,
			unsubscribe,
		}),
		[pusher, isConnected, connectionState, user, onlineUserIds, isUserOnline, subscribe, unsubscribe],
	);

	return (
		<PusherContext.Provider
			value={contextValue}
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
