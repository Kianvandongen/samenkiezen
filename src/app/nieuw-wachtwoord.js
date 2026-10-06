import React, { useState } from 'react';
import { router } from 'expo-router';
import { useStore, api, errText, toast } from '../lib/store';
import { useC, T, Screen, Header, Field, Input, Btn } from '../components/ui';

export default function NewPassword() {
  const S = useStore(), c = useC();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (pw.length < 8) return setErr('Je wachtwoord moet minimaal 8 tekens hebben.');
    setBusy(true);
    try { await api.setPassword(pw); toast('Nieuw wachtwoord opgeslagen'); router.replace('/'); }
    catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  return (
    <Screen header={<Header title="Nieuw wachtwoord" back={false} />}>
      {!S.authed ? <T v="body">Deze link is verlopen of al gebruikt. Vraag op het inlogscherm een nieuwe aan via "Wachtwoord vergeten?".</T> : <>
        <T v="body">Kies een nieuw wachtwoord voor {S.user.email}.</T>
        <Field label="Nieuw wachtwoord"><Input value={pw} onChangeText={t => { setPw(t); setErr(''); }} secureTextEntry placeholder="Minimaal 8 tekens" textContentType="newPassword" autoComplete="new-password" onSubmitEditing={save} /></Field>
        {!!err && <T v="small" c={c.no}>{err}</T>}
        <Btn title={busy ? 'Bezig…' : 'Opslaan'} disabled={busy} onPress={save} />
      </>}
      {!S.authed && <Btn kind="ghost" title="Naar inloggen" onPress={() => router.replace('/auth')} />}
    </Screen>
  );
}
