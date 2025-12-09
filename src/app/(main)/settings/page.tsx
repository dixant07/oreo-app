"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bell, Volume2, Shield, Eye, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
    const router = useRouter();

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

                <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

                <div className="space-y-6">
                    <Card className="bg-white rounded-3xl shadow-sm border-0 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-500" />
                            Notifications
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Receive notifications about game invites</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Email Notifications</p>
                                    <p className="text-sm text-gray-500">Receive updates via email</p>
                                </div>
                                <Switch />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white rounded-3xl shadow-sm border-0 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-blue-500" />
                            Audio & Video
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Microphone Access</p>
                                    <p className="text-sm text-gray-500">Allow access to microphone</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Camera Access</p>
                                    <p className="text-sm text-gray-500">Allow access to camera</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white rounded-3xl shadow-sm border-0 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-500" />
                            Privacy
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Profile Visibility</p>
                                    <p className="text-sm text-gray-500">Who can see your profile</p>
                                </div>
                                <select className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
                                    <option>Everyone</option>
                                    <option>Friends Only</option>
                                    <option>No One</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
