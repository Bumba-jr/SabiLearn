"use client";

import { useState } from "react";
import { Clock, CheckCircle, Calendar, DollarSign, Users, BarChart3 } from "lucide-react";

export function DashboardSection() {
    const [activeTab, setActiveTab] = useState<"parent" | "teacher">("parent");

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Everything in One Place
                    </h2>
                    <p className="text-base md:text-sl text-gray-600 max-w-2xl mx-auto mb-8" style={{ fontFamily: 'var(--font-inter)' }}>
                        Dedicated interfaces for parents to track progress, and for teachers to manage their business efficiently.
                    </p>

                    {/* Tab Buttons */}
                    <div className="inline-flex bg-gray-100/50 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("parent")}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "parent"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Parent Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab("teacher")}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "teacher"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600/80 hover:text-gray-900"
                                }`}
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Teacher Dashboard
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className=" rounded-3xl p-0 md:p-5 border-1 border-slate-500/30 shadow-xl">
                    {activeTab === "parent" ? (
                        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                            {/* Left Sidebar */}
                            <div className="rounded-2xl p-6 h-fit">
                                <div className="mb-6 bg-blue-600/5 p-4 rounded-2xl ">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Student: Emeka B.
                                    </h3>
                                    <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Grade 10 • Science Focus
                                    </p>
                                </div>

                                <nav className="space-y-2">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-lg">
                                        <BarChart3 className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Overview</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <Calendar className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Schedule</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <BarChart3 className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Progress Reports</span>
                                    </div>
                                </nav>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-2xl p-6 md:p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    This Week's Overview
                                </h3>

                                {/* Stats Grid */}
                                <div className="grid md:grid-cols-2 gap-4 mb-8">
                                    <div className="border border-gray-200 rounded-xl p-6">
                                        <div className="flex flex-col items-start gap-2 text-blue-500 mb-2">
                                            <div className="bg-blue-500/20 p-2 rounded-full"><Clock className="w-5 h-5" /></div>
                                            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Hours Learned</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>4.5 hrs</p>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl p-6">
                                        <div className="flex flex-col items-start gap-2 text-emerald-500 mb-2">
                                            <div className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle className="w-5 h-5" /></div>
                                            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Tasks Completed</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>12/15</p>
                                    </div>
                                </div>

                                {/* Recent Feedback */}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Recent Feedback
                                    </h4>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                C
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                                        Mr. Chukwudi (Math)
                                                    </p>
                                                    <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>Yesterday</span>
                                                </div>
                                                <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                                                    "Emeka grasped the concepts of quadratic equations very well today. We need to focus slightly more on factoring next session."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                            {/* Left Sidebar */}
                            <div className="bg-white rounded-2xl p-6 h-fit">
                                <div className="mb-6 bg-blue-600/5 p-4 rounded-2xl  ">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Teacher Dashboard
                                    </h3>
                                    <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Pro Tutor Status
                                    </p>
                                </div>

                                <nav className="space-y-2">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-lg">
                                        <DollarSign className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Earnings</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <Users className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>My Students</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <Calendar className="w-5 h-5" />
                                        <span className="font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Availability</span>
                                    </div>
                                </nav>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-2xl p-6 md:p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    Earnings Overview
                                </h3>

                                {/* Balance Card */}
                                <div className="bg-secondary rounded-2xl p-6 mb-8">
                                    <p className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Available Balance
                                    </p>
                                    <p className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        ₦45,000
                                    </p>
                                    <button className="bg-white text-secondary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                                        Withdraw to Bank
                                    </button>
                                </div>

                                {/* Upcoming Classes */}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        Upcoming Classes
                                    </h4>
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold">
                                                    E
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                                        Emeka B.
                                                    </p>
                                                    <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                                        Further Math
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>4:00 PM</p>
                                                <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>Today</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
