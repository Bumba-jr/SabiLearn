import { BookOpen, MapPin, Wallet, Search } from "lucide-react";

export function FindMatchSection() {
    return (
        <section className="relative py-16 md:py-24 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Heading */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Find the Perfect Match
                    </h2>
                    <p className="text-base md:text-xm text-foreground/70 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                        Filter by subject, location, budget, and curriculum to find the ideal tutor for your child's specific needs.
                    </p>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
                    {/* Filter Inputs - All in one row */}
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        {/* Subject Filter */}
                        <div className="flex-1 relative">
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                <div className="absolute left-12 top-3 text-xs font-semibold text-gray-500 uppercase tracking-wide pointer-events-none">
                                    Subject
                                </div>
                                <select className="w-full pl-12 pr-10 pt-6 pb-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>Mathematics (WAEC)</option>
                                    <option>English Language</option>
                                    <option>Physics</option>
                                    <option>Chemistry</option>
                                    <option>Biology</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Location Filter */}
                        <div className="flex-1 relative">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                <div className="absolute left-12 top-3 text-xs font-semibold text-gray-500 uppercase tracking-wide pointer-events-none">
                                    Location
                                </div>
                                <select className="w-full pl-12 pr-10 pt-6 pb-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>Lagos (Home)</option>
                                    <option>Abuja</option>
                                    <option>Port Harcourt</option>
                                    <option>Ibadan</option>
                                    <option>Online</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Budget Filter */}
                        <div className="flex-1 relative">
                            <div className="relative">
                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                <div className="absolute left-12 top-3 text-xs font-semibold text-gray-500 uppercase tracking-wide pointer-events-none">
                                    Budget
                                </div>
                                <select className="w-full pl-12 pr-10 pt-6 pb-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>₦3k - ₦5k / hr</option>
                                    <option>₦2k - ₦3k / hr</option>
                                    <option>₦5k - ₦10k / hr</option>
                                    <option>₦10k+ / hr</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <button className="bg-secondary hover:bg-secondary/90 text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 md:w-auto w-full h-[52px]">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Popular Tags */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-gray-500 font-medium">Popular:</span>
                            <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full transition-colors">
                                JAMB Prep
                            </button>
                            <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full transition-colors">
                                IGCSE English
                            </button>
                            <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full transition-colors">
                                Coding for Kids
                            </button>
                            <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full transition-colors">
                                Abuja Tutors
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
