import { Head } from '@inertiajs/react';
import Navigation from '../components/Navigation';

interface Props {
	message: string;
	timestamp: string;
	weather?: any;
	applicationName: string;
}

export default function Home({ message, timestamp, weather, applicationName }: Props) {
	return (
		<>
			<Head title="Home" />
			<div className="max-w-4xl mx-auto p-6">
				<Navigation />

				<h1 className="text-3xl font-light mb-6">{applicationName}</h1>
				<p className="mb-6 text-gray-700">{message}</p>

				{weather && weather.current_weather && (
					<div className="bg-gray-50 p-4 mb-6 border-l-4 border-gray-900">
						<h2 className="text-xl font-light mb-3">Weather in Berlin</h2>
						<p className="text-gray-700">Temperature: {weather.current_weather.temperature}°C</p>
						<p className="text-gray-700">Wind Speed: {weather.current_weather.windspeed} km/h</p>
					</div>
				)}

				<h2 className="text-2xl font-light mb-4">Features</h2>
				<ul className="space-y-2 mb-8">
					<li className="text-gray-700">Server-side rendering on Express with Node.js</li>
					<li className="text-gray-700">Client-side navigation with Inertia.js</li>
					<li className="text-gray-700">Pass data from server</li>
					<li className="text-gray-700">Tailwind CSS for styling</li>
				</ul>

				<p className="text-sm text-gray-500">Generated at: {timestamp}</p>
			</div>
		</>
	);
}