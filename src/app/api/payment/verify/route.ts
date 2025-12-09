import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { initCashfree } from '@/lib/config/cashfree';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/payment/verify
 * Verify payment status with Cashfree
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const Cashfree = await initCashfree();
        const { orderId } = await request.json();

        // @ts-ignore
        const response = await Cashfree.PGOrderFetchPayments(orderId);
        const payments = response.data;

        if (Array.isArray(payments)) {
            const successPayment = payments.find((p: { payment_status: string }) =>
                p.payment_status === 'SUCCESS'
            );

            if (successPayment) {
                const txRef = db.collection('transactions').doc(orderId);
                const txDoc = await txRef.get();

                if (!txDoc.exists) {
                    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
                }

                const txData = txDoc.data();

                if (txData && txData.status !== 'SUCCESS') {
                    await txRef.update({
                        status: 'SUCCESS',
                        paymentId: successPayment.cf_payment_id
                    });

                    // Calculate expiry (30 days)
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 30);

                    const userRef = db.collection('users').doc(txData.userId);
                    await userRef.update({
                        'subscription.tier': txData.planId,
                        'subscription.expiresAt': admin.firestore.Timestamp.fromDate(expiresAt),
                        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    return NextResponse.json({ status: 'SUCCESS', planId: txData.planId });
                } else if (txData && txData.status === 'SUCCESS') {
                    return NextResponse.json({ status: 'SUCCESS', planId: txData.planId });
                }
            }
        }

        return NextResponse.json({ status: 'PENDING' });
    } catch (error: unknown) {
        const err = error as Error & { response?: { data?: unknown } };
        console.error('Verify payment error:', err.response?.data || err.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
