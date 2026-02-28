import { Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12">
                    {/* Left - Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                SabiLearn
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 max-w-xs" style={{ fontFamily: 'var(--font-inter)' }}>
                            Nigeria's most trusted marketplace connecting dedicated students with verified expert tutors.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                                <Twitter className="w-5 h-5 text-gray-700" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                                <Instagram className="w-5 h-5 text-gray-700" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                                <Linkedin className="w-5 h-5 text-gray-700" />
                            </a>
                        </div>
                    </div>

                    {/* For Students */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                            For Students
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Find Tutors
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    How it Works
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Success Stories
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* For Teachers */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                            For Teachers
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Apply to Teach
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Tutor Rules
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Teacher Dashboard
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Help Center
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Company
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Safety & Trust
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center" style={{ fontFamily: 'var(--font-inter)' }}>
                        &copy; 2024 SabiLearn Platform Ltd. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
