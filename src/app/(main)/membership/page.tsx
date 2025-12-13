"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Crown, Star, Zap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCashfree } from '@/lib/hooks/useCashfree';
import { useUser } from '@/lib/contexts/AuthContext';

const plans = [
    {
        id: 'FREE' as const,
        name: 'Free',
        price: '₹0',
        period: '/month',
        features: ['50 Matches/day', 'Standard Video Quality', 'Ad-supported'],
        color: 'bg-gray-100',
        textColor: 'text-gray-900',
        icon: <Star className="w-6 h-6 text-gray-500" />,
        buttonClass: 'bg-gray-100 hover:bg-gray-200 text-gray-900'
    },
    {
        id: 'GOLD' as const,
        name: 'Gold',
        price: '₹199',
        period: '/month',
        features: ['200 Matches/day', 'HD Video Quality', 'No Ads', 'Gender Filter'],
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        popular: true,
        icon: <Zap className="w-6 h-6 text-yellow-600" />,
        buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white'
    },
    {
        id: 'DIAMOND' as const,
        name: 'Diamond',
        price: '₹499',
        period: '/month',
        features: ['Unlimited Matches', '4K Video Quality', 'VIP Support', 'All Filters', 'Profile Badge'],
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: <Crown className="w-6 h-6 text-blue-600" />,
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
];

export default function MembershipPage() {
    const router = useRouter();
    const { profile } = useUser();
    const { initiatePayment, isLoading, error, isScriptLoaded } = useCashfree();

    const currentTier = profile?.subscription?.tier?.toUpperCase() || 'FREE';

    const handleUpgrade = async (planId: 'GOLD' | 'DIAMOND') => {
        await initiatePayment(planId);
    };

    const getButtonText = (planId: string) => {
        if (planId === 'FREE') return 'Current Plan';
        if (currentTier === planId) return 'Current Plan';
        if (isLoading) return 'Processing...';
        return 'Upgrade Now';
    };

    const isButtonDisabled = (planId: string) => {
        if (planId === 'FREE') return true;
        if (currentTier === planId) return true;
        if (isLoading) return true;
        if (!isScriptLoaded) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-orange-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-4 hover:bg-orange-100 text-gray-600"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Upgrade Your Experience</h1>
                    <p className="text-lg text-gray-500">Choose the plan that fits your gaming style.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center max-w-md mx-auto">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-6 rounded-3xl bg-white shadow-xl flex flex-col transition-all duration-300 hover:shadow-2xl ${plan.popular ? 'ring-2 ring-orange-400 scale-[1.02]' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-2xl ${plan.color} flex items-center justify-center mb-5`}>
                                {plan.icon}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-5">
                                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                <span className="text-gray-500 ml-1 text-sm">{plan.period}</span>
                            </div>

                            <ul className="space-y-3 mb-6 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm">
                                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full rounded-xl h-11 font-bold ${plan.buttonClass}`}
                                disabled={isButtonDisabled(plan.id)}
                                onClick={() => {
                                    if (plan.id !== 'FREE') {
                                        handleUpgrade(plan.id);
                                    }
                                }}
                            >
                                {isLoading && plan.id !== 'FREE' && currentTier !== plan.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                {getButtonText(plan.id)}
                            </Button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-gray-400 mt-8">
                    Secure payment powered by Cashfree. Cancel anytime.
                </p>
            </div>
        </div>
    );
}
