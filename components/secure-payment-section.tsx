"use client";

import { Lock, CalendarCheck, CreditCard, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export function SecurePaymentSection() {
    const card1Ref = useRef<HTMLDivElement>(null);
    const card2Ref = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const card1 = card1Ref.current;
        const card2 = card2Ref.current;
        const section = sectionRef.current;

        if (!card1 || !card2 || !section) return;

        // Set initial state
        gsap.set(card1, { rotation: 6, transformOrigin: "center center" });
        gsap.set(card2, { rotation: -12, transformOrigin: "center center" });

        // Create scroll-triggered animations
        const tl1 = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
            }
        });

        const tl2 = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
            }
        });

        tl1.to(card1, { rotation: 366, ease: "none" });
        tl2.to(card2, { rotation: -372, ease: "none" });

        return () => {
            tl1.kill();
            tl2.kill();
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative py-16 md:py-24 px-4 overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540] via-[#0d3a5c] to-[#1a5c4d]" />

            <div className="relative max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-[60%_40%] gap-3 items-center">
                    {/* Left Content */}
                    <div className="text-white pl-3">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm font-medium">Secure Escrow Payments</span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Seamless Booking.<br />
                            Guaranteed Safety.
                        </h2>

                        {/* Description */}
                        <p className="text-base md:text-lg text-white/80 mb-10 max-w-xl" style={{ fontFamily: 'var(--font-inter)' }}>
                            Book sessions with ease using local payment methods. Your funds are held securely and only released to the teacher after the lesson is successfully completed.
                        </p>

                        {/* Features */}
                        <div className="space-y-6">
                            {/* Feature 1 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <CalendarCheck className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Live Availability Calendar
                                    </h3>
                                    <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-inter)' }}>
                                        See teacher's real-time schedule and book slots instantly.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Pay in Naira Seamlessly
                                    </h3>
                                    <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Support for cards, bank transfers, and USSD via secure gateways.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <RefreshCw className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Hassle-free Refunds
                                    </h3>
                                    <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-inter)' }}>
                                        If a lesson doesn't happen, get your money back easily.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Checkout Card */}
                    <div className="flex justify-center lg:justify-start mt-28 lg:mt-0 ">
                        <div className="relative">
                            {/* Background Card 1 - Rotates Clockwise */}
                            <div
                                ref={card1Ref}
                                className="absolute -right-6 -top-16 w-[368px] h-[380px] bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-[40px] blur-md will-change-transform"
                            />
                            {/* Background Card 2 - Rotates Counter-Clockwise */}
                            <div
                                ref={card2Ref}
                                className="absolute -right-6 -top-16 w-[368px] h-[380px] bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-[40px] blur-md will-change-transform"
                            />

                            {/* Main Checkout Card */}
                            <div className="relative bg-white rounded-3xl shadow-2xl p-5 w-[380px]">
                                {/* Header */}
                                <div className="mb-5">
                                    <h3 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Checkout
                                    </h3>
                                    <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Confirm your booking
                                    </p>
                                </div>

                                {/* Tutor Info */}
                                <div className="flex items-center gap-3 mb-5 pt-5 pb-5 border-t border-gray-100">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        <Image
                                            src="/avatar/female1.jpeg"
                                            alt="Chukwudi M."
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            Chukwudi M.
                                        </h4>
                                        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                            Math • Thursday, 4:00 PM
                                        </p>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="space-y-2.5 bg-slate-100/50 p-5  mb-5  rounded-2xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                            1 Hour Session
                                        </span>
                                        <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            ₦4,000
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                            Platform Fee
                                        </span>
                                        <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            ₦200
                                        </span>
                                    </div>
                                    <div className="pt-2.5 border-t border-gray-100 flex justify-between">
                                        <span className="font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            Total
                                        </span>
                                        <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                            ₦4,200
                                        </span>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                                    <Lock className="w-4 h-4" />
                                    Pay Securely
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
