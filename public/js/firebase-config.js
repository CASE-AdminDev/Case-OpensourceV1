/* ═══════════════════════════════════════════════════
   CASE — Firebase Configuration
   Initialize Firebase App, Auth & Firestore
   Reads keys from firebase-env.js (gitignored).
   ═══════════════════════════════════════════════════ */

const FirebaseConfig = (() => {
    'use strict';

    // Config is injected by firebase-env.js (loaded before this file)
    const config = window.__FIREBASE_CONFIG__;

    if (!config || !config.apiKey) {
        console.error(
            'Firebase config not found. Make sure public/js/firebase-env.js exists.\n' +
            'Copy firebase-env.example.js → firebase-env.js and add your keys.'
        );
        throw new Error('Missing Firebase configuration');
    }

    // Initialize Firebase
    const app = firebase.initializeApp(config);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Enable offline persistence (optional, improves UX)
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not supported in this browser.');
        }
    });

    return { app, auth, db };
})();
