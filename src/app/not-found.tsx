import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
      <p className="text-4xl font-bold text-gray-900">404</p>
      <p className="text-sm text-gray-500">This page does not exist.</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90"
      >
        Go home
      </Link>
    </main>
  );
}
