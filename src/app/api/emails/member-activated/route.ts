"use server";

import MemberActivatedEmail from "@/components/email-templates/member-activated-email";
import React from "react";
import { Resend } from "resend";

export async function POST(req: Request) {
	try {
		const { fullName, email, workspaceName, workspaceId } = await req.json();

		if (!email || !workspaceName) {
			return Response.json(
				{ error: "Missing required email or workspaceName" },
				{ status: 400 },
			);
		}

		const resend = new Resend(process.env.RESEND_API_KEY);
		const senderEmail = process.env.SENDER_EMAIL || "notifications@collaborate.app";

		const { data, error } = await resend.emails.send({
			from: `Collaborate <${senderEmail}>`,
			to: [email],
			subject: `Workspace access restored: Welcome back to ${workspaceName}`,
			react: React.createElement(MemberActivatedEmail, {
				fullName: fullName || "Member",
				email,
				workspaceName,
				workspaceId,
			}),
		});

		if (error) {
			console.error("Resend email error:", error);
			return Response.json(
				{ error: error.message ?? "Failed to send email" },
				{ status: 500 },
			);
		}

		return Response.json({ success: true, data });
	} catch (error) {
		console.error("Member activated email route error:", error);
		return Response.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unexpected server error",
			},
			{ status: 500 },
		);
	}
}
