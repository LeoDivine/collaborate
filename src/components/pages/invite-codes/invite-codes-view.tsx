"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	createInviteCode,
	revokeInviteCode,
} from "@/lib/services/invite.services";
import { formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	Check,
	CircleDashed,
	Clock,
	Copy,
	KeyRound,
	Link2,
	LoaderCircle,
	Plus,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InviteCodeType } from "../../../../generated/prisma/enums";

interface InviteCodeItem {
	id: string;
	code: string;
	createdAt: Date | string;
	timeLimit: Date | string;
	type: InviteCodeType;
	reservedFor?: string | null;
	workspaceId: string;
	isUsed?: boolean;
	usedCount?: number;
	usedBy?: {
		fullName?: string | null;
		email?: string | null;
		reviewedAt?: Date | string;
	} | null;
	createdBy?: {
		user?: {
			fullName?: string | null;
			email?: string | null;
		} | null;
	} | null;
}

export default function InviteCodesView({
	inviteCodes: initialCodes,
	existingMemberEmails = [],
	workspaceId,
	workspaceName,
}: {
	inviteCodes: InviteCodeItem[];
	existingMemberEmails?: string[];
	workspaceId: string;
	workspaceName?: string;
}) {
	const [inviteCodes, setInviteCodes] = useState<InviteCodeItem[]>(initialCodes);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [revokingId, setRevokingId] = useState<string | null>(null);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	// Form state
	const [type, setType] = useState<InviteCodeType>("OPEN");
	const [reservedFor, setReservedFor] = useState("");
	const [expiresInHours, setExpiresInHours] = useState("168"); // 7 days

	const normalizedReserved = reservedFor.trim().toLowerCase();
	const isAlreadyMember =
		type === "RESERVED" &&
		normalizedReserved.length > 0 &&
		existingMemberEmails.some((e) => e.toLowerCase() === normalizedReserved);

	const handleCreate = async () => {
		if (type === "RESERVED") {
			if (!reservedFor.trim()) {
				toast.error("Please enter a valid email for reserved invite codes");
				return;
			}
			if (isAlreadyMember) {
				toast.error(`"${reservedFor.trim()}" is already a member of this workspace`);
				return;
			}
		}

		setCreating(true);
		try {
			const res = await createInviteCode({
				workspaceId,
				type,
				reservedFor: type === "RESERVED" ? reservedFor.trim() : undefined,
				expiresInHours: Number(expiresInHours),
			});

			if (!res.success || !res.inviteCode) {
				toast.error(res.message);
			} else {
				toast.success(res.message);
				setInviteCodes((prev) => [res.inviteCode as any, ...prev]);
				setDialogOpen(false);
				setReservedFor("");
				setType("OPEN");
			}
		} catch (e) {
			toast.error("Failed to generate invite code");
		} finally {
			setCreating(false);
		}
	};

	const handleRevoke = async (id: string) => {
		setRevokingId(id);
		try {
			const res = await revokeInviteCode(id);
			if (!res.success) {
				toast.error(res.message);
			} else {
				toast.success(res.message);
				setInviteCodes((prev) => prev.filter((i) => i.id !== id));
			}
		} catch (e) {
			toast.error("Failed to revoke invite code");
		} finally {
			setRevokingId(null);
		}
	};

	const handleCopyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		setCopiedCode(code);
		toast.success(`Invite code "${code}" copied to clipboard`);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const handleCopyLink = (code: string) => {
		const baseUrl = window.location.origin;
		const joinLink = `${baseUrl}/join-workspace?code=${encodeURIComponent(code)}`;
		navigator.clipboard.writeText(joinLink);
		setCopiedCode(code);
		toast.success("Direct invite link copied to clipboard");
		setTimeout(() => setCopiedCode(null), 2000);
	};

	return (
		<div className="mt-[10px] flex gap-4 flex-col">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div>
					<div className="flex items-center gap-3">
						<p className="text-[20px] font-bold text-primary">
							Invite Codes
						</p>
						<Badge
							variant="outline"
							className="text-[11px] font-medium py-0.5 px-2 bg-primary/10 text-primary border-primary/20"
						>
							{inviteCodes.length} Active Codes
						</Badge>
					</div>
					<p className="text-[12px] text-muted-foreground mt-0.5">
						Generate fast-track invite codes for team members to join {workspaceName || "this workspace"} directly.
					</p>
				</div>

				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button className="rounded-full flex items-center gap-2">
							<Plus className="w-4 h-4" />
							<span>Generate Invite Code</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-primary text-secondary border-accent rounded-[20px] max-w-md">
						<DialogHeader>
							<DialogTitle className="text-lg font-bold flex items-center gap-2">
								<KeyRound className="w-5 h-5 text-accent" />
								Generate Workspace Invite Code
							</DialogTitle>
							<DialogDescription className="text-secondary/70 text-xs mt-1">
								Invite codes allow applicants to bypass the request queue and join instantly.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4 my-3">
							{/* Invite Type */}
							<div className="flex flex-col gap-1.5">
								<Label className="text-xs font-semibold text-secondary/90">
									Invite Code Type
								</Label>
								<Select
									value={type}
									onValueChange={(val) => setType(val as InviteCodeType)}
								>
									<SelectTrigger className="bg-black/30 border-muted/30 text-secondary rounded-[10px] text-xs">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent className="bg-primary text-secondary border-accent">
										<SelectItem value="OPEN">
											Open (Anyone with the code can join)
										</SelectItem>
										<SelectItem value="RESERVED">
											Reserved (Restricted to specific email)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Reserved Email */}
							{type === "RESERVED" && (
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-semibold text-secondary/90">
										Target Email Address
									</Label>
									<Input
										type="email"
										value={reservedFor}
										onChange={(e) => setReservedFor(e.target.value)}
										placeholder="e.g. colleague@company.com"
										className={`bg-black/30 border text-secondary placeholder:text-muted-foreground rounded-[10px] text-xs transition-colors ${
											isAlreadyMember
												? "border-destructive focus-visible:ring-destructive"
												: "border-muted/30"
										}`}
									/>
									{isAlreadyMember ? (
										<p className="text-[11px] text-destructive font-medium flex items-center gap-1">
											<AlertCircle className="w-3.5 h-3.5 shrink-0" />
											This user is already a member of this workspace.
										</p>
									) : (
										<p className="text-[11px] text-muted-foreground">
											Only a user with this email address can redeem this code.
										</p>
									)}
								</div>
							)}

							{/* Expiration Duration */}
							<div className="flex flex-col gap-1.5">
								<Label className="text-xs font-semibold text-secondary/90">
									Expiration Period
								</Label>
								<Select
									value={expiresInHours}
									onValueChange={setExpiresInHours}
								>
									<SelectTrigger className="bg-black/30 border-muted/30 text-secondary rounded-[10px] text-xs">
										<SelectValue placeholder="Select expiration" />
									</SelectTrigger>
									<SelectContent className="bg-primary text-secondary border-accent">
										<SelectItem value="24">24 Hours</SelectItem>
										<SelectItem value="72">3 Days</SelectItem>
										<SelectItem value="168">7 Days (Default)</SelectItem>
										<SelectItem value="720">30 Days</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className="flex gap-2 justify-end">
							<Button
								variant="ghost"
								disabled={creating}
								onClick={() => setDialogOpen(false)}
								className="rounded-full text-secondary/80 hover:text-secondary hover:bg-white/10"
							>
								Cancel
							</Button>
							<Button
								disabled={creating || isAlreadyMember}
								onClick={handleCreate}
								className="rounded-full bg-secondary text-primary hover:bg-secondary/90 flex items-center gap-2 disabled:opacity-50"
							>
								{creating ? (
									<>
										<LoaderCircle className="w-4 h-4 animate-spin" />
										Generating...
									</>
								) : (
									"Create Code"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Table / Empty State */}
			<div>
				{inviteCodes.length === 0 ? (
					<div className="bg-[#a49f9f] text-[#222222] flex justify-center py-16 px-6 flex-col items-center rounded-[20px] text-center">
						<div className="bg-[#8b8686] text-[#222222] p-4 rounded-full mb-3">
							<CircleDashed className="w-6 h-6 text-[#222222]" />
						</div>
						<p className="text-[#222222] text-base font-bold">
							No Invite Codes Generated Yet
						</p>
						<p className="text-xs text-center text-[#222222]/80 mt-1 max-w-sm">
							Generate an invite code or share a direct join link to invite new members to this workspace instantly.
						</p>
					</div>
				) : (
					<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead>Invite Code</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Target Recipient</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Expires In</TableHead>
								<TableHead>Created By</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{inviteCodes.map((item) => {
								const isExpired = new Date() > new Date(item.timeLimit);
								const isCopied = copiedCode === item.code;
								return (
									<TableRow key={item.id}>
										{/* Code */}
										<TableCell>
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className={`font-mono text-xs font-semibold py-1 px-2.5 tracking-wider ${
														item.type === "RESERVED"
															? "bg-[#33419D] text-white border border-[#33419D]"
															: "bg-[#339D3A] text-white border border-[#339D3A]"
													}`}
												>
													{item.code}
												</Badge>
												<button
													onClick={() => handleCopyCode(item.code)}
													className="p-1 rounded hover:bg-white/10 transition-colors text-secondary/70 hover:text-white"
													title="Copy code"
												>
													{isCopied ? (
														<Check className="w-3.5 h-3.5 text-emerald-500" />
													) : (
														<Copy className="w-3.5 h-3.5" />
													)}
												</button>
											</div>
										</TableCell>

										{/* Type */}
										<TableCell>
											<Badge
												className={
													item.type === "OPEN"
														? "bg-[#339D3A] text-white border-[#339D3A]"
														: "bg-[#33419D] text-white border-[#33419D]"
												}
											>
												{item.type}
											</Badge>
										</TableCell>

										{/* Target */}
										<TableCell>
											{item.reservedFor ? (
												<span className="text-xs font-medium">
													{item.reservedFor}
												</span>
											) : (
												<span className="text-xs text-muted-foreground">
													Anyone with code
												</span>
											)}
										</TableCell>

										{/* Status */}
										<TableCell>
											{item.isUsed ? (
												<div className="flex items-center gap-1.5">
													<Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] flex items-center gap-1">
														<Check className="w-3 h-3 text-blue-400" />
														Used
													</Badge>
													{item.type === "OPEN" && (item.usedCount ?? 0) > 1 && (
														<span className="text-[10px] text-muted-foreground font-mono">
															({item.usedCount}x)
														</span>
													)}
												</div>
											) : isExpired ? (
												<Badge variant="destructive" className="text-[10px]">
													Expired
												</Badge>
											) : (
												<Badge className="bg-emerald-500 text-white text-[10px]">
													Active
												</Badge>
											)}
										</TableCell>

										{/* Expires In */}
										<TableCell className="whitespace-nowrap text-xs text-muted-foreground">
											<div className="flex items-center gap-1.5">
												<Clock className="w-3.5 h-3.5" />
												{isExpired
													? "Expired"
													: formatDistanceToNow(new Date(item.timeLimit), {
															addSuffix: true,
														})}
											</div>
										</TableCell>

										{/* Created By */}
										<TableCell className="text-xs text-muted-foreground">
											{item.createdBy?.user?.fullName || "Admin"}
										</TableCell>

										{/* Actions */}
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button
													size="sm"
													variant="ghost"
													disabled={isExpired || (item.type === "RESERVED" && Boolean(item.isUsed))}
													onClick={() => handleCopyLink(item.code)}
													className="h-8 px-2.5 rounded-full text-xs text-secondary hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors disabled:opacity-40"
												>
													<Link2 className="w-3.5 h-3.5" />
													<span>Copy Link</span>
												</Button>

												<Button
													size="sm"
													variant="ghost"
													disabled={revokingId === item.id}
													onClick={() => handleRevoke(item.id)}
													className="h-8 px-2 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
													title="Revoke code"
												>
													{revokingId === item.id ? (
														<LoaderCircle className="w-3.5 h-3.5 animate-spin" />
													) : (
														<Trash2 className="w-3.5 h-3.5" />
													)}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}
