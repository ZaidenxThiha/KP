import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-gray-600">This page does not exist.</p>
      <Link href="/" className="text-accent underline">
        Go home
      </Link>
    </main>
  );
}
