"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-6">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                                Privacy Policy
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
                                    Oreo Technologies Private Limited ("Oreo," "we," "us," or "our") is committed to protecting your privacy.
                                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                                    our video chat and gaming platform ("Service").
                                </p>
                                <p>
                                    By using our Service, you consent to the data practices described in this Privacy Policy. If you do not
                                    agree with the terms of this Privacy Policy, please do not access or use the Service.
                                </p>
                            </section>

                            {/* Company Information */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Company Information</h2>
                                <div className="space-y-2">
                                    <p><strong className="text-white">Company Name:</strong> Oreo Technologies Private Limited</p>
                                    <p><strong className="text-white">Registered Address:</strong> 123 Tech Park, Cyber City, Bangalore, Karnataka 560001, India</p>
                                    <p><strong className="text-white">Email:</strong> privacy@oreo.com</p>
                                    <p><strong className="text-white">Data Protection Officer:</strong> dpo@oreo.com</p>
                                </div>
                            </section>

                            {/* Information We Collect */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Information We Collect</h2>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.1 Personal Information</h3>
                                <p className="mb-4">We may collect the following personal information:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li>Name and username</li>
                                    <li>Email address</li>
                                    <li>Phone number (optional)</li>
                                    <li>Date of birth (to verify age requirement)</li>
                                    <li>Profile picture and bio (optional)</li>
                                    <li>Gender and preferences (for matching purposes)</li>
                                    <li>Payment information (processed securely through Cashfree)</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.2 Usage Data</h3>
                                <p className="mb-4">We automatically collect certain information when you use our Service:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li>Device information (type, operating system, browser)</li>
                                    <li>IP address and location data</li>
                                    <li>Usage patterns and preferences</li>
                                    <li>Match history and interaction data</li>
                                    <li>Game statistics and performance</li>
                                    <li>Chat messages and communications</li>
                                    <li>Video call metadata (duration, quality, connection status)</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.3 Cookies and Tracking Technologies</h3>
                                <p className="mb-4">We use cookies and similar tracking technologies to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Maintain your session and preferences</li>
                                    <li>Analyze usage patterns and improve our Service</li>
                                    <li>Personalize your experience</li>
                                    <li>Deliver targeted advertisements (if applicable)</li>
                                </ul>
                            </section>

                            {/* How We Use Your Information */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. How We Use Your Information</h2>
                                <p className="mb-4">We use the collected information for the following purposes:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>To provide, maintain, and improve our Service</li>
                                    <li>To create and manage your account</li>
                                    <li>To match you with other users based on preferences</li>
                                    <li>To process payments and manage subscriptions</li>
                                    <li>To communicate with you about updates, promotions, and support</li>
                                    <li>To ensure safety and prevent fraud or abuse</li>
                                    <li>To analyze usage trends and optimize user experience</li>
                                    <li>To comply with legal obligations</li>
                                    <li>To enforce our Terms and Conditions</li>
                                </ul>
                            </section>

                            {/* Video and Audio Data */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Video and Audio Data</h2>
                                <p className="mb-4">
                                    <strong className="text-white">Important:</strong> We do NOT record, store, or save your video or audio calls.
                                    All video and audio communications are peer-to-peer and encrypted end-to-end using WebRTC technology.
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Video and audio streams are transmitted directly between users</li>
                                    <li>We only collect metadata (call duration, quality metrics) for service improvement</li>
                                    <li>Users are responsible for their own conduct during video calls</li>
                                    <li>We may temporarily process video frames for safety moderation purposes only</li>
                                </ul>
                            </section>

                            {/* Information Sharing */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. How We Share Your Information</h2>
                                <p className="mb-4">We may share your information in the following circumstances:</p>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">6.1 With Other Users</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li>Your profile information (name, picture, bio) is visible to matched users</li>
                                    <li>Your online status may be visible to connections</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">6.2 With Service Providers</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                                    <li>Payment processors (Cashfree) for transaction processing</li>
                                    <li>Cloud hosting providers (for data storage and processing)</li>
                                    <li>Analytics providers (for usage analysis)</li>
                                    <li>Customer support tools</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-4">6.3 For Legal Reasons</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>To comply with legal obligations or court orders</li>
                                    <li>To protect our rights, property, or safety</li>
                                    <li>To prevent fraud or illegal activities</li>
                                    <li>To enforce our Terms and Conditions</li>
                                </ul>
                            </section>

                            {/* Data Security */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
                                <p className="mb-4">
                                    We implement industry-standard security measures to protect your information:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>End-to-end encryption for video and audio calls</li>
                                    <li>SSL/TLS encryption for data transmission</li>
                                    <li>Secure data storage with access controls</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Employee training on data protection</li>
                                </ul>
                                <p className="mt-4 text-sm">
                                    However, no method of transmission over the Internet is 100% secure. While we strive to protect your
                                    information, we cannot guarantee absolute security.
                                </p>
                            </section>

                            {/* Data Retention */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>We retain your personal information for as long as your account is active</li>
                                    <li>After account deletion, we may retain certain data for legal or business purposes</li>
                                    <li>Chat messages are retained for 30 days unless deleted by users</li>
                                    <li>Payment records are retained as required by law (typically 7 years)</li>
                                    <li>Anonymized usage data may be retained indefinitely for analytics</li>
                                </ul>
                            </section>

                            {/* Your Rights */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">9. Your Privacy Rights</h2>
                                <p className="mb-4">You have the following rights regarding your personal information:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                                    <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                                    <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
                                    <li><strong className="text-white">Portability:</strong> Request your data in a portable format</li>
                                    <li><strong className="text-white">Objection:</strong> Object to certain data processing activities</li>
                                    <li><strong className="text-white">Restriction:</strong> Request restriction of data processing</li>
                                    <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent for data processing</li>
                                </ul>
                                <p className="mt-4">
                                    To exercise these rights, contact us at privacy@oreo.com or dpo@oreo.com
                                </p>
                            </section>

                            {/* Children's Privacy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
                                <p>
                                    Our Service is not intended for users under 18 years of age. We do not knowingly collect personal
                                    information from children under 18. If we become aware that we have collected data from a child under 18,
                                    we will take steps to delete such information immediately. If you believe we have collected information
                                    from a child under 18, please contact us at privacy@oreo.com.
                                </p>
                            </section>

                            {/* Third-Party Links */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">11. Third-Party Links</h2>
                                <p>
                                    Our Service may contain links to third-party websites or services. We are not responsible for the privacy
                                    practices of these third parties. We encourage you to read their privacy policies before providing any
                                    personal information.
                                </p>
                            </section>

                            {/* International Data Transfers */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">12. International Data Transfers</h2>
                                <p>
                                    Your information may be transferred to and processed in countries other than India. We ensure that such
                                    transfers comply with applicable data protection laws and that your information receives adequate protection.
                                </p>
                            </section>

                            {/* Changes to Privacy Policy */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">13. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you of material changes by email or
                                    through a prominent notice on our Service. The "Last Updated" date at the top of this policy indicates
                                    when it was last revised. Your continued use of the Service after changes constitutes acceptance of the
                                    updated Privacy Policy.
                                </p>
                            </section>

                            {/* Contact Us */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">14. Contact Us</h2>
                                <p className="mb-4">
                                    If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                                </p>
                                <div className="space-y-2">
                                    <p><strong className="text-white">Email:</strong> privacy@oreo.com</p>
                                    <p><strong className="text-white">Data Protection Officer:</strong> dpo@oreo.com</p>
                                    <p><strong className="text-white">Phone:</strong> +91 123 456 7890</p>
                                    <p><strong className="text-white">Address:</strong> Oreo Technologies Private Limited, 123 Tech Park,
                                        Cyber City, Bangalore, Karnataka 560001, India</p>
                                </div>
                            </section>

                            {/* Acceptance */}
                            <section className="border-t border-zinc-700 pt-6">
                                <p className="text-sm text-zinc-400">
                                    By using the Oreo Service, you acknowledge that you have read, understood, and agree to this Privacy Policy.
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
