import { Head, Link } from '@inertiajs/react';

interface Props {
	status?: number;
	message?: string;
}

const titles: Record<number, string> = {
	404: 'Page not found',
	500: 'Server error',
};

export default function ErrorPage({ status = 500, message }: Props) {
	const title = titles[status] || 'Something went wrong';
	return (
		<>
			<Head title={`${status} — ${title}`} />
			<div className="min-h-screen bg-white flex items-center justify-center px-6">
				<div className="text-center max-w-md">
					<p className="text-sm font-semibold text-gray-500">{status}</p>
					<h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
						{title}
					</h1>
					{message ? (
						<p className="mt-4 text-base text-gray-600">{message}</p>
					) : null}
					<div className="mt-8">
						<Link
							href="/"
							className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
						>
							Go home
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}
