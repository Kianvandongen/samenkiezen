import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CATS, LVLS, MOODS, INTS, opt } from '../../lib/data';
import { roundChips } from '../../lib/store';
import { useStore, mutate, toast, onEvent, rnd, actives, remaining, castVote, unvote, doneCount, nameOf, isAdmin, grp, S as St } from '../../lib/store';
import { useC, F, T, Header, IBtn, Avs, Bar, Tag, Icon, Btn, Thumb, LinkText } from '../../components/ui';
import { SwipeCard, CardFace } from '../../components/SwipeCard';

const UNDO = {};

export default function Swipe() {
  const { rid } = useLocalSearchParams();
  const S = useStore(), c = useC(), ins = useSafeAreaInsets();
  const card = useRef(null);
  useEffect(() => onEvent(e => { if (e.type === 'match' && e.match.rid === rid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); setTimeout(() => router.push(`/match/${e.match.id}`), 300); } }), [rid]);
  const r = rnd(rid);
  if (!r) return <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top }}><Header title="Ronde" /><T v="small" style={{ padding: 16 }}>Deze ronde bestaat niet meer.</T></View>;
  const rem = remaining(r), tot = r.deck.length, seen = tot - rem.length;
  const undo = UNDO[rid] || (UNDO[rid] = []);

  const apply = v => {
    const oid = remaining(r)[0]; if (!oid) return;
    Haptics.selectionAsync().catch(() => {});
    mutate(() => castVote(r, 'me', oid, v));
    if (v === 'l') toast('Opgeslagen voor later');
    undo.push({ oid, v }); if (undo.length > 3) undo.shift();
  };
  const doUndo = () => {
    const u = undo.pop(); if (!u) return;
    mutate(() => unvote(r, u.oid));
    toast('Keuze teruggedraaid');
  };
  const chips = roundChips(r);
  const ms = St.matches.filter(m => m.rid === rid);

  const head = (
    <>
      <Header title={r.title} right={<View style={{ flexDirection: 'row', gap: 8 }}><IBtn n="sliders" label="Keuzes aanpassen" onPress={() => r.v !== 2 ? toast('Deze oudere ronde kan niet worden aangepast. Start een nieuwe ronde.') : (isAdmin(grp(r.gid)) || r.by === 'me') ? router.push({ pathname: '/wizard', params: { rid } }) : toast('Alleen de maker van de ronde of een beheerder kan de keuzes aanpassen. Vraag het in de chat.')} /><IBtn n="info" label="Ronde-informatie" onPress={() => router.push(`/roundinfo/${rid}`)} /><IBtn n="message-circle" label="Chat" onPress={() => router.push({ pathname: '/chat', params: { gid: r.gid, rid } })} /></View>} />
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avs ids={actives(r).map(m => m.id)} s={22} />
          <T v="small">{actives(r).length} deelnemers</T>
          <Text style={{ marginLeft: 'auto', fontFamily: F.body, fontSize: 13, color: c.muted, fontVariant: ['tabular-nums'] }}><Text style={{ color: c.ink, fontFamily: F.bold }}>{seen}</Text> van {tot} bekeken</Text>
        </View>
        <Bar pct={tot ? seen / tot * 100 : 0} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{chips.map((x, i) => <Tag key={i} label={x} />)}</ScrollView>
      </View>
    </>
  );

  if (r.status !== 'active' || !rem.length) {
    const waiting = actives(r).filter(m => m.id !== 'me' && doneCount(r, m.id) < tot);
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top }}>{head}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Thumb bg={c.yesSoft} size={72}><Icon n="check" s={36} c={c.yes} /></Thumb>
          <T v="h2" style={{ textAlign: 'center' }}>{r.status !== 'active' ? 'Deze ronde is afgerond' : 'Je hebt alles gezien'}</T>
          {r.status === 'active' && <T v="small" style={{ textAlign: 'center', maxWidth: 280, fontSize: 14 }}>{waiting.length ? `Wachten op ${waiting.map(m => nameOf(m.id)).join(', ')}. Matches verschijnen zodra zij stemmen.` : 'Iedereen heeft gestemd.'}</T>}
          {r.status === 'active' && r.saved.length > 0 && <Btn kind="ghost" title={`${r.saved.length} opgeslagen opties beoordelen`} onPress={() => router.push('/saved')} />}
          <Btn title={`Onze matches (${ms.length})`} onPress={() => router.push(`/matches/${rid}`)} />
          {r.status === 'active' && undo.length > 0 && <LinkText title="Laatste keuze terugdraaien" onPress={doUndo} />}
        </View>
      </View>
    );
  }
  const o = opt(rem[0]), o2 = rem[1] ? opt(rem[1]) : null;
  const VB = ({ n, onPress, label, size = 58, bg, col, disabled }) => (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg || c.surface, borderWidth: 1, borderColor: bg || c.line, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.92 : 1 }], shadowColor: '#16205c', shadowOpacity: size > 50 ? 0.18 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: size > 50 ? 4 : 0 })}>
      <Icon n={n} s={size * 0.42} c={col} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top }}>
      {head}
      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 12 }}>
        {o2 && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, overflow: 'hidden', opacity: 0.7, transform: [{ scale: 0.94 }, { translateY: 14 }] }}><CardFace o={o2} r={r} /></View>}
        <SwipeCard key={o.id} ref={card} o={o} r={r} onVote={apply} onTap={() => router.push({ pathname: '/detail/[oid]', params: { oid: o.id, rid } })} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 14, paddingBottom: 14 + ins.bottom }}>
        <VB n="rotate-ccw" size={44} label="Vorige keuze terugdraaien" col={c.muted} disabled={!undo.length} onPress={doUndo} />
        <VB n="x" size={70} label="Nee" col={c.no} onPress={() => card.current?.fly('n')} />
        <VB n="bookmark" label="Later" col={c.later} onPress={() => card.current?.fly('l')} />
        <VB n="heart" size={70} label="Ja" bg={c.yes} col="#fff" onPress={() => card.current?.fly('y')} />
        <VB n="info" size={44} label="Meer informatie" col={c.muted} onPress={() => router.push({ pathname: '/detail/[oid]', params: { oid: o.id, rid } })} />
      </View>
    </View>
  );
}
