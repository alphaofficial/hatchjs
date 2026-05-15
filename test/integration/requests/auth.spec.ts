import crypto from "crypto";
import { PasswordReset } from "@/core/models/PasswordReset";
import { User } from "@/core/models/User";
import variables from "@/config/variables";
import { bootstrapTestApp } from "../testHelpers";
import { TestDataFactory } from "../testDataFactory";
import { agent, request } from "../http";

function extractInertiaPageData(html: string): any {
	const match = html.match(/data-page="([^"]+)"/);
	if (!match) throw new Error("Could not find Inertia page data in HTML");
	const decodedData = match[1]
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
	return JSON.parse(decodedData);
}

function makePasswordResetToken(rawToken: string): string {
	return crypto
		.createHmac("sha256", variables.APP_KEY)
		.update(rawToken)
		.digest("hex");
}

function makeVerificationToken(userId: string, email: string): string {
	const payload = Buffer.from(
		JSON.stringify({ id: userId, email, iat: Date.now() })
	).toString("base64url");
	const sig = crypto
		.createHmac("sha256", variables.APP_KEY)
		.update(payload)
		.digest("hex");
	return `${payload}.${sig}`;
}

describe("Auth Flows Integration Tests", () => {
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
		// Also clean password_resets
		const em = database.em.fork();
		await em.nativeDelete(PasswordReset, {});
	});

	afterAll(async () => {
		await database?.close(true);
	});

	// ─── Register ───────────────────────────────────────────────────────────────

	describe("Register", () => {
		describe("GET /register", () => {
			it("renders the register page", async () => {
				const response = await request(app).get("/register");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
			});
		});

		describe("POST /register", () => {
			it("creates a user, persists a hashed password, and redirects to /verify-email", async () => {
				const response = await request(app)
					.post("/register")
					.send({
						name: "New User",
						email: "newuser@example.com",
						password: "password123",
						password_confirmation: "password123",
					});

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/verify-email");

				const em = database.em.fork();
				const created = await em.findOne(User, { email: "newuser@example.com" });
				expect(created).not.toBeNull();
				expect(created?.name).toBe("New User");
				expect(created?.password).not.toBe("password123");
				expect(created?.emailVerifiedAt ?? null).toBeNull();
			});

			it("rejects registration when the email is already taken", async () => {
				await testDataFactory.createUser({ email: "taken@example.com" });

				const response = await request(app)
					.post("/register")
					.send({
						name: "Another",
						email: "taken@example.com",
						password: "password123",
						password_confirmation: "password123",
					});

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
				expect(pageData.props.errors.email).toBeDefined();
			});

			it("returns a validation error when passwords do not match", async () => {
				const response = await request(app)
					.post("/register")
					.send({
						name: "Mismatch",
						email: "mismatch@example.com",
						password: "password123",
						password_confirmation: "different123",
					});

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Register");
				expect(pageData.props.errors.password_confirmation).toBeDefined();
			});
		});
	});

	// ─── Login ──────────────────────────────────────────────────────────────────

	describe("Login", () => {
		describe("GET /login", () => {
			it("renders the login page", async () => {
				const response = await request(app).get("/login");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
			});

			it("includes a reset status when ?reset=1 is present", async () => {
				const response = await request(app).get("/login?reset=1");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
				expect(pageData.props.status).toMatch(/reset/i);
			});
		});

		describe("POST /login", () => {
			it("authenticates a valid user and redirects to /home", async () => {
				const user = await testDataFactory.createUser({ email: "loginok@example.com" });

				const response = await request(app)
					.post("/login")
					.send({ email: user.email, password: "password123" });

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/home");
			});

			it("returns an invalid credentials error for the wrong password", async () => {
				const user = await testDataFactory.createUser({ email: "wrongpw@example.com" });

				const response = await request(app)
					.post("/login")
					.send({ email: user.email, password: "not-the-password" });

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/Login");
				expect(pageData.props.errors.email).toBe("Invalid credentials");
			});
		});
	});

	// ─── Forgot Password ────────────────────────────────────────────────────────

	describe("Forgot Password", () => {
		describe("GET /forgot-password", () => {
			it("renders the forgot password page", async () => {
				const response = await request(app).get("/forgot-password");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ForgotPassword");
			});
		});

		describe("POST /forgot-password", () => {
			it("accepts a valid email and returns a success status", async () => {
				await testDataFactory.createUser({ email: "reset@example.com" });

				const response = await request(app)
					.post("/forgot-password")
					.send({ email: "reset@example.com" });

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ForgotPassword");
				expect(pageData.props.status).toMatch(/emailed/i);

				// A password reset record should have been created
				const em = database.em.fork();
				const reset = await em.findOne(PasswordReset, { email: "reset@example.com" });
				expect(reset).not.toBeNull();
			});

			it("returns the same success response for a non-existent email (no enumeration)", async () => {
				const response = await request(app)
					.post("/forgot-password")
					.send({ email: "ghost@example.com" });

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ForgotPassword");
				expect(pageData.props.status).toMatch(/emailed/i);
			});

			it("returns a validation error for an invalid email format", async () => {
				const response = await request(app)
					.post("/forgot-password")
					.send({ email: "not-an-email" });

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ForgotPassword");
				expect(pageData.props.errors).toBeDefined();
			});
		});
	});

	// ─── Password Reset ──────────────────────────────────────────────────────────

	describe("Password Reset", () => {
		describe("GET /reset-password/:token", () => {
			it("renders the reset password page with the token and email", async () => {
				const response = await request(app)
					.get("/reset-password/sometoken?email=user@example.com");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ResetPassword");
				expect(pageData.props.token).toBe("sometoken");
				expect(pageData.props.email).toBe("user@example.com");
			});
		});

		describe("POST /reset-password", () => {
			it("resets the password with a valid token", async () => {
				const user = await testDataFactory.createUser({ email: "valid@example.com" });

				const rawToken = crypto.randomBytes(32).toString("hex");
				const tokenHash = makePasswordResetToken(rawToken);
				const em = database.em.fork();
				em.create(PasswordReset, { email: user.email, tokenHash, createdAt: new Date() });
				await em.flush();

				const response = await request(app)
					.post("/reset-password")
					.send({
						token: rawToken,
						email: user.email,
						password: "newPassword123",
						password_confirmation: "newPassword123",
					});

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login?reset=1");

				// Token should be deleted
				const em2 = database.em.fork();
				const reset = await em2.findOne(PasswordReset, { email: user.email });
				expect(reset).toBeNull();
			});

			it("returns an error for an invalid token", async () => {
				await testDataFactory.createUser({ email: "valid2@example.com" });

				const response = await request(app)
					.post("/reset-password")
					.send({
						token: "badtoken",
						email: "valid2@example.com",
						password: "newPassword123",
						password_confirmation: "newPassword123",
					});

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ResetPassword");
				expect(pageData.props.errors.token).toBeDefined();
			});

			it("returns an error for an expired token", async () => {
				const user = await testDataFactory.createUser({ email: "expired@example.com" });

				const rawToken = crypto.randomBytes(32).toString("hex");
				const tokenHash = makePasswordResetToken(rawToken);
				const em = database.em.fork();
				// Expired: createdAt in the past beyond the expiry window
				const pastDate = new Date(Date.now() - (variables.PASSWORD_RESET_EXPIRY + 5) * 60 * 1000);
				em.create(PasswordReset, { email: user.email, tokenHash, createdAt: pastDate });
				await em.flush();

				const response = await request(app)
					.post("/reset-password")
					.send({
						token: rawToken,
						email: user.email,
						password: "newPassword123",
						password_confirmation: "newPassword123",
					});

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ResetPassword");
				expect(pageData.props.errors.token[0]).toMatch(/expired/i);
			});

			it("returns a validation error for mismatched passwords", async () => {
				const response = await request(app)
					.post("/reset-password")
					.send({
						token: "sometoken",
						email: "x@example.com",
						password: "newPassword123",
						password_confirmation: "differentPassword",
					});

				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/ResetPassword");
				expect(pageData.props.errors.password_confirmation).toBeDefined();
			});
		});
	});

	// ─── Email Verification ──────────────────────────────────────────────────────

	describe("Email Verification", () => {
		describe("GET /verify-email", () => {
			it("renders the verify email page for authenticated users", async () => {
				const user = await testDataFactory.createUser();
				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const response = await session.get("/verify-email");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/VerifyEmail");
			});

			it("redirects unauthenticated users to login", async () => {
				const response = await request(app).get("/verify-email");
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});

		describe("GET /verify-email/:token", () => {
			it("verifies the email with a valid token", async () => {
				const user = await testDataFactory.createUser({ email: "verify@example.com" });
				expect(user.emailVerifiedAt).toBeUndefined();

				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const token = makeVerificationToken(user.id, user.email);
				const response = await session.get(`/verify-email/${token}`);

				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/home");

				const em = database.em.fork();
				const updatedUser = await em.findOne(User, { id: user.id });
				expect(updatedUser?.emailVerifiedAt).toBeDefined();
			});

			it("returns an error for an invalid token", async () => {
				const user = await testDataFactory.createUser({ email: "invalidtoken@example.com" });
				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const response = await session.get("/verify-email/invalidtoken");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/VerifyEmail");
				expect(pageData.props.errors.email).toBeDefined();
			});

			it("returns an error for an expired token", async () => {
				const user = await testDataFactory.createUser({ email: "expiredverify@example.com" });

				// Create a token with a very old iat
				const expiredIat = Date.now() - (variables.EMAIL_VERIFICATION_EXPIRY + 5) * 60 * 1000;
				const payload = Buffer.from(
					JSON.stringify({ id: user.id, email: user.email, iat: expiredIat })
				).toString("base64url");
				const sig = crypto
					.createHmac("sha256", variables.APP_KEY)
					.update(payload)
					.digest("hex");
				const expiredToken = `${payload}.${sig}`;

				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const response = await session.get(`/verify-email/${expiredToken}`);
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/VerifyEmail");
				expect(pageData.props.errors.email[0]).toMatch(/expired/i);
			});

			it("is idempotent — redirects to home if already verified", async () => {
				const user = await testDataFactory.createUser({ email: "already@example.com" });

				// Verify once via authenticated agent
				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });
				const token = makeVerificationToken(user.id, user.email);
				await session.get(`/verify-email/${token}`);

				// Verify again with a new token (still authenticated)
				const token2 = makeVerificationToken(user.id, user.email);
				const response2 = await session.get(`/verify-email/${token2}`);
				expect(response2.status).toBe(302);
				expect(response2.headers.location).toBe("/home");
			});
		});

		describe("POST /email/resend-verification", () => {
			it("resends the verification email for an unverified user", async () => {
				const user = await testDataFactory.createUser({ email: "resend@example.com" });
				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const response = await session.post("/email/resend-verification");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/VerifyEmail");
				expect(pageData.props.status).toMatch(/sent/i);
			});

			it("returns a message if the email is already verified", async () => {
				const user = await testDataFactory.createUser({ email: "alreadyverified@example.com" });

				// Set emailVerifiedAt directly in DB to guarantee it's visible to all EM forks
				const em = database.em.fork();
				const dbUser = await em.findOne(User, { id: user.id });
				dbUser!.emailVerifiedAt = new Date();
				await em.flush();

				const session = agent(app);
				await session.post("/login").send({ email: user.email, password: "password123" });

				const response = await session.post("/email/resend-verification");
				expect(response.status).toBe(200);
				const pageData = extractInertiaPageData(response.text);
				expect(pageData.component).toBe("Auth/VerifyEmail");
				expect(pageData.props.status).toMatch(/already verified/i);
			});

			it("redirects unauthenticated requests to login", async () => {
				const response = await request(app).post("/email/resend-verification");
				expect(response.status).toBe(302);
				expect(response.headers.location).toBe("/login");
			});
		});
	});
});
