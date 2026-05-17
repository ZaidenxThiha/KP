'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoutButton } from '@/components/LogoutButton';

export type NavItem = { href: string; label: string };

// Chrome for the admin and officer areas: a fixed sidebar on desktop and a
// slide-in hamburger drawer on mobile (the old sidebar was hidden on phones,
// leaving no navigation at all).
export function DashboardShell({
  role,
  username,
  balance,
  nav,
  children,
}: {
  role: string;
  username: string;
  balance?: number;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const title = role.charAt(0).toUpperCase() + role.slice(1);

  const navLinks = (
    <nav className="flex flex-col gap-0.5">
      {nav.map((n) => {
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-accent/10 font-medium text-accent'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </p>
        <p className="text-sm font-semibold text-gray-900">Guessing Game</p>
      </div>
      <div className="flex-1 overflow-y-auto">{navLinks}</div>
      <div className="mt-3 border-t border-gray-200 px-3 pt-3">
        <p className="truncate text-sm font-medium text-gray-900">{username}</p>
        {typeof balance === 'number' && (
          <p className="text-xs text-gray-500">{balance.toLocaleString()} pts</p>
        )}
        <LogoutButton className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white p-3 md:flex md:flex-col">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-gray-900/40"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white p-3">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="-ml-1.5 rounded-lg p-1.5 text-gray-700 hover:bg-gray-100"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
              <line x1="3.5" y1="12" x2="20.5" y2="12" />
              <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {typeof balance === 'number' && (
            <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {balance.toLocaleString()} pts
            </span>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
