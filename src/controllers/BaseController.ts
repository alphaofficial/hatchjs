import { Request, Response } from 'express';
import { PageName } from '../config/pages';
import { renderInertiaHtml } from '../views/renderInertiaHtml';

export class BaseController {
	protected req: Request;
	protected res: Response;

	constructor(req: Request, res: Response) {
		this.req = req;
		this.res = res;
	}

	public async render(componentName: PageName, componentProps: any = {}, documentMetadata: any = {}) {
		const { req, res } = this;
		const page = req.inertia.render(req, res, componentName, componentProps);

		if (res.headersSent) {
			return;
		}

		const html = await renderInertiaHtml(page, documentMetadata.title, documentMetadata.head);
		return res.send(html);
	}
}
