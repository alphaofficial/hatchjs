import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
	PORT: z.coerce.number().optional().default(3000),
	SESSION_SECRET: z.string().optional().default('0cfca1d1875a2b4d9742be6ae4603fd7bfac19012b03072649c352aaaa26e5c1'),
	SESSION_MAX_AGE: z.coerce.number().optional().default(24 * 60 * 60 * 1000), // 24 hours
});

const variables = envSchema.parse(process.env);

export default variables;
