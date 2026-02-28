"use client";

import { MessageCircle, FileText, Shield, Bell, Paperclip, Send } from "lucide-react";
import Image from "next/image";

export function StayInLoopSection() {
    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left - Chat Interface */}
                    <div className="order-2 lg:order-1">
                        <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-md mx-auto">
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
                                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                                    <Image
                                        src="/avatar/male1.jpeg"
                                        alt="Mr. Chuka O."
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-xl text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Mr. Chuka O.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <p className="text-sm text-emerald-600 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                                            Online
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="p-6 space-y-4 min-h-[300px]"
                                style={{
                                    backgroundImage: `radial-gradient(circle, rgba(255, 107, 53, 0.15) 1px, transparent 1px)`,
                                    backgroundSize: '15px 15px'
                                }}
                            >
                                {/* Tutor Message */}
                                <div className="flex flex-col items-start">
                                    <div className="bg-gray-100 text-gray-900 rounded-3xl rounded-tl-md px-5 py-4 max-w-[85%]">
                                        <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                                            Good afternoon Mrs. Adeola. I have prepared the Mathematics past questions for today's session.
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 ml-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        2:14 PM
                                    </span>
                                </div>

                                {/* Parent Message */}
                                <div className="flex flex-col items-end">
                                    <div className="bg-primary text-white rounded-3xl rounded-tr-md px-5 py-4 max-w-[85%]">
                                        <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                                            Thank you! I will let him know. See you at 4 PM.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 mr-2">
                                        <span className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-inter)' }}>
                                            2:30 PM
                                        </span>
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg className="w-4 h-4 text-primary -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-primary transition-colors"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    />
                                    <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0">
                                        <Send className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                                In-App Messaging
                            </span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Stay in the Loop
                        </h2>

                        <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                            Communicate safely within the platform. Discuss lesson plans, share resources, and keep track of your child's progress without sharing personal phone numbers.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-gray-700" style={{ fontFamily: 'var(--font-inter)' }}>
                                    File sharing for assignments and past questions
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-gray-700" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Secure, private communication
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-gray-700" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Instant notifications on mobile and web
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
