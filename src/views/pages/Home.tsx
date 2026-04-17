import { Head, Link } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
import IDEMockup from '../components/IDEMockup';

interface Props {
	applicationName: string;
	auth?: any;
	isAuthenticated?: boolean;
}

const INSTALL_CMD =
	'curl -fsSL https://raw.githubusercontent.com/alphaofficial/theboringarchitecture/main/install.sh | bash';

const GITHUB_URL = 'https://github.com/alphaofficial/theboringarchitecture';

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
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
			className="inline-flex shrink-0 items-center gap-x-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
		>
			{copied ? (
				<>
					<svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
	{ label: 'Express route', detail: 'GET /posts/:id' },
	{ label: 'Controller', detail: 'res.inertia("Post", props)' },
	{ label: 'React page', detail: 'SSR first, hydrated after' },
];

function HeroArchitectureIllustration() {
	return (
		<figure
			aria-labelledby="hero-architecture-title"
			className="rounded-xl border border-slate-200 bg-slate-50 p-5"
			data-testid="hero-architecture-flow"
		>
			<figcaption id="hero-architecture-title" className="text-xs font-semibold uppercase tracking-widest text-slate-500">
				Request-to-page flow
			</figcaption>
			<div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
				{HERO_FLOW.map((stage, index) => (
					<div
						key={stage.label}
						className="relative flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
					>
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
							{index + 1}
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-bold text-slate-900">{stage.label}</span>
							<span className="mt-0.5 block break-words font-mono text-xs leading-5 text-slate-500">{stage.detail}</span>
						</span>
						{index < HERO_FLOW.length - 1 && (
							<span aria-hidden="true" className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 sm:inline">
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h9M8 3.5L11 7l-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
							</span>
						)}
					</div>
				))}
			</div>
		</figure>
	);
}

function CodeBlock({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950">
			<div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
				<span className="font-mono text-[11px] text-slate-400">{label}</span>
				<div className="flex gap-1.5" aria-hidden="true">
					<span className="h-2 w-2 rounded-full bg-slate-700" />
					<span className="h-2 w-2 rounded-full bg-slate-700" />
					<span className="h-2 w-2 rounded-full bg-slate-700" />
				</div>
			</div>
			<div className="overflow-x-auto p-4 font-mono text-sm leading-7 text-slate-100">
				{children}
			</div>
		</div>
	);
}

function StepArrow() {
	return (
		<div className="flex justify-center py-5" aria-hidden="true">
			<div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
				<svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M12 5v14" />
					<path d="M5 12l7 7 7-7" />
				</svg>
			</div>
		</div>
	);
}

export default function Home(pageProps: Props) {
	const { applicationName, isAuthenticated } = pageProps;
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			<Head>
				<title>The Boring Architecture — A fullstack framework for Express, Inertia &amp; React</title>
				<meta
					name="description"
					content="Boring until complexity forces otherwise. Server-rendered React on top of Express — no API layer, no glue code, no meta-framework detour."
				/>
				<meta property="og:title" content="The Boring Architecture — A fullstack framework for Express, Inertia & React" />
				<meta
					property="og:description"
					content="Server-rendered React on top of Express. Auth, sessions, ORM, migrations and SSR included."
				/>
				<meta property="og:type" content="website" />
			</Head>

			<div className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased">
				{/* Nav */}
				<header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
					<div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
						<Link href="/" className="flex items-center gap-x-2.5" data-testid="site-logo">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-sm font-black text-white">
								T
							</span>
							<span className="text-lg font-bold tracking-tight text-slate-900">{applicationName}</span>
						</Link>
						<nav className="hidden md:flex items-center gap-x-8 text-sm font-medium text-slate-500" data-testid="desktop-nav">
							<a href="#features" className="transition-colors hover:text-slate-900">Features</a>
							<a href="#how" className="transition-colors hover:text-slate-900">How it works</a>

							<a href={GITHUB_URL} className="transition-colors hover:text-slate-900">GitHub</a>
							{!isAuthenticated && (
								<Link href="/login" className="transition-colors hover:text-slate-900">Log in</Link>
							)}
						</nav>
						<button
							type="button"
							className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-expanded={mobileMenuOpen}
							aria-label="Toggle navigation menu"
							data-testid="mobile-menu-button"
						>
							{mobileMenuOpen ? (
								<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
							) : (
								<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
							)}
						</button>
					</div>
					{mobileMenuOpen && (
						<nav className="md:hidden border-t border-slate-200 bg-white px-6 py-4" data-testid="mobile-nav">
							<div className="flex flex-col gap-y-4 text-sm font-medium text-slate-600">
								<a href="#features" className="hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Features</a>
								<a href="#how" className="hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>How it works</a>

								<a href={GITHUB_URL} className="hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>GitHub</a>
								{!isAuthenticated && (
									<Link href="/login" className="hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
								)}
							</div>
						</nav>
					)}
				</header>

				{/* Hero */}
				<section data-testid="hero-section">
					<div className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-24 text-center">
						<h1 className="text-[2.75rem] font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
							The boring{' '}
							<span className="text-rose-500">architecture.</span>
						</h1>
						<p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-500 sm:text-xl">
							Express handles routing, React renders the views, Inertia connects the two. That&apos;s it.
						</p>

						<div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center" data-testid="hero-cta-group">
							<a
								href={GITHUB_URL}
								className="group inline-flex min-h-12 items-center justify-center gap-x-2 rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:shadow-rose-500/30"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
									<path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2z" clipRule="evenodd"/>
								</svg>
								View on GitHub
							</a>
						</div>
					</div>

					{/* Install terminal — full width below hero text */}
					<div className="mx-auto max-w-6xl px-5 pb-20 sm:px-6 sm:pb-24" data-testid="install-card">
						<div className="overflow-hidden rounded-xl bg-slate-950 shadow-2xl shadow-slate-900/20">
							<div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
								<div className="flex items-center gap-x-3">
									<div className="flex gap-1.5" aria-hidden="true">
										<span className="h-3 w-3 rounded-full bg-rose-500/70" />
										<span className="h-3 w-3 rounded-full bg-amber-500/70" />
										<span className="h-3 w-3 rounded-full bg-emerald-500/70" />
									</div>
									<span className="text-sm font-bold text-white">Install in one command</span>
								</div>
								<CopyButton text={INSTALL_CMD} />
							</div>
							<div className="p-5">
								<div className="overflow-x-auto rounded-lg bg-black p-4 font-mono text-sm">
									<span className="select-none text-rose-400">$ </span>
									<span className="text-slate-100">{INSTALL_CMD}</span>
								</div>
								<p className="mt-4 text-sm leading-6 text-slate-400">
									Interactive setup for app name, database, session secret, and migrations. Add{' '}
									<code className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-white">--quick my-app</code>{' '}
									for defaults.
								</p>
							</div>
						</div>
					</div>

					{/* Architecture flow — kept for test compat, visually hidden */}
					<div className="sr-only">
						<HeroArchitectureIllustration />
					</div>
				</section>

				{/* Features */}
				<section id="features" className="border-t border-slate-200 bg-white" data-testid="features-section">
					<div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-32">
						<div className="mx-auto max-w-3xl text-center">
							<h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
								Batteries included.
							</h2>
							<p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
								Everything you need to ship a production app, wired up and ready to go.
							</p>
						</div>
						<div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map((f) => (
								<div
									key={f.title}
									className="group flex gap-x-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-rose-200 hover:bg-rose-50/40"
								>
									<span className="shrink-0">
										<FeatureIcon name={f.icon} />
									</span>
									<div className="min-w-0">
										<h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
										<p className="mt-1.5 text-sm leading-6 text-slate-500">{f.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Get started */}
				<section id="how" className="border-t border-slate-200 bg-slate-50/50" data-testid="how-it-works-section">
					<div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-32">
						<div className="mx-auto max-w-3xl text-center">
							<h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
								From zero to shipping in three steps.
							</h2>
						</div>

						<div className="hidden md:block">
							<IDEMockup />
						</div>

						<div className="mx-auto mt-16 max-w-6xl">
							{STEPS.map((step, i) => (
								<div key={step.title} className={`flex gap-6 ${i > 0 ? 'mt-10 border-t border-slate-200 pt-10' : ''}`}>
									<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-sm font-bold text-white">
										{i + 1}
									</span>
									<div>
										<h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
										<p className="mt-2 text-base leading-7 text-slate-500">{step.description}</p>
										{step.code && (
											<div className="mt-4 flex items-center gap-3 overflow-hidden rounded-xl bg-slate-950">
												<div className="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-sm leading-7 text-slate-100">
													<span className="select-none text-rose-400">$ </span>
													<span>{step.code}</span>
												</div>
												<div className="shrink-0 pr-4">
													<CopyButton text={step.code} />
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Bottom CTA */}
				<section className="border-t border-slate-200 bg-slate-950 text-white" data-testid="bottom-cta-section">
					<div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-32 text-center">
						<h2 className="text-4xl font-black tracking-tight sm:text-6xl">
							Ship something this weekend.
						</h2>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
							No accounts. No telemetry. No signup. Install, develop, deploy.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<a
								href={GITHUB_URL}
								className="inline-flex items-center justify-center gap-x-2 rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-600"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
									<path d="M12 .5l3.09 6.26L22 7.77l-5 4.87L18.18 20 12 16.77 5.82 20 7 12.64 2 7.77l6.91-1.01L12 .5z" />
								</svg>
								Star on GitHub
							</a>
							<a
								href={`${GITHUB_URL}#readme`}
								className="inline-flex items-center justify-center gap-x-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-slate-500 hover:bg-slate-900"
							>
								Read the docs &rarr;
							</a>
						</div>
					</div>
				</section>

				<footer className="border-t border-slate-200 bg-white">
					<div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-xs text-slate-400">
							&copy; 2025 {applicationName}. MIT licensed.
						</p>
						<ul className="flex items-center gap-x-6 text-xs text-slate-400">
							<li><a href={GITHUB_URL} className="transition-colors hover:text-slate-900">GitHub</a></li>
							<li><a href={`${GITHUB_URL}#readme`} className="transition-colors hover:text-slate-900">Docs</a></li>
							<li><a href={`${GITHUB_URL}/issues`} className="transition-colors hover:text-slate-900">Issues</a></li>
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
				<path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
			</svg>
		),
		shield: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
		),
		database: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5" /><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
			</svg>
		),
		queue: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
			</svg>
		),
		mail: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" />
			</svg>
		),
		clock: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
			</svg>
		),
		signal: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
		),
		cache: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
			</svg>
		),
		folder: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" />
			</svg>
		),
		lock: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
			</svg>
		),
		code: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" />
			</svg>
		),
		wind: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M9.59 4.59A2 2 0 1111 8H2" /><path d="M12.59 19.41A2 2 0 1014 16H2" /><path d="M17.73 7.73A2.5 2.5 0 1119.5 12H2" />
			</svg>
		),
		gauge: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 12l4-8" /><circle cx="12" cy="12" r="10" /><path d="M4.93 7h14.14" />
			</svg>
		),
		check: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
			</svg>
		),
		validate: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
				<circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
			</svg>
		),
	};

	return (
		<span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-rose-500 transition-colors group-hover:border-rose-200 group-hover:bg-rose-50">
			{icons[name] ?? null}
		</span>
	);
}

