"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
                                Terms & Conditions
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Last Updated: December 11, 2024
                        </p>
                    </div>

                    {/* Content */}
                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
                        <CardContent className="p-8 space-y-8 text-zinc-300">
                            {/* Introduction */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                                <p className="mb-4">
                                    Welcome to Oreo ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Oreo platform, including our website, mobile applications, and services (collectively, the "Service").
                                </p>
                                <p>
                                    By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                                </p>
                            </section>

                            {/* Company Information */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Company Information</h2>
                                <div className="space-y-2">
                                    <p><strong className="text-white">Company Name:</strong> Oreo Technologies Private Limited</p>
                                    <p><strong className="text-white">Registered Address:</strong> 123 Tech Park, Cyber City, Bangalore, Karnataka 560001, India</p>
                                    <p><strong className="text-white">CIN:</strong> U72900KA2024PTC123456</p>
                                    <p><strong className="text-white">GSTIN:</strong> 29AAAAA0000A1Z5</p>
                                    <p><strong className="text-white">Email:</strong> support@oreo.com</p>
                                    <p><strong className="text-white">Phone:</strong> +91 123 456 7890</p>
                                </div>
                            </section>

                            {/* Services Description */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Services Description</h2>
                                <p className="mb-4">
                                    Oreo provides a video chat and gaming platform that enables users to:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Connect with other users through video chat</li>
                                    <li>Play interactive mini-games with matched users</li>
                                    <li>Access premium features through paid membership plans</li>
                                    <li>Communicate via text chat and messaging</li>
                                </ul>
                            </section>

                            {/* Membership Plans & Pricing */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Membership Plans & Pricing</h2>
                                <p className="mb-4">
                                    We offer the following membership tiers (all prices in Indian Rupees - INR):
                                </p>

                                <div className="space-y-4 ml-4">
                                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                                        <h3 className="text-lg font-semibold text-white mb-2">Free Plan - ₹0/month</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>50 Matches per day</li>
                                            <li>Standard Video Quality</li>
                                            <li>Ad-supported experience</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-zinc-800/50 rounded-lg border-2 border-orange-500/30">
                                        <h3 className="text-lg font-semibold text-white mb-2">Gold Plan - ₹199/month</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>200 Matches per day</li>
                                            <li>HD Video Quality</li>
                                            <li>Ad-free experience</li>
                                            <li>Gender Filter</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                                        <h3 className="text-lg font-semibold text-white mb-2">Diamond Plan - ₹499/month</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>Unlimited Matches</li>
                                            <li>4K Video Quality</li>
                                            <li>VIP Support</li>
                                            <li>All Filters (Gender, Location, etc.)</li>
                                            <li>Exclusive Profile Badge</li>
                                        </ul>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm">
                                    All prices are inclusive of applicable taxes. Prices are subject to change with 30 days' notice to existing subscribers.
                                </p>
                            </section>

                            {/* Payment Terms */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Payment Terms</h2>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>All payments are processed securely through Cashfree Payments</li>
                                    <li>Subscriptions are billed monthly in advance</li>
                                    <li>Payment must be made in Indian Rupees (INR)</li>
                                    <li>We accept credit cards, debit cards, UPI, net banking, and wallets</li>
                                    <li>You authorize us to charge your payment method for recurring subscriptions</li>
                                    <li>Failed payments may result in service suspension</li>
                                    <li>All transactions are subject to verification and approval</li>
                                </ul>
                            </section>

                            {/* User Eligibility */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. User Eligibility</h2>
                                <p className="mb-4">
                                    To use our Service, you must:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Be at least 18 years of age</li>
                                    <li>Have the legal capacity to enter into binding contracts</li>
                                    <li>Provide accurate and complete registration information</li>
                                    <li>Comply with all applicable laws and regulations</li>
                                    <li>Not be prohibited from using the Service under Indian law</li>
                                </ul>
                            </section>

                            {/* User Conduct */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. User Conduct</h2>
                                <p className="mb-4">You agree NOT to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Use the Service for any illegal or unauthorized purpose</li>
                                    <li>Harass, abuse, or harm other users</li>
                                    <li>Share inappropriate, offensive, or explicit content</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Attempt to gain unauthorized access to the Service</li>
                                    <li>Use automated systems or bots to access the Service</li>
                                    <li>Violate any intellectual property rights</li>
                                    <li>Engage in any form of spam or commercial solicitation</li>
                                </ul>
                            </section>

                            {/* Subscription & Cancellation */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Subscription & Cancellation</h2>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Subscriptions automatically renew unless cancelled</li>
                                    <li>You may cancel your subscription at any time from your account settings</li>
                                    <li>Cancellation takes effect at the end of the current billing period</li>
                                    <li>No refunds for partial months or unused services</li>
                                    <li>You retain access to premium features until the end of your paid period</li>
                                </ul>
                            </section>

                            {/* Intellectual Property */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property</h2>
                                <p className="mb-4">
                                    All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, and software, are the exclusive property of Oreo Technologies Private Limited and are protected by Indian and international copyright, trademark, and other intellectual property laws.
                                </p>
                            </section>

                            {/* Privacy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">10. Privacy</h2>
                                <p>
                                    Your use of the Service is also governed by our Privacy Policy. We collect, use, and protect your personal information as described in our Privacy Policy. By using the Service, you consent to our collection and use of your information as outlined in the Privacy Policy.
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>
                                <p className="mb-4">
                                    To the maximum extent permitted by law, Oreo Technologies Private Limited shall not be liable for:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Any indirect, incidental, special, or consequential damages</li>
                                    <li>Loss of profits, data, or business opportunities</li>
                                    <li>User conduct or content shared on the platform</li>
                                    <li>Service interruptions or technical issues</li>
                                    <li>Unauthorized access to your account</li>
                                </ul>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">12. Termination</h2>
                                <p className="mb-4">
                                    We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, without notice, for:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Violation of these Terms</li>
                                    <li>Fraudulent or illegal activity</li>
                                    <li>Abusive behavior towards other users or staff</li>
                                    <li>Non-payment of subscription fees</li>
                                    <li>Any other reason we deem appropriate</li>
                                </ul>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law & Jurisdiction</h2>
                                <p>
                                    These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
                                </p>
                            </section>

                            {/* Changes to Terms */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Terms</h2>
                                <p>
                                    We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
                                </p>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">15. Contact Us</h2>
                                <p className="mb-4">
                                    If you have any questions about these Terms, please contact us:
                                </p>
                                <div className="space-y-2">
                                    <p><strong className="text-white">Email:</strong> support@oreo.com</p>
                                    <p><strong className="text-white">Phone:</strong> +91 123 456 7890</p>
                                    <p><strong className="text-white">Address:</strong> 123 Tech Park, Cyber City, Bangalore, Karnataka 560001, India</p>
                                </div>
                            </section>

                            {/* Acceptance */}
                            <section className="border-t border-zinc-700 pt-6">
                                <p className="text-sm text-zinc-400">
                                    By using the Oreo Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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
