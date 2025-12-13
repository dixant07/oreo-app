"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Zap, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCashfree } from '@/lib/hooks/useCashfree';
import { useUser } from '@/lib/contexts/AuthContext';

interface MembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

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

export function MembershipDialog({ open, onOpenChange }: MembershipDialogProps) {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl w-full rounded-3xl p-0 overflow-hidden border-0">
                <div className="bg-gradient-to-br from-[#FFF8F0] to-orange-50 p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                            Upgrade Your Experience
                        </DialogTitle>
                        <p className="text-center text-gray-500 mt-2 text-sm">
                            Choose the plan that fits your style.
                        </p>
                    </DialogHeader>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative p-5 rounded-2xl bg-white shadow-lg flex flex-col transition-all duration-300 hover:shadow-xl ${plan.popular ? 'ring-2 ring-orange-400 scale-[1.02]' : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-md">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-10 h-10 rounded-xl ${plan.color} flex items-center justify-center mb-4`}>
                                    {plan.icon}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                                <div className="flex items-baseline mb-4">
                                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500 ml-1 text-sm">{plan.period}</span>
                                </div>

                                <ul className="space-y-2 mb-6 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm">
                                            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-2.5 h-2.5 text-green-600" />
                                            </div>
                                            <span className="text-gray-600 font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full rounded-xl h-10 font-bold ${plan.buttonClass}`}
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

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Secure payment powered by Cashfree. Cancel anytime.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
