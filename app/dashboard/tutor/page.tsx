import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { SignOutButton } from '@clerk/nextjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTutorData(clerkUserId: string) {
    const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error) {
        console.error('Error fetching tutor:', error);
        return null;
    }

    return data;
}

export default async function TutorDashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const tutor = await getTutorData(userId);

    if (!tutor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-outfit font-bold text-gray-900 mb-4">
                        Profile Not Found
                    </h1>
                    <p className="text-gray-600 font-inter">
                        Please complete your onboarding first.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-outfit font-bold text-[#0A2540]">
                            SabiLearn Tutor Dashboard
                        </h1>
                        <SignOutButton>
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-inter font-medium transition-colors">
                                Sign Out
                            </button>
                        </SignOutButton>
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
                            ₦{tutor.hourly_rate?.toLocaleString()}
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
                                <div className="font-inter text-gray-900">{tutor.email}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Phone</div>
                                <div className="font-inter text-gray-900">{tutor.phone}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Location</div>
                                <div className="font-inter text-gray-900">{tutor.location}</div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600">Experience</div>
                                <div className="font-inter text-gray-900 capitalize">
                                    {tutor.experience_level}
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
                                    {(tutor.subjects as string[])?.map((subject) => (
                                        <span
                                            key={subject}
                                            className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-sm font-inter"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-inter text-gray-600 mb-2">Grade Levels</div>
                                <div className="flex flex-wrap gap-2">
                                    {(tutor.grade_levels as string[])?.map((level) => (
                                        <span
                                            key={level}
                                            className="px-3 py-1 bg-[#0A2540]/10 text-[#0A2540] rounded-full text-sm font-inter"
                                        >
                                            {level}
                                        </span>
                                    ))}
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
                    <p className="font-inter text-gray-700 leading-relaxed">{tutor.bio}</p>
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
