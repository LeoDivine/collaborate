import { RequestRejectedEmailProps } from "@/lib/types";

export default function RequestRejectedEmail({
	fullName,
	email,
	workspaceName,
	reason,
}: RequestRejectedEmailProps) {
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
						Hello {fullName},
					</h2>

					<p
						style={{
							fontSize: "15px",
							color: "#52525b",
							lineHeight: "1.7",
							margin: "0 0 16px",
						}}
					>
						Thank you for your interest in joining{" "}
						<strong style={{ color: "#18181b" }}>{workspaceName}</strong>.
						After reviewing your request, the workspace administrators were
						unable to approve your application at this time.
					</p>

					{reason && (
						<div
							style={{
								backgroundColor: "#f4f4f5",
								borderLeft: "4px solid #71717a",
								padding: "14px 18px",
								borderRadius: "4px",
								margin: "0 0 24px",
							}}
						>
							<p
								style={{
									fontSize: "13px",
									fontWeight: "600",
									color: "#27272a",
									margin: "0 0 4px",
								}}
							>
								Note from administrators:
							</p>
							<p
								style={{
									fontSize: "14px",
									color: "#52525b",
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
							margin: "0 0 32px",
						}}
					>
						If you believe this decision was made in error or have questions,
						please reach out to your team lead or workspace administrator.
					</p>

					{/* CTA Button */}
					<div
						style={{
							textAlign: "center" as const,
							marginBottom: "32px",
						}}
					>
						<a
							href={baseUrl}
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
							Return to Collaborate
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
						You received this email because you requested to join {workspaceName}.
					</p>
				</div>
			</div>
		</div>
	);
}
