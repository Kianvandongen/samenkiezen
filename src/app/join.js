import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, toast, errText, api } from '../lib/store';
import { pending } from '../lib/pending';
import { useC, T, Screen, Header, Field, Input, Btn, F } from '../components/ui';

export default function Join() {
  const S = useStore(), c = useC();
  const { code: qc } = useLocalSearchParams();
  const [code, setCode] = useState(qc ? String(qc) : '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (cc = code) => {
    const v = cc.trim().toUpperCase();
    if (!v) return;
    if (!S.authed) { pending.code = v; router.replace('/'); return; }
    setBusy(true);
    try {
      const gid = await api.joinGroup(v);
      router.replace(`/group/${gid}`);
      toast('Je zit in de groep');
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  useEffect(() => { if (qc) go(String(qc)); }, []);
  return (
    <Screen header={<Header title="Aansluiten bij een groep" />}>
      <T v="small" style={{ fontSize: 15 }}>Vul de groepscode in die je hebt gekregen, of open de uitnodigingslink.</T>
      <Field label="Groepscode"><Input value={code} onChangeText={t => { setCode(t); setErr(''); }} placeholder="ABC-1D2" autoCapitalize="characters" autoCorrect={false} style={{ height: 58, textAlign: 'center', fontFamily: F.display, fontSize: 20, letterSpacing: 2 }} onSubmitEditing={() => go()} /></Field>
      {!!err && <T v="small" c={c.no}>{err}</T>}
      <Btn title={busy ? 'Bezig…' : 'Aansluiten'} disabled={busy} onPress={() => go()} />
    </Screen>
  );
}
