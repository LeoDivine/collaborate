import { RequestAcceptedEmailProps } from "@/lib/types";

export default function RequestAcceptedEmail({
	fullName,
	email,
	workspaceId,
	workspaceName,
	hasAccount,
}: RequestAcceptedEmailProps) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
	const accessUrl =
		hasAccount ?
			`${baseUrl}/c?fullName=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&requestWorkspace=${workspaceId}`
		:	`${baseUrl}/sign-up/individual-auth?fullName=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&requestWorkspace=${workspaceId}`;

	return (
		<div
			style={{
				fontFamily: "Arial, sans-serif",
				backgroundColor: "#f4f4f5",
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
					boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
					{/* Badge */}
					<div
						style={{
							display: "inline-block",
							backgroundColor: "#f0fdf4",
							color: "#16a34a",
							fontSize: "13px",
							fontWeight: "600",
							padding: "4px 12px",
							borderRadius: "999px",
							marginBottom: "24px",
							border: "1px solid #bbf7d0",
						}}
					>
						Request Accepted
					</div>

					<h2
						style={{
							fontSize: "24px",
							fontWeight: "700",
							color: "#18181b",
							margin: "0 0 12px",
							lineHeight: "1.3",
						}}
					>
						You&apos;re in, {fullName}!
					</h2>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 8px",
						}}
					>
						Great news — your request to join {workspaceName} has
						been{" "}
						<strong style={{ color: "#18181b" }}>accepted</strong>.{" "}
						{hasAccount ?
							"Sign in to your existing account to start collaborating with your team."
						:	"Complete your sign-up to start collaborating with your team."
						}
					</p>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 32px",
						}}
					>
						{hasAccount ?
							"Click the button below to sign in and access the workspace."
						:	"Click the button below to set up your account and access the workspace."
						}
					</p>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={accessUrl}
							style={{
								display: "inline-block",
								backgroundColor: "#18181b",
								color: "#ffffff",
								fontSize: "15px",
								fontWeight: "300",
								textDecoration: "none",
								padding: "14px 32px",
								borderRadius: "1000px",
								letterSpacing: "0.1px",
							}}
						>
							{hasAccount ?
								"Sign In to Your Workspace"
							:	"Access Your Workspace"}
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
						If the button doesn&apos;t work, copy and paste this
						link into your browser:
						<br />
						<a
							href={accessUrl}
							style={{
								color: "#71717a",
								wordBreak: "break-all" as const,
							}}
						>
							{accessUrl}
						</a>
					</p>
				</div>

				{/* Footer */}
				<div
					style={{
						borderTop: "1px solid #f4f4f5",
						padding: "20px 40px",
						backgroundColor: "#18181b",
						textAlign: "center" as const,
					}}
				>
					<p
						style={{
							fontSize: "12px",
							color: "#8a8a8a",
							backgroundColor: "#18181b",
							margin: "0",
						}}
					>
						You received this email because a workspace admin
						approved your request. If this wasn&apos;t you, please
						ignore this email.
					</p>
				</div>
			</div>
		</div>
	);
}
