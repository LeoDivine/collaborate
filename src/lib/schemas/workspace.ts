import z from "zod";

export const workspaceCreateSchema = z.object({
	name: z.string().min(2, {
		error: "Workspace name should be greater than two characters",
	}),
	slug: z.string({ error: "Slug is required" }).min(2, {
		error: "Slug should be greater than two characters",
	}),
	industryType: z.string().optional(),
	teamSize: z.string(),
});

export const extendedWorkspaceCreateSchema = workspaceCreateSchema.extend({
	workspaceMode: z.string(),
});

export const joinWorkspaceSchema = z.object({
	name: z.string({ error: "Full Name is required" }).min(2, {
		error: "Full name should be greater than two characters",
	}),
	email: z.email({ error: "Email address is required" }),
	inviteToken: z.string({ error: "Invite code is required" }).min(1, {
		error: "Invite code is required",
	}),
	message: z.string().optional(),
});
