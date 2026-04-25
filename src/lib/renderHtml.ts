import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'node:module';
import variables from '../config/variables';

const templatePath = path.join(process.cwd(), 'public', 'template.html');
const ssrBundlePath = path.join(process.cwd(), 'dist', 'ssr.mjs');

// Anchored to the project root so `projectRequire(...)` resolves paths the
// same way regardless of where this file was compiled to. Node ≥22.12 lets
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
	// Bust the require cache so dev `vite build --config vite.ssr.config.mjs --watch`
	// rebuilds take effect without restarting the server.
	delete projectRequire.cache[ssrBundlePath];
	return projectRequire(ssrBundlePath) as SsrModule;
}

async function renderOnSsr(page: unknown): Promise<SsrPayload | null> {
	try {
		const mod = loadSsrModule();
		const result = await mod.render(page);
		return result ?? null;
	} catch (err) {
		console.error('[SSR] render failed, falling back to client-only:', err);
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
