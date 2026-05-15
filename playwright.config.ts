import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./test/integration/playwright",
	globalSetup: "./test/integration/playwright/globalSetup.ts",
	globalTeardown: "./test/integration/playwright/globalTeardown.ts",
	workers: 1,
	use: {
		baseURL: "http://localhost:3003",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
