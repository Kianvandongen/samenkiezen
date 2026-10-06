import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errText, toast } from '../lib/store';
import { useC, T, Btn, Wordmark, Tabs, Field, Input, Box, LinkText } from '../components/ui';

export default function Auth() {
  const c = useC(), ins = useSafeAreaInsets();
  const [tab, setTab] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setErr(''); setInfo('');
    if (tab === 'register' && !name.trim()) return setErr('Vul je voornaam in.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Vul een geldig e-mailadres in.');
    if (pw.length < 8) return setErr('Je wachtwoord moet minimaal 8 tekens hebben.');
    setBusy(true);
    try {
      if (tab === 'register') {
        const signedIn = await api.signUp(name.trim(), email.trim(), pw);
        if (signedIn) { router.replace('/'); toast(`Welkom, ${name.trim()}`); }
        else { setInfo(`We hebben een bevestigingsmail gestuurd naar ${email.trim()}. Klik op de link in die mail en log daarna hier in.`); setTab('login'); }
      } else {
        await api.signIn(email.trim(), pw);
        router.replace('/');
      }
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Vul eerst je e-mailadres in.');
    try { await api.resetPassword(email.trim()); setInfo('Als er een account bestaat, krijg je een mail om je wachtwoord opnieuw in te stellen.'); } catch (e) { setErr(errText(e)); }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: ins.top + 12, paddingBottom: ins.bottom + 24, paddingHorizontal: 20, gap: 18, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <Wordmark />
        <T v="h1">{tab === 'register' ? 'Account maken' : 'Welkom terug'}</T>
        <Tabs tabs={[['register', 'Registreren'], ['login', 'Inloggen']]} value={tab} onChange={t => { setTab(t); setErr(''); }} />
        {!!info && <Box style={{ borderColor: c.yes }}><T v="body" style={{ fontSize: 14 }}>{info}</T></Box>}
        {tab === 'register' && <Field label="Voornaam"><Input value={name} onChangeText={setName} autoComplete="given-name" textContentType="givenName" placeholder="Hoe noemen je vrienden je?" /></Field>}
        <Field label="E-mail"><Input value={email} onChangeText={t => { setEmail(t); setErr(''); }} placeholder="naam@voorbeeld.nl" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" /></Field>
        <Field label="Wachtwoord"><Input value={pw} onChangeText={t => { setPw(t); setErr(''); }} placeholder="Minimaal 8 tekens" secureTextEntry textContentType={tab === 'register' ? 'newPassword' : 'password'} autoComplete={tab === 'register' ? 'new-password' : 'current-password'} onSubmitEditing={submit} /></Field>
        {!!err && <T v="small" c={c.no}>{err}</T>}
        <Btn title={busy ? 'Bezig…' : tab === 'register' ? 'Account maken' : 'Inloggen'} disabled={busy} onPress={submit} />
        {tab === 'login' && <View style={{ alignItems: 'center' }}><LinkText title="Wachtwoord vergeten?" onPress={reset} /></View>}
        <T v="small" style={{ textAlign: 'center' }}>Je gegevens worden alleen gebruikt om samen met je groepen te kiezen en worden nooit verkocht.</T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
