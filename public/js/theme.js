(function () {
    'use strict';

    const THEME_KEY = 'case-theme';

    function getTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === 'dark' ? 'dark' : 'light';
    }

    function updateThemeMeta() {
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) return;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (color) metaTheme.setAttribute('content', color);
    }

    function updateButton(button, theme) {
        const isDark = theme === 'dark';
        button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
        button.innerHTML = `<span class="theme-toggle__icon">${isDark ? '☀' : '🌙'}</span><span class="theme-toggle__text">${isDark ? 'Light' : 'Dark'}</span>`;
    }

    function applyTheme(theme, persist = true) {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', normalized);
        if (persist) localStorage.setItem(THEME_KEY, normalized);
        updateThemeMeta();

        document.querySelectorAll('[data-theme-toggle]').forEach((button) => updateButton(button, normalized));
    }

    function createFloatingToggle() {
        if (document.querySelector('[data-theme-toggle]')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle theme-toggle--floating';
        button.setAttribute('data-theme-toggle', 'floating');
        document.body.appendChild(button);
    }

    function initThemeToggle() {
        if (!document.querySelector('[data-theme-toggle]')) createFloatingToggle();
        const currentTheme = getTheme();
        applyTheme(currentTheme, false);

        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                applyTheme(next);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
})();
