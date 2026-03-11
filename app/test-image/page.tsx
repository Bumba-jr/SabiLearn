'use client';

import { useState, useEffect } from 'react';

export default function TestImagePage() {
    const [imageUrl, setImageUrl] = useState('');
    const [testUrl, setTestUrl] = useState('https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/8295fb7d-7572-4dbb-9840-40d8da749df1/profile_photo/1772922736458_236b1bff4ac1c1dfd652f24ab7886876.jpg');
    const [imageError, setImageError] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        // Fetch test data
        fetch('/api/test-tutor-images')
            .then(res => res.json())
            .then(data => {
                if (data.tutors && data.tutors.length > 0) {
                    const tutorWithImage = data.tutors.find(t => t.generated_image_url);
                    if (tutorWithImage) {
                        setImageUrl(tutorWithImage.generated_image_url);
                    }
                }
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Image URL Test</h1>

                <div className="space-y-6">
                    {/* Test URL Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Test Image URL:</label>
                        <input
                            type="text"
                            value={testUrl}
                            onChange={(e) => setTestUrl(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                            onClick={() => {
                                setImageError('');
                                setImageLoaded(false);
                                setImageUrl(testUrl);
                            }}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Test This URL
                        </button>
                    </div>

                    {/* Image Display */}
                    {imageUrl && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Testing Image:</h2>
                            <p className="text-sm text-gray-600 mb-4 break-all">{imageUrl}</p>

                            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                                <img
                                    src={imageUrl}
                                    alt="Test"
                                    className="max-w-md mx-auto rounded-lg"
                                    onLoad={() => {
                                        setImageLoaded(true);
                                        setImageError('');
                                        console.log('✅ Image loaded successfully');
                                    }}
                                    onError={(e) => {
                                        setImageError('Failed to load image');
                                        console.error('❌ Image failed to load:', imageUrl);
                                        console.error('Error event:', e);
                                    }}
                                />
                            </div>

                            {imageLoaded && (
                                <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
                                    ✅ Image loaded successfully!
                                </div>
                            )}

                            {imageError && (
                                <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
                                    ❌ {imageError}
                                    <p className="text-sm mt-2">
                                        Possible issues:
                                        <ul className="list-disc ml-6 mt-2">
                                            <li>Bucket is not public</li>
                                            <li>File doesn't exist at this path</li>
                                            <li>CORS policy blocking the request</li>
                                            <li>RLS policy preventing access</li>
                                        </ul>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Direct Link Test */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Direct Link Test:</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Try opening this URL directly in a new tab:
                        </p>
                        <a
                            href={imageUrl || testUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                        >
                            {imageUrl || testUrl}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
