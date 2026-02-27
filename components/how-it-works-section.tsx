"use client";

import { Search, Calendar, GraduationCap } from "lucide-react";

export function HowItWorksSection() {
    return (
        <section className="relative py-16 md:py-24 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Simple. Secure. Effective.
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                        Finding the right help shouldn't be hard. Our process is designed to give you<br className="hidden md:block" />
                        peace of mind.
                    </p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-[72px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                        style={{
                            left: 'calc(16.666% + 48px)',
                            right: 'calc(16.666% + 48px)',
                            backgroundImage: 'repeating-linear-gradient(to right, #d1d5db 0, #d1d5db 8px, transparent 8px, transparent 16px)'
                        }}
                    />

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center text-center">
                            {/* Icon Container */}
                            <div className="relative mb-6">
                                {/* Step Number Badge */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                                    1
                                </div>
                                {/* Icon Background */}
                                <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                    <Search className="w-10 h-10 text-emerald-600" />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Find Your Match
                            </h3>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                Filter by subject, location (home/online), and budget.<br />
                                View intro videos and read verified reviews.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center text-center">
                            {/* Icon Container */}
                            <div className="relative mb-6">
                                {/* Step Number Badge */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                                    2
                                </div>
                                {/* Icon Background */}
                                <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-200">
                                    <Calendar className="w-10 h-10 text-blue-600" />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Book & Pay Securely
                            </h3>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                Schedule sessions instantly. Payments are held securely<br />
                                in escrow until the lesson is completed.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center text-center">
                            {/* Icon Container */}
                            <div className="relative mb-6">
                                {/* Step Number Badge */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                                    3
                                </div>
                                {/* Icon Background */}
                                <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                    <GraduationCap className="w-10 h-10 text-emerald-600" />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Start Learning
                            </h3>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                Meet in person or via our optimized low-bandwidth<br />
                                video classroom. Track progress weekly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
