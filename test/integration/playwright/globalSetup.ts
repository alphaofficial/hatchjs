import { execSync } from "child_process";
import path from "path";
import { pathToFileURL } from "url";
import { build } from "vite";

export default async function globalSetup() {
	const root = path.resolve(__dirname, "../../..");

	// Rebuild the frontend so all pages are included in the bundle.
	console.log("Building frontend for E2E tests...");
	const viteConfigModule = await import(
		pathToFileURL(path.join(root, "vite.config.mjs")).href
	);
	const baseConfig =
		typeof viteConfigModule.default === "function"
			? viteConfigModule.default({ command: "build", mode: "production" })
			: viteConfigModule.default;
	const previousNodeEnv = process.env.NODE_ENV;
	try {
		await build(baseConfig);
	} finally {
		if (previousNodeEnv === undefined) {
			delete process.env.NODE_ENV;
		} else {
			process.env.NODE_ENV = previousNodeEnv;
		}
	}

	// Run migrations
	const script = path.join(__dirname, "migrate.ts");
	execSync(
		`DB_PATH=express_inertia_e2e.db NODE_ENV=test node --import tsx ${script}`,
		{ cwd: root, stdio: "inherit" }
	);
}
