import { test, expect } from "@playwright/test";

const E2E_USER = {
	name: "E2E User",
	email: `e2e_${Date.now()}@example.com`,
	password: "password123",
};

test.describe("Auth UI flows", () => {
	test.beforeEach(async ({ context }) => {
		await context.clearCookies();
	});

	test("home page renders the redesigned guest hero", async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: {
					writeText: async () => undefined,
				},
			});
		});

		await page.goto("/");
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", {
				name: /Express controllers\. Inertia pages\. React without the API tax\./i,
			})
		).toBeVisible();
		await expect(page.getByText(/No REST layer, no fetch glue, no meta-framework detour\./i)).toBeVisible();

		const sandboxCta = page.getByRole("link", { name: "Try the sandbox" });
		await expect(sandboxCta).toBeVisible();
		await expect(sandboxCta).toHaveAttribute("href", "/register");

		const githubCta = page.getByRole("link", { name: "View on GitHub" });
		await expect(githubCta).toBeVisible();
		await expect(githubCta).toHaveAttribute(
			"href",
			"https://github.com/alphaofficial/theboringarchitecture"
		);

		await expect(page.getByText("Install in one command")).toBeVisible();
		await expect(
			page.getByText(
				"curl -fsSL https://raw.githubusercontent.com/alphaofficial/theboringarchitecture/main/install.sh | bash"
			)
		).toBeVisible();

		await page.getByRole("button", { name: "Copy install command" }).click();
		await expect(page.getByRole("button", { name: "Copy install command" })).toContainText("Copied");

		const architectureFlow = page.getByTestId("hero-architecture-flow");
		await expect(architectureFlow).toBeVisible();
		await expect(architectureFlow.getByText("Request-to-page flow")).toBeVisible();
		await expect(architectureFlow.getByText("Express route")).toBeVisible();
		await expect(architectureFlow.getByText("Controller")).toBeVisible();
		await expect(architectureFlow.getByText("React page")).toBeVisible();

		const featuresSection = page.getByTestId("features-section");
		await expect(featuresSection).toBeVisible();
		await expect(featuresSection.getByText("Server-rendered React")).toBeVisible();
		await expect(featuresSection.getByText("Complete auth flows")).toBeVisible();
		await expect(featuresSection.getByText("Production hardened")).toBeVisible();
		await expect(featuresSection.getByText("Zod env validation")).toBeVisible();

		const howItWorksSection = page.getByTestId("how-it-works-section");
		await expect(howItWorksSection).toBeVisible();
		await expect(howItWorksSection.getByText("From zero to shipping in three steps.")).toBeVisible();
		const pipeline = page.getByTestId("how-it-works-pipeline");
		await expect(pipeline).toBeVisible();

		const workflowSection = page.getByTestId("workflow-section");
		await expect(workflowSection).toBeVisible();
		await expect(workflowSection.getByText("Props flow straight from Express to React.")).toBeVisible();
		await expect(workflowSection.getByRole("heading", { name: "Define a route" })).toBeVisible();
		await expect(workflowSection.getByRole("heading", { name: "Call res.inertia()" })).toBeVisible();
		await expect(workflowSection.getByRole("heading", { name: "React renders the page" })).toBeVisible();
		await expect(workflowSection.getByText("src/controllers/PostController.ts")).toBeVisible();
		await expect(workflowSection.getByText("src/views/pages/Post.tsx")).toBeVisible();
	});

	test("login page renders the sign-in form", async ({ page }) => {
		await page.goto("/login");
		await expect(page.locator("#email")).toBeVisible();
		await expect(page.locator("#password")).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("register page renders the create account form", async ({ page }) => {
		await page.goto("/register");
		await expect(page.locator("#name")).toBeVisible();
		await expect(page.locator("#email")).toBeVisible();
		await expect(page.locator("#password")).toBeVisible();
		await expect(page.locator("#password_confirmation")).toBeVisible();
		await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
	});

	test("register flow creates an account and redirects to verify-email", async ({ page }) => {
		await page.goto("/register");
		await page.waitForLoadState("networkidle");

		await page.locator("#name").fill(E2E_USER.name);
		await page.locator("#email").fill(E2E_USER.email);
		await page.locator("#password").fill(E2E_USER.password);
		await page.locator("#password_confirmation").fill(E2E_USER.password);

		await page.getByRole("button", { name: /create account/i }).click();
		await page.waitForURL("/verify-email", { timeout: 15_000 });
	});

	test("login with valid credentials redirects to home", async ({ page }) => {
		// The user was registered in the previous test; log in with the same credentials
		await page.goto("/login");
		await page.waitForLoadState("networkidle");

		await page.locator("#email").fill(E2E_USER.email);
		await page.locator("#password").fill(E2E_USER.password);

		await page.getByRole("button", { name: /sign in/i }).click();
		// After login, redirect to /home or /verify-email (email not yet verified)
		await page.waitForURL(/\/(home|verify-email)/, { timeout: 15_000 });
	});

	test("login with invalid credentials shows an error", async ({ page }) => {
		await page.goto("/login");
		await page.locator("#email").fill("wrong@example.com");
		await page.locator("#password").fill("wrongpassword");
		await page.getByRole("button", { name: /sign in/i }).click();

		// Error message should appear on the login page
		await expect(page.locator("p.text-red-600")).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL("/login");
	});

	test("/home redirects unauthenticated users to /login", async ({ page }) => {
		await page.goto("/home");
		await expect(page).toHaveURL("/login", { timeout: 10_000 });
	});

	test("forgot password page renders the email form", async ({ page }) => {
		await page.goto("/forgot-password");
		await expect(page.locator("#email")).toBeVisible();
		await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
	});
});

