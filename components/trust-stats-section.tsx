"use client";

import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export function TrustStatsSection() {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.3,
    });

    return (
        <section ref={ref} className="relative py-16 md:py-20 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Heading */}
                <div className={`text-center mb-12 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                        Trusted by thousands of Nigerian families
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Stat 1 */}
                    <div className={`text-center transition-all duration-1000 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="text-4xl md:text-5xl font-bold text-secondary mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {inView && <CountUp end={5000} duration={3.5} separator="," />}
                            {inView && "+"}
                        </div>
                        <div className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Active Students
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className={`text-center transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="text-4xl md:text-5xl font-bold text-secondary mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {inView && <CountUp end={1200} duration={3.5} separator="," />}
                            {inView && "+"}
                        </div>
                        <div className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Verified Tutors
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className={`text-center transition-all duration-1000 delay-300 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="text-4xl md:text-5xl font-bold text-secondary mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {inView && <CountUp end={4.9} duration={3.5} decimals={1} />}
                            {inView && "/5"}
                        </div>
                        <div className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Average Rating
                        </div>
                    </div>

                    {/* Stat 4 */}
                    <div className={`text-center transition-all duration-1000 delay-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="text-4xl md:text-5xl font-bold text-secondary mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {inView && <CountUp end={100} duration={3.5} />}
                            {inView && "%"}
                        </div>
                        <div className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Secure Payments
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
