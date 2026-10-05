'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IconQuant,
  IconReasoning,
  IconEnglish,
  IconGA,
  IconBreak,
  IconLunch,
  IconRevision,
  IconSessionDone,
  IconClock,
  IconPencil,
} from '../components/icons';
import { getDayPlan } from '../lib/studyPlan';
import { bust } from '../lib/fetchCache';

/* ---------------- Session Timer (Soft Pink theme, Apple-style dial) ----------------
   APK (StudyDesk v1.6.2+) me window.StudyDesk bridge hota hai:
     getSessionState() -> {"anchor":millis|-1,"now":millis,"paused":bool,"pauseStart":millis|-1,"slots":[...]}
     startSession()      -> anchor millis (aaj ke alarms abhi se recalculate)
     pauseSession()      -> timer rok do, alarms cancel
     resumeSession()     -> paused duration se anchor shift, alarms dobara schedule
     endSession()        -> anchor hatao (alarms default timetable pe wapas)
   Bridge na mile (desktop browser) to localStorage fallback — sirf timer, alarms nahi.
-------------------------------------------------------------------------------------- */

// Timetable.java ka mirror (durations, minutes) — sirf fallback ke liye
const SLOT_DEFS = [
  { dur: 120, title: 'Quant', Icon: IconQuant },
  { dur: 20, title: 'Break', Icon: IconBreak },
  { dur: 120, title: 'Reasoning', Icon: IconReasoning },
  { dur: 60, title: 'Lunch + rest', Icon: IconLunch },
  { dur: 90, title: 'English', Icon: IconEnglish },
  { dur: 20, title: 'Break', Icon: IconBreak },
  { dur: 60, title: 'GA / Current Affairs', Icon: IconGA },
  { dur: 30, title: 'Revision', Icon: IconRevision },
  { dur: 0, title: 'Session complete', Icon: IconSessionDone },
];

const LS_KEY = 'sd_timer_state';

function defaultAnchorToday() {
  const d = new Date();
  d.setHours(11, 0, 0, 0);
  return d.getTime();
}

function buildSlots(anchor) {
  let t = anchor;
  return SLOT_DEFS.map((s) => {
    const start = t;
    t += s.dur * 60_000;
    return { title: s.title, Icon: s.Icon, start, end: t };
  });
}

function fmtClock(ms) {
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Native bridge slots me Icon component nahi hota — title keyword se map karo
function iconForTitle(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('quant')) return IconQuant;
  if (t.includes('reasoning')) return IconReasoning;
  if (t.includes('english')) return IconEnglish;
  if (t.includes('lunch')) return IconLunch;
  if (t.includes('break')) return IconBreak;
  if (t.includes('revision')) return IconRevision;
  if (t.includes('session complete')) return IconSessionDone;
  if (t.includes('current affairs') || t.includes('ga')) return IconGA;
  return IconClock;
}

const withIcons = (arr) =>
  (Array.isArray(arr) ? arr : []).map((s) => ({
    ...s,
    // Purane APK se emoji wala title aaye to saaf kar do
    title: (s.title || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim(),
    Icon: s.Icon || iconForTitle(s.title),
  }));

const getBridge = () =>
  typeof window !== 'undefined' && window.StudyDesk ? window.StudyDesk : null;

// Local date — raat 12 baje (IST) date flip hota hai
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

// Pause/Resume shift: har resume pe current slot se aage ke slots utna aage khisakte hain
// jitni der pause raha. shifts = [{from: slotIndex, by: ms}]. Pichhle slots nahi badalte.
function applyShifts(base, shifts) {
  if (!shifts || !shifts.length) return base;
  return base.map((s, i) => {
    let d = 0;
    for (const sh of shifts) if (sh.from <= i) d += sh.by;
    if (!d) return s;
    return { ...s, start: s.start + d, end: s.end + d };
  });
}

function readFallback() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (s && s.anchor > 0)
      return {
        anchor: s.anchor,
        pauseStart: s.pauseStart > 0 ? s.pauseStart : -1,
        pausedTotal: s.pausedTotal > 0 ? s.pausedTotal : 0,
        shifts: Array.isArray(s.shifts) ? s.shifts : [],
      };
  } catch { /* ignore */ }
  return { anchor: -1, pauseStart: -1, pausedTotal: 0, shifts: [] };
}

