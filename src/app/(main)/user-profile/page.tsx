"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Settings, CreditCard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/lib/contexts/NetworkContext';

export default function UserProfilePage() {
    const router = useRouter();
    const { user } = useNetwork();

    return (
        <div className="min-h-screen bg-[#FFF8F0] p-8 font-sans">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-orange-100 text-gray-600"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>

                <Card className="bg-white rounded-3xl shadow-xl overflow-hidden border-0">
                    <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-between items-end">
                            <div className="h-32 w-32 rounded-full bg-white p-1 shadow-lg">
                                <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                                Edit Profile
                            </Button>
                        </div>

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">{user?.displayName}</h1>
                            <p className="text-gray-500">{user?.email}</p>
                        </div>

                        <div className="grid gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Personal Information</h3>
                                    <p className="text-sm text-gray-500">Update your personal details</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Account Settings</h3>
                                    <p className="text-sm text-gray-500">Manage your account preferences</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