const FEATURES = [
	{ title: 'Server-side rendering', description: 'Pages render on the server first, then hydrate into a full SPA. Fast initial loads, smooth navigation after.', icon: 'react' },
	{ title: 'Authentication', description: 'Registration, login, forgot password, password reset, and email verification — wired and ready to extend.', icon: 'shield' },
	{ title: 'Database & ORM', description: 'Schema-first mappings with migrations. SQLite by default, Postgres when you need it.', icon: 'database' },
	{ title: 'Background jobs', description: 'Dispatch async work and run it in a separate process. No external queue service required.', icon: 'queue' },
	{ title: 'Mailer', description: 'Send transactional email out of the box. Log driver for dev, SMTP for production, pluggable for anything else.', icon: 'mail' },
	{ title: 'Task scheduling', description: 'Cron-style recurring jobs. Define them in code, run them with one command.', icon: 'clock' },
	{ title: 'Event bus', description: 'Type-safe in-process events. Decouple your features without adding infrastructure.', icon: 'signal' },
	{ title: 'Cache', description: 'Simple key-value store. In-memory by default, pluggable for Redis or anything else.', icon: 'cache' },
	{ title: 'File storage', description: 'Store and retrieve files with a clean API. Local, memory, and S3 drivers included.', icon: 'folder' },
	{ title: 'Production hardened', description: 'Security headers, graceful shutdown, health probes, structured logs, body limits.', icon: 'lock' },
	{ title: 'Type safety', description: 'Page names checked at compile time. Props flow from controller to component with full type coverage.', icon: 'code' },
	{ title: 'Fast tooling', description: 'Hot module replacement in dev, optimized bundles in production. No waiting around.', icon: 'wind' },
	{ title: 'Rate limiting', description: 'Opt-in per-route throttling. Off by default, env-configured, ready for production.', icon: 'gauge' },
	{ title: 'XSS protection', description: 'Page props are HTML-escaped end-to-end. Untrusted data is safe by default.', icon: 'check' },
	{ title: 'AI ready', description: 'Opinionated structure means AI assistants follow conventions instead of guessing. Less correction, more shipping.', icon: 'validate' },
];

const STEPS: { title: string; description: string; code?: string }[] = [
	{ title: 'Install', description: 'One command scaffolds a full project — database, auth, sessions, migrations, and dev server.', code: 'curl -fsSL https://raw.githubusercontent.com/alphaofficial/theboringarchitecture/main/install.sh | bash' },
	{ title: 'Develop', description: 'Write controllers, models, and React pages with the same patterns you already know. MVC with TypeScript end-to-end.' },
	{ title: 'Ship it', description: 'Your page is server-rendered, type-safe, and ready for production. Deploy anywhere Node runs.' },
];

