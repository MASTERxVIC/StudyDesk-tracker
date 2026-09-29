'use client';

import { useEffect, useState } from 'react';
import { IconPencil, IconPlus } from './components/icons';
import { cachedGet } from './lib/fetchCache';
import { PLAN_START } from './lib/studyPlan';

const TOTAL_TOPICS = 141;

const STATUS_LABEL = { done: 'Done', partial: 'Partial', 'not-started': 'Not started' };

function StatusBadge({ value }) {
  const cls =
    value === 'done'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
      : value === 'partial'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
        : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-400';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {STATUS_LABEL[value] || 'Not started'}
    </span>
  );
}

// Local date — raat 12 baje date flip hota hai, UTC ka wait nahi karta
function todayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function parseISODate(s) {
  const [y, m, dd] = s.split('-').map(Number);
  return new Date(y, m - 1, dd);
}

function fmtDateRange(start, end) {
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (sameMonth) return `${start.getDate()} – ${endStr}`;
  const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${startStr} – ${endStr}`;
}

export default function TodayPage() {
  const [logs, setLogs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cachedGet('/api/daily-logs'),
      cachedGet('/api/syllabus'),
    ])
      .then(([l, t]) => {
        setLogs(Array.isArray(l) ? l : []);
        setTopics(Array.isArray(t) ? t : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateEyebrow = now
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
  const dayNum = String(now.getDate()).padStart(2, '0');
  const iso = todayISO();

  // Jab se padhna shuru kiya (Day 1) tab se aaj tak — poora data
  const rangeStart = new Date(PLAN_START);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = todayLocal();
  const rangeLogs = logs.filter((l) => {
    const d = parseISODate(l.date);
    return d >= rangeStart && d <= rangeEnd;
  });

  const weekHours = rangeLogs.reduce((s, l) => s + (l.hours || 0), 0);

  const daysLogged = rangeLogs.length;

  const doneTopics = topics.filter((t) => t.status === 'completed').length;

  const todayLog = logs.find((l) => l.date === iso);

  if (loading) {
    return <p className="page-sub">Loading your day…</p>;
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card relative overflow-hidden !p-8 sm:!p-10">
        <span className="hero-num" aria-hidden>
          {dayNum}
        </span>
        <div className="relative">
          <p className="eyebrow">{dateEyebrow}</p>
          <h1 className="mt-3 max-w-md font-display text-5xl leading-[1.05] text-ink dark:text-[#e8f2fa] sm:text-6xl">
            Today, show the work.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Record the attempt, not the intention. Your weekly pulse will follow.
          </p>
          <a href="/daily" className="btn-pill mt-6 inline-flex items-center gap-1.5">
            {todayLog ? <><IconPencil size={15} /> Edit today&apos;s log</> : <><IconPlus size={15} /> Log today</>}
          </a>
        </div>
      </section>

      {/* Since Day 1 */}
      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Since Day 1</p>
            <h2 className="mt-2 font-display text-3xl text-ink dark:text-[#e8f2fa]">
              Momentum, at a glance
            </h2>
          </div>
          <p className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
            {fmtDateRange(rangeStart, rangeEnd)}
          </p>
        </div>

        <div className="card mt-4 grid grid-cols-3 divide-x divide-blush-200/70 !p-0 dark:divide-white/10">
          <div className="p-5 sm:p-6">
            <p className="font-display text-3xl text-ink dark:text-[#e8f2fa] sm:text-4xl">
              {weekHours.toFixed(1)}h
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Study time</p>
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-display text-3xl text-ink dark:text-[#e8f2fa] sm:text-4xl">
              {daysLogged}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Days logged</p>
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-display text-3xl text-ink dark:text-[#e8f2fa] sm:text-4xl">
              {doneTopics}/{topics.length || TOTAL_TOPICS}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Topics complete</p>
          </div>
        </div>
      </section>

      {/* Today's record */}
      <section>
        <p className="eyebrow">Today&apos;s record</p>
        {todayLog ? (
          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{todayLog.date}</p>
              <span className="badge">{todayLog.hours || 0}h studied</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ['Quant', todayLog.quantStatus],
                ['Reasoning', todayLog.reasoningStatus],
                ['English', todayLog.englishStatus],
                ['GA', todayLog.gaStatus],
              ].map(([label, s]) => (
                <div key={label} className="card-soft !p-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
                  <p className="mt-2"><StatusBadge value={s} /></p>
                </div>
              ))}
            </div>
            {todayLog.notes && (
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{todayLog.notes}</p>
            )}
            <a href="/daily" className="btn-ghost mt-4 inline-flex items-center gap-1.5 !px-4 !py-2">
              <IconPencil size={14} /> Edit
            </a>
          </div>
        ) : (
          <div className="card mt-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Nothing logged yet today.{' '}
              <a href="/daily" className="font-semibold text-rosey-dark underline dark:text-rosey-soft">
                Record your first entry →
              </a>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
