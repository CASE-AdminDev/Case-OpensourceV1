/* ═══════════════════════════════════════════════════════════════
   CASE — Cinematic Profile Loader Engine  v5.0
   No blast. Clean 5-second timeline:
     0.0 – 2.0 s  FORM    : particles converge from outer ring → sphere
     2.0 – 3.8 s  SPIN    : sphere rotates with wireframe + equatorial glow
     3.8 – 5.0 s  EXPAND  : sphere swells and explodes outward
   CASE logo drawn on canvas with precise character-width measurement.
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ═══════════ TIMING ═══════════ */
    const MIN_SHOW_MS = 5000;
    const FORM_END = 2000;   // ms
    const SPIN_END = 3800;   // ms
    const EXPAND_END = 5000;   // ms
    const BOOT_TIME = Date.now();

    /* ═══════════ DEVICE + QUALITY ═══════════ */
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth < 1024);

    const QUALITY_PRESETS = {
        ULTRA: {
            dprMobile: 3,
            dprDesktop: 4,
            sphereNMobile: 260,
            sphereNDesktop: 420,
            sphereMinMobileMul: 0.23,
            sphereMinDesktopPx: 170,
            sphereMaxMobileMul: 1.2,
            sphereMaxDesktopPx: 900,
            starNMobile: 140,
            starNDesktop: 260,
            logoShadowWhite: 36,
            logoShadowAccent: 56,
            particleGlowMul: 6.2,
            particleGlowOpacity: 0.58,
            spinBase: 0.005,
            spinBoost: 0.014,
            spinBrake: 0.8,
            enableStarGlow: true,
            enableWireframe: true,
            enableRing: true,
            frameCap: 0,
        },
        BALANCED: {
            dprMobile: 2,
            dprDesktop: 3,
            sphereNMobile: 140,
            sphereNDesktop: 280,
            sphereMinMobileMul: 0.21,
            sphereMinDesktopPx: 160,
            sphereMaxMobileMul: 1.0,
            sphereMaxDesktopPx: 760,
            starNMobile: 80,
            starNDesktop: 170,
            logoShadowWhite: 24,
            logoShadowAccent: 38,
            particleGlowMul: 5.4,
            particleGlowOpacity: 0.5,
            spinBase: 0.0045,
            spinBoost: 0.011,
            spinBrake: 0.84,
            enableStarGlow: true,
            enableWireframe: true,
            enableRing: true,
            frameCap: isMobile ? 45 : 0,
        },
        BATTERY: {
            dprMobile: 1.5,
            dprDesktop: 2,
            sphereNMobile: 90,
            sphereNDesktop: 170,
            sphereMinMobileMul: 0.18,
            sphereMinDesktopPx: 140,
            sphereMaxMobileMul: 0.85,
            sphereMaxDesktopPx: 620,
            starNMobile: 45,
            starNDesktop: 90,
            logoShadowWhite: 12,
            logoShadowAccent: 18,
            particleGlowMul: 4.6,
            particleGlowOpacity: 0.38,
            spinBase: 0.0038,
            spinBoost: 0.008,
            spinBrake: 0.88,
            enableStarGlow: false,
            enableWireframe: false,
            enableRing: false,
            frameCap: isMobile ? 30 : 45,
        },
    };

    function resolveQualityMode() {
        const normalize = v => String(v || '').trim().toUpperCase();
        const fromQuery = normalize(new URLSearchParams(window.location.search).get('loaderQuality'));
        const fromStorage = normalize(window.localStorage && localStorage.getItem('case_loader_quality'));
        const fromGlobal = normalize(window.CASE_LOADER_QUALITY);
        const pick = fromQuery || fromStorage || fromGlobal || 'ULTRA';
        return QUALITY_PRESETS[pick] ? pick : 'ULTRA';
    }

    const qualityMode = resolveQualityMode();
    const quality = QUALITY_PRESETS[qualityMode];
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? quality.dprMobile : quality.dprDesktop);

    /* ═══════════ SPHERE CONFIG ═══════════ */
    const vMin = Math.min(window.innerWidth, window.innerHeight);
    const vMax = Math.max(window.innerWidth, window.innerHeight);
    const SPHERE_N = isMobile ? quality.sphereNMobile : quality.sphereNDesktop;   // particle count
    const SPHERE_R_MIN = isMobile ? Math.round(vMin * quality.sphereMinMobileMul) : quality.sphereMinDesktopPx;   // radius when formed
    const SPHERE_R_MAX = isMobile ? Math.round(vMax * quality.sphereMaxMobileMul) : quality.sphereMaxDesktopPx;   // radius at full expand
    const START_MULT = 3.2;   // particles start this many radii away

    /* ═══════════ PHRASES ═══════════ */
    const PHRASES = [
        'Fetching academic records…',
        'Mapping career journey…',
        'Assembling project portfolio…',
        'Decrypting achievements…',
        'Calibrating neural index…',
        'Rendering digital identity…',
        'Compiling certifications…',
        'Synchronising milestones…',
        'Bootstrapping CASE profile…',
    ];

    /* ═══════════ DOM ═══════════ */
    const loader = document.getElementById('caseLoader');
    const canvas = document.getElementById('loaderCanvas');
    const barEl = document.getElementById('loaderBar');
    const phraseEl = document.getElementById('loaderPhrase');
    const hudPct = document.getElementById('hudPct');
    const hudStatus = document.getElementById('hudStatus');
    if (!loader || !canvas) return;

    /* ═══════════ CANVAS ═══════════ */
    const ctx = canvas.getContext('2d');
    let W, H, cx, cy;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = W / 2;
        cy = H / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══════════ EASING ═══════════ */
    const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeInExpo = t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10);

    /* ═══════════ STAR-FIELD ═══════════ */
    const STAR_N = isMobile ? quality.starNMobile : quality.starNDesktop;
    const stars = Array.from({ length: STAR_N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        dx: (Math.random() - 0.5) * 0.18,
        dy: (Math.random() - 0.5) * 0.18,
        op: Math.random() * 0.65 + 0.15,
        tph: Math.random() * Math.PI * 2,
        tsp: Math.random() * 0.016 + 0.004,
        hue: [210, 245, 185, 160][Math.floor(Math.random() * 4)],
    }));

    function drawStars() {
        stars.forEach(s => {
            s.x += s.dx; s.y += s.dy;
            s.tph += s.tsp;
            if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
            if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
            const tw = 0.3 + 0.7 * Math.abs(Math.sin(s.tph));
            const op = s.op * tw;
            if (quality.enableStarGlow) {
                const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
                rg.addColorStop(0, `hsla(${s.hue},90%,72%,${(op * 0.4).toFixed(3)})`);
                rg.addColorStop(1, 'transparent');
                ctx.fillStyle = rg;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = `hsla(${s.hue},90%,93%,${op.toFixed(3)})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });
    }

    /* ═══════════ CANVAS LOGO — precise character placement ═══════════ */
    let logoAlpha = 0;

    function drawCaseLogo(expandT) {
        /* Fade in during first 800 ms of FORM phase */
        logoAlpha = Math.min(logoAlpha + 0.016, 1);

        const FONT_SIZE = Math.min(Math.round(W * 0.072), 96);
        const FONT = `800 ${FONT_SIZE}px Syne, sans-serif`;

        ctx.save();
        ctx.font = FONT;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        /* Measure each part to compute total width */
        const wC = ctx.measureText('C').width;
        const wA = ctx.measureText('A').width;
        const wSE = ctx.measureText('SE').width;
        const totalW = wC + wA + wSE;
        const startX = cx - totalW / 2;

        /* Scale up very slightly during expand for drama */
        const scale = 1 + (expandT || 0) * 0.14;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        /* ── Ambient glow behind the word ── */
        const glowR = FONT_SIZE * 2.0;
        const glowA = logoAlpha * (0.20 + (expandT || 0) * 0.12);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        glow.addColorStop(0, `rgba(59,130,246,${glowA.toFixed(3)})`);
        glow.addColorStop(0.5, `rgba(139,92,246,${(glowA * 0.4).toFixed(3)})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

        /* ── Draw  C  (white) ── */
        ctx.shadowColor = `rgba(59,130,246,${(logoAlpha * 0.75).toFixed(3)})`;
        ctx.shadowBlur = quality.logoShadowWhite;
        ctx.fillStyle = `rgba(241,245,249,${logoAlpha.toFixed(3)})`;
        ctx.fillText('C', startX, cy);

        /* ── Draw  A  (accent blue) ── */
        ctx.shadowColor = `rgba(59,130,246,${logoAlpha.toFixed(3)})`;
        ctx.shadowBlur = quality.logoShadowAccent;
        ctx.fillStyle = `rgba(59,130,246,${logoAlpha.toFixed(3)})`;
        ctx.fillText('A', startX + wC, cy);

        /* ── Draw  SE  (white) ── */
        ctx.shadowColor = `rgba(59,130,246,${(logoAlpha * 0.75).toFixed(3)})`;
        ctx.shadowBlur = quality.logoShadowWhite;
        ctx.fillStyle = `rgba(241,245,249,${logoAlpha.toFixed(3)})`;
        ctx.fillText('SE', startX + wC + wA, cy);

        ctx.restore();
    }

    /* ═══════════ FIBONACCI SPHERE ═══════════ */
    function fibonacciSphere(n) {
        const pts = [], gold = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
            const y = 1 - (i / (n - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            pts.push({ x: Math.cos(gold * i) * r, y, z: Math.sin(gold * i) * r });
        }
        return pts;
    }
    const targets = fibonacciSphere(SPHERE_N);

    /* ═══════════ PARTICLES ═══════════ */
    const particles = targets.map(t => {
        /* Start position: same direction as final position, but far away */
        const dist = SPHERE_R_MIN * START_MULT;
        return {
            /* Start offset from centre (same direction as sphere surface point) */
            ox: t.x * dist,
            oy: t.y * dist,
            /* Sphere surface target (unit vector) */
            tx: t.x, ty: t.y, tz: t.z,
            hue: 210 + Math.random() * 85,
            size: Math.random() * 2.0 + 0.7,
        };
    });

    /* ═══════════ 3-D PROJECTION ═══════════ */
    let rotY = 0, rotX = 0.28;

    function project(ux, uy, uz, radius) {
        /* Y-axis rotation */
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const x1 = ux * cosY + uz * sinY;
        const z1 = -ux * sinY + uz * cosY;
        /* X-axis rotation */
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const y1 = uy * cosX - z1 * sinX;
        const z2 = uy * sinX + z1 * cosX;
        /* Perspective */
        const fov = 520 / (520 + z2 * radius);
        return { sx: cx + x1 * radius * fov, sy: cy + y1 * radius * fov, scale: fov, depth: z2 };
    }

    /* ═══════════ MAIN DRAW ═══════════ */
    function draw(elapsed) {
        /* Phase fractions (0→1) */
        const formT = elapsed <= FORM_END ? Math.min(elapsed / FORM_END, 1) : 1;
        const spinT = elapsed <= FORM_END ? 0 : Math.min((elapsed - FORM_END) / (SPIN_END - FORM_END), 1);
        const expandT = elapsed <= SPIN_END ? 0 : Math.min((elapsed - SPIN_END) / (EXPAND_END - SPIN_END), 1);

        /* Live sphere radius */
        const sphereR = SPHERE_R_MIN + easeInExpo(expandT) * (SPHERE_R_MAX - SPHERE_R_MIN);

        /* Rotation: speeds up through spin, slows on expand */
        rotY += (quality.spinBase + spinT * quality.spinBoost) * (1 - expandT * quality.spinBrake);

        /* ── CASE logo drawn AFTER particles — see render loop ── */
        /* We expose expandT so the loop can pass it to drawCaseLogo */
        lastExpandT = expandT;

        /* ── Particles ── */
        const ft = easeInOutCubic(formT);   // smooth 0→1 easing for FORM

        particles.forEach(p => {
            /* FORM: interpolate from start offset to sphere surface */
            const sp = project(p.tx, p.ty, p.tz, sphereR);

            /* During FORM: lerp from outer position to sphere pos */
            let screenX, screenY, alpha, pSize;

            if (formT < 1) {
                /* Start at outer ring, converge inward */
                screenX = (cx + p.ox) + (sp.sx - (cx + p.ox)) * ft;
                screenY = (cy + p.oy) + (sp.sy - (cy + p.oy)) * ft;
                alpha = ft * (0.45 + sp.depth * 0.55);
                pSize = p.size * (0.4 + ft * 0.6);
            } else {
                /* SPIN / EXPAND: locked to sphere surface */
                screenX = sp.sx;
                screenY = sp.sy;
                const fadeExp = expandT > 0.35 ? 1 - (expandT - 0.35) / 0.65 : 1;
                alpha = (0.4 + sp.depth * 0.6) * fadeExp;
                pSize = p.size * sp.scale * (1 + expandT * 0.8);
            }

            const opacity = Math.max(0, Math.min(alpha, 1));
            if (opacity < 0.015) return;

            const gw = pSize * quality.particleGlowMul;
            const gg = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, gw);
            gg.addColorStop(0, `hsla(${p.hue},88%,70%,${(opacity * quality.particleGlowOpacity).toFixed(3)})`);
            gg.addColorStop(1, 'transparent');
            ctx.fillStyle = gg;
            ctx.beginPath(); ctx.arc(screenX, screenY, gw, 0, Math.PI * 2); ctx.fill();

            /* Core dot */
            ctx.fillStyle = `hsla(${p.hue},85%,68%,${opacity.toFixed(3)})`;
            ctx.beginPath(); ctx.arc(screenX, screenY, Math.max(pSize, 0.5), 0, Math.PI * 2);
            ctx.fill();
        });

        /* ── Wireframe lattice (spin phase, fades on expand) ── */
        const wireA = spinT > 0 ? Math.min(spinT / 0.5, 1) * (1 - expandT) * 0.18 : 0;
        if (quality.enableWireframe && wireA > 0.01) {
            ctx.save();
            for (let i = 0; i < particles.length; i += 3) {
                const pa = particles[i];
                const pb = particles[(i + 7) % particles.length];
                const a = project(pa.tx, pa.ty, pa.tz, sphereR);
                const b = project(pb.tx, pb.ty, pb.tz, sphereR);
                if (a.depth < 0 || b.depth < 0) continue;
                ctx.beginPath();
                ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
                ctx.strokeStyle = `rgba(99,179,255,${wireA.toFixed(3)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            ctx.restore();
        }

        /* ── Equatorial glow ring (spin phase) ── */
        if (quality.enableRing && spinT > 0.4 && expandT < 0.5) {
            const ringA = Math.min((spinT - 0.4) / 0.6, 1) * (1 - expandT / 0.5) * 0.4;
            const rg = ctx.createRadialGradient(cx, cy, sphereR * 0.8, cx, cy, sphereR * 1.15);
            rg.addColorStop(0, `rgba(59,130,246,${(ringA * 0.4).toFixed(3)})`);
            rg.addColorStop(0.5, `rgba(139,92,246,${(ringA * 0.2).toFixed(3)})`);
            rg.addColorStop(1, 'transparent');
            ctx.fillStyle = rg;
            ctx.beginPath(); ctx.arc(cx, cy, sphereR * 1.15, 0, Math.PI * 2); ctx.fill();
        }

        /* ── Shockwave rings during expand ── */
        if (expandT > 0) {
            const sw = easeOutExpo(expandT);
            [[sphereR * (0.8 + sw * 1.4), 0.7, 59, 130, 246], [sphereR * (0.5 + sw * 1.1), 0.45, 139, 92, 246]].forEach(([r, baseA, ...rgb]) => {
                const a = (1 - sw) * baseA;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${rgb.join(',')},${a.toFixed(3)})`;
                ctx.lineWidth = 2 + sw * 5;
                ctx.stroke();
            });
        }
    }

    /* ═══════════ TYPEWRITER ═══════════ */
    let phraseIdx = 0, charIdx = 0, isDeleting = false, typeTimer = null;
    function typeStep() {
        const cur = PHRASES[phraseIdx];
        if (!isDeleting) {
            if (phraseEl) phraseEl.textContent = cur.slice(0, ++charIdx);
            if (charIdx >= cur.length) { isDeleting = true; typeTimer = setTimeout(typeStep, 1600); return; }
        } else {
            if (phraseEl) phraseEl.textContent = cur.slice(0, --charIdx);
            if (charIdx === 0) { isDeleting = false; phraseIdx = (phraseIdx + 1) % PHRASES.length; typeTimer = setTimeout(typeStep, 260); return; }
        }
        typeTimer = setTimeout(typeStep, isDeleting ? 24 : 38);
    }

    /* ═══════════ PROGRESS BAR ═══════════ */
    const STATUSES = ['FETCHING', 'PARSING', 'RENDERING', 'COMPLETE'];
    let pct = 0, progressTimer = null;
    function tickProgress() {
        const ratio = Math.min((Date.now() - BOOT_TIME) / MIN_SHOW_MS, 1);
        const soft = ratio * 92;
        if (pct < soft) pct += (soft - pct) * 0.11 + 0.12;
        pct = Math.min(pct, 92);
        if (barEl) barEl.style.width = `${pct}%`;
        if (hudPct) hudPct.textContent = `${Math.round(pct)}%`;
        if (hudStatus) hudStatus.textContent = STATUSES[pct < 25 ? 0 : pct < 55 ? 1 : pct < 88 ? 2 : 3];
        progressTimer = setTimeout(tickProgress, 80);
    }

    /* ═══════════ PUBLIC API ═══════════ */
    window.CaseLoader = {
        qualityMode,
        qualityModes: Object.keys(QUALITY_PRESETS),
        getQuality() {
            return qualityMode;
        },
        setQuality(mode, opts = {}) {
            const next = String(mode || '').trim().toUpperCase();
            if (!QUALITY_PRESETS[next]) return false;
            try { localStorage.setItem('case_loader_quality', next); } catch (e) { }
            if (opts.reload !== false) window.location.reload();
            return true;
        },
        dismiss() {
            return new Promise(resolve => {
                const remaining = Math.max(0, MIN_SHOW_MS - (Date.now() - BOOT_TIME));
                setTimeout(() => {
                    if (progressTimer) clearTimeout(progressTimer);
                    if (typeTimer) clearTimeout(typeTimer);
                    pct = 100;
                    if (barEl) barEl.style.width = '100%';
                    if (hudPct) hudPct.textContent = '100%';
                    if (hudStatus) hudStatus.textContent = 'COMPLETE';
                    if (phraseEl) phraseEl.textContent = 'Profile ready ✓';

                    setTimeout(() => {
                        const c = document.getElementById('profileContainer');
                        if (c) c.style.display = '';
                        if (loader) loader.classList.add('case-loader--exit');
                        setTimeout(() => {
                            if (loader) loader.remove();
                            cancelAnimationFrame(rafId);
                            resolve();
                        }, 850);
                    }, 380);
                }, remaining);
            });
        },
    };

    /* ═══════════ RENDER LOOP ═══════════ */
    let rafId = null, startTime = null;
    let lastExpandT = 0; // shared between draw() and loop for logo layering
    const FRAME_MS = quality.frameCap > 0 ? 1000 / quality.frameCap : 0;
    let lastFrameTs = 0;

    function loop(ts) {
        if (!startTime) startTime = ts;
        if (FRAME_MS && ts - lastFrameTs < FRAME_MS) {
            rafId = requestAnimationFrame(loop);
            return;
        }
        lastFrameTs = ts;
        ctx.clearRect(0, 0, W, H);
        drawStars();                    // 1. Deep-space background
        draw(ts - startTime);           // 2. Sphere particles, wireframe, rings
        drawCaseLogo(lastExpandT);      // 3. CASE logo — always on top
        rafId = requestAnimationFrame(loop);
    }

    typeStep();
    tickProgress();
    rafId = requestAnimationFrame(loop);

})();
