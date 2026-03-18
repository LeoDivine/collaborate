"use server";

import { SignUpValues } from "@/components/forms/individual-sign-up";
import { SignInValues } from "@/components/forms/sign-in";
import { WorkspaceCreateValues } from "@/components/forms/workspace-sign-up";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "../../../auth";
import { db } from "../db";
import { signInSchema, signUpSchema } from "../schemas/auth";
import { generateSlug } from "../utils";

export const individualSignUp = async (values: SignUpValues) => {
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

	const user = await db.user.create({
		data: {
			fullName,
			email,
			password: hashedPassword,
		},
	});

	const workspace = await db.workspace.create({
		data: {
			mode: "INDIVIDUAL",
			name: `${user.fullName}'s Personal Desk`,
			slug: `${generateSlug(user.fullName)}-${user.id.slice(0, 6)}`,
			createdById: user.id,
			teamSize: "1",
		},
	});

	const member = await db.member.create({
		data: {
			role: "OWNER",
			userId: user.id,
			workspaceId: workspace.id,
		},
	});

	const signInResponse = await signIn("credentials", {
		email: user.email,
		password,
		redirect: false,
	});

	if (!signInResponse) {
		throw new Error("Something went wrong");
	}

	return {
		success: true,
		message: "Account created successfully",
		user,
		workspace,
		member,
	};
};

export const workspaceSignUp = async (
	values: SignUpValues,
	workspaceValues: WorkspaceCreateValues,
) => {
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

	const user = await db.user.create({
		data: {
			fullName,
			email,
			password: hashedPassword,
		},
	});

	const workspace = await db.workspace.create({
		data: {
			mode: "WORKSPACE",
			name: workspaceValues.name,
			slug: workspaceValues.slug,
			createdById: user.id,
			industryType: workspaceValues.industryType,
			teamSize: workspaceValues.teamSize,
		},
	});

	const member = await db.member.create({
		data: {
			role: "OWNER",
			userId: user.id,
			workspaceId: workspace.id,
		},
	});

	const signInResponse = await signIn("credentials", {
		email: user.email,
		password,
		redirect: false,
	});

	if (!signInResponse) {
		throw new Error("Something went wrong");
	}

	return {
		success: true,
		user,
		workspace,
		member,
		message: "Account created successfully",
	};
};

export const getUserByEmail = async (email: string) => {
	const user = await db.user.findUnique({
		where: {
			email: email,
		},
	});
	return user;
};

export const updateUserName = async (userName: string, userId: string) => {
	const hasUserName = await db.user.findUnique({
		where: {
			userName,
		},
	});
	if (hasUserName) {
		return {
			success: false,
			message: "A user with this username already exists.",
			user: null,
		};
	} else {
		const user = await db.user.update({
			data: {
				userName: userName,
				lastLogin: new Date(),
			},
			where: {
				id: userId,
			},
		});
		if (user) {
			return {
				success: true,
				message: "Username added successfully.",
				user,
			};
		}
		return {
			success: false,
			message: "Username was not added.",
			user: null,
		};
	}
};

export const login = async (values: SignInValues) => {
	const validatedFields = signInSchema.safeParse(values);
	if (!validatedFields.success) {
		return {
			error: "Invalid fields",
		};
	}

	const { email, password } = validatedFields.data;

	try {
		const res = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (!res || res.error) {
			return {
				success: false,
				message: "Invalid email or password",
			};
		} else {
			return {
				success: true,
				message: "Account signed in successfully",
			};
		}
	} catch (e: any) {
		if (e instanceof AuthError) {
			console.log({ e });
			switch (e.type) {
				case "CredentialsSignin":
					return {
						success: false,
						message: "Invalid email or password",
					};
				default:
					return {
						success: false,
						message: "Something went wrong",
					};
			}
		}
		throw e;
	}
};
