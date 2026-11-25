import { MemberActivatedEmailProps } from "@/lib/types";

export default function MemberActivatedEmail({
	fullName,
	email,
	workspaceName,
	workspaceId,
}: MemberActivatedEmailProps) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4242";
	const workspaceUrl = workspaceId
		? `${baseUrl}/c?workspaceId=${workspaceId}`
		: `${baseUrl}/sign-in/my-workspaces`;

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
						Workspace Access Activated
					</h2>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 16px",
						}}
					>
						Hello <strong style={{ color: "#18181b" }}>{fullName}</strong>,
					</p>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 16px",
						}}
					>
						Great news! Your membership in{" "}
						<strong style={{ color: "#18181b" }}>{workspaceName}</strong> has
						been <strong style={{ color: "#16a34a" }}>activated</strong>.
					</p>

					<div
						style={{
							backgroundColor: "#f0fdf4",
							borderLeft: "4px solid #22c55e",
							padding: "14px 18px",
							borderRadius: "4px",
							margin: "0 0 24px",
						}}
					>
						<p
							style={{
								fontSize: "14px",
								color: "#15803d",
								margin: "0",
								lineHeight: "1.6",
							}}
						>
							Your workspace permissions and access to projects, tasks, and team
							discussions have been fully restored.
						</p>
					</div>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 16px",
						}}
					>
						<strong>What you can do now:</strong>
					</p>

					<ul
						style={{
							fontSize: "14px",
							color: "#52525b",
							lineHeight: "1.8",
							margin: "0 0 24px",
							paddingLeft: "20px",
						}}
					>
						<li>Access all your assigned projects and tasks immediately.</li>
						<li>Collaborate with team members in real-time.</li>
						<li>Switch seamlessly into this workspace from your dashboard.</li>
					</ul>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={workspaceUrl}
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
							Open Workspace
						</a>
					</div>

					<p
						style={{
							fontSize: "14px",
							color: "#71717a",
							lineHeight: "1.7",
							margin: "0",
						}}
					>
						If you have any questions, reach out to your workspace administrator.
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
						You received this notification because you are a member of{" "}
						{workspaceName} on Collaborate ({email}).
					</p>
				</div>
			</div>
		</div>
	);
}
