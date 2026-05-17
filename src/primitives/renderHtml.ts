import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'node:module';
import variables from '../config/variables';

const templatePath = path.join(process.cwd(), 'public', 'template.html');
const ssrBundlePath = path.join(process.cwd(), 'dist', 'ssr.mjs');

// Anchored to the project root so `projectRequire(...)` resolves paths the
// same way regardless of where this file was compiled to. Node >=22.12 lets
// this load `.mjs` too, so the SSR bundle goes through the single code path.
const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

type SsrPayload = { head: string[]; body: string };
type SsrModule = { render: (page: unknown) => Promise<SsrPayload | void> };

function loadSsrModule(): SsrModule {
	delete projectRequire.cache[ssrBundlePath];
	return projectRequire(ssrBundlePath) as SsrModule;
}

function isJestSsrBundleLoadFailure(err: unknown): boolean {
	if (!(err instanceof Error)) return false;
	const code = (err as NodeJS.ErrnoException).code;
	return code === 'ERR_REQUIRE_ESM'
		|| err.message.includes('Must use import to load ES Module')
		|| err.message.includes('Cannot use import statement outside a module');
}

function logSsrFallback(err: unknown): void {
	// Jest runs this CommonJS code path and cannot reliably require the ESM SSR
	// bundle. Integration tests can still exercise the client-only fallback, but
	// this expected harness limitation should not spam console.error and obscure
	// real failures.
	if (process.env.NODE_ENV === 'test' && isJestSsrBundleLoadFailure(err)) return;

	console.error('[SSR] render failed, falling back to client-only:', err);
}

async function renderOnSsr(page: unknown): Promise<SsrPayload | null> {
	try {
		const mod = loadSsrModule();
		const result = await mod.render(page);
		return result ? result : null;
	} catch (err) {
		logSsrFallback(err);
		return null;
	}
}

export async function renderHtml(
	page: unknown,
	title?: string,
	head?: string,
): Promise<string> {
	const ssr = variables.SSR_ENABLED ? await renderOnSsr(page) : null;

	const template = fs.readFileSync(templatePath, 'utf-8');
	const app = ssr
		? ssr.body
		: `<div id="app" data-page="${escapeHtml(JSON.stringify(page))}"></div>`;
	const headContent = [head || '', ssr ? ssr.head.join('\n') : ''].filter(Boolean).join('\n');

	return template
		.replace(/\{\{TITLE\}\}/g, escapeHtml(title || variables.APP_NAME))
		.replace('{{HEAD}}', headContent)
		.replace('{{APP}}', () => app)
		.replace('{{CLIENT_ENTRY}}', '/app.js');
}
