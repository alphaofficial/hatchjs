/**
 * Tests for production-hardening behavior added in Phase 1.
 */
import supertest from "supertest";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { mock } from "jest-mock-extended";
import path from "node:path";

import ormConfig from "../../../src/database/orm.config";
import { SessionStore } from "../../../src/middleware/sessionStore";
import { injectAuthHelpers } from "../../../src/middleware/authUtils";
import { InertiaExpressMiddleware } from "../../../src/middleware/inertia";
import { PinoLogger } from "../../../src/logger/pinoLogger";
import { Hash } from "../../../src/utils/Hash";
import { authRateLimit } from "../../../src/middleware/rateLimit";
import { notFoundHandler, globalErrorHandler } from "../../../src/middleware/errorHandler";
import { bootstrapTestApp } from "../testHelpers";
import { TestDataFactory } from "../testDataFactory";

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
	const orm = await MikroORM.init({ ...ormConfig, dbName: "express_inertia_test.db" });
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
				const agent = supertest(app);
				let last = 0;
				for (let i = 0; i < 5; i++) {
					const r = await agent.post("/__limited").send({});
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
				const r = await supertest(app)
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
				const r = await supertest(app).get("/__boom");
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

		beforeEach(async () => factory.cleanupAll());

		it("persists auth across requests via the session cookie", async () => {
			const user = await factory.createUser({ email: "persist@example.com" });
			const agent = supertest.agent(app);

			await agent
				.post("/login")
				.send({ email: user.email, password: "password123" })
				.expect(302);

			const r1 = await agent.get("/home");
			expect(r1.status).toBe(200);

			const r2 = await agent.get("/about");
			expect(r2.status).toBe(200);
		});

		it("rejects access after logout", async () => {
			const user = await factory.createUser({ email: "logout@example.com" });
			const agent = supertest.agent(app);

			await agent
				.post("/login")
				.send({ email: user.email, password: "password123" });

			await agent.post("/logout").expect(302);

			const r = await agent.get("/home");
			expect(r.status).toBe(302);
			expect(r.headers.location).toBe("/login");
		});
	});
});
