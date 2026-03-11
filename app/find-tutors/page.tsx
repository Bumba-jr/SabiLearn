'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Search, MapPin, Star, Check, Shield, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SignInModal } from '@/components/SignInModal';

// Tutor type definition
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

const SUBJECTS = [
    'Mathematics',
    'English Language',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Accounting',
];

const CATEGORIES = [
    'All Categories',
    'WAEC Preparation',
    'JAMB Coaching',
    'Primary School',
    'Coding for Kids',
    'Female Tutors Only',
];

const LEVELS = [
    'Primary',
    'JSS 1-3',
    'SSS 1-3 (WAEC/JAMB)',
];

const LESSON_MODES = [
    'Any',
    'Online',
    'In-Person',
];

export default function FindTutorsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('Online');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedLessonMode, setSelectedLessonMode] = useState('Any');
    const [sortBy, setSort] = useState('Recommended');
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [savedTutors, setSavedTutors] = useState<Set<string>>(new Set());
    const [hoveredHeart, setHoveredHeart] = useState<string | null>(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [pendingTutorId, setPendingTutorId] = useState<string | null>(null);

    // Handle OAuth return and pending favorites
    useEffect(() => {
        // Check if we just returned from OAuth and need to show success message
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('favoriteAdded') === 'true') {
            // Remove the URL parameter
            window.history.replaceState({}, '', window.location.pathname);
            // Show success message
            toast.success('💖 Tutor added to favorites!');
            // Dispatch event to update header count
            window.dispatchEvent(new CustomEvent('favoritesChanged'));
        }
    }, []);

    // Load saved tutors from localStorage on component mount (user-specific)
    useEffect(() => {
        if (user) {
            const userFavoritesKey = `savedTutors_${user.id}`;
            const savedTutorIds = localStorage.getItem(userFavoritesKey);
            if (savedTutorIds) {
                try {
                    const parsedIds = JSON.parse(savedTutorIds);
                    setSavedTutors(new Set(parsedIds));
                } catch (error) {
                    console.error('Error loading saved tutors:', error);
                    setSavedTutors(new Set());
                }
            } else {
                setSavedTutors(new Set());
            }
        } else {
            setSavedTutors(new Set());
        }
    }, [user]);

    // Fetch tutors from API
    useEffect(() => {
        const fetchTutors = async () => {
            try {
                setLoading(true);

                // Build query params
                const params = new URLSearchParams();
                if (selectedSubjects.length > 0) {
                    params.append('subject', selectedSubjects[0]); // For now, filter by first subject
                }
                if (selectedLevels.length > 0) {
                    params.append('level', selectedLevels[0]); // For now, filter by first level
                }
                if (selectedCategory === 'Female Tutors Only') {
                    // This would need a gender field in the database
                }

                const response = await fetch(`/api/tutors?${params.toString()}`);
                const data = await response.json();

                if (response.ok) {
                    setTutors(data.tutors || []);
                } else {
                    console.error('Failed to fetch tutors:', data.error);
                    setTutors([]);
                }
            } catch (error) {
                console.error('Error fetching tutors:', error);
                setTutors([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, [selectedSubjects, selectedLevels, selectedCategory]); // Re-fetch when filters change

    const handleSubjectToggle = (subject: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleLevelToggle = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const clearAllFilters = () => {
        setSelectedSubjects([]);
        setSelectedLevels([]);
        setSelectedLessonMode('Any');
        setSelectedCategory('All Categories');
    };

    const handleAuthSuccess = () => {
        // After successful authentication, add the pending tutor to favorites
        if (pendingTutorId && user) {
            // Small delay to ensure user state is fully updated
            setTimeout(() => {
                handleSaveTutor(pendingTutorId);
                setPendingTutorId(null);
            }, 200);
        }
    };

    const handleSaveTutor = (tutorId: string) => {
        // Check if user is authenticated
        if (!user) {
            setPendingTutorId(tutorId);
            setShowSignInModal(true);
            return;
        }

        const tutor = tutors.find(t => t.id === tutorId);
        const tutorName = tutor?.name || 'Tutor';
        const userFavoritesKey = `savedTutors_${user.id}`;

        setSavedTutors(prev => {
            const newSaved = new Set(prev);
            if (newSaved.has(tutorId)) {
                newSaved.delete(tutorId);
                toast.success(`❤️ ${tutorName} removed from favorites`);
            } else {
                newSaved.add(tutorId);
                toast.success(`💖 ${tutorName} added to favorites!`);
            }

            // Save to user-specific localStorage
            localStorage.setItem(userFavoritesKey, JSON.stringify(Array.from(newSaved)));

            // Dispatch custom event to update header count
            window.dispatchEvent(new CustomEvent('favoritesChanged'));

            return newSaved;
        });
    };

    // Filter and sort tutors client-side
    const filteredTutors = tutors.filter(tutor => {
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = tutor.name.toLowerCase().includes(query);
            const matchesSubjects = tutor.subjects.some(s => s.toLowerCase().includes(query));
            const matchesDescription = tutor.description.toLowerCase().includes(query);
            if (!matchesName && !matchesSubjects && !matchesDescription) {
                return false;
            }
        }

        // Location filter
        if (selectedLocation !== 'Online' && tutor.location) {
            if (!tutor.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
                return false;
            }
        }

        return true;
    });

    // Sort tutors
    const sortedTutors = [...filteredTutors].sort((a, b) => {
        switch (sortBy) {
            case 'Highest Rated':
                return b.rating - a.rating;
            case 'Lowest Price':
                return (a.hourlyRate || Infinity) - (b.hourlyRate || Infinity);
            case 'Most Reviews':
                return b.reviews - a.reviews;
            case 'Recommended':
            default:
                // Recommended: combination of rating and reviews
                return (b.rating * b.reviews) - (a.rating * a.reviews);
        }
    });

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />

            {/* Hero Section */}
            <section style={{ backgroundColor: '#F9F8F6' }} className="border-b border-gray-200 py-32">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">
                            #1 Trusted Tutoring Platform in Nigeria
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-[80px] font-bold text-center mb-6">
                        Find the perfect tutor
                        <br />
                        <span className="text-green-600">for any subject.</span>
                    </h1>

                    <p className="text-center text-gray-600 text-lg md:text-2xl mb-8 pt-3 max-w-2xl mx-auto">
                        From JAMB prep to coding lessons. Connect with vetted experts
                        for 1-on-1 home or online learning.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4 bg-white rounded-2xl shadow-xl p-3 border border-gray-200">
                            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-[#F9F8F6] rounded-xl">
                                <Search className="w-6 h-6 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="What do you want to learn? (e.g. Mathematics)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-lg"
                                />
                            </div>
                            <div className="flex items-center gap-4 px-6 py-4 bg-[#F9F8F6] rounded-xl md:w-56">
                                <MapPin className="w-6 h-6 text-gray-400" />
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-gray-900 text-lg"
                                >
                                    <option>Online</option>
                                    <option>Lagos</option>
                                    <option>Abuja</option>
                                    <option>Port Harcourt</option>
                                    <option>Kaduna</option>
                                </select>
                            </div>
                            <button className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all">
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Verified IDs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>4.95 Average Rating</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Filter Buttons */}
            <div className="bg-white border-b border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${selectedCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-4 py-8 flex-1">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="md:w-96 flex-shrink-0">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-green-600 hover:text-green-700 font-semibold uppercase tracking-wide"
                                >
                                    CLEAR ALL
                                </button>
                            </div>

                            {/* Subject Filter */}
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer">
                                    Subject
                                    <span className="text-gray-400 text-xs">▼</span>
                                </h4>
                                <div className="space-y-3">
                                    {SUBJECTS.map((subject) => (
                                        <label key={subject} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubjects.includes(subject)}
                                                onChange={() => handleSubjectToggle(subject)}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{subject}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Level Filter */}
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer">
                                    Level
                                    <span className="text-gray-400 text-xs">▼</span>
                                </h4>
                                <div className="space-y-3">
                                    {LEVELS.map((level) => (
                                        <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedLevels.includes(level)}
                                                onChange={() => handleLevelToggle(level)}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Lesson Mode Filter */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer">
                                    Lesson Mode
                                    <span className="text-gray-400 text-xs">▼</span>
                                </h4>
                                <div className="flex gap-2">
                                    {LESSON_MODES.map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setSelectedLessonMode(mode)}
                                            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedLessonMode === mode
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Tutors List */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                <span className="font-bold text-gray-900">{sortedTutors.length}</span> Tutors found
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-600"
                                >
                                    <option>Recommended</option>
                                    <option>Highest Rated</option>
                                    <option>Lowest Price</option>
                                    <option>Most Reviews</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading tutors...</p>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && sortedTutors.length === 0 && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <p className="text-xl text-gray-600 mb-2">No tutors found</p>
                                    <p className="text-gray-500">Try adjusting your filters or check back later</p>
                                </div>
                            </div>
                        )}

                        {/* Tutor Cards */}
                        {!loading && sortedTutors.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {sortedTutors.map((tutor) => (
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
                                                            console.error('Image failed to load:', tutor.image);
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.parentElement?.nextElementSibling;
                                                            if (fallback) {
                                                                (fallback as HTMLElement).style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[.4px] group-hover:bg-black/0  group-hover:backdrop-blur-[0px] transition-all duration-500 ease-in-out"></div>
                                                </>
                                            ) : (
                                                /* Fallback Avatar for tutors without image */
                                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                                                        {tutor.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <div className="w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
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
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSaveTutor(tutor.id);
                                                            }}
                                                            onMouseEnter={() => setHoveredHeart(tutor.id)}
                                                            onMouseLeave={() => setHoveredHeart(null)}
                                                            className={`ml-3 p-2 rounded-full transition-all duration-200 hover:scale-110 hover:bg-gray-50 ${savedTutors.has(tutor.id)
                                                                ? 'text-red-500 hover:text-red-600'
                                                                : 'text-gray-400 hover:text-red-500'
                                                                }`}
                                                        >
                                                            <Heart
                                                                className={`w-5 h-5 ${savedTutors.has(tutor.id) ? 'fill-current' : ''
                                                                    }`}
                                                            />
                                                        </button>

                                                        {/* Custom Tooltip */}
                                                        {hoveredHeart === tutor.id && (
                                                            <div className="absolute top-1/2 right-full transform -translate-y-1/2 mr-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg">
                                                                {savedTutors.has(tutor.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                                <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                                                            </div>
                                                        )}
                                                    </div>
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

                                            {/* Grade Levels & Exam Preparation */}
                                            <div className="mb-4 pb-3 ">
                                                {tutor.gradeLevels && tutor.gradeLevels.length > 0 ? (
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-500 mb-2">Grade Levels</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {tutor.gradeLevels.slice(0, 4).map((level) => (
                                                                <span
                                                                    key={level}
                                                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100"
                                                                >
                                                                    {level}
                                                                </span>
                                                            ))}
                                                            {tutor.gradeLevels.length > 4 && (
                                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                                                                    +{tutor.gradeLevels.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-400 mb-2">Grade Levels</p>
                                                        <p className="text-xs text-gray-400 italic">Select at least one</p>
                                                    </div>
                                                )}

                                                {tutor.examTypes && tutor.examTypes.length > 0 ? (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 mb-2">Exam Preparation</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {tutor.examTypes.map((exam) => (
                                                                <span
                                                                    key={exam}
                                                                    className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-100"
                                                                >
                                                                    {exam}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 mb-2">Exam Preparation</p>
                                                        <p className="text-xs text-gray-400 italic">Not specified</p>
                                                    </div>
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
                    </main>
                </div>
            </div>

            <Footer />

            {/* Sign In Modal */}
            <SignInModal
                isOpen={showSignInModal}
                onClose={() => {
                    setShowSignInModal(false);
                    setPendingTutorId(null);
                }}
                onSuccess={handleAuthSuccess}
                tutorId={pendingTutorId || undefined}
            />
        </div>
    );
}
