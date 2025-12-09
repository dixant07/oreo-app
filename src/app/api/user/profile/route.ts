import { NextRequest, NextResponse } from 'next/server';
import { db, admin, auth } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

interface ProfileUpdateBody {
    gender?: string;
    location?: string;
    dob?: string;
    region?: string;
    language?: string;
    interests?: string[];
    avatarUrl?: string;
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
        const { gender, location, dob, region, language, interests, avatarUrl } = body;

        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
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
