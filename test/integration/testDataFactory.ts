import { MikroORM } from "@mikro-orm/core";
import { Session } from "@/core/models/Session";
import { User } from "@/core/models/User";
import { Hash } from "@/adapters/outbound/crypto/Hash";

function generateId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export class TestDataFactory {
	constructor(private database: MikroORM) {}

	async createUser(
		overrides?: Partial<{
			name: string;
			email: string;
			password: string;
		}>,
	) {
		const em = this.database.em.fork();
		const hashedPassword = await Hash.make(overrides?.password || "password123");
		
		const user = new User(
			crypto.randomUUID(),
			overrides?.name || "Test User",
			overrides?.email || `test-${Date.now()}@example.com`,
			hashedPassword
		);

		await em.persist(user);
		await em.flush();
		return user;
	}

	async createSession(
		overrides?: Partial<{
			id: string;
			user_id: string;
			ip_address: string;
			user_agent: string;
			payload: string;
			last_activity: number;
		}>,
	) {
		const em = this.database.em.fork();
		const session = new Session();
		session.id = overrides?.id || generateId("session");
		session.user_id = overrides?.user_id;
		session.ip_address = overrides?.ip_address || "127.0.0.1";
		session.user_agent = overrides?.user_agent || "Test Agent";
		session.payload = overrides?.payload || JSON.stringify({});
		session.last_activity = overrides?.last_activity || Date.now();

		await em.persist(session);
		await em.flush();
		return session;
	}

	async cleanupAll() {
		const em = this.database.em.fork();

		await em.nativeDelete(Session, {});
		await em.nativeDelete(User, {});
	}
}
