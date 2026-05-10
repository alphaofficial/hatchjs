import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
	const root = path.resolve(__dirname, "../../..");

	// Rebuild the frontend so all pages are included in the bundle
	console.log("Building frontend for E2E tests...");
	execSync("npm run build:client", { cwd: root, stdio: "inherit" });

	// Run migrations
	const script = path.join(__dirname, "migrate.ts");
	execSync(
		`DB_PATH=express_inertia_e2e.db NODE_ENV=test node --import tsx ${script}`,
		{ cwd: root, stdio: "inherit" }
	);
}
