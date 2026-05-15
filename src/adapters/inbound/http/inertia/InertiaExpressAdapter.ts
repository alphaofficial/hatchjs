import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface SharedData {
	auth?: {
		user?: any;
	};
	flash?: {
		success?: string | null;
		error?: string | null;
	};
	[key: string]: any;
}

export class InertiaExpressAdapter {
	private version: string;
	private sharedData: SharedData = {};

	constructor(options: { version: string }) {
		this.version = options.version;
	}

	// Set shared data that will be available on all pages
	share(key: string, value: any): void;
	share(data: SharedData): void;
	share(keyOrData: string | SharedData, value?: any): void {
		if (typeof keyOrData === 'string') {
			this.sharedData[keyOrData] = value;
		} else {
			this.sharedData = { ...this.sharedData, ...keyOrData };
		}
	}

	render(req: Request, res: Response, component: string, props: any = {}) {
		// Merge shared data with page-specific props
		const finalProps = { ...this.sharedData, ...props };

		const isInertiaRequest = req.headers['x-inertia'] === 'true';

		if (isInertiaRequest) {
			const currentVersion = req.headers['x-inertia-version'] as string;

			if (currentVersion !== this.version) {
				return res.status(409).set('X-Inertia-Location', req.originalUrl).end();
			}

			// Handle partial reloads
			const partialData = req.headers['x-inertia-partial-data'] as string;
			const partialComponent = req.headers['x-inertia-partial-component'] as string;

			let responseProps = finalProps;
			if (partialData && partialComponent === component) {
				const only = partialData.split(',').map(key => key.trim());
				responseProps = {};
				only.forEach(key => {
					if (key in finalProps) {
						responseProps[key] = finalProps[key];
					}
				});
			}

			return res.set({
				'Vary': 'Accept',
				'X-Inertia': 'true',
			}).json({
				component,
				props: responseProps,
				url: req.originalUrl,
				version: this.version,
			});
		}

		// For non-Inertia requests, return the page data for template rendering
		return {
			component,
			props: finalProps,
			url: req.originalUrl,
			version: this.version,
		};
	}
}