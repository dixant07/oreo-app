import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/friends/accept
 * Accept a friend request
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
        if (!data || data.toUid !== userId || data.type !== 'friend_request') {
            return NextResponse.json({ error: 'Unauthorized or Invalid Type' }, { status: 403 });
        }

        if (data.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
        }

        const fromUid = data.fromUid;

        const [userDoc, senderDoc] = await Promise.all([
            db.collection('users').doc(userId).get(),
            db.collection('users').doc(fromUid).get()
        ]);

        const userData = userDoc.data();
        const senderData = senderDoc.data();

        const batch = db.batch();

        batch.update(requestRef, { status: 'ACCEPTED' });

        const userFriendRef = db.collection('users').doc(userId).collection('friends').doc(fromUid);
        const senderFriendRef = db.collection('users').doc(fromUid).collection('friends').doc(userId);

        batch.set(userFriendRef, {
            uid: fromUid,
            name: senderData?.name || '',
            avatarUrl: senderData?.avatarUrl || '',
            status: 'accepted',
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.set(senderFriendRef, {
            uid: userId,
            name: userData?.name || '',
            avatarUrl: userData?.avatarUrl || '',
            status: 'accepted',
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.update(db.collection('users').doc(userId), {
            'counters.friendRequests': admin.firestore.FieldValue.increment(-1)
        });

        await batch.commit();

        return NextResponse.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
