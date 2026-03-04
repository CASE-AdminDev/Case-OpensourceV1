/* ═══════════════════════════════════════════════════
   CASE — Auth Page Controller
   Handles form submissions, card toggling, and
   real-time username validation for auth.html.
   Requires: firebase-config.js, data-service.js,
             auth.js to be loaded first.
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── DOM Refs ──
    const cards = {
        login:  document.getElementById('loginCard'),
        signup: document.getElementById('signupCard'),
        reset:  document.getElementById('resetCard'),
    };

    const loginForm      = document.getElementById('loginForm');
    const signupForm     = document.getElementById('signupForm');
    const resetForm      = document.getElementById('resetForm');

    const loginEmail     = document.getElementById('loginEmail');
    const loginPassword  = document.getElementById('loginPassword');
    const loginError     = document.getElementById('loginError');
    const loginBtn       = document.getElementById('loginBtn');

    const signupName     = document.getElementById('signupName');
    const signupUsername = document.getElementById('signupUsername');
    const signupEmail    = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupError    = document.getElementById('signupError');
    const signupBtn      = document.getElementById('signupBtn');
    const usernameHint   = document.getElementById('usernameHint');

    const resetEmail     = document.getElementById('resetEmail');
    const resetError     = document.getElementById('resetError');
    const resetSuccess   = document.getElementById('resetSuccess');
    const resetBtn       = document.getElementById('resetBtn');

    // ── Card Navigation ──
    function showCard(name) {
        Object.values(cards).forEach(c => c.classList.add('auth__card--hidden'));
        cards[name].classList.remove('auth__card--hidden');
        // Re-trigger fade animation
        cards[name].style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        cards[name].offsetHeight; // force reflow
        cards[name].style.animation = '';
        // Clear errors on card switch
        clearErrors();
    }

    document.getElementById('showSignupBtn').addEventListener('click', () => showCard('signup'));
    document.getElementById('showLoginBtn').addEventListener('click',  () => showCard('login'));
    document.getElementById('forgotBtn').addEventListener('click',     () => showCard('reset'));
    document.getElementById('backToLoginBtn').addEventListener('click',() => showCard('login'));

    function clearErrors() {
        loginError.textContent = '';
        signupError.textContent = '';
        resetError.textContent = '';
        resetSuccess.textContent = '';
    }

    // ── Loading State Helpers ──
    function setLoading(btn, loading) {
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Please wait…';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        }
    }

    // ── Username Validation (real-time) ──
    let usernameTimer = null;
    const usernameRegex = /^[a-z0-9_]{3,20}$/;

    signupUsername.addEventListener('input', () => {
        const raw = signupUsername.value;
        // Force lowercase, strip invalid chars
        signupUsername.value = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
        const val = signupUsername.value;

        clearTimeout(usernameTimer);

        if (!val) {
            usernameHint.textContent = '3-20 characters: lowercase, numbers, underscores';
            usernameHint.className = 'auth__hint';
            return;
        }

        if (val.length < 3) {
            usernameHint.textContent = 'Username must be at least 3 characters';
            usernameHint.className = 'auth__hint auth__hint--error';
            return;
        }

        if (!usernameRegex.test(val)) {
            usernameHint.textContent = 'Only lowercase letters, numbers, and underscores';
            usernameHint.className = 'auth__hint auth__hint--error';
            return;
        }

        usernameHint.textContent = 'Checking availability…';
        usernameHint.className = 'auth__hint';

        usernameTimer = setTimeout(async () => {
            try {
                const available = await DataService.checkUsername(val);
                if (signupUsername.value !== val) return; // stale check
                if (available) {
                    usernameHint.textContent = '✓ Username is available';
                    usernameHint.className = 'auth__hint auth__hint--success';
                } else {
                    usernameHint.textContent = '✗ Username is already taken';
                    usernameHint.className = 'auth__hint auth__hint--error';
                }
            } catch {
                usernameHint.textContent = 'Could not check availability';
                usernameHint.className = 'auth__hint';
            }
        }, 500); // debounce 500ms
    });

    // ── Login ──
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            loginError.textContent = 'Please fill in all fields.';
            return;
        }

        setLoading(loginBtn, true);
        try {
            await AuthService.login(email, password);
            window.location.href = '/public/dashboard.html';
        } catch (err) {
            loginError.textContent = AuthService.getErrorMessage(err);
        } finally {
            setLoading(loginBtn, false);
        }
    });

    // ── Sign Up ──
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';

        const fullName = signupName.value.trim();
        const username = signupUsername.value.trim();
        const email    = signupEmail.value.trim();
        const password = signupPassword.value;

        if (!fullName || !username || !email || !password) {
            signupError.textContent = 'Please fill in all fields.';
            return;
        }

        if (!usernameRegex.test(username)) {
            signupError.textContent = 'Invalid username format.';
            return;
        }

        if (password.length < 6) {
            signupError.textContent = 'Password must be at least 6 characters.';
            return;
        }

        setLoading(signupBtn, true);
        try {
            await AuthService.signUp(email, password, fullName, username);
            window.location.href = '/public/dashboard.html';
        } catch (err) {
            signupError.textContent = AuthService.getErrorMessage(err);
        } finally {
            setLoading(signupBtn, false);
        }
    });

    // ── Reset Password ──
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetError.textContent = '';
        resetSuccess.textContent = '';

        const email = resetEmail.value.trim();

        if (!email) {
            resetError.textContent = 'Please enter your email address.';
            return;
        }

        setLoading(resetBtn, true);
        try {
            await AuthService.resetPassword(email);
            resetSuccess.textContent = 'Reset link sent! Check your inbox.';
        } catch (err) {
            resetError.textContent = AuthService.getErrorMessage(err);
        } finally {
            setLoading(resetBtn, false);
        }
    });

    // ── Redirect If Already Logged In ──
    AuthService.redirectIfAuth();

})();
