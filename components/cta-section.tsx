"use client";

import { useState, useEffect } from "react";

export function CTASection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const section = document.getElementById('cta-section');
        if (section) {
            const rect = section.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <div
                    id="cta-section"
                    onMouseMove={handleMouseMove}
                    className="relative rounded-[40px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #0A2540 0%, #1a4d5e 100%)',
                    }}
                >
                    {/* Grid Pattern */}
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

                    {/* Content */}
                    <div className="relative z-10 text-center py-16 md:py-20 px-6">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Ready to transform learning?
                        </h2>
                        <p className="text-base md:text-lg text-gray-300 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                            Join thousands of Nigerian parents and teachers building a smarter future together. Sign up takes less than 2 minutes.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors">
                                Find a Tutor
                            </button>
                            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors backdrop-blur-sm">
                                Apply as a Teacher
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
