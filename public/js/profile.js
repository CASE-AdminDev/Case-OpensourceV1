/* ═══════════════════════════════════════════════════
   CASE — Public Profile Logic (Redesigned)
   Supports owner/public views, certificate preview,
   social media cards, project View buttons
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const container = document.getElementById('profileContainer');

    // ── Extract username from URL ──
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u');

    if (!username) {
        showNotFound();
        return;
    }

    loadProfile(username);

    /* ═══════════════════ LOAD ═══════════════════ */
    async function loadProfile(uname) {
        try {
            const data = await DataService.getPublicProfile(uname);

            if (!data.found) {
                showNotFound();
                return;
            }

            // Update page title & meta
            document.title = `${data.user.fullName} — CASE`;

            // Clone template into container
            const template = document.getElementById('profileTemplate');
            const content = template.content.cloneNode(true);
            container.innerHTML = '';
            container.appendChild(content);

            // Render sections
            renderHero(data.user);
            renderSocialLinks(data.user);
            renderProjects(data.projects);
            renderCertificates(data.certificates);

            // Owner detection (non-blocking)
            detectOwner(data.user.uid);

            // Sequential reveal
            revealSections();

            // Card scroll animations
            initScrollReveal();

            // Certificate modal events
            initCertModal();

            // Increment views (fire-and-forget)
            DataService.incrementViews(data.user.uid).catch(() => {});

        } catch (err) {
            console.error('Failed to load profile:', err);
            showNotFound();
        }
    }

    /* ═══════════════ OWNER DETECTION ═══════════════ */
    async function detectOwner(profileUid) {
        try {
            const user = await AuthService.waitForAuth();
            if (user && user.uid === profileUid) {
                // Show edit button, hide "Create yours" CTA
                const editBtn = document.getElementById('editProfileBtn');
                const ctaBtn = document.getElementById('topbarCta');
                if (editBtn) editBtn.style.display = 'inline-flex';
                if (ctaBtn) ctaBtn.style.display = 'none';
            }
        } catch (_) {
            // Not logged in — public view, do nothing
        }
    }

    /* ═══════════════ HERO ═══════════════ */
    function renderHero(user) {
        // Photo or initials
        const photoEl = document.getElementById('profilePhoto');
        if (user.photoURL) {
            photoEl.innerHTML = `<img src="${user.photoURL}" alt="${Utils.escapeHTML(user.fullName)}" />`;
        } else {
            const initials = (user.fullName || 'U')
                .split(' ')
                .map(w => w[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
            photoEl.innerHTML = `<span class="profile-hero__photo-initials">${initials}</span>`;
        }

        document.getElementById('profileName').textContent = user.fullName || 'Student';
        document.getElementById('profileUsername').textContent = `@${user.username}`;
        document.getElementById('profileRole').textContent = user.role || '';

        const bioEl = document.getElementById('profileBio');
        if (user.bio) {
            bioEl.textContent = user.bio;
        } else {
            bioEl.style.display = 'none';
        }

        // CASE code badge
        const codeEl = document.getElementById('profileCaseCode');
        if (user.caseCode) {
            codeEl.textContent = `CASE ${user.caseCode}`;
        } else {
            codeEl.style.display = 'none';
        }
    }

    /* ═══════════════ SOCIAL LINKS ═══════════════ */
    function renderSocialLinks(user) {
        const section = document.getElementById('socialsSection');
        const grid = document.getElementById('socialLinksGrid');
        const links = user.socialLinks || {};
        const cards = [];

        if (links.github) {
            cards.push(socialCard(
                'github',
                'GitHub',
                extractHandle(links.github, 'github.com'),
                links.github,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`
            ));
        }

        if (links.linkedin) {
            cards.push(socialCard(
                'linkedin',
                'LinkedIn',
                extractHandle(links.linkedin, 'linkedin.com/in'),
                links.linkedin,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
            ));
        }

        if (links.portfolio) {
            cards.push(socialCard(
                'portfolio',
                'Portfolio',
                shortenUrl(links.portfolio),
                links.portfolio,
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
            ));
        }

        if (cards.length === 0) {
            section.style.display = 'none';
            return;
        }

        grid.innerHTML = cards.join('');
    }

    function socialCard(type, label, displayValue, href, iconSvg) {
        return `
            <a href="${Utils.escapeHTML(href)}" target="_blank" rel="noopener" class="social-link-card">
                <div class="social-link-card__icon social-link-card__icon--${type}">
                    ${iconSvg}
                </div>
                <div class="social-link-card__info">
                    <span class="social-link-card__label">${label}</span>
                    <span class="social-link-card__value">${Utils.escapeHTML(displayValue)}</span>
                </div>
            </a>
        `;
    }

    /** Pull handle from URL, e.g. "https://github.com/john" → "john" */
    function extractHandle(url, domain) {
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);
            return parts[parts.length - 1] || u.hostname;
        } catch (_) {
            return url;
        }
    }

    /** Shorten a URL for display: "https://johndoe.dev/portfolio" → "johndoe.dev" */
    function shortenUrl(url) {
        try {
            const u = new URL(url);
            return u.hostname.replace('www.', '');
        } catch (_) {
            return url;
        }
    }

    /* ═══════════════ PROJECTS ═══════════════ */
    function renderProjects(projects) {
        const section = document.getElementById('projectsSection');
        const grid = document.getElementById('projectsGrid');
        const countEl = document.getElementById('projectCount');

        if (!projects || projects.length === 0) {
            section.style.display = 'none';
            return;
        }

        countEl.textContent = `${projects.length} project${projects.length !== 1 ? 's' : ''}`;

        grid.innerHTML = projects.map(p => `
            <div class="pub-project-card">
                <div class="pub-project-card__header">
                    <div class="pub-project-card__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>
                </div>
                <div class="pub-project-card__name">${Utils.escapeHTML(p.name)}</div>
                <div class="pub-project-card__desc">${Utils.escapeHTML(p.description || '')}</div>
                <div class="pub-project-card__tags">
                    ${(p.techStack || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
                </div>
                <div class="pub-project-card__actions">
                    <a href="${Utils.escapeHTML(p.liveUrl || '#')}" target="_blank" rel="noopener"
                       class="profile-btn profile-btn--primary profile-btn--sm"
                       ${p.liveUrl ? '' : 'style="pointer-events:none;opacity:0.4"'}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        View
                    </a>
                </div>
            </div>
        `).join('');
    }

    /* ═══════════════ CERTIFICATES ═══════════════ */
    function renderCertificates(certs) {
        const section = document.getElementById('certsSection');
        const grid = document.getElementById('certsGrid');
        const countEl = document.getElementById('certCount');

        if (!certs || certs.length === 0) {
            section.style.display = 'none';
            return;
        }

        countEl.textContent = `${certs.length} certificate${certs.length !== 1 ? 's' : ''}`;

        grid.innerHTML = certs.map((c, i) => {
            const embedUrl = toGDriveEmbedUrl(c.driveUrl);
            const previewHtml = embedUrl
                ? `<iframe src="${Utils.escapeHTML(embedUrl)}" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe>`
                : `<div class="pub-cert-card__preview-placeholder">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                       <span>Certificate</span>
                   </div>`;

            return `
                <div class="pub-cert-card" data-idx="${i}" data-url="${Utils.escapeHTML(c.driveUrl || '')}" data-name="${Utils.escapeHTML(c.name)}" data-embed="${Utils.escapeHTML(embedUrl || '')}">
                    <div class="pub-cert-card__preview">${previewHtml}</div>
                    <div class="pub-cert-card__body">
                        <div class="pub-cert-card__info">
                            <span class="pub-cert-card__badge">🏅</span>
                            <span class="pub-cert-card__name">${Utils.escapeHTML(c.name)}</span>
                        </div>
                        <span class="pub-cert-card__view">Preview →</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Convert a Google Drive share link to an embeddable preview URL.
     * Handles: /file/d/FILE_ID/view  and  ?id=FILE_ID
     */
    function toGDriveEmbedUrl(url) {
        if (!url) return null;
        // Pattern: https://drive.google.com/file/d/FILE_ID/view...
        let match = url.match(/\/file\/d\/([^/]+)/);
        if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
        // Pattern: ?id=FILE_ID
        try {
            const u = new URL(url);
            const id = u.searchParams.get('id');
            if (id) return `https://drive.google.com/file/d/${id}/preview`;
        } catch (_) {}
        return null;
    }

    /* ═══════════════ CERTIFICATE MODAL ═══════════════ */
    function initCertModal() {
        const modal = document.getElementById('certModal');
        const overlay = document.getElementById('certModalOverlay');
        const closeBtn = document.getElementById('certModalClose');
        const iframe = document.getElementById('certModalIframe');
        const titleEl = document.getElementById('certModalTitle');
        const linkEl = document.getElementById('certModalLink');

        // Click on any certificate card → open modal
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.pub-cert-card');
            if (!card) return;

            const embedUrl = card.dataset.embed;
            const name = card.dataset.name;
            const driveUrl = card.dataset.url;

            titleEl.textContent = name || 'Certificate';
            linkEl.href = driveUrl || '#';

            if (embedUrl) {
                iframe.src = embedUrl;
            } else {
                iframe.src = '';
            }

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });

        // Close handlers
        function closeModal() {
            modal.style.display = 'none';
            iframe.src = '';
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    /* ═══════════════ SECTION REVEAL ═══════════════ */
    function revealSections() {
        const delays = [
            ['profileHero', 100],
            ['socialsSection', 300],
            ['projectsSection', 500],
            ['certsSection', 700],
        ];
        delays.forEach(([id, ms]) => {
            setTimeout(() => {
                document.getElementById(id)?.classList.add('visible');
            }, ms);
        });
    }

    /* ═══════════════ SCROLL REVEAL ═══════════════ */
    function initScrollReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, i * 80);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.pub-project-card, .pub-cert-card, .social-link-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            observer.observe(card);
        });
    }

    /* ═══════════════ NOT FOUND ═══════════════ */
    function showNotFound() {
        const template = document.getElementById('notFoundTemplate');
        const content = template.content.cloneNode(true);
        container.innerHTML = '';
        container.appendChild(content);
    }

})();
