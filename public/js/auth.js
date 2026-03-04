/* ═══════════════════════════════════════════════════
   CASE — Authentication Service (Email/Password)
   Sign up, login, logout, auth state management.
   Requires firebase-config.js to be loaded first.
   ═══════════════════════════════════════════════════ */

const AuthService = (() => {
    'use strict';

    const auth = FirebaseConfig.auth;

    // ── State listeners ──
    const _listeners = [];

    /**
     * Subscribe to auth state changes.
     * @param {Function} callback — fn(user | null)
     * @returns {Function} unsubscribe
     */
    function onAuthStateChanged(callback) {
        const unsub = auth.onAuthStateChanged(callback);
        _listeners.push(unsub);
        return unsub;
    }

    /**
     * Get the current user synchronously (may be null if not yet resolved).
     * @returns {Object|null}
     */
    function getCurrentUser() {
        return auth.currentUser;
    }

    /**
     * Wait for auth to resolve (useful on page load).
     * @returns {Promise<Object|null>}
     */
    function waitForAuth() {
        return new Promise(resolve => {
            const unsub = auth.onAuthStateChanged(user => {
                unsub();
                resolve(user);
            });
        });
    }

    /**
     * Sign up with email and password.
     * Creates a Firestore user document after successful auth.
     * @param {string} email
     * @param {string} password
     * @param {string} fullName
     * @param {string} username
     * @returns {Promise<Object>} user profile
     */
    async function signUp(email, password, fullName, username) {
        // Validate username format
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            throw new Error('Username must be 3-20 characters: lowercase letters, numbers, underscores only.');
        }

        // Check username availability before creating auth account
        const usernameSnap = await FirebaseConfig.db.collection('usernames').doc(username).get();
        if (usernameSnap.exists) {
            throw new Error('Username is already taken. Try another one.');
        }

        // Create Firebase Auth account
        const cred = await auth.createUserWithEmailAndPassword(email, password);

        // Update display name in Auth
        await cred.user.updateProfile({ displayName: fullName });

        // Create Firestore user document
        const profile = await DataService.createUser({ fullName, username });
        return profile;
    }

    /**
     * Log in with email and password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Firebase user
     */
    async function login(email, password) {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    }

    /**
     * Log out the current user.
     */
    async function logout() {
        await auth.signOut();
    }

    /**
     * Send a password reset email.
     * @param {string} email
     */
    async function resetPassword(email) {
        await auth.sendPasswordResetEmail(email);
    }

    /**
     * Map Firebase Auth error codes to user-friendly messages.
     * @param {Error} error — Firebase auth error
     * @returns {string}
     */
    function getErrorMessage(error) {
        const map = {
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/operation-not-allowed': 'Email/password sign-up is not enabled.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Try again.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/network-request-failed': 'Network error. Check your connection.',
        };
        return map[error.code] || error.message || 'Something went wrong. Try again.';
    }

    /**
     * Auth guard — redirect to auth page if not logged in.
     * Call this on protected pages (dashboard).
     */
    async function requireAuth() {
        const user = await waitForAuth();
        if (!user) {
            window.location.href = '/public/auth.html';
            return null;
        }
        return user;
    }

    /**
     * Redirect guard — redirect to dashboard if already logged in.
     * Call this on auth page to prevent logged-in users from seeing login.
     */
    async function redirectIfAuth() {
        const user = await waitForAuth();
        if (user) {
            window.location.href = '/public/dashboard.html';
            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════

    return {
        onAuthStateChanged,
        getCurrentUser,
        waitForAuth,
        signUp,
        login,
        logout,
        resetPassword,
        getErrorMessage,
        requireAuth,
        redirectIfAuth,
    };
})();
