import supertest from "supertest";
import { bootstrapTestApp } from "../testHelpers";
import { TestDataFactory } from "../testDataFactory";
import { User } from "../../../src/models/User";

describe("Pages Integration Tests", () => {
	let app: any;
	let database: any;
	let testDataFactory: TestDataFactory;

	beforeAll(async () => {
		const testApp = await bootstrapTestApp();
		app = testApp.app;
		database = testApp.orm;
		testDataFactory = new TestDataFactory(database);
	});

	beforeEach(async () => {
		await testDataFactory.cleanupAll();
	});

	beforeEach(async () => {
		await testDataFactory.cleanupAll();
	});

	describe("Public Pages", () => {
		describe("GET /", () => {
			it("should render landing page for unauthenticated users", async () => {
				const response = await supertest(app).get("/");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Home");
				expect(pageData.props.applicationName).toBe("Express Inertia");
			});

			it("should render landing page for authenticated users", async () => {
				const user = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: user.email, password: "password123" });

				const response = await agent.get("/");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Home");
				expect(pageData.props.applicationName).toBe("Express Inertia");
			});
		});

		describe("GET /about", () => {
			it("should render About page for authenticated users", async () => {
				const user = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: user.email, password: "password123" });

				const response = await agent.get("/about");
				
				expect(response.status).toBe(200);
				expect(response.text).toContain("About Us");
				expect(response.text).toContain("This is an Inertia.js app running on Express with React.");
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("About");
				expect(pageData.props.title).toBe("About Us");
				expect(pageData.props.description).toBe("This is an Inertia.js app running on Express with React.");
			});

			it("should redirect unauthenticated users to login", async () => {
				const response = await supertest(app).get("/about");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});
	});

	describe("Authentication Pages", () => {
		describe("GET /login", () => {
			it("should render login page for guests", async () => {
				const response = await supertest(app).get("/login");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
				expect(pageData.props.isAuthenticated).toBe(false);
				expect(pageData.props.user).toBeNull();
				expect(pageData.props.errors).toBeUndefined();
			});

			it("should redirect authenticated users away from login", async () => {
				const user = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: user.email, password: "password123" });

				const response = await agent.get("/login");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/home");
			});
		});

		describe("POST /login", () => {
			it("should authenticate user with valid credentials", async () => {
				const user = await testDataFactory.createUser({
					email: "test@example.com",
					password: "password123"
				});

				const response = await supertest(app)
					.post("/login")
					.send({ email: "test@example.com", password: "password123" });

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/home");
			});

			it("should return errors for invalid credentials", async () => {
				const response = await supertest(app)
					.post("/login")
					.send({ email: "invalid@example.com", password: "wrongpassword" });

				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
				expect(pageData.props.errors.email).toBe("Invalid credentials");
			});

			it("should return validation errors for missing fields", async () => {
				const response = await supertest(app)
					.post("/login")
					.send({ email: "", password: "" });

				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
				expect(pageData.props.errors).toBeDefined();
			});
		});

		describe("GET /register", () => {
			it("should render register page for guests", async () => {
				const response = await supertest(app).get("/register");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
				expect(pageData.props.errors).toBeUndefined();
			});
		});

		describe("POST /register", () => {
			it("should register new user with valid data", async () => {
				const userData = {
					name: "John Doe",
					email: "john@example.com",
					password: "password123",
					password_confirmation: "password123"
				};

				const response = await supertest(app)
					.post("/register")
					.send(userData);

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/home");

				const em = database.em.fork();
				const createdUser = await em.findOne(User, { email: "john@example.com" });
				expect(createdUser).toBeDefined();
				expect(createdUser?.name).toBe("John Doe");
			});

			it("should return error for existing email", async () => {
				await testDataFactory.createUser({ email: "existing@example.com" });

				const userData = {
					name: "John Doe",
					email: "existing@example.com",
					password: "password123",
					password_confirmation: "password123"
				};

				const response = await supertest(app)
					.post("/register")
					.send(userData);

				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
				expect(pageData.props.errors.email).toBe("Email already taken");
			});

			it("should return validation errors for mismatched passwords", async () => {
				const userData = {
					name: "John Doe",
					email: "john@example.com",
					password: "password123",
					password_confirmation: "different"
				};

				const response = await supertest(app)
					.post("/register")
					.send(userData);

				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
				expect(pageData.props.errors.password_confirmation).toBeDefined();
			});
		});

		describe("GET /home", () => {
			it("should render dashboard for authenticated users", async () => {
				const user = await testDataFactory.createUser({
					name: "John Doe",
					email: "john@example.com"
				});
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: user.email, password: "password123" });

				const response = await agent.get("/home");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Dashboard");
				expect(pageData.props.user).toBeDefined();
				expect(pageData.props.user.name).toBe("John Doe");
				expect(pageData.props.user.email).toBe("john@example.com");
			});

			it("should redirect unauthenticated users to login", async () => {
				const response = await supertest(app).get("/home");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});

		describe("POST /logout", () => {
			it("should logout authenticated user", async () => {
				const testUser = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: testUser.email, password: "password123" });

				const response = await agent.post("/logout");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");

				const dashboardResponse = await agent.get("/home");
				expect(dashboardResponse.status).toBe(302);
				expect(dashboardResponse.headers.location).toBe("/login");
			});
		});
	});

	describe("Health & Errors", () => {
		it("GET /healthz returns 200", async () => {
			const response = await supertest(app).get("/healthz");
			expect(response.status).toBe(200);
			expect(response.body.status).toBe("ok");
		});

		it("GET /readyz returns 200 when DB reachable", async () => {
			const response = await supertest(app).get("/readyz");
			expect(response.status).toBe(200);
			expect(response.body.status).toBe("ready");
		});

		it("Unknown route renders Inertia Error page (404)", async () => {
			const response = await supertest(app).get("/this-route-does-not-exist");
			expect(response.status).toBe(200); // BaseController.render sends 200; status is in props
			const pageData = extractInertiaPageData(response.text);
			expect(pageData.component).toBe("Error");
			expect(pageData.props.status).toBe(404);
		});

		it("Page-prop XSS payloads are HTML-escaped in the data-page attribute", async () => {
			const response = await supertest(app).get("/");
			expect(response.status).toBe(200);
			// Raw < and > from JSON should not appear unescaped inside the attribute
			const attr = response.text.match(/data-page="([^"]*)"/)?.[1] ?? "";
			expect(attr).not.toMatch(/</);
			expect(attr).not.toMatch(/>/);
			// And the round-trip decoder still produces valid JSON
			const pageData = extractInertiaPageData(response.text);
			expect(pageData.component).toBe("Home");
		});

		it("Helmet security headers are present", async () => {
			const response = await supertest(app).get("/");
			expect(response.headers["x-content-type-options"]).toBe("nosniff");
			expect(response.headers["x-frame-options"]).toBeDefined();
		});
	});

	describe("User Pages", () => {
		describe("GET /users", () => {
			it("should render users list for authenticated users", async () => {
				const testUser = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: testUser.email, password: "password123" });

				const response = await agent.get("/users");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Users");
				expect(pageData.props.users).toBeDefined();
				expect(Array.isArray(pageData.props.users)).toBe(true);
				expect(pageData.props.users.length).toBe(3); // Static data from controller
				
				const firstUser = pageData.props.users[0];
				expect(firstUser).toHaveProperty("id");
				expect(firstUser).toHaveProperty("name");
				expect(firstUser).toHaveProperty("email");
				expect(firstUser.name).toBe("Alice Johnson");
				expect(firstUser.email).toBe("alice@example.com");
			});

			it("should redirect unauthenticated users to login", async () => {
				const response = await supertest(app).get("/users");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});

		describe("GET /users/:id", () => {
			it("should render individual user page for authenticated users", async () => {
				const testUser = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: testUser.email, password: "password123" });

				const response = await agent.get("/users/1");
				
				expect(response.status).toBe(200);
				
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("User");
				expect(pageData.props.user).toBeDefined();
				expect(pageData.props.user.id).toBe(1);
				expect(pageData.props.user.name).toBe("Alice Johnson");
				expect(pageData.props.user.email).toBe("alice@example.com");
			});

			it("should return 404 for non-existent user", async () => {
				const testUser = await testDataFactory.createUser();
				const agent = supertest.agent(app);
				
				await agent
					.post("/login")
					.send({ email: testUser.email, password: "password123" });

				const response = await agent.get("/users/999");
				
				expect(response.status).toBe(404);
				expect(response.body.error).toBe("User not found");
			});

			it("should redirect unauthenticated users to login", async () => {
				const response = await supertest(app).get("/users/1");
				
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});
	});
});

function extractInertiaPageData(html: string): any {
	const match = html.match(/data-page="([^"]+)"/);
	if (!match) {
		throw new Error("Could not find Inertia page data in HTML");
	}

	const decodedData = match[1]
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
	return JSON.parse(decodedData);
}