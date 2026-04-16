import { Head, Link } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

interface Props {
	applicationName: string;
	auth?: any;
	isAuthenticated?: boolean;
}

const INSTALL_CMD =
	'curl -fsSL https://raw.githubusercontent.com/alphaofficial/theboringarchitecture/main/install.sh | bash';

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
			className="inline-flex shrink-0 items-center gap-x-1.5 rounded-sm border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
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

const HERO_FLOW = [
	{
		label: 'Express route',
		detail: 'GET /posts/:id',
	},
	{
		label: 'Controller',
		detail: 'res.inertia("Post", props)',
	},
	{
		label: 'React page',
		detail: 'SSR first, hydrated after',
	},
];

function HeroArchitectureIllustration() {
	return (
		<figure
			aria-labelledby="hero-architecture-title"
			className="mt-5 rounded-sm border border-gray-200 bg-gray-50 p-4"
			data-testid="hero-architecture-flow"
		>
			<figcaption id="hero-architecture-title" className="text-sm font-bold text-gray-950">
				Request-to-page flow
			</figcaption>
			<svg className="mt-4 h-14 w-full text-gray-900" viewBox="0 0 360 72" fill="none" aria-hidden="true">
				<path d="M44 36H151" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M150 36L140 30V42L150 36Z" fill="currentColor" />
				<path d="M208 36H315" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M314 36L304 30V42L314 36Z" fill="currentColor" />
				<rect x="8" y="16" width="56" height="40" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
				<rect x="152" y="16" width="56" height="40" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
				<rect x="296" y="16" width="56" height="40" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
				<path d="M22 30H50M22 42H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M166 29H194M166 37H186M166 45H194" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M310 28L324 36L310 44M338 28L324 36L338 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<div className="mt-4 grid gap-2">
				{HERO_FLOW.map((stage, index) => (
					<div
						key={stage.label}
						className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 rounded-sm border border-gray-200 bg-white p-3"
					>
						<span className="flex h-7 w-7 items-center justify-center rounded-sm bg-gray-900 text-xs font-bold text-white">
							{index + 1}
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-bold text-gray-950">{stage.label}</span>
							<span className="mt-0.5 block break-words font-mono text-xs leading-5 text-gray-600">{stage.detail}</span>
						</span>
					</div>
				))}
			</div>
		</figure>
	);
}

function HowItWorksPipeline() {
	return (
		<figure
			aria-labelledby="how-it-works-pipeline-title"
			className="mt-16 rounded-sm border border-gray-200 bg-white p-6"
			data-testid="how-it-works-pipeline"
		>
			<figcaption id="how-it-works-pipeline-title" className="sr-only">
				From install to running app in three steps
			</figcaption>
			<svg
				className="mx-auto h-20 w-full max-w-3xl text-gray-900"
				viewBox="0 0 640 80"
				fill="none"
				aria-hidden="true"
			>
				<rect x="16" y="10" width="168" height="60" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
				<text x="100" y="34" textAnchor="middle" className="text-[11px] font-bold" fill="currentColor">
					Install
				</text>
				<text x="100" y="52" textAnchor="middle" className="text-[9px]" fill="currentColor" opacity="0.6">
					curl + setup
				</text>
				<path d="M184 40H230" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M228 40L220 34V46L228 40Z" fill="currentColor" />

				<rect x="232" y="10" width="176" height="60" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
				<text x="320" y="34" textAnchor="middle" className="text-[11px] font-bold" fill="currentColor">
					Define routes
				</text>
				<text x="320" y="52" textAnchor="middle" className="text-[9px]" fill="currentColor" opacity="0.6">
					res.inertia(...)
				</text>
				<path d="M408 40H454" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M452 40L444 34V46L452 40Z" fill="currentColor" />

				<rect x="456" y="10" width="168" height="60" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
				<text x="540" y="34" textAnchor="middle" className="text-[11px] font-bold" fill="currentColor">
					Render React
				</text>
				<text x="540" y="52" textAnchor="middle" className="text-[9px]" fill="currentColor" opacity="0.6">
					SSR + SPA
				</text>

				<rect x="8" y="4" width="624" height="72" rx="4" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.15" />
			</svg>
		</figure>
	);
}

export default function Home(pageProps: Props) {
	const { applicationName, isAuthenticated } = pageProps;
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			<Head>
				<title>The Boring Architecture — A fullstack starter for Express, Inertia &amp; React</title>
				<meta
					name="description"
					content="The Boring Architecture compresses the complexity of modern web apps. Server-rendered React on top of Express — no API layer, no glue code, no overthinking."
				/>
				<meta property="og:title" content="The Boring Architecture — A fullstack starter for Express, Inertia & React" />
				<meta
					property="og:description"
					content="Server-rendered React on top of Express. Auth, sessions, ORM, migrations and SSR included."
				/>
				<meta property="og:type" content="website" />
			</Head>

			<div className="min-h-screen overflow-x-hidden bg-white text-gray-900 antialiased">
				{/* Top nav */}
				<header className="border-b border-gray-200">
					<div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
						<Link href="/" className="flex items-center gap-x-2" data-testid="site-logo">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-gray-900 text-white text-xs font-bold">
								T
							</span>
							<span className="text-lg font-bold tracking-tight">{applicationName}</span>
						</Link>
						<nav className="hidden md:flex items-center gap-x-8 text-sm font-semibold text-gray-700" data-testid="desktop-nav">
							<a href="#features" className="hover:text-gray-900">Features</a>
							<a href="#how" className="hover:text-gray-900">How it works</a>
							<a href="#faq" className="hover:text-gray-900">FAQ</a>
							<a
								href="https://github.com/alphaofficial/theboringarchitecture"
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
						<button
							type="button"
							className="md:hidden inline-flex items-center justify-center rounded-sm p-2 text-gray-700 hover:bg-gray-100"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-expanded={mobileMenuOpen}
							aria-label="Toggle navigation menu"
							data-testid="mobile-menu-button"
						>
							{mobileMenuOpen ? (
								<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
									<path d="M6 18L18 6M6 6l12 12" />
								</svg>
							) : (
								<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
									<path d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							)}
						</button>
					</div>
					{mobileMenuOpen && (
						<nav className="md:hidden border-t border-gray-200 bg-white px-6 py-4" data-testid="mobile-nav">
							<div className="flex flex-col gap-y-4 text-sm font-semibold text-gray-700">
								<a href="#features" className="hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Features</a>
								<a href="#how" className="hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>How it works</a>
								<a href="#faq" className="hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
								<a
									href="https://github.com/alphaofficial/theboringarchitecture"
									className="hover:text-gray-900"
									onClick={() => setMobileMenuOpen(false)}
								>
									GitHub
								</a>
								{!isAuthenticated && (
									<Link href="/login" className="hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
										Log in
									</Link>
								)}
							</div>
						</nav>
					)}
				</header>

				{/* Hero */}
				<section className="border-b border-gray-200 bg-gray-50" data-testid="hero-section">
					<div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:items-center lg:py-28">
						<div>
							<span className="inline-flex items-center gap-x-2 rounded-sm border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
								v0.1 early preview
							</span>
							<h1 className="mt-7 max-w-4xl text-5xl font-extrabold leading-none text-gray-950 sm:text-6xl lg:text-7xl">
								Express controllers. Inertia pages. React without the API tax.
							</h1>
							<p className="mt-7 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
								The Boring Architecture keeps the request lifecycle in Express while React renders the page.
								No REST layer, no fetch glue, no meta-framework detour.
							</p>

							<div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" data-testid="hero-cta-group">
								{!isAuthenticated ? (
									<Link
										href="/register"
										className="inline-flex min-h-12 items-center justify-center rounded-sm bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-black"
									>
										Try the sandbox
									</Link>
								) : (
									<Link
										href="/home"
										className="inline-flex min-h-12 items-center justify-center rounded-sm bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-black"
									>
										Open the app
									</Link>
								)}
								<a
									href="https://github.com/alphaofficial/theboringarchitecture"
									className="inline-flex min-h-12 items-center justify-center rounded-sm border border-gray-950 bg-white px-5 py-3 text-sm font-bold text-gray-950 hover:bg-gray-950 hover:text-white"
								>
									View on GitHub
								</a>
							</div>

							<div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-3" data-testid="hero-stats">
								<div className="border-l-2 border-gray-900 pl-3">
									<span className="block font-bold text-gray-950">SSR first load</span>
									<span>Hydrated after render</span>
								</div>
								<div className="border-l-2 border-gray-900 pl-3">
									<span className="block font-bold text-gray-950">Auth included</span>
									<span>Live sandbox ready</span>
								</div>
								<div className="border-l-2 border-gray-900 pl-3">
									<span className="block font-bold text-gray-950">Typed pages</span>
									<span>Compile-time names</span>
								</div>
							</div>
						</div>

						<div className="rounded-sm border border-gray-900 bg-white p-3 sm:p-4 shadow-[8px_8px_0_0_#111827]" data-testid="install-card">
							<div className="rounded-sm bg-gray-950 p-4 text-gray-100">
								<div className="flex items-center justify-between border-b border-gray-800 pb-3">
									<p className="text-sm font-bold text-white">Install in one command</p>
									<div className="flex gap-1.5" aria-hidden="true">
										<span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
										<span className="h-2.5 w-2.5 rounded-full bg-gray-500" />
										<span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
									</div>
								</div>
								<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
									<div className="min-w-0 flex-1 overflow-x-auto rounded-sm border border-gray-800 bg-black p-3 font-mono text-sm">
										<span className="select-none text-gray-500">$ </span>
										<span>{INSTALL_CMD}</span>
									</div>
									<CopyButton text={INSTALL_CMD} />
								</div>
								<p className="mt-4 text-sm leading-6 text-gray-300">
									Interactive setup for app name, database, session secret, and migrations. Add{' '}
									<code className="rounded-sm bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-white">--quick my-app</code>{' '}
									for defaults.
								</p>
							</div>
							<p className="px-2 pt-4 text-sm leading-6 text-gray-600">
								The login and dashboard on this site are a live sandbox of the included auth scaffold.
							</p>
							<HeroArchitectureIllustration />
						</div>
					</div>
				</section>

				{/* Big tagline / Optimized for X */}
				<section className="border-b border-gray-200 bg-gray-50">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 text-center">
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

			{/* Workflow / Controller → Component */}
			<section className="border-b border-gray-200" data-testid="workflow-section">
				<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
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
					<div className="mt-16 space-y-0">
						{/* Step 1: Route */}
						<div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12">
							<div className="flex gap-x-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gray-900 text-sm font-bold text-white">
									1
								</span>
								<div>
									<h3 className="text-lg font-bold text-gray-900">Define a route</h3>
									<p className="mt-1 text-sm text-gray-600">
										Map an Express path to a controller method. No API boilerplate needed.
									</p>
								</div>
							</div>
							<div className="rounded-sm border border-gray-900 bg-gray-900 p-4 font-mono text-sm leading-6 text-gray-100 overflow-x-auto">
								<div className="text-gray-500">// src/routes/index.ts</div>
								<div><span className="text-gray-400">import</span> {'{'} PostController {'}'} <span className="text-gray-400">from</span> <span className="text-yellow-300">&apos;../controllers/PostController&apos;</span></div>
								<div className="mt-1"><span className="text-gray-400">router</span>.<span className="text-white">get</span>(<span className="text-yellow-300">&apos;/posts/:id&apos;</span>, PostController.show)</div>
							</div>
						</div>

						<div className="flex justify-center py-4" aria-hidden="true">
							<svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 5v14" />
								<path d="M5 12l7 7 7-7" />
							</svg>
						</div>

						{/* Step 2: Controller */}
						<div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12">
							<div className="flex gap-x-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gray-900 text-sm font-bold text-white">
									2
								</span>
								<div>
									<h3 className="text-lg font-bold text-gray-900">Call res.inertia()</h3>
									<p className="mt-1 text-sm text-gray-600">
										Your controller queries the database and passes props directly. No serialization, no DTO.
									</p>
								</div>
							</div>
							<div className="rounded-sm border border-gray-900 bg-gray-900 p-4 font-mono text-sm leading-6 text-gray-100 overflow-x-auto">
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
									<span className="text-yellow-300">&apos;Post&apos;</span>, {'{'} post {'}'})
								</div>
								<div className="pl-4">{'}'}</div>
								<div>{'}'}</div>
							</div>
						</div>

						<div className="flex justify-center py-4" aria-hidden="true">
							<svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 5v14" />
								<path d="M5 12l7 7 7-7" />
							</svg>
						</div>

						{/* Step 3: React page */}
						<div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12">
							<div className="flex gap-x-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gray-900 text-sm font-bold text-white">
									3
								</span>
								<div>
									<h3 className="text-lg font-bold text-gray-900">React renders the page</h3>
									<p className="mt-1 text-sm text-gray-600">
										Props arrive type-safe. Server-rendered on first load, SPA navigation after that.
									</p>
									<ul className="mt-3 space-y-2 text-sm text-gray-700">
										<li className="flex gap-x-2">
											<span className="font-bold text-gray-900">&rarr;</span>
											Server-side rendered on first load
										</li>
										<li className="flex gap-x-2">
											<span className="font-bold text-gray-900">&rarr;</span>
											Type-safe page registry in <code className="text-xs">src/config/pages.ts</code>
										</li>
										<li className="flex gap-x-2">
											<span className="font-bold text-gray-900">&rarr;</span>
											Client-side navigation via Inertia, no router setup
										</li>
									</ul>
								</div>
							</div>
							<div className="rounded-sm border border-gray-900 bg-gray-900 p-4 font-mono text-sm leading-6 text-gray-100 overflow-x-auto">
								<div className="text-gray-500">// src/views/pages/Post.tsx</div>
								<div>
									<span className="text-gray-400">interface</span> <span className="text-white">Props</span> {'{'}
								</div>
								<div className="pl-4">
									<span className="text-white">post</span>: {'{'} id: <span className="text-white">string</span>; title: <span className="text-white">string</span> {'}'}
								</div>
								<div>{'}'}</div>
								<div className="mt-1">
									<span className="text-gray-400">export default function</span>{' '}
									<span className="text-white">Post</span>({'{ post }'}: <span className="text-white">Props</span>) {'{'}
								</div>
								<div className="pl-4">
									<span className="text-gray-400">return</span> &lt;article&gt;{'{'}post.title{'}'}&lt;/article&gt;
								</div>
								<div>{'}'}</div>
							</div>
						</div>
					</div>
				</div>
			</section>

				{/* Features */}
				<section id="features" className="border-b border-gray-200 bg-gray-50" data-testid="features-section">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 text-center">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							Batteries included
						</p>
						<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							Everything wired,
							<br />
							nothing assumed.
						</h2>
						<div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 text-left">
							{FEATURES.map((f) => (
								<div key={f.title} className="flex gap-x-3">
									<span className="shrink-0">
										<FeatureIcon name={f.icon} />
									</span>
									<div>
										<h3 className="text-base font-bold text-gray-900">{f.title}</h3>
										<p className="mt-2 text-sm leading-6 text-gray-600">{f.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* How it works */}
				<section id="how" className="border-b border-gray-200" data-testid="how-it-works-section">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 text-center">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							How it works
						</p>
						<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							From zero to shipping in three steps.
						</h2>

						<div className="hidden md:block">
							<HowItWorksPipeline />
						</div>

						<ol className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 text-center">
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
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
						<div className="text-center">
							<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
								FAQ
							</p>
							<h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
								Questions you might be asking.
							</h2>
						</div>
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
				<section className="border-b border-gray-200 bg-gray-900 text-white" data-testid="bottom-cta-section">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 text-center">
						<h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
							Ship something this weekend.
						</h2>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
							No accounts. No telemetry. No signup.
							Just clone, type-check, deploy.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<a
								href="https://github.com/alphaofficial/theboringarchitecture"
								className="inline-flex items-center justify-center rounded-sm bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-100"
							>
								Star on GitHub
							</a>
							<a
								href="https://github.com/alphaofficial/theboringarchitecture#readme"
								className="inline-flex items-center justify-center rounded-sm border border-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-gray-900"
							>
								Read the docs →
							</a>
						</div>
					</div>
				</section>

				<footer className="bg-white">
					<div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-xs text-gray-500">
							&copy; 2025 {applicationName}. Released under the MIT license.
						</p>
						<ul className="flex items-center gap-x-6 text-xs text-gray-500">
							<li>
								<a href="https://github.com/alphaofficial/theboringarchitecture" className="hover:text-gray-900">
									GitHub
								</a>
							</li>
							<li>
								<a href="https://github.com/alphaofficial/theboringarchitecture#readme" className="hover:text-gray-900">
									Docs
								</a>
							</li>
							<li>
								<a href="https://github.com/alphaofficial/theboringarchitecture/issues" className="hover:text-gray-900">
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

function FeatureIcon({ name }: { name: string }) {
	const icons: Record<string, ReactNode> = {
		react: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 2L2 7l10 5 10-5-10-5z" />
				<path d="M2 17l10 5 10-5" />
				<path d="M2 12l10 5 10-5" />
			</svg>
		),
		shield: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
		),
		database: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<ellipse cx="12" cy="5" rx="9" ry="3" />
				<path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5" />
				<path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
			</svg>
		),
		queue: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
			</svg>
		),
		mail: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="2" y="4" width="20" height="16" rx="2" />
				<path d="M22 4l-10 8L2 4" />
			</svg>
		),
		clock: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 6v6l4 2" />
			</svg>
		),
		signal: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
		),
		cache: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="4" y="2" width="16" height="20" rx="2" />
				<line x1="8" y1="6" x2="16" y2="6" />
				<line x1="8" y1="10" x2="16" y2="10" />
			</svg>
		),
		folder: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" />
			</svg>
		),
		lock: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="3" y="11" width="18" height="11" rx="2" />
				<path d="M7 11V7a5 5 0 0110 0v4" />
			</svg>
		),
		code: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M16 18l6-6-6-6" />
				<path d="M8 6l-6 6 6 6" />
			</svg>
		),
		wind: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M9.59 4.59A2 2 0 1111 8H2" />
				<path d="M12.59 19.41A2 2 0 1014 16H2" />
				<path d="M17.73 7.73A2.5 2.5 0 1119.5 12H2" />
			</svg>
		),
		gauge: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 12l4-8" />
				<circle cx="12" cy="12" r="10" />
				<path d="M4.93 7h14.14" />
			</svg>
		),
		check: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				<path d="M9 12l2 2 4-4" />
			</svg>
		),
		validate: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<circle cx="12" cy="12" r="10" />
				<path d="M9 12l2 2 4-4" />
			</svg>
		),
	};

	return (
		<span className="flex h-9 w-9 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-700">
			{icons[name] ?? null}
		</span>
	);
}

