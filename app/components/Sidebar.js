'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

function Icon({ d, extra }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      {d}
      {extra}
    </svg>
  );
}

const LINKS = [
  {
    href: '/',
    label: 'Today',
    icon: (
      <Icon
        d={
          <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </>
        }
      />
    ),
  },
  {
    href: '/daily',
    label: 'Daily',
    icon: (
      <Icon
        d={
          <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </>
        }
      />
    ),
  },
  {
    href: '/timer',
    label: 'Timer',
    icon: (
      <Icon
        d={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        }
      />
    ),
  },
  {
    href: '/syllabus',
    label: 'Syllabus',
    icon: (
      <Icon
        d={
          <>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z" />
            <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" />
          </>
        }
      />
    ),
  },
  {
    href: '/mock',
    label: 'Mock',
    icon: (
      <Icon
        d={
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </>
        }
      />
    ),
  },
  {
    href: '/revision',
    label: 'Revision',
    icon: (
      <Icon
        d={
          <>
            <path d="M21 12a9 9 0 11-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </>
        }
      />
    ),
  },
];

function NavItems({ onNavigate, pill }) {
  const pathname = usePathname();
  const wrapRef = useRef(null);
  const [ind, setInd] = useState(null);

  // Active tab pe sliding indicator — tap ho ya swipe, indicator slide hokar jaayega.
  // Tab screen ke bahar ho to navbar khud scroll hokar use saamne laayegi.
  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const active = wrap.querySelector('[data-active="true"]');
      if (!active) return;
      setInd({
        left: active.offsetLeft,
        top: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
      });
      try {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) {}
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pathname]);

  return (
    <span ref={wrapRef} className="contents">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            data-active={active}
            className={
              pill
                ? `relative z-10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'text-rosey-dark dark:text-rosey-soft'
                      : 'text-neutral-500 hover:text-rosey-dark dark:text-neutral-400 dark:hover:text-rosey-soft'
                  }`
                : `relative z-10 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition-colors ${
                    active
                      ? 'font-semibold text-rosey-dark dark:text-rosey-soft'
                      : 'text-neutral-500 hover:text-rosey-dark dark:text-neutral-400 dark:hover:text-rosey-soft'
                  }`
            }
          >
            {l.icon}
            {l.label}
          </Link>
        );
      })}
      {ind && (
        <span
          aria-hidden
          className={`pointer-events-none absolute transition-all duration-300 ease-out ${
            pill
              ? 'rounded-full bg-blush-200 dark:bg-rosey/25'
              : 'rounded-2xl bg-blush-200/80 dark:bg-rosey/20'
          }`}
          style={{ left: ind.left, top: ind.top, width: ind.width, height: ind.height }}
        />
      )}
    </span>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-blush-200/70 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-[#12263c]/90 lg:flex">
      <div className="px-6 pb-2 pt-8">
        <Logo size={34} />
        <p className="eyebrow mt-2">Study Desk</p>
      </div>
      <nav className="relative flex flex-1 flex-col gap-1 px-4 py-4">
        <NavItems />
      </nav>
      <div className="border-t border-blush-200/70 p-4 dark:border-white/10">
        <ThemeToggle />
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          Made for your 100% — IBPS • SBI • RRB
        </p>
      </div>
    </aside>
  );
}

export function MobileBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-blush-200/70 bg-blush-50/90 backdrop-blur-md dark:border-white/10 dark:bg-[#0e1e30]/90 lg:hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <Logo size={28} />
          <p className="eyebrow mt-1.5">Study Desk</p>
        </div>
        <ThemeToggle compact />
      </div>
      <nav data-no-swipe className="relative flex gap-2 overflow-x-auto px-4 py-3">
        <NavItems pill />
      </nav>
    </div>
  );
}
