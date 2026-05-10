import { test, expect } from "@playwright/test";
import { injectApp } from "../http";
import { createAppHarness } from "./appHarness";

let harness: Awaited<ReturnType<typeof createAppHarness>>;

test.beforeAll(async () => {
	harness = await createAppHarness();
});

test.afterAll(async () => {
	await harness.close();
});

test.describe("HTTP page responses", () => {
	test("GET / renders the Home page for guests", async () => {
		const response = await injectApp(harness.app, {
			method: "GET",
			url: "/",
			headers: {},
		});

		expect(response.status).toBe(200);

		const page = extractInertiaPageData(response.text);
		expect(page.component).toBe("Home");
		expect(page.props.isAuthenticated).toBe(false);
		expect(page.props.user).toBeNull();
		expect(page.props.applicationName).toBe("The Boring Architecture");
		expect(response.text).toContain("<title>The Boring Architecture</title>");
	});

	test("guest auth pages render the expected Inertia components", async () => {
		const loginResponse = await injectApp(harness.app, {
			method: "GET",
			url: "/login",
			headers: {},
		});
		expect(loginResponse.status).toBe(200);
		expect(extractInertiaPageData(loginResponse.text).component).toBe("Auth/Login");

		const registerResponse = await injectApp(harness.app, {
			method: "GET",
			url: "/register",
			headers: {},
		});
		expect(registerResponse.status).toBe(200);
		expect(extractInertiaPageData(registerResponse.text).component).toBe("Auth/Register");

		const forgotPasswordResponse = await injectApp(harness.app, {
			method: "GET",
			url: "/forgot-password",
			headers: {},
		});
		expect(forgotPasswordResponse.status).toBe(200);
		expect(extractInertiaPageData(forgotPasswordResponse.text).component).toBe("Auth/ForgotPassword");
	});

	test("GET /reset-password/:token preserves token and email props", async () => {
		const response = await injectApp(harness.app, {
			method: "GET",
			url: "/reset-password/test-token?email=person%40example.com",
			headers: {},
		});

		expect(response.status).toBe(200);

		const page = extractInertiaPageData(response.text);
		expect(page.component).toBe("Auth/ResetPassword");
		expect(page.props.token).toBe("test-token");
		expect(page.props.email).toBe("person@example.com");
	});

	test("guest requests to protected pages redirect to /login", async () => {
		const aboutResponse = await injectApp(harness.app, {
			method: "GET",
			url: "/about",
			headers: {},
		});
		expect(aboutResponse.status).toBe(302);
		expect(aboutResponse.headers.location).toBe("/login");

		const dashboardResponse = await injectApp(harness.app, {
			method: "GET",
			url: "/home",
			headers: {},
		});
		expect(dashboardResponse.status).toBe(302);
		expect(dashboardResponse.headers.location).toBe("/login");
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
