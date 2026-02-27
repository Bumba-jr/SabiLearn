"use client";

import { CheckCircle, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// Nigerian names
const maleNames = [
    "Chukwudi M.", "Oluwaseun D.", "Tunde O.", "Emeka N.", "Ibrahim K.",
    "Adebayo S.", "Chijioke A.", "Yusuf M.", "Kunle F.", "Obinna C.",
];

const femaleNames = [
    "Amina S.", "Chioma O.", "Fatima A.", "Ngozi E.", "Blessing U.",
    "Aisha M.", "Funke D.", "Zainab H.", "Nneka I.", "Halima B.",
];

const degrees = [
    "B.Sc. Mathematics, Unilag",
    "M.Ed. English, ABU",
    "B.Sc. Computer Sci, UI",
    "B.Sc. Physics, UNIBEN",
    "M.Sc. Chemistry, UNN",
];

const subjectSets = [
    ["Mathematics", "Physics", "JAMB"],
    ["English Lang", "Literature", "WAEC"],
    ["Coding", "Robotics", "Basic Tech"],
    ["Chemistry", "Biology", "IGCSE"],
    ["Economics", "Accounting", "WAEC"],
];

function generateTutors(count: number) {
    const tutors = [];
    for (let i = 0; i < count; i++) {
        // Use index to determine gender consistently
        const isMale = i % 2 === 0;
        const gender = isMale ? "male" : "female";
        const maxImages = isMale ? 32 : 39;
        // Use index-based selection instead of random for consistent SSR/client rendering
        const imageNum = (i % maxImages) + 1;
        const names = isMale ? maleNames : femaleNames;
        const nameIndex = i % names.length;

        tutors.push({
            name: names[nameIndex],
            verified: true,
            rating: (4.5 + ((i % 5) * 0.1)).toFixed(1),
            degree: degrees[i % degrees.length],
            price: `₦${(3000 + ((i % 10) * 300)).toLocaleString()}`,
            subjects: subjectSets[i % subjectSets.length],
            image: `/avatar/${gender}${imageNum}.jpeg`,
        });
    }
    return tutors;
}

export function LearnFromBestSection() {
    const topRowRef = useRef<HTMLDivElement>(null);
    const bottomRowRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const tutorsGenerated = useRef(false);
    const topTutorsRef = useRef<any[]>([]);
    const bottomTutorsRef = useRef<any[]>([]);

    // Generate tutors only once
    if (!tutorsGenerated.current) {
        topTutorsRef.current = generateTutors(16);
        bottomTutorsRef.current = generateTutors(16);
        tutorsGenerated.current = true;
    }

    const topTutors = topTutorsRef.current;
    const bottomTutors = bottomTutorsRef.current;

    // Quadruple the tutors for seamless infinite scroll
    const topTutorsInfinite = [...topTutors, ...topTutors, ...topTutors, ...topTutors];
    const bottomTutorsInfinite = [...bottomTutors, ...bottomTutors, ...bottomTutors, ...bottomTutors];

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!topRowRef.current || !bottomRowRef.current || !sectionRef.current) return;

        // Set initial positions to hide loop edges behind fade overlays
        gsap.set(topRowRef.current, { x: "-25%" });
        gsap.set(bottomRowRef.current, { x: "-50%" }); // Start further left

        const ctx = gsap.context(() => {
            // Top row - scroll left
            gsap.to(topRowRef.current, {
                x: "-50%",
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                },
            });

            // Bottom row - scroll right (from -50% to -25%)
            gsap.to(bottomRowRef.current, {
                x: "-25%",
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative py-16 md:py-24 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-3" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Learn from the Best
                        </h2>
                        <p className="text-base md:text-lg text-foreground/70 max-w-2xl" style={{ fontFamily: 'var(--font-inter)' }}>
                            Every tutor on our platform undergoes a rigorous multi-step verification process,
                            including background checks and mock teaching sessions.
                        </p>
                    </div>
                    <button className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 transition-colors whitespace-nowrap">
                        View all tutors
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrolling Rows Container */}
                <div className="relative overflow-hidden">
                    {/* Fade Overlays - Narrower and more subtle */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-background via-background/50 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-background via-background/50 to-transparent z-10 pointer-events-none" />

                    {/* Top Row - Scrolls Left */}
                    <div className="mb-6 overflow-hidden">
                        <div ref={topRowRef} className="flex gap-6 will-change-transform">
                            {topTutorsInfinite.map((tutor, index) => (
                                <TutorCard key={`top-${index}`} tutor={tutor} />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Row - Scrolls Right */}
                    <div className="overflow-hidden">
                        <div ref={bottomRowRef} className="flex gap-6 will-change-transform">
                            {bottomTutorsInfinite.map((tutor, index) => (
                                <TutorCard key={`bottom-${index}`} tutor={tutor} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function TutorCard({ tutor }: { tutor: any }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] flex-shrink-0" style={{ width: '300px' }}>
            {/* Image */}
            <div className="relative h-64 bg-gray-100">
                <Image
                    src={tutor.image}
                    alt={tutor.name}
                    fill
                    className="object-cover"
                />
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1.5 flex items-center gap-1 shadow-md">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-gray-900">{tutor.rating}</span>
                </div>
                {/* Video Icon */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Name and Price */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {tutor.name}
                        </h3>
                        {tutor.verified && (
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-secondary" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {tutor.price}
                        </div>
                        <div className="text-xs text-gray-500">/ hour</div>
                    </div>
                </div>

                {/* Degree */}
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                    {tutor.degree}
                </p>

                {/* Subject Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.subjects.map((subject: string, idx: number) => (
                        <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                            {subject}
                        </span>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 transition-colors">
                        View Profile
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white text-sm font-semibold rounded-lg transition-colors">
                        Book Trial
                    </button>
                </div>
            </div>
        </div>
    );
}
