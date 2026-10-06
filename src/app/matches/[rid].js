import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { opt } from '../../lib/data';
import { useStore, toast, errText, api, rnd, grp, actives, euro, priceOf } from '../../lib/store';
import { useC, T, Screen, Header, Box, Item, Thumb, Icon, Btn, Section } from '../../components/ui';

export default function Matches() {
  const { rid } = useLocalSearchParams();
  const S = useStore(), c = useC();
  const r = rnd(rid); if (!r) return null;
  const ms = S.matches.filter(m => m.rid === rid), fin = ms.find(m => m.final), a = actives(r);
  return (
    <Screen header={<Header title="Onze matches" />}>
      <View><T v="eyebrow">{grp(r.gid).name}</T><T v="h1" style={{ fontSize: 21, marginTop: 4 }}>{r.title}</T></View>
      {fin && <Box style={{ borderColor: c.yes }}><T v="eyebrow" c={c.yes}>Definitieve keuze</T><T v="h2" style={{ fontSize: 17, marginTop: 4 }}>{opt(fin.oid).t}</T></Box>}
      {ms.length ? ms.map(m => { const o = opt(m.oid), y = m.yes; return (
        <Item key={m.id} onPress={() => router.push(`/match/${m.id}`)}>
          <Thumb o={o} />
          <View style={{ flex: 1 }}><T v="b" numberOfLines={1}>{o.t}</T><T v="small">{y} van {m.act || a.length} ja · {priceOf(o)}{m.final ? ' · gekozen' : ''}</T></View>
          <Icon n="chevron-right" s={18} c={c.muted} />
        </Item>); }) : (
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
          <T v="small" style={{ textAlign: 'center', fontSize: 14 }}>Nog geen matches.{r.status === 'active' ? ' Ze verschijnen zodra genoeg mensen ja zeggen.' : ''}</T>
          {r.status === 'active' && <Btn title="Verder swipen" onPress={() => router.push(`/swipe/${rid}`)} />}
        </View>
      )}
      {ms.length > 1 && !fin && (
        <Box style={{ gap: 10 }}>
          <T v="h3">Meerdere matches</T>
          <T v="small">Kies samen met een korte tweede stemronde, of laat de app beslissen.</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn flex icon="award" title="Finaleronde" onPress={() => router.push(`/final/${rid}`)} />
            <Btn flex kind="ghost" icon="shuffle" title="App kiest" onPress={() => { const m = ms[Math.floor(Math.random() * ms.length)]; api.finalize(m.id).then(() => router.push(`/match/${m.id}`), e => toast(errText(e))); }} />
          </View>
        </Box>
      )}
    </Screen>
  );
}
