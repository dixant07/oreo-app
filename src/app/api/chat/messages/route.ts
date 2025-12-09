import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * GET /api/chat/messages
 * Get messages for a chat with another user
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { searchParams } = new URL(request.url);
        const otherUserId = searchParams.get('otherUserId');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!otherUserId) {
            return NextResponse.json({ error: 'Missing otherUserId' }, { status: 400 });
        }

        const uids = [user.uid, otherUserId].sort();
        const chatId = `${uids[0]}_${uids[1]}`;

        const messagesSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const messages = messagesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .reverse();

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
