"use client";

import { Star, MapPin, CheckCircle, Briefcase } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export function TutorProfilePage() {
    const pricingCardRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const leftColumnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const pricingCard = pricingCardRef.current;
        const section = sectionRef.current;
        const leftColumn = leftColumnRef.current;

        if (!pricingCard || !section || !leftColumn) return;

        // Calculate the distance the card should travel
        const leftColumnHeight = leftColumn.offsetHeight;
        const pricingCardHeight = pricingCard.offsetHeight;
        const distance = leftColumnHeight - pricingCardHeight;

        gsap.to(pricingCard, {
            y: distance > 0 ? distance : 0,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top center",
                end: "bottom center",
                scrub: 0.5,
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.vars.trigger === section) {
                    trigger.kill();
                }
            });
        };
    }, []);

    return (
        <section ref={sectionRef} className="py-16 md:py-24 bg-gray-50">
            {/* Section Header */}
            <div className="max-w-6xl mx-auto px-4 mb-12 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Featured Tutor Profile
                </h2>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                    Meet one of our top-rated tutors and see what makes them exceptional
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
                    {/* Left Column - Profile Details */}
                    <div ref={leftColumnRef} className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-transparent rounded-2xl p-6">
                            <div className="flex items-start gap-6">
                                {/* Profile Image */}
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                                    <Image
                                        src="/avatar/male1.jpeg"
                                        alt="Oluwaseun A."
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            Oluwaseun A.
                                        </h1>
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </span>
                                    </div>

                                    <p className="text-gray-600 mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Senior Mathematics & Physics Tutor
                                    </p>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="font-semibold text-gray-900">4.9</span>
                                            <span className="text-gray-500">(120 Reviews)</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span>Lagos (Willing to travel)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About Me */}
                        <div className="bg-transparent rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                About Me
                            </h2>
                            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                                I am a dedicated educator with over 5 years of experience helping students overcome their fear of numbers. My teaching philosophy centers around practical applications of mathematical concepts. I have successfully prepared over 200 students for WAEC and JAMB, with a 95% distinction rate.
                            </p>
                        </div>

                        {/* Subjects & Levels */}
                        <div className="bg-transparent rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Subjects & Levels
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-primary/10 p-4 rounded-2xl  ">
                                    <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Mathematics
                                    </h3>
                                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                        JSS 1-3, SS 1-3, WAEC, JAMB
                                    </p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-2xl  ">
                                    <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Physics
                                    </h3>
                                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                        SS 1-3, WAEC, JAMB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-transparent rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Experience
                            </h2>
                            <div className="relative">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

                                <div className="space-y-6">
                                    {/* Experience 1 */}
                                    <div className="flex gap-4 relative">
                                        <div className="flex-shrink-0 relative z-10">
                                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                                Senior Science Tutor
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                                Excel Academy, Lagos • 2019 - Present
                                            </p>
                                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                                Leading the physics department and coordinating external exam preparations.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Experience 2 */}
                                    <div className="flex gap-4 relative">
                                        <div className="flex-shrink-0 relative z-10">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-gray-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                                Mathematics Tutor
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                                Private Tutoring, Lagos • 2017 - 2019
                                            </p>
                                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                                Provided one-on-one tutoring for JAMB and WAEC candidates with 90% success rate.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Experience 3 */}
                                    <div className="flex gap-4 relative">
                                        <div className="flex-shrink-0 relative z-10">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-gray-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                                Teaching Assistant
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                                University of Lagos • 2015 - 2017
                                            </p>
                                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                                Assisted in undergraduate mathematics courses and conducted tutorial sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Card */}
                    <div>
                        <div ref={pricingCardRef} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 will-change-transform">
                            {/* Price */}
                            <div className="mb-6">
                                <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    ₦5,000
                                    <span className="text-base font-normal text-gray-500">/hour</span>
                                </div>
                            </div>

                            {/* Availability Snapshot */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    Availability Snapshot
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {['Mon', 'Wed', 'Fri', 'Sat'].map((day) => (
                                        <div
                                            key={day}
                                            className="text-center py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Book Button */}
                            <button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
                                Book a Session
                            </button>

                            {/* Send Message Button */}
                            <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 transition-colors">
                                Send Message
                            </button>

                            {/* Security Note */}
                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Payments secured by fintech infrastructure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
