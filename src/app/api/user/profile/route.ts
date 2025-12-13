import { NextRequest, NextResponse } from 'next/server';
import { db, admin, auth } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

interface ProfileUpdateBody {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    gender?: string;
    location?: string;
    dob?: string;
    region?: string;
    language?: string;
    interests?: string[];
    avatarUrl?: string;
    isOnboarded?: boolean;
}

/**
 * POST /api/user/profile
 * Update user profile
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid } = user;
        const body: ProfileUpdateBody = await request.json();
        const { firstName, lastName, displayName, gender, location, dob, region, language, interests, avatarUrl, isOnboarded } = body;

        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (displayName) updateData.displayName = displayName;
        if (isOnboarded !== undefined) updateData.isOnboarded = isOnboarded;
        if (gender) updateData.gender = gender;
        if (location) updateData.location = location;
        if (dob) updateData.dob = dob;
        if (region) updateData.region = region;
        if (language) updateData.language = language;
        if (interests) updateData.interests = interests;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        await db.collection('users').doc(uid).update(updateData);

        // Set Custom User Claims for gender (used during matching)
        try {
            const userRecord = await auth.getUser(uid);
            const existingClaims = userRecord.customClaims || {};

            await auth.setCustomUserClaims(uid, {
                ...existingClaims,
                gender: updateData.gender || existingClaims.gender,
                location: updateData.location || existingClaims.location
            });
            console.log(`Custom claims updated for ${uid}:`, { ...existingClaims, ...updateData });
        } catch (claimError) {
            console.error('Failed to set custom claims:', claimError);
            // Continue, as DB update succeeded
        }

        return NextResponse.json({
            message: 'Profile updated',
            user: { ...user, ...updateData }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * GET /api/user/profile
 * Fetch user profile
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid } = user;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: { ...user, ...userDoc.data() }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/user/profile
 * Delete user account permanently
 */
export async function DELETE(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid } = user;

        // Delete from Firestore
        await db.collection('users').doc(uid).delete();

        // Delete from Firebase Auth
        await auth.deleteUser(uid);

        return NextResponse.json({
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
