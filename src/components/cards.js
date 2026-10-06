import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { opt } from '../lib/data';
import { grp, rnd, remaining, actives, dateNice, S } from '../lib/store';
import { useC, F, T, Icon, Thumb, Avs, Bar, Poster } from './ui';

export function RoundCard({ r }) {
  const c = useC(), g = grp(r.gid), rem = remaining(r).length, tot = r.deck.length, mm = S.matches.filter(m => m.rid === r.id).length;
  return (
    <Pressable onPress={() => router.push(r.status === 'active' ? `/swipe/${r.id}` : `/matches/${r.id}`)} style={({ pressed }) => ({ padding: 12, gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Thumb emoji={g.e} bg={g.col + '22'} />
        <View style={{ flex: 1 }}><T v="small">{g.name} · {dateNice(r.date)}</T><T v="b" numberOfLines={1}>{r.title}</T></View>
        <Icon n="chevron-right" s={18} c={c.muted} />
      </View>
      <Bar pct={tot ? (tot - rem) / tot * 100 : 100} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontFamily: F.body, color: c.ink, flex: 1 }}>
          {r.status === 'active' ? (rem ? <Text style={{ fontFamily: F.semi }}>Nog {rem} kaarten voor jou</Text> : <Text style={{ fontFamily: F.semi }}>Klaar met swipen</Text>) : 'Afgerond'}
          {mm ? <Text style={{ color: c.yes, fontFamily: F.semi }}>{` · ${mm} match${mm > 1 ? 'es' : ''}`}</Text> : null}
        </Text>
        <Avs ids={actives(r).map(m => m.id)} />
      </View>
    </Pressable>
  );
}

export function MatchMini({ m }) {
  const c = useC(), o = opt(m.oid), r = rnd(m.rid);
  return (
    <Pressable onPress={() => router.push(`/match/${m.id}`)} style={{ width: 150, borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
      <Poster o={o} style={{ height: 88 }} fontSize={38} />
      <View style={{ padding: 10 }}><T v="b" style={{ fontSize: 13.5, lineHeight: 17 }} numberOfLines={2}>{o.t}</T><T v="small" numberOfLines={1}>{grp(r.gid)?.name}{m.final ? ' · gekozen' : ''}</T></View>
    </Pressable>
  );
}

export function OptMini({ o, sub }) {
  const c = useC();
  return (
    <View style={{ width: 150, borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
      <Poster o={o} style={{ height: 80 }} fontSize={34} />
      <View style={{ padding: 10 }}><T v="b" style={{ fontSize: 13.5, lineHeight: 17 }} numberOfLines={2}>{o.t}</T><T v="small">{sub}</T></View>
    </View>
  );
}
