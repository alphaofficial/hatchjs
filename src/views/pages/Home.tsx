import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
	applicationName: string;
	auth?: any;
	isAuthenticated?: boolean;
}

const INSTALL_CMD =
	'curl -fsSL https://raw.githubusercontent.com/alphaofficial/express-inertia/main/install.sh | bash';

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				// Fallback for older browsers / non-secure contexts
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		} catch {
			/* no-op */
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label="Copy install command"
			className="ml-3 inline-flex items-center gap-x-1.5 rounded-sm border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-200 hover:bg-gray-700"
		>
			{copied ? (
				<>
					<svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd"/>
					</svg>
					Copied
				</>
			) : (
				<>
					<svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2v-1h1a2 2 0 002-2V4a2 2 0 00-2-2H8zm6 11V7a2 2 0 00-2-2H8V4h8v9h-2z"/>
					</svg>
					Copy
				</>
			)}
		</button>
	);
}

export default function Home(pageProps: Props) {
	const { applicationName, isAuthenticated } = pageProps;

	return (
		<>
			<Head>
				<title>Hatch JS — A fullstack starter for Express, Inertia &amp; React</title>
				<meta
					name="description"
					content="Hatch JS compresses the complexity of modern web apps. Server-rendered React on top of Express — no API layer, no glue code, no overthinking."
				/>
				<meta property="og:title" content="Hatch JS — A fullstack starter for Express, Inertia & React" />
				<meta
					property="og:description"
					content="Server-rendered React on top of Express. Auth, sessions, ORM, migrations and SSR included."
				/>
				<meta property="og:type" content="website" />
			</Head>

			<div className="min-h-screen bg-white text-gray-900 antialiased">
				{/* Top nav */}
				<header className="border-b border-gray-200">
					<div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
						<Link href="/" className="flex items-center gap-x-2">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-gray-900 text-white text-xs font-bold">
								H
							</span>
							<span className="text-lg font-bold tracking-tight">{applicationName}</span>
						</Link>
						<nav className="flex items-center gap-x-8 text-sm font-semibold text-gray-700">
							<a href="#features" className="hover:text-gray-900">Features</a>
							<a href="#how" className="hover:text-gray-900">How it works</a>
							<a href="#faq" className="hover:text-gray-900">FAQ</a>
							<a
								href="https://github.com/alphaofficial/express-inertia"
								className="hover:text-gray-900"
							>
								GitHub
							</a>
							{!isAuthenticated && (
								<Link href="/login" className="hover:text-gray-900">
									Log in
								</Link>
							)}
						</nav>
					</div>
				</header>

				{/* Hero */}
				<section className="border-b border-gray-200">
					<div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 text-center">
						<span className="inline-flex items-center gap-x-2 rounded-sm border border-gray-300 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
							v0.1 · early preview
						</span>
						<h1 className="mt-8 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
							Compress the complexity
							<br />
							of modern web apps.
						</h1>
						<p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-gray-600">
							Hatch JS is a server-rendered React stack on top of Express. No API layer.
							No fetch glue. No meta-framework. Write controllers, render pages, ship.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-center gap-4">
							{!isAuthenticated ? (
								<Link
									href="/register"
									className="inline-flex items-center justify-center rounded-sm bg-gray-900 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-black"
								>
									Try the sandbox →
								</Link>
							) : (
								<Link
									href="/home"
									className="inline-flex items-center justify-center rounded-sm bg-gray-900 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-black"
								>
									Open the app →
								</Link>
							)}
							<a
								href="https://github.com/alphaofficial/express-inertia"
								className="inline-flex items-center justify-center rounded-sm border border-gray-900 px-5 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-900 hover:text-white"
							>
								View on GitHub
							</a>
						</div>

						<div className="mx-auto mt-12 max-w-3xl text-left">
							<p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
								Install
							</p>
							<div className="mt-2 flex items-center justify-between gap-x-3 rounded-sm border border-gray-900 bg-gray-900 p-4 font-mono text-sm text-gray-100">
								<div className="min-w-0 flex-1 overflow-x-auto">
									<span className="select-none text-gray-500">$ </span>
									<span>{INSTALL_CMD}</span>
								</div>
								<CopyButton text={INSTALL_CMD} />
							</div>
							<p className="mt-2 text-center text-xs text-gray-500">
								Interactive setup. Add <code>--quick my-app</code> for a one-shot scaffold with defaults.
							</p>
							<p className="mt-3 text-center text-xs text-gray-500">
								The login &amp; dashboard on this site are a live sandbox of the included
								auth scaffold — feel free to register and explore.
							</p>
						</div>
					</div>
				</section>

				{/* Big tagline / Optimized for X */}
				<section className="border-b border-gray-200 bg-gray-50">
					<div className="mx-auto max-w-6xl px-6 py-24 text-center">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							Optimized for shipping
						</p>
						<h2 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							The boring stack you already know,
							<br />
							wired for the way you actually build.
						</h2>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
							Express handles the request. Your controller queries the database and calls
							<code className="mx-1 rounded-sm bg-gray-200 px-1.5 py-0.5 text-sm font-mono text-gray-900">res.inertia(...)</code>.
							React renders the page on the server, hydrates on the client, and Inertia takes
							over navigation. That&apos;s the whole loop.
						</p>
					</div>
				</section>

				{/* Code sample */}
				<section className="border-b border-gray-200">
					<div className="mx-auto max-w-6xl px-6 py-24">
						<div className="mx-auto max-w-3xl text-center">
							<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
								Controller → Component
							</p>
							<h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
								Props flow straight from Express to React.
							</h2>
							<p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
								No REST layer. No data-fetching hook. The same object you return from your
								controller arrives as typed props in your page component.
							</p>
						</div>
						<div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
							<div>
								<ul className="space-y-3 text-base text-gray-700">
									<li className="flex gap-x-3">
										<span className="font-bold text-gray-900">→</span>
										Server-side rendered on first load
									</li>
									<li className="flex gap-x-3">
										<span className="font-bold text-gray-900">→</span>
										Type-safe page registry in <code className="text-sm">src/config/pages.ts</code>
									</li>
									<li className="flex gap-x-3">
										<span className="font-bold text-gray-900">→</span>
										Client-side navigation via Inertia, no router setup
									</li>
								</ul>
							</div>
							<div className="rounded-sm border border-gray-900 bg-gray-900 p-6 font-mono text-sm leading-6 text-gray-100 overflow-x-auto">
								<div className="text-gray-500">// src/controllers/PostController.ts</div>
								<div>
									<span className="text-gray-400">export class</span>{' '}
									<span className="text-white">PostController</span>{' '}
									<span className="text-gray-400">extends</span>{' '}
									<span className="text-white">BaseController</span> {'{'}
								</div>
								<div className="pl-4">
									<span className="text-gray-400">static async</span>{' '}
									<span className="text-white">show</span>(req, res) {'{'}
								</div>
								<div className="pl-8">
									<span className="text-gray-400">const</span> post ={' '}
									<span className="text-gray-400">await</span> req.entityManager
								</div>
								<div className="pl-12">
									.findOne(<span className="text-white">Post</span>, {'{'} id: req.params.id {'}'})
								</div>
								<div className="pl-8">
									<span className="text-gray-400">return</span> res.inertia(
									<span className="text-yellow-300">'Post'</span>, {'{'} post {'}'})
								</div>
								<div className="pl-4">{'}'}</div>
								<div>{'}'}</div>
								<div className="mt-4 text-gray-500">// src/views/pages/Post.tsx</div>
								<div>
									<span className="text-gray-400">export default function</span>{' '}
									<span className="text-white">Post</span>({'{ post }'}: Props) {'{'}
								</div>
								<div className="pl-4">
									<span className="text-gray-400">return</span> &lt;article&gt;{'{'}post.title{'}'}&lt;/article&gt;
								</div>
								<div>{'}'}</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features */}
				<section id="features" className="border-b border-gray-200 bg-gray-50">
					<div className="mx-auto max-w-6xl px-6 py-24 text-center">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							Batteries included
						</p>
						<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							Everything wired,
							<br />
							nothing assumed.
						</h2>
						<div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
							{FEATURES.map((f) => (
								<div key={f.title}>
									<h3 className="text-base font-bold text-gray-900">{f.title}</h3>
									<p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600">{f.description}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* How it works */}
				<section id="how" className="border-b border-gray-200">
					<div className="mx-auto max-w-6xl px-6 py-24 text-center">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							How it works
						</p>
						<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							From zero to shipping in three steps.
						</h2>
						<ol className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 text-center">
							{STEPS.map((step, i) => (
								<li key={step.title} className="border-t-2 border-gray-900 pt-6">
									<div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
										Step {i + 1}
									</div>
									<h3 className="mt-2 text-xl font-bold text-gray-900">{step.title}</h3>
									<p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-600">{step.description}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* FAQ */}
				<section id="faq" className="border-b border-gray-200 bg-gray-50">
					<div className="mx-auto max-w-6xl px-6 py-24">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							FAQ
						</p>
						<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							Questions you might be asking.
						</h2>
						<dl className="mt-16 divide-y divide-gray-300">
							{FAQS.map((qa) => (
								<div key={qa.q} className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
									<dt className="text-lg font-bold text-gray-900 lg:col-span-1">{qa.q}</dt>
									<dd className="text-base text-gray-600 lg:col-span-2">{qa.a}</dd>
								</div>
							))}
						</dl>
					</div>
				</section>

				{/* Bottom CTA */}
				<section className="border-b border-gray-200 bg-gray-900 text-white">
					<div className="mx-auto max-w-6xl px-6 py-24 text-center">
						<h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
							Ship something this weekend.
						</h2>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
							No accounts. No telemetry. No signup.
							Just clone, type-check, deploy.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<a
								href="https://github.com/alphaofficial/express-inertia"
								className="inline-flex items-center justify-center rounded-sm bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-100"
							>
								Star on GitHub
							</a>
							<a
								href="https://github.com/alphaofficial/express-inertia#readme"
								className="inline-flex items-center justify-center rounded-sm border border-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-gray-900"
							>
								Read the docs →
							</a>
						</div>
					</div>
				</section>

				<footer className="bg-white">
					<div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-xs text-gray-500">
							&copy; 2025 {applicationName}. Released under the MIT license.
						</p>
						<ul className="flex items-center gap-x-6 text-xs text-gray-500">
							<li>
								<a href="https://github.com/alphaofficial/express-inertia" className="hover:text-gray-900">
									GitHub
								</a>
							</li>
							<li>
								<a href="https://github.com/alphaofficial/express-inertia#readme" className="hover:text-gray-900">
									Docs
								</a>
							</li>
							<li>
								<a href="https://github.com/alphaofficial/express-inertia/issues" className="hover:text-gray-900">
									Issues
								</a>
							</li>
						</ul>
					</div>
				</footer>
			</div>
		</>
	);
}

const FEATURES = [
	{
		title: 'Server-rendered React',
		description:
			'Inertia.js bridges Express controllers and React components. SSR on first load, SPA after.',
	},
	{
		title: 'Auth & sessions',
		description:
			'bcrypt password hashing, DB-backed sessions, guest/auth route guards, helpers on req.',
	},
	{
		title: 'MikroORM with migrations',
		description:
			'EntitySchema mappings (no decorators). SQLite by default, Postgres-ready.',
	},
	{
		title: 'Production hardened',
		description:
			'Helmet, compression, body limits, health probes, graceful shutdown, structured logs.',
	},
	{
		title: 'Type-safe pages',
		description:
			'Page names live in src/config/pages.ts. The compiler catches every typo before deploy.',
	},
	{
		title: 'Vite + Tailwind',
		description:
			'Fast HMR in dev, optimized client bundle in prod. Tailwind 3 utility-first styling.',
	},
	{
		title: 'Configurable rate limiting',
		description:
			'Opt-in per-IP limiter on auth routes. Off by default, env-driven, edge-friendly.',
	},
	{
		title: 'XSS-safe page props',
		description:
			'Inertia props are HTML-attribute escaped end-to-end. Untrusted data is safe by default.',
	},
	{
		title: 'Zod env validation',
		description:
			'Boot fails fast on missing or malformed env vars. No silent production drift.',
	},
];

const STEPS = [
	{
		title: 'Install',
		description:
			'One curl command. The installer prompts for a name and database, generates a session secret, and runs migrations.',
	},
	{
		title: 'Define a route',
		description:
			'Add a controller and call res.inertia(\u2018Page\u2019, props). No JSON endpoints, no client-side data fetching.',
	},
	{
		title: 'Render React',
		description:
			'Drop a TSX file in src/views/pages. Props arrive type-safe, the page is server-rendered, Inertia handles the rest.',
	},
];

const FAQS = [
	{
		q: 'Why not Next.js?',
		a: 'Next is great when you want a meta-framework. Hatch JS is for teams who already know Express, want full control of the request lifecycle, and would rather render React from a controller than learn another router.',
	},
	{
		q: 'Can I use Postgres?',
		a: 'Yes. The Postgres MikroORM driver ships with the starter — switch the driver in src/database/orm.config.ts and set DATABASE_URL. The installer also asks during scaffold.',
	},
	{
		q: 'Is this production-ready?',
		a: 'It ships with helmet, compression, health probes, graceful shutdown, structured logging, body-size limits, and an opt-in rate limiter. Add your features and deploy.',
	},
	{
		q: 'Where do I deploy?',
		a: 'Anywhere that runs Node 20+. Fly.io, Railway, Render, a plain VPS, Docker — your call. Point liveness at /healthz and readiness at /readyz.',
	},
];
