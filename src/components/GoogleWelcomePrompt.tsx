'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import InshutiLogo from '@/src/components/InshutiLogo';

type Props = { signedIn: boolean; authLoading: boolean; onEmailClick: () => void };

export default function GoogleWelcomePrompt({ signedIn, authLoading, onEmailClick }: Props) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || signedIn || !supabase) {
      setVisible(false);
      return;
    }
    if (window.sessionStorage.getItem('inshuti-google-welcome-dismissed') === '1') return;
    const timer = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(timer);
  }, [authLoading, signedIn]);

  const dismiss = () => {
    window.sessionStorage.setItem('inshuti-google-welcome-dismissed', '1');
    setVisible(false);
  };

  const continueWithGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/shop` },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  };

  if (!visible || authLoading || signedIn || !supabase) return null;
  return (
    <aside aria-label="Sign in to INSHUTI" className="fixed right-3 top-3 z-[1500] w-[min(360px,calc(100vw-24px))] animate-[welcomePromptIn_.28s_ease-out] rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:right-6 sm:top-6 sm:p-5">
      <style>{'@keyframes welcomePromptIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}'}</style>
      <button type="button" onClick={dismiss} aria-label="Dismiss welcome prompt" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-2 pr-7"><InshutiLogo variant="light" sizeClassName="h-3.5 w-5" /><p className="text-sm font-bold leading-5">Welcome to INSHUTI st@re</p></div>
      <p className="mt-1 pr-2 text-xs leading-5 text-slate-600">Sign in for faster checkout &amp; morning arrival alerts.</p>
      <button type="button" disabled={busy} onClick={() => void continueWithGoogle()} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
        <svg viewBox="0 0 48 48" aria-hidden="true" className="h-4 w-4"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.43 37.98 46.98 31.8 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1-.76-4.59c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        {busy ? 'Connecting…' : 'Continue with Google'}
      </button>
      {error && <p role="alert" className="mt-2 text-[11px] text-rose-700">{error}</p>}
      <button type="button" onClick={onEmailClick} className="mt-3 w-full text-center text-[11px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900">Use Email instead</button>
    </aside>
  );
}
