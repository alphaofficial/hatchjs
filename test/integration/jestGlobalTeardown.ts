
import fs from "fs";
import path from "path";
import { MikroORM } from "@mikro-orm/core";
import ormConfig from "../../src/database/orm.config";

const globalTeardown = async (): Promise<void> => {
	console.info("\n", "Teardown started");

	// Try to close any remaining database connections
	try {
		const orm = await MikroORM.init({ ...ormConfig, dbName: "express_inertia_test.db" });
		await orm.close(true);
	} catch (error) {
		// Ignore errors if database is already closed or doesn't exist
	}

	// Wait a bit to ensure all connections are closed
	await new Promise(resolve => setTimeout(resolve, 200));

	// remove test db file - it's created in the project root
	const dbPath = path.join(process.cwd(), "express_inertia_test.db");
	
	try {
		if (fs.existsSync(dbPath)) {
			// Make sure file is writable before deletion
			fs.chmodSync(dbPath, 0o666);
			fs.unlinkSync(dbPath);
			console.info("Test database file removed:", dbPath);
		} else {
			console.info("Test database file not found at:", dbPath);
		}
	} catch (error) {
		console.error("Error removing test database file:", error);
	}

	console.info("\n", "Teardown completed");
};

export default globalTeardown;
