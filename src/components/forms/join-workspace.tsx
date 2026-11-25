"use client";

import { Badge } from "@/components/ui/badge";
import { joinWorkspaceSchema } from "@/lib/schemas/workspace";
import { makeRequest } from "@/lib/services/request.services";
import { validateInviteCode } from "@/lib/services/invite.services";
import { getInitials } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { User } from "next-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getPusherClient } from "@/lib/pusher/client";
import {
	PUSHER_CHANNELS,
	PUSHER_EVENTS,
	MemberStatusUpdatedEventPayload,
} from "@/lib/pusher/events";
import type { Channel } from "pusher-js";

export type JoinWorkspaceValues = z.infer<typeof joinWorkspaceSchema>;

export default function JoinWorkspaceForm({ user }: { user?: User }) {
	const searchParams = useSearchParams();
	const codeFromUrl = searchParams.get("code") || searchParams.get("token") || "";

	const [loading, setLoading] = useState(false);
	const [workspace, setWorkspace] = useState<{
		id: string;
		name: string;
	}>();
	const [validatingCode, setValidatingCode] = useState(false);
	const [isFastTrack, setIsFastTrack] = useState(false);
	const [deactivatedNotice, setDeactivatedNotice] = useState<string | null>(null);

	const router = useRouter();

	const form = useForm<JoinWorkspaceValues>({
		defaultValues: {
			email: user?.email || "",
			name: user?.fullName || "",
			inviteToken: codeFromUrl,
		},
		resolver: zodResolver(joinWorkspaceSchema),
		mode: "all",
	});

	const watchedInviteToken = form.watch("inviteToken");
	const watchedEmail = form.watch("email");

	const handleValidateCode = useCallback(
		async (code: string, emailToTest?: string) => {
			if (!code?.trim()) {
				setWorkspace(undefined);
				setIsFastTrack(false);
				return null;
			}

			setValidatingCode(true);
			try {
				const res = await validateInviteCode(code.trim(), emailToTest);
				if ("isDeactivated" in res && res.isDeactivated) {
					setDeactivatedNotice(res.message);
					setWorkspace(undefined);
					setIsFastTrack(false);
					toast.error(res.message);
					return res;
				}
				if ("alreadyMember" in res && res.alreadyMember) {
					toast.info(res.message);
					if (user) {
						router.push("/dashboard");
					}
					return res;
				}
				if (res.valid && res.workspace) {
					setWorkspace({ id: res.workspace.id, name: res.workspace.name });
					setIsFastTrack(true);
					setDeactivatedNotice(null);
					return res;
				} else {
					setWorkspace(undefined);
					setIsFastTrack(false);
					return res;
				}
			} finally {
				setValidatingCode(false);
			}
		},
		[user, router],
	);

	// Handle URL invite code parameter
	useEffect(() => {
		if (codeFromUrl) {
			form.setValue("inviteToken", codeFromUrl);
			handleValidateCode(codeFromUrl, user?.email).then((res) => {
				if (res?.valid && res.workspace) {
					toast.success(`Invite code verified for "${res.workspace.name}"!`);
				}
			});
		}
	}, [codeFromUrl, user?.email, form, handleValidateCode]);

	// Auto-validate typed invite code with debounce
	useEffect(() => {
		const token = watchedInviteToken?.trim();
		if (!token) {
			setWorkspace(undefined);
			setIsFastTrack(false);
			return;
		}

		// Don't re-validate immediately if already validated from URL
		if (workspace && codeFromUrl && token.toUpperCase() === codeFromUrl.toUpperCase()) {
			return;
		}

		const timer = setTimeout(() => {
			handleValidateCode(token, watchedEmail || user?.email);
		}, 400);

		return () => clearTimeout(timer);
	}, [watchedInviteToken, watchedEmail, user?.email, workspace, codeFromUrl, handleValidateCode]);

	// Real-time listener for member status changes (deactivation / reactivation)
	useEffect(() => {
		const client = getPusherClient();
		if (!client) return;

		const targetChannels: Channel[] = [];

		// Subscribe to authenticated user channel if logged in
		if (user?.id) {
			const userChannel = client.subscribe(PUSHER_CHANNELS.getUserChannel(user.id));
			targetChannels.push(userChannel);
		}

		// Subscribe to selected workspace channel
		if (workspace?.id) {
			const wsChannel = client.subscribe(PUSHER_CHANNELS.getWorkspaceChannel(workspace.id));
			targetChannels.push(wsChannel);
		}

		const handleStatusUpdated = (data: MemberStatusUpdatedEventPayload) => {
			const currentEmail = (form.getValues("email") || user?.email || "")
				.trim()
				.toLowerCase();
			const eventEmail = data.userEmail?.trim().toLowerCase();

			const isMatch =
				(user?.id && data.userId === user.id) ||
				(currentEmail && eventEmail && currentEmail === eventEmail);

			if (!isMatch) return;

			// If the update applies to this workspace (or no workspace explicitly locked yet)
			if (!workspace?.id || data.workspaceId === workspace.id) {
				const wsName = data.workspaceName || workspace?.name || "this workspace";

				if (data.status === "INACTIVE") {
					const reasonText = data.reason ? ` Reason: "${data.reason}".` : "";
					const msg = `Your membership in "${wsName}" has been deactivated.${reasonText} You cannot rejoin or access this workspace.`;
					setDeactivatedNotice(msg);
					setIsFastTrack(false);
					toast.error(msg, { duration: 7000 });
				} else if (data.status === "ACTIVE") {
					setDeactivatedNotice(null);
					toast.success(
						`Your membership in "${wsName}" has been reactivated! You can now join or access the workspace.`,
						{ duration: 5000 },
					);
				}
			}
		};

		targetChannels.forEach((ch) => {
			ch.bind(PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED, handleStatusUpdated);
		});

		return () => {
			targetChannels.forEach((ch) => {
				ch.unbind(PUSHER_EVENTS.WORKSPACE_MEMBER_STATUS_UPDATED, handleStatusUpdated);
			});
			if (user?.id) {
				client.unsubscribe(PUSHER_CHANNELS.getUserChannel(user.id));
			}
			if (workspace?.id) {
				client.unsubscribe(PUSHER_CHANNELS.getWorkspaceChannel(workspace.id));
			}
		};
	}, [user?.id, user?.email, workspace?.id, workspace?.name, form]);

	const handleSubmit = async (values: JoinWorkspaceValues) => {
		const token = values.inviteToken?.trim();
		if (!token) {
			toast.error("Please enter an invite code");
			return;
		}

		setLoading(true);

		try {
			setDeactivatedNotice(null);

			let targetWorkspace = workspace;
			if (!targetWorkspace?.id) {
				const validation = await validateInviteCode(token, values.email || user?.email);
				if ("isDeactivated" in validation && validation.isDeactivated) {
					setDeactivatedNotice(validation.message);
					toast.error(validation.message);
					return;
				}
				if ("alreadyMember" in validation && validation.alreadyMember) {
					toast.info(validation.message);
					if (user) {
						router.push("/dashboard");
					}
					return;
				}
				if (!validation.valid || !validation.workspace) {
					toast.error(validation.message || "Invalid invite code");
					return;
				}
				targetWorkspace = { id: validation.workspace.id, name: validation.workspace.name };
				setWorkspace(targetWorkspace);
			}

			const res = await makeRequest(values, targetWorkspace.id, user);
			if (!res.success) {
				toast.error(res.message);
				if ("isDeactivated" in res && res.isDeactivated) {
					setDeactivatedNotice(res.message);
					return;
				}
				if ("alreadyMember" in res && res.alreadyMember && user) {
					router.push("/dashboard");
				}
			} else {
				toast.success(res.message);
				if ("instantJoined" in res && res.instantJoined) {
					if (user) {
						router.push("/dashboard");
					} else {
						router.push(`/sign-in?email=${encodeURIComponent(values.email)}`);
					}
				} else {
					if (user) {
						router.push("/sign-in/my-workspaces");
					} else {
						router.push("/");
					}
				}
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form
				className="w-full md:w-[60%] mt-[30px] flex flex-col gap-5"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				{/* Deactivated Notice if applicant was deactivated */}
				{deactivatedNotice && (
					<div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-[12px] p-4 flex items-start gap-3 text-xs">
						<TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
						<div>
							<p className="font-semibold text-sm mb-1">Membership Deactivated</p>
							<p className="leading-relaxed">{deactivatedNotice}</p>
						</div>
					</div>
				)}

				{/* Verified Workspace banner */}
				{workspace && !deactivatedNotice && (
					<div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 rounded-[12px] p-4 flex items-center justify-between text-xs">
						<div className="flex items-center gap-3">
							<div className="text-primary w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-secondary font-bold text-sm">
								{getInitials(workspace.name)}
							</div>
							<div>
								<p className="font-semibold text-sm text-primary">Joining &quot;{workspace.name}&quot;</p>
								<p className="text-muted-foreground text-[11px]">Valid invite code verified</p>
							</div>
						</div>
						<Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px]">
							<Check className="w-3.5 h-3.5 mr-1" /> Verified
						</Badge>
					</div>
				)}

				<FormField
					name="name"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">Full Name</Label>
							<Input
								disabled={loading}
								{...field}
								placeholder="Enter your full name"
								className="text-primary py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<Label className="text-primary">
								Email Address
							</Label>
							<Input
								disabled={loading}
								{...field}
								placeholder="Enter your email address"
								className="text-primary py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					name="inviteToken"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-col gap-2">
							<div className="flex justify-between items-center">
								<Label className="text-primary">
									Invite Code
								</Label>
								{workspace && isFastTrack && (
									<Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
										<Check className="w-3 h-3 mr-1" /> Valid Code
									</Badge>
								)}
							</div>
							<div className="relative">
								<Input
									disabled={loading}
									{...field}
									placeholder="Enter your invite code (e.g. INV-XXXX-XXXX)"
									className="text-primary py-[20px] rounded-[10px] text-base sm:text-sm border-t-0 border-l-0 border-r-0 outline-0 focus-visible:ring-0 bg-white border-b-[4px] border-primary font-mono uppercase"
								/>
								{validatingCode && (
									<LoaderCircle className="right-3 top-1/2 -translate-y-1/2 absolute animate-spin w-4 h-4 text-primary" />
								)}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="w-full mt-2">
					<Button
						disabled={loading || !!deactivatedNotice}
						type="submit"
						className="w-full py-[22px] rounded-full text-secondary bg-primary hover:bg-primary/90 font-semibold disabled:opacity-50"
					>
						{loading ? (
							<div className="flex items-center gap-3">
								<LoaderCircle className="animate-spin w-4 h-4" />
								Processing...
							</div>
						) : deactivatedNotice ? (
							"Membership Deactivated"
						) : (
							"Join Workspace"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
