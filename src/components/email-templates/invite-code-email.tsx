import { InviteCodeEmailProps } from "@/lib/types";
import { format } from "date-fns";

export default function InviteCodeEmail({
	invitedEmail,
	inviterName,
	workspaceName,
	code,
	timeLimit,
}: InviteCodeEmailProps) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4242";
	const joinUrl = `${baseUrl}/join-workspace?code=${encodeURIComponent(code)}&email=${encodeURIComponent(invitedEmail)}`;

	let formattedExpiry = "";
	try {
		formattedExpiry = format(new Date(timeLimit), "PPP 'at' p");
	} catch (e) {
		formattedExpiry = "soon";
	}

	return (
		<div
			style={{
				fontFamily: "Arial, sans-serif",
				backgroundColor: "#c5bebe",
				padding: "40px 0",
				minHeight: "100vh",
			}}
		>
			<div
				style={{
					maxWidth: "560px",
					margin: "0 auto",
					backgroundColor: "#ffffff",
					borderRadius: "12px",
					overflow: "hidden",
					boxShadow: "0 2px 8px rgba(34,34,34,0.08)",
				}}
			>
				{/* Header */}
				<div
					style={{
						backgroundColor: "#18181b",
						padding: "32px 40px",
						textAlign: "center" as const,
					}}
				>
					<img
						src="https://github.com/LeoDivine/collaborate/blob/main/public/resources/logo.png?raw=true"
						alt="Collaborate"
						width={140}
						style={{ display: "block", margin: "0 auto" }}
					/>
				</div>

				{/* Body */}
				<div style={{ padding: "40px 40px 32px" }}>
					<h2
						style={{
							fontSize: "24px",
							fontWeight: "700",
							color: "#18181b",
							margin: "0 0 12px",
							lineHeight: "1.3",
						}}
					>
						You&apos;re invited to join {workspaceName}!
					</h2>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 20px",
						}}
					>
						<strong style={{ color: "#18181b" }}>{inviterName}</strong> has
						invited you to collaborate in the{" "}
						<strong style={{ color: "#18181b" }}>{workspaceName}</strong> workspace.
						Using your reserved invite code, you can fast-track your registration
						and start collaborating immediately.
					</p>

					{/* Invite Code Box */}
					<div
						style={{
							backgroundColor: "#f4f4f5",
							border: "1px solid #e4e4e7",
							borderRadius: "10px",
							padding: "20px",
							textAlign: "center" as const,
							margin: "0 0 28px",
						}}
					>
						<p
							style={{
								fontSize: "12px",
								fontWeight: "600",
								textTransform: "uppercase" as const,
								letterSpacing: "0.5px",
								color: "#71717a",
								margin: "0 0 8px",
							}}
						>
							Your Exclusive Invite Code
						</p>
						<div
							style={{
								fontSize: "26px",
								fontWeight: "800",
								fontFamily: "monospace, Courier New",
								letterSpacing: "3px",
								color: "#18181b",
								margin: "0 0 8px",
							}}
						>
							{code}
						</div>
						<p
							style={{
								fontSize: "12px",
								color: "#a1a1aa",
								margin: "0",
							}}
						>
							Expires on {formattedExpiry}
						</p>
					</div>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={joinUrl}
							style={{
								display: "inline-block",
								backgroundColor: "#18181b",
								color: "#ffffff",
								fontSize: "15px",
								fontWeight: "500",
								textDecoration: "none",
								padding: "14px 36px",
								borderRadius: "1000px",
								letterSpacing: "0.1px",
							}}
						>
							Accept Invitation &amp; Join
						</a>
					</div>

					{/* Fallback link */}
					<p
						style={{
							fontSize: "12px",
							color: "#a1a1aa",
							lineHeight: "1.6",
							margin: "0",
							textAlign: "center" as const,
						}}
					>
						Or paste this link directly into your browser:
						<br />
						<a
							href={joinUrl}
							style={{
								color: "#71717a",
								wordBreak: "break-all" as const,
							}}
						>
							{joinUrl}
						</a>
					</p>
				</div>

				{/* Footer */}
				<div
					style={{
						borderTop: "1px solid #c5bebe",
						padding: "20px 40px",
						backgroundColor: "#18181b",
						textAlign: "center" as const,
					}}
				>
					<p
						style={{
							fontSize: "12px",
							color: "#8a8a8a",
							margin: "0",
						}}
					>
						This invitation was reserved specifically for <strong>{invitedEmail}</strong>.
						If you weren&apos;t expecting this invitation, you can safely ignore this email.
					</p>
				</div>
			</div>
		</div>
	);
}
