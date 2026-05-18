'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { t } from '@/lib/strings';

// Bottom navigation: five labelled tabs (icon + Burmese label). The active tab
// turns teal with a short indicator bar on its top edge. Hidden on the /guess
// betting flow, which carries its own header and action bar.

function Icon({ children, strokeWidth = 1.8 }: { children: ReactNode; strokeWidth?: number }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/',
    label: t.nav.home,
    icon: (
      <Icon>
        <path d="M3.6 11.7 12 4.5l8.4 7.2" />
        <path d="M6 10.3V19.5h12V10.3" />
      </Icon>
    ),
  },
  {
    href: '/history',
    label: t.nav.history,
    icon: (
      <Icon strokeWidth={1.7}>
        <rect x="5" y="3.5" width="14" height="17" rx="2.4" />
        <path d="M9 9h6M9 12.5h6M9 16h4" />
      </Icon>
    ),
  },
  {
    href: '/results',
    label: t.nav.results,
    icon: (
      <Icon strokeWidth={2}>
        <path d="M5 20V11M12 20V5M19 20v-6" />
      </Icon>
    ),
  },
  {
    href: '/profile',
    label: t.nav.profile,
    icon: (
      <Icon strokeWidth={1.7}>
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </Icon>
    ),
  },
  {
    href: '/help',
    label: t.nav.help,
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.6c-.8.5-1.2 1-1.2 2" />
        <path d="M12 16.2h.01" />
      </Icon>
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
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
              active ? 'text-brand' : 'text-gray-400'
            }`}
          >
            {active && (
              <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-brand" />
            )}
            {tab.icon}
            <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
