import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue sur LRPP
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Révisez la procédure pénale et maîtrisez les PV de l&apos;OPJ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/exercise/fill-blanks" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PV à trous
            </h3>
            <p className="text-gray-600">
              Complétez les trous dans les PV pour mémoriser les articles et formulations.
            </p>
          </Link>

          <Link href="/exercise/dictation" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dictée juridique
            </h3>
            <p className="text-gray-600">
              Recopiez de mémoire les blocs de texte pour maîtriser les formulations exactes.
            </p>
          </Link>

          <Link href="/exam/new" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Examen blanc
            </h3>
            <p className="text-gray-600">
              Testez-vous en conditions réelles avec un examen chronométré.
            </p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Votre progression
          </h2>
          <p className="text-sm text-gray-500">
            Commencez un exercice pour suivre votre progression.
          </p>
        </section>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        LRPP - Logiciel de Révision de la Procédure Pénale
      </footer>
    </>
  );
}
