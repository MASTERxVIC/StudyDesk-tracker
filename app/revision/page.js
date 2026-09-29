'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconCheck, IconTrophy, IconWrench, IconTarget, IconEnglish } from '../components/icons';
import { cachedGet, bust } from '../lib/fetchCache';

/* ---------------- Vocabulary panel ---------------- */

const emptyWord = { word: '', meaning: '', example: '' };

function VocabPanel() {
  const [words, setWords] = useState([]);
  const [form, setForm] = useState(emptyWord);
  const [editingId, setEditingId] = useState(null);

  const load = () =>
    cachedGet('/api/vocab')
      .then((d) => setWords(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.word.trim()) return;
    const payload = { ...form, dateAdded: new Date().toISOString().slice(0, 10) };
    const url = editingId ? `/api/vocab/${editingId}` : '/api/vocab';
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm(emptyWord);
      setEditingId(null);
      bust('/api/vocab');
      load();
    }
  };

  const toggleMastered = async (w) => {
    await fetch(`/api/vocab/${w._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastered: !w.mastered }),
    });
    bust('/api/vocab');
    load();
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this word?')) return;
    await fetch(`/api/vocab/${id}`, { method: 'DELETE' });
    bust('/api/vocab');
    load();
  };

  const mastered = words.filter((w) => w.mastered).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="page-sub !mt-0">One word a day keeps the RC blues away.</p>
        <span className="badge">{mastered}/{words.length} mastered</span>
      </div>

      <form onSubmit={onSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Word</label>
          <input name="word" value={form.word} onChange={onChange} className="input" placeholder="e.g. meticulous" required />
        </div>
        <div>
          <label className="label">Meaning</label>
          <input name="meaning" value={form.meaning} onChange={onChange} className="input" placeholder="very careful" />
        </div>
        <div>
          <label className="label">Example</label>
          <input name="example" value={form.example} onChange={onChange} className="input" placeholder="She is meticulous…" />
        </div>
        <div className="flex gap-3 sm:col-span-3">
          <button className="btn-primary" type="submit">{editingId ? 'Update' : 'Add word'}</button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm(emptyWord); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((w) => (
          <div key={w._id} className={`card !p-4 ${w.mastered ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-lg text-rosey-dark dark:text-rosey-soft">{w.word}</p>
              <button
                onClick={() => toggleMastered(w)}
                title={w.mastered ? 'Mark unmastered' : 'Mark mastered'}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  w.mastered ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blush-200 text-rosey-dark dark:bg-white/10 dark:text-neutral-300'
                }`}
              >
                {w.mastered ? <><IconCheck size={13} /> Mastered</> : 'Learn'}
              </button>
            </div>
            {w.meaning && <p className="mt-1 text-sm font-medium">{w.meaning}</p>}
            {w.example && <p className="mt-1 text-sm italic text-neutral-500 dark:text-neutral-400">“{w.example}”</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost !px-3 !py-1" onClick={() => { setEditingId(w._id); setForm({ word: w.word, meaning: w.meaning ?? '', example: w.example ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Edit
              </button>
              <button className="btn-ghost !px-3 !py-1 !text-rosey" onClick={() => onDelete(w._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {words.length === 0 && <p className="page-sub">No words yet — add your first one above!</p>}
    </div>
  );
}

/* ---------------- Current Affairs panel ---------------- */

const CATEGORIES = ['Banking', 'Economy', 'Schemes', 'Appointments', 'Sports', 'Awards', 'International', 'Static GK', 'Other'];

const emptyCA = {
  date: new Date().toISOString().slice(0, 10),
  category: 'Banking',
  title: '',
  detail: '',
};

function CAPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyCA);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('All');

  const load = () =>
    cachedGet('/api/current-affairs')
      .then((d) => setItems(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const url = editingId ? `/api/current-affairs/${editingId}` : '/api/current-affairs';
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(emptyCA);
      setEditingId(null);
      bust('/api/current-affairs');
      load();
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/current-affairs/${id}`, { method: 'DELETE' });
    bust('/api/current-affairs');
    load();
  };

  const shown = useMemo(
    () => (filter === 'All' ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  return (
    <div className="space-y-6">
      <p className="page-sub !mt-0">Banking first, then the rest — one-liner + one static fact.</p>

      <form onSubmit={onSubmit} className="card grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input type="date" name="date" value={form.date} onChange={onChange} className="input" required />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" value={form.category} onChange={onChange} className="input">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Headline</label>
          <input name="title" value={form.title} onChange={onChange} className="input" placeholder="e.g. RBI keeps repo rate unchanged at 6.5%" required />
        </div>
        <div className="col-span-2">
          <label className="label">Detail / static fact</label>
          <textarea name="detail" value={form.detail} onChange={onChange} rows={2} className="input" placeholder="One extra fact to remember…" />
        </div>
        <div className="col-span-2 flex gap-3">
          <button className="btn-primary" type="submit">{editingId ? 'Update' : 'Save'}</button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm(emptyCA); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === c ? 'bg-rosey text-white' : 'bg-blush-200/70 text-neutral-600 hover:bg-blush-200 dark:bg-white/10 dark:text-neutral-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((i) => (
          <div key={i._id} className="card !p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <span className="badge mr-2">{i.category}</span>
                <span className="text-xs text-neutral-400">{i.date}</span>
                <p className="mt-1.5 font-semibold">{i.title}</p>
                {i.detail && <p className="mt-1 text-neutral-600 dark:text-neutral-300">{i.detail}</p>}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost !px-3 !py-1.5" onClick={() => { setEditingId(i._id); setForm({ date: i.date, category: i.category, title: i.title, detail: i.detail ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Edit
              </button>
              <button className="btn-ghost !px-3 !py-1.5 !text-rosey" onClick={() => onDelete(i._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="page-sub">Nothing here yet.</p>}
    </div>
  );
}

/* ---------------- Weekly Review panel ---------------- */

function mondayOfThisWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const emptyReview = {
  weekStart: mondayOfThisWeek(),
  hoursStudied: '',
  mocksTaken: '',
  avgAccuracy: '',
  wins: '',
  improvements: '',
  nextWeekFocus: '',
};

function WeeklyPanel() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(emptyReview);
  const [editingId, setEditingId] = useState(null);

  const load = () =>
    cachedGet('/api/weekly-reviews')
      .then((d) => setReviews(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const num = (v) => (v === '' ? 0 : Number(v));

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      weekStart: form.weekStart,
      hoursStudied: num(form.hoursStudied),
      mocksTaken: num(form.mocksTaken),
      avgAccuracy: num(form.avgAccuracy),
      wins: form.wins,
      improvements: form.improvements,
      nextWeekFocus: form.nextWeekFocus,
    };
    const url = editingId ? `/api/weekly-reviews/${editingId}` : '/api/weekly-reviews';
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm({ ...emptyReview, weekStart: mondayOfThisWeek() });
      setEditingId(null);
      bust('/api/weekly-reviews');
      load();
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    await fetch(`/api/weekly-reviews/${id}`, { method: 'DELETE' });
    bust('/api/weekly-reviews');
    load();
  };

  return (
    <div className="space-y-6">
      <p className="page-sub !mt-0">Sunday ritual — what worked, what didn&apos;t, what&apos;s next.</p>

      <form onSubmit={onSubmit} className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Week starting (Mon)</label>
          <input type="date" name="weekStart" value={form.weekStart} onChange={onChange} className="input" required />
        </div>
        <div>
          <label className="label">Hours studied</label>
          <input type="number" min="0" step="0.5" name="hoursStudied" value={form.hoursStudied} onChange={onChange} className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Mocks taken</label>
          <input type="number" min="0" name="mocksTaken" value={form.mocksTaken} onChange={onChange} className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Avg accuracy %</label>
          <input type="number" min="0" max="100" name="avgAccuracy" value={form.avgAccuracy} onChange={onChange} className="input" placeholder="0" />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="label flex items-center gap-1.5">Wins this week <IconTrophy size={14} /></label>
          <textarea name="wins" value={form.wins} onChange={onChange} rows={2} className="input" />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="label flex items-center gap-1.5">What to improve <IconWrench size={14} /></label>
          <textarea name="improvements" value={form.improvements} onChange={onChange} rows={2} className="input" />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="label flex items-center gap-1.5">Next week&apos;s focus <IconTarget size={14} /></label>
          <textarea name="nextWeekFocus" value={form.nextWeekFocus} onChange={onChange} rows={2} className="input" />
        </div>
        <div className="col-span-2 flex gap-3 sm:col-span-4">
          <button className="btn-primary" type="submit">{editingId ? 'Update' : 'Save review'}</button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm({ ...emptyReview, weekStart: mondayOfThisWeek() }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r._id} className="card !p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Week of {r.weekStart}</p>
              <div className="flex gap-2 text-xs">
                <span className="badge">{r.hoursStudied}h</span>
                <span className="badge">{r.mocksTaken} mocks</span>
                <span className="badge">{r.avgAccuracy}% acc</span>
              </div>
            </div>
            {r.wins && <p className="mt-2 flex items-center gap-1.5 text-sm"><span className="flex items-center gap-1 font-semibold"><IconTrophy size={14} /> Wins:</span> {r.wins}</p>}
            {r.improvements && <p className="mt-1 flex items-center gap-1.5 text-sm"><span className="flex items-center gap-1 font-semibold"><IconWrench size={14} /> Improve:</span> {r.improvements}</p>}
            {r.nextWeekFocus && <p className="mt-1 flex items-center gap-1.5 text-sm"><span className="flex items-center gap-1 font-semibold"><IconTarget size={14} /> Next:</span> {r.nextWeekFocus}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost !px-3 !py-1.5" onClick={() => { setEditingId(r._id); setForm({ weekStart: r.weekStart, hoursStudied: r.hoursStudied ?? '', mocksTaken: r.mocksTaken ?? '', avgAccuracy: r.avgAccuracy ?? '', wins: r.wins ?? '', improvements: r.improvements ?? '', nextWeekFocus: r.nextWeekFocus ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Edit
              </button>
              <button className="btn-ghost !px-3 !py-1.5 !text-rosey" onClick={() => onDelete(r._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {reviews.length === 0 && <p className="page-sub">No weekly reviews yet — do your first Sunday review!</p>}
    </div>
  );
}

/* ---------------- Page ---------------- */

const TABS = [
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'ca', label: 'Current Affairs' },
  { id: 'weekly', label: 'Weekly Review' },
];

export default function RevisionPage() {
  const [tab, setTab] = useState('vocab');
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Revision</p>
        <h1 className="page-title mt-2 flex items-center gap-2">Revise & retain <IconEnglish size={22} /></h1>
        <p className="page-sub">Words, news, and the weekly mirror.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-blush-200 text-rosey-dark dark:bg-rosey/25 dark:text-rosey-soft'
                : 'text-neutral-500 hover:bg-blush-100 dark:text-neutral-400 dark:hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'vocab' && <VocabPanel />}
      {tab === 'ca' && <CAPanel />}
      {tab === 'weekly' && <WeeklyPanel />}
    </div>
  );
}
