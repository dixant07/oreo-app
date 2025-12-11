"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Home, RefreshCw } from 'lucide-react';
import { useNetwork } from '@/lib/contexts/NetworkContext';

// Cashfree Backend URL - hosted separately
const CASHFREE_BACKEND_URL = process.env.NEXT_PUBLIC_CASHFREE_BACKEND_URL ||
    'https://cashfree-unified-backend-1064217645584.us-central1.run.app';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'pending' | 'error';

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useNetwork();

    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<PaymentStatus>('verifying');
    const [planId, setPlanId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setErrorMessage('No order ID provided');
            return;
        }

        if (!user) {
            // Wait for auth to initialize
            return;
        }

        verifyPayment(orderId);
    }, [orderId, user]);

    const verifyPayment = async (id: string) => {
        try {
            // First, get the stored order info from localStorage
            const storedOrder = localStorage.getItem(`order_${id}`);
            let orderInfo = storedOrder ? JSON.parse(storedOrder) : null;

            // If we have stored order info, set the plan ID
            if (orderInfo?.planId) {
                setPlanId(orderInfo.planId);
            }

            // Call external backend to verify payment status
            const response = await fetch(`${CASHFREE_BACKEND_URL}/api/payments/order/${id}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // If it's a 404, the order might not exist on the external backend
                if (response.status === 404) {
                    // Check if we have local order info - payment might be in progress
                    if (orderInfo && retryCount < 10) {
                        setStatus('pending');
                        setRetryCount(prev => prev + 1);
                        setTimeout(() => verifyPayment(id), 3000);
                        return;
                    }
                }
                throw new Error('Verification failed');
            }

            const data = await response.json();
            const orderStatus = data.order_status || data.orderStatus || data.status;

            if (orderStatus === 'PAID' || orderStatus === 'SUCCESS') {
                setStatus('success');
                // Clean up local storage
                localStorage.removeItem(`order_${id}`);
            } else if (orderStatus === 'FAILED' || orderStatus === 'EXPIRED' || orderStatus === 'CANCELLED') {
                setStatus('failed');
                localStorage.removeItem(`order_${id}`);
            } else if (orderStatus === 'PENDING' || orderStatus === 'ACTIVE') {
                // Still pending, check again after a delay
                if (retryCount < 10) {
                    setStatus('pending');
                    setRetryCount(prev => prev + 1);
                    setTimeout(() => verifyPayment(id), 3000);
                } else {
                    // Too many retries, show pending status
                    setStatus('pending');
                }
            } else {
                // Unknown status, show as pending
                setStatus('pending');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Verification failed';
            console.error('[PaymentStatus] Verification error:', message);

            // If we still have retries left, try again
            if (retryCount < 5) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => verifyPayment(id), 3000);
            } else {
                setStatus('error');
                setErrorMessage(message);
            }
        }
    };

    const handleRetry = () => {
        if (orderId) {
            setStatus('verifying');
            setRetryCount(0);
            verifyPayment(orderId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-orange-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                {(status === 'verifying' || status === 'pending') && (
                    <>
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {status === 'verifying' ? 'Verifying Payment' : 'Processing Payment'}
                        </h1>
                        <p className="text-gray-500 mb-6">
                            {status === 'verifying'
                                ? 'Please wait while we confirm your payment...'
                                : 'Your payment is being processed. This may take a moment...'}
                        </p>
                        <div className="flex justify-center gap-2">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {retryCount > 0 && (
                            <p className="text-xs text-gray-400 mt-4">
                                Checking status... ({retryCount}/10)
                            </p>
                        )}
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                        <p className="text-gray-500 mb-2">
                            Welcome to {planId === 'DIAMOND' ? 'Diamond' : 'Gold'} membership!
                        </p>
                        <p className="text-sm text-gray-400 mb-8">
                            Your subscription is now active. Enjoy all the premium features.
                        </p>
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12"
                            onClick={() => router.push('/home')}
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Go to Home
                        </Button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                        <p className="text-gray-500 mb-8">
                            Unfortunately, your payment could not be processed. Please try again.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl h-12"
                                onClick={() => router.push('/home')}
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                            <Button
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12"
                                onClick={handleRetry}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-yellow-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
                        <p className="text-gray-500 mb-4">
                            {errorMessage || 'An unexpected error occurred.'}
                        </p>
                        <p className="text-sm text-gray-400 mb-8">
                            If payment was deducted, it will be automatically refunded within 5-7 business days.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl h-12"
                                onClick={() => router.push('/home')}
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                            <Button
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12"
                                onClick={handleRetry}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </>
                )}

                {orderId && (
                    <p className="text-xs text-gray-300 mt-6">
                        Order ID: {orderId}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-orange-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        }>
            <PaymentStatusContent />
        </Suspense>
    );
}
