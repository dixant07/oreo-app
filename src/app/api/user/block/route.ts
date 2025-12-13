import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/user/block
 * Blocks a user, removes friend connection, and hides/deletes chat.
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

        // 1. Add to blocked collection
        const blockRef = db.collection('users').doc(uid).collection('blocked').doc(targetUid);
        batch.set(blockRef, {
            uid: targetUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Remove friend connections
        const myFriendRef = db.collection('users').doc(uid).collection('friends').doc(targetUid);
        const theirFriendRef = db.collection('users').doc(targetUid).collection('friends').doc(uid);
        batch.delete(myFriendRef);
        batch.delete(theirFriendRef);

        // 3. Delete Conversation References (Hide chat)
        // Chat ID is alphabetical sort of UIDs
        const uids = [uid, targetUid].sort();
        const chatId = `${uids[0]}_${uids[1]}`;

        const myConvRef = db.collection('users').doc(uid).collection('conversations').doc(chatId);
        const theirConvRef = db.collection('users').doc(targetUid).collection('conversations').doc(chatId);

        // Also delete the actual chat document? User requested "chat with that person will disappear and not shown to you and other person"
        // Simply removing the reference in `conversations` hides it from the UI list.
        // We can also delete the main chat document to be thorough, or keep it for records/admin.
        // Given "disappear from you and ...", removing the pointers is sufficient for the app UI.

        batch.delete(myConvRef);
        batch.delete(theirConvRef);

        await batch.commit();

        return NextResponse.json({ message: 'User blocked and chat removed' });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Block user error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
