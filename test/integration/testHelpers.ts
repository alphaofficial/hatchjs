import { MikroORM } from "@mikro-orm/core";
import ormConfig from "@/adapters/outbound/persistence/orm.config";
import { PinoLogger } from "@/adapters/shared/logger/pinoLogger";
import { createHttpApp } from "@/index";

declare module "express-serve-static-core" {
	interface Request {
		orm: MikroORM;
		logger: PinoLogger;
		user(): Promise<any | null>;
		user_id(): string | null;
		is_authenticated(): boolean;
		is_guest(): boolean;
		authenticate(user: any): void;
		logout(): Promise<void>;
	}
}

interface BootstrapTestAppOptions {
	dbName?: string;
}

export const openTestOrm = async (dbName = "express_inertia_test.db") => {
	const orm = await MikroORM.init({ ...ormConfig, dbName });
	await orm.schema.updateSchema();
	return orm;
};

export const bootstrapTestApp = async (options: BootstrapTestAppOptions = {}) => {
	const orm = await openTestOrm(options.dbName ?? "express_inertia_test.db");
	const { app, sessionStore } = createHttpApp(orm);

	return { app, orm, mockLogger: PinoLogger, sessionStore };
};
