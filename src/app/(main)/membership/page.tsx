"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Check, Crown, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MembershipPage() {
    const router = useRouter();

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: '/month',
            features: ['Basic Matchmaking', 'Standard Video Quality', 'Ad-supported'],
            color: 'bg-gray-100',
            textColor: 'text-gray-900',
            buttonVariant: 'outline' as const,
            icon: <Star className="w-6 h-6 text-gray-500" />
        },
        {
            name: 'Gold',
            price: '$9.99',
            period: '/month',
            features: ['Priority Matchmaking', 'HD Video Quality', 'No Ads', 'Exclusive Games'],
            color: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            buttonVariant: 'default' as const,
            popular: true,
            icon: <Zap className="w-6 h-6 text-yellow-600" />
        },
        {
            name: 'Diamond',
            price: '$19.99',
            period: '/month',
            features: ['Instant Matchmaking', '4K Video Quality', 'VIP Support', 'All Games Unlocked', 'Profile Badge'],
            color: 'bg-blue-100',
            textColor: 'text-blue-800',
            buttonVariant: 'default' as const,
            icon: <Crown className="w-6 h-6 text-blue-600" />
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFF8F0] p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-orange-100 text-gray-600"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade Your Experience</h1>
                    <p className="text-xl text-gray-500">Choose the plan that fits your gaming style.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`relative p-8 rounded-[2rem] border-0 shadow-xl flex flex-col ${plan.popular ? 'ring-4 ring-orange-400 scale-105' : 'bg-white'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl ${plan.color} flex items-center justify-center mb-6`}>
                                {plan.icon}
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                <span className="text-gray-500 ml-1">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full rounded-xl h-12 font-bold text-lg ${plan.name === 'Gold' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                        plan.name === 'Diamond' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                            'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                            >
                                {plan.name === 'Free' ? 'Current Plan' : 'Upgrade Now'}
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
