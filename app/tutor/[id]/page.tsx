'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Star, MapPin, CheckCircle, Briefcase, ArrowLeft, Calendar, MessageCircle, Shield, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SignInModal } from '@/components/SignInModal';
import { toast } from 'sonner';

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    studentName: string;
}

interface Tutor {
    id: string;
    name: string;
    university: string;
    description: string;
    bio: string;
    latestExperience?: {
        post: string;
        institute: string;
        years: string;
    } | null;
    experiences?: Array<{
        post: string;
        institute: string;
        from_year: string;
        to_year: string;
        description?: string;
    }>;
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
    recentReviews?: ReviewItem[];
}

export default function TutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [tutor, setTutor] = useState<Tutor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking form state
    const { user, session } = useAuth();
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [submittingBooking, setSubmittingBooking] = useState(false);
    const [bookingDone, setBookingDone] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        subject: '',
        scheduledAt: '',
        durationMinutes: 60,
        mode: 'online' as 'online' | 'home',
        address: '',
        notes: '',
    });

    useEffect(() => {
        const fetchTutor = async () => {
            try {
                setLoading(true);
                console.log('Fetching tutor with ID:', resolvedParams.id); // Debug log
                const response = await fetch(`/api/tutors/${resolvedParams.id}`);
                const data = await response.json();

                console.log('API response:', response.status, data); // Debug log

                if (response.ok) {
                    setTutor(data.tutor);
                } else {
                    setError(data.error || 'Failed to fetch tutor');
                }
            } catch (error) {
                console.error('Error fetching tutor:', error);
                setError('Failed to load tutor profile');
            } finally {
                setLoading(false);
            }
        };

        if (resolvedParams.id) {
            console.log('Resolved params:', resolvedParams); // Debug log
            fetchTutor();
        } else {
            console.log('No ID in resolved params:', resolvedParams); // Debug log
            setError('No tutor ID provided');
            setLoading(false);
        }
    }, [resolvedParams.id]);

    // Preselect the tutor's first subject once loaded
    useEffect(() => {
        if (tutor && tutor.subjects.length > 0) {
            setBookingForm((f) => ({ ...f, subject: tutor.subjects[0] }));
        }
    }, [tutor]);

    const handleBookClick = () => {
        if (!user) {
            setShowSignInModal(true);
            return;
        }
        setShowBookingModal(true);
    };

    const handleBookingSubmit = async () => {
        if (!session?.access_token) {
            setShowSignInModal(true);
            return;
        }
        if (!bookingForm.subject || !bookingForm.scheduledAt) {
            toast.error('Please choose a subject and a date/time.');
            return;
        }
        if (bookingForm.mode === 'home' && !bookingForm.address.trim()) {
            toast.error('Please enter the lesson address for a home lesson.');
            return;
        }

        try {
            setSubmittingBooking(true);
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    tutorId: tutor!.id,
                    ...bookingForm,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || 'Failed to send booking request');
                return;
            }
            setShowBookingModal(false);
            setBookingDone(true);
            toast.success('Booking request sent!');
        } catch {
            toast.error('Could not reach the booking service. Please try again.');
        } finally {
            setSubmittingBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tutor profile...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !tutor) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl text-gray-600 mb-4">{error || 'Tutor not found'}</p>
                        <button
                            onClick={() => router.push('/find-tutors')}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                        >
                            Back to Find Tutors
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
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
                    <span>Back to Search</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
                    {/* Left Column - Profile Details */}
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-start gap-6">
                                {/* Profile Image */}
                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 flex-shrink-0">
                                    {tutor.image ? (
                                        <img
                                            src={tutor.image}
                                            alt={tutor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar');
                                                if (fallback) {
                                                    (fallback as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div className="fallback-avatar absolute inset-0 flex items-center justify-center text-white text-4xl font-bold bg-gradient-to-br from-green-400 to-blue-500" style={{ display: tutor.image ? 'none' : 'flex' }}>
                                        {tutor.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {tutor.name}
                                        </h1>
                                        {tutor.verified && (
                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    {tutor.latestExperience && (
                                        <p className="text-lg text-gray-600 mb-4">
                                            {tutor.latestExperience.post} • {tutor.latestExperience.institute}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-6 text-sm mb-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
                                            <span className="font-bold text-lg text-gray-900">{tutor.rating.toFixed(1)}</span>
                                            <span className="text-gray-500">({tutor.reviews} reviews)</span>
                                        </div>
                                        {tutor.location && (
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span>{tutor.location}</span>
                                            </div>
                                        )}
                                        {tutor.yearsOfExperience && tutor.yearsOfExperience > 0 && (
                                            <div className="text-gray-600">
                                                {tutor.yearsOfExperience} year{tutor.yearsOfExperience !== 1 ? 's' : ''} experience
                                            </div>
                                        )}
                                    </div>

                                    {tutor.hourlyRate && tutor.hourlyRate > 0 && (
                                        <div className="text-2xl font-bold text-green-600">
                                            ₦{tutor.hourlyRate.toLocaleString()}/hour
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* About Me */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {tutor.bio || tutor.description || 'No description available.'}
                            </p>
                        </div>

                        {/* Subjects & Grade Levels */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subjects & Grade Levels</h2>

                            {/* Subjects */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subjects I Teach</h3>
                                <div className="flex flex-wrap gap-3">
                                    {tutor.subjects.map((subject) => (
                                        <span
                                            key={subject}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Grade Levels */}
                            {tutor.gradeLevels && tutor.gradeLevels.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Grade Levels</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {tutor.gradeLevels.map((level) => (
                                            <span
                                                key={level}
                                                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium border border-green-100"
                                            >
                                                {level}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Exam Preparation */}
                            {tutor.examTypes && tutor.examTypes.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Exam Preparation</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {tutor.examTypes.map((exam) => (
                                            <span
                                                key={exam}
                                                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium border border-purple-100"
                                            >
                                                {exam}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Experience */}
                        {tutor.experiences && tutor.experiences.length > 0 && (
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Experience</h2>
                                <div className="relative">
                                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                                    <div className="space-y-6">
                                        {tutor.experiences.map((exp, index) => (
                                            <div key={index} className="flex gap-4 relative">
                                                <div className="flex-shrink-0 relative z-10">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-green-600' : 'bg-gray-100'
                                                        }`}>
                                                        <Briefcase className={`w-5 h-5 ${index === 0 ? 'text-white' : 'text-gray-600'
                                                            }`} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                                                        {exp.post}
                                                    </h3>
                                                    <p className="text-gray-600 mb-2">
                                                        {exp.institute} • {exp.from_year} - {exp.to_year}
                                                    </p>
                                                    {exp.description && (
                                                        <p className="text-gray-600">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking Card */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-24">
                            {/* Price */}
                            {tutor.hourlyRate && tutor.hourlyRate > 0 && (
                                <div className="mb-6">
                                    <div className="text-3xl font-bold text-gray-900">
                                        ₦{tutor.hourlyRate.toLocaleString()}
                                        <span className="text-base font-normal text-gray-500">/hour</span>
                                    </div>
                                </div>
                            )}

                            {/* Availability */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {tutor.availability}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {bookingDone ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-semibold text-gray-900 mb-1">Request sent!</p>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {tutor.name} will accept or decline shortly. Track it from your dashboard.
                                    </p>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="text-green-700 font-semibold text-sm hover:underline"
                                    >
                                        Go to Dashboard →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleBookClick}
                                        disabled={!tutor.verified}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Book a Session
                                    </button>

                                    <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
                                        Send Message
                                    </button>
                                </div>
                            )}

                            {/* Security Note */}
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                <Shield className="w-4 h-4" />
                                <span>Payments secured by fintech infrastructure</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                {tutor.recentReviews && tutor.recentReviews.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Reviews <span className="text-gray-400 text-lg">({tutor.reviews})</span>
                        </h2>
                        <div className="space-y-5">
                            {tutor.recentReviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                            {review.studentName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{review.studentName}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="ml-auto text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Book {tutor.name}</h3>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {tutor.hourlyRate ? (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estimated cost</span>
                                <span className="font-bold text-green-700 text-lg">
                                    ₦{Math.round((tutor.hourlyRate * bookingForm.durationMinutes) / 60).toLocaleString()}
                                    <span className="text-xs font-normal text-gray-500"> for {bookingForm.durationMinutes} min</span>
                                </span>
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                                <select
                                    value={bookingForm.subject}
                                    onChange={(e) => setBookingForm((f) => ({ ...f, subject: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600"
                                >
                                    {tutor.subjects.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date & time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={bookingForm.scheduledAt}
                                    onChange={(e) => setBookingForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
                                <div className="flex gap-2">
                                    {[60, 90, 120].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setBookingForm((f) => ({ ...f, durationMinutes: d }))}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                bookingForm.durationMinutes === d
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {d / 60} hr{d > 60 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mode */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lesson Mode</label>
                                <div className="flex gap-2">
                                    {(['online', 'home'] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setBookingForm((f) => ({ ...f, mode: m }))}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                bookingForm.mode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {m === 'online' ? 'Online' : 'At My Home'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Address for home lessons */}
                            {bookingForm.mode === 'home' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lesson Address</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12 Adeola Odeku St, Lekki, Lagos"
                                        value={bookingForm.address}
                                        onChange={(e) => setBookingForm((f) => ({ ...f, address: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600"
                                    />
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Notes for the tutor <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Anything the tutor should know about your child's level or goals"
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleBookingSubmit}
                                disabled={submittingBooking}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {submittingBooking ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending request...
                                    </>
                                ) : (
                                    'Send Booking Request'
                                )}
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                The tutor will confirm before anything is final. No payment is taken now.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <SignInModal
                isOpen={showSignInModal}
                onClose={() => setShowSignInModal(false)}
                onSuccess={() => {
                    setShowSignInModal(false);
                    setShowBookingModal(true);
                }}
            />

            <Footer />
        </div>
    );
}