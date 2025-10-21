import "dotenv-defaults/config";
import type { Options } from "@mikro-orm/core";
import { Migrator } from "@mikro-orm/migrations";
import {SqliteDriver} from "@mikro-orm/sqlite";

const mikroOrmOptions: Options = {
	entities: ["**/mappings/*.map.js"],
	entitiesTs: ["**/mappings/*.map.ts"],
	dbName: 'test-database',
	driver: SqliteDriver,
	migrations: {
		path: "dist/database/migrations",
		pathTs: "src/database/migrations",
	},
	resultCache: {
		global: 0,
	},
	extensions: [Migrator],
	allowGlobalContext: process.env.NODE_ENV === "test",
	seeder: {
		path: "dist/database/seeder",
		pathTs: "src/database/seeder",
		defaultSeeder: "DatabaseSeeder",
		emit: "ts",
	},
};

export default {
	...mikroOrmOptions,
};
