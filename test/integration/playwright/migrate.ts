import "tsconfig-paths/register";
import { MikroORM } from "@mikro-orm/core";
import ormConfig from "@/adapters/outbound/persistence/orm.config.ts";

async function main() {
	const orm = await MikroORM.init({ ...ormConfig, dbName: "express_inertia_e2e.db" });
	await orm.getMigrator().up();
	await orm.close(true);
	console.log("E2E migrations complete");
}

main().catch(err => { console.error(err); process.exit(1); });
