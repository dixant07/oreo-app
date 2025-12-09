import { NextRequest, NextResponse } from 'next/server';
import { db, admin, auth } from '@/lib/config/firebase-admin';
import { verifySignature } from '@/lib/utils/verify-signature';
import { getTier } from '@/lib/services/tiers';

/**
 * POST /api/webhook/cashfree
 * Handle Cashfree payment webhooks
 */
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-webhook-signature') || '';
        const timestamp = request.headers.get('x-webhook-timestamp') || '';

        const secret = process.env.WEBHOOK_SECRET || process.env.CASHFREE_CLIENT_SECRET;

        if (!secret) {
            console.error('Webhook secret not configured');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        if (!verifySignature(rawBody, signature, secret, timestamp)) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const { order_id, order_status, payment_id } = event.data;

        console.log(`Webhook received: ${order_id} - ${order_status}`);

        const orderRef = db.collection('transactions').doc(order_id);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`Order not found: ${order_id}`);
            return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
        }

        const order = orderSnap.data()!;
        if (order.status === 'SUCCESS' || order.status === 'PAID') {
            return NextResponse.json({ message: 'Already processed' });
        }

        if (order_status === 'SUCCESS' || order_status === 'PAID') {
            const tier = getTier(order.planId);
            if (!tier) {
                console.error(`Invalid tier in order: ${order.planId}`);
                return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
            }

            const now = Date.now();
            const durationMs = tier.durationDays * 24 * 3600 * 1000;
            const expiresAt = new Date(now + durationMs);

            // Create subscription record
            await db.collection('subscriptions').add({
                uid: order.userId,
                tierId: order.planId,
                startAt: admin.firestore.Timestamp.fromMillis(now),
                endAt: admin.firestore.Timestamp.fromMillis(now + durationMs),
                status: 'ACTIVE',
                sourceOrderId: order_id,
                paymentId: payment_id,
                createdAt: admin.firestore.Timestamp.fromMillis(now)
            });

            // Update transaction status
            await orderRef.update({
                status: 'SUCCESS',
                paymentId: payment_id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update user profile
            await db.collection('users').doc(order.userId).update({
                'subscription.tier': order.planId,
                'subscription.expiresAt': admin.firestore.Timestamp.fromDate(expiresAt),
                'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });

            // Set Custom Claims
            try {
                const userRecord = await auth.getUser(order.userId);
                const existingClaims = userRecord.customClaims || {};

                await auth.setCustomUserClaims(order.userId, {
                    ...existingClaims,
                    paid: true,
                    tier: order.planId,
                    expiresAt: now + durationMs
                });
                console.log(`Custom claims updated for ${order.userId} (Subscription Active)`);
            } catch (claimError) {
                console.error('Failed to set custom claims:', claimError);
            }

        } else if (order_status === 'FAILED') {
            await orderRef.update({
                status: 'FAILED',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return NextResponse.json({ message: 'OK' });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Webhook processing error:', err.message);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}
