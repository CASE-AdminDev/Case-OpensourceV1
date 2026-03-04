/* ═══════════════════════════════════════════════════
   CASE — Shared Utilities
   Toast, copy, QR, animations
   ═══════════════════════════════════════════════════ */

const Utils = (() => {
    'use strict';

    // ── Toast Notifications ──
    function toast(message, type = 'success', duration = 3000) {
        const existing = document.querySelector('.case-toast');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = `case-toast case-toast--${type}`;
        el.innerHTML = `
            <span class="case-toast__icon">${type === 'success' ? '✓' : '✗'}</span>
            <span class="case-toast__msg">${message}</span>
        `;
        document.body.appendChild(el);

        requestAnimationFrame(() => el.classList.add('case-toast--visible'));

        setTimeout(() => {
            el.classList.remove('case-toast--visible');
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    // ── Copy to Clipboard ──
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            return true;
        }
    }

    // ── Copy Button Handler ──
    function initCopyButton(btn, getText) {
        btn.addEventListener('click', async () => {
            const text = typeof getText === 'function' ? getText() : getText;
            const ok = await copyToClipboard(text);
            if (ok) {
                const original = btn.innerHTML;
                btn.innerHTML = '<span style="color:#22c55e">✓ Copied!</span>';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove('copied');
                }, 2000);
            }
        });
    }

    // ── QR Code Generator (simple canvas-based) ──
    function generateQR(container, url, size = 160) {
        // Use QR Code library from CDN (loaded in HTML)
        if (typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            new QRCode(container, {
                text: url,
                width: size,
                height: size,
                colorDark: '#F1F5F9',
                colorLight: 'transparent',
                correctLevel: QRCode.CorrectLevel.M,
            });
        } else {
            // Fallback: show placeholder
            container.innerHTML = `
                <div style="width:${size}px;height:${size}px;border:1px dashed rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:12px;text-align:center;">
                    QR Code<br>Loading…
                </div>
            `;
        }
    }

    // ── Count-up Animation ──
    function animateCount(element, target, duration = 800) {
        const start = 0;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    // ── Staggered Fade-in ──
    function staggerReveal(selector, delay = 80) {
        const els = document.querySelectorAll(selector);
        els.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * delay);
        });
    }

    // ── Sequential Section Reveal ──
    function sequenceReveal(selectors, delay = 200) {
        selectors.forEach((sel, i) => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * delay);
        });
    }

    // ── Modal Helpers ──
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── Debounce ──
    function debounce(fn, ms = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    // ── Format relative time ──
    function timeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    // ── Escape HTML ──
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── WhatsApp Share ──
    function shareWhatsApp(url, message) {
        const text = encodeURIComponent(message || `Check out my portfolio: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    // ── Email Share ──
    function shareEmail(url, name) {
        const subject = encodeURIComponent(`${name}'s Portfolio — CASE`);
        const body = encodeURIComponent(`Hi,\n\nCheck out my portfolio:\n${url}\n\nBuilt with CASE — case.app`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    return {
        toast,
        copyToClipboard,
        initCopyButton,
        generateQR,
        animateCount,
        staggerReveal,
        sequenceReveal,
        openModal,
        closeModal,
        debounce,
        timeAgo,
        escapeHTML,
        shareWhatsApp,
        shareEmail,
    };
})();
