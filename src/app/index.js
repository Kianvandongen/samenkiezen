import { Redirect } from 'expo-router';
import { useStore } from '../lib/store';
import { pending } from '../lib/pending';

// Ingelogd blijft ingelogd: de sessie wordt op het toestel bewaard en automatisch vernieuwd.
export default function Index() {
  const S = useStore();
  if (!S.authed) return <Redirect href={S.onboarded ? '/auth' : '/onboarding'} />;
  if (pending.code) { const c = pending.code; pending.code = null; return <Redirect href={{ pathname: '/join', params: { code: c } }} />; }
  return <Redirect href="/home" />;
}
