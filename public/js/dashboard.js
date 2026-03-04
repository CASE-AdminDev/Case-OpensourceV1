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
            toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
            // Close on section switch (mobile)
            document.addEventListener('click', e => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
                    !sidebar.contains(e.target) && e.target !== toggle) {
                    sidebar.classList.remove('open');
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
        // Refresh data
        loadSectionData(section);
    }

    async function loadSectionData(section) {
        switch (section) {
            case 'overview': await loadOverview(); break;
            case 'edit-profile': await loadEditProfile(); break;
            case 'projects': await loadProjects(); break;
            case 'certificates': await loadCertificates(); break;
            case 'case-code': await loadCaseCode(); break;
        }
    }

    // ═══════════════════════════════════════
    //  OVERVIEW
    // ═══════════════════════════════════════

    async function loadOverview() {
        const user = await DataService.getUser();
        const projects = await DataService.getProjects();
        const certs = await DataService.getCertificates();
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
            if (file.size > 5 * 1024 * 1024) {
                Utils.toast('File too large. Max 5MB.', 'error');
                return;
            }
            // Convert to base64 for localStorage (in Firebase: upload to Cloudinary/Storage)
            const reader = new FileReader();
            reader.onload = async () => {
                await DataService.updateUser({ photoURL: reader.result });
                const user = await DataService.getUser();
                updateAvatarPreview(user);
                Utils.toast('Photo updated', 'success');
            };
            reader.readAsDataURL(file);
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
                <div class="project-card__name">${Utils.escapeHTML(p.name)}</div>
                <div class="project-card__desc">${Utils.escapeHTML(p.description)}</div>
                <div class="project-card__tags">
                    ${(p.techStack || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
                </div>
                <div class="project-card__actions">
                    <a href="${Utils.escapeHTML(p.liveUrl)}" target="_blank" rel="noopener">🔗 View Live</a>
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
    }

    function openAddProject() {
        editingProjectId = null;
        modalTags = [];
        $('#projectModalTitle').textContent = 'Add Project';
        $('#projName').value = '';
        $('#projDesc').value = '';
        $('#projUrl').value = '';
        $('#projDescCount').textContent = '0';
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
        $('#projDescCount').textContent = proj.description.length;
        renderTags();
        Utils.openModal($('#projectModal'));
    }

    function closeProjectModal() {
        Utils.closeModal($('#projectModal'));
        editingProjectId = null;
        modalTags = [];
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
        const liveUrl = $('#projUrl').value.trim();

        if (!name || !description || !liveUrl) {
            Utils.toast('Please fill all required fields', 'error');
            return;
        }

        const saveBtn = $('#projectModalSave');
        saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
        saveBtn.disabled = true;

        try {
            if (editingProjectId) {
                await DataService.updateProject(editingProjectId, { name, description, liveUrl, techStack: modalTags });
            } else {
                await DataService.addProject({ name, description, liveUrl, techStack: modalTags });
            }
            closeProjectModal();
            await loadProjects();
            Utils.toast(editingProjectId ? 'Project updated' : 'Project added', 'success');
        } catch (err) {
            Utils.toast('Something went wrong', 'error');
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
                <div class="cert-row__icon">🏅</div>
                <div class="cert-row__name">${Utils.escapeHTML(c.name)}</div>
                <div class="cert-row__actions">
                    <a href="${Utils.escapeHTML(c.driveUrl)}" target="_blank" rel="noopener" class="btn btn--secondary btn--small">View</a>
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
            const name = $('#certName').value.trim();
            const driveUrl = $('#certLink').value.trim();

            if (!name || !driveUrl) {
                Utils.toast('Please fill both fields', 'error');
                return;
            }

            try {
                await DataService.addCertificate({ name, driveUrl });
                $('#certName').value = '';
                $('#certLink').value = '';
                await loadCertificates();
                Utils.toast('Certificate added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            }
        });
    }

    // ═══════════════════════════════════════
    //  MY CASE CODE
    // ═══════════════════════════════════════

    async function loadCaseCode() {
        const user = await DataService.getUser();
        const projects = await DataService.getProjects();
        const certs = await DataService.getCertificates();
        const profileUrl = `case.app/@${user.username}`;
        const fullUrl = window.location.origin + `/public/profile.html?u=${user.username}`;

        $('#caseCodeDisplay').textContent = user.caseCode || '---';
        $('#caseCodeLink').textContent = profileUrl;

        Utils.initCopyButton($('#caseCodeCopy'), () => user.caseCode);
        Utils.initCopyButton($('#caseCodeCopyLink'), () => profileUrl);

        // QR
        Utils.generateQR($('#caseCodeQR'), fullUrl, 160);

        // Share buttons
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
        initDeleteModal();
        loadOverview();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
