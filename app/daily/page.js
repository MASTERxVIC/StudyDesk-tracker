'use client';

import { useEffect, useState } from 'react';
import { IconPen, IconPencil, IconPlus, IconAlert } from '../components/icons';
import { cachedGet, bust } from '../lib/fetchCache';

// Local date — raat 12 baje (IST) date flip hota hai
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const emptyForm = {
  date: todayISO(),
  quantStatus: 'not-started',
  reasoningStatus: 'not-started',
  englishStatus: 'not-started',
  gaStatus: 'not-started',
  hours: '',
  notes: '',
};

const STATUSES = [
  { id: 'done', label: 'Done' },
  { id: 'partial', label: 'Partial' },
  { id: 'not-started', label: 'Not started' },
];

const STATUS_LABEL = { done: 'Done', partial: 'Partial', 'not-started': 'Not started' };

function statusPillClass(s, active) {
  if (!active) return 'bg-white text-neutral-400 ring-1 ring-inset ring-neutral-200 hover:ring-neutral-300 dark:bg-white/5 dark:text-neutral-500 dark:ring-white/10';
  if (s === 'done') return 'bg-emerald-500 text-white shadow-sm';
  if (s === 'partial') return 'bg-amber-400 text-white shadow-sm';
  return 'bg-neutral-400 text-white shadow-sm';
}

function StatusPicker({ value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${statusPillClass(s.id, value === s.id)}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

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

const SUBJECTS = [
  ['Quant', 'quantStatus'],
  ['Reasoning', 'reasoningStatus'],
  ['English', 'englishStatus'],
  ['GA', 'gaStatus'],
];

export default function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [suggestHours, setSuggestHours] = useState(null); // timer ke End session se aaya suggestion

  const load = () =>
    cachedGet('/api/daily-logs')
      .then((d) => setLogs(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
    // Timer ke End session se aaye ho to calculated hours ka suggestion milega (ek baar)
    try {
      const v = sessionStorage.getItem('studydesk-suggest-hours');
      sessionStorage.removeItem('studydesk-suggest-hours');
      if (v !== null && v !== '' && !isNaN(Number(v))) setSuggestHours(Number(v));
    } catch { /* ignore */ }
  }, []);

  // Suggestion apply: entry nahi hai to naya form (hours pre-filled, baaki blank);
  // entry pehle se hai to edit mode me kholo — hours khali ho to suggestion bharega,
  // user ka likha kuch overwrite nahi hoga.
  useEffect(() => {
    if (suggestHours === null || suggestHours === undefined) return;
    const tl = logs.find((l) => l.date === todayISO());
    if (tl) {
      onEdit(tl);
      if (tl.hours === null || tl.hours === undefined || tl.hours === '') {
        setForm((f) => ({ ...f, hours: suggestHours }));
      }
    } else if (!editingId) {
      setForm((f) =>
        f.hours === '' || f.hours === null || f.hours === undefined ? { ...f, hours: suggestHours } : f
      );
    }
    setSuggestHours(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  const iso = todayISO();
  const todayLog = logs.find((l) => l.date === iso);

  // kisi date ka log pehle se hai aur hum usi ko edit nahi kar rahe → duplicate
  const dupLog =
    form.date && logs.find((l) => l.date === form.date && l._id !== editingId);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onStatus = (key, v) => setForm({ ...form, [key]: v });

  const num = (v) => (v === '' ? 0 : Number(v));

  const onTodayClick = () => {
    if (todayLog) {
      onEdit(todayLog);
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, date: todayISO() });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (dupLog) return; // warning already shown — naya log nahi banega
    setSaving(true);
    const payload = {
      date: form.date,
      quantStatus: form.quantStatus,
      reasoningStatus: form.reasoningStatus,
      englishStatus: form.englishStatus,
      gaStatus: form.gaStatus,
      hours: num(form.hours),
      notes: form.notes,
    };
    const url = editingId ? `/api/daily-logs/${editingId}` : '/api/daily-logs';
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm({ ...emptyForm, date: todayISO() });
      setEditingId(null);
      bust('/api/daily-logs');
      load();
    }
    setSaving(false);
  };

  const onEdit = (l) => {
    setEditingId(l._id);
    setForm({
      date: l.date,
      quantStatus: l.quantStatus || 'not-started',
      reasoningStatus: l.reasoningStatus || 'not-started',
      englishStatus: l.englishStatus || 'not-started',
      gaStatus: l.gaStatus || 'not-started',
      hours: l.hours ?? '',
      notes: l.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/daily-logs/${id}`, { method: 'DELETE' });
    bust('/api/daily-logs');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">Daily Log <IconPen size={22} /></h1>
          <p className="page-sub">One tap per subject — done, partial, or not started.</p>
        </div>
        <button onClick={onTodayClick} className="btn-pill flex shrink-0 items-center gap-1.5 !px-5 !py-2.5 text-sm">
          {todayLog ? <><IconPencil size={15} /> Edit today&apos;s log</> : <><IconPlus size={15} /> Today&apos;s log</>}
        </button>
      </div>

      {dupLog && (
        <div className="card flex flex-wrap items-center justify-between gap-3 !border-amber-300 !bg-amber-50 dark:!border-amber-500/30 dark:!bg-amber-500/10">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
            <IconAlert size={16} /> A log for {form.date} already exists — edit it if you like.
          </p>
          <button onClick={() => onEdit(dupLog)} className="btn-ghost !px-4 !py-1.5">
            Edit it
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Date</label>
            <input type="date" name="date" value={form.date} onChange={onChange} className="input" required />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Study hours</label>
            <input
              type="number" min="0" step="0.1" name="hours" value={form.hours}
              onChange={onChange} className="input" placeholder="e.g. 6.5"
            />
          </div>
        </div>

        {SUBJECTS.map(([label, key]) => (
          <div key={key} className="card-soft !p-4">
            <p className="mb-2 font-semibold text-neutral-700 dark:text-neutral-200">{label}</p>
            <StatusPicker value={form[key]} onPick={(v) => onStatus(key, v)} />
          </div>
        ))}

        <div>
          <label className="label">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onChange} rows={2} className="input" placeholder="What did you study today?" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving || !!dupLog}>
            {saving ? 'Saving…' : editingId ? 'Update entry' : 'Save entry'}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm({ ...emptyForm, date: todayISO() }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {logs.map((l) => (
          <div key={l._id} className="card flex items-start justify-between gap-3 !p-4">
            <div className="text-sm">
              <p className="font-semibold">{l.date} <span className="ml-2 font-normal text-neutral-500">{l.hours}h</span></p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {SUBJECTS.map(([label, key]) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
                    <StatusBadge value={l[key]} />
                  </span>
                ))}
              </div>
              {l.notes && <p className="mt-2 text-neutral-600 dark:text-neutral-300">{l.notes}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="btn-ghost !px-3 !py-1.5" onClick={() => onEdit(l)}>Edit</button>
              <button className="btn-ghost !px-3 !py-1.5 !text-rosey" onClick={() => onDelete(l._id)}>Delete</button>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="page-sub">No entries yet — add your first one above!</p>}
      </div>
    </div>
  );
}
