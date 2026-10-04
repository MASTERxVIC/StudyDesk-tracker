'use client';

import { useEffect, useState } from 'react';
import { IconSun, IconMoon } from './icons';

export default function ThemeToggle({ compact = false }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bank-tracker-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('bank-tracker-theme', next ? 'dark' : 'light');
    try { if (window.StudyDesk && window.StudyDesk.syncStatusBar) window.StudyDesk.syncStatusBar(); } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`btn-ghost flex items-center gap-2 ${compact ? '!px-3' : '!px-4'}`}
    >
      <span aria-hidden>{dark ? <IconSun size={17} /> : <IconMoon size={17} />}</span>
      {!compact && <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
