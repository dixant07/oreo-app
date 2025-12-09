import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/friends/reject
 * Reject a friend request
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const userId = user.uid;
        const { requestId } = await request.json();

        const requestRef = db.collection('notifications').doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const data = requestDoc.data();
        if (!data || data.toUid !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await requestRef.update({ status: 'REJECTED' });

        await db.collection('users').doc(userId).update({
            'counters.friendRequests': admin.firestore.FieldValue.increment(-1)
        });

        return NextResponse.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
