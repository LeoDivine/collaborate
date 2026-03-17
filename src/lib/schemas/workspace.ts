import z from "zod";

export const workspaceCreateSchema = z.object({
	name: z.string().min(2, {
		error: "Workspace name should be greater than two characters",
	}),
	slug: z.string(),
	industryType: z.string(),
	teamSize: z.string(),
});
