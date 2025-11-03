/* ===== tabs.js ===== */
(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length || !panels.length) return;

  const activate = (tab) => {
    tabs.forEach(t => {
      const selected = (t === tab);
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(p => {
      const on = p.id === tab.getAttribute('aria-controls');
      p.toggleAttribute('hidden', !on);
    });
    tab.focus({ preventScroll: true });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') { e.preventDefault(); activate(tabs[(i+1)%tabs.length]); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); activate(tabs[(i-1+tabs.length)%tabs.length]); }
      if (e.key === 'Home')       { e.preventDefault(); activate(tabs[0]); }
      if (e.key === 'End')        { e.preventDefault(); activate(tabs[tabs.length-1]); }
    });
  });
})();
