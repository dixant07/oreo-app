"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Camera, Trash2, Calendar, MapPin, Globe, Loader2, Save, X, Shield, Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { toast } from 'sonner';
import { storage } from '@/lib/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TIERS, getTier } from '@/lib/services/tiers';
import homeData from '@/app/(main)/home/data.json';

export default function UserProfilePage() {
    const router = useRouter();
    const { user: authUser } = useNetwork();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Profile Data State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        gender: '',
        dob: '',
        region: '',
        language: '',
        interests: '',
        avatarUrl: '',
        membershipTier: 'FREE'
    });
    const [originalData, setOriginalData] = useState(formData); // Store original data for cancel

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch User Data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!authUser) return;

            try {
                const token = await authUser.getIdToken();
                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const userData = data.user;
                    const mappedData = {
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        displayName: userData.displayName || '',
                        email: userData.email || '',
                        gender: userData.gender || '',
                        dob: userData.dob || '',
                        region: userData.region || '',
                        language: userData.language || '',
                        interests: Array.isArray(userData.interests) ? userData.interests.join(', ') : (userData.interests || ''),
                        avatarUrl: userData.avatarUrl || userData.photoURL || '',
                        membershipTier: userData.tier || 'FREE' // Assuming 'tier' field
                    };
                    setFormData(mappedData);
                    setOriginalData(mappedData);
                } else {
                    console.error('Failed to load profile:', response.statusText);
                    toast.error('Failed to load profile');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile');
            } finally {
                setLoading(false);
            }
        };

        if (authUser) {
            fetchProfile();
        }
    }, [authUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setFormData(originalData);
        setIsEditing(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !authUser) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `users/${authUser.uid}/profile_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, avatarUrl: downloadURL }));
            setOriginalData(prev => ({ ...prev, avatarUrl: downloadURL })); // Update original too as image saves immediately

            // Auto-save the image update
            const token = await authUser.getIdToken();
            await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl: downloadURL })
            });

            toast.success('Profile picture updated');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!authUser) return;
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean)
            };

            const token = await authUser.getIdToken();
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                // Update form data with returned user data to ensure sync
                if (data.user) {
                    // preserve existing values, just update what server returned
                    setOriginalData(formData); // Update original data to match saved state
                }
                toast.success('Profile updated successfully');
                setIsEditing(false);
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!authUser) return;
        if (!window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const token = await authUser.getIdToken();
            const response = await fetch('/api/user/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Account deleted');
                router.push('/');
            } else {
                toast.error('Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Error deleting account');
        }
    };

    const getMembershipBadge = () => {
        const tier = TIERS[formData.membershipTier];
        const isPremium = formData.membershipTier === 'GOLD' || formData.membershipTier === 'DIAMOND';

        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-transparent' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {isPremium ? <Medal className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {tier ? tier.name : 'Free Member'}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0] p-4 font-sans flex justify-center">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-900 md:hidden">User Profile</h1>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-orange-100 text-gray-600 -ml-2 hidden md:flex"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>

                <Card className="bg-white rounded-2xl shadow-sm overflow-hidden border-0 mb-6">
                    {/* Cover Photo */}
                    <div className="h-28 bg-gradient-to-r from-orange-400 to-red-500 relative">
                        {/* Membership Badge */}
                        <div className="absolute top-3 right-3">
                            {getMembershipBadge()}
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        {/* Profile Picture Section */}
                        <div className="relative -mt-12 mb-5 flex flex-col sm:flex-row items-center sm:items-end gap-4">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md relative overflow-hidden">
                                    <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-300" />
                                        )}
                                    </div>

                                    {/* Upload Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                                        onClick={() => fileInputRef.current?.click()}>
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center sm:text-left flex-1 pb-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{formData.displayName || 'User'}</h1>
                                    <p className="text-sm text-gray-500">{formData.email}</p>
                                </div>
                                {!isEditing && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        size="sm"
                                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 h-9 text-sm"
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 mt-6">
                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Display Name</Label>
                                {isEditing ? (
                                    <Input name="displayName" value={formData.displayName} onChange={handleChange} className="bg-gray-50 h-9 text-sm" />
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 text-sm">{formData.displayName}</div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Email (Cannot Change)</Label>
                                <div className="px-3 py-2 bg-gray-100/50 rounded-lg font-medium text-gray-500 flex items-center gap-2 text-sm">
                                    <span className="truncate">{formData.email}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Full Name</Label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Input placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-gray-50 h-9 text-sm" />
                                        <Input placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-gray-50 h-9 text-sm" />
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 text-sm">
                                        {formData.firstName} {formData.lastName}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Date of Birth</Label>
                                {isEditing ? (
                                    <Input type="date" name="dob" value={formData.dob} onChange={handleChange} className="bg-gray-50 h-9 text-sm" />
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 flex items-center gap-2 text-sm">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {formData.dob || 'Not set'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Gender</Label>
                                {isEditing ? (
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Gender</option>
                                        {homeData.genders.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 capitalize text-sm">
                                        {homeData.genders.find(g => g.id === formData.gender)?.label || formData.gender || 'Not set'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Region</Label>
                                {isEditing ? (
                                    <select
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Region</option>
                                        {homeData.regions.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 flex items-center gap-2 text-sm">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        {homeData.regions.find(r => r.id === formData.region)?.label || formData.region || 'Not set'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Language</Label>
                                {isEditing ? (
                                    <select
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Language</option>
                                        {homeData.languages.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium text-gray-900 flex items-center gap-2 text-sm">
                                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                                        {homeData.languages.find(l => l.id === formData.language)?.label || formData.language || 'Not set'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Interests</Label>
                                {isEditing ? (
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-input min-h-[80px]">
                                        {formData.interests.split(',').filter(Boolean).map((interest, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                {interest.trim()}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.interests.split(',').map(s => s.trim()).filter(Boolean);
                                                        const updated = current.filter((_, idx) => idx !== i);
                                                        setFormData(prev => ({ ...prev, interests: updated.join(', ') }));
                                                    }}
                                                    className="hover:text-orange-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            placeholder="Type and press Enter..."
                                            className="bg-transparent text-sm outline-none flex-1 min-w-[120px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val) {
                                                        const current = formData.interests.split(',').map(s => s.trim()).filter(Boolean);
                                                        if (!current.includes(val)) {
                                                            setFormData(prev => ({ ...prev, interests: [...current, val].join(', ') }));
                                                        }
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {formData.interests ? formData.interests.split(',').map((tag, i) => (
                                            <span key={i} className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                {tag.trim()}
                                            </span>
                                        )) : (
                                            <span className="text-gray-400 italic text-sm">No interests added</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-9"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white min-w-[100px] h-9"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Delete Account Section */}
                <div className="flex justify-center mt-8 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAccount}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Permanently Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
