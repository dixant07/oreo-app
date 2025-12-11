"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-105">
                            <span className="text-xl font-bold text-white">O</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                            Oreo
                        </span>
                    </Link>

                    <Link href="/">
                        <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800/50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                                Refund & Cancellation Policy
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Last Updated: December 11, 2024
                        </p>
                    </div>

                    {/* Important Notice */}
                    <div className="mb-8 p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-orange-400 mb-2">Important Notice</h3>
                            <p className="text-zinc-300">
                                Please read this policy carefully before making any purchase. By subscribing to our services,
                                you acknowledge and agree to this Refund and Cancellation Policy.
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
                        <CardContent className="p-8 space-y-8 text-zinc-300">
                            {/* Introduction */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
                                <p>
                                    This Refund and Cancellation Policy applies to all subscription plans and services offered by
                                    Oreo Technologies Private Limited ("Oreo," "we," "us," or "our"). This policy outlines the
                                    terms and conditions for refunds and cancellations of our services.
                                </p>
                            </section>

                            {/* Subscription Plans */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Subscription Plans</h2>
                                <p className="mb-4">
                                    We offer the following subscription plans (all prices in Indian Rupees - INR):
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-white">Free Plan:</strong> ₹0/month - No payment required</li>
                                    <li><strong className="text-white">Gold Plan:</strong> ₹199/month - Billed monthly</li>
                                    <li><strong className="text-white">Diamond Plan:</strong> ₹499/month - Billed monthly</li>
                                </ul>
                            </section>

                            {/* Cancellation Policy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Cancellation Policy</h2>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.1 How to Cancel</h3>
                                <p className="mb-4">
                                    You may cancel your subscription at any time through:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li>Your account settings page</li>
                                    <li>Contacting our customer support at support@oreo.com</li>
                                    <li>Calling us at +91 123 456 7890 during business hours</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.2 Cancellation Effect</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Cancellation takes effect at the end of your current billing period</li>
                                    <li>You will retain access to premium features until the end of your paid period</li>
                                    <li>No charges will be made for subsequent billing periods after cancellation</li>
                                    <li>Your account will automatically revert to the Free Plan after the paid period expires</li>
                                    <li>Cancellation must be done at least 24 hours before the next billing date to avoid charges</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.3 No Cancellation Fees</h3>
                                <p>
                                    We do not charge any cancellation fees. You are free to cancel your subscription at any time
                                    without penalty.
                                </p>
                            </section>

                            {/* Refund Policy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Refund Policy</h2>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.1 General Refund Terms</h3>
                                <p className="mb-4">
                                    Due to the digital nature of our services, we maintain a strict no-refund policy with the
                                    following exceptions:
                                </p>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.2 Eligible Refund Scenarios</h3>
                                <p className="mb-4">
                                    Refunds may be considered in the following circumstances:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li><strong className="text-white">Technical Issues:</strong> If you experience persistent technical
                                        problems that prevent you from using the service, and we are unable to resolve them within 7 days
                                        of your first report</li>
                                    <li><strong className="text-white">Duplicate Charges:</strong> If you were charged multiple times
                                        for the same subscription period due to a system error</li>
                                    <li><strong className="text-white">Unauthorized Charges:</strong> If charges were made without your
                                        authorization (subject to verification)</li>
                                    <li><strong className="text-white">Service Not Delivered:</strong> If you paid for a subscription
                                        but did not receive access to the premium features</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.3 Non-Refundable Scenarios</h3>
                                <p className="mb-4">
                                    Refunds will NOT be provided in the following cases:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Change of mind or dissatisfaction with the service</li>
                                    <li>Partial use of the subscription period</li>
                                    <li>Failure to cancel before the renewal date</li>
                                    <li>Account suspension or termination due to violation of Terms of Service</li>
                                    <li>Inability to use the service due to user's internet connectivity issues</li>
                                    <li>Incompatibility with user's device or browser (unless explicitly stated as supported)</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.4 Refund Request Process</h3>
                                <p className="mb-4">
                                    To request a refund:
                                </p>
                                <ol className="list-decimal list-inside space-y-2 ml-4 mb-4">
                                    <li>Contact our support team at support@oreo.com or billing@oreo.com</li>
                                    <li>Include your order ID, transaction ID, and registered email address</li>
                                    <li>Provide a detailed explanation of the issue</li>
                                    <li>Include any relevant screenshots or documentation</li>
                                    <li>Submit your request within 7 days of the charge</li>
                                </ol>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.5 Refund Processing Time</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Refund requests will be reviewed within 5-7 business days</li>
                                    <li>If approved, refunds will be processed within 7-10 business days</li>
                                    <li>Refunds will be credited to the original payment method</li>
                                    <li>Bank processing time may vary (typically 5-10 business days)</li>
                                    <li>You will receive an email confirmation once the refund is processed</li>
                                </ul>
                            </section>

                            {/* Payment Failures */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Payment Failures</h2>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>If a payment fails, we will attempt to charge your payment method up to 3 times</li>
                                    <li>You will receive email notifications about failed payment attempts</li>
                                    <li>If all attempts fail, your subscription will be downgraded to the Free Plan</li>
                                    <li>You can update your payment method in account settings to restore your subscription</li>
                                    <li>No refunds will be issued for service interruption due to payment failures</li>
                                </ul>
                            </section>

                            {/* Chargebacks */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. Chargebacks & Disputes</h2>
                                <p className="mb-4">
                                    If you initiate a chargeback or payment dispute with your bank or card issuer:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Your account will be immediately suspended pending investigation</li>
                                    <li>We reserve the right to terminate your account if the chargeback is found to be fraudulent</li>
                                    <li>Please contact our support team first to resolve any billing issues</li>
                                    <li>Unjustified chargebacks may result in permanent account termination</li>
                                </ul>
                            </section>

                            {/* Promotional Offers */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. Promotional Offers & Discounts</h2>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Promotional pricing is non-refundable</li>
                                    <li>Discounts and offers cannot be combined unless explicitly stated</li>
                                    <li>Promotional periods are clearly communicated at the time of purchase</li>
                                    <li>After the promotional period, standard pricing applies</li>
                                    <li>We do not provide refunds for price differences if a promotion starts after your purchase</li>
                                </ul>
                            </section>

                            {/* Account Termination */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Account Termination by Oreo</h2>
                                <p className="mb-4">
                                    If we terminate your account due to violation of our Terms of Service:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>No refund will be provided for the remaining subscription period</li>
                                    <li>You will lose access to all premium features immediately</li>
                                    <li>You will not be able to create a new account without our permission</li>
                                </ul>
                            </section>

                            {/* Contact for Refunds */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
                                <p className="mb-4">
                                    For any questions about refunds or cancellations, please contact us:
                                </p>
                                <div className="space-y-2">
                                    <p><strong className="text-white">Email:</strong> support@oreo.com or billing@oreo.com</p>
                                    <p><strong className="text-white">Phone:</strong> +91 123 456 7890</p>
                                    <p><strong className="text-white">Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                                    <p><strong className="text-white">Address:</strong> Oreo Technologies Private Limited, 123 Tech Park,
                                        Cyber City, Bangalore, Karnataka 560001, India</p>
                                </div>
                            </section>

                            {/* Changes to Policy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
                                <p>
                                    We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be
                                    effective immediately upon posting on our website. We will notify users of material changes via
                                    email. Your continued use of the service after such modifications constitutes acceptance of the
                                    updated policy.
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
                                <p>
                                    This Refund and Cancellation Policy is governed by the laws of India. Any disputes arising from
                                    this policy shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
                                </p>
                            </section>

                            {/* Acceptance */}
                            <section className="border-t border-zinc-700 pt-6">
                                <p className="text-sm text-zinc-400">
                                    By subscribing to any of our paid plans, you acknowledge that you have read, understood, and agree
                                    to this Refund and Cancellation Policy.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-zinc-800/50">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-zinc-500 text-sm">
                        © 2024 Oreo Technologies Private Limited. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
