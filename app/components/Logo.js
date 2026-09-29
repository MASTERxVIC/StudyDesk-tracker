'use client';

// StudyDesk logo — sky blue concept (navy badge, 4 ascending blue bars, thin open book)
export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#0F3557" />
      <rect x="13" y="36" width="7" height="10" rx="2" fill="#A8DDF7" />
      <rect x="23" y="30" width="7" height="16" rx="2" fill="#6FC3EE" />
      <rect x="33" y="24" width="7" height="22" rx="2" fill="#1B9BD8" />
      <rect x="43" y="18" width="7" height="28" rx="2" fill="#0E7CB8" />
      <path d="M13 52 Q22 48 32 52 Q42 48 51 52" stroke="#EAF5FD" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
