import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * GET /api/friends/requests
 * Get pending friend requests for authenticated user
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const requests = await db.collection('notifications')
            .where('toUid', '==', user.uid)
            .where('type', '==', 'friend_request')
            .where('status', '==', 'PENDING')
            .get();

        const requestList = [];
        for (const doc of requests.docs) {
            const data = doc.data();
            const senderDoc = await db.collection('users').doc(data.fromUid).get();
            requestList.push({
                id: doc.id,
                ...data,
                sender: senderDoc.data()
            });
        }

        return NextResponse.json(requestList);
    } catch (error) {
        console.error('Get requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
