import { getServerUser } from '@/lib/auth/supabase-auth';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { SignOutButton } from '@/components/SignOutButton';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTutorData(authUserId: string) {
    try {
        console.log('🔍 Fetching tutor data for user:', authUserId);

        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();

        if (error) {
            console.error('❌ Error fetching tutor:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            // If no rows found, it means user hasn't completed onboarding
            if (error.code === 'PGRST116') {
                console.log('📝 No tutor record found - user needs to complete onboarding');
                return null;
            }

            // For other errors, still return null but log more details
            console.error('❌ Database error details:', error);
            return null;
        }

        console.log('✅ Tutor data retrieved successfully');
        return data;
    } catch (error) {
        console.error('❌ Unexpected error in getTutorData:', error);
        return null;
    }
}

export default async function TutorDashboardPage() {
    const user = await getServerUser();

    if (!user) {
        redirect('/sign-in');
    }

    console.log('🔍 Loading tutor dashboard for user:', user.id);

    const tutor = await getTutorData(user.id);

    if (!tutor) {
        console.log('❌ No tutor record found, redirecting to onboarding');
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-outfit font-bold text-gray-900 mb-4">
                        Complete Your Tutor Profile
                    </h1>
                    <p className="text-gray-600 font-inter mb-6">
                        You need to complete your tutor onboarding to access your dashboard.
                    </p>
                    <a
                        href="/onboarding/tutor"
                        className="inline-flex items-center px-6 py-3 bg-[#FF6B35] text-white font-inter font-medium rounded-lg hover:bg-[#FF6B35]/90 transition-colors"
                    >
                        Complete Onboarding
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            </div>
        );
    }

    console.log('✅ Tutor dashboard loaded successfully');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-outfit font-bold text-[#0A2540]">
                            SabiLearn Tutor Dashboard
                        </h1>
                        <SignOutButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/80 rounded-2xl p-8 mb-8 text-white">
                    <h2 className="text-3xl font-outfit font-bold mb-2">
                        Welcome back, {tutor.name}! 👋
                    </h2>
                    <p className="text-white/90 font-inter">
                        Ready to inspire students today?
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="text-sm font-inter text-gray-600 mb-1">Rating</div>
                        <div className="text-3xl font-outfit font-bold text-[#0A2540]">
                            {tutor.rating || '0.0'} ⭐
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="text-sm font-inter text-gray-600 mb-1">Total Reviews</div>
                        <div className="text-3xl font-outfit font-bold text-[#0A2540]">
                            {tutor.total_reviews || 0}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="text-sm font-inter text-gray-600 mb-1">Hourly Rate</div>
                        <div className="text-3xl font-outfit font-bold text-[#FF6B35]">
                            {tutor.hourly_rate ? `₦${tutor.hourly_rate.toLocaleString()}` : 'Not set'}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="text-sm font-inter text-gray-600 mb-1">Status</div>
                        <div className="text-xl font-outfit font-bold text-green-600">
                            {tutor.is_verified ? '✓ Verified' : 'Pending'}
                        </div>
                    </div>
                </div>

                {/* Profile Overview */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="text-xl font-outfit font-bold text-[#0A2540] mb-4">
                            Your Profile
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm font-inter text-gray-600">Email</div>
                                <div className="font-inter text-gray-900">{tutor.email || 'Not provided'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Phone</div>
                                <div className="font-inter text-gray-900">{tutor.phone || 'Not provided'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Location</div>
                                <div className="font-inter text-gray-900">{tutor.location || 'Not provided'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Experience</div>
                                <div className="font-inter text-gray-900 capitalize">
                                    {tutor.experience_level || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="text-xl font-outfit font-bold text-[#0A2540] mb-4">
                            Teaching Details
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm font-inter text-gray-600 mb-2">Subjects</div>
                                <div className="flex flex-wrap gap-2">
                                    {(tutor.subjects as string[])?.length > 0 ? (
                                        (tutor.subjects as string[]).map((subject) => (
                                            <span
                                                key={subject}
                                                className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-sm font-inter"
                                            >
                                                {subject}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 font-inter text-sm">No subjects specified</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600 mb-2">Grade Levels</div>
                                <div className="flex flex-wrap gap-2">
                                    {(tutor.grade_levels as string[])?.length > 0 ? (
                                        (tutor.grade_levels as string[]).map((level) => (
                                            <span
                                                key={level}
                                                className="px-3 py-1 bg-[#0A2540]/10 text-[#0A2540] rounded-full text-sm font-inter"
                                            >
                                                {level}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 font-inter text-sm">No grade levels specified</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="text-xl font-outfit font-bold text-[#0A2540] mb-4">
                        About You
                    </h3>
                    <p className="font-inter text-gray-700 leading-relaxed">
                        {tutor.bio || 'No bio provided yet.'}
                    </p>
                </div>

                {/* Coming Soon Section */}
                <div className="mt-8 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-2xl font-outfit font-bold mb-2">More Features Coming Soon!</h3>
                    <p className="font-inter text-white/80">
                        Session management, earnings tracking, and student requests will be available soon.
                    </p>
                </div>
            </main>
        </div>
    );
}
