'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconUndo, IconTarget, IconPencil } from '../components/icons';
import { cachedGet, bust } from '../lib/fetchCache';

/* ---------------- Mock Tests panel ---------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);

const EXAM_TYPES = ['IBPS PO', 'IBPS Clerk', 'RRB PO', 'RRB Clerk', 'SBI PO', 'SBI Clerk'];

const MOCK_TYPE_LABEL = { 'topic-wise': 'Topic-wise', sectional: 'Sectional', full: 'Full Mock' };

const emptyMock = (mockType) => ({
  date: todayISO(),
  mockType,
  examType: 'RRB PO',
  quantAttempted: '',
  quantCorrect: '',
  reasoningAttempted: '',
  reasoningCorrect: '',
  englishAttempted: '',
  englishCorrect: '',
  gaAttempted: '',
  gaCorrect: '',
  notes: '',
});

function acc(correct, attempted) {
  const c = Number(correct);
  const a = Number(attempted);
  if (!a) return null;
  return Math.round((c / a) * 100);
}

function NumField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min="0"
        className="input"
        name={name}
        value={value}
        onChange={onChange}
        placeholder="0"
      />
    </div>
  );
}

const SUBJECTS = [
  ['Quant', 'quant'],
  ['Reasoning', 'reasoning'],
  ['English', 'english'],
  ['GA', 'ga'],
];

function MocksPanel({ mockType, onTabChange }) {
  const [mocks, setMocks] = useState([]);
  const [form, setForm] = useState(() => emptyMock(mockType));
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    cachedGet('/api/mocks')
      .then((d) => setMocks(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  // tab badla aur edit mode me nahi → form reset with new mockType
  useEffect(() => {
    if (!editingId) setForm(emptyMock(mockType));
  }, [mockType]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const num = (v) => (v === '' ? 0 : Number(v));

  const totals = SUBJECTS.reduce(
    (s, [, key]) => ({
      a: s.a + num(form[`${key}Attempted`]),
      c: s.c + num(form[`${key}Correct`]),
    }),
    { a: 0, c: 0 }
  );
  const totalAcc = acc(totals.c, totals.a);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      date: form.date,
      mockType: editingId ? form.mockType : mockType,
      examType: form.examType,
      quantAttempted: num(form.quantAttempted),
      quantCorrect: num(form.quantCorrect),
      reasoningAttempted: num(form.reasoningAttempted),
      reasoningCorrect: num(form.reasoningCorrect),
      englishAttempted: num(form.englishAttempted),
      englishCorrect: num(form.englishCorrect),
      gaAttempted: num(form.gaAttempted),
      gaCorrect: num(form.gaCorrect),
      notes: form.notes,
    };
    const url = editingId ? `/api/mocks/${editingId}` : '/api/mocks';
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm(emptyMock(mockType));
      setEditingId(null);
      bust('/api/mocks');
      load();
    }
    setSaving(false);
  };

  const onEdit = (m) => {
    const t = m.mockType || 'full';
    if (t !== mockType) onTabChange(t);
    setEditingId(m._id);
    setForm({
      date: m.date,
      mockType: t,
      examType: m.examType || 'RRB PO',
      quantAttempted: m.quantAttempted ?? '',
      quantCorrect: m.quantCorrect ?? '',
      reasoningAttempted: m.reasoningAttempted ?? '',
      reasoningCorrect: m.reasoningCorrect ?? '',
      englishAttempted: m.englishAttempted ?? '',
      englishCorrect: m.englishCorrect ?? '',
      gaAttempted: m.gaAttempted ?? '',
      gaCorrect: m.gaCorrect ?? '',
      notes: m.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this mock?')) return;
    await fetch(`/api/mocks/${id}`, { method: 'DELETE' });
    bust('/api/mocks');
    load();
  };

  const visible = mocks.filter((m) => (m.mockType || 'full') === mockType);

  const mockTotals = (m) => {
    const a =
      (m.quantAttempted || 0) + (m.reasoningAttempted || 0) + (m.englishAttempted || 0) + (m.gaAttempted || 0);
    const c =
      (m.quantCorrect || 0) + (m.reasoningCorrect || 0) + (m.englishCorrect || 0) + (m.gaCorrect || 0);
    return { a, c };
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" value={form.date} onChange={onChange} className="input" required />
          </div>
          <div>
            <label className="label">Exam type</label>
            <select name="examType" value={form.examType} onChange={onChange} className="input">
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {SUBJECTS.map(([label, key]) => {
          const a = acc(form[`${key}Correct`], form[`${key}Attempted`]);
          return (
            <div key={key} className="card-soft !p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">{label}</span>
                <span className="badge">{a === null ? '—' : `${a}% accuracy`}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Attempted" name={`${key}Attempted`} value={form[`${key}Attempted`]} onChange={onChange} />
                <NumField label="Correct" name={`${key}Correct`} value={form[`${key}Correct`]} onChange={onChange} />
              </div>
            </div>
          );
        })}

        <div className="card-soft flex items-center justify-between !p-4">
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">Total</span>
          <span className="badge">{totals.a ? `${totalAcc}% • ${totals.c}/${totals.a}` : '—'}</span>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onChange} rows={2} className="input" placeholder="Weak areas, time issues…" />
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update mock' : 'Save mock'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setEditingId(null); setForm(emptyMock(mockType)); }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((m) => {
          const { a, c } = mockTotals(m);
          const legacy = !a && !c && (m.score || m.totalMarks);
          const pct = legacy
            ? (m.totalMarks ? Math.round((m.score / m.totalMarks) * 100) : 0)
            : acc(c, a);
          return (
            <div key={m._id} className="card !p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{m.examType}</p>
                  <p className="text-xs text-neutral-400">{m.date} • {MOCK_TYPE_LABEL[m.mockType] || 'Full Mock'}</p>
                </div>
                <span className="badge">{pct === null ? '—' : `${pct}%`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush-200/70 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blush-400 to-rosey"
                  style={{ width: `${Math.min(pct || 0, 100)}%` }}
                />
              </div>
              {legacy ? (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{m.score} / {m.totalMarks}</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {SUBJECTS.map(([label, key]) => (
                    <span key={key}>
                      {label} {(m[`${key}Correct`] || 0)}/{(m[`${key}Attempted`] || 0)}
                    </span>
                  ))}
                  <span className="font-semibold text-neutral-600 dark:text-neutral-300">Total {c}/{a}</span>
                </div>
              )}
              {m.notes && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{m.notes}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost !px-3 !py-1.5" onClick={() => onEdit(m)}>Edit</button>
                <button className="btn-ghost !px-3 !py-1.5 !text-rosey" onClick={() => onDelete(m._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      {visible.length === 0 && <p className="page-sub">No {MOCK_TYPE_LABEL[mockType].toLowerCase()} mocks yet.</p>}
    </div>
  );
}

/* ---------------- Page ---------------- */

const TABS = [
  { id: 'topic-wise', label: 'Topic-wise' },
  { id: 'sectional', label: 'Sectional' },
  { id: 'full', label: 'Full Mock' },
];

export default function MockPage() {
  const [tab, setTab] = useState('full');
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Mock</p>
        <h1 className="page-title mt-2 flex items-center gap-2">Test yourself <IconTarget size={24} /></h1>
        <p className="page-sub">Mocks reveal the score.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-blush-200 text-rosey-dark dark:bg-rosey/25 dark:text-rosey-soft'
                : 'text-neutral-500 hover:bg-blush-100 dark:text-neutral-400 dark:hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <MocksPanel mockType={tab} onTabChange={setTab} />
    </div>
  );
}
