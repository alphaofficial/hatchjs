import { z } from "zod";

const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1).optional(),
		PORT: z.coerce.number().min(3000),
		DB_HOST: z.string().min(1).optional(),
		DB_PORT: z.coerce.number().min(1).optional(),
		DB_NAME: z.string().min(1).optional(),
		DB_USER: z.string().min(1).optional(),
		DB_PASSWORD: z.string().min(1).optional(),
		DB_ORM_DEBUG: z.string().optional(),
	})
	.refine(
		(env) =>
			env.DATABASE_URL ||
			(env.DB_HOST &&
				env.DB_PORT &&
				env.DB_NAME &&
				env.DB_USER &&
				env.DB_PASSWORD),
		{
			message: "Either DATABASE_URL or all DB_* params must be provided",
			path: ["DATABASE_URL"],
		},
	);

const variables = envSchema.parse(process.env);

export default variables;
