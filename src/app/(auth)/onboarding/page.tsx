"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import data from '@/app/(main)/home/data.json';
import { onAuthStateChanged } from 'firebase/auth';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [customInterest, setCustomInterest] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        dob: '',
        gender: '',
        region: '',
        language: '',
        interests: [] as string[]
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const userData = data.user || {};

                        if (userData.isOnboarded) {
                            router.push('/home');
                            return;
                        }

                        setFormData(prev => ({
                            ...prev,
                            firstName: userData.firstName || (userData.name ? userData.name.split(' ')[0] : '') || '',
                            lastName: userData.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : '') || '',
                            displayName: userData.displayName || userData.name || '',
                            dob: userData.dob || '',
                            gender: userData.gender !== 'unknown' ? userData.gender : '',
                            region: userData.region !== 'unknown' ? userData.region : '',
                            language: userData.language || '',
                            interests: userData.interests || []
                        }));
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                } finally {
                    setFetching(false);
                }
            } else {
                // No user, redirect to login
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleAddCustomInterest = () => {
        if (!customInterest.trim()) return;
        if (formData.interests.includes(customInterest.trim())) {
            setCustomInterest('');
            return;
        }
        setFormData({ ...formData, interests: [...formData.interests, customInterest.trim()] });
        setCustomInterest('');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            const token = await user.getIdToken();

            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    displayName: formData.displayName,
                    dob: formData.dob,
                    gender: formData.gender,
                    region: formData.region,
                    language: formData.language,
                    interests: formData.interests,
                    isOnboarded: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            router.push('/home');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-orange-600">Complete Your Profile</CardTitle>
                    <CardDescription className="text-center">
                        Tell us a bit more about yourself to get better matches
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleUpdateProfile} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, gender: val })} value={formData.gender} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.genders.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="region">Region</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, region: val })} value={formData.region} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.regions.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, language: val })} value={formData.language} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.languages.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Interests (Select at least 1)</Label>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add custom interest..."
                                    value={customInterest}
                                    onChange={(e) => setCustomInterest(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomInterest();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={handleAddCustomInterest}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {['Gaming', 'Music', 'Travel', 'Tech', 'Art', 'Sports', 'Food', 'Movies', ...formData.interests.filter(i => !['Gaming', 'Music', 'Travel', 'Tech', 'Art', 'Sports', 'Food', 'Movies'].includes(i))].map(interest => (
                                    <div
                                        key={interest}
                                        onClick={() => {
                                            const current = formData.interests;
                                            if (current.includes(interest)) {
                                                setFormData({ ...formData, interests: current.filter(i => i !== interest) });
                                            } else {
                                                setFormData({ ...formData, interests: [...current, interest] });
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all border ${formData.interests.includes(interest)
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                            }`}
                                    >
                                        {interest}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 mt-6" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Profile'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
