/* ═══════════════════════════════════════════════════
   CASE — Public Profile Logic (Redesigned)
   Supports owner/public views, certificate preview,
   social media cards, project View buttons
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const container = document.getElementById('profileContainer');

    // ── Extract username from URL ──
    // Supports both ?u=username and /@username (Vercel rewrite)
    const params = new URLSearchParams(window.location.search);
    let username = params.get('u');
    if (!username) {
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        if (pathMatch) username = pathMatch[1];
    }

    if (!username) {
        if (window.CaseLoader) window.CaseLoader.dismiss().then(showNotFound);
        else showNotFound();
        return;
    }

    loadProfile(username);

    /* ═══════════════════ LOAD ═══════════════════ */
    async function loadProfile(uname) {
        try {
            const data = await DataService.getPublicProfile(uname);

            if (!data.found) {
                // Dismiss loader then show not-found
                if (window.CaseLoader) {
                    await window.CaseLoader.dismiss();
                }
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
            renderQualifications(data.qualifications || []);
            renderExperiences(data.experiences || []);
            renderJourneyMap(data.qualifications || [], data.experiences || []);

            // Owner detection (non-blocking)
            detectOwner(data.user.uid);

            // ── Dismiss the cinematic loader, THEN reveal sections ──
            if (window.CaseLoader) {
                await window.CaseLoader.dismiss();
            }

            // Sequential reveal
            revealSections();

            // Card scroll animations
            initScrollReveal();

            // Certificate modal events
            initCertModal();

            // Views are already incremented inside getPublicProfile

        } catch (err) {
            console.error('Failed to load profile:', err);
            if (window.CaseLoader) {
                await window.CaseLoader.dismiss();
            }
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
            codeEl.textContent = user.caseCode;
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

        if (links.twitter) {
            cards.push(socialCard(
                'twitter',
                'Twitter / X',
                '@' + extractHandle(links.twitter, 'x.com'),
                links.twitter,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
            ));
        }

        if (links.instagram) {
            cards.push(socialCard(
                'instagram',
                'Instagram',
                '@' + extractHandle(links.instagram, 'instagram.com'),
                links.instagram,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`
            ));
        }

        if (links.youtube) {
            cards.push(socialCard(
                'youtube',
                'YouTube',
                extractYouTubeHandle(links.youtube),
                links.youtube,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
            ));
        }

        if (links.leetcode) {
            cards.push(socialCard(
                'leetcode',
                'LeetCode',
                extractHandle(links.leetcode, 'leetcode.com'),
                links.leetcode,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>`
            ));
        }

        if (links.hackerrank) {
            cards.push(socialCard(
                'hackerrank',
                'HackerRank',
                extractHandle(links.hackerrank, 'hackerrank.com'),
                links.hackerrank,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 11.885 0 13-.642 1.114-9.107 6-10.392 6-1.284 0-9.75-4.886-10.392-6C.965 17.885.965 7.115 1.608 6 2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V7.057a.258.258 0 0 0-.258-.258h-1.9a.258.258 0 0 0-.258.258v9.886c0 .141.116.257.258.257h1.9a.258.258 0 0 0 .258-.257v-4.016h4.074v4.016c0 .141.115.257.258.257h1.9a.258.258 0 0 0 .257-.257V7.057a.258.258 0 0 0-.257-.258Z"/></svg>`
            ));
        }

        if (links.whatsapp) {
            const waDisplay = links.whatsapp.includes('wa.me/')
                ? '+' + links.whatsapp.split('wa.me/')[1].replace(/\D/g, '')
                : links.whatsapp.replace(/\D/g, '');
            cards.push(socialCard(
                'whatsapp',
                'WhatsApp',
                waDisplay || 'Message',
                links.whatsapp.startsWith('http') ? links.whatsapp : `https://wa.me/${links.whatsapp.replace(/\D/g, '')}`,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`
            ));
        }

        if (links.telegram) {
            cards.push(socialCard(
                'telegram',
                'Telegram',
                '@' + extractHandle(links.telegram, 't.me'),
                links.telegram,
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`
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

    /** Extract YouTube channel handle: handles /@handle, /c/name, /channel/ID */
    function extractYouTubeHandle(url) {
        try {
            const u = new URL(url);
            const path = u.pathname;
            // /@handle
            if (path.startsWith('/@')) return path.substring(1);
            // /c/name or /user/name
            const parts = path.split('/').filter(Boolean);
            if (parts[0] === 'c' || parts[0] === 'user') return parts[1] || 'YouTube';
            if (parts.length > 0) return parts[0];
            return 'YouTube';
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
                ${p.previewUrl ? `
                <div class="pub-project-card__preview">
                    <img src="${Utils.escapeHTML(p.previewUrl)}" alt="${Utils.escapeHTML(p.name)}" loading="lazy" />
                </div>` : ''}
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

        grid.innerHTML = certs.map((c, i) => `
            <div class="pub-cert-card" data-idx="${i}" data-url="${Utils.escapeHTML(c.imageUrl || '')}" data-name="${Utils.escapeHTML(c.name)}">
                <div class="pub-cert-card__preview">
                    <img src="${Utils.escapeHTML(c.imageUrl)}" alt="${Utils.escapeHTML(c.name)}" loading="lazy" />
                </div>
                <div class="pub-cert-card__body">
                    <div class="pub-cert-card__info">
                        <span class="pub-cert-card__badge">🏅</span>
                        <span class="pub-cert-card__name">${Utils.escapeHTML(c.name)}</span>
                    </div>
                    <span class="pub-cert-card__view">Preview →</span>
                </div>
            </div>
        `).join('');
    }

    /* ═══════════════ QUALIFICATIONS ═══════════════ */
    function renderQualifications(quals) {
        const section = document.getElementById('qualsSection');
        const grid = document.getElementById('qualsGrid');
        const countEl = document.getElementById('qualCount');

        if (!quals || quals.length === 0) {
            section.style.display = 'none';
            return;
        }

        countEl.textContent = `${quals.length} qualification${quals.length !== 1 ? 's' : ''}`;

        grid.innerHTML = quals.map(q => `
            <div class="pub-qual-card">
                <div class="pub-qual-card__icon">🎓</div>
                <div class="pub-qual-card__content">
                    <div class="pub-qual-card__degree">${Utils.escapeHTML(q.degree)}</div>
                    <div class="pub-qual-card__institution">${Utils.escapeHTML(q.institution)}</div>
                    <div class="pub-qual-card__meta">
                        ${q.year ? `<span class="pub-qual-card__year">${Utils.escapeHTML(q.year)}</span>` : ''}
                        ${q.grade ? `<span class="pub-qual-card__grade">${Utils.escapeHTML(q.grade)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /* ═══════════════ EXPERIENCES ═══════════════ */
    function renderExperiences(exps) {
        const section = document.getElementById('expsSection');
        const grid = document.getElementById('expsGrid');
        const countEl = document.getElementById('expCount');

        if (!exps || exps.length === 0) {
            section.style.display = 'none';
            return;
        }

        countEl.textContent = `${exps.length} experience${exps.length !== 1 ? 's' : ''}`;

        grid.innerHTML = exps.map(e => `
            <div class="pub-exp-card">
                <div class="pub-exp-card__icon">💼</div>
                <div class="pub-exp-card__content">
                    <div class="pub-exp-card__title">${Utils.escapeHTML(e.title)}</div>
                    <div class="pub-exp-card__company">${Utils.escapeHTML(e.company)}</div>
                    ${e.duration ? `<div class="pub-exp-card__duration">${Utils.escapeHTML(e.duration)}</div>` : ''}
                    ${e.description ? `<div class="pub-exp-card__desc">${Utils.escapeHTML(e.description)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    /* ═══════════════ CERTIFICATE MODAL ═══════════════ */
    function initCertModal() {
        const modal = document.getElementById('certModal');
        const overlay = document.getElementById('certModalOverlay');
        const closeBtn = document.getElementById('certModalClose');
        const imgEl = document.getElementById('certModalImg');
        const titleEl = document.getElementById('certModalTitle');
        const linkEl = document.getElementById('certModalLink');

        // Click on any certificate card → open modal
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.pub-cert-card');
            if (!card) return;

            const imageUrl = card.dataset.url;
            const name = card.dataset.name;

            titleEl.textContent = name || 'Certificate';
            linkEl.href = imageUrl || '#';
            imgEl.src = imageUrl || '';
            imgEl.alt = name || 'Certificate';

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Re-trigger slide-in animation
            const content = modal.querySelector('.cert-modal__content');
            if (content) {
                content.style.animation = 'none';
                content.offsetHeight; // force reflow
                content.style.animation = '';
            }
        });

        // Close handlers
        function closeModal() {
            modal.style.display = 'none';
            imgEl.src = '';
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
            ['journeySection', 500],
            ['projectsSection', 700],
            ['certsSection', 900],
            ['qualsSection', 1100],
            ['expsSection', 1300],
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

        document.querySelectorAll('.pub-project-card, .pub-cert-card, .social-link-card, .pub-qual-card, .pub-exp-card, .journey-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            observer.observe(card);
        });
    }

    /* ═══════════════ CAREER JOURNEY MAP ═══════════════ */
    function renderJourneyMap(quals, exps) {
        const section = document.getElementById('journeySection');
        const map = document.getElementById('journeyMap');
        const countEl = document.getElementById('journeyCount');

        if ((!quals || quals.length === 0) && (!exps || exps.length === 0)) {
            section.style.display = 'none';
            return;
        }

        // Build unified timeline entries
        const items = [];

        (quals || []).forEach(q => {
            const yearStr = extractYear(q.year || '');
            items.push({
                type: 'edu',
                sortYear: yearStr,
                title: q.degree || 'Degree',
                subtitle: q.institution || '',
                meta: [q.year, q.grade].filter(Boolean).join(' · '),
                icon: '🎓',
            });
        });

        (exps || []).forEach(e => {
            const yearStr = extractYear(e.duration || '');
            items.push({
                type: 'work',
                sortYear: yearStr,
                title: e.title || 'Role',
                subtitle: e.company || '',
                meta: e.duration || '',
                desc: e.description || '',
                icon: '💼',
            });
        });

        // Sort chronologically (oldest first)
        items.sort((a, b) => (a.sortYear || 9999) - (b.sortYear || 9999));

        const total = items.length;
        countEl.textContent = `${total} milestone${total !== 1 ? 's' : ''}`;

        map.innerHTML = items.map((item, idx) => `
            <div class="journey-node journey-node--${item.type}">
                <div class="journey-node__dot"></div>
                <div class="journey-card">
                    <div class="journey-card__header">
                        <span class="journey-card__icon">${item.icon}</span>
                        <span class="journey-card__type-badge journey-card__type-badge--${item.type}">
                            ${item.type === 'edu' ? 'Education' : 'Experience'}
                        </span>
                    </div>
                    <div class="journey-card__title">${Utils.escapeHTML(item.title)}</div>
                    <div class="journey-card__subtitle">${Utils.escapeHTML(item.subtitle)}</div>
                    ${item.meta ? `<div class="journey-card__meta">${Utils.escapeHTML(item.meta)}</div>` : ''}
                    ${item.desc ? `<div class="journey-card__desc">${Utils.escapeHTML(item.desc)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    /** Extract the earliest 4-digit year from a string like "Jan 2021 - Dec 2023" or "2022" */
    function extractYear(str) {
        const matches = (str || '').match(/\b(19|20)\d{2}\b/g);
        if (!matches) return null;
        return Math.min(...matches.map(Number));
    }

    /* ═══════════════ NOT FOUND ═══════════════ */
    function showNotFound() {
        // Make sure profile container is visible before adding content
        container.style.display = '';
        const template = document.getElementById('notFoundTemplate');
        const content = template.content.cloneNode(true);
        container.innerHTML = '';
        container.appendChild(content);
    }

})();
