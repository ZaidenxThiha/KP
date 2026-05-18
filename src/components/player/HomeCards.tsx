'use client';

import Link from 'next/link';
import { useState } from 'react';
import { t } from '@/lib/strings';

// The four home shortcut cards. Help opens an in-place modal; the rest link
// to existing player screens.

const CARD =
  'flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 transition active:scale-[0.97]';
const LABEL = 'text-[11px] font-medium text-gray-600';

function HistoryIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="3.5" width="14" height="17" rx="2.4" />
      <path d="M9 9h6M9 12.5h6M9 16h4" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.6c-.8.5-1.2 1-1.2 2" />
      <path d="M12 16.2h.01" />
    </svg>
  );
}

export function HomeCards() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-4 gap-2.5">
        <Link href="/history" className={CARD}>
          <span className="text-brand">
            <HistoryIcon />
          </span>
          <span className={LABEL}>{t.nav.history}</span>
        </Link>
        <Link href="/results" className={CARD}>
          <span className="text-brand">
            <ResultsIcon />
          </span>
          <span className={LABEL}>{t.nav.results}</span>
        </Link>
        <Link href="/profile" className={CARD}>
          <span className="text-brand">
            <ProfileIcon />
          </span>
          <span className={LABEL}>{t.nav.profile}</span>
        </Link>
        <button type="button" onClick={() => setHelpOpen(true)} className={CARD}>
          <span className="text-brand">
            <HelpIcon />
          </span>
          <span className={LABEL}>{t.nav.help}</span>
        </button>
      </div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-brand">{t.help.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.help.body}</p>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-4 w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-brand-fg"
            >
              {t.help.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
