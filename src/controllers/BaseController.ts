import { Request, Response } from 'express';
import { PageName } from '../config/pages';
import * as fs from 'fs';
import * as path from 'path';

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
				.replace('{{TITLE}}', documentMetadata.title || 'Express Inertia App')
				.replace('{{HEAD}}', documentMetadata.head || '')
				.replace('{{PAGE_DATA}}', JSON.stringify(result).replace(/"/g, '&quot;'))
				.replace('{{CLIENT_ENTRY}}', '/app.js');

			return res.send(html);
		} catch (error) {
			console.error('Template not found:', error);
			throw new Error('Template not found');
		}
	}
}