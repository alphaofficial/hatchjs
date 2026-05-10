import { IncomingMessage, ServerResponse } from 'node:http';
import { Duplex } from 'node:stream';

type HeaderValue = string | string[];

interface ResponseLike {
	status: number;
	text: string;
	body: any;
	headers: Record<string, HeaderValue>;
}

class MockSocket extends Duplex {
	remoteAddress = '127.0.0.1';

	_read() {}

	_write(_chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
		callback();
	}

	setTimeout() {}

	destroy() {
		return this;
	}

	cork() {}

	uncork() {}

	write(_chunk: any, _encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) {
		if (typeof _encoding === 'function') {
			_encoding();
		}
		callback?.();
		return true;
	}
}

class CookieJar {
	private readonly cookies = new Map<string, string>();

	apply(headers: Record<string, string>) {
		if (this.cookies.size === 0) {
			return;
		}

		headers.cookie = Array.from(this.cookies.entries())
			.map(([name, value]) => `${name}=${value}`)
			.join('; ');
	}

	store(setCookieHeader: string | string[] | undefined) {
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
			this.cookies.set(name, cookieValue);
		}
	}
}

class PendingRequest implements PromiseLike<ResponseLike> {
	private readonly headers: Record<string, string> = {};
	private payload?: Buffer;
	private expectedStatus?: number;

	constructor(
		private readonly app: any,
		private readonly method: string,
		private readonly url: string,
		private readonly cookieJar?: CookieJar,
	) {}

	set(name: string, value: string) {
		this.headers[name.toLowerCase()] = value;
		return this;
	}

	send(value?: Buffer | string | Record<string, unknown>) {
		if (value === undefined) {
			return this;
		}

		if (Buffer.isBuffer(value)) {
			this.payload = value;
			return this;
		}

		if (typeof value === 'string') {
			this.payload = Buffer.from(value);
			return this;
		}

		if (!this.headers['content-type']) {
			this.headers['content-type'] = 'application/json';
		}

		this.payload = Buffer.from(JSON.stringify(value));
		return this;
	}

	expect(status: number) {
		this.expectedStatus = status;
		return this;
	}

	then<TResult1 = ResponseLike, TResult2 = never>(
		onfulfilled?: ((value: ResponseLike) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
	) {
		return this.execute().then(onfulfilled, onrejected);
	}

	catch<TResult = never>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
	) {
		return this.execute().catch(onrejected);
	}

	finally(onfinally?: (() => void) | null) {
		return this.execute().finally(onfinally ?? undefined);
	}

	private async execute(): Promise<ResponseLike> {
		const headers = { ...this.headers };
		this.cookieJar?.apply(headers);

		if (this.payload && !headers['content-length']) {
			headers['content-length'] = String(this.payload.length);
		}

		const response = await injectApp(this.app, {
			method: this.method,
			url: this.url,
			headers,
			body: this.payload,
		});

		this.cookieJar?.store(response.headers['set-cookie']);

		if (this.expectedStatus !== undefined && response.status !== this.expectedStatus) {
			throw new Error(`Expected ${this.expectedStatus}, received ${response.status}`);
		}

		return response;
	}
}

class RequestAgent {
	private readonly cookieJar = new CookieJar();

	constructor(private readonly app: any) {}

	get(url: string) {
		return new PendingRequest(this.app, 'GET', url, this.cookieJar);
	}

	post(url: string) {
		return new PendingRequest(this.app, 'POST', url, this.cookieJar);
	}
}

interface InjectOptions {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: Buffer;
}

export async function injectApp(app: any, options: InjectOptions): Promise<ResponseLike> {
	const socket = new MockSocket();
	const req = new IncomingMessage(socket as any);
	req.method = options.method;
	req.url = options.url;
	req.headers = options.headers;
	(req as any).connection = socket;
	(req as any).socket = socket;

	const res = new ServerResponse(req);
	const chunks: Buffer[] = [];

	res.write = ((chunk: any, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
		if (chunk) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined));
		}

		if (typeof encoding === 'function') {
			encoding();
		}
		callback?.();
		return true;
	}) as typeof res.write;

	res.end = ((chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void) => {
		if (chunk) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined));
		}

		if (typeof encoding === 'function') {
			encoding();
		}
		callback?.();
		process.nextTick(() => res.emit('finish'));
		return res;
	}) as typeof res.end;

	await new Promise<void>((resolve, reject) => {
		res.on('finish', () => resolve());
		res.on('error', reject);
		app.handle(req, res, reject);

		process.nextTick(() => {
			if (options.body) {
				req.push(options.body);
			}
			req.push(null);
		});
	});

	const responseHeaders = normalizeHeaders(res.getHeaders());
	const text = Buffer.concat(chunks).toString('utf8');
	const contentType = responseHeaders['content-type'];
	const body = typeof contentType === 'string' && contentType.includes('application/json')
		? JSON.parse(text)
		: undefined;

	return {
		status: res.statusCode,
		text,
		body,
		headers: responseHeaders,
	};
}

function normalizeHeaders(headers: ReturnType<ServerResponse['getHeaders']>) {
	const normalized: Record<string, HeaderValue> = {};

	for (const [name, value] of Object.entries(headers)) {
		if (Array.isArray(value)) {
			normalized[name] = value.map(String);
			continue;
		}

		if (value !== undefined) {
			normalized[name] = String(value);
		}
	}

	return normalized;
}

export function request(app: any) {
	return new RequestAgent(app);
}

export function agent(app: any) {
	return new RequestAgent(app);
}

export type { InjectOptions, ResponseLike };
