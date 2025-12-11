"use client";

import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { TIERS } from '@/lib/services/tiers';

// Cashfree Backend URL - hosted separately
const CASHFREE_BACKEND_URL = process.env.NEXT_PUBLIC_CASHFREE_BACKEND_URL ||
    'https://cashfree-unified-backend-1064217645584.us-central1.run.app';

// Extend window type to include Cashfree SDK v3
interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_parent' | '_top';
    returnUrl?: string;  // Optional - set on backend during order creation
}

interface CashfreeCheckoutResult {
    error?: {
        message: string;
        code?: string;
        type?: string;
    };
    redirect?: boolean;
    paymentDetails?: {
        paymentMessage: string;
    };
}

declare global {
    interface Window {
        Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
            checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
        };
    }
}

interface UseCashfreeReturn {
    isLoading: boolean;
    isScriptLoaded: boolean;
    initiatePayment: (planId: 'GOLD' | 'DIAMOND') => Promise<void>;
    error: string | null;
}

export function useCashfree(): UseCashfreeReturn {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useNetwork();

    // Load the Cashfree script on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if already loaded
        if (window.Cashfree) {
            setIsScriptLoaded(true);
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsScriptLoaded(true));
            return;
        }

        // Create and append script
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
            setIsScriptLoaded(true);
            console.log('[Cashfree] SDK loaded successfully');
        };
        script.onerror = () => {
            setError('Failed to load payment gateway');
            console.error('[Cashfree] Failed to load SDK');
        };
        document.body.appendChild(script);

        return () => {
            // Don't remove script on unmount to avoid reloading
        };
    }, []);

    const initiatePayment = useCallback(async (planId: 'GOLD' | 'DIAMOND') => {
        if (!isScriptLoaded || !window.Cashfree) {
            setError('Payment gateway not ready. Please try again.');
            return;
        }

        if (!user) {
            setError('Please log in to continue.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get tier details
            const tier = TIERS[planId];
            if (!tier) {
                throw new Error('Invalid plan selected');
            }

            // Generate order ID
            const userId = user.uid;
            const orderId = `ORDER_${userId.substring(0, 8)}_${Date.now()}`;

            // Get user details
            const userEmail = user.email || 'user@example.com';
            const userName = user.displayName || 'User';
            const userPhone = user.phoneNumber?.replace(/\D/g, '').slice(-10) || '9999999999';

            // Build return URL for redirect after payment
            const returnUrl = `${window.location.origin}/payment/status?order_id=${orderId}`;

            console.log('[Cashfree] Creating order with external backend:', { orderId, planId, amount: tier.price });

            // Call the external Cashfree backend directly
            const response = await fetch(`${CASHFREE_BACKEND_URL}/api/payments/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    orderAmount: tier.price,
                    customerId: userId,
                    customerPhone: userPhone,
                    customerName: userName,
                    customerEmail: userEmail,
                    returnUrl,
                    subscriptionType: planId,
                })
            });

            // Read the response body ONCE
            const orderData = await response.json();
            console.log('[Cashfree] Order response:', orderData);

            if (!response.ok) {
                throw new Error(orderData.error || orderData.message || 'Failed to create order');
            }

            const paymentSessionId = orderData.payment_session_id || orderData.paymentSessionId;
            console.log('[Cashfree] Payment session ID:', paymentSessionId);

            if (!paymentSessionId) {
                throw new Error('Invalid response from server - no payment session ID');
            }

            // Store order in localStorage for verification later
            localStorage.setItem(`order_${orderId}`, JSON.stringify({
                orderId,
                planId,
                amount: tier.price,
                userId,
                createdAt: new Date().toISOString(),
            }));

            // Initialize Cashfree and trigger checkout
            const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
            console.log('[Cashfree] Initializing with mode:', mode);

            const cashfree = window.Cashfree({ mode });

            // Note: returnUrl is set on the backend during order creation, not here
            // The checkout options only need paymentSessionId and redirectTarget
            console.log('[Cashfree] Calling checkout with session:', paymentSessionId);

            const result = await cashfree.checkout({
                paymentSessionId,
                redirectTarget: '_self' // Opens checkout in the same tab
            });

            // Handle checkout result
            if (result.error) {
                console.error('[Cashfree] Checkout error:', result.error);
                throw new Error(result.error.message || 'Payment checkout failed');
            }

            if (result.redirect) {
                console.log('[Cashfree] Redirecting to payment page...');
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Payment failed';
            setError(message);
            console.error('[Cashfree] Payment error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isScriptLoaded, user]);

    return {
        isLoading,
        isScriptLoaded,
        initiatePayment,
        error
    };
}
