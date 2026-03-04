/* ═══════════════════════════════════════════════════
   CASE — Explore / Code Entry Logic
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const input = document.getElementById('codeInput');
    const btn = document.getElementById('viewBtn');
    const error = document.getElementById('codeError');

    // Auto-format as user types: add "CASE-" prefix handling
    input.addEventListener('input', () => {
        error.classList.remove('visible');
        input.classList.remove('explore__input--error');

        // Uppercase
        let val = input.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
        input.value = val;
    });

    // Submit on Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submit();
        }
    });

    btn.addEventListener('click', submit);

    async function submit() {
        let code = input.value.trim().toUpperCase();

        if (!code) {
            showError('Please enter a CASE code.');
            return;
        }

        // Normalize: allow entering just the suffix
        if (!code.startsWith('CASE-') && code.length <= 5) {
            code = 'CASE-' + code;
        }

        // Show spinner
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Looking up...';

        try {
            const result = await DataService.lookupProfile(code);

            if (result.found) {
                // Brief pause for visual feedback
                await new Promise(r => setTimeout(r, 400));
                window.location.href = `/public/profile.html?u=${result.username}`;
            } else {
                showError('Code not found. Check and try again.');
                btn.innerHTML = 'View Profile <span>→</span>';
                btn.disabled = false;
            }
        } catch (err) {
            showError('Something went wrong. Try again.');
            btn.innerHTML = 'View Profile <span>→</span>';
            btn.disabled = false;
        }
    }

    function showError(msg) {
        error.textContent = msg;
        error.classList.add('visible');
        input.classList.add('explore__input--error');

        // Remove error class after animation
        setTimeout(() => {
            input.classList.remove('explore__input--error');
        }, 500);
    }

    // Focus input on load
    setTimeout(() => input.focus(), 100);
})();
