/* ═══════════════════════════════════════════════════
   CASE — Data Service (Firebase Firestore)
   All CRUD operations against Firestore.
   Requires firebase-config.js to be loaded first.
   ═══════════════════════════════════════════════════ */

const DataService = (() => {
    'use strict';

    const db = FirebaseConfig.db;
    const auth = FirebaseConfig.auth;

    // ── Helpers ──
    function _uid() {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        return user.uid;
    }

    function _userRef() {
        return db.collection('users').doc(_uid());
    }

    function _generateId() {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function _generateCaseCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return 'CASE-' + code;
    }

    // ═══════════════════════════════════════
    //  USER / PROFILE
    // ═══════════════════════════════════════

    /**
     * Get the current user's profile from Firestore.
     * @returns {Promise<Object|null>} user document data
     */
    async function getUser() {
        const snap = await _userRef().get();
        if (!snap.exists) return null;
        return { uid: snap.id, ...snap.data() };
    }

    /**
     * Create a new user document after sign-up.
     * Also registers the username and CASE code in lookup collections.
     * @param {Object} userData — initial profile fields
     * @returns {Promise<Object>} created user
     */
    async function createUser(userData) {
        const uid = _uid();
        const caseCode = _generateCaseCode();
        const username = userData.username || uid.slice(0, 10).toLowerCase();

        const user = {
            fullName: userData.fullName || '',
            username,
            bio: '',
            role: '',
            photoURL: null,
            socialLinks: { github: '', linkedin: '', portfolio: '' },
            caseCode,
            stats: { profileViews: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        const batch = db.batch();

        // 1. Create user document
        batch.set(db.collection('users').doc(uid), user);

        // 2. Register CASE code for O(1) lookup
        batch.set(db.collection('caseCodes').doc(caseCode), { uid });

        // 3. Register username for uniqueness
        batch.set(db.collection('usernames').doc(username), { uid });

        await batch.commit();
        return { uid, ...user };
    }

    /**
     * Update the current user's profile.
     * Handles username changes by updating the usernames collection.
     * @param {Object} updates — partial user fields to merge
     * @returns {Promise<Object>} updated user
     */
    async function updateUser(updates) {
        const uid = _uid();
        const ref = _userRef();

        // If username is changing, update the usernames collection
        if (updates.username) {
            const oldSnap = await ref.get();
            const oldUsername = oldSnap.data()?.username;

            if (oldUsername && oldUsername !== updates.username) {
                const batch = db.batch();
                batch.delete(db.collection('usernames').doc(oldUsername));
                batch.set(db.collection('usernames').doc(updates.username), { uid });
                batch.update(ref, {
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                await batch.commit();
                const updated = await ref.get();
                return { uid, ...updated.data() };
            }
        }

        await ref.update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        const updated = await ref.get();
        return { uid, ...updated.data() };
    }

    /**
     * Compute profile completion percentage.
     * @returns {Promise<Object>} { percent, missing }
     */
    async function getProfileCompletion() {
        const user = await getUser();
        const projects = await getProjects();
        const certs = await getCertificates();

        if (!user) return { percent: 0, missing: {} };

        const checks = [
            !!user.fullName,
            !!user.username,
            !!user.bio,
            !!user.role,
            !!user.photoURL,
            !!user.socialLinks?.github || !!user.socialLinks?.linkedin,
            projects.length > 0,
            certs.length > 0,
        ];
        const done = checks.filter(Boolean).length;
        return {
            percent: Math.round((done / checks.length) * 100),
            missing: {
                photo: !user.photoURL,
                bio: !user.bio,
                project: projects.length === 0,
                certificate: certs.length === 0,
                social: !user.socialLinks?.github && !user.socialLinks?.linkedin,
            },
        };
    }

    /**
     * Check if a username is available.
     * @param {string} username
     * @returns {Promise<Object>} { available: boolean }
     */
    async function checkUsername(username) {
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            return { available: false, reason: 'Invalid format (3-20 lowercase letters, numbers, underscores)' };
        }

        const user = await getUser();
        if (user && user.username === username) return { available: true };

        const snap = await db.collection('usernames').doc(username).get();
        return { available: !snap.exists };
    }

    /**
     * Increment profile views (called when someone views a public profile).
     * Uses Firestore increment for atomicity.
     * @param {string} uid — the profile owner's uid
     */
    async function incrementViews(uid) {
        await db.collection('users').doc(uid).update({
            'stats.profileViews': firebase.firestore.FieldValue.increment(1),
        });
    }

    // ═══════════════════════════════════════
    //  PROJECTS (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all projects for the current user.
     * @returns {Promise<Array>}
     */
    async function getProjects() {
        const snap = await _userRef()
            .collection('projects')
            .orderBy('createdAt', 'desc')
            .get();

        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Add a new project.
     * @param {Object} project — { name, description, liveUrl, techStack }
     * @returns {Promise<Object>} created project with id
     */
    async function addProject(project) {
        const id = _generateId();
        const data = {
            name: project.name || '',
            description: project.description || '',
            liveUrl: project.liveUrl || '',
            techStack: project.techStack || [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('projects').doc(id).set(data);
        return { id, ...data };
    }

    /**
     * Update an existing project.
     * @param {string} id — project document id
     * @param {Object} updates — fields to merge
     * @returns {Promise<Object>}
     */
    async function updateProject(id, updates) {
        const ref = _userRef().collection('projects').doc(id);
        await ref.update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        const snap = await ref.get();
        return { id: snap.id, ...snap.data() };
    }

    /**
     * Delete a project.
     * @param {string} id
     */
    async function deleteProject(id) {
        await _userRef().collection('projects').doc(id).delete();
    }

    // ═══════════════════════════════════════
    //  CERTIFICATES (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all certificates for the current user.
     * @returns {Promise<Array>}
     */
    async function getCertificates() {
        const snap = await _userRef()
            .collection('certificates')
            .orderBy('createdAt', 'desc')
            .get();

        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Add a new certificate.
     * @param {Object} cert — { name, driveUrl }
     * @returns {Promise<Object>}
     */
    async function addCertificate(cert) {
        const certs = await getCertificates();
        if (certs.length >= 10) throw new Error('Maximum 10 certificates. Remove one to add more.');

        const id = _generateId();
        const data = {
            name: cert.name || '',
            driveUrl: cert.driveUrl || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('certificates').doc(id).set(data);
        return { id, ...data };
    }

    /**
     * Delete a certificate.
     * @param {string} id
     */
    async function deleteCertificate(id) {
        await _userRef().collection('certificates').doc(id).delete();
    }

    // ═══════════════════════════════════════
    //  CASE CODE / PUBLIC PROFILE LOOKUP
    // ═══════════════════════════════════════

    /**
     * Lookup a user by CASE code or username.
     * @param {string} query — CASE code (e.g., "CASE-ABC12") or username
     * @returns {Promise<Object>} { found, username, user }
     */
    async function lookupProfile(query) {
        const code = query.toUpperCase().replace(/\s/g, '');
        let uid = null;

        // Try CASE code lookup first
        const codeSnap = await db.collection('caseCodes').doc(code).get();
        if (codeSnap.exists) {
            uid = codeSnap.data().uid;
        }

        // If not found by code, try username
        if (!uid) {
            const usernameSnap = await db.collection('usernames').doc(query.toLowerCase()).get();
            if (usernameSnap.exists) {
                uid = usernameSnap.data().uid;
            }
        }

        if (!uid) return { found: false };

        // Fetch user profile
        const userSnap = await db.collection('users').doc(uid).get();
        if (!userSnap.exists) return { found: false };

        const user = { uid: userSnap.id, ...userSnap.data() };
        return {
            found: true,
            username: user.username,
            user,
        };
    }

    /**
     * Get a full public profile by username (includes projects & certs).
     * Called when viewing /profile?u=username
     * @param {string} username
     * @returns {Promise<Object>} { found, user, projects, certificates }
     */
    async function getPublicProfile(username) {
        // Lookup uid from username
        const usernameSnap = await db.collection('usernames').doc(username).get();
        if (!usernameSnap.exists) return { found: false };

        const uid = usernameSnap.data().uid;
        const userSnap = await db.collection('users').doc(uid).get();
        if (!userSnap.exists) return { found: false };

        // Increment view count
        await incrementViews(uid);

        // Fetch projects & certificates in parallel
        const [projSnap, certSnap] = await Promise.all([
            db.collection('users').doc(uid).collection('projects').orderBy('createdAt', 'desc').get(),
            db.collection('users').doc(uid).collection('certificates').orderBy('createdAt', 'desc').get(),
        ]);

        const user = { uid, ...userSnap.data() };
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const certificates = certSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return { found: true, user, projects, certificates };
    }

    // ═══════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════

    return {
        getUser,
        createUser,
        updateUser,
        getProfileCompletion,
        checkUsername,
        incrementViews,
        getProjects,
        addProject,
        updateProject,
        deleteProject,
        getCertificates,
        addCertificate,
        deleteCertificate,
        lookupProfile,
        getPublicProfile,
    };
})();
