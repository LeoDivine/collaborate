"use server";

import RequestAcceptedEmail from "@/components/email-templates/request-accepted-email";
import { getWorkspaceBByID } from "@/lib/services/workspace.services";
import React from "react";
import { Resend } from "resend";

export async function POST(req: Request) {
	const { fullName, email, workspaceId } = await req.json();
	const resend = new Resend(process.env.RESEND_API_KEY);

	const workspace = await getWorkspaceBByID(workspaceId);

	try {
		const { data, error } = await resend.emails.send({
			from: "Collaborate <onboarding@resend.dev>",
			to: [email],
			subject: "Your workspace request has been accepted!",
			react: React.createElement(RequestAcceptedEmail, {
				fullName,
				email,
				workspaceId,
				workspaceName: workspace?.name!,
			}),
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
