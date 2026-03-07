/* ═══════════════════════════════════════════════════
   CASE — Dashboard Logic
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── State ───
    let currentSection = 'overview';
    let editingProjectId = null;
    let deletingId = null;
    let deletingType = null; // 'project' | 'certificate'
    let modalTags = [];

    // ─── DOM Cache ───
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ─── Navigation ───
    function initNav() {
        $$('.sidebar__link[data-section]').forEach(link => {
            link.addEventListener('click', () => {
                switchSection(link.dataset.section);
            });
        });

        // Quick action buttons
        $$('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                switchSection(btn.dataset.action);
            });
        });

        // Mobile sidebar toggle
        const toggle = $('#sidebarToggle');
        const sidebar = $('#sidebar');
        if (toggle && sidebar) {
            // Create sidebar backdrop
            const sidebarBackdrop = document.createElement('div');
            sidebarBackdrop.className = 'sidebar-backdrop';
            document.body.appendChild(sidebarBackdrop);

            function openSidebar() {
                sidebar.classList.add('open');
                sidebarBackdrop.classList.add('visible');
            }
            function closeSidebar() {
                sidebar.classList.remove('open');
                sidebarBackdrop.classList.remove('visible');
            }

            toggle.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });

            sidebarBackdrop.addEventListener('click', closeSidebar);

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            });
        }

        // Logout
        $('#logoutBtn')?.addEventListener('click', async () => {
            await AuthService.logout();
            Utils.toast('Logged out', 'success');
            setTimeout(() => window.location.href = '/public/auth.html', 800);
        });
    }

    function switchSection(section) {
        currentSection = section;
        // Update nav
        $$('.sidebar__link[data-section]').forEach(l => l.classList.remove('active'));
        $(`.sidebar__link[data-section="${section}"]`)?.classList.add('active');
        // Show section
        $$('.main__section').forEach(s => s.classList.remove('active'));
        $(`#sec-${section}`)?.classList.add('active');
        // Close mobile sidebar
        $('#sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-backdrop')?.classList.remove('visible');
        // Refresh data
        loadSectionData(section);
    }

    async function loadSectionData(section) {
        switch (section) {
            case 'overview': await loadOverview(); break;
            case 'edit-profile': await loadEditProfile(); break;
            case 'projects': await loadProjects(); break;
            case 'certificates': await loadCertificates(); break;
            case 'qualifications': await loadQualifications(); break;
            case 'experiences': await loadExperiences(); break;
            case 'case-code': await loadCaseCode(); break;
        }
    }

    // ═══════════════════════════════════════
    //  OVERVIEW
    // ═══════════════════════════════════════

    async function loadOverview() {
        // Fetch base data first to populate cache, then completion hits cache (no duplicate reads)
        const [user, projects, certs] = await Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
        ]);
        const completion = await DataService.getProfileCompletion();

        // Welcome
        $('#welcomeGreeting').textContent = `Welcome back, ${user.fullName.split(' ')[0]} 👋`;
        $('#welcomePercent').textContent = `${completion.percent}%`;
        $('#welcomeBarFill').style.width = `${completion.percent}%`;

        // Completion chips
        const chipsEl = $('#welcomeChips');
        chipsEl.innerHTML = '';
        if (completion.percent >= 100) {
            chipsEl.innerHTML = '<span class="welcome__complete">✓ Profile Complete</span>';
        } else {
            const missing = completion.missing;
            if (missing.photo) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Photo</button>';
            if (missing.bio) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Bio</button>';
            if (missing.project) chipsEl.innerHTML += '<button class="welcome__chip" data-action="projects">+ Add Project</button>';
            if (missing.certificate) chipsEl.innerHTML += '<button class="welcome__chip" data-action="certificates">+ Add Certificate</button>';
            if (missing.social) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Social Link</button>';

            chipsEl.querySelectorAll('.welcome__chip').forEach(chip => {
                chip.addEventListener('click', () => switchSection(chip.dataset.action));
            });
        }

        // Remove skeleton state from stat cards
        ['#statCard1','#statCard2','#statCard3'].forEach(id => $(id)?.classList.remove('skeleton-card'));
        // Stats (count-up)
        Utils.animateCount($('#statViews'), user.stats?.profileViews || 0);
        Utils.animateCount($('#statProjects'), projects.length);
        Utils.animateCount($('#statCerts'), certs.length);

        // CASE Code Panel
        const profileUrl = `case.app/@${user.username}`;
        $('#overviewCode').textContent = user.caseCode || '---';
        $('#overviewLink').textContent = profileUrl;
        $('#overviewLink').href = `/public/profile.html?u=${user.username}`;
        $('#viewProfileBtn').href = `/public/profile.html?u=${user.username}`;

        // QR Code
        Utils.generateQR($('#overviewQR'), window.location.origin + `/public/profile.html?u=${user.username}`, 100);

        // Copy handlers
        Utils.initCopyButton($('#overviewCopyCode'), () => user.caseCode);
        Utils.initCopyButton($('#overviewCopyLink'), () => profileUrl);
    }

    // Share dropdown
    function initShareDropdown() {
        const dropdown = $('#shareDropdown');
        const toggle = $('#shareToggle');

        toggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', () => dropdown?.classList.remove('open'));

        $('#shareLink')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            await Utils.copyToClipboard(`case.app/@${user.username}`);
            Utils.toast('Link copied!', 'success');
            dropdown.classList.remove('open');
        });

        $('#shareWhatsApp')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            Utils.shareWhatsApp(`case.app/@${user.username}`);
            dropdown.classList.remove('open');
        });

        $('#shareEmail')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            await Utils.copyToClipboard(`Check out my portfolio: case.app/@${user.username}\n\nBuilt with CASE — case.app`);
            Utils.toast('Email text copied!', 'success');
            dropdown.classList.remove('open');
        });
    }

    // ═══════════════════════════════════════
    //  EDIT PROFILE
    // ═══════════════════════════════════════

    async function loadEditProfile() {
        const user = await DataService.getUser();

        $('#inputName').value = user.fullName || '';
        $('#inputUsername').value = user.username || '';
        $('#inputBio').value = user.bio || '';
        $('#inputRole').value = user.role || '';
        $('#inputGithub').value = user.socialLinks?.github || '';
        $('#inputLinkedin').value = user.socialLinks?.linkedin || '';
        $('#inputPortfolio').value = user.socialLinks?.portfolio || '';
        $('#inputTwitter').value = user.socialLinks?.twitter || '';
        $('#inputInstagram').value = user.socialLinks?.instagram || '';
        $('#inputYoutube').value = user.socialLinks?.youtube || '';
        $('#inputLeetcode').value = user.socialLinks?.leetcode || '';
        $('#inputHackerrank').value = user.socialLinks?.hackerrank || '';
        $('#inputWhatsapp').value = user.socialLinks?.whatsapp || '';
        $('#inputTelegram').value = user.socialLinks?.telegram || '';

        // Bio counter
        $('#bioCount').textContent = (user.bio || '').length;

        // Avatar
        updateAvatarPreview(user);

        // Username preview
        $('#usernamePreview').textContent = user.username || 'username';
    }

    function updateAvatarPreview(user) {
        const preview = $('#avatarPreview');
        if (user.photoURL) {
            preview.innerHTML = `<img src="${user.photoURL}" alt="Profile" />`;
        } else {
            const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            preview.innerHTML = `<span class="avatar-upload__initials">${initials}</span>`;
        }
    }

    function initEditProfile() {
        // Avatar upload
        $('#avatarBtn')?.addEventListener('click', () => $('#avatarInput').click());
        $('#avatarInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const btn = $('#avatarBtn');
            btn.textContent = 'Uploading...';
            btn.disabled = true;
            try {
                const user = await DataService.getUser();
                const url = await uploadProfilePhoto(file, user.uid);
                await DataService.updateUser({ photoURL: url });
                const updated = await DataService.getUser();
                updateAvatarPreview(updated);
                Utils.toast('Photo updated', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Upload failed', 'error');
            } finally {
                btn.textContent = 'Change Photo';
                btn.disabled = false;
            }
        });

        // Bio counter
        $('#inputBio')?.addEventListener('input', (e) => {
            $('#bioCount').textContent = e.target.value.length;
        });

        // Username live check
        const usernameInput = $('#inputUsername');
        const usernameCheck = $('#usernameCheck');
        if (usernameInput) {
            usernameInput.addEventListener('input', Utils.debounce(async () => {
                const val = usernameInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                usernameInput.value = val;
                $('#usernamePreview').textContent = val || 'username';

                if (val.length < 3) {
                    usernameCheck.textContent = 'Min 3 characters';
                    usernameCheck.className = 'username-check username-check--taken';
                    return;
                }

                const result = await DataService.checkUsername(val);
                if (result.available) {
                    usernameCheck.textContent = '✓ Available';
                    usernameCheck.className = 'username-check username-check--available';
                } else {
                    usernameCheck.textContent = '✗ Taken';
                    usernameCheck.className = 'username-check username-check--taken';
                }
            }, 500));
        }

        // Form submit
        $('#profileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = $('#saveProfileBtn');
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
            saveBtn.disabled = true;

            try {
                await DataService.updateUser({
                    fullName: $('#inputName').value.trim(),
                    username: $('#inputUsername').value.trim(),
                    bio: $('#inputBio').value.trim(),
                    role: $('#inputRole').value.trim(),
                    socialLinks: {
                        github: $('#inputGithub').value.trim(),
                        linkedin: $('#inputLinkedin').value.trim(),
                        portfolio: $('#inputPortfolio').value.trim(),
                        twitter: $('#inputTwitter').value.trim(),
                        instagram: $('#inputInstagram').value.trim(),
                        youtube: $('#inputYoutube').value.trim(),
                        leetcode: $('#inputLeetcode').value.trim(),
                        hackerrank: $('#inputHackerrank').value.trim(),
                        whatsapp: $('#inputWhatsapp').value.trim(),
                        telegram: $('#inputTelegram').value.trim(),
                    },
                });

                Utils.toast('Profile updated', 'success');
            } catch (err) {
                Utils.toast('Something went wrong. Try again.', 'error');
            } finally {
                saveBtn.innerHTML = 'Save Changes';
                saveBtn.disabled = false;
            }
        });
    }

    // ═══════════════════════════════════════
    //  PROJECTS
    // ═══════════════════════════════════════

    async function loadProjects() {
        const projects = await DataService.getProjects();
        const grid = $('#projectsGrid');

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <div class="empty-state__text">No projects yet. Add your first one.</div>
                    <button class="btn btn--primary btn--small" id="emptyAddProject">+ Add Project</button>
                </div>
            `;
            grid.querySelector('#emptyAddProject')?.addEventListener('click', openAddProject);
            return;
        }

        grid.innerHTML = projects.map(p => `
            <div class="project-card" data-id="${p.id}">
                ${p.previewUrl ? `<div class="project-card__preview"><img src="${Utils.escapeHTML(p.previewUrl)}" alt="${Utils.escapeHTML(p.name)}" loading="lazy" /></div>` : ''}
                <div class="project-card__name">${Utils.escapeHTML(p.name)}</div>
                <div class="project-card__desc">${Utils.escapeHTML(p.description)}</div>
                <div class="project-card__tags">
                    ${(p.techStack || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
                </div>
                <div class="project-card__actions">
                    ${p.liveUrl ? `<a href="${Utils.escapeHTML(p.liveUrl)}" target="_blank" rel="noopener">🔗 View Live</a>` : '<span style="color:var(--text-muted);font-size:13px">No link added</span>'}
                    <span style="flex:1"></span>
                    <button class="btn--icon" data-edit="${p.id}" title="Edit">✏️</button>
                    <button class="btn--icon" data-delete-project="${p.id}" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');

        // Stagger animation
        Utils.staggerReveal('.project-card', 80);

        // Edit / Delete listeners
        grid.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => openEditProject(btn.dataset.edit));
        });
        grid.querySelectorAll('[data-delete-project]').forEach(btn => {
            btn.addEventListener('click', () => confirmDelete('project', btn.dataset.deleteProject));
        });
    }

    // ── Project Modal ──
    function initProjectModal() {
        $('#addProjectBtn')?.addEventListener('click', openAddProject);
        $('#projectModalClose')?.addEventListener('click', closeProjectModal);
        $('#projectModalCancel')?.addEventListener('click', closeProjectModal);
        $('#projectModal')?.addEventListener('click', (e) => {
            if (e.target === $('#projectModal')) closeProjectModal();
        });

        // Tag input
        const tagField = $('#tagField');
        tagField?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = tagField.value.trim();
                if (val && !modalTags.includes(val)) {
                    modalTags.push(val);
                    renderTags();
                }
                tagField.value = '';
            }
        });

        // Desc counter
        $('#projDesc')?.addEventListener('input', (e) => {
            $('#projDescCount').textContent = e.target.value.length;
        });

        // Save
        $('#projectModalSave')?.addEventListener('click', saveProject);

        // Link dropdown toggle
        $('#projHasLink')?.addEventListener('change', (e) => {
            const val = e.target.value;
            $('#projLinkFields').style.display = val === 'yes' ? 'block' : 'none';
            $('#projNoLinkMsg').style.display = val === 'no' ? 'block' : 'none';
            if (val === 'no') {
                $('#projUrl').value = '';
                $('#projTutorialVideo').src = 'https://www.youtube.com/embed/oIsf9zE-TRI?si=j-3TiAmlTNU9frxP';
            } else {
                $('#projTutorialVideo').src = '';
            }
        });

        initProjectImgUpload();
    }

    function openAddProject() {
        editingProjectId = null;
        modalTags = [];
        $('#projectModalTitle').textContent = 'Add Project';
        $('#projName').value = '';
        $('#projDesc').value = '';
        $('#projUrl').value = '';
        $('#projHasLink').value = '';
        $('#projLinkFields').style.display = 'none';
        $('#projNoLinkMsg').style.display = 'none';
        $('#projTutorialVideo').src = '';
        $('#projDescCount').textContent = '0';
        _clearProjectImgPreview();
        renderTags();
        Utils.openModal($('#projectModal'));
    }

    async function openEditProject(id) {
        const projects = await DataService.getProjects();
        const proj = projects.find(p => p.id === id);
        if (!proj) return;

        editingProjectId = id;
        modalTags = [...(proj.techStack || [])];
        $('#projectModalTitle').textContent = 'Edit Project';
        $('#projName').value = proj.name;
        $('#projDesc').value = proj.description;
        $('#projUrl').value = proj.liveUrl;
        if (proj.liveUrl) {
            $('#projHasLink').value = 'yes';
            $('#projLinkFields').style.display = 'block';
            $('#projNoLinkMsg').style.display = 'none';
        } else {
            $('#projHasLink').value = 'no';
            $('#projLinkFields').style.display = 'none';
            $('#projNoLinkMsg').style.display = 'block';
            $('#projTutorialVideo').src = 'https://www.youtube.com/embed/oIsf9zE-TRI?si=j-3TiAmlTNU9frxP';
        }
        $('#projDescCount').textContent = proj.description.length;
        _clearProjectImgPreview();
        if (proj.previewUrl) _setProjectImgPreview(proj.previewUrl);
        renderTags();
        Utils.openModal($('#projectModal'));
    }

    function closeProjectModal() {
        Utils.closeModal($('#projectModal'));
        editingProjectId = null;
        modalTags = [];
        $('#projTutorialVideo').src = '';
        _clearProjectImgPreview();
    }

    function _clearProjectImgPreview() {
        $('#projImgInput').value = '';
        $('#projImgPreviewImg').src = '';
        $('#projImgPreview').style.display = 'none';
        $('#projImgZone').style.display = '';
    }

    function _setProjectImgPreview(url) {
        $('#projImgPreviewImg').src = url;
        $('#projImgPreview').style.display = 'block';
        $('#projImgZone').style.display = 'none';
    }

    function initProjectImgUpload() {
        $('#projImgInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const objectUrl = URL.createObjectURL(file);
            _setProjectImgPreview(objectUrl);
        });
        $('#projImgRemove')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _clearProjectImgPreview();
        });
    }

    function renderTags() {
        const container = $('#tagInput');
        const field = $('#tagField');
        container.querySelectorAll('.tag').forEach(t => t.remove());

        modalTags.forEach((tag, i) => {
            const el = document.createElement('span');
            el.className = 'tag';
            el.innerHTML = `${Utils.escapeHTML(tag)} <span class="tag__remove" data-tag-idx="${i}">×</span>`;
            container.insertBefore(el, field);
        });

        container.querySelectorAll('.tag__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                modalTags.splice(parseInt(btn.dataset.tagIdx), 1);
                renderTags();
            });
        });
    }

    async function saveProject() {
        const name = $('#projName').value.trim();
        const description = $('#projDesc').value.trim();
        const hasLink = $('#projHasLink').value;
        const liveUrl = $('#projUrl').value.trim();

        if (!name || !description) {
            Utils.toast('Please fill project name and description', 'error');
            return;
        }

        if (!hasLink) {
            Utils.toast('Please select whether you have a project link', 'error');
            return;
        }

        const saveBtn = $('#projectModalSave');
        saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
        saveBtn.disabled = true;

        try {
            const user = await DataService.getUser();
            const projectId = editingProjectId || `proj_${Date.now()}`;

            // Upload preview image if a new file was selected
            let previewUrl = '';
            if (editingProjectId) {
                const existing = (await DataService.getProjects()).find(p => p.id === editingProjectId);
                previewUrl = existing?.previewUrl || '';
            }
            const imgFile = $('#projImgInput')?.files[0];
            if (imgFile) {
                previewUrl = await uploadProjectPreview(imgFile, user.uid, projectId);
            }

            if (editingProjectId) {
                await DataService.updateProject(editingProjectId, { name, description, liveUrl, techStack: modalTags, previewUrl });
            } else {
                await DataService.addProject({ name, description, liveUrl, techStack: modalTags, previewUrl });
            }
            const wasEditing = !!editingProjectId;
            closeProjectModal();
            await loadProjects();
            Utils.toast(wasEditing ? 'Project updated' : 'Project added', 'success');
        } catch (err) {
            Utils.toast(err.message || 'Something went wrong', 'error');
        } finally {
            saveBtn.innerHTML = 'Save Project';
            saveBtn.disabled = false;
        }
    }

    // ═══════════════════════════════════════
    //  CERTIFICATES
    // ═══════════════════════════════════════

    async function loadCertificates() {
        const certs = await DataService.getCertificates();
        const list = $('#certList');
        const limitNotice = $('#certsLimit');
        const addForm = $('#certsAddForm');

        // Limit notice
        if (certs.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = 'flex';
        }

        if (certs.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">🏅</div>
                    <div class="empty-state__text">No certificates added yet.</div>
                </div>
            `;
            // Focus name field
            setTimeout(() => $('#certName')?.focus(), 200);
            return;
        }

        list.innerHTML = certs.map(c => `
            <div class="cert-row" data-cert-id="${c.id}">
                <div class="cert-row__thumb">
                    <img src="${Utils.escapeHTML(c.imageUrl)}" alt="${Utils.escapeHTML(c.name)}" loading="lazy" />
                </div>
                <div class="cert-row__name">${Utils.escapeHTML(c.name)}</div>
                <div class="cert-row__actions">
                    <a href="${Utils.escapeHTML(c.imageUrl)}" target="_blank" rel="noopener" class="btn btn--secondary btn--small">View</a>
                    <button class="btn btn--danger btn--small" data-delete-cert="${c.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Delete handlers
        list.querySelectorAll('[data-delete-cert]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('.cert-row');
                const id = btn.dataset.deleteCert;

                // Inline confirm
                if (row.classList.contains('cert-row--confirm')) {
                    // Confirmed → delete
                    row.classList.add('cert-row--deleting');
                    setTimeout(async () => {
                        await DataService.deleteCertificate(id);
                        await loadCertificates();
                        Utils.toast('Certificate removed', 'success');
                    }, 300);
                } else {
                    // Show confirmation
                    row.classList.add('cert-row--confirm');
                    const actions = row.querySelector('.cert-row__actions');
                    actions.innerHTML = `
                        <span style="color:var(--danger);font-size:13px;margin-right:8px">Are you sure?</span>
                        <button class="btn btn--secondary btn--small cert-cancel">No</button>
                        <button class="btn btn--danger btn--small cert-confirm" data-delete-cert="${id}">Yes</button>
                    `;
                    actions.querySelector('.cert-cancel').addEventListener('click', () => loadCertificates());
                    actions.querySelector('.cert-confirm').addEventListener('click', async () => {
                        row.classList.add('cert-row--deleting');
                        setTimeout(async () => {
                            await DataService.deleteCertificate(id);
                            await loadCertificates();
                            Utils.toast('Certificate removed', 'success');
                        }, 300);
                    });
                }
            });
        });
    }

    function initCertificates() {
        $('#addCertBtn')?.addEventListener('click', async () => {
            const name  = $('#certName').value.trim();
            const file  = $('#certImage')?.files[0];

            if (!name) { Utils.toast('Please enter a certificate name', 'error'); return; }
            if (!file) { Utils.toast('Please select a certificate image', 'error'); return; }

            const btn = $('#addCertBtn');
            btn.textContent = 'Uploading...';
            btn.disabled = true;

            try {
                const user    = await DataService.getUser();
                const certId  = `cert_${Date.now()}`;
                const imageUrl = await uploadCertificateImage(file, user.uid, certId);
                await DataService.addCertificate({ name, imageUrl });
                $('#certName').value = '';
                $('#certImage').value = '';
                await loadCertificates();
                Utils.toast('Certificate added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            } finally {
                btn.textContent = 'Add';
                btn.disabled = false;
            }
        });
    }

    // ═══════════════════════════════════════
    //  QUALIFICATIONS
    // ═══════════════════════════════════════

    async function loadQualifications() {
        const quals = await DataService.getQualifications();
        const list = $('#qualList');
        const limitNotice = $('#qualsLimit');
        const addForm = $('#qualsAddForm');

        if (quals.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = '';
        }

        if (quals.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">📚</div>
                    <div class="empty-state__text">No qualifications added yet.</div>
                </div>
            `;
            setTimeout(() => $('#qualDegree')?.focus(), 200);
            return;
        }

        list.innerHTML = quals.map(q => `
            <div class="qual-row" data-qual-id="${q.id}">
                <div class="qual-row__icon">🎓</div>
                <div class="qual-row__info">
                    <div class="qual-row__degree">${Utils.escapeHTML(q.degree)}</div>
                    <div class="qual-row__institution">${Utils.escapeHTML(q.institution)}</div>
                    <div class="qual-row__meta">
                        ${q.year ? `<span>${Utils.escapeHTML(q.year)}</span>` : ''}
                        ${q.grade ? `<span>· ${Utils.escapeHTML(q.grade)}</span>` : ''}
                    </div>
                </div>
                <div class="qual-row__actions">
                    <button class="btn btn--danger btn--small" data-delete-qual="${q.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Delete handlers
        list.querySelectorAll('[data-delete-qual]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('.qual-row');
                const id = btn.dataset.deleteQual;

                if (row.classList.contains('qual-row--confirm')) {
                    row.classList.add('qual-row--deleting');
                    setTimeout(async () => {
                        await DataService.deleteQualification(id);
                        await loadQualifications();
                        Utils.toast('Qualification removed', 'success');
                    }, 300);
                } else {
                    row.classList.add('qual-row--confirm');
                    const actions = row.querySelector('.qual-row__actions');
                    actions.innerHTML = `
                        <span style="color:var(--danger);font-size:13px;margin-right:8px">Are you sure?</span>
                        <button class="btn btn--secondary btn--small qual-cancel">No</button>
                        <button class="btn btn--danger btn--small qual-confirm" data-delete-qual="${id}">Yes</button>
                    `;
                    actions.querySelector('.qual-cancel').addEventListener('click', () => loadQualifications());
                    actions.querySelector('.qual-confirm').addEventListener('click', async () => {
                        row.classList.add('qual-row--deleting');
                        setTimeout(async () => {
                            await DataService.deleteQualification(id);
                            await loadQualifications();
                            Utils.toast('Qualification removed', 'success');
                        }, 300);
                    });
                }
            });
        });
    }

    function initQualifications() {
        $('#addQualBtn')?.addEventListener('click', async () => {
            const degree = $('#qualDegree').value.trim();
            const institution = $('#qualInstitution').value.trim();
            const year = $('#qualYear').value.trim();
            const grade = $('#qualGrade').value.trim();

            if (!degree || !institution) {
                Utils.toast('Please fill degree and institution', 'error');
                return;
            }

            try {
                await DataService.addQualification({ degree, institution, year, grade });
                $('#qualDegree').value = '';
                $('#qualInstitution').value = '';
                $('#qualYear').value = '';
                $('#qualGrade').value = '';
                await loadQualifications();
                Utils.toast('Qualification added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            }
        });
    }

    // ═══════════════════════════════════════
    //  EXPERIENCES
    // ═══════════════════════════════════════

    async function loadExperiences() {
        const exps = await DataService.getExperiences();
        const list = $('#expList');
        const limitNotice = $('#expsLimit');
        const addForm = $('#expsAddForm');

        if (exps.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = '';
        }

        if (exps.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">💼</div>
                    <div class="empty-state__text">No experiences added yet.</div>
                </div>
            `;
            setTimeout(() => $('#expTitle')?.focus(), 200);
            return;
        }

        list.innerHTML = exps.map(e => `
            <div class="exp-row" data-exp-id="${e.id}">
                <div class="exp-row__icon">💼</div>
                <div class="exp-row__info">
                    <div class="exp-row__title">${Utils.escapeHTML(e.title)}</div>
                    <div class="exp-row__company">${Utils.escapeHTML(e.company)}</div>
                    <div class="exp-row__meta">
                        ${e.duration ? `<span>${Utils.escapeHTML(e.duration)}</span>` : ''}
                    </div>
                    ${e.description ? `<div class="exp-row__desc">${Utils.escapeHTML(e.description)}</div>` : ''}
                </div>
                <div class="exp-row__actions">
                    <button class="btn btn--danger btn--small" data-delete-exp="${e.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Delete handlers
        list.querySelectorAll('[data-delete-exp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('.exp-row');
                const id = btn.dataset.deleteExp;

                if (row.classList.contains('exp-row--confirm')) {
                    row.classList.add('exp-row--deleting');
                    setTimeout(async () => {
                        await DataService.deleteExperience(id);
                        await loadExperiences();
                        Utils.toast('Experience removed', 'success');
                    }, 300);
                } else {
                    row.classList.add('exp-row--confirm');
                    const actions = row.querySelector('.exp-row__actions');
                    actions.innerHTML = `
                        <span style="color:var(--danger);font-size:13px;margin-right:8px">Are you sure?</span>
                        <button class="btn btn--secondary btn--small exp-cancel">No</button>
                        <button class="btn btn--danger btn--small exp-confirm" data-delete-exp="${id}">Yes</button>
                    `;
                    actions.querySelector('.exp-cancel').addEventListener('click', () => loadExperiences());
                    actions.querySelector('.exp-confirm').addEventListener('click', async () => {
                        row.classList.add('exp-row--deleting');
                        setTimeout(async () => {
                            await DataService.deleteExperience(id);
                            await loadExperiences();
                            Utils.toast('Experience removed', 'success');
                        }, 300);
                    });
                }
            });
        });
    }

    function initExperiences() {
        $('#addExpBtn')?.addEventListener('click', async () => {
            const title = $('#expTitle').value.trim();
            const company = $('#expCompany').value.trim();
            const duration = $('#expDuration').value.trim();
            const description = $('#expDesc').value.trim();

            if (!title || !company) {
                Utils.toast('Please fill title and company', 'error');
                return;
            }

            try {
                await DataService.addExperience({ title, company, duration, description });
                $('#expTitle').value = '';
                $('#expCompany').value = '';
                $('#expDuration').value = '';
                $('#expDesc').value = '';
                await loadExperiences();
                Utils.toast('Experience added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            }
        });
    }

    // ═══════════════════════════════════════
    //  MY CASE CODE
    // ═══════════════════════════════════════

    let caseCodeListenersAttached = false;

    async function loadCaseCode() {
        const [user, projects, certs] = await Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
        ]);
        const profileUrl = `case.app/@${user.username}`;
        const fullUrl = window.location.origin + `/public/profile.html?u=${user.username}`;

        $('#caseCodeDisplay').textContent = user.caseCode || '---';
        $('#caseCodeLink').textContent = profileUrl;

        Utils.initCopyButton($('#caseCodeCopy'), () => user.caseCode);
        Utils.initCopyButton($('#caseCodeCopyLink'), () => profileUrl);

        // QR
        Utils.generateQR($('#caseCodeQR'), fullUrl, 160);

        // Share buttons — attach only once
        if (!caseCodeListenersAttached) {
            caseCodeListenersAttached = true;

            $('#caseShareWA')?.addEventListener('click', () => {
                Utils.shareWhatsApp(profileUrl, `Check out my portfolio: ${profileUrl}`);
            });
            $('#caseShareEmail')?.addEventListener('click', () => {
                Utils.shareEmail(profileUrl, user.fullName);
            });
            $('#caseDownloadQR')?.addEventListener('click', () => {
                const qrCanvas = $('#caseCodeQR canvas');
                if (qrCanvas) {
                    const link = document.createElement('a');
                    link.download = `CASE-QR-${user.username}.png`;
                    link.href = qrCanvas.toDataURL();
                    link.click();
                }
            });
        }

        // Preview card
        updatePreviewCard(user, projects, certs);
    }

    function updatePreviewCard(user, projects, certs) {
        const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        if (user.photoURL) {
            $('#previewAvatar').innerHTML = `<img src="${user.photoURL}" alt="Profile" />`;
        } else {
            $('#previewInitials').textContent = initials;
        }

        $('#previewName').textContent = user.fullName || 'Your Name';
        $('#previewBio').textContent = user.bio || user.role || 'Your bio';
        $('#previewProjects').textContent = projects.length;
        $('#previewCerts').textContent = certs.length;
    }

    // ═══════════════════════════════════════
    //  DELETE CONFIRM MODAL
    // ═══════════════════════════════════════

    function initDeleteModal() {
        $('#deleteModalClose')?.addEventListener('click', closeDeleteModal);
        $('#deleteModalCancel')?.addEventListener('click', closeDeleteModal);
        $('#deleteModal')?.addEventListener('click', (e) => {
            if (e.target === $('#deleteModal')) closeDeleteModal();
        });

        $('#deleteModalConfirm')?.addEventListener('click', async () => {
            if (!deletingId) return;
            try {
                if (deletingType === 'project') {
                    await DataService.deleteProject(deletingId);
                    await loadProjects();
                    Utils.toast('Project deleted', 'success');
                }
            } catch (err) {
                Utils.toast('Something went wrong', 'error');
            }
            closeDeleteModal();
        });
    }

    function confirmDelete(type, id) {
        deletingType = type;
        deletingId = id;
        $('#deleteModalMsg').textContent = `Are you sure you want to delete this ${type}? This can't be undone.`;
        Utils.openModal($('#deleteModal'));
    }

    function closeDeleteModal() {
        Utils.closeModal($('#deleteModal'));
        deletingId = null;
        deletingType = null;
    }

    // ═══════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════

    async function init() {
        // Auth guard — redirects to auth page if not logged in
        const user = await AuthService.requireAuth();
        if (!user) return; // redirect is in progress

        initNav();
        initShareDropdown();
        initEditProfile();
        initProjectModal();
        initCertificates();
        initQualifications();
        initExperiences();
        initDeleteModal();

        // Pre-warm all data in parallel so section switches are instant
        Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
            DataService.getQualifications(),
            DataService.getExperiences(),
        ]).then(() => loadOverview());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
