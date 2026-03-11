'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Heart, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';

interface Tutor {
    id: string;
    name: string;
    university: string;
    description: string;
    latestExperience?: {
        post: string;
        institute: string;
        years: string;
    } | null;
    subjects: string[];
    rating: number;
    reviews: number;
    hourlyRate: number | null;
    verified: boolean;
    image: string;
    availability: string;
    location?: string;
    yearsOfExperience?: number;
    gradeLevels?: string[];
    examTypes?: string[];
}

export default function FavoritesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [favoriteTutors, setFavoriteTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/sign-in');
            return;
        }

        const fetchFavoriteTutors = async () => {
            try {
                setLoading(true);

                // Get saved tutor IDs from user-specific localStorage
                const userFavoritesKey = `savedTutors_${user.id}`;
                const savedTutorIds = localStorage.getItem(userFavoritesKey);
                if (!savedTutorIds) {
                    setLoading(false);
                    return;
                }

                const tutorIds = JSON.parse(savedTutorIds);

                if (tutorIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch tutor details for each saved ID
                const tutorPromises = tutorIds.map(async (id: string) => {
                    try {
                        const response = await fetch(`/api/tutors/${id}`);
                        if (response.ok) {
                            const data = await response.json();
                            return data.tutor;
                        }
                        return null;
                    } catch (error) {
                        console.error(`Error fetching tutor ${id}:`, error);
                        return null;
                    }
                });

                const tutors = await Promise.all(tutorPromises);
                const validTutors = tutors.filter(tutor => tutor !== null);
                setFavoriteTutors(validTutors);
            } catch (error) {
                console.error('Error fetching favorite tutors:', error);
                toast.error('Failed to load favorite tutors');
            } finally {
                setLoading(false);
            }
        };

        fetchFavoriteTutors();
    }, [user, router]);

    const handleRemoveFavorite = (tutorId: string) => {
        const tutor = favoriteTutors.find(t => t.id === tutorId);
        const tutorName = tutor?.name || 'Tutor';

        // Update local state
        setFavoriteTutors(prev => prev.filter(t => t.id !== tutorId));

        // Update user-specific localStorage
        if (user) {
            const userFavoritesKey = `savedTutors_${user.id}`;
            const savedTutorIds = localStorage.getItem(userFavoritesKey);
            if (savedTutorIds) {
                const tutorIds = JSON.parse(savedTutorIds);
                const updatedIds = tutorIds.filter((id: string) => id !== tutorId);
                localStorage.setItem(userFavoritesKey, JSON.stringify(updatedIds));

                // Dispatch custom event to update header count
                window.dispatchEvent(new CustomEvent('favoritesChanged'));
            }
        }

        toast.success(`❤️ ${tutorName} removed from favorites`);
    };

    if (!user) {
        return null; // Will redirect to sign-in
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />

            {/* Back Button */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12 flex-1">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Favorite Tutors</h1>
                    <p className="text-gray-600">
                        {favoriteTutors.length === 0
                            ? "You haven't saved any tutors yet"
                            : `${favoriteTutors.length} tutor${favoriteTutors.length !== 1 ? 's' : ''} saved`
                        }
                    </p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading your favorite tutors...</p>
                        </div>
                    </div>
                )}

                {!loading && favoriteTutors.length === 0 && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
                            <p className="text-gray-600 mb-6">Start browsing tutors and save your favorites!</p>
                            <button
                                onClick={() => router.push('/find-tutors')}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                            >
                                Find Tutors
                            </button>
                        </div>
                    </div>
                )}

                {!loading && favoriteTutors.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {favoriteTutors.map((tutor) => (
                            <div
                                key={tutor.id}
                                className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-500 ease-in-out cursor-pointer w-full group shadow-md flex flex-col h-full"
                            >
                                {/* Tutor Image with Overlay */}
                                <div className="relative h-72 bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100 overflow-hidden">
                                    {tutor.image ? (
                                        <>
                                            <img
                                                src={tutor.image}
                                                alt={tutor.name}
                                                className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.parentElement?.nextElementSibling;
                                                    if (fallback) {
                                                        (fallback as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[.9px] group-hover:bg-black/0 transition-all duration-500 ease-in-out"></div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                                                {tutor.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <div className="w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">✓</span>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900">Verified</span>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                                        {tutor.location || 'Online'}
                                    </div>
                                </div>

                                {/* Tutor Info */}
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="mb-3">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="font-bold text-lg text-gray-900 flex-1">{tutor.name}</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFavorite(tutor.id);
                                                }}
                                                className="ml-3 p-2 rounded-full transition-all duration-200 hover:scale-110 hover:bg-gray-50 text-red-500 hover:text-red-600"
                                                title="Remove from favorites"
                                            >
                                                <Heart className="w-5 h-5 fill-current" />
                                            </button>
                                        </div>
                                        {tutor.latestExperience && (
                                            <p className="text-sm text-gray-600">
                                                {tutor.latestExperience.post} • {tutor.latestExperience.institute}
                                            </p>
                                        )}
                                    </div>

                                    {/* Rating and Experience */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                                            <span className="font-bold text-sm text-gray-900">{tutor.rating.toFixed(1)}</span>
                                            <span className="text-sm text-gray-500">({tutor.reviews})</span>
                                        </div>
                                        {tutor.yearsOfExperience && tutor.yearsOfExperience > 0 && (
                                            <div className="text-sm text-gray-600">
                                                {tutor.yearsOfExperience} yr{tutor.yearsOfExperience !== 1 ? 's' : ''} exp.
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {tutor.description}
                                    </p>

                                    {/* Subject Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tutor.subjects.slice(0, 3).map((subject) => (
                                            <span
                                                key={subject}
                                                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                                            >
                                                {subject}
                                            </span>
                                        ))}
                                        {tutor.subjects.length > 3 && (
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                                                +{tutor.subjects.length - 3} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Spacer to push buttons to bottom */}
                                    <div className="flex-grow"></div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-gray-100 flex gap-3 mt-auto">
                                        <button
                                            onClick={() => router.push(`/tutor/${tutor.id}`)}
                                            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-5 py-3 rounded-lg text-sm font-semibold transition-all"
                                        >
                                            View Profile
                                        </button>
                                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-all">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}