import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/friends/request
 * Send a friend request
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const fromUid = user.uid;
        const { toUid } = await request.json();

        if (fromUid === toUid) {
            return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
        }

        // Check if request already exists
        const existingRequest = await db.collection('notifications')
            .where('type', '==', 'friend_request')
            .where('fromUid', '==', fromUid)
            .where('toUid', '==', toUid)
            .get();

        if (!existingRequest.empty) {
            const reqData = existingRequest.docs[0].data();
            if (reqData.status === 'PENDING') {
                return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
            }
        }

        // Check if already friends
        const friendCheck = await db.collection('users')
            .doc(fromUid)
            .collection('friends')
            .doc(toUid)
            .get();

        if (friendCheck.exists) {
            return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        const batch = db.batch();
        const requestRef = db.collection('notifications').doc();

        batch.set(requestRef, {
            type: 'friend_request',
            fromUid,
            toUid,
            status: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Increment friendRequests counter for receiver
        const receiverRef = db.collection('users').doc(toUid);
        batch.update(receiverRef, {
            'counters.friendRequests': admin.firestore.FieldValue.increment(1)
        });

        await batch.commit();

        return NextResponse.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Send request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
