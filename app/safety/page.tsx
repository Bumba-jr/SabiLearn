import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ShieldCheck, UserCheck, Lock, FileCheck } from "lucide-react";

const safetyPoints = [
    {
        icon: UserCheck,
        title: "Verified Tutors",
        description:
            "Every tutor undergoes identity verification (BVN), credential checks, and a mock teaching session before they can accept bookings.",
    },
    {
        icon: ShieldCheck,
        title: "Secure Payments",
        description:
            "Your payment is held securely and only released to the tutor after the lesson is completed. No cash handoffs, no hidden fees.",
    },
    {
        icon: Lock,
        title: "Private by Default",
        description:
            "Your personal details and your child's information are never shared with tutors beyond what is needed for lessons.",
    },
    {
        icon: FileCheck,
        title: "Ongoing Reviews",
        description:
            "Lessons are reviewed and rated by parents, and tutors who fall below our standards are removed from the platform.",
    },
];

export default function SafetyPage() {
    return (
        <>
            <Header />
            <main>
                <section className="py-16 md:py-24 px-4 bg-background">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12 md:mb-16">
                            <h1
                                className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-4"
                                style={{ fontFamily: "var(--font-outfit)" }}
                            >
                                Safety at SabiLearn
                            </h1>
                            <p
                                className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto"
                                style={{ fontFamily: "var(--font-inter)" }}
                            >
                                Your child's safety and your peace of mind come first. Here is how we
                                protect every family on the platform.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {safetyPoints.map((point) => (
                                <div
                                    key={point.title}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
                                >
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                                        <point.icon className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h2
                                        className="text-lg md:text-xl font-bold text-secondary mb-2"
                                        style={{ fontFamily: "var(--font-outfit)" }}
                                    >
                                        {point.title}
                                    </h2>
                                    <p
                                        className="text-sm md:text-base text-foreground/70 leading-relaxed"
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    >
                                        {point.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
