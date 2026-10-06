// Dark / light mode.
// Load this in <head> WITHOUT `defer` so the saved theme is applied before the page paints
// (otherwise you get a brief flash of the light theme).
(function () {
    const KEY = 'theme';
    const root = document.documentElement;

    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked: fall back to system setting */ }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    root.classList.toggle('darkmode', isDark);

    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('switch');
        if (!toggle) return;

        toggle.checked = root.classList.contains('darkmode');
        toggle.addEventListener('change', () => {
            root.classList.toggle('darkmode', toggle.checked);
            try { localStorage.setItem(KEY, toggle.checked ? 'dark' : 'light'); } catch (e) { /* ignore */ }
        });
    });
})();