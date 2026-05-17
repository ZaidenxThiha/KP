'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const ICON = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg {...ICON}>
        <path d="M3 10.8 12 4l9 6.8" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    ),
  },
  {
    href: '/guess',
    label: 'Guess',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" />
      </svg>
    ),
  },
  {
    href: '/results',
    label: 'Results',
    icon: (
      <svg {...ICON}>
        <path d="M9 7h11M9 12h11M9 17h11" />
        <path d="M4 6.6l1 1 1.6-2M4 12l1 1 1.6-2M4 17l1 1 1.6-2" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="9" r="3.6" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
];

export function PlayerTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              active ? 'text-accent' : 'text-gray-400'
            }`}
          >
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
