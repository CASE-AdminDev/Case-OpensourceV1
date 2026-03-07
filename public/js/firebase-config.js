/* ═══════════════════════════════════════════════════
   CASE — Firebase Configuration
   Initialize Firebase App, Auth & Firestore
   Reads keys from firebase-env.js (gitignored).
   ═══════════════════════════════════════════════════ */

const FirebaseConfig = (() => {
    'use strict';

    // Config is injected by firebase-env.js (loaded before this file).
    // Falls back to hardcoded public config so preview deployments work.
    // Firebase config keys are NOT secret — security is enforced by Firestore rules.
    const _fallback = {
        apiKey: "AIzaSyBgC_R63H3lQmaWNVjC68UTa7Y5vB_VzOU",
        authDomain: "case-v1.firebaseapp.com",
        projectId: "case-v1",
        storageBucket: "case-v1.firebasestorage.app",
        messagingSenderId: "483331019592",
        appId: "1:483331019592:web:d4f09c1bdbfc368a7b597d",
        measurementId: "G-W7TNE7XSK0",
    };
    const config = window.__FIREBASE_CONFIG__ || _fallback;

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
