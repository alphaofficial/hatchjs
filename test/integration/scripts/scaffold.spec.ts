import { execSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const SCAFFOLD_SRC = join(REPO_ROOT, "scripts", "scaffold.sh");

// Minimal route.ts seed: scaffold.sh inserts routes above `export default route;`
const ROUTE_SEED = `import { Router } from 'express';
import { auth, guest } from '../middleware/auth';

const route = Router();

export default route;
`;

function sandbox(): string {
	const dir = mkdtempSync(join(tmpdir(), "tba-scaffold-"));
	mkdirSync(join(dir, "scripts"), { recursive: true });
	mkdirSync(join(dir, "src", "controllers"), { recursive: true });
	mkdirSync(join(dir, "src", "routes"), { recursive: true });
	mkdirSync(join(dir, "src", "views", "pages"), { recursive: true });
	mkdirSync(join(dir, "src", "models"), { recursive: true });
	mkdirSync(join(dir, "src", "database", "mappings"), { recursive: true });
	mkdirSync(join(dir, "src", "jobs"), { recursive: true });
	mkdirSync(join(dir, "src", "mail", "templates"), { recursive: true });
	mkdirSync(join(dir, "src", "listeners"), { recursive: true });
	copyFileSync(SCAFFOLD_SRC, join(dir, "scripts", "scaffold.sh"));
	writeFileSync(join(dir, "src", "routes", "route.ts"), ROUTE_SEED);
	// Symlink node_modules so dynamic imports of generated mapping files can
	// resolve @mikro-orm/* when the round-trip test needs it.
	symlinkSync(join(REPO_ROOT, "node_modules"), join(dir, "node_modules"));
	return dir;
}

function run(dir: string, args: string): void {
	execSync(`bash scripts/scaffold.sh ${args}`, {
		cwd: dir,
		stdio: "pipe",
	});
}

function read(dir: string, rel: string): string {
	return readFileSync(join(dir, rel), "utf8");
}

describe("scaffold.sh", () => {
	let dir: string;

	beforeEach(() => {
		dir = sandbox();
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	describe("page", () => {
		it("creates controller, page, and route", () => {
			run(dir, "page Posts");

			expect(existsSync(join(dir, "src/controllers/PostsController.ts"))).toBe(true);
			expect(existsSync(join(dir, "src/views/pages/Posts.tsx"))).toBe(true);

			const ctrl = read(dir, "src/controllers/PostsController.ts");
			expect(ctrl).toContain("export class PostsController extends BaseController");
			expect(ctrl).toContain("'Posts'");

			const routes = read(dir, "src/routes/route.ts");
			expect(routes).toContain(
				"import { PostsController } from '../controllers/PostsController';",
			);
			expect(routes).toContain("route.get('/posts', PostsController.index);");
			// Inserted above the export
			expect(routes.indexOf("route.get('/posts'")).toBeLessThan(
				routes.indexOf("export default route;"),
			);
		});

		it("supports nested pages", () => {
			run(dir, "page Auth/Profile /profile");

			expect(existsSync(join(dir, "src/views/pages/Auth/Profile.tsx"))).toBe(true);
			const page = read(dir, "src/views/pages/Auth/Profile.tsx");
			expect(page).toContain("export default function Profile");
			expect(read(dir, "src/routes/route.ts")).toContain(
				"route.get('/profile', ProfileController.index);",
			);
		});

		it("is idempotent — second run does not mutate files", () => {
			run(dir, "page Posts");
			const before = {
				ctrl: read(dir, "src/controllers/PostsController.ts"),
				page: read(dir, "src/views/pages/Posts.tsx"),
				routes: read(dir, "src/routes/route.ts"),
			};
			run(dir, "page Posts");
			expect(read(dir, "src/controllers/PostsController.ts")).toBe(before.ctrl);
			expect(read(dir, "src/views/pages/Posts.tsx")).toBe(before.page);
			expect(read(dir, "src/routes/route.ts")).toBe(before.routes);
		});
	});

	describe("controller", () => {
		it("creates controller only", () => {
			run(dir, "controller Billing");
			expect(existsSync(join(dir, "src/controllers/BillingController.ts"))).toBe(true);
			expect(existsSync(join(dir, "src/views/pages/Billing.tsx"))).toBe(false);
			expect(read(dir, "src/routes/route.ts")).not.toContain("Billing");
		});
	});

	describe("route", () => {
		it("inserts a public route and dedupes the import", () => {
			run(dir, "controller Public");
			run(dir, "route get /health Public.health");
			run(dir, "route get /ping Public.ping");

			const routes = read(dir, "src/routes/route.ts");
			// import line contains PublicController twice (named + module path),
			// plus two route references = 4 total occurrences, one import line.
			expect(
				(routes.match(/^import \{ PublicController \}/gm) ?? []).length,
			).toBe(1);
			expect(routes).toContain("route.get('/health', PublicController.health);");
			expect(routes).toContain("route.get('/ping', PublicController.ping);");
		});

		it("supports --auth and --guest guards", () => {
			run(dir, "controller Posts");
			run(dir, "route post /posts Posts.create --auth");
			run(dir, "route get /login Auth.show --guest");

			const routes = read(dir, "src/routes/route.ts");
			expect(routes).toContain("route.post('/posts', auth, PostsController.create);");
			expect(routes).toContain("route.get('/login', guest, AuthController.show);");
		});
	});

	describe("model", () => {
		it("creates a stub model and mapping when no fields given", () => {
			run(dir, "model Post");

			const model = read(dir, "src/models/Post.ts");
			expect(model).toContain("export class Post");
			expect(model).toContain("id!: string;");
			expect(model).toContain("createdAt: Date = new Date();");

			const mapping = read(dir, "src/database/mappings/post.map.ts");
			expect(mapping).toContain("export const PostMapper = new EntitySchema<Post>");
			expect(mapping).toContain('tableName: "posts"');
			expect(mapping).toContain('id: { type: "string", primary: true }');
		});

		it("emits typed fields with nullable support", () => {
			run(
				dir,
				`model Post --fields "title:string,body:text,views:int,published:bool,publishedAt:datetime?"`,
			);

			const model = read(dir, "src/models/Post.ts");
			expect(model).toContain("title!: string;");
			expect(model).toContain("body!: string;");
			expect(model).toContain("views!: number;");
			expect(model).toContain("published!: boolean;");
			expect(model).toContain("publishedAt?: Date;");

			const mapping = read(dir, "src/database/mappings/post.map.ts");
			expect(mapping).toContain('title: { type: "string" }');
			expect(mapping).toContain('body: { type: "text" }');
			expect(mapping).toContain('views: { type: "number" }');
			expect(mapping).toContain('published: { type: "boolean" }');
			expect(mapping).toContain('publishedAt: { type: "Date", nullable: true }');
		});

		it("rejects unknown field types", () => {
			expect(() => run(dir, `model Post --fields "title:weird"`)).toThrow(
				/unknown field type/,
			);
		});
	});

	describe("page --model", () => {
		it("generates page + controller + route + model + mapping", () => {
			run(dir, `page Post --model --fields "title:string,body:text"`);

			expect(existsSync(join(dir, "src/controllers/PostController.ts"))).toBe(true);
			expect(existsSync(join(dir, "src/views/pages/Post.tsx"))).toBe(true);
			expect(existsSync(join(dir, "src/models/Post.ts"))).toBe(true);
			expect(existsSync(join(dir, "src/database/mappings/post.map.ts"))).toBe(true);

			const mapping = read(dir, "src/database/mappings/post.map.ts");
			expect(mapping).toContain('title: { type: "string" }');
			expect(mapping).toContain('body: { type: "text" }');
		});
	});

	describe("job", () => {
		it("creates a job handler file", () => {
			run(dir, "job SendWelcomeEmail");

			const file = join(dir, "src/jobs/sendWelcomeEmail.ts");
			expect(existsSync(file)).toBe(true);

			const src = read(dir, "src/jobs/sendWelcomeEmail.ts");
			expect(src).toContain("interface SendWelcomeEmailPayload");
			expect(src).toContain("export async function sendWelcomeEmail(payload: unknown)");
		});

		it("is idempotent — second run does not overwrite", () => {
			run(dir, "job ProcessOrder");
			const before = read(dir, "src/jobs/processOrder.ts");
			run(dir, "job ProcessOrder");
			expect(read(dir, "src/jobs/processOrder.ts")).toBe(before);
		});
	});

	describe("mail", () => {
		it("creates a mail template file", () => {
			run(dir, "mail OrderConfirmation");

			const file = join(dir, "src/mail/templates/OrderConfirmation.ts");
			expect(existsSync(file)).toBe(true);

			const src = read(dir, "src/mail/templates/OrderConfirmation.ts");
			expect(src).toContain("interface OrderConfirmationData");
			expect(src).toContain("export function OrderConfirmation(");
		});

		it("is idempotent — second run does not overwrite", () => {
			run(dir, "mail ResetPassword");
			const before = read(dir, "src/mail/templates/ResetPassword.ts");
			run(dir, "mail ResetPassword");
			expect(read(dir, "src/mail/templates/ResetPassword.ts")).toBe(before);
		});
	});

	describe("event", () => {
		it("creates a listener file", () => {
			run(dir, "event UserSubscribed");

			const file = join(dir, "src/listeners/userSubscribed.ts");
			expect(existsSync(file)).toBe(true);

			const src = read(dir, "src/listeners/userSubscribed.ts");
			expect(src).toContain("emitter.on(");
			expect(src).toContain("UserSubscribed");
		});

		it("is idempotent — second run does not overwrite", () => {
			run(dir, "event UserUnsubscribed");
			const before = read(dir, "src/listeners/userUnsubscribed.ts");
			run(dir, "event UserUnsubscribed");
			expect(read(dir, "src/listeners/userUnsubscribed.ts")).toBe(before);
		});
	});

	describe("generated mapping round-trips through MikroORM sqlite :memory:", () => {
		it("persists and reads a row using the scaffolded model + mapping", async () => {
			run(
				dir,
				`model Post --fields "title:string,body:text,publishedAt:datetime?"`,
			);

			// Rewrite `@/models/Post` alias to a relative import so jest can resolve it
			// without the project's moduleNameMapper pointing at the real src tree.
			const mappingPath = join(dir, "src/database/mappings/post.map.ts");
			const mappingSrc = readFileSync(mappingPath, "utf8")
				.replace(`from "@/models/Post"`, `from "../../models/Post.ts"`)
				.replace(`from "@mikro-orm/postgresql"`, `from "@mikro-orm/sqlite"`);
			writeFileSync(mappingPath, mappingSrc);

			interface PostRow {
				id: string;
				title: string;
				body: string;
				publishedAt?: Date | null;
				createdAt: Date;
				updatedAt: Date;
			}
			type PostCtor = new () => PostRow;

			const { MikroORM } = await import("@mikro-orm/sqlite");
			const mappingModule = (await import(mappingPath)) as {
				PostMapper: Parameters<typeof MikroORM.init>[0]["entities"] extends
					| infer E
					| undefined
					? E extends ReadonlyArray<infer Item>
						? Item
						: never
					: never;
			};
			const modelModule = (await import(
				join(dir, "src/models/Post.ts")
			)) as { Post: PostCtor };
			const Post = modelModule.Post;

			const orm = await MikroORM.init({
				dbName: ":memory:",
				entities: [mappingModule.PostMapper],
				allowGlobalContext: true,
			});
			await orm.schema.createSchema();

			const em = orm.em.fork();
			const post = new Post();
			post.id = "p1";
			post.title = "Hello";
			post.body = "World";
			await em.persistAndFlush(post);

			const found = await em.fork().findOneOrFail<PostRow>(Post, { id: "p1" });
			expect(found.title).toBe("Hello");
			expect(found.body).toBe("World");
			expect(found.publishedAt).toBeNull();

			await orm.close(true);
		});
	});
});
