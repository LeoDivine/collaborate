import React from "react";

export interface ResetPasswordEmailProps {
	fullName: string;
	resetUrl: string;
}

export default function ResetPasswordEmail({
	fullName,
	resetUrl,
}: ResetPasswordEmailProps) {
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
						Reset your password
					</h2>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 8px",
						}}
					>
						Hi {fullName || "there"}, we received a request to reset the password for your Collaborate account.
					</p>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 32px",
						}}
					>
						Click the button below to choose a new password. This link will expire in 1 hour.
					</p>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={resetUrl}
							style={{
								display: "inline-block",
								backgroundColor: "#18181b",
								color: "#ffffff",
								fontSize: "15px",
								fontWeight: "500",
								textDecoration: "none",
								padding: "14px 32px",
								borderRadius: "1000px",
								letterSpacing: "0.1px",
							}}
						>
							Reset Password
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
						If the button doesn&apos;t work, copy and paste this link into your browser:
						<br />
						<a
							href={resetUrl}
							style={{
								color: "#71717a",
								wordBreak: "break-all" as const,
							}}
						>
							{resetUrl}
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
						If you didn&apos;t request this password reset, you can safely ignore this email. Your password will remain unchanged.
					</p>
				</div>
			</div>
		</div>
	);
}
