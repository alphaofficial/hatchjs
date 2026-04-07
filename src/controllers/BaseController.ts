import { Request, Response } from 'express';
import { PageName } from '../config/pages';
import * as fs from 'fs';
import * as path from 'path';
import variables from '../config/variables';

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Encodes a string for safe placement inside an HTML attribute value.
 * Browsers automatically decode these entities when reading `data-*` attributes.
 */
function escapeHtmlAttribute(value: string): string {
	return escapeHtml(value);
}

export class BaseController {
	public async render(req: Request, res: Response, componentName: PageName, componentProps: any = {}, documentMetadata: any = {}) {
		const inertia = req.inertia;
		const result = inertia.render(req, res, componentName, componentProps);

		if (res.headersSent) {
			return;
		}

		const templatePath = path.join(process.cwd(), 'public', 'template.html');

		try {
			const template = fs.readFileSync(templatePath, 'utf-8');

			const html = template
				.replace('{{TITLE}}', escapeHtml(documentMetadata.title || variables.APP_NAME))
				.replace('{{HEAD}}', documentMetadata.head || '')
				.replace('{{PAGE_DATA}}', escapeHtmlAttribute(JSON.stringify(result)))
				.replace('{{CLIENT_ENTRY}}', '/app.js');

			return res.send(html);
		} catch (error) {
			console.error('Template not found:', error);
			throw new Error('Template not found');
		}
	}
}