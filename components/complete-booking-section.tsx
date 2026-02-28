"use client";

import { useState } from "react";
import { CreditCard, Building2, Smartphone, Lock } from "lucide-react";

export function CompleteBookingSection() {
    const [selectedPayment, setSelectedPayment] = useState<"card" | "bank" | "ussd">("card");

    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Complete Booking
                    </h2>
                    <p className="text-base md:text-sl text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                        Secure checkout for your session with Oluwaseun A.
                    </p>
                </div>

                {/* Booking Form */}
                <div className="grid lg:grid-cols-[60%_40%] gap-0 max-w-4xl mx-auto border border-slate-300/20 rounded-2xl ">
                    {/* Left - Payment Method */}
                    <div className="bg-white border-r border-slate-400/20 p-6 md:p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Select Payment Method
                        </h3>

                        {/* Payment Options */}
                        <div className="space-y-3 mb-6">
                            {/* Card Payment */}
                            <button
                                onClick={() => setSelectedPayment("card")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPayment === "card"
                                    ? "border-secondary bg-secondary/5"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "card" ? "border-secondary" : "border-gray-300"
                                        }`}>
                                        {selectedPayment === "card" && (
                                            <div className="w-3 h-3 rounded-full bg-secondary" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Card Payment (Paystack)
                                    </span>
                                </div>
                                <CreditCard className="w-5 h-5 text-gray-400" />
                            </button>

                            {/* Bank Transfer */}
                            <button
                                onClick={() => setSelectedPayment("bank")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPayment === "bank"
                                    ? "border-secondary bg-secondary/5"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "bank" ? "border-secondary" : "border-gray-300"
                                        }`}>
                                        {selectedPayment === "bank" && (
                                            <div className="w-3 h-3 rounded-full bg-secondary" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Bank Transfer
                                    </span>
                                </div>
                                <Building2 className="w-5 h-5 text-gray-400" />
                            </button>

                            {/* USSD */}
                            <button
                                onClick={() => setSelectedPayment("ussd")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPayment === "ussd"
                                    ? "border-secondary bg-secondary/5"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "ussd" ? "border-secondary" : "border-gray-300"
                                        }`}>
                                        {selectedPayment === "ussd" && (
                                            <div className="w-3 h-3 rounded-full bg-secondary" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>
                                        USSD
                                    </span>
                                </div>
                                <Smartphone className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Card Details Form */}
                        {selectedPayment === "card" && (
                            <div className="space-y-4">
                                {/* Cardholder Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Mr. Adebayo"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    />
                                </div>

                                {/* Card Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Card Number
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                            style={{ fontFamily: 'var(--font-inter)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right - Session Summary */}
                    <div className=" rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Session Summary
                        </h3>

                        {/* Tutor Info */}
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                                O
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    Oluwaseun A.
                                </p>
                                <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Mathematics (WAEC)
                                </p>
                            </div>
                        </div>

                        {/* Session Details */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Date</span>
                                <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>Mon, 12 Oct 2023</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Time</span>
                                <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>4:00 PM - 6:00 PM</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Duration</span>
                                <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>2 hours</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Rate</span>
                                <span className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-inter)' }}>₦5,000/hr</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mb-6">
                            <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Total Due
                            </span>
                            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                ₦10,000
                            </span>
                        </div>

                        {/* Pay Button */}
                        <button className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Lock className="w-5 h-5" />
                            <span>Pay ₦10,000</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
