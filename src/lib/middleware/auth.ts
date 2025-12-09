import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/config/firebase-admin';

export interface AuthUser {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
    phone_number?: string;
    [key: string]: unknown;
}

export interface AuthenticatedRequest {
    user: AuthUser;
    body: Record<string, unknown>;
}

/**
 * Verify Firebase ID token and extract user information
 * Use this in API routes to authenticate requests
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken as AuthUser;
    } catch (error) {
        console.error('[Auth Middleware] Error verifying token:', error);
        return null;
    }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
    return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth<T>(
    handler: (user: AuthUser, body: T, request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const user = await verifyAuthToken(request);

        if (!user) {
            return unauthorizedResponse('No token provided or invalid token');
        }

        try {
            const body = request.method !== 'GET' ? await request.json() : {};
            return handler(user, body as T, request);
        } catch (error) {
            console.error('[Auth Middleware] Handler error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
