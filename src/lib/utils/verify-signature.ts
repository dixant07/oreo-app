import crypto from 'crypto';

/**
 * Verify webhook signature for Cashfree webhooks
 */
export function verifySignature(rawBody: string, signature: string, secret: string, timestamp: string): boolean {
    const payload = timestamp + rawBody;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('base64');

    const a = Buffer.from(hmac);
    const b = Buffer.from(signature || '', 'base64');

    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
}
