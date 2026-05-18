'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { t } from '@/lib/strings';

// Bottom navigation modelled on the Facebook mobile app: icon-only tabs,
// outline icons that switch to a filled variant on the active tab, plus a
// short indicator bar along that tab's top edge. Hidden on the /guess betting
// flow, which provides its own contextual action bar.

const SIZE = 26;

function Outline({ children }: { children: ReactNode }) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Filled({ children }: { children: ReactNode }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="currentColor">
      {children}
    </svg>
  );
}

const TABS: { href: string; label: string; outline: ReactNode; filled: ReactNode }[] = [
  {
    href: '/',
    label: t.nav.home,
    outline: (
      <Outline>
        <path d="M3.6 11.7 12 4.5l8.4 7.2" />
        <path d="M6 10.3V19.5h12V10.3" />
      </Outline>
    ),
    filled: (
      <Filled>
        <path d="M12 3 3 11v8.5a1 1 0 0 0 1 1h4.6v-5.4a1 1 0 0 1 1-1h4.8a1 1 0 0 1 1 1v5.4H20a1 1 0 0 0 1-1V11L12 3Z" />
      </Filled>
    ),
  },
  {
    href: '/guess',
    label: t.nav.bet,
    outline: (
      <Outline>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 8.3v7.4M8.3 12h7.4" />
      </Outline>
    ),
    filled: (
      <Filled>
        <circle cx="12" cy="12" r="9" />
        <path
          d="M12 8.3v7.4M8.3 12h7.4"
          stroke="#fff"
          strokeWidth="2.3"
          strokeLinecap="round"
          fill="none"
        />
      </Filled>
    ),
  },
  {
    href: '/results',
    label: t.nav.results,
    outline: (
      <Outline>
        <rect x="3.8" y="4.3" width="16.4" height="15.4" rx="2.6" />
        <path d="M7.7 9h8.6M7.7 12.5h8.6M7.7 16h5.4" />
      </Outline>
    ),
    filled: (
      <Filled>
        <rect x="3.8" y="4.3" width="16.4" height="15.4" rx="2.6" />
        <path
          d="M7.7 9h8.6M7.7 12.5h8.6M7.7 16h5.4"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinecap="round"
          fill="none"
        />
      </Filled>
    ),
  },
  {
    href: '/history',
    label: t.nav.history,
    outline: (
      <Outline>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 7.3V12l3.3 2" />
      </Outline>
    ),
    filled: (
      <Filled>
        <circle cx="12" cy="12" r="9" />
        <path
          d="M12 7.3V12l3.3 2"
          stroke="#fff"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Filled>
    ),
  },
  {
    href: '/profile',
    label: t.nav.profile,
    outline: (
      <Outline>
        <circle cx="12" cy="8.6" r="3.7" />
        <path d="M5.6 19.4a6.4 6.4 0 0 1 12.8 0" />
      </Outline>
    ),
    filled: (
      <Filled>
        <circle cx="12" cy="8.2" r="4.1" />
        <path d="M4.8 20c0-4 3.2-6.4 7.2-6.4s7.2 2.4 7.2 6.4Z" />
      </Filled>
    ),
  },
];

export function PlayerTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/guess')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-1 items-center justify-center py-3 transition-colors ${
              active ? 'text-brand' : 'text-gray-400'
            }`}
          >
            {active && (
              <span className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-brand" />
            )}
            {active ? tab.filled : tab.outline}
          </Link>
        );
      })}
    </nav>
  );
}
