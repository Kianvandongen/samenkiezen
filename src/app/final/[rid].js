import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { opt } from '../../lib/data';
import { useStore, toast, errText, api, rnd, actives, nameOf, euro, priceOf } from '../../lib/store';
import { useC, T, Screen, Header, Item, Thumb, Icon, Box, Bar, Btn } from '../../components/ui';

export default function Final() {
  const { rid } = useLocalSearchParams();
  const S = useStore(), c = useC();
  const r = rnd(rid); if (!r) return null;
  const ms = S.matches.filter(m => m.rid === rid), F = r.finale || {}, fin = ms.find(m => m.final);
  const act = actives(r), waiting = act.filter(m => !F[m.id]);
  const tally = {}; Object.values(F).forEach(o => (tally[o] = (tally[o] || 0) + 1)); const total = Math.max(1, Object.keys(F).length);
  const pick = oid => { if (F.me) return; api.finalVote(rid, oid).catch(e => toast(errText(e))); };
  return (
    <Screen header={<Header title="Finaleronde" />}>
      <T v="small" style={{ fontSize: 14 }}>Iedereen kiest één favoriet uit jullie matches. Als iedereen gestemd heeft, wordt de optie met de meeste stemmen definitief.</T>
      {ms.map(m => { const o = opt(m.oid), on = F.me === o.id; return (
        <Item key={m.id} onPress={F.me ? undefined : () => pick(o.id)} style={on && { borderColor: c.purple, backgroundColor: c.purpleSoft }}>
          <Thumb o={o} />
          <View style={{ flex: 1 }}><T v="b" numberOfLines={1}>{o.t}</T><T v="small">{priceOf(o)}{o.km ? ` · ${String(o.km).replace('.', ',')} km` : ''}</T></View>
          {on && <Icon n="check" s={22} c={c.purpleInk} />}
        </Item>); })}
      {!!F.me && <Box style={{ gap: 10 }}>
        <T v="h3">Tussenstand</T>
        {ms.map(m => <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><T v="small" style={{ width: 130, color: c.ink }} numberOfLines={1}>{opt(m.oid).t}</T><View style={{ flex: 1 }}><Bar h={8} pct={(tally[m.oid] || 0) / total * 100} color={c.yes} /></View><T v="b" style={{ fontSize: 13 }}>{tally[m.oid] || 0}</T></View>)}
        <T v="small">{fin ? 'Iedereen heeft gestemd.' : `Wachten op ${waiting.map(m => nameOf(m.id)).join(', ')}.`}</T>
      </Box>}
      {fin && <Btn kind="purple" title={`Bekijk de winnaar: ${opt(fin.oid).t}`} onPress={() => router.replace(`/match/${fin.id}`)} />}
    </Screen>
  );
}
