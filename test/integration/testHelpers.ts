import { configureApp } from "@/router/app";
import { createAppContext } from "@/primitives/http";

export const bootstrapTestApp = async () => {
	const { app, orm } = await createAppContext();

	configureApp({ app, orm });

	return { app, orm };
};
