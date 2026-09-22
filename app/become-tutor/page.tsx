import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowRight, Wallet, CalendarCheck, BadgeCheck } from "lucide-react";

const benefits = [
    {
        icon: Wallet,
        title: "Earn on your schedule",
        description:
            "Set your own rates and availability. Teach home or online, part-time or full-time.",
    },
    {
        icon: CalendarCheck,
        title: "Bookings handled for you",
        description:
            "We match you with parents, handle scheduling and payments, so you can focus on teaching.",
    },
    {
        icon: BadgeCheck,
        title: "Get verified, get hired",
        description:
            "Our verification badge builds trust with parents and helps you stand out from the crowd.",
    },
];

export default function BecomeTutorPage() {
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
                                Become a SabiLearn Tutor
                            </h1>
                            <p
                                className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto"
                                style={{ fontFamily: "var(--font-inter)" }}
                            >
                                Join thousands of verified teachers earning more by teaching what
                                they love across Nigeria.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-6 mb-12">
                            {benefits.map((benefit) => (
                                <div
                                    key={benefit.title}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                                >
                                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                                        <benefit.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2
                                        className="text-lg font-bold text-secondary mb-2"
                                        style={{ fontFamily: "var(--font-outfit)" }}
                                    >
                                        {benefit.title}
                                    </h2>
                                    <p
                                        className="text-sm text-foreground/70 leading-relaxed"
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    >
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <Link
                                href="/onboarding/tutor"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] shadow-lg"
                            >
                                Start Your Application
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
