import { Head, Link } from '@inertiajs/react';

interface Props {
	applicationName: string;
	message?: string;
	timestamp?: string;
	auth?: any;
	isAuthenticated?: boolean;
}

export default function Home(pageProps: Props) {
	const { applicationName, isAuthenticated } = pageProps;
	return (
		<>
			<Head title="Express Inertia - Modern Web Development" />
			<div className="min-h-screen bg-white">
				<header className="absolute inset-x-0 top-0 z-50">
					<div className="mx-auto max-w-2xl lg:max-w-4xl">
						<nav className="flex items-center justify-between py-6" aria-label="Global">
							<div>
								<Link href="/">
									<span className="text-xl font-bold text-gray-900">{applicationName}</span>
								</Link>
							</div>
							{!isAuthenticated ? (
								<div>
									<Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
										Log in <span aria-hidden="true">&rarr;</span>
									</Link>
								</div>
							) : null}
						</nav>
					</div>
				</header>
				<div className="relative isolate px-6 pt-14 lg:px-8">
					<div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
						<div className="text-center">
							<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
								Modern web development made simple
							</h1>
							<p className="mt-6 text-lg leading-8 text-gray-600">
								Build powerful web applications with Express.js, Inertia.js, and React.
								Get the best of server-side rendering with the flexibility of modern frontend frameworks.
							</p>
							{!isAuthenticated ? (
								<div className="mt-10 flex items-center justify-center gap-x-6">
									<Link
										href="/register"
										className="rounded-md bg-black-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black-600"
									>
										Get started
									</Link>
									<Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
										Sign in <span aria-hidden="true">→</span>
									</Link>
								</div>
							) : (
							<div className="mt-10 flex items-center justify-center gap-x-6">
								<Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
										 Go to app <span aria-hidden="true">→</span>
									</Link>
							</div>)}
						</div>
					</div>

					<div className="mx-auto max-w-2xl lg:max-w-4xl">
						<div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2">
							<div>
								<h2 className="text-base font-semibold leading-7 text-black-600">Everything you need</h2>
								<p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
									Built for developers
								</p>
								<p className="mt-6 text-lg leading-8 text-gray-600">
									Express Inertia provides a modern development experience with proven technologies.
								</p>
								<dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600">
									<div className="relative pl-9">
										<dt className="inline font-semibold text-gray-900">
											<svg className="absolute left-1 top-1 h-5 w-5 text-black-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
												<path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
											</svg>
											Server-side rendering.
										</dt>
										<dd className="inline"> Fast initial page loads with SEO-friendly rendering.</dd>
									</div>
									<div className="relative pl-9">
										<dt className="inline font-semibold text-gray-900">
											<svg className="absolute left-1 top-1 h-5 w-5 text-black-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
												<path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
											</svg>
											Type-safe development.
										</dt>
										<dd className="inline"> Full TypeScript support for better developer experience.</dd>
									</div>
									<div className="relative pl-9">
										<dt className="inline font-semibold text-gray-900">
											<svg className="absolute left-1 top-1 h-5 w-5 text-black-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
												<path d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A9.966 9.966 0 0010 12c-2.51 0-4.8.9-6.344 2.767L4.632 3.533z" />
												<path fillRule="evenodd" d="M2 13a8 8 0 1116 0 8 8 0 01-16 0zm8-3a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
											</svg>
											Modern stack.
										</dt>
										<dd className="inline"> Express.js, Inertia.js, React, and Tailwind CSS out of the box.</dd>
									</div>
								</dl>
							</div>
							<div className="flex items-center justify-center">
								<div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl lg:p-4">
									<div className="rounded-md bg-white p-6 shadow-2xl ring-1 ring-gray-900/10">
										<h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
										<div className="mt-4 space-y-3">
											<div className="flex items-center space-x-3">
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-black-100 text-xs font-medium text-black-600">1</div>
												<span className="text-sm text-gray-600">Clone the repository</span>
											</div>
											<div className="flex items-center space-x-3">
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-black-100 text-xs font-medium text-black-600">2</div>
												<span className="text-sm text-gray-600">Install dependencies</span>
											</div>
											<div className="flex items-center space-x-3">
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-black-100 text-xs font-medium text-black-600">3</div>
												<span className="text-sm text-gray-600">Start building</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<footer className="bg-white">
					<div className="mx-auto max-w-2xl lg:max-w-4xl mt-24 mb-8">
						<div className="mt-8 md:order-1 md:mt-0">
							<p className="text-right text-xs leading-5 text-gray-500">
								&copy; 2025 {applicationName}. All rights reserved
							</p>
						</div>
					</div>
				</footer>
			</div>
		</>
	);
}