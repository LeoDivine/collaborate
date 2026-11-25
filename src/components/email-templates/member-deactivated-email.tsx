import { MemberDeactivatedEmailProps } from "@/lib/types";

export default function MemberDeactivatedEmail({
	fullName,
	email,
	workspaceName,
	reason,
}: MemberDeactivatedEmailProps) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4242";

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
						Workspace Access Deactivated
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
						We are writing to inform you that your membership in{" "}
						<strong style={{ color: "#18181b" }}>{workspaceName}</strong> has
						been <strong style={{ color: "#dc2626" }}>deactivated</strong> by a
						workspace administrator.
					</p>

					{reason && (
						<div
							style={{
								backgroundColor: "#fef2f2",
								borderLeft: "4px solid #ef4444",
								padding: "14px 18px",
								borderRadius: "4px",
								margin: "0 0 24px",
							}}
						>
							<p
								style={{
									fontSize: "13px",
									fontWeight: "600",
									color: "#991b1b",
									margin: "0 0 4px",
								}}
							>
								Note from administrator:
							</p>
							<p
								style={{
									fontSize: "14px",
									color: "#7f1d1d",
									margin: "0",
									lineHeight: "1.6",
								}}
							>
								{reason}
							</p>
						</div>
					)}

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 16px",
						}}
					>
						<strong>What this means for you:</strong>
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
						<li>
							You can no longer access projects, tasks, or resources in{" "}
							{workspaceName}.
						</li>
						<li>
							You will not be able to rejoin this workspace without direct reactivation by an administrator.
						</li>
						<li>
							Your other workspaces and personal desks remain unaffected.
						</li>
					</ul>

					<p
						style={{
							fontSize: "14px",
							color: "#71717a",
							lineHeight: "1.7",
							margin: "0 0 32px",
						}}
					>
						If you believe this action was taken in error, please contact your
						workspace administrator or team lead directly.
					</p>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={`${baseUrl}/sign-in/my-workspaces`}
							style={{
								display: "inline-block",
								backgroundColor: "#18181b",
								color: "#ffffff",
								fontSize: "15px",
								fontWeight: "400",
								textDecoration: "none",
								padding: "14px 32px",
								borderRadius: "1000px",
								letterSpacing: "0.1px",
							}}
						>
							Go to My Workspaces
						</a>
					</div>
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
						You received this notification because you were a member of{" "}
						{workspaceName} on Collaborate ({email}).
					</p>
				</div>
			</div>
		</div>
	);
}
