import { Head, Link } from '@inertiajs/react';
import Navigation from '../components/Navigation';

interface User {
	id: number;
	name: string;
	email: string;
}

interface Props {
	users: User[];
}

export default function Users({ users }: Props) {
	return (
		<>
			<Head title="Users" />
			<div className="max-w-4xl mx-auto p-6">
				<Navigation />

				<h1 className="text-3xl font-light mb-6">Users</h1>

				<div className="grid gap-4">
					{users.map(user => (
						<div key={user.id} className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
							<h3 className="text-lg font-medium mb-2">
								<Link href={`/users/${user.id}`} className="text-gray-900 hover:underline">
									{user.name}
								</Link>
							</h3>
							<p className="text-gray-600">{user.email}</p>
						</div>
					))}
				</div>
			</div>
		</>
	);
}