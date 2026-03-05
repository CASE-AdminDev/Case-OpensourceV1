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
        apiKey: "AIzaSyDkQRvc_q5e9h8eYYp4fB9adQnNEVewXSs",
        authDomain: "case-edition1.firebaseapp.com",
        projectId: "case-edition1",
        storageBucket: "case-edition1.firebasestorage.app",
        messagingSenderId: "332314252593",
        appId: "1:332314252593:web:9497edd289934736d78c10",
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
