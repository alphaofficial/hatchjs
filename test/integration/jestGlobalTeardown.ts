
import { MikroORM } from "@mikro-orm/core";
import ormConfig from "../../src/database/orm.config";
import {
	INTEGRATION_TEST_DB_PATH,
	integrationTestDbBasePath,
	removeSqliteDatabaseFiles,
} from "./testEnv";

const globalTeardown = async (): Promise<void> => {
	console.info("\n", "Teardown started");

	// Try to close any remaining database connections
	try {
		const orm = await MikroORM.init({ ...ormConfig, dbName: INTEGRATION_TEST_DB_PATH });
		await orm.close(true);
	} catch (error) {
		// Ignore errors if database is already closed or doesn't exist
	}

	// Wait a bit to ensure all connections are closed
	await new Promise(resolve => setTimeout(resolve, 200));

	// remove test db file and its sqlite -shm / -wal siblings
	removeSqliteDatabaseFiles(integrationTestDbBasePath(INTEGRATION_TEST_DB_PATH));

	console.info("\n", "Teardown completed");
};

export default globalTeardown;
