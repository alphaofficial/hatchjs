import type { BrowserContext } from '@playwright/test';
import { injectApp } from '../http';
import { bootstrapTestApp } from '../testHelpers';

const BASE_URL = 'http://localhost:3003';

export async function createAppHarness() {
	const appContext = await bootstrapTestApp({ dbName: 'express_inertia_e2e.db' });
	const cookieJars = new WeakMap<BrowserContext, Map<string, string>>();

	return {
		app: appContext.app,
		orm: appContext.orm,
		async attach(context: BrowserContext) {
			const cookieJar = new Map<string, string>();
			cookieJars.set(context, cookieJar);

			await context.route('**/*', async route => {
				const request = route.request();
				const url = new URL(request.url());

				if (url.origin !== BASE_URL) {
					await route.fallback();
					return;
				}

				const headers = await request.allHeaders();
				delete headers['accept-encoding'];
				delete headers['content-length'];
				delete headers.host;
				applyCookieJar(headers, cookieJar);

				const response = await injectApp(appContext.app, {
					method: request.method(),
					url: `${url.pathname}${url.search}`,
					headers,
					body: request.postDataBuffer() ?? undefined,
				});

				syncCookieJar(cookieJar, response.headers['set-cookie']);
				await syncCookies(context, response.headers['set-cookie'], url.origin);

				const fulfillHeaders = toFulfillHeaders(response.headers);
				delete fulfillHeaders['content-length'];
				delete fulfillHeaders['set-cookie'];

				await route.fulfill({
					status: response.status,
					headers: fulfillHeaders,
					body: response.text,
				});
			});
		},
		getCookieHeader(context: BrowserContext) {
			const cookieJar = cookieJars.get(context);
			if (!cookieJar || cookieJar.size === 0) {
				return '';
			}

			return Array.from(cookieJar.entries())
				.map(([name, value]) => `${name}=${value}`)
				.join('; ');
		},
		async close() {
			await appContext.orm.close(true);
		},
	};
}

function applyCookieJar(headers: Record<string, string>, cookieJar: Map<string, string>) {
	if (cookieJar.size === 0 || headers.cookie) {
		return;
	}

	headers.cookie = Array.from(cookieJar.entries())
		.map(([name, value]) => `${name}=${value}`)
		.join('; ');
}

function syncCookieJar(cookieJar: Map<string, string>, setCookieHeader: string | string[] | undefined) {
	if (!setCookieHeader) {
		return;
	}

	const values = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
	for (const value of values) {
		const [cookie] = value.split(';');
		const separator = cookie.indexOf('=');
		if (separator <= 0) {
			continue;
		}

		const name = cookie.slice(0, separator).trim();
		const cookieValue = cookie.slice(separator + 1).trim();
		if (!cookieValue) {
			cookieJar.delete(name);
			continue;
		}
		cookieJar.set(name, cookieValue);
	}
}

async function syncCookies(context: BrowserContext, setCookieHeader: string | string[] | undefined, origin: string) {
	if (!setCookieHeader) {
		return;
	}

	const values = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
	const cookies = values
		.map(value => parseSetCookie(value, origin))
		.filter((cookie): cookie is NonNullable<typeof cookie> => cookie !== null);

	if (cookies.length > 0) {
		await context.addCookies(cookies);
	}
}

function parseSetCookie(value: string, origin: string) {
	const [nameValue, ...attributes] = value.split(';').map(part => part.trim());
	const separator = nameValue.indexOf('=');
	if (separator <= 0) {
		return null;
	}

	const cookie: {
		name: string;
		value: string;
		url: string;
		expires?: number;
		httpOnly?: boolean;
		secure?: boolean;
		sameSite?: 'Lax' | 'None' | 'Strict';
	} = {
		name: nameValue.slice(0, separator),
		value: nameValue.slice(separator + 1),
		url: origin,
	};

	for (const attribute of attributes) {
		const [rawName, rawValue = ''] = attribute.split('=');
		const name = rawName.toLowerCase();

		if (name === 'path') {
			cookie.url = `${origin}${rawValue || '/'}`;
			continue;
		}

		if (name === 'expires') {
			const expires = Date.parse(rawValue);
			if (!Number.isNaN(expires)) {
				cookie.expires = Math.floor(expires / 1000);
			}
			continue;
		}

		if (name === 'max-age') {
			const seconds = Number(rawValue);
			if (!Number.isNaN(seconds)) {
				cookie.expires = Math.floor(Date.now() / 1000) + seconds;
			}
			continue;
		}

		if (name === 'httponly') {
			cookie.httpOnly = true;
			continue;
		}

		if (name === 'secure') {
			cookie.secure = true;
			continue;
		}

		if (name === 'samesite') {
			const sameSite = rawValue.toLowerCase();
			if (sameSite === 'lax' || sameSite === 'none' || sameSite === 'strict') {
				cookie.sameSite = sameSite[0].toUpperCase() + sameSite.slice(1) as 'Lax' | 'None' | 'Strict';
			}
		}
	}

	return cookie;
}

function toFulfillHeaders(headers: Record<string, string | string[]>) {
	const fulfilled: Record<string, string> = {};

	for (const [name, value] of Object.entries(headers)) {
		fulfilled[name] = Array.isArray(value) ? value.join(', ') : value;
	}

	return fulfilled;
}
