import { Resend } from "resend";
import BasicEmailTemplatate from "../../../components/email-templates/basic-email-templatate";

export async function POST(req: Request) {
	try {
		const { name } = (await req.json()) as { name?: string };

		if (!name) {
			return Response.json(
				{ error: "Name is required" },
				{ status: 400 },
			);
		}

		if (!process.env.RESEND_API_KEY) {
			return Response.json(
				{ error: "RESEND_API_KEY is not configured" },
				{ status: 500 },
			);
		}

		const resend = new Resend(process.env.RESEND_API_KEY);
		const { data, error } = await resend.emails.send({
			from: "Test <onboarding@resend.dev>",
			to: ["tech.divine101@gmail.com"],
			subject: "Hello world",
			react: BasicEmailTemplatate({ name }),
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
