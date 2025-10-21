import { EntitySchema } from "@mikro-orm/postgresql";
import { Example } from "@/models/Example";

export const ExampleMapper = new EntitySchema<Example>({
	class: Example,
	tableName: "test",
	properties: {
		id: { type: "string", primary: true },
		name: { type: "string" },
		createdAt: {
			type: "Date",
			defaultRaw: "CURRENT_TIMESTAMP",
		},
		updatedAt: {
			type: "Date",
			defaultRaw: "CURRENT_TIMESTAMP",
			onUpdate: () => new Date(),
		},
	},
});
