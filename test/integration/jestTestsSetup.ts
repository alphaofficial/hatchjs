import { configureRuntimeDrivers } from "@/runtime/config";
import { buildIntegrationTestEnv } from "./testEnv";

const defaultProcessEnv = buildIntegrationTestEnv(process.env);

beforeEach(() => {
	process.env = { ...defaultProcessEnv };
	configureRuntimeDrivers();
});

afterEach(() => {
	process.env = { ...defaultProcessEnv };
});

afterAll(() => {
	process.env = { ...defaultProcessEnv };
});
