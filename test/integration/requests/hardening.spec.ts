/**
 * Tests for production-hardening behavior added in Phase 1.
 */
import express from "express";
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import { RequestContext } from "@mikro-orm/core";
import { mock } from "jest-mock-extended";
import path from "node:path";

import { globalErrorHandler, notFoundHandler } from "@/adapters/inbound/http/middleware/errorHandler";
import { injectAuthHelpers } from "@/adapters/inbound/http/middleware/authUtils";
import { InertiaExpressMiddleware } from "@/adapters/inbound/http/middleware/inertia";
import { authRateLimit } from "@/adapters/inbound/http/middleware/rateLimit";
import { SessionStore, generateSessionToken } from "@/adapters/inbound/http/middleware/sessionStore";
import { PinoLogger } from "@/adapters/shared/logger/pinoLogger";
import { Session } from "@/core/models/Session";
import { Hash } from "@/adapters/outbound/crypto/Hash";
import { bootstrapTestApp, openTestOrm } from "../testHelpers";
import { TestDataFactory } from "../testDataFactory";
import { agent, request } from "../http";

interface BootOpts {
	throwingRoute?: boolean;
	rateLimit?: { max: number; windowMs?: number };
}

/**
 * Boot a fresh Express app reusing the production middleware stack.
 * Allows injecting an extra throwing route or a real rate-limited route.
 */
async function bootApp(opts: BootOpts = {}) {
	const app = express();
	const orm = await openTestOrm("express_inertia_test.db");
	const sessionStore = new SessionStore(orm);

	app.use(helmet({ contentSecurityPolicy: false }));
	app.use(compression());

	app.use((req, _, next) => {
		req.orm = orm;
		(req as any).entityManager = orm.em.fork();
		req.logger = mock<PinoLogger>();
		next();
	});
	app.use((_, __, next) => RequestContext.create(orm.em.fork(), next));
	app.use((req, _, next) => {
		if (req.sessionID) {
			sessionStore.setRequestData(req.sessionID, req.ip || "", req.get("User-Agent") || "");
		}
		next();
	});
	app.use(
		session({
			store: sessionStore,
			secret: "test-secret",
			resave: false,
			saveUninitialized: false,
			cookie: { secure: false, httpOnly: true, maxAge: 60_000 },
		})
	);
	app.use(injectAuthHelpers);
	app.use(express.json({ limit: "100kb" }));
	app.use(express.urlencoded({ extended: true, limit: "100kb" }));
	app.use("/", express.static(path.join(process.cwd(), "public")));
	app.use(InertiaExpressMiddleware.apply);

	if (opts.throwingRoute) {
		app.get("/__boom", () => {
			throw new Error("kaboom");
		});
	}

	if (opts.rateLimit) {
		const prevEnv = { ...process.env };
		process.env.RATE_LIMIT_ENABLED = "true";
		process.env.RATE_LIMIT_AUTH_MAX = String(opts.rateLimit.max);
		process.env.RATE_LIMIT_AUTH_WINDOW_MS = String(opts.rateLimit.windowMs ?? 60_000);
		const limiter = authRateLimit();
		// restore env for everyone else
		process.env = prevEnv;
		app.post("/__limited", limiter, (_req, res) => res.status(200).json({ ok: true }));
	}

	app.use(notFoundHandler);
	app.use(globalErrorHandler);

	const close = async () => {
		await orm.close(true);
	};

	return { app, orm, close };
}

