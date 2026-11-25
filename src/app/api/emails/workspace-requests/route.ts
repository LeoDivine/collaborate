"use server";

import RequestAcceptedEmail from "@/components/email-templates/request-accepted-email";
import RequestRejectedEmail from "@/components/email-templates/request-rejected-email";
import { getUserByEmail } from "@/lib/services/auth.services";
import { getWorkspaceBByID } from "@/lib/services/workspace.services";
import React from "react";
import { Resend } from "resend";

export async function POST(req: Request) {
	const { fullName, email, workspaceId, type = "ACCEPTED", reason } = await req.json();
	const resend = new Resend(process.env.RESEND_API_KEY);
	const senderEmail = process.env.SENDER_EMAIL || "notifications@collaborate.app";
	const [workspace, existingUser] = await Promise.all([
		getWorkspaceBByID(workspaceId),
		getUserByEmail(email),
	]);
	const hasAccount = !!existingUser;
	const workspaceName = workspace?.name || "Workspace";

	try {
		const isRejected = type === "REJECTED";
		const emailSubject =
			isRejected ?
				`Update regarding your request to join ${workspaceName}`
			:	`Your workspace request for ${workspaceName} has been accepted!`;
		const emailComponent: React.ReactElement =
			isRejected ?
				React.createElement(RequestRejectedEmail, {
					fullName,
					email,
					workspaceName,
					reason,
				})
			:	React.createElement(RequestAcceptedEmail, {
					fullName,
					email,
					workspaceId,
					workspaceName,
					hasAccount,
				});

		const { data, error } = await resend.emails.send({
			from: `Collaborate <${senderEmail}>`,
			to: [email],
			subject: emailSubject,
			react: emailComponent,
		});

		if (error) {
			console.error("Resend email error:", error);
			return Response.json(
				{ error: error.message ?? "Failed to send email" },
				{ status: 500 },
			);
		}

		return Response.json(data);
	} catch (error) {
		console.error("Email route error:", error);
		return Response.json(
			{
				error:
					error instanceof Error ?
						error.message
					:	"Unexpected server error",
			},
			{ status: 500 },
		);
	}
}
