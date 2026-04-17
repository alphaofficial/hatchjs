import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
	test("renders hero, install card, features, and how-it-works", async ({ page }) => {
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
				name: /The boring architecture\./i,
			})
		).toBeVisible();

		const githubCta = page.getByRole("link", { name: "View on GitHub" });
		await expect(githubCta).toBeVisible();
		await expect(githubCta).toHaveAttribute(
			"href",
			"https://github.com/alphaofficial/theboringarchitecture"
		);

		const installCard = page.getByTestId("install-card");
		await expect(installCard.getByText("Install in one command")).toBeVisible();
		await expect(
			installCard.getByText(
				"curl -fsSL https://raw.githubusercontent.com/alphaofficial/theboringarchitecture/main/install.sh | bash"
			)
		).toBeVisible();

		await installCard.getByRole("button", { name: "Copy install command" }).click();
		await expect(installCard.getByRole("button", { name: "Copy install command" })).toContainText("Copied");

		const featuresSection = page.getByTestId("features-section");
		await expect(featuresSection).toBeVisible();
		await expect(featuresSection.getByText("Server-side rendering")).toBeVisible();
		await expect(featuresSection.getByText("Authentication")).toBeVisible();
		await expect(featuresSection.getByText("Production hardened")).toBeVisible();
		await expect(featuresSection.getByText("AI ready")).toBeVisible();

		const howItWorksSection = page.getByTestId("how-it-works-section");
		await expect(howItWorksSection).toBeVisible();
		await expect(howItWorksSection.getByText("From zero to shipping in three steps.")).toBeVisible();
		const pipeline = page.getByTestId("how-it-works-pipeline");
		await expect(pipeline).toBeVisible();
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
		await expect(page.getByTestId("mobile-nav").getByText("GitHub")).toBeVisible();
	});

	test("mobile hero and CTA are visible with no horizontal overflow", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", {
				name: /The boring architecture\./i,
			})
		).toBeVisible();

		await expect(page.getByRole("link", { name: "View on GitHub" })).toBeVisible();

		await expect(page.getByTestId("install-card")).toBeVisible();

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
	});

	test("mobile sections stack vertically and hide pipeline illustration", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId("features-section")).toBeVisible();
		await expect(page.getByTestId("features-section").getByText("Server-side rendering")).toBeVisible();

		await expect(page.getByTestId("how-it-works-section")).toBeVisible();
		await expect(page.getByTestId("how-it-works-section").getByText("From zero to shipping in three steps.")).toBeVisible();

		await expect(page.getByTestId("how-it-works-pipeline")).toBeHidden();

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

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
	});
});
