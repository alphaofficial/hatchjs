import pino, { type Options, stdSerializers } from "pino-http";

const isDev = process.env.NODE_ENV !== "production";

let coreConfig: Options = {
	serializers: {
		...stdSerializers,
		req: (req) => ({
			method: req.method,
			url: req.url,
			userAgent: req.headers["user-agent"],
		}),
		res: (res) => ({
			statusCode: res.statusCode,
		}),
		error: stdSerializers.err,
	},
	formatters: {
		level(level) {
			return { level };
		},
	},
	customLogLevel: (_req, res, err) => {
		if (res.statusCode >= 400 && res.statusCode < 500) {
			return "warn";
		} else if (res.statusCode >= 500 || err) {
			return "error";
		} else if (res.statusCode >= 300 && res.statusCode < 400) {
			return "silent";
		}
		return "info";
	},
	customSuccessMessage: (req, _res) => {
		const expressReq = req as any;
		if (expressReq.statusCode === 404) {
			return "Resource not found";
		}
		return `${expressReq.method} ${expressReq.originalUrl} completed`;
	},
	customReceivedMessage: (req, _res) => `Request received:  ${req.method}`,
};

if (isDev) {
	const isTestsRun = !!process.env.TESTS_RUN;
	const prettyOptions = {
		colorize: true,
		singleLine: true,
	};

	if (isTestsRun) {
		// eslint-disable-next-line import/no-extraneous-dependencies, global-require
		const pretty = require("pino-pretty");
		coreConfig = pretty(prettyOptions);
	} else {
		coreConfig = {
			...coreConfig,
			transport: {
				target: "pino-pretty",
				options: prettyOptions,
			},
		};
	}
}

const pinoInstance = pino(coreConfig);

export interface LogOptions {
	scope: string;
	message: string;
	params?: Record<string, unknown>;
	tags?: readonly string[] | string;
}

export class PinoLogger {
	public static instance = pinoInstance;

	public static critical(options: LogOptions): void {
		// @ts-expect-error Critical logging exists
		PinoLogger.instance.logger.critical(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static fatal(options: LogOptions): void {
		PinoLogger.instance.logger.fatal(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static error(options: LogOptions): void {
		PinoLogger.instance.logger.error(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static warn(options: LogOptions): void {
		PinoLogger.instance.logger.warn(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static info(options: LogOptions): void {
		PinoLogger.instance.logger.info(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static debug(options: LogOptions): void {
		PinoLogger.instance.logger.debug(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}

	public static trace(options: LogOptions): void {
		PinoLogger.instance.logger.trace(
			{ ...options.params, tags: options.tags },
			`[${options.scope}] ${options.message}`,
		);
	}
}