const FEATURES = [
	{
		title: 'Server-rendered React',
		description:
			'Inertia.js bridges Express controllers and React components. SSR on first load, SPA after.',
		icon: 'react',
	},
	{
		title: 'Complete auth flows',
		description:
			'Registration, login, forgot password, password reset, and email verification — all wired up and ready to extend.',
		icon: 'shield',
	},
	{
		title: 'MikroORM with migrations',
		description:
			'EntitySchema mappings (no decorators). SQLite by default, Postgres-ready.',
		icon: 'database',
	},
	{
		title: 'Background Queue',
		description:
			'Graphile Worker-powered job queue. Dispatch jobs with Queue.dispatch() and run workers with npm run work.',
		icon: 'queue',
	},
	{
		title: 'Mailer',
		description:
			'Send email with Mailer.send(). Ships with log and SMTP drivers. Register custom drivers for any provider.',
		icon: 'mail',
	},
	{
		title: 'Task Scheduler',
		description:
			'Cron-style task scheduling via node-cron. Register jobs with Scheduler.schedule() and start with npm run scheduler.',
		icon: 'clock',
	},
	{
		title: 'Typed Event Bus',
		description:
			'In-process events with Emitter.on() / Emitter.emit(). Extend AppEvents for fully type-safe custom events.',
		icon: 'signal',
	},
	{
		title: 'Cache',
		description:
			'Simple key-value cache with get / set / delete / flush. In-memory driver included; pluggable for Redis.',
		icon: 'cache',
	},
	{
		title: 'File Storage',
		description:
			'Store and retrieve files with Storage.put() / get() / url(). Local disk and memory drivers included.',
		icon: 'folder',
	},
	{
		title: 'Production hardened',
		description:
			'Helmet, compression, body limits, health probes, graceful shutdown, structured logs.',
		icon: 'lock',
	},
	{
		title: 'Type-safe pages',
		description:
			'Page names live in src/config/pages.ts. The compiler catches every typo before deploy.',
		icon: 'code',
	},
	{
		title: 'Vite + Tailwind',
		description:
			'Fast HMR in dev, optimized client bundle in prod. Tailwind 3 utility-first styling.',
		icon: 'wind',
	},
	{
		title: 'Configurable rate limiting',
		description:
			'Opt-in per-IP limiter on auth routes. Off by default, env-driven, edge-friendly.',
		icon: 'gauge',
	},
	{
		title: 'XSS-safe page props',
		description:
			'Inertia props are HTML-attribute escaped end-to-end. Untrusted data is safe by default.',
		icon: 'check',
	},
	{
		title: 'Zod env validation',
		description:
			'Boot fails fast on missing or malformed env vars. No silent production drift.',
		icon: 'validate',
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
		a: 'Next is great when you want a meta-framework. The Boring Architecture is for teams who already know Express, want full control of the request lifecycle, and would rather render React from a controller than learn another router.',
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
