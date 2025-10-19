import { Head } from '@inertiajs/react';
import Navigation from '../components/Navigation';

interface Props {
	title: string;
	description: string;
}

export default function About({ title, description }: Props) {
	return (
		<>
			<Head title="About" />
			<div className="max-w-4xl mx-auto p-6">
				<Navigation />

				<h1 className="text-3xl font-light mb-6">{title}</h1>
				<p className="mb-6 text-gray-700">{description}</p>

				<div className="bg-gray-50 p-6 border-l-4 border-gray-900">
					<h2 className="text-xl font-light mb-4">Technology Stack</h2>
					<ul className="space-y-2">
						<li className="text-gray-700">• Express.js - Web framework</li>
						<li className="text-gray-700">• Inertia.js - Modern monolith approach</li>
						<li className="text-gray-700">• React - Frontend library</li>
						<li className="text-gray-700">• TypeScript - Type safety</li>
						<li className="text-gray-700">• Tailwind CSS - Styling</li>
						<li className="text-gray-700">• Vite - Build tool</li>
					</ul>
				</div>
			</div>
		</>
	);
}