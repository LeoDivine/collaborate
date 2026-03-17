import { z } from "zod";

export const signUpSchema = z
	.object({
		fullName: z.string({ error: "Full name is required" }).min(2, {
			error: "Full name should be greater than two characters",
		}),
		email: z.email({ error: "Email address is required" }),
		password: z
			.string()
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
				"Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const userNameSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, { message: "Username must be at least 3 characters" })
		.max(20, { message: "Username must be less than 20 characters" })
		.regex(/^[a-z0-9_.]+$/, {
			message:
				"Username can only contain letters, numbers, underscores and dots",
		}),
});

export const signInSchema = z.object({
	email: z.email({ error: "Email is required" }),
	password: z
		.string({ error: "Password is required" })
		.min(2, { error: "Password should be greater than two characters" }),
});
