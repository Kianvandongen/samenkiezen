import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, mutate } from '../lib/store';
import { opt } from '../lib/data';
import { useC, F, T, Btn, Wordmark, Logo, Avs, Poster, Tag, LinkText, Box, SwitchRow } from '../components/ui';

const MiniCard = ({ o, rot, x }) => {
  const c = useC();
  return (
    <View style={{ position: 'absolute', width: 140, height: 190, borderRadius: 20, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, transform: [{ translateX: x }, { rotate: rot }] }}>
      <Poster o={o} style={{ flex: 1 }} fontSize={48} />
      <Text style={{ padding: 10, fontFamily: F.semi, fontSize: 13, color: c.ink }} numberOfLines={1}>{o.t}</Text>
    </View>
  );
};

const SLIDES = [
  ['Samen kiezen zonder eindeloze appjes', 'Start een ronde, iedereen swipet zelf en de app vindt wat jullie allemaal leuk vinden.', () => <Logo size={120} />],
  ['Eén groep, iedereen erbij', 'Maak een groep voor vrienden, huisgenoten of je team. Uitnodigen gaat met een link, QR-code of groepscode.', () => <View style={{ alignItems: 'center', gap: 14 }}><View style={{ flexDirection: 'row' }}>{[['L', '#7b4dff'], ['D', '#0f9b74'], ['S', '#e0703a'], ['N', '#d63c78']].map(([l, col], i) => <View key={l} style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: col, marginLeft: i ? -12 : 0, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: F.bold, fontSize: 22 }}>{l}</Text></View>)}</View><T v="h2">ABC-4D7</T></View>],
  ['Rechts is ja, links is nee', 'Omhoog bewaar je voor later. Niemand ziet wat jij stemt, zo kiest iedereen eerlijk.', () => <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><MiniCard o={opt('escape')} rot="-8deg" x={-40} /><MiniCard o={opt('pool')} rot="7deg" x={40} /><View style={{ position: 'absolute', top: 14 }}><Tag label="↑ Later" tone="actief" /></View><View style={{ position: 'absolute', left: 14, bottom: 14 }}><Tag label="← Nee" tone="avontuur" /></View><View style={{ position: 'absolute', right: 14, bottom: 14 }}><Tag label="Ja →" tone="licht" /></View></View>],
  ['Iedereen ja? Match!', 'Zegt de hele groep ja op dezelfde optie, dan krijgt iedereen een melding met alles om het meteen te plannen.', () => { const c = useC(); return <View style={{ alignItems: 'center', gap: 10 }}><Poster o={opt('pool')} style={{ width: 130, height: 130, borderRadius: 34 }} fontSize={64} /><Text style={{ fontFamily: F.displayBold, fontSize: 28, color: c.purpleInk }}>Match!</Text></View>; }],
];

export default function Onboarding() {
  const S = useStore(), c = useC(), ins = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const dots = <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>{[0, 1, 2, 3, 4].map(k => <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? c.purple : c.line }} />)}</View>;
  const done = () => { mutate(s => { s.onboarded = true; }); router.replace('/'); };
  if (i < 4) {
    const [h, p, Vis] = SLIDES[i];
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top + 12, paddingBottom: ins.bottom + 20, paddingHorizontal: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Wordmark /><LinkText title="Overslaan" onPress={() => setI(4)} /></View>
        <View style={{ flex: 1, borderRadius: 28, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Vis /></View>
        {dots}
        <View style={{ gap: 8 }}><T v="h1">{h}</T><T v="body" c={c.muted}>{p}</T></View>
        <Btn title="Volgende" onPress={() => setI(i + 1)} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top + 12, paddingBottom: ins.bottom + 20, paddingHorizontal: 20, gap: 20 }}>
      <Wordmark />
      <View style={{ gap: 8 }}><T v="h1">Twee vragen vooraf</T><T v="body" c={c.muted}>Allebei optioneel. Je kunt dit later wijzigen bij Profiel.</T></View>
      <Box style={{ paddingVertical: 2 }}>
        <SwitchRow title="Meldingen" sub="Zodat je hoort wanneer een ronde start of er een match is." on={S.user.notif} onPress={() => mutate(s => { s.user.notif = !s.user.notif; })} />
        <SwitchRow last title="Locatie" sub="Voor afstanden en reistijden. Zonder toestemming vul je zelf een plaats in." on={S.user.loc} onPress={() => mutate(s => { s.user.loc = !s.user.loc; })} />
      </Box>
      <View style={{ flex: 1 }} />
      {dots}
      <Btn title="Aan de slag" onPress={done} />
    </View>
  );
}
