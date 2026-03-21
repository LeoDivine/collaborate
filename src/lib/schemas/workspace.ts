import z from "zod";

export const workspaceCreateSchema = z.object({
	name: z.string().min(2, {
		error: "Workspace name should be greater than two characters",
	}),
	slug: z.string({ error: "Slug is required" }).min(2, {
		error: "Slug should be greater than two characters",
	}),
	industryType: z.string(),
	teamSize: z.string(),
});

export const extendedWorkspaceCreateSchema = workspaceCreateSchema.extend({
	workspaceMode: z.string(),
});
