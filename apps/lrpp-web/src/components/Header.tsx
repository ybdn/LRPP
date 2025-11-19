'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">LRPP</span>
            </Link>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Tableau de bord
              </Link>
              <Link
                href="/pvs"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Procès-verbaux
              </Link>
              <Link
                href="/exercise/fill-blanks"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                PV à trous
              </Link>
              <Link
                href="/exercise/dictation"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Dictée
              </Link>
              <Link
                href="/exam/new"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Examen blanc
              </Link>
              <Link
                href="/stats"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Stats
              </Link>
            </div>
          </div>

          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden pb-3">
            <div className="space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Tableau de bord
              </Link>
              <Link
                href="/pvs"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Procès-verbaux
              </Link>
              <Link
                href="/exercise/fill-blanks"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                PV à trous
              </Link>
              <Link
                href="/exercise/dictation"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Dictée
              </Link>
              <Link
                href="/exam/new"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Examen blanc
              </Link>
              <Link
                href="/stats"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Stats
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
