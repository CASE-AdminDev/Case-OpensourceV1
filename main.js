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
            this.animate();
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
                this.ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
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
    function startGradientShift() {
        let hueOffset = 0;
        function shift() {
            hueOffset += 0.15;
            const h1 = 217 + Math.sin(hueOffset * 0.01) * 10;
            const h2 = 266 + Math.cos(hueOffset * 0.015) * 12;

            DOM.gradientMesh.style.background = `
        radial-gradient(ellipse 80% 60% at ${20 + Math.sin(hueOffset * 0.005) * 5}% ${30 + Math.cos(hueOffset * 0.007) * 5}%, 
          hsla(${h1}, 90%, 58%, 0.08) 0%, transparent 70%),
        radial-gradient(ellipse 60% 80% at ${80 + Math.cos(hueOffset * 0.006) * 5}% ${70 + Math.sin(hueOffset * 0.008) * 5}%, 
          hsla(${h2}, 70%, 62%, 0.06) 0%, transparent 70%),
        radial-gradient(ellipse 90% 50% at 50% 50%, 
          hsla(${h1}, 90%, 58%, 0.04) 0%, transparent 80%)
      `;

            requestAnimationFrame(shift);
        }
        shift();
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
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Close mobile menu on nav click
                if (DOM.mobileMenuBtn && DOM.navLinks) {
                    DOM.mobileMenuBtn.classList.remove('active');
                    DOM.navLinks.classList.remove('open');
                }
            });
        });
    }

    // ─── Mobile Menu Toggle ───
    function initMobileMenu() {
        if (!DOM.mobileMenuBtn || !DOM.navLinks) return;
        DOM.mobileMenuBtn.addEventListener('click', () => {
            DOM.mobileMenuBtn.classList.toggle('active');
            DOM.navLinks.classList.toggle('open');
        });
    }

    // ─── Stats Counter Animation ───
    function initStatsCounter() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        if (!statNumbers.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = parseInt(el.dataset.target, 10);
                        animateCounter(el, target);
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.5 }
        );

        statNumbers.forEach((el) => observer.observe(el));
    }

    function animateCounter(el, target) {
        const duration = 1800;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out curve
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        }
        requestAnimationFrame(update);
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
        const particles = new ParticleField(DOM.particles);

        // Step 1: 0.0s — Particles fade in
        particles.init(55);
        DOM.particles.classList.add('visible');

        // Step 2: 0.5s — Logo fade in with glow
        await delay(500);
        DOM.loaderLogo.classList.add('visible');

        // Step 3: 1.0s — Typewriter tagline
        await delay(500);
        await typeWriter(DOM.loaderTagline, 'Code. Access. Share. Everywhere.', 60);

        // Step 4: 2.0s — Hide loader, show hero content
        await delay(400);
        DOM.loaderOverlay.classList.add('hidden');

        await delay(300);
        DOM.heroContent.classList.add('visible');
        DOM.navbar.classList.add('visible');

        // Step 5: 2.5s — Hero mockup blur-to-clear
        await delay(500);
        DOM.heroMockup.classList.add('visible');

        // Restart deploy bar animation
        DOM.deployBarFill.style.animation = 'none';
        void DOM.deployBarFill.offsetWidth; // trigger reflow
        DOM.deployBarFill.style.animation = 'deployBar 3s ease-out forwards';

        // Step 6: 3.0s — Gradient mesh begins
        await delay(500);
        DOM.gradientMesh.classList.add('visible');
        startGradientShift();

        // Step 7: 3.5s — Full page interactive
        await delay(500);
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

        // Start everything
        runEntrySequence();
        initScrollReveal();
        initNavbarScroll();
        initSmoothScroll();
        initMobileMenu();
        initStatsCounter();
        initScrollIndicator();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
