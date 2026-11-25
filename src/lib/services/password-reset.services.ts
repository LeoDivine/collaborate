"use server";

import ResetPasswordEmail from "@/components/email-templates/reset-password-email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import React from "react";
import { Resend } from "resend";
import { db } from "../db";
import { forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth";
import { getUserByEmail } from "./auth.services";

export const requestPasswordReset = async (values: { email: string }) => {
	const validated = forgotPasswordSchema.safeParse(values);
	if (!validated.success) {
		return {
			success: false,
			message: "Please enter a valid email address.",
		};
	}

	const { email } = validated.data;

	try {
		const user = await getUserByEmail(email);

		// If user doesn't exist, return success to prevent email enumeration
		if (!user) {
			return {
				success: true,
				message:
					"If an account exists with this email, a reset link has been sent.",
			};
		}

		// If user signed up via OAuth only and has no password
		if (!user.password) {
			return {
				success: false,
				message:
					"This account uses social sign-in (Google/GitHub). Please sign in using your OAuth provider.",
			};
		}

		// Generate random secure token
		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

		// Remove any existing tokens for this email
		try {
			await (db as any).passwordResetToken.deleteMany({
				where: { email },
			});
		} catch (e) {
			// Ignore if table/record not yet created
		}

		// Create token
		await (db as any).passwordResetToken.create({
			data: {
				email,
				token,
				expiresAt,
			},
		});

		// Send reset email via Resend
		const baseUrl =
			process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4242";
		const resetUrl = `${baseUrl}/reset-password?token=${token}`;

		const resend = new Resend(process.env.RESEND_API_KEY);
		const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";

		const { error } = await resend.emails.send({
			from: `Collaborate <${senderEmail}>`,
			to: [email],
			subject: "Reset your Collaborate password",
			react: React.createElement(ResetPasswordEmail, {
				fullName: user.fullName,
				resetUrl,
			}),
		});

		if (error) {
			console.error("Resend error sending reset email:", error);
			return {
				success: false,
				message:
					"Could not send reset email at this time. Please try again later.",
			};
		}

		return {
			success: true,
			message: "A password reset link has been sent to your email.",
		};
	} catch (error: any) {
		console.error("Error in requestPasswordReset:", error);
		return {
			success: false,
			message: "Something went wrong. Please try again.",
		};
	}
};

export const verifyPasswordResetToken = async (token: string) => {
	if (!token) return { valid: false };

	try {
		const resetToken = await (db as any).passwordResetToken.findUnique({
			where: { token },
		});

		if (!resetToken) return { valid: false };

		if (new Date(resetToken.expiresAt) < new Date()) {
			return { valid: false, expired: true };
		}

		return { valid: true, email: resetToken.email };
	} catch (e) {
		console.error("Error verifying reset token:", e);
		return { valid: false };
	}
};

export const resetPassword = async (
	token: string,
	values: { password: string; confirmPassword: string },
) => {
	const validated = resetPasswordSchema.safeParse(values);
	if (!validated.success) {
		return {
			success: false,
			message: "Invalid password format. Please check requirements.",
		};
	}

	if (!token) {
		return {
			success: false,
			message: "Missing reset token.",
		};
	}

	try {
		const resetToken = await (db as any).passwordResetToken.findUnique({
			where: { token },
		});

		if (!resetToken) {
			return {
				success: false,
				message: "Invalid or expired reset link. Please request a new one.",
			};
		}

		if (new Date(resetToken.expiresAt) < new Date()) {
			return {
				success: false,
				message: "Reset link has expired. Please request a new one.",
			};
		}

		const hashedPassword = await bcrypt.hash(validated.data.password, 10);

		await db.user.update({
			where: { email: resetToken.email },
			data: { password: hashedPassword },
		});

		// Clean up token
		await (db as any).passwordResetToken.deleteMany({
			where: { email: resetToken.email },
		});

		return {
			success: true,
			message: "Your password has been reset successfully! You can now sign in.",
		};
	} catch (error: any) {
		console.error("Error in resetPassword:", error);
		return {
			success: false,
			message: "Something went wrong. Please try again.",
		};
	}
};
