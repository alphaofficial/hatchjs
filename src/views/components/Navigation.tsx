import { Link } from '@inertiajs/react';

export default function Navigation() {
	return (
		<nav className="mb-8 pb-4 border-b border-gray-200">
			<Link href="/" className="mr-6 text-gray-900 hover:underline">
				Home
			</Link>
			<Link href="/about" className="mr-6 text-gray-900 hover:underline">
				About
			</Link>
			<Link href="/users" className="mr-6 text-gray-900 hover:underline">
				Users
			</Link>
		</nav>
	);
}