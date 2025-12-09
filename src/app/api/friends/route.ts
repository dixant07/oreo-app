import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * GET /api/friends
 * Get list of friends for authenticated user
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const friendsSnapshot = await db.collection('users')
            .doc(user.uid)
            .collection('friends')
            .get();

        const friends = friendsSnapshot.docs.map(doc => doc.data());

        return NextResponse.json(friends);
    } catch (error) {
        console.error('Get friends error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
