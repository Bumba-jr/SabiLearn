import { CheckCircle2, Bell, BookOpen, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
    return (
        <section className="relative min-h-[90vh] bg-gradient-to-br from-background via-background to-muted/30 py-16 md:py-24 px-4 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.05),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(10,37,64,0.03),transparent_50%)]" />

            {/* Floating Orbs */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float-1" />
            <div className="absolute bottom-10 left-20 w-72 h-72 bg-accent/12 rounded-full blur-3xl animate-float-2" />
            <div className="absolute bottom-20 right-10 w-[28rem] h-[28rem] bg-secondary/25 rounded-full blur-3xl animate-float-3" />

            <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-slide-up">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium shadow-sm border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                        100% IB Verified Tutors
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-secondary leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Empower Your<br />
                        Child's Future.
                    </h1>

                    {/* Description */}
                    <p className="text-sm sm:text-base md:text-lg text-foreground/70 max-w-xl leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                        Connect with top-rated, verified teachers across Nigeria for home or online tutoring.
                        Master WAEC, JAMB, IGCSE, or daily schoolwork with confidence.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-2">
                        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-semibold transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                            Find a Tutor Now
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button className="bg-white hover:bg-gray-50 text-secondary px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-semibold border-2 border-gray-200 transition-all hover:border-gray-300">
                            Explore Subjects
                        </button>
                    </div>

                    {/* Horizontal Line */}
                    <div className="w-full h-px bg-border/30 my-4 md:my-6" />

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 lg:gap-8">
                        <div>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary" style={{ fontFamily: 'var(--font-outfit)' }}>10k+</div>
                            <div className="text-xs sm:text-sm text-foreground/60 mt-1" style={{ fontFamily: 'var(--font-inter)' }}>Active Students</div>
                        </div>

                        <div className="h-12 md:h-16 w-px bg-border/50" />

                        <div>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary" style={{ fontFamily: 'var(--font-outfit)' }}>4.9/5</div>
                            <div className="flex text-primary text-base md:text-lg mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i}>★</span>
                                ))}
                            </div>
                        </div>

                        <div className="h-12 md:h-16 w-px bg-border/50" />

                        <div>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary" style={{ fontFamily: 'var(--font-outfit)' }}>50+</div>
                            <div className="text-xs sm:text-sm text-foreground/60 mt-1" style={{ fontFamily: 'var(--font-inter)' }}>Subjects Covered</div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Phone Mockup with Floating Cards */}
                <div className="relative animate-fade-in hidden lg:flex justify-center lg:justify-end">
                    <PhoneMockupWithCards />
                </div>
            </div>
        </section>
    );
}

function PhoneMockupWithCards() {
    return (
        <div className="relative w-full max-w-[500px] h-[700px]">
            {/* Identity Verified Card - Top Left */}
            <div className="absolute top-8 -left-8 z-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100/50 backdrop-blur-sm">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                    <div className="font-semibold text-base text-gray-900">Identity Verified</div>
                    <div className="text-sm text-gray-500">BVN & Credential Checked</div>
                </div>
            </div>

            {/* Phone Container */}
            <div className="absolute top-0 right-0 w-[380px]">
                {/* Phone Mockup */}
                <div className="relative bg-white rounded-[3.5rem] shadow-2xl p-6 pb-8" style={{ height: '680px' }}>
                    {/* Header Card */}
                    <div className="bg-secondary text-white rounded-3xl p-6 relative overflow-hidden mb-5">
                        <div className="absolute top-3 left-5 w-12 h-12 bg-white/10 rounded-full" />
                        <Bell className="absolute top-5 right-5 w-6 h-6 z-10" />
                        <div className="space-y-2 relative z-10 pt-2">
                            <h3 className="text-xl font-bold">Good morning, Mrs. Bello</h3>
                            <p className="text-sm text-white/70">What would you like to learn today?</p>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-5">
                        <input
                            type="text"
                            placeholder="Search Math, Physics..."
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-400 focus:outline-none"
                            disabled
                        />
                    </div>

                    {/* Upcoming Today Section */}
                    <div className="mb-5">
                        <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-wider mb-3 px-1">UPCOMING TODAY</h4>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary">
                                <Image
                                    src="/file0.jpeg"
                                    alt="Tutor"
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-base text-gray-900">Mr. Tunde O.</div>
                                <div className="text-sm text-gray-500">Further Mathematics • 4:00 PM</div>
                            </div>
                        </div>
                    </div>

                    {/* Two Cards Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 rounded-2xl p-6 text-center border border-blue-100/50">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-7 h-7 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-amber-50/50 rounded-2xl p-6 text-center border border-amber-100/50 flex flex-col items-center justify-center gap-3">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                                <Calendar className="w-7 h-7 text-amber-600" />
                            </div>
                            <div className="text-sm font-semibold text-gray-700">Languages</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expert Tutors Card - Bottom Left */}
            <div className="absolute bottom-20 -left-8 z-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4 border border-gray-100/50 backdrop-blur-sm">
                <div className="flex -space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-white shadow-md">
                        <Image
                            src="/file1.jpeg"
                            alt="Tutor"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-white shadow-md">
                        <Image
                            src="/file2.jpeg"
                            alt="Tutor"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 border-3 border-white flex items-center justify-center text-sm font-bold text-gray-700 shadow-md">
                        +5k
                    </div>
                </div>
                <div>
                    <div className="font-semibold text-base text-gray-900">Expert Tutors</div>
                    <div className="text-sm text-gray-500">Ready to teach</div>
                </div>
            </div>
        </div>
    );
}
