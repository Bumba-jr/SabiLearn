"use client";

import { CheckCircle, Shield, Star } from "lucide-react";
import { useState, useRef } from "react";

export function VerifiedTutorsSection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const sectionRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative py-20 md:py-28 px-4 overflow-hidden"
        >
            {/* Dark Background */}
            <div className="absolute inset-0 bg-[#0A2540]" />

            {/* Grid Pattern with Mouse Spotlight */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Interactive Spotlight Effect */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    background: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 107, 53, 0.35), transparent 40%)`,
                }}
            />

            {/* Brighter Grid Overlay on Hover */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    maskImage: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 60%)`,
                    WebkitMaskImage: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 60%)`,
                }}
            />

            <div className="relative max-w-5xl mx-auto text-center">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-8">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">100% Verified Tutors Nationwide</span>
                </div>

                {/* Main Heading */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Unlock Your Child's Potential<br />
                    with Nigeria's Top Educators
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                    Safe, vetted, and professional home and online tutoring tailored for WAEC, JAMB,<br className="hidden md:block" />
                    and individual academic growth.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors text-base">
                        Find a Teacher
                    </button>
                    <button className="px-8 py-4 bg-transparent hover:bg-white/5 text-white font-semibold rounded-xl border border-white/30 transition-colors text-base">
                        Become a Teacher
                    </button>
                </div>

                {/* Bottom Features */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
                    {/* Verified Teachers */}
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                            Verified Teachers
                        </span>
                    </div>

                    {/* Secure Payments */}
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                            Secure Payments
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                            Rated 4.8/5 Average
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
