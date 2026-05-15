
import fs from "fs";
import path from "path";
import { MikroORM } from "@mikro-orm/core";
import ormConfig from "@/adapters/outbound/persistence/orm.config";

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

	// remove test db file and its sqlite -shm / -wal siblings
	const base = path.join(process.cwd(), "express_inertia_test.db");
	for (const suffix of ["", "-shm", "-wal", "-journal"]) {
		const p = base + suffix;
		try {
			if (fs.existsSync(p)) {
				fs.chmodSync(p, 0o666);
				fs.unlinkSync(p);
				console.info("Removed", p);
			}
		} catch (error) {
			console.error("Error removing", p, error);
		}
	}

	console.info("\n", "Teardown completed");
};

export default globalTeardown;