function writeFallback(anchor, pauseStart, pausedTotal, shifts) {
  if (anchor > 0)
    localStorage.setItem(LS_KEY, JSON.stringify({ anchor, pauseStart, pausedTotal: pausedTotal || 0, shifts: shifts || [] }));
  else localStorage.removeItem(LS_KEY);
}

// Aaj ke custom slot topics (popup/edit se) — localStorage, date-wise
const topicsKey = () => `slot-topics-${todayISO()}`;
function readCustomTopics() {
  try {
    return JSON.parse(localStorage.getItem(topicsKey()) || '{}');
  } catch {
    return {};
  }
}

export default function TimerPage() {
  const [isNative, setIsNative] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [pauseStart, setPauseStart] = useState(-1);
  const [pausedTotal, setPausedTotal] = useState(0);
  const [baseSlots, setBaseSlots] = useState([]);
  const [shifts, setShifts] = useState([]); // [{from: slotIndex, by: ms}] — resume pe aage shift
  // Effective slots: base + shifts. Neeche saara code (timetable, popup, study-hours) effective slots pe chalta hai.
  const slots = useMemo(() => applyShifts(baseSlots, shifts), [baseSlots, shifts]);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [customTopics, setCustomTopics] = useState({});
  const [topicDlg, setTopicDlg] = useState(null); // { slot, value }
  const [breakDlg, setBreakDlg] = useState(false);
  const prevSlotRef = useRef(null);

  // ---- Actual study-time accumulator ----
  // Har second: session active + not paused + current slot STUDY ho to
  // (now - lastTick) add karo. Pause/break/skip me kuch add nahi hota,
  // isliye Daily Log me "jitna padha utna" bharta hai, wall-clock nahi.
  const ACCUM_KEY = 'studydesk-study-accum';
  const accumRef = useRef(0);
  const lastTickRef = useRef(0);
  const anchorSeenRef = useRef(null);
  const liveRef = useRef({ active: false, paused: false, curTitle: null });
  const loadAccum = () => {
    try {
      const rawA = localStorage.getItem(ACCUM_KEY);
      if (!rawA) return { ms: 0, anchor: null };
      const o = JSON.parse(rawA);
      if (o.date !== todayISO()) return { ms: 0, anchor: null };
      return { ms: o.ms || 0, anchor: o.anchor ?? null };
    } catch { return { ms: 0, anchor: null }; }
  };
  const saveAccum = () => {
    try { localStorage.setItem(ACCUM_KEY, JSON.stringify({ date: todayISO(), ms: accumRef.current, anchor: anchorSeenRef.current })); } catch {}
  };
  const syncAccum = (newAnchor) => {
    accumulate(); // gap ka hisaab (capped)
    // Reset SIRF naye session pe (anchor null -> set). Skip me anchor badalta hai
    // lekin padhai ka hisaab bana rehna chahiye — isliye skip pe reset nahi.
    if (anchorSeenRef.current == null && newAnchor != null) {
      accumRef.current = 0;
    }
    anchorSeenRef.current = newAnchor;
    saveAccum();
    lastTickRef.current = Date.now();
  };
  const accumulate = () => {
    const nowMs = Date.now();
    const dt = nowMs - lastTickRef.current;
    lastTickRef.current = nowMs;
    if (dt <= 0 || dt > 120000) return; // bada gap safe side pe ignore
    const st = liveRef.current;
    if (st.active && !st.paused && st.curTitle && isStudySlot(st.curTitle)) {
      accumRef.current += dt;
      saveAccum();
    }
  };

  const refresh = useCallback(() => {
    const b = getBridge();
    if (b) {
      try {
        const st = JSON.parse(b.getSessionState());
        setIsNative(true);
        setAnchor(st.anchor > 0 ? st.anchor : null);
        setPauseStart(st.pauseStart > 0 ? st.pauseStart : -1);
        setPausedTotal(st.pausedTotal > 0 ? st.pausedTotal : 0);
        setBaseSlots(withIcons(st.slots));
        setShifts([]); // native slots pehle se shifted aate hain
        setNow(st.now || Date.now());
        syncAccum(st.anchor > 0 ? st.anchor : null);
        return;
      } catch {
        /* bridge toot gaya to fallback */
      }
    }
    setIsNative(false);
    const fb = readFallback();
    const an = fb.anchor > 0 ? fb.anchor : null;
    setAnchor(an);
    setPauseStart(fb.pauseStart);
    setPausedTotal(fb.pausedTotal);
    setBaseSlots(buildSlots(an || defaultAnchorToday()));
    setShifts(fb.shifts || []);
    setNow(Date.now());
    syncAccum(an);
  }, []);

  useEffect(() => {
    const saved = loadAccum();
    accumRef.current = saved.ms;
    anchorSeenRef.current = saved.anchor;
    lastTickRef.current = Date.now();
    refresh();
    // prefetch-today: Today tab ka data bg me warm rakho taaki turant khule
    try {
      fetch('/api/daily-logs').catch(() => {});
      fetch('/api/syllabus').catch(() => {});
    } catch {}
    const t = setInterval(() => { setNow(Date.now()); accumulate(); }, 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const onStart = () => {
    setBusy(true);
    try {
      const b = getBridge();
      if (b) b.startSession();
      else writeFallback(Date.now(), -1, 0);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const onPause = () => {
    setBusy(true);
    try {
      const b = getBridge();
      if (b && b.pauseSession) b.pauseSession();
      else if (anchor) writeFallback(anchor, Date.now(), pausedTotal);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  // Resume: current slot wahi se continue (pause ke time jo remaining tha),
  // uske baad wale SAARE slots pause-duration se aage shift — actual current time se recalculate.
  // Pause ka time study hours me count nahi hota.
  const onResume = () => {
    setBusy(true);
    try {
      const b = getBridge();
      if (b && b.resumeSession) b.resumeSession();
      else if (anchor && pauseStart > 0) {
        const nowMs = Date.now();
        const by = nowMs - pauseStart;
        const eff = applyShifts(baseSlots, shifts);
        let cur = -1;
        for (let i = 0; i < eff.length; i++) {
          if (pauseStart >= eff[i].start && pauseStart < eff[i].end) { cur = i; break; }
        }
        const ns = cur >= 0 ? [...shifts, { from: cur, by }] : shifts;
        const nt = pausedTotal + by;
        setShifts(ns);
        setPausedTotal(nt);
        setPauseStart(-1);
        writeFallback(anchor, -1, nt, ns);
      }
    } finally {
      setBusy(false);
      refresh();
    }
  };

  // Fresh session state (End se pehle study-time calculate karne ke liye)
  const readSessionFresh = () => {
    const b = getBridge();
    if (b) {
      try {
        const st = JSON.parse(b.getSessionState());
        return {
          anchor: st.anchor > 0 ? st.anchor : null,
          pauseStart: st.pauseStart > 0 ? st.pauseStart : -1,
          pausedTotal: st.pausedTotal > 0 ? st.pausedTotal : 0,
        };
      } catch { /* fallback */ }
    }
    const fb = readFallback();
    return {
      anchor: fb.anchor > 0 ? fb.anchor : null,
      pauseStart: fb.pauseStart,
      pausedTotal: fb.pausedTotal,
    };
  };


  // Session khatm: Daily Log me ACTUAL study time pre-fill hoga
  // (accumulator: jitna padha utna — pause/break/skip excluded). Entry user khud save karega.
  const finishSession = (withConfirm) => {
    if (withConfirm && !confirm('End today\u2019s session?')) return;
    setBusy(true);
    try {
      accumulate(); // aakhri hissa pakad lo
      // Actual study time (accumulator) — pause/break/skip excluded
      const hours = Math.round(accumRef.current / 360000) / 10; // exact, 1 decimal
      try {
        // 3 min se kam padhai ho to bhi 0 prefill karo (blank nahi)
        sessionStorage.setItem('studydesk-suggest-hours', String(hours));
      } catch { /* ignore */ }
      const b = getBridge();
      if (b) b.endSession();
      else writeFallback(-1, -1, 0);
    } finally {
      setBusy(false);
    }
    window.location.href = '/daily';
  };

  // Busy today: session shuru nahi hua aur aaj padhai nahi hogi —
  // Daily Log me 0 hours + busy note ki entry; aaj ke alarms bhi band (v24+).
  const onBusyToday = async () => {
    if (!confirm("Mark today as busy? This will save today's log with 0 hours and a busy note.")) return;
    setBusy(true);
    try {
      const r = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayISO(), hours: 0, notes: 'Busy - no study today.' }),
      });
      if (!r.ok) throw new Error('save failed');
      const b = getBridge();
      if (b && b.endSession) b.endSession(); // ended-today flag -> aaj ke alarms band
      window.location.href = '/daily';
    } catch {
      alert('Could not save the busy entry. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onEnd = () => finishSession(true);

  const onSkip = () => {
    setBusy(true);
    try {
      const nowMs = Date.now();
      let cur = -1;
      for (let i = 0; i < slots.length; i++) {
        if (nowMs >= slots[i].start && nowMs < slots[i].end) { cur = i; break; }
      }
      // Last slot pe skip (ya saare slots ka time nikal gaya) = session end, bina confirm
      const pastAll = slots.length > 0 && nowMs >= slots[slots.length - 1].end;
      if (anchor && (pastAll || (cur >= 0 && cur + 1 >= slots.length))) {
        finishSession(false);
        return;
      }
      const b = getBridge();
      if (b) {
        // skipToNext true = native ne session end kiya (last slot defensive) ->
        // web finish flow chalao: actual-study prefill + /daily kholo
        let nativeEnded = false;
        try { nativeEnded = !!(b.skipToNext && b.skipToNext()); } catch { nativeEnded = false; }
        if (nativeEnded) { finishSession(false); return; }
      } else if (anchor) {
        // Desktop fallback: wahi anchor-shift math (cur upar compute ho chuka)
        if (cur >= 0 && cur + 1 < slots.length) {
          let newAnchor = nowMs;
          for (let i = 0; i <= cur; i++) newAnchor -= slots[i].end - slots[i].start;
          writeFallback(newAnchor, -1, 0, []);
          setShifts([]);
        }
      }
    } finally {
      setBusy(false);
      refresh();
    }
  };

  // ---- Slot topics: custom (popup/edit) pehle, phir timetable default ----
  const slotKey = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('quant')) return 'Quant';
    if (t.includes('reasoning')) return 'Reasoning';
    if (t.includes('english')) return 'English';
    if (t.includes('ga') || t.includes('current affairs')) return 'GA / Current Affairs';
    if (t.includes('revision')) return 'Revision';
    return title;
  };
  const isStudySlot = (title) => {
    const t = (title || '').toLowerCase();
    return (
      t.includes('quant') ||
      t.includes('reasoning') ||
      t.includes('english') ||
      t.includes('revision') ||
      t.includes('ga') ||
      t.includes('current affairs')
    );
  };
  const isBreakSlot = (title) => {
    const t = (title || '').toLowerCase();
    return t.includes('break') || t.includes('lunch');
  };

  // Aaj ke slot-wise topics (Syllabus timetable se)
  const dayPlan = getDayPlan(new Date());
  const defaultTopicFor = (title) => {
    if (!dayPlan || dayPlan.phaseDone || !dayPlan.slots) return null;
    return (dayPlan.slots.find((x) => x.slot === slotKey(title)) || {}).topic || null;
  };
  const topicFor = (title) => customTopics[slotKey(title)] || defaultTopicFor(title) || null;

  const openTopicDlg = (title) => {
    const key = slotKey(title);
    setTopicDlg({ slot: key, value: customTopics[key] || defaultTopicFor(title) || '' });
  };
  const saveTopicDlg = () => {
    if (!topicDlg) return;
    const v = topicDlg.value.trim();
    const all = readCustomTopics();
    if (v) all[topicDlg.slot] = v;
    else delete all[topicDlg.slot];
    try {
      localStorage.setItem(topicsKey(), JSON.stringify(all));
    } catch { /* ignore */ }
    setCustomTopics(all);
    setTopicDlg(null);
  };

  useEffect(() => {
    setCustomTopics(readCustomTopics());
  }, []);

  const active = anchor !== null;
  const paused = active && pauseStart > 0;
  // Pause me time freeze — display pauseStart se aage nahi badhta
  const effNow = paused ? pauseStart : now;
  const current = active ? slots.find((s) => effNow >= s.start && effNow < s.end) : null;
  const next = active ? slots.find((s) => s.start > effNow) : null;
  const curTitle = current ? current.title : null;
  const curIdx = current ? slots.findIndex((s) => s === current) : -1;
  liveRef.current = { active, paused, curTitle };

  // Topic popup: ek subject me din me sirf ek baar (save ho ya dismiss, dobara nahi)
  const topicAskedKey = () => `topic-asked-${todayISO()}`;
  const wasTopicAsked = (sk) => {
    try { return !!(JSON.parse(localStorage.getItem(topicAskedKey()) || '{}')[sk]); }
    catch { return false; }
  };
  const markTopicAsked = (sk) => {
    try {
      const all = JSON.parse(localStorage.getItem(topicAskedKey()) || '{}');
      all[sk] = true;
      localStorage.setItem(topicAskedKey(), JSON.stringify(all));
    } catch {}
  };
  // Break/Lunch popup: ek break me din me sirf ek baar (choice ho ya dismiss, dobara nahi)
  const breakAskedKey = () => `break-asked-${todayISO()}`;
  const wasBreakAsked = (bk) => {
    try { return !!(JSON.parse(localStorage.getItem(breakAskedKey()) || '{}')[bk]); }
    catch { return false; }
  };
  const markBreakAsked = (bk) => {
    try {
      const all = JSON.parse(localStorage.getItem(breakAskedKey()) || '{}');
      all[bk] = true;
      localStorage.setItem(breakAskedKey(), JSON.stringify(all));
    } catch {}
  };
  // Slot badalte hi popup: study slot → topic puchho, break/lunch → avail ya skip.
  // Pehle slot (session start) pe bhi puchho — "kya padh rhe ho" sabse zaroori wahin hai.
  useEffect(() => {
    const prev = prevSlotRef.current;
    prevSlotRef.current = curTitle;
    if (!curTitle || curTitle === prev || paused) return;
    if (isStudySlot(curTitle)) {
      const sk = slotKey(curTitle);
      if (!wasTopicAsked(sk)) { markTopicAsked(sk); openTopicDlg(curTitle); }
    }
    else if (isBreakSlot(curTitle)) {
      const bk = 'break-idx-' + curIdx; // index stable rehta hai, start-time shift ho jata hai
      if (!wasBreakAsked(bk)) { markBreakAsked(bk); setBreakDlg(true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curTitle]);

  const elapsed = active ? Math.max(0, effNow - anchor) : 0;
  const es = Math.floor(elapsed / 1000);
  const hh = pad2(Math.floor(es / 3600));
  const mm = pad2(Math.floor((es % 3600) / 60));
  const ss = pad2(es % 60);

  // Ring: current slot ki progress
  let progress = 0;
  if (active && current) {
    const dur = current.end - current.start;
    progress = dur > 0 ? Math.min(1, (effNow - current.start) / dur) : 1;
  } else if (active && !current && slots.length > 0 && effNow >= slots[slots.length - 1].end) {
    progress = 1;
  }

  const R = 140;
  const CIRC = 2 * Math.PI * R;

  // Native bridge slots me Icon component nahi hota — fallback IconClock
  const CurrentIcon = (current && current.Icon) || IconClock;
  const NextIcon = (next && next.Icon) || IconClock;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Timer</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="page-title flex items-center gap-2">
            Session Timer <IconClock size={22} />
          </h1>
          {active ? (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                paused
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full bg-current"
                style={paused ? {} : { animation: 'pulse 1.6s ease-in-out infinite' }}
              />
              {paused ? 'Paused' : 'Live'}
            </span>
          ) : (
            <button
              type="button"
              onClick={onBusyToday}
              className="btn-ghost shrink-0 !px-3.5 !py-1.5 !text-xs"
            >
              Busy today
            </button>
          )}
        </div>
        <p className="page-sub">
          {active
            ? `Session started at ${fmtClock(anchor)}`
            : 'One tap when you sit down — alarms follow from that moment.'}
        </p>
      </div>

      <div className="card flex flex-col items-center !p-6 sm:!p-8">
        <div className="relative h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]">
          <svg viewBox="0 0 320 320" className="h-full w-full -rotate-90">
            <circle
              cx="160" cy="160" r={R} fill="none"
              stroke="currentColor" strokeWidth="10"
              className="text-blush-200 dark:text-white/10"
            />
            <circle
              cx="160" cy="160" r={R} fill="none"
              stroke="currentColor" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
              className="text-rosey-dark dark:text-rosey-soft"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div
              className="font-extralight tabular-nums text-ink dark:text-[#e8f2fa]"
              style={{
                fontSize: 56,
                letterSpacing: -2,
                fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hh}:{mm}:{ss}
            </div>
            <div className="mt-1 flex gap-6 text-[11px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              <span>hr</span>
              <span>min</span>
              <span>sec</span>
            </div>
            {active && current && (
              <p className="mt-3 flex max-w-full items-center gap-2 text-[15px] font-semibold text-neutral-800 dark:text-neutral-100">
                <CurrentIcon size={18} />
                <span className="truncate">{current.title}</span>
              </p>
            )}
            {active && current && (
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                ends {fmtClock(current.end)}
              </p>
            )}
            {active && !current && next && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                <NextIcon size={15} />
                <span>Next: {next.title} · {fmtClock(next.start)}</span>
              </p>
            )}
            {!active && (
              <p className="mt-3 text-[13px] text-neutral-500 dark:text-neutral-400">
                No active session
              </p>
            )}
          </div>
        </div>

        {/* Circular buttons — theme-tinted */}
        <div className="mt-6 flex items-center justify-center gap-5 sm:gap-8">
          {active ? (
            <>
              <button
                onClick={onEnd}
                disabled={busy}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-[15px] font-semibold text-red-700 active:scale-95 dark:bg-red-500/15 dark:text-red-300"
              >
                End
              </button>
              <button
                onClick={onSkip}
                disabled={busy}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-[15px] font-semibold text-sky-700 active:scale-95 dark:bg-sky-500/15 dark:text-sky-300"
              >
                Skip
              </button>
              {paused ? (
                <button
                  onClick={onResume}
                  disabled={busy}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-[15px] font-semibold text-green-700 active:scale-95 dark:bg-green-500/15 dark:text-green-300"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPause}
                  disabled={busy}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-[15px] font-semibold text-orange-700 active:scale-95 dark:bg-orange-500/15 dark:text-orange-300"
                >
                  Pause
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onStart}
              disabled={busy}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-[15px] font-semibold text-green-700 active:scale-95 dark:bg-green-500/15 dark:text-green-300"
            >
              Start
            </button>
          )}
        </div>

        {isNative && (
          <p className="mx-auto mt-5 max-w-xs text-center text-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
            Start now — today&apos;s alarms begin from this moment.
          </p>
        )}
      </div>

      {slots.length > 0 && (
        <div className="card !p-4 sm:!p-6">
          <p className="mb-3 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            Today&apos;s timetable
          </p>
          <div className="space-y-1.5">
            {slots.filter((s) => !isBreakSlot(s.title)).map((s, i) => {
              const isCur = active && effNow >= s.start && effNow < s.end;
              const isPast = effNow >= s.end;
              const SIcon = s.Icon || IconClock;
              const topic = topicFor(s.title);
              // Session complete: sirf centered text, time nahi
              if (s.end <= s.start) {
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center rounded-xl px-3 py-2 text-sm ${
                      isPast
                        ? 'text-neutral-400 dark:text-neutral-600'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <SIcon size={17} />
                      {s.title}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    isCur
                      ? 'bg-blush-200/80 font-semibold text-rosey-dark dark:bg-rosey/20 dark:text-rosey-soft'
                      : isPast
                        ? 'text-neutral-400 dark:text-neutral-600'
                        : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2.5">
                      <SIcon size={17} />
                      {s.title}
                    </span>
                    {topic && (
                      <span className="mt-0.5 block truncate pl-[27px] text-xs font-normal opacity-70">
                        {topic}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-xs">
                      {fmtClock(s.start)} – {fmtClock(s.end)}
                    </span>
                    {isStudySlot(s.title) ? (
                      <button
                        aria-label={`Edit topic for ${s.title}`}
                        onClick={() => openTopicDlg(s.title)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-blush-200/70 hover:text-rosey-dark dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-rosey-soft"
                      >
                        <IconPencil size={14} />
                      </button>
                    ) : (
                      <span className="h-7 w-7" aria-hidden="true" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topic popup — study slot shuru hote hi */}
      {topicDlg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTopicDlg(null)}
        >
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Now studying</p>
            <h3 className="page-title mt-1">{topicDlg.slot}</h3>
            <p className="page-sub mt-1">Which topic are you covering?</p>
            <input
              autoFocus
              className="input mt-3"
              value={topicDlg.value}
              onChange={(e) => setTopicDlg({ ...topicDlg, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTopicDlg();
              }}
              placeholder="e.g. Number Series"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setTopicDlg(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveTopicDlg}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Break/Lunch popup — avail ya skip */}
      {breakDlg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setBreakDlg(false)}
        >
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Break time</p>
            <h3 className="page-title mt-1">Take this break?</h3>
            <p className="page-sub mt-1">
              Avail the break and rest, or skip it and continue studying.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setBreakDlg(false)}>
                Avail break
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setBreakDlg(false);
                  onSkip();
                }}
              >
                Skip & continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
