/* eslint-disable no-console */
import "tsconfig-paths/register";
import { MikroORM } from "@mikro-orm/core";
import {
	buildIntegrationTestEnv,
	integrationTestDbBasePath,
	removeSqliteDatabaseFiles,
} from "./testEnv";

let firstRun = true;

const globalBefore = async (config: any): Promise<void> => {
	const isWatchMode = config.watch || config.watchAll;
	const testEnv = buildIntegrationTestEnv();

	process.env = {
		...testEnv,
		SYSTEM_TEST_FIRST_RUN: firstRun ? "yes" : "no",
	};

	if (!firstRun) {
		console.info("\n", "Test containers setup skipped, already started");
		return;
	}

	if (isWatchMode) {
		console.info("\n", "Watch mode detected, skipping test containers setup");
		return;
	}

	console.log("Setup started");

	console.info("Database container ready");
	removeSqliteDatabaseFiles(integrationTestDbBasePath(testEnv.DB_PATH));

	// setup migrations
	console.log("Starting database migrations...");

	const ormConfig = (
		await import("../../src/database/orm.config.ts")
	).default;
	const orm = await MikroORM.init(ormConfig);
	await orm.getMigrator().up();
	await orm.close(true);
	console.log("Migrations completed successfully");

	firstRun = false;
};

export default globalBefore;
