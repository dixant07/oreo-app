"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, MapPin, Phone, Clock } from 'lucide-react';

export default function ContactPage() {
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
                                Contact Us
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Have questions? We're here to help. Reach out to us through any of the channels below.
                        </p>
                    </div>

                    {/* Contact Information Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Email Us</h3>
                                <p className="text-zinc-400 mb-4">For general inquiries and support</p>
                                <a href="mailto:support@oreo.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                                    support@oreo.com
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Call Us</h3>
                                <p className="text-zinc-400 mb-4">Monday to Friday, 9 AM - 6 PM IST</p>
                                <a href="tel:+911234567890" className="text-orange-400 hover:text-orange-300 transition-colors">
                                    +91 123 456 7890
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Visit Us</h3>
                                <p className="text-zinc-400 mb-4">Our office location</p>
                                <address className="text-orange-400 not-italic">
                                    123 Tech Park, Cyber City<br />
                                    Bangalore, Karnataka 560001<br />
                                    India
                                </address>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Business Hours</h3>
                                <p className="text-zinc-400 mb-2">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                                <p className="text-zinc-400">Saturday - Sunday: Closed</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Business Details */}
                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm mb-12">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Business Information</h2>
                            <div className="space-y-4 text-zinc-300">
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">Company Name:</span>
                                    <span>Oreo Technologies Private Limited</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">Registered Address:</span>
                                    <span>123 Tech Park, Cyber City, Bangalore, Karnataka 560001, India</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">CIN:</span>
                                    <span>U72900KA2024PTC123456</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">GSTIN:</span>
                                    <span>29AAAAA0000A1Z5</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">Support Email:</span>
                                    <a href="mailto:support@oreo.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                                        support@oreo.com
                                    </a>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <span className="font-semibold text-white w-48">Billing Email:</span>
                                    <a href="mailto:billing@oreo.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                                        billing@oreo.com
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Support Information */}
                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Customer Support</h2>
                            <div className="space-y-4 text-zinc-300">
                                <p>
                                    For technical support, billing inquiries, or account-related questions, please email us at{' '}
                                    <a href="mailto:support@oreo.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                                        support@oreo.com
                                    </a>
                                    {' '}or call us during business hours.
                                </p>
                                <p>
                                    We strive to respond to all inquiries within 24-48 business hours. For urgent matters,
                                    please mark your email subject with [URGENT].
                                </p>
                                <p className="text-sm text-zinc-400 mt-6">
                                    For payment-related queries, please include your order ID and transaction details
                                    to help us assist you faster.
                                </p>
                            </div>
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
