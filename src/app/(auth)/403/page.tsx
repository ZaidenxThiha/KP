import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">403</h1>
      <p className="text-gray-600">You don&apos;t have access to that area.</p>
      <Link href="/login" className="text-accent underline">
        Back to login
      </Link>
    </main>
  );
}
