import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { initCashfree } from '@/lib/config/cashfree';
import { verifyAuthToken, unauthorizedResponse } from '@/lib/middleware/auth';

/**
 * POST /api/payment/create-order
 * Create a Cashfree payment order
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const Cashfree = await initCashfree();
        const { planId } = await request.json();
        const userId = user.uid;
        const userEmail = user.email || 'user@example.com';
        const userPhone = user.phone_number || '9999999999';

        let amount = 0;
        if (planId === 'GOLD') amount = 199;
        else if (planId === 'DIAMOND') amount = 499;
        else return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        const orderId = `ORDER_${userId.substring(0, 5)}_${Date.now()}`;

        // Ensure phone number is valid
        let validPhone = userPhone.replace(/\D/g, '');
        if (validPhone.length < 10) validPhone = '9999999999';
        if (validPhone.length > 10) validPhone = validPhone.slice(-10);

        const orderRequest = {
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: userId,
                customer_email: userEmail,
                customer_phone: validPhone
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9191'}/payment/status?order_id={order_id}`
            }
        };

        console.log('Creating order for:', userId, 'Plan:', planId, 'Amount:', amount);

        // @ts-ignore
        const response = await Cashfree.PGCreateOrder(orderRequest);
        console.log('Cashfree Response:', response.data);

        // Save pending transaction
        await db.collection('transactions').doc(orderId).set({
            userId,
            planId,
            amount,
            status: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentSessionId: response.data.payment_session_id
        });

        return NextResponse.json(response.data);
    } catch (error: unknown) {
        const err = error as Error & { response?: { data?: unknown } };
        console.error('Create order error details:', err.response?.data || err.message);
        return NextResponse.json(
            { error: 'Internal server error', details: err.message },
            { status: 500 }
        );
    }
}
