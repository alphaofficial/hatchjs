import { Head, Link } from '@inertiajs/react';
import Navigation from '../components/Navigation';

interface User {
	id: number;
	name: string;
	email: string;
}

interface Props {
	user: User;
}

export default function User({ user }: Props) {
	return (
		<>
			<Head title={`User: ${user.name}`} />
			<div className="max-w-4xl mx-auto p-6">
				<Navigation />

				<div className="mb-4">
					<Link href="/users" className="text-gray-600 hover:text-gray-900 hover:underline">
						← Back to Users
					</Link>
				</div>

				<div className="bg-white p-6 border border-gray-200 rounded-lg">
					<h1 className="text-3xl font-light mb-4">{user.name}</h1>
					<div className="space-y-3">
						<div>
							<span className="font-medium text-gray-700">Email:</span>
							<span className="ml-2 text-gray-600">{user.email}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">User ID:</span>
							<span className="ml-2 text-gray-600">{user.id}</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}