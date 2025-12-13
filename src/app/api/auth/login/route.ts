import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/config/firebase-admin';
import { verifyAuthToken, unauthorizedResponse, AuthUser } from '@/lib/middleware/auth';

/**
 * POST /api/auth/login
 * Sync user data on login - creates new user or returns existing
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuthToken(request);

    if (!user) {
        return unauthorizedResponse();
    }

    try {
        const { uid, email, picture, name } = user;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Create new user
            await userRef.set({
                uid,
                email,
                name: name || '',
                firstName: name ? name.split(' ')[0] : '',
                lastName: name ? name.split(' ').slice(1).join(' ') : '',
                displayName: name || '',
                picture: picture || '',
                dob: null,
                region: 'unknown',
                language: 'en',
                gender: 'unknown',
                interests: [],
                avatarUrl: picture || '',
                isOnline: true,
                isOnboarded: false,
                lastActive: admin.firestore.FieldValue.serverTimestamp(),
                counters: {
                    unreadNotifs: 0,
                    unreadChats: 0,
                    friendRequests: 0
                },
                subscription: {
                    tier: 'Free',
                    expiresAt: null
                },
                stats: {
                    matchesToday: 0,
                    lastMatchDate: new Date()
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                reportCount: {
                    Nudity: 0,
                    Verbal_Abuse: 0,
                    Fraud: 0,
                    Spam: 0,
                    Crime: 0
                }
            });

            const newUserDoc = await userRef.get();
            return NextResponse.json(
                { message: 'User created', user: newUserDoc.data() },
                { status: 201 }
            );
        }

        // User exists, return synced data
        return NextResponse.json({ message: 'User synced', user: userDoc.data() });
    } catch (error: unknown) {
        const err = error as Error & { code?: string; details?: string };
        console.error('Error syncing user:', err);
        console.error('Error code:', err.code);
        console.error('Error details:', err.details);
        console.error('Firebase Project ID:', admin.app().options.projectId);
        return NextResponse.json(
            { error: 'Internal Server Error', message: err.message },
            { status: 500 }
        );
    }
}
