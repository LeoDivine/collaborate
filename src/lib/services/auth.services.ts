"use server";

import { SignUpValues } from "@/components/forms/individual-sign-up";
import { signUpSchema } from "../schemas/sign-up";
import bcrypt from "bcrypt";
import { db } from "../db";

export const register = async (values: SignUpValues) => {
	const validatedFields = signUpSchema.safeParse(values);

	if (!validatedFields.success) {
		return {
			success: false,
			message: "Invalid fields passed",
		};
	}
	const { email, fullName, password } = validatedFields.data;
	const hashedPassword = await bcrypt.hash(password, 10);

	const existingUser = await db.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		return {
			success: false,
			message: "An account with this email already exists",
		};
	}

	await db.user.create({
		data: {
			fullName,
			email,
			password: hashedPassword,
		},
	});
	return {
		success: true,
		message: "Account created successfully",
	};
};
