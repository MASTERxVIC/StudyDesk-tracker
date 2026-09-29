'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconBook, IconX } from '../components/icons';
import { cachedGet, bust } from '../lib/fetchCache';
import { getDayPlan, getPlanWeek, fmtDayShort } from '../lib/studyPlan';

const STATUS = [
  { value: 'not-started', label: 'Not started', dot: 'bg-neutral-300 dark:bg-neutral-600' },
  { value: 'in-progress', label: 'In progress', dot: 'bg-amber-400' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
];

/* ---------------- Day-wise study timetable ---------------- */

function TimetableCard() {
  const [planDate, setPlanDate] = useState(() => new Date());
  const plan = getDayPlan(planDate);
  const weekDays = getPlanWeek(planDate);
  const todayStr = new Date().toDateString();
  const goTomorrow = () => {
    const t = new Date(planDate);
    t.setDate(t.getDate() + 1);
    setPlanDate(t);
  };

  return (
    <div className="card">
      <p className="eyebrow">Day-wise plan</p>
      <h2 className="page-title mt-2">Study timetable</h2>

      <div className="mt-4 flex gap-2 overflow-x-auto px-1 py-1" data-no-swipe>
        {weekDays.map(({ date, dayNumber }) => {
          const sel = planDate.toDateString() === date.toDateString();
          const isToday = todayStr === date.toDateString();
          return (
            <button
              key={dayNumber}
              onClick={() => setPlanDate(date)}
              className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                sel
                  ? 'bg-blush-200 text-rosey-dark dark:bg-rosey/25 dark:text-rosey-soft'
                  : 'text-neutral-500 hover:bg-blush-100 dark:text-neutral-400 dark:hover:bg-white/5'
              } ${isToday && !sel ? 'ring-1 ring-rosey/60' : ''}`}
            >
              <span>Day {dayNumber}</span>
              <span className="mt-0.5 font-normal opacity-75">
                {isToday ? 'Today' : fmtDayShort(date)}
              </span>
            </button>
          );
        })}
      </div>

      {!plan && (
        <p className="page-sub mt-4">The plan starts on Day 1 (26 Sept 2026).</p>
      )}

      {plan && plan.phaseDone && (
        <p className="page-sub mt-4">
          Phase A complete — mains mode now. Phase B day-wise plan is coming up.
        </p>
      )}

      {plan && !plan.phaseDone && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Day {plan.dayNumber} <span className="font-normal text-neutral-400">•</span> Week{' '}
            {plan.weekNumber}
            {plan.mockWeek && <span className="font-normal text-neutral-400"> • Mock week</span>}
          </p>
          <div className="mt-2 space-y-1.5">
            {plan.slots.map((s) => (
              <div
                key={s.slot}
                className="flex items-start justify-between gap-3 rounded-xl bg-blush-100/60 px-3 py-2.5 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                    {s.slot}
                  </p>
                  <p className="text-[13px] text-neutral-600 dark:text-neutral-300">{s.topic}</p>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{s.task}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
                  {s.time}
                </span>
              </div>
            ))}
          </div>
          <button onClick={goTomorrow} className="btn-ghost mt-3">
            See tomorrow
          </button>
        </div>
      )}
    </div>
  );
}

export default function SyllabusPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState({ subject: '', topic: '' });
  const [openSubject, setOpenSubject] = useState(null);

  const load = () =>
    cachedGet('/api/syllabus')
      .then((d) => setTopics(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const g = {};
    topics.forEach((t) => {
      if (!g[t.subject]) g[t.subject] = [];
      g[t.subject].push(t);
    });
    return g;
  }, [topics]);

  const setStatus = async (id, status) => {
    setTopics((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));
    await fetch(`/api/syllabus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    bust('/api/syllabus');
  };

  const addTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.subject.trim() || !newTopic.topic.trim()) return;
    const res = await fetch('/api/syllabus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: newTopic.subject.trim(), topic: newTopic.topic.trim() }),
    });
    if (res.ok) {
      setNewTopic({ subject: '', topic: '' });
      bust('/api/syllabus');
      load();
    }
  };

  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic?')) return;
    await fetch(`/api/syllabus/${id}`, { method: 'DELETE' });
    bust('/api/syllabus');
    load();
  };

  if (loading) return <p className="page-sub">Loading syllabus…</p>;

  const subjects = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">Syllabus <IconBook size={22} /></h1>
        <p className="page-sub">Tap a status to update — progress saves automatically.</p>
      </div>

      <TimetableCard />

      <form onSubmit={addTopic} className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label">Subject</label>
          <input className="input" value={newTopic.subject} onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })} placeholder="e.g. Quant" />
        </div>
        <div className="flex-1">
          <label className="label">Topic</label>
          <input className="input" value={newTopic.topic} onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })} placeholder="e.g. Time & Work" />
        </div>
        <button className="btn-primary" type="submit">Add</button>
      </form>

      {subjects.map((subject) => {
        const list = grouped[subject];
        const done = list.filter((t) => t.status === 'completed').length;
        const pct = Math.round((done / list.length) * 100);
        const open = openSubject === subject;
        return (
          <div key={subject} className="card !p-0 overflow-hidden">
            <button
              onClick={() => setOpenSubject(open ? null : subject)}
              className="flex w-full items-center justify-between gap-3 bg-blush-100/70 px-5 py-4 text-left dark:bg-neutral-900"
            >
              <div className="min-w-0">
                <h2 className="truncate text-base text-neutral-900 dark:text-white">{subject}</h2>
                <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-blush-200/80 dark:bg-neutral-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-blush-400 to-rosey" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="badge shrink-0">{done}/{list.length} • {pct}%</span>
            </button>
            {open && (
              <ul className="divide-y divide-blush-100 px-5 dark:divide-neutral-800">
                {list.map((t) => (
                  <li key={t._id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex-1 text-sm">{t.topic}</span>
                    <div className="flex items-center gap-1.5">
                      {STATUS.map((s) => (
                        <button
                          key={s.value}
                          title={s.label}
                          onClick={() => setStatus(t._id, s.value)}
                          className={`h-6 w-6 rounded-full border-2 transition ${
                            t.status === s.value ? 'border-rosey scale-110' : 'border-neutral-200 dark:border-neutral-700'
                          } ${s.dot}`}
                        />
                      ))}
                      <button onClick={() => deleteTopic(t._id)} aria-label="Delete topic" className="ml-1 flex items-center text-neutral-400 hover:text-rosey">
                        <IconX size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {subjects.length === 0 && (
        <p className="page-sub">
          No topics yet — run <code className="rounded bg-blush-200 px-1 dark:bg-neutral-800">npm run seed</code> to
          load the full bank-exam syllabus.
        </p>
      )}
    </div>
  );
}
