/* ═══════════════════════════════════════════════════
   CASE — Main JavaScript
   Entry animations, particles, scroll reveal, interactions
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOM References ───
    const DOM = {
        particles: document.getElementById('particles'),
        gradientMesh: document.getElementById('gradientMesh'),
        loaderOverlay: document.getElementById('loaderOverlay'),
        loaderLogo: document.getElementById('loaderLogo'),
        loaderTagline: document.getElementById('loaderTagline'),
        navbar: document.getElementById('navbar'),
        heroContent: document.getElementById('heroContent'),
        heroMockup: document.getElementById('heroMockup'),
        deployBarFill: document.getElementById('deployBarFill'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navLinks: document.getElementById('navLinks'),
        scrollIndicator: document.getElementById('scrollIndicator'),
        themeToggle: document.getElementById('themeToggle'),
        themeToggleIcon: document.getElementById('themeToggleIcon'),
        themeToggleText: document.getElementById('themeToggleText'),
    };

    // ─── Particle System ───
    class ParticleField {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        init(count = 50) {
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    radius: Math.random() * 2 + 0.5,
                    dx: (Math.random() - 0.5) * 0.4,
                    dy: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.4 + 0.1,
                    opTarget: Math.random() * 0.5 + 0.2,
                    opSpeed: Math.random() * 0.003 + 0.001,
                    opDir: 1,
                });
            }
            this._running = true;
            // Pause loop when tab is hidden to save CPU
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !this._running) {
                    this._running = true;
                    this.animate();
                }
            });
            this.animate();
        }

        animate() {
            if (document.hidden) {
                this._running = false;
                return;
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const particleRGB = getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim() || '94, 106, 210';

            for (const p of this.particles) {
                // Move
                p.x += p.dx;
                p.y += p.dy;

                // Wrap
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                // Pulse opacity
                p.opacity += p.opSpeed * p.opDir;
                if (p.opacity >= p.opTarget + 0.25) p.opDir = -1;
                if (p.opacity <= p.opTarget - 0.15) p.opDir = 1;

                // Draw
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${particleRGB}, ${p.opacity})`;
                this.ctx.fill();
            }

            requestAnimationFrame(() => this.animate());
        }
    }


    // ─── Typewriter Effect ───
    function typeWriter(element, text, speed = 55) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            type();
        });
    }

    // ─── Gradient Mesh Hue Shift ───
    // Throttled to every 4th frame (~15fps) — the gradient is subtle and doesn't
    // need 60fps updates. This cuts gradient-related style recalculations by 75%.
    function startGradientShift() {
        let hueOffset = 0;
        let frameCount = 0;
        function shift() {
            requestAnimationFrame(shift);
            if (document.hidden) return;
            if (++frameCount % 4 !== 0) return;

            hueOffset += 0.6; // compensate for skipped frames (0.15 * 4)
            const h1 = 217 + Math.sin(hueOffset * 0.01) * 10;
            const h2 = 266 + Math.cos(hueOffset * 0.015) * 12;
            const computed = getComputedStyle(document.documentElement);
            const alpha1 = parseFloat(computed.getPropertyValue('--mesh-alpha-1')) || 0.08;
            const alpha2 = parseFloat(computed.getPropertyValue('--mesh-alpha-2')) || 0.06;
            const alpha3 = parseFloat(computed.getPropertyValue('--mesh-alpha-3')) || 0.04;
            const light1 = parseFloat(computed.getPropertyValue('--mesh-light-1')) || 58;
            const light2 = parseFloat(computed.getPropertyValue('--mesh-light-2')) || 62;

            DOM.gradientMesh.style.background = `
        radial-gradient(ellipse 80% 60% at ${20 + Math.sin(hueOffset * 0.005) * 5}% ${30 + Math.cos(hueOffset * 0.007) * 5}%, 
          hsla(${h1}, 90%, ${light1}%, ${alpha1}) 0%, transparent 70%),
        radial-gradient(ellipse 60% 80% at ${80 + Math.cos(hueOffset * 0.006) * 5}% ${70 + Math.sin(hueOffset * 0.008) * 5}%, 
          hsla(${h2}, 70%, ${light2}%, ${alpha2}) 0%, transparent 70%),
        radial-gradient(ellipse 90% 50% at 50% 50%, 
          hsla(${h1}, 90%, ${light1}%, ${alpha3}) 0%, transparent 80%)
      `;
        }
        shift();
    }

    // ─── Theme Controls ───
    const THEME_KEY = 'case-theme';

    function updateThemeControlState(theme) {
        if (DOM.themeToggleIcon) DOM.themeToggleIcon.textContent = theme === 'dark' ? '☀' : '🌙';
        if (DOM.themeToggleText) DOM.themeToggleText.textContent = theme === 'dark' ? 'Light' : 'Dark';
        if (DOM.themeToggle) DOM.themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);

        document.querySelectorAll('[data-theme-choice]').forEach((button) => {
            const active = button.dataset.themeChoice === theme;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function applyTheme(theme, persist = true) {
        const finalTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', finalTheme);
        updateThemeControlState(finalTheme);

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
            if (color) metaTheme.setAttribute('content', color);
        }

        if (persist) localStorage.setItem(THEME_KEY, finalTheme);
    }

    function initTheme() {
        const storedTheme = localStorage.getItem(THEME_KEY);
        applyTheme(storedTheme || 'light', false);

        DOM.themeToggle?.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });

        document.querySelectorAll('[data-theme-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                applyTheme(button.dataset.themeChoice || 'light');
            });
        });
    }

    // ─── Scroll Reveal Observer ───
    function initScrollReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }

    // ─── Navbar Scroll Effect ───
    function initNavbarScroll() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    DOM.navbar.classList.toggle('scrolled', window.scrollY > 60);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ─── Smooth Scroll for Anchor Links ───
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(a.getAttribute('href'));
                if (target) {
                    // Close mobile menu first if open
                    if (DOM.mobileMenuBtn && DOM.navLinks && DOM.navLinks.classList.contains('open')) {
                        DOM.mobileMenuBtn.classList.remove('active');
                        DOM.navLinks.classList.remove('open');
                        const backdrop = document.querySelector('.mobile-menu-backdrop');
                        if (backdrop) backdrop.classList.remove('visible');
                        document.body.classList.remove('menu-open');
                        document.body.style.top = '';
                    }
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ─── Mobile Menu Toggle ───
    function initMobileMenu() {
        if (!DOM.mobileMenuBtn || !DOM.navLinks) return;

        // Create backdrop element
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        document.body.appendChild(backdrop);

        let scrollY = 0;

        function openMenu() {
            scrollY = window.scrollY;
            DOM.mobileMenuBtn.classList.add('active');
            DOM.navLinks.classList.add('open');
            backdrop.classList.add('visible');
            document.body.classList.add('menu-open');
            document.body.style.top = `-${scrollY}px`;
        }

        function closeMenu() {
            DOM.mobileMenuBtn.classList.remove('active');
            DOM.navLinks.classList.remove('open');
            backdrop.classList.remove('visible');
            document.body.classList.remove('menu-open');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }

        function isMenuOpen() {
            return DOM.navLinks.classList.contains('open');
        }

        DOM.mobileMenuBtn.addEventListener('click', () => {
            if (isMenuOpen()) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close on backdrop click
        backdrop.addEventListener('click', closeMenu);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen()) {
                closeMenu();
            }
        });
    }

    // ─── Scroll Indicator Hide ───
    function initScrollIndicator() {
        if (!DOM.scrollIndicator) return;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                DOM.scrollIndicator.style.opacity = '0';
                DOM.scrollIndicator.style.pointerEvents = 'none';
            } else {
                DOM.scrollIndicator.style.opacity = '0.6';
                DOM.scrollIndicator.style.pointerEvents = 'auto';
            }
        }, { passive: true });
    }

    // ─── Entry Animation Sequence ───
    async function runEntrySequence() {
        const isMobile = window.innerWidth < 768;
        const particles = new ParticleField(DOM.particles);

        // Step 1: 0.0s — Particles fade in (fewer on mobile to save GPU)
        particles.init(isMobile ? 25 : 45);
        DOM.particles.classList.add('visible');

        // Step 2: 0.3s — Logo fade in with glow
        await delay(300);
        DOM.loaderLogo.classList.add('visible');

        // Step 3: 0.6s — Typewriter tagline (faster typing)
        await delay(300);
        await typeWriter(DOM.loaderTagline, 'Code. Access. Share. Everywhere.', 40);

        // Step 4: ~1.3s — Hide loader, show hero content
        await delay(200);
        DOM.loaderOverlay.classList.add('hidden');

        await delay(100);
        DOM.heroContent.classList.add('visible');
        DOM.navbar.classList.add('visible');

        // Step 5: ~1.6s — Hero mockup blur-to-clear
        await delay(250);
        DOM.heroMockup.classList.add('visible');

        // Restart link-added bar animation
        DOM.deployBarFill.style.animation = 'none';
        void DOM.deployBarFill.offsetWidth; // trigger reflow
        DOM.deployBarFill.style.animation = 'deployBar 2.5s ease-out forwards';

        // Step 6: ~1.85s — Gradient mesh begins
        await delay(150);
        DOM.gradientMesh.classList.add('visible');
        startGradientShift();

        // Step 7: ~2.0s — Full page interactive
        await delay(150);
        document.body.style.overflowY = 'auto';
    }

    // ─── Utility ───
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ─── Init ───
    function init() {
        // Prevent scroll during entry
        document.body.style.overflowY = 'hidden';
        initTheme();

        // Start everything
        runEntrySequence();
        initScrollReveal();
        initNavbarScroll();
        initSmoothScroll();
        initMobileMenu();
        initScrollIndicator();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
