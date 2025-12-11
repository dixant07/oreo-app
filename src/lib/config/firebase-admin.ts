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
            // Priority 4: Try application default credentials (for GCP environments) or auto-discovery
            console.log('[Firebase Admin] No credentials found. Trying default initialization...');
            try {
                // First try explicit applicationDefault, mostly for local emulators or some GCP contexts
                credential = admin.credential.applicationDefault();
            } catch (error) {
                console.warn('[Firebase Admin] applicationDefault failed, attempting generic initializeApp (Cloud Functions context)...');
                // If this is a Cloud Function, generic init often works best
                try {
                    if (admin.apps.length === 0) {
                        admin.initializeApp();
                        console.log('✅ Firebase Admin Initialized (Default)');
                        return;
                    }
                } catch (innerError) {
                    console.error('\n❌ FIREBASE ADMIN INITIALIZATION FAILED ❌');
                    console.error('Final fallback failed:', innerError);
                    // Don't throw here to avoid crashing the process instantly, 
                    // though usage will likely fail later.
                }
                return;
            }
        }
    }

    if (admin.apps.length === 0) {
        try {
            admin.initializeApp({
                credential: credential,
                projectId: process.env.FIREBASE_PROJECT_ID || 'oreo-video-app-v1'
            });
            console.log('✅ Firebase Admin Initialized');
            console.log('Project ID:', admin.app().options.projectId);
        } catch (e) {
            console.error('Error during admin.initializeApp:', e);
        }
    }
}

// Initialize on first import
initializeFirebaseAdmin();

db = admin.firestore();
auth = admin.auth();

export { db, auth, admin };
