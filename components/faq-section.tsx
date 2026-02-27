"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "How are tutors verified?",
        answer: "All tutors undergo a rigorous verification process including background checks, credential verification (BVN, educational certificates), and mock teaching sessions. We verify their identity, qualifications, and teaching ability before they can join our platform."
    },
    {
        question: "How do payments work?",
        answer: "Payments are held securely in escrow when you book a session. The funds are only released to the tutor after the lesson is successfully completed. We support multiple payment methods including cards, bank transfers, and USSD. If a lesson doesn't happen, you get a full refund automatically."
    },
    {
        question: "Can I choose between home or online tutoring?",
        answer: "Yes! You have complete flexibility to choose between in-person home tutoring or online sessions via our optimized video classroom. You can filter tutors based on their availability for home visits or online teaching. Many tutors offer both options."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="relative py-16 md:py-24 px-4 bg-white">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-secondary mb-12" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Frequently Asked Questions
                </h2>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden transition-all"
                        >
                            {/* Question Button */}
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-base md:text-lg font-semibold text-gray-900 pr-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {/* Answer */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                    }`}
                            >
                                <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
