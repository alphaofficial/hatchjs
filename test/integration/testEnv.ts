import * as fs from "fs";
import * as path from "path";

export const INTEGRATION_TEST_DB_PATH = "express_inertia_test.db";

export function buildIntegrationTestEnv(
	baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
	return {
		...baseEnv,
		TESTS_RUN: "integration",
		NODE_ENV: "test",
		PORT: "3001", // Different port for tests
		DB_PATH: INTEGRATION_TEST_DB_PATH,
		// Integration request tests assert controller output, not SSR bundle loading.
		// Disable SSR here so Jest does not repeatedly try to require dist/ssr.mjs.
		SSR_ENABLED: "false",
	};
}

export function integrationTestDbBasePath(
	dbPath: string = INTEGRATION_TEST_DB_PATH,
): string {
	return path.resolve(process.cwd(), dbPath);
}

export function removeSqliteDatabaseFiles(dbBasePath: string): void {
	for (const suffix of ["", "-shm", "-wal", "-journal"]) {
		const filePath = dbBasePath + suffix;
		try {
			if (fs.existsSync(filePath)) {
				fs.chmodSync(filePath, 0o666);
			}
			fs.rmSync(filePath, { force: true });
		} catch {
			// Best-effort cleanup; migration/setup will fail loudly if the DB remains unusable.
		}
	}
}
