import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Gestion des erreurs Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  // Redirection selon le type de callback
  if (type === 'recovery') {
    // Reset password flow
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  if (type === 'signup' || type === 'email_change') {
    // Email verification ou changement d'email
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  // Par défaut, rediriger vers la page d'accueil
  return NextResponse.redirect(origin);
}
