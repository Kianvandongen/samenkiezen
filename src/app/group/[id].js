import React, { useState } from 'react';
import { View, ScrollView, Linking, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { TRANS, CUIS, GENRES, LVLS, INTS, MOODS } from '../../lib/data';
import { useStore, mutate, toast, rnd, nameOf, isAdmin, api, errText, S as St } from '../../lib/store';
import { useC, T, Screen, Header, IBtn, Tabs, Section, Item, Thumb, Icon, Empty, Box, Btn, Av, Field, Input, Chips, toggleIn, Stepper, Sheet, Toggle, SwitchRow, Confirm, Bar } from '../../components/ui';
import { RoundCard, MatchMini } from '../../components/cards';
import { Cta } from '../../components/picker';

const ORIGIN = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://samenkiezen.app';
async function run(fn, ok) { try { await fn(); if (ok) toast(ok); } catch (e) { toast(errText(e)); } }

export default function Group() {
  const { id, tab: t0 } = useLocalSearchParams();
  const S = useStore(), c = useC();
  const [tab, setTab] = useState(t0 || 'overzicht');
  const [mm, setMm] = useState(null);
  const [cf, setCf] = useState(null);
  const g = S.groups.find(x => x.id === id);
  if (!g) return <Screen header={<Header title="Groep" />}><Empty text="Deze groep bestaat niet meer." /></Screen>;
  const admin = isAdmin(g);
  const rs = S.rounds.filter(r => r.gid === id), ms = S.matches.filter(m => rnd(m.rid)?.gid === id);
  const link = `${ORIGIN}/join?code=${g.code}`;
  let body;
  if (tab === 'overzicht') body = <>
    <Cta onPress={() => router.push({ pathname: '/wizard', params: { gid: id } })} sub={`In ${g.name}`} />
    <Section title="Actieve rondes">{rs.filter(r => r.status === 'active').map(r => <RoundCard key={r.id} r={r} />)}{!rs.some(r => r.status === 'active') && <Empty text="Geen actieve rondes." />}</Section>
    <Section title="Matches">{ms.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{ms.map(m => <MatchMini key={m.id} m={m} />)}</ScrollView> : <Empty text="Nog geen matches in deze groep." />}</Section>
    <Section title="Eerdere rondes">{rs.filter(r => r.status !== 'active').map(r => <RoundCard key={r.id} r={r} />)}{!rs.some(r => r.status !== 'active') && <Empty text="Nog geen afgeronde rondes." />}</Section>
    <Item onPress={() => router.push({ pathname: '/chat', params: { gid: id } })}>
      <Thumb bg={c.purpleSoft}><Icon n="message-circle" s={22} c={c.purpleInk} /></Thumb>
      <View style={{ flex: 1 }}><T v="b">Groepschat</T><T v="small">{S.msgs.filter(m => m.gid === id && !m.rid).length} berichten</T></View>
      <Icon n="chevron-right" s={18} c={c.muted} />
    </Item>
  </>;
  else if (tab === 'leden') body = <>
    <Box style={{ gap: 12, alignItems: 'center' }}>
      <T v="eyebrow">Groepscode</T>
      <T v="h1" style={{ letterSpacing: 2 }} selectable>{g.code}</T>
      <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}><QRCode value={link} size={164} color="#16205c" backgroundColor="#ffffff" /></View>
      <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
        <Btn sm flex kind="ghost" icon="copy" title="Kopieer link" onPress={async () => { await Clipboard.setStringAsync(link); toast('Link gekopieerd'); }} />
        <Btn sm flex kind="wa" icon="share-2" title="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`Doe mee met "${g.name}" op SamenKiezen: ${link} (code ${g.code})`)}`)} />
      </View>
      <T v="small" selectable>{link}</T>
      {g.members.length < 2 && <T v="small" style={{ textAlign: 'center' }}>Stuur de link of code naar je vrienden. Zodra ze een account hebben, zitten ze in de groep.</T>}
    </Box>
    <Section title={`${g.members.length} leden`}>
      {g.members.map(m => (
        <Item key={m.id}>
          <Av id={m.id} s={40} />
          <View style={{ flex: 1 }}><T v="b">{nameOf(m.id)}</T><T v="small">{m.role === 'beheerder' ? 'Beheerder' : 'Lid'}{m.active ? '' : ' · inactief'}</T></View>
          {admin && m.id !== 'me' && <Btn sm kind="ghost" title="Beheer" onPress={() => setMm(m.id)} />}
        </Item>
      ))}
    </Section>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Btn flex kind="danger" title="Groep verlaten" onPress={() => setCf({ title: 'Groep verlaten?', text: 'Je verliest toegang tot de rondes en chat van deze groep.', ok: 'Verlaten', danger: true, fn: () => run(async () => { await api.leaveGroup(id); router.replace('/groups'); }, 'Je hebt de groep verlaten') })} />
      {admin && <Btn flex kind="danger" title="Verwijderen" onPress={() => setCf({ title: 'Groep verwijderen?', text: 'De groep, alle rondes, matches en berichten worden voor iedereen verwijderd.', ok: 'Verwijderen', danger: true, fn: () => run(async () => { await api.deleteGroup(id); router.replace('/groups'); }, 'Groep verwijderd') })} />}
    </View>
  </>;
  else {
    const p = g.prefs, lab = k => LVLS[k] || MOODS[k] || INTS[k] || k;
    const L = Object.entries(g.learn).filter(([, v]) => v.y + v.n >= 2).map(([k, v]) => ({ k, s: v.y / (v.y + v.n) }));
    const top5 = [...L].sort((a, b) => b.s - a.s).slice(0, 5), low = [...L].sort((a, b) => a.s - b.s).slice(0, 3);
    const tog = k => v => mutate(s => toggleIn(s.groups.find(x => x.id === id).prefs[k], v));
    const set = k => v => mutate(s => { s.groups.find(x => x.id === id).prefs[k] = v; });
    const LB = ({ x, neg }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><T v="small" style={{ width: 120, color: c.ink }} numberOfLines={1}>{lab(x.k)}</T><View style={{ flex: 1 }}><Bar h={8} pct={(neg ? 1 - x.s : x.s) * 100} color={neg ? c.no : c.yes} /></View><T v="b" style={{ fontSize: 13, width: 40, textAlign: 'right' }}>{Math.round((neg ? 1 - x.s : x.s) * 100)}%</T></View>;
    body = <>
      <T v="small">Het groepsprofiel vult nieuwe rondes vooraf in en bepaalt mee de volgorde van kaarten. Het overschrijdt nooit de filters van een ronde.</T>
      <Box style={{ gap: 10 }}>
        <T v="h3">Wat jullie vaak kiezen</T>
        {top5.length ? top5.map(x => <LB key={x.k} x={x} />) : <T v="small">Nog te weinig stemmen.</T>}
        {!!low.length && <><T v="h3" style={{ marginTop: 6 }}>Krijgt vaak nee</T>{low.map(x => <LB key={x.k} x={x} neg />)}</>}
        <T v="small">Gebaseerd op alle stemmen in deze groep · {St.matches.filter(m => rnd(m.rid)?.gid === id && m.final).length} definitief gekozen</T>
      </Box>
      <Field label="Gemiddeld budget p.p."><Stepper value={p.budget} step={5} max={500} onChange={set('budget')} suffix=" €" /></Field>
      <Field label="Standaard locatie"><Input value={p.loc} onChangeText={set('loc')} /></Field>
      <Field label="Reisafstand"><Stepper value={p.km} min={1} max={200} onChange={set('km')} suffix=" km" /></Field>
      <Field label="Vervoer"><Chips dict={TRANS} sel={p.trans} onToggle={tog('trans')} /></Field>
      <Field label="Favoriete keukens"><Chips dict={CUIS} sel={p.cuis} onToggle={tog('cuis')} /></Field>
      <Field label="Filmgenres"><Chips dict={GENRES} sel={p.genres} onToggle={tog('genres')} /></Field>
      <Field label="Activiteitsniveaus"><Chips dict={LVLS} sel={p.lvls} onToggle={tog('lvls')} /></Field>
      <Field label="Interesses"><Chips dict={INTS} sel={p.ints} onToggle={tog('ints')} /></Field>
      <Field label="Doen we liever nooit"><Chips dict={INTS} sel={p.never} onToggle={tog('never')} /></Field>
      <Field label="Binnen of buiten"><Chips single sel={p.io} opts={[['binnen', 'Binnen'], ['buiten', 'Buiten'], ['beide', 'Beide']]} onToggle={set('io')} /></Field>
      <Field label="Leeftijd"><Chips single sel={p.age} opts={[['18-24', '18–24'], ['25-34', '25–34'], ['35-49', '35–49'], ['50+', '50+'], ['gemengd', 'Gemengd']]} onToggle={set('age')} /></Field>
      <Field label="Plannen"><Chips single sel={p.plan} opts={[['spontaan', 'Spontaan'], ['reserveren', 'Vooraf reserveren']]} onToggle={set('plan')} /></Field>
    </>;
  }
  const mem = mm && g.members.find(x => x.id === mm);
  return (
    <Screen header={<Header title={`${g.e} ${g.name}`} right={<IBtn n="message-circle" label="Groepschat" onPress={() => router.push({ pathname: '/chat', params: { gid: id } })} />} />}>
      <Tabs tabs={[['overzicht', 'Overzicht'], ['leden', 'Leden'], ['profiel', 'Profiel']]} value={tab} onChange={setTab} />
      {body}
      <Sheet visible={!!mem} onClose={() => setMm(null)}>
        {mem && <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Av id={mem.id} s={44} /><T v="h2" style={{ fontSize: 18 }}>{nameOf(mem.id)}</T></View>
          <Box style={{ paddingVertical: 2 }}><SwitchRow last title="Actief in rondes" sub="Alleen actieve leden tellen mee voor een match." on={mem.active} onPress={() => run(() => api.member(id, mem.id, 'toggle_active'))} /></Box>
          <Btn kind="ghost" title={mem.role === 'beheerder' ? 'Beheerdersrol intrekken' : 'Maak beheerder'} onPress={() => { const pid = mem.id; setMm(null); run(() => api.member(id, pid, 'toggle_admin')); }} />
          <Btn kind="danger" title="Verwijder uit groep" onPress={() => { const pid = mem.id, n = nameOf(pid); setMm(null); run(() => api.member(id, pid, 'remove'), `${n} is verwijderd`); }} />
        </>}
      </Sheet>
      <Confirm state={cf} setState={setCf} />
    </Screen>
  );
}
