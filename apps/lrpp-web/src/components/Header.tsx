'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../stores/auth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    router.push('/login');
  };

  const getFirstName = (fullName: string | null): string | null => {
    if (!fullName) return null;
    return fullName.split(' ')[0];
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold gradient-text">LRPP</span>
            </Link>

            <div className="hidden sm:flex sm:items-center sm:gap-1">
              <Link href="/" className={navLinkClass('/')}>
                Accueil
              </Link>
              <Link href="/revision" className={navLinkClass('/revision')}>
                Revision
              </Link>
              <Link href="/contact" className={navLinkClass('/contact')}>
                Contact
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline">{getFirstName(user.name) || user.email}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Tableau de bord
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Administration
                      </Link>
                    )}
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn btn-ghost text-sm"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary text-sm"
                >
                  Inscription
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <div className="sm:hidden pb-4 border-t border-gray-200 dark:border-gray-800 mt-2 pt-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className={navLinkClass('/')}
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/revision"
                className={navLinkClass('/revision')}
                onClick={() => setIsMenuOpen(false)}
              >
                Revision
              </Link>
              <Link
                href="/contact"
                className={navLinkClass('/contact')}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
