'use client';

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header minimal */}
      <header className="w-full p-6">
        <Link href="/" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
          LRPP
        </Link>
      </header>

      {/* Content centré */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-12">
        {children}
      </main>

      {/* Footer minimal */}
      <footer className="w-full p-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} LRPP. Tous droits réservés.
      </footer>
    </div>
  );
}
