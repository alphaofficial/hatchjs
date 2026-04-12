import { z } from "zod";

const DEV_SESSION_SECRET = '0cfca1d1875a2b4d9742be6ae4603fd7bfac19012b03072649c352aaaa26e5c1';
const DEV_APP_KEY = 'dev_app_key_change_me_in_production_32chars!!';

const baseSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
	PORT: z.coerce.number().optional().default(3000),
	APP_NAME: z.string().optional().default('Hatch JS'),
	APP_URL: z.string().optional().default('http://localhost:3000'),
	TRUST_PROXY: z.string().optional().default('loopback'),
	APP_KEY: z.string().optional(),
	SESSION_SECRET: z.string().optional(),
	SESSION_MAX_AGE: z.coerce.number().optional().default(24 * 60 * 60 * 1000), // 24 hours
	DB_PATH: z.string().optional(),
	RATE_LIMIT_ENABLED: z
		.string()
		.optional()
		.default('false')
		.transform(v => v === 'true' || v === '1'),
	RATE_LIMIT_AUTH_MAX: z.coerce.number().optional().default(5),
	RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().optional().default(60_000),
	PASSWORD_RESET_EXPIRY: z.coerce.number().optional().default(60), // minutes
	EMAIL_VERIFICATION_EXPIRY: z.coerce.number().optional().default(60), // minutes
	CACHE_DRIVER: z.string().optional().default('memory'),
	STORAGE_DRIVER: z.string().optional().default('local'),
	STORAGE_PATH: z.string().optional().default('storage'),
	MAIL_DRIVER: z.string().optional().default('log'),
	MAIL_FROM: z.string().optional().default('noreply@example.com'),
	MAIL_HOST: z.string().optional(),
	MAIL_PORT: z.coerce.number().optional().default(587),
	MAIL_USER: z.string().optional(),
	MAIL_PASS: z.string().optional(),
});

const parsed = baseSchema.parse(process.env);

if (!parsed.SESSION_SECRET) {
	if (parsed.NODE_ENV === 'production') {
		throw new Error(
			'SESSION_SECRET is required in production. Generate one with: openssl rand -hex 32'
		);
	}
	parsed.SESSION_SECRET = DEV_SESSION_SECRET;
}

if (!parsed.APP_KEY) {
	if (parsed.NODE_ENV === 'production') {
		throw new Error(
			'APP_KEY is required in production. Generate one with: openssl rand -hex 32'
		);
	}
	parsed.APP_KEY = DEV_APP_KEY;
}

const variables = parsed as typeof parsed & { SESSION_SECRET: string; APP_KEY: string };

export function env(key: keyof typeof variables, defaultValue?: string | number | boolean) {
	return variables[key] ?? defaultValue;
}

export default variables;
