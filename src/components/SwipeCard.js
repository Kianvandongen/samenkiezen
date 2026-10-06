import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, Dimensions, Pressable } from 'react-native';
import { CATS, LVLS, MOODS, INTS, GENRES } from '../lib/data';
import { euro, durStr, fmtH, kind, travel, ioStr } from '../lib/store';
import { useC, F, T, Tag, Poster, Icon } from './ui';

const W = Dimensions.get('window').width;
const TH = 100;

export function cardStats(o, r) {
  const k = kind(o);
  if (o.tmdb) return [['Genre', o.genres.slice(0, 2).map(g => GENRES[g]).join(', ') || '–'], ['Jaar', o.year || '–'], ['Score', o.score10 ? `${o.score10.toFixed(1)}/10` : '–'], ['Kijken op', o.plat], ['Type', o.tmdb.kind === 'movie' ? 'Film' : 'Serie'], ['Kosten', 'Inbegrepen']];
  if (k === 'film') return [['Genre', GENRES[o.genre]], ['Duur', o.eps || durStr(o.dur)], ['Leeftijd', o.cert], ['Kijken', o.plat || (o.times || []).join(' · ')], ['Prijs', euro(o.p)], ['Taal', (o.lang || '').split(',')[0]]];
  if (k === 'thuis') return [['Kosten', euro(o.p) + (o.p ? ' p.p.' : '')], ['Tijd', durStr(o.dur)], ['Personen', `${o.g[0]}–${o.g[1]}`], ['Niveau', o.diff], ['Nodig', o.need?.[0]], ['Sfeer', MOODS[o.m[0]]]];
  if (k === 'dagje') return [['Kosten', euro(o.p) + ' p.p.'], ['Reistijd', travel(o, r)], ['Duur', durStr(o.dur)], ['Overnachten', o.over ? 'Ja' : 'Nee'], ['Weer', o.wx ? 'Afhankelijk' : 'Maakt niet uit'], ['Reserveren', o.b ? 'Ja' : 'Nee']];
  return [['Prijs', euro(o.p) + (o.p ? ' p.p.' : '')], ['Afstand', o.km + ' km'], ['Reistijd', travel(o, r)], ['Duur', durStr(o.dur)], ['Open', o.h[1] >= 48 ? 'Altijd' : `${fmtH(o.h[0])}–${fmtH(o.h[1])}`], ['Reserveren', o.b ? 'Nodig' : 'Niet nodig']];
}

export function CardFace({ o, r }) {
  const c = useC();
  return (
    <View style={{ flex: 1 }}>
      <Poster o={o} contain style={{ flex: o.poster ? 1.25 : 0.82 }} fontSize={78}>
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(10,12,35,.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}><Text style={{ color: '#fff', fontFamily: F.semi, fontSize: 12 }}>{o.tmdb ? o.plat : CATS[o.c[0]]}</Text></View>
        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,.92)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', gap: 4, alignItems: 'center' }}><Icon n="star" s={12} c="#11163a" /><Text style={{ color: '#11163a', fontFamily: F.bold, fontSize: 12.5 }}>{o.tmdb ? o.score10.toFixed(1) : o.r.toFixed(1)}</Text></View>
      </Poster>
      <View style={{ flex: 1, padding: 16, paddingBottom: 12, gap: 8 }}>
        <T v="h2" numberOfLines={2}>{o.t}</T>
        <T v="small" numberOfLines={2} style={{ fontSize: 14, lineHeight: 19 }}>{o.desc}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxHeight: 60, overflow: 'hidden' }}>
          {o.tmdb ? o.genres.slice(0, 3).map(g => <Tag key={g} label={GENRES[g]} tone="p" />) : <><Tag label={LVLS[o.l]} tone={o.l} />
          <Tag label={ioStr(o)} /></>}
          {!o.tmdb && o.m.filter(m => !['binnen', 'buiten'].includes(m)).slice(0, 2).map(m => <Tag key={m} label={MOODS[m]} tone="p" />)}
          {!o.tmdb && <Tag label={INTS[o.i[0]]} />}
          {!o.tmdb && <Tag label={`${o.g[0]}–${o.g[1]} pers.`} />}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 'auto', rowGap: 8 }}>
          {cardStats(o, r).map(([a, b]) => (
            <View key={a} style={{ width: '33.33%', paddingRight: 8 }}>
              <Text style={{ fontSize: 10.5, fontFamily: F.semi, color: c.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>{a}</Text>
              <Text style={{ fontSize: 13.5, fontFamily: F.semi, color: c.ink }} numberOfLines={1}>{b ?? '–'}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const Stamp = ({ label, color, style, opacity }) => (
  <Animated.View pointerEvents="none" style={[{ position: 'absolute', zIndex: 3, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 4, borderColor: color, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.85)', opacity }, style]}>
    <Text style={{ color, fontFamily: F.displayBold, fontSize: 26 }}>{label}</Text>
  </Animated.View>
);

export const SwipeCard = forwardRef(function SwipeCard({ o, r, onVote, onTap }, ref) {
  const c = useC();
  const pos = useRef(new Animated.ValueXY()).current;
  const busy = useRef(false);
  useEffect(() => { pos.setValue({ x: 0, y: 0 }); busy.current = false; }, [o.id]);

  const fly = v => {
    if (busy.current) return; busy.current = true;
    const to = v === 'y' ? { x: W * 1.5, y: -20 } : v === 'n' ? { x: -W * 1.5, y: -20 } : { x: 0, y: -900 };
    Animated.timing(pos, { toValue: to, duration: 240, useNativeDriver: true }).start(() => onVote(v));
  };
  useImperativeHandle(ref, () => ({ fly }));

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > TH) fly('y');
      else if (g.dx < -TH) fly('n');
      else if (g.dy < -TH && -g.dy > Math.abs(g.dx)) fly('l');
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
  })).current;

  const rotate = pos.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-18deg', '0deg', '18deg'] });
  const yesO = pos.x.interpolate({ inputRange: [0, TH], outputRange: [0, 1], extrapolate: 'clamp' });
  const noO = pos.x.interpolate({ inputRange: [-TH, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const laterO = pos.y.interpolate({ inputRange: [-TH, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View {...pan.panHandlers} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, overflow: 'hidden', shadowColor: '#16205c', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6, transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }}>
      <Pressable style={{ flex: 1 }} onPress={onTap} accessibilityHint="Tik voor meer informatie, swipe om te stemmen">
        <CardFace o={o} r={r} />
      </Pressable>
      <Stamp label="JA" color="#0fa871" opacity={yesO} style={{ top: 26, left: 22, transform: [{ rotate: '-14deg' }] }} />
      <Stamp label="NEE" color="#e63a56" opacity={noO} style={{ top: 26, right: 22, transform: [{ rotate: '14deg' }] }} />
      <Stamp label="LATER" color="#d98500" opacity={laterO} style={{ top: '38%', alignSelf: 'center' }} />
    </Animated.View>
  );
});
