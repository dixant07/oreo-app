import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/chat/send
 * Send a message to a friend
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const senderId = user.uid;
        const { receiverId, text } = await request.json();

        if (!text || !receiverId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify friendship
        const friendDoc = await db.collection('users')
            .doc(senderId)
            .collection('friends')
            .doc(receiverId)
            .get();

        if (!friendDoc.exists) {
            return NextResponse.json({ error: 'Not friends' }, { status: 403 });
        }

        // Fetch sender and receiver details for denormalization
        const [senderDoc, receiverDoc] = await Promise.all([
            db.collection('users').doc(senderId).get(),
            db.collection('users').doc(receiverId).get()
        ]);

        const senderData = senderDoc.data();
        const receiverData = receiverDoc.data();

        const uids = [senderId, receiverId].sort();
        const chatId = `${uids[0]}_${uids[1]}`;

        const messageData = {
            senderId,
            content: text,
            type: 'text',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            readBy: [senderId]
        };

        const batch = db.batch();

        // Add message to chat
        const messageRef = db.collection('chats').doc(chatId).collection('messages').doc();
        batch.set(messageRef, messageData);

        // Update sender's conversation
        const senderConvRef = db.collection('users').doc(senderId).collection('conversations').doc(chatId);
        batch.set(senderConvRef, {
            chatId,
            withUser: {
                uid: receiverId,
                name: receiverData?.name || '',
                avatarUrl: receiverData?.avatarUrl || ''
            },
            lastMessage: {
                content: text,
                type: 'text',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                senderId
            },
            unreadCount: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Update receiver's conversation
        const receiverConvRef = db.collection('users').doc(receiverId).collection('conversations').doc(chatId);
        batch.set(receiverConvRef, {
            chatId,
            withUser: {
                uid: senderId,
                name: senderData?.name || '',
                avatarUrl: senderData?.avatarUrl || ''
            },
            lastMessage: {
                content: text,
                type: 'text',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                senderId
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Increment unread count for receiver
        batch.update(receiverConvRef, {
            unreadCount: admin.firestore.FieldValue.increment(1)
        });

        // Increment global unread counter
        batch.update(db.collection('users').doc(receiverId), {
            'counters.unreadChats': admin.firestore.FieldValue.increment(1)
        });

        await batch.commit();

        return NextResponse.json({ message: 'Message sent' });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
