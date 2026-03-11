'use client';

import { useRouter } from 'next/navigation';

export default function TestTutorRoute() {
    const router = useRouter();

    const testRoutes = [
        '176e7443-2bb1-437d-acf8-06f47f4f06c0', // Nicea nia
        'test-id-123', // Invalid ID for testing error handling
    ];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Tutor Routes</h1>
            <div className="space-y-4">
                {testRoutes.map((id) => (
                    <div key={id}>
                        <button
                            onClick={() => router.push(`/tutor/${id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
                        >
                            Test /tutor/{id}
                        </button>
                        <a
                            href={`/api/tutors/${id}`}
                            target="_blank"
                            className="bg-green-600 text-white px-4 py-2 rounded inline-block"
                        >
                            Test API /api/tutors/{id}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}