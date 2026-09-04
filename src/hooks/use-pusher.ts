"use client";

import { useEffect, useRef } from "react";
import { usePusher } from "@/components/providers/pusher-provider";
import {
	PUSHER_CHANNELS,
	PUSHER_EVENTS,
	CommentEventPayload,
	TaskEventPayload,
	ProjectEventPayload,
	ActivityEventPayload,
	MilestoneEventPayload,
	ResourceEventPayload,
	MembersEventPayload,
} from "@/lib/pusher/events";
import { Channel } from "pusher-js";

export { usePusher };

/**
 * Hook to automatically subscribe to a Pusher channel and unsubscribe on unmount.
 */
export function usePusherChannel(channelName: string | null | undefined): Channel | null {
	const { pusher } = usePusher();
	const channelRef = useRef<Channel | null>(null);

	useEffect(() => {
		if (!pusher || !channelName) return;

		const channel = pusher.subscribe(channelName);
		channelRef.current = channel;

		return () => {
			pusher.unsubscribe(channelName);
			channelRef.current = null;
		};
	}, [pusher, channelName]);

	return channelRef.current;
}

/**
 * Hook to listen to a specific Pusher event on a channel with automatic cleanup.
 */
export function usePusherEvent<T = unknown>(
	channelName: string | null | undefined,
	eventName: string,
	handler: (data: T) => void
) {
	const { pusher } = usePusher();
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		if (!pusher || !channelName || !eventName) return;

		const channel = pusher.subscribe(channelName);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const eventListener = (data: any) => {
			handlerRef.current?.(data);
		};

		channel.bind(eventName, eventListener);

		return () => {
			channel.unbind(eventName, eventListener);
		};
	}, [pusher, channelName, eventName]);
}

/**
 * Convenience hook for all single project-level real-time events.
 */
export function useProjectRealtime(
	projectId: string | null | undefined,
	callbacks?: {
		onActivityCreated?: (data: ActivityEventPayload) => void;
		onProjectUpdated?: (data: ProjectEventPayload) => void;
		onCommentCreated?: (data: CommentEventPayload) => void;
		onCommentUpdated?: (data: { commentId: string; message: string; comment?: unknown }) => void;
		onCommentDeleted?: (data: { commentId: string }) => void;
		onResourceAdded?: (data: ResourceEventPayload) => void;
		onResourceUpdated?: (data: ResourceEventPayload) => void;
		onResourceDeleted?: (data: ResourceEventPayload) => void;
		onMembersUpdated?: (data: MembersEventPayload) => void;
		onTaskCreated?: (data: { task: any; taskId?: string }) => void;
		onTaskUpdated?: (data: TaskEventPayload) => void;
		onTaskDeleted?: (data: { taskId: string }) => void;
	}
) {
	const channelName = projectId ? PUSHER_CHANNELS.getProjectChannel(projectId) : null;

	usePusherEvent<ActivityEventPayload>(channelName, PUSHER_EVENTS.ACTIVITY_CREATED, (data) => {
		callbacks?.onActivityCreated?.(data);
	});

	usePusherEvent<ProjectEventPayload>(channelName, PUSHER_EVENTS.PROJECT_UPDATED, (data) => {
		callbacks?.onProjectUpdated?.(data);
	});

	usePusherEvent<CommentEventPayload>(channelName, PUSHER_EVENTS.COMMENT_CREATED, (data) => {
		callbacks?.onCommentCreated?.(data);
	});

	usePusherEvent<{ commentId: string; message: string; comment?: unknown }>(
		channelName,
		PUSHER_EVENTS.COMMENT_UPDATED,
		(data) => {
			callbacks?.onCommentUpdated?.(data);
		}
	);

	usePusherEvent<{ commentId: string }>(channelName, PUSHER_EVENTS.COMMENT_DELETED, (data) => {
		callbacks?.onCommentDeleted?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_ADDED, (data) => {
		callbacks?.onResourceAdded?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_UPDATED, (data) => {
		callbacks?.onResourceUpdated?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_DELETED, (data) => {
		callbacks?.onResourceDeleted?.(data);
	});

	usePusherEvent<MembersEventPayload>(channelName, PUSHER_EVENTS.MEMBERS_UPDATED, (data) => {
		callbacks?.onMembersUpdated?.(data);
	});

	usePusherEvent<{ task: any; taskId?: string }>(channelName, PUSHER_EVENTS.TASK_CREATED, (data) => {
		callbacks?.onTaskCreated?.(data);
	});

	usePusherEvent<TaskEventPayload>(channelName, PUSHER_EVENTS.TASK_UPDATED, (data) => {
		callbacks?.onTaskUpdated?.(data);
	});

	usePusherEvent<{ taskId: string }>(channelName, PUSHER_EVENTS.TASK_DELETED, (data) => {
		callbacks?.onTaskDeleted?.(data);
	});
}

/**
 * Convenience hook for all single task-level real-time events.
 */
export function useTaskRealtime(
	taskId: string | null | undefined,
	callbacks?: {
		onActivityCreated?: (data: ActivityEventPayload) => void;
		onTaskUpdated?: (data: TaskEventPayload) => void;
		onCommentCreated?: (data: CommentEventPayload) => void;
		onCommentUpdated?: (data: { commentId: string; message: string; comment?: unknown }) => void;
		onCommentDeleted?: (data: { commentId: string }) => void;
		onMilestoneCreated?: (data: MilestoneEventPayload) => void;
		onMilestoneUpdated?: (data: MilestoneEventPayload) => void;
		onMilestoneDeleted?: (data: MilestoneEventPayload) => void;
		onResourceAdded?: (data: ResourceEventPayload) => void;
		onResourceUpdated?: (data: ResourceEventPayload) => void;
		onResourceDeleted?: (data: ResourceEventPayload) => void;
		onMembersUpdated?: (data: MembersEventPayload) => void;
	}
) {
	const channelName = taskId ? PUSHER_CHANNELS.getTaskChannel(taskId) : null;

	usePusherEvent<ActivityEventPayload>(channelName, PUSHER_EVENTS.ACTIVITY_CREATED, (data) => {
		callbacks?.onActivityCreated?.(data);
	});

	usePusherEvent<TaskEventPayload>(channelName, PUSHER_EVENTS.TASK_UPDATED, (data) => {
		callbacks?.onTaskUpdated?.(data);
	});

	usePusherEvent<CommentEventPayload>(channelName, PUSHER_EVENTS.COMMENT_CREATED, (data) => {
		callbacks?.onCommentCreated?.(data);
	});

	usePusherEvent<{ commentId: string; message: string; comment?: unknown }>(
		channelName,
		PUSHER_EVENTS.COMMENT_UPDATED,
		(data) => {
			callbacks?.onCommentUpdated?.(data);
		}
	);

	usePusherEvent<{ commentId: string }>(channelName, PUSHER_EVENTS.COMMENT_DELETED, (data) => {
		callbacks?.onCommentDeleted?.(data);
	});

	usePusherEvent<MilestoneEventPayload>(channelName, PUSHER_EVENTS.MILESTONE_CREATED, (data) => {
		callbacks?.onMilestoneCreated?.(data);
	});

	usePusherEvent<MilestoneEventPayload>(channelName, PUSHER_EVENTS.MILESTONE_UPDATED, (data) => {
		callbacks?.onMilestoneUpdated?.(data);
	});

	usePusherEvent<MilestoneEventPayload>(channelName, PUSHER_EVENTS.MILESTONE_DELETED, (data) => {
		callbacks?.onMilestoneDeleted?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_ADDED, (data) => {
		callbacks?.onResourceAdded?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_UPDATED, (data) => {
		callbacks?.onResourceUpdated?.(data);
	});

	usePusherEvent<ResourceEventPayload>(channelName, PUSHER_EVENTS.RESOURCE_DELETED, (data) => {
		callbacks?.onResourceDeleted?.(data);
	});

	usePusherEvent<MembersEventPayload>(channelName, PUSHER_EVENTS.MEMBERS_UPDATED, (data) => {
		callbacks?.onMembersUpdated?.(data);
	});
}

/**
 * Convenience hook for workspace-level real-time events.
 */
export function useWorkspaceRealtime(
	workspaceId: string | null | undefined,
	callbacks?: {
		onActivityCreated?: (data: ActivityEventPayload) => void;
		onTaskCreated?: (data: { task: any; taskId?: string }) => void;
		onTaskUpdated?: (data: TaskEventPayload) => void;
		onTaskDeleted?: (data: { taskId: string }) => void;
		onProjectCreated?: (data: { project: any; projectId?: string }) => void;
		onProjectUpdated?: (data: ProjectEventPayload) => void;
		onProjectDeleted?: (data: { projectId: string }) => void;
		onMemberJoined?: (data: unknown) => void;
	}
) {
	const channelName = workspaceId ? PUSHER_CHANNELS.getWorkspaceChannel(workspaceId) : null;

	usePusherEvent<ActivityEventPayload>(channelName, PUSHER_EVENTS.ACTIVITY_CREATED, (data) => {
		callbacks?.onActivityCreated?.(data);
	});

	usePusherEvent<{ project: any; projectId?: string }>(channelName, PUSHER_EVENTS.PROJECT_CREATED, (data) => {
		callbacks?.onProjectCreated?.(data);
	});

	usePusherEvent<ProjectEventPayload>(channelName, PUSHER_EVENTS.PROJECT_UPDATED, (data) => {
		callbacks?.onProjectUpdated?.(data);
	});

	usePusherEvent<{ projectId: string }>(channelName, PUSHER_EVENTS.PROJECT_DELETED, (data) => {
		callbacks?.onProjectDeleted?.(data);
	});

	usePusherEvent<{ task: any; taskId?: string }>(channelName, PUSHER_EVENTS.TASK_CREATED, (data) => {
		callbacks?.onTaskCreated?.(data);
	});

	usePusherEvent<TaskEventPayload>(channelName, PUSHER_EVENTS.TASK_UPDATED, (data) => {
		callbacks?.onTaskUpdated?.(data);
	});

	usePusherEvent<{ taskId: string }>(channelName, PUSHER_EVENTS.TASK_DELETED, (data) => {
		callbacks?.onTaskDeleted?.(data);
	});

	usePusherEvent(channelName, PUSHER_EVENTS.WORKSPACE_MEMBER_JOINED, (data) => {
		callbacks?.onMemberJoined?.(data);
	});
}
