"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
    {
        quote: "My daughter's JAMB score improved drastically thanks to the structured learning from Mr. Chukwuemeka. Finding a verified tutor gave us total peace of mind.",
        author: "Mrs. Adebayo, Parent in Lagos"
    },
    {
        quote: "The online sessions were seamless and my son's confidence in Mathematics grew tremendously. The tutor was patient and professional throughout.",
        author: "Mr. Okonkwo, Parent in Abuja"
    },
    {
        quote: "I was skeptical at first, but the verification process and escrow payment system made me feel secure. My daughter passed her WAEC with flying colors!",
        author: "Mrs. Ibrahim, Parent in Port Harcourt"
    }
];

function StarIcon3D({ position, color }: { position: [number, number, number], color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    const starShape = new THREE.Shape();
    const outerRadius = 0.5;
    const innerRadius = 0.2;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
    }
    starShape.closePath();

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
            <mesh ref={meshRef} position={position}>
                <extrudeGeometry args={[starShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05 }]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
        </Float>
    );
}

function CheckIcon3D({ position, color }: { position: [number, number, number], color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <Float speed={2.5} rotationIntensity={0.5} floatIntensity={2}>
            <group position={position}>
                <mesh ref={meshRef}>
                    <torusGeometry args={[0.4, 0.1, 16, 32]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.1, -0.1, 0.1]} rotation={[0, 0, -0.8]}>
                    <boxGeometry args={[0.5, 0.1, 0.1]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
        </Float>
    );
}

function AwardIcon3D({ position, color }: { position: [number, number, number], color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <Float speed={2.2} rotationIntensity={0.5} floatIntensity={2}>
            <group position={position}>
                <mesh ref={meshRef}>
                    <cylinderGeometry args={[0.4, 0.5, 0.3, 32]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <coneGeometry args={[0.4, 0.3, 32]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
        </Float>
    );
}

function HeartIcon3D({ position, color }: { position: [number, number, number], color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
        }
    });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
    heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1);
    heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0);
    heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0);

    return (
        <Float speed={2.8} rotationIntensity={0.5} floatIntensity={2}>
            <mesh ref={meshRef} position={position} scale={0.5}>
                <extrudeGeometry args={[heartShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1 }]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
        </Float>
    );
}

export function TestimonialSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const quoteIconRef = useRef<SVGSVGElement>(null);
    const quoteTextRef = useRef<HTMLParagraphElement>(null);
    const authorRef = useRef<HTMLDivElement>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    // Auto-play functionality
    useEffect(() => {
        autoPlayRef.current = setInterval(() => {
            nextTestimonial();
        }, 5000);

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, []);

    // Scroll-triggered entrance animation
    useEffect(() => {
        if (typeof window === "undefined") return;

        const section = sectionRef.current;
        const quoteIcon = quoteIconRef.current;
        const quoteText = quoteTextRef.current;
        const author = authorRef.current;

        if (!section || !quoteIcon || !quoteText || !author) return;

        gsap.set(quoteIcon, { scale: 0, opacity: 0, rotation: -180 });
        gsap.set(quoteText, { y: 30, opacity: 0 });
        gsap.set(author, { y: 20, opacity: 0 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 70%",
                end: "top 30%",
                toggleActions: "play none none reverse",
            }
        });

        tl.to(quoteIcon, {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
        })
            .to(quoteText, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
            }, "-=0.3")
            .to(author, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power2.out",
            }, "-=0.4");

        return () => {
            tl.kill();
        };
    }, []);

    // Parallax scroll animation for 3D icons
    useEffect(() => {
        if (typeof window === "undefined") return;

        const section = sectionRef.current;
        const canvasContainer = canvasContainerRef.current;

        if (!section || !canvasContainer) return;

        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            gsap.to(canvasContainer, {
                y: 200,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                    invalidateOnRefresh: true,
                }
            });

            ScrollTrigger.refresh();
        }, 100);

        return () => {
            clearTimeout(timer);
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.vars.trigger === section) {
                    trigger.kill();
                }
            });
        };
    }, []);

    // Slide animation when testimonial changes
    useEffect(() => {
        if (!quoteTextRef.current || !authorRef.current) return;

        const tl = gsap.timeline();

        tl.to([quoteTextRef.current, authorRef.current], {
            x: -50,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
        })
            .set([quoteTextRef.current, authorRef.current], {
                x: 50,
            })
            .to([quoteTextRef.current, authorRef.current], {
                x: 0,
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
            });

        return () => {
            tl.kill();
        };
    }, [currentIndex]);

    return (
        <section ref={sectionRef} className="relative py-16 md:py-24 px-4 bg-[#0A2540] overflow-hidden">
            {/* 3D Floating Icons with Scroll Animation */}
            <div className="absolute inset-0 pointer-events-none">
                <div ref={canvasContainerRef} className="absolute inset-0 opacity-70 will-change-transform">
                    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} />
                        <Suspense fallback={null}>
                            <StarIcon3D position={[-3, 2, 0]} color="#FF6B35" />
                            <CheckIcon3D position={[3, 1, 0]} color="#10b981" />
                            <AwardIcon3D position={[-2, -2, 0]} color="#fbbf24" />
                            <HeartIcon3D position={[2.5, -1.5, 0]} color="#f43f5e" />
                        </Suspense>
                    </Canvas>
                </div>
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Quote Icon */}
                <div className="mb-8">
                    <svg
                        ref={quoteIconRef}
                        className="w-16 h-16 mx-auto text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                    </svg>
                </div>

                {/* Testimonial Text - Fixed Height */}
                <blockquote className="mb-8 h-48 md:h-40 flex items-center justify-center">
                    <p
                        ref={quoteTextRef}
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-relaxed line-clamp-4"
                        style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                        "{testimonials[currentIndex].quote}"
                    </p>
                </blockquote>

                {/* Author - Fixed Height */}
                <div className="h-8 flex items-center justify-center">
                    <div
                        ref={authorRef}
                        className="text-white/80 text-base md:text-lg"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        — {testimonials[currentIndex].author}
                    </div>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-8">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index);
                                if (autoPlayRef.current) {
                                    clearInterval(autoPlayRef.current);
                                    autoPlayRef.current = setInterval(() => {
                                        nextTestimonial();
                                    }, 5000);
                                }
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                ? 'bg-primary w-8'
                                : 'bg-white/30 hover:bg-white/50'
                                }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
