import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import variables from '../config/variables';

const templatePath = path.join(process.cwd(), 'public', 'template.html');
const ssrBundlePath = path.join(process.cwd(), 'dist', 'ssr.mjs');

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

type SsrPayload = { head: string[]; body: string };
type SsrModule = { render: (page: unknown) => Promise<SsrPayload | void> };

async function loadSsrModule(): Promise<SsrModule> {
	// mtime in the URL busts Node's ESM cache when vite rebuilds the bundle in dev.
	const mtime = fs.statSync(ssrBundlePath).mtimeMs;
	const url = `${pathToFileURL(ssrBundlePath).href}?v=${mtime}`;
	return (await import(url)) as SsrModule;
}

async function renderOnSsr(page: unknown): Promise<SsrPayload | null> {
	try {
		const mod = await loadSsrModule();
		const result = await mod.render(page);
		return result ?? null;
	} catch (err) {
		console.error('[SSR] render failed, falling back to client-only:', err);
		return null;
	}
}

export async function renderInertiaHtml(
	page: unknown,
	title?: string,
	head?: string,
): Promise<string> {
	const ssr = await renderOnSsr(page);

	const template = fs.readFileSync(templatePath, 'utf-8');
	const app = ssr
		? ssr.body
		: `<div id="app" data-page="${escapeHtml(JSON.stringify(page))}"></div>`;
	const headContent = [head || '', ssr ? ssr.head.join('\n') : ''].filter(Boolean).join('\n');

	return template
		.replace('{{TITLE}}', escapeHtml(title || variables.APP_NAME))
		.replace('{{HEAD}}', headContent)
		.replace('{{APP}}', () => app)
		.replace('{{CLIENT_ENTRY}}', '/app.js');
}
