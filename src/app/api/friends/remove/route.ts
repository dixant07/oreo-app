import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/friends/remove
 * Removes a friend connection between two users
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid } = user;
        const body = await request.json();
        const { targetUid } = body;

        if (!targetUid) {
            return NextResponse.json({ error: 'Target UID matches required' }, { status: 400 });
        }

        const batch = db.batch();

        const myFriendRef = db.collection('users').doc(uid).collection('friends').doc(targetUid);
        const theirFriendRef = db.collection('users').doc(targetUid).collection('friends').doc(uid);

        batch.delete(myFriendRef);
        batch.delete(theirFriendRef);

        await batch.commit();

        return NextResponse.json({ message: 'Friend removed' });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Remove friend error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
