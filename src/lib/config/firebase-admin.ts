import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Server-side Firebase Admin SDK initialization
// This file should only be imported in API routes (server-side)

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return;
    }

    let credential;

    // Priority 1: Load from FIREBASE_SERVICE_ACCOUNT_KEY env var (Base64 encoded JSON)
    // This is the recommended approach for production deployments
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            console.log('[Firebase Admin] Loading credentials from FIREBASE_SERVICE_ACCOUNT_KEY env var');
            const serviceAccountJson = Buffer.from(
                process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
                'base64'
            ).toString('utf8');
            const serviceAccount = JSON.parse(serviceAccountJson);
            credential = admin.credential.cert(serviceAccount);
        } catch (error) {
            console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY - must be valid Base64 encoded JSON');
        }
    }
    // Priority 2: Load from file path specified by GOOGLE_APPLICATION_CREDENTIALS
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        console.log(`[Firebase Admin] Loading credentials from: ${serviceAccountPath}`);
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        credential = admin.credential.cert(serviceAccount);
    }
    // Priority 3: Try to load from default file location (for local development)
    else {
        const defaultPath = path.join(process.cwd(), 'oreo-video-app-v1-firebase-adminsdk-fbsvc-751f63dcd0.json');
        if (fs.existsSync(defaultPath)) {
            console.log(`[Firebase Admin] Loading credentials from default path: ${defaultPath}`);
            const serviceAccount = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
        } else {
            // Priority 4: Try application default credentials (for GCP environments)
            console.log('[Firebase Admin] No credentials found. Trying application default credentials...');
            try {
                credential = admin.credential.applicationDefault();
            } catch (error) {
                console.error('\n❌ FIREBASE ADMIN INITIALIZATION FAILED ❌');
                console.error('Could not load Firebase credentials.');
                console.error('\nPlease do ONE of the following:');
                console.error('1. Set FIREBASE_SERVICE_ACCOUNT_KEY env var (Base64 encoded service account JSON)');
                console.error('2. Set GOOGLE_APPLICATION_CREDENTIALS to point to your service account JSON file');
                console.error('3. Place the service account JSON file in the project root (for local dev only)');
                console.error('4. Run on Google Cloud Platform with default credentials\n');
                throw error;
            }
        }
    }

    admin.initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'oreo-video-app-v1'
    });

    console.log('✅ Firebase Admin Initialized');
    console.log('Project ID:', admin.app().options.projectId);
}

// Initialize on first import
initializeFirebaseAdmin();

db = admin.firestore();
auth = admin.auth();

export { db, auth, admin };