test.describe("Mobile responsive layout", () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test("mobile navigation shows hamburger menu and hides desktop nav", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/");

		await expect(page.getByTestId("mobile-menu-button")).toBeVisible();
		await expect(page.getByTestId("desktop-nav")).toBeHidden();

		await expect(page.getByTestId("mobile-nav")).toBeHidden();

		await page.getByTestId("mobile-menu-button").click();
		await expect(page.getByTestId("mobile-nav")).toBeVisible();

		await expect(page.getByTestId("mobile-nav").getByText("Features")).toBeVisible();
		await expect(page.getByTestId("mobile-nav").getByText("How it works")).toBeVisible();
		await expect(page.getByTestId("mobile-nav").getByText("FAQ")).toBeVisible();
		await expect(page.getByTestId("mobile-nav").getByText("GitHub")).toBeVisible();
		await expect(page.getByTestId("mobile-nav").getByText("Log in")).toBeVisible();
	});

	test("mobile hero and CTA are visible with no horizontal overflow", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", {
				name: /Express controllers\. Inertia pages\. React without the API tax\./i,
			})
		).toBeVisible();

		await expect(page.getByRole("link", { name: "Try the sandbox" })).toBeVisible();
		await expect(page.getByRole("link", { name: "View on GitHub" })).toBeVisible();

		await expect(page.getByTestId("install-card")).toBeVisible();

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
	});

	test("mobile sections stack vertically and hide pipeline illustration", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId("features-section")).toBeVisible();
		await expect(page.getByTestId("features-section").getByText("Server-rendered React")).toBeVisible();

		await expect(page.getByTestId("how-it-works-section")).toBeVisible();
		await expect(page.getByTestId("how-it-works-section").getByText("From zero to shipping in three steps.")).toBeVisible();

		await expect(page.getByTestId("how-it-works-pipeline")).toBeHidden();

		await expect(page.getByTestId("workflow-section")).toBeVisible();
		await expect(page.getByText("Questions you might be asking.")).toBeVisible();
		await expect(page.getByTestId("bottom-cta-section")).toBeVisible();
	});
});

test.describe("Desktop responsive layout", () => {
	test.use({ viewport: { width: 1280, height: 720 } });

	test("desktop navigation shows full nav and hides hamburger", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/");

		await expect(page.getByTestId("desktop-nav")).toBeVisible();
		await expect(page.getByTestId("mobile-menu-button")).toBeHidden();

		await expect(page.getByTestId("desktop-nav").getByText("Features")).toBeVisible();
		await expect(page.getByTestId("desktop-nav").getByText("GitHub")).toBeVisible();
	});

	test("desktop shows pipeline illustration with no overflow", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId("how-it-works-pipeline")).toBeVisible();
		await expect(page.getByTestId("hero-architecture-flow")).toBeVisible();

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
	});
});
