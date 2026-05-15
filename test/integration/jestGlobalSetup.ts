/* eslint-disable no-console */
import "tsconfig-paths/register";
import { MikroORM } from "@mikro-orm/core";

let firstRun = true;
let defaultProcessEnv: NodeJS.ProcessEnv = {};


const globalBefore = async (config: any): Promise<void> => {
	const isWatchMode = config.watch || config.watchAll;

	process.env.SYSTEM_TEST_FIRST_RUN = firstRun ? "yes" : "no";

	if (!firstRun) {
		console.info("\n", "Test containers setup skipped, already started");
		return;
	}

	if (isWatchMode) {
		console.info("\n", "Watch mode detected, skipping test containers setup");
		return;
	}

	console.log("Setup started");

	defaultProcessEnv = {
		...process.env,
		TESTS_RUN: "integration",
		NODE_ENV: "test",
		PORT: "3001", // Different port for tests
	};

	process.env = defaultProcessEnv;

	console.info("Database container ready");

	// setup migrations
	console.log("Starting database migrations...");

	const ormConfig = (
		await import("@/adapters/outbound/persistence/orm.config.ts")
	).default;
	const orm = await MikroORM.init({ ...ormConfig, dbName: "express_inertia_test.db" });
	await orm.getMigrator().up();
	await orm.close(true);
	console.log("Migrations completed successfully");

	firstRun = false;
};

export default globalBefore;

export const getDefaultEnvVars = (): NodeJS.ProcessEnv => defaultProcessEnv;
