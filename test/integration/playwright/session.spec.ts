import { test, expect } from "@playwright/test";
import { Hash } from "@/adapters/outbound/crypto/Hash";
import { agent, injectApp } from "../http";
import { createAppHarness } from "./appHarness";

let harness: Awaited<ReturnType<typeof createAppHarness>>;

test.beforeAll(async () => {
	harness = await createAppHarness();
});

test.afterAll(async () => {
	await harness.close();
});

test.describe("Session authentication", () => {
	test("login grants a session that survives navigation and dies on logout", async () => {
		const email = `e2e-session-${Date.now()}@test.com`;
		const password = "password123";
		const session = agent(harness.app);
		const hashedPassword = await Hash.make(password);

		await harness.orm.em.getConnection().execute(
			`insert into users (id, name, email, password, created_at, updated_at) values (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
			[crypto.randomUUID(), "E2E Session", email, hashedPassword],
		);

		const loginResponse = await session.post("/login").send({
			email,
			password,
		});

		expect(loginResponse.status).toBe(302);
		expect(loginResponse.headers.location).toBe("/home");

		const authenticatedResponse = await session.get("/home");
		expect(authenticatedResponse.status).toBe(200);
		const pageData = extractInertiaPageData(authenticatedResponse.text);
		expect(pageData.component).toBe("Dashboard");
		expect(pageData.props.user.email).toBe(email);

		const logoutResponse = await session.post("/logout");
		expect(logoutResponse.status).toBe(302);
		expect(logoutResponse.headers.location).toBe("/login");

		const loggedOutResponse = await session.get("/home");
		expect(loggedOutResponse.status).toBe(302);
		expect(loggedOutResponse.headers.location).toBe("/login");
	});

	test("POST /login from a foreign Origin is rejected by CSRF middleware", async () => {
		const resp = await injectApp(harness.app, {
			method: "POST",
			url: "/login",
			headers: {
				origin: "https://evil.example.com",
				"content-type": "application/json",
			},
			body: Buffer.from(JSON.stringify({ email: "x@example.com", password: "y" })),
		});
		expect(resp.status).toBe(403);
	});
});

function extractInertiaPageData(html: string) {
	const match = html.match(/data-page="([^"]+)"/);
	if (!match) {
		throw new Error("Could not find Inertia page data in HTML");
	}

	return JSON.parse(
		match[1]
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&amp;/g, "&"),
	);
}