describe("Hardening", () => {
	describe("Hash util", () => {
		it("hashes and verifies a password round-trip", async () => {
			const hashed = await Hash.make("hunter2");
			expect(hashed).not.toBe("hunter2");
			expect(await Hash.check("hunter2", hashed)).toBe(true);
			expect(await Hash.check("wrong", hashed)).toBe(false);
		});
	});

	describe("Rate limiting", () => {
		it("returns a no-op when RATE_LIMIT_ENABLED is unset", () => {
			delete process.env.RATE_LIMIT_ENABLED;
			const mw = authRateLimit();
			let called = false;
			(mw as any)({} as any, {} as any, () => {
				called = true;
			});
			expect(called).toBe(true);
		});

		it("returns 429 once the configured threshold is exceeded", async () => {
			const { app, close } = await bootApp({ rateLimit: { max: 3 } });
			try {
				const client = request(app);
				let last = 0;
				for (let i = 0; i < 5; i++) {
					const r = await client.post("/__limited").send({});
					last = r.status;
				}
				expect(last).toBe(429);
			} finally {
				await close();
			}
		});
	});

	describe("Body size limit", () => {
		it("rejects oversized JSON bodies with 413", async () => {
			const { app, close } = await bootApp({});
			try {
				const huge = "x".repeat(200 * 1024); // 200kb > 100kb cap
				const r = await request(app)
					.post("/login")
					.set("Content-Type", "application/json")
					.send(JSON.stringify({ email: huge, password: "y" }));
				expect(r.status).toBe(413);
			} finally {
				await close();
			}
		});
	});

	describe("Error handler", () => {
		it("renders the Inertia Error page on a thrown error", async () => {
			const { app, close } = await bootApp({ throwingRoute: true });
			try {
				const r = await request(app).get("/__boom");
				expect(r.status).toBe(500);
				const m = r.text.match(/data-page="([^"]*)"/);
				expect(m).toBeTruthy();
				const decoded = (m![1] as string)
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&amp;/g, "&");
				const data = JSON.parse(decoded);
				expect(data.component).toBe("Error");
				expect(data.props.status).toBe(500);
			} finally {
				await close();
			}
		});
	});

	describe("Session-backed auth flow", () => {
		let app: any;
		let orm: any;
		let factory: TestDataFactory;

		beforeAll(async () => {
			const t = await bootstrapTestApp();
			app = t.app;
			orm = t.orm;
			factory = new TestDataFactory(orm);
		});

		afterAll(async () => {
			await orm?.close(true);
		});

		beforeEach(async () => factory.cleanupAll());

		it("persists auth across requests via the session cookie", async () => {
			const user = await factory.createUser({ email: "persist@example.com" });
			const session = agent(app);

			await session
				.post("/login")
				.send({ email: user.email, password: "password123" })
				.expect(302);

			const r1 = await session.get("/home");
			expect(r1.status).toBe(200);

			const r2 = await session.get("/about");
			expect(r2.status).toBe(200);
		});

		it("rejects access after logout", async () => {
			const user = await factory.createUser({ email: "logout@example.com" });
			const session = agent(app);

			await session
				.post("/login")
				.send({ email: user.email, password: "password123" });

			await session.post("/logout").expect(302);

			const r = await session.get("/home");
			expect(r.status).toBe(302);
			expect(r.headers.location).toBe("/login");
		});
	});

	describe("CSRF origin verification", () => {
		let app: any;
		let orm: any;

		beforeAll(async () => {
			const t = await bootstrapTestApp();
			app = t.app;
			orm = t.orm;
		});

		afterAll(async () => {
			await orm?.close(true);
		});

		it("rejects POST with a foreign Origin", async () => {
			const r = await request(app)
				.post("/login")
				.set("Origin", "https://evil.example.com")
				.send({ email: "x@example.com", password: "password123" });
			expect(r.status).toBe(403);
		});

		it("rejects POST with a foreign Referer when Origin is absent", async () => {
			const r = await request(app)
				.post("/login")
				.set("Referer", "https://evil.example.com/whatever")
				.send({ email: "x@example.com", password: "password123" });
			expect(r.status).toBe(403);
		});

		it("rejects POST with a malformed Origin", async () => {
			const r = await request(app)
				.post("/login")
				.set("Origin", "not-a-url")
				.send({ email: "x@example.com", password: "password123" });
			expect(r.status).toBe(403);
		});

		it("allows POST with a matching Origin", async () => {
			const r = await request(app)
				.post("/login")
				.set("Origin", "http://localhost:3000")
				.send({ email: "x@example.com", password: "password123" });
			// 200 (re-render login with errors for invalid credentials) — not 403
			expect(r.status).not.toBe(403);
		});

		it("allows POST when neither Origin nor Referer is present", async () => {
			const r = await request(app)
				.post("/login")
				.send({ email: "x@example.com", password: "password123" });
			expect(r.status).not.toBe(403);
		});

		it("allows GET regardless of Origin", async () => {
			const r = await request(app)
				.get("/login")
				.set("Origin", "https://evil.example.com");
			expect(r.status).toBe(200);
		});
	});

	describe("Split-token session validation", () => {
		let orm: any;
		let store: SessionStore;

		beforeAll(async () => {
			orm = await openTestOrm("express_inertia_test.db");
			store = new SessionStore(orm);
		});

		afterAll(async () => {
			await orm?.close(true);
		});

		beforeEach(async () => {
			const em = orm.em.fork();
			await em.nativeDelete(Session, {});
		});

		const storeSet = (sid: string, data: any) =>
			new Promise<void>((resolve, reject) => {
				store.set(sid, data, (err) => (err ? reject(err) : resolve()));
			});

		const storeGet = (sid: string) =>
			new Promise<any>((resolve, reject) => {
				store.get(sid, (err, data) => (err ? reject(err) : resolve(data)));
			});

		it("round-trips a valid token", async () => {
			const token = generateSessionToken();
			await storeSet(token, { userId: "user-1", foo: "bar" });
			const loaded = await storeGet(token);
			expect(loaded).toEqual({ userId: "user-1", foo: "bar" });
		});

		it("returns null for a token with the right id but a wrong secret", async () => {
			const token = generateSessionToken();
			await storeSet(token, { userId: "user-2" });

			const [id] = token.split(".");
			const forged = `${id}.${generateSessionToken().split(".")[1]}`;
			const loaded = await storeGet(forged);
			expect(loaded).toBeNull();
		});

		it("returns null for a malformed token (no separator)", async () => {
			const loaded = await storeGet("nodotshere");
			expect(loaded).toBeNull();
		});

		it("returns null for an unknown id", async () => {
			const loaded = await storeGet(generateSessionToken());
			expect(loaded).toBeNull();
		});

		it("persists secret_hash (never the raw secret) and stamps created_at", async () => {
			const token = generateSessionToken();
			const [, secret] = token.split(".");
			await storeSet(token, { userId: "user-3" });

			const em = orm.em.fork();
			const rows = await em.find(Session, {});
			expect(rows).toHaveLength(1);
			const row = rows[0];
			expect(row.secret_hash).not.toBe(secret);
			expect(row.secret_hash).toMatch(/^[a-f0-9]{64}$/);
			expect(typeof row.created_at).toBe("number");
			expect(row.created_at).toBeGreaterThan(0);
		});
	});
});
