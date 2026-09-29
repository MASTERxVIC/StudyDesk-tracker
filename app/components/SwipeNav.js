'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Sidebar tabs ka order — swipe isi sequence me aage/peeche le jaayega
const ORDER = ['/', '/daily', '/timer', '/syllabus', '/mock', '/revision'];
const THRESHOLD = 90;

// Native jaisa smooth page swipe:
// ungli ke saath page khisakta hai, chhodne pe slide hokar next tab aata hai,
// kam khischa to wapas spring ho jaata hai.
export default function SwipeNav() {
  const router = useRouter();
  const pathname = usePathname();
  const drag = useRef(null);
  const animating = useRef(false);
  const enterFrom = useRef(0); // naye page ki entry offset (px)

  // Naye page pe entry slide (exit ke baad)
  useEffect(() => {
    const page = document.getElementById('swipe-page');
    if (!page || !enterFrom.current) return;
    const from = enterFrom.current;
    enterFrom.current = 0;
    page.style.transition = 'none';
    page.style.transform = `translateX(${from}px)`;
    void page.offsetWidth; // reflow taaki animation dikhe
    page.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
    page.style.transform = 'translateX(0px)';
    const t = setTimeout(() => {
      page.style.transition = '';
      page.style.transform = '';
      animating.current = false;
    }, 300);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const root = document.getElementById('swipe-root');
    const page = document.getElementById('swipe-page');
    if (!root || !page) return;
    root.style.touchAction = 'pan-y'; // vertical scroll native, horizontal hum sambhalte hain
    // tab-pills jaisi horizontal scroll patti apni marzi se scroll hogi
    root.querySelectorAll('[data-no-swipe]').forEach((el) => {
      el.style.touchAction = 'auto';
    });

    const onStart = (e) => {
      if (animating.current) return;
      if (e.target && e.target.closest && e.target.closest('[data-no-swipe]')) return;
      const t = e.changedTouches[0];
      drag.current = { startX: t.clientX, startY: t.clientY, dx: 0, active: false, target: null };
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d || animating.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - d.startX;
      const dy = t.clientY - d.startY;
      if (!d.active) {
        if (Math.abs(dx) < 12) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; } // vertical scroll
        d.active = true;
        const i = ORDER.indexOf(pathname);
        d.target = dx < 0 ? ORDER[i + 1] : ORDER[i - 1];
        page.style.transition = 'none';
      }
      if (e.cancelable) e.preventDefault();
      const w = window.innerWidth;
      // aakhri/pehle tab pe rubber-band resistance
      const x = d.target ? Math.max(-w, Math.min(w, dx)) : dx * 0.25;
      d.dx = x;
      page.style.transform = `translateX(${x}px)`;
    };

    const onEnd = () => {
      const d = drag.current;
      drag.current = null;
      if (!d || !d.active || animating.current) return;
      const w = window.innerWidth;
      if (d.target && Math.abs(d.dx) > THRESHOLD) {
        // slide out → navigate → nayi page opposite side se slide in
        animating.current = true;
        const exitX = d.dx < 0 ? -w : w;
        enterFrom.current = -exitX;
        const go = d.target;
        page.style.transition = 'transform 0.22s ease-out';
        page.style.transform = `translateX(${exitX}px)`;
        setTimeout(() => router.push(go), 200);
      } else {
        // kam khischa → wapas spring
        animating.current = true;
        page.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)';
        page.style.transform = 'translateX(0px)';
        setTimeout(() => {
          page.style.transition = '';
          page.style.transform = '';
          animating.current = false;
        }, 260);
      }
    };

    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd, { passive: true });
    root.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
  }, [pathname, router]);

  return null;
}
