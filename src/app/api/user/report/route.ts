import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';
import { matchmakingClient } from '@/lib/services/matchmaking-client';

interface ReportBody {
    targetUid: string;
    type: string;
}

/**
 * POST /api/user/report
 * Report a user for inappropriate behavior
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid } = user;
        const body: ReportBody = await request.json();
        const { targetUid, type } = body;

        const validTypes = ["Nudity", "Verbal Abuse", "Fraud", "Spam", "Crime"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        if (uid === targetUid) {
            return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
        }

        const reportRef = db.collection('reports').doc();
        const targetUserRef = db.collection('users').doc(targetUid);

        let newReportCount = 0;
        let totalReports = 0;

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(targetUserRef);
            if (!userDoc.exists) {
                // throw new Error("User not found");
                // Allow reporting even if user doc is missing (rare case), but usually strict
            }

            const userData = userDoc.exists ? userDoc.data() : {};
            const currentReportCount = userData?.reportCount || {};

            const fieldPath = `reportCount.${type}`;
            newReportCount = (currentReportCount[type] || 0) + 1;

            totalReports = Object.values(currentReportCount).reduce(
                (sum: number, val) => sum + (val as number || 0), 0
            ) + 1;

            transaction.set(reportRef, {
                reporterId: uid,
                targetId: targetUid,
                type,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });

            if (userDoc.exists) {
                transaction.update(targetUserRef, {
                    [fieldPath]: admin.firestore.FieldValue.increment(1)
                });
            }
        });

        // ACTION: Remove relationships (Friends & Chat) as requested
        const batch = db.batch();

        // 1. Remove friend connections
        const myFriendRef = db.collection('users').doc(uid).collection('friends').doc(targetUid);
        const theirFriendRef = db.collection('users').doc(targetUid).collection('friends').doc(uid);
        batch.delete(myFriendRef);
        batch.delete(theirFriendRef);

        // 2. Delete Conversation References (Hide chat)
        const uids = [uid, targetUid].sort();
        const chatId = `${uids[0]}_${uids[1]}`;

        const myConvRef = db.collection('users').doc(uid).collection('conversations').doc(chatId);
        const theirConvRef = db.collection('users').doc(targetUid).collection('conversations').doc(chatId);

        batch.delete(myConvRef);
        batch.delete(theirConvRef);

        await batch.commit();

        // Determine action based on report severity
        const severeTypes = ["Nudity", "Crime", "Fraud"];
        const isSevere = severeTypes.includes(type);

        const KICK_THRESHOLD = 1;
        const BAN_THRESHOLD_SEVERE = 2;
        const BAN_THRESHOLD_NORMAL = 5;

        if (isSevere && newReportCount >= BAN_THRESHOLD_SEVERE) {
            matchmakingClient.banUser(targetUid, `Multiple ${type} reports`, 1440);
            console.log(`[Report] User ${targetUid} banned for 24h due to ${newReportCount} ${type} reports`);
        } else if (totalReports >= BAN_THRESHOLD_NORMAL) {
            matchmakingClient.banUser(targetUid, `Accumulated ${totalReports} reports`, 60);
            console.log(`[Report] User ${targetUid} banned for 1h due to ${totalReports} total reports`);
        } else if (newReportCount >= KICK_THRESHOLD) {
            matchmakingClient.kickUser(targetUid, `Reported for ${type}`);
            console.log(`[Report] User ${targetUid} kicked due to ${type} report`);
        }

        return NextResponse.json({ message: 'User reported' });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Report user error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
