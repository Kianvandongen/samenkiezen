import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { opt } from '../../lib/data';
import { useStore, toast, errText, api, rnd, grp, actives, matchText, euro, dateNice, parseT, pad, priceOf } from '../../lib/store';
import { useC, F, T, IBtn, Poster, Avs, DL, Btn, Icon, Tag } from '../../components/ui';
import Confetti from '../../components/Confetti';
import { tmdbUrl } from '../../lib/catalog';

function gcal(o, r) {
  const d = r.date.replace(/-/g, ''), s = parseT(r.start); let e = parseT(r.end); if (e <= s) e += 24; e = Math.min(s + (o.dur || 120) / 60, e);
  const f = h => `${pad(Math.floor(h) % 24)}${pad(Math.round((h % 1) * 60))}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(o.t)}&dates=${d}T${f(s)}/${d}T${f(e)}&ctz=Europe/Amsterdam&location=${encodeURIComponent(o.t + ', ' + (o.addr || o.city || r.loc))}&details=${encodeURIComponent('Gekozen met SamenKiezen: ' + r.title)}`;
}

export default function Match() {
  const { mid } = useLocalSearchParams();
  const S = useStore(), c = useC(), ins = useSafeAreaInsets();
  const m = S.matches.find(x => x.id === mid); if (!m || !rnd(m.rid)) return null;
  const o = opt(m.oid), r = rnd(m.rid), g = grp(r.gid);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${matchText(m)} 📅 ${dateNice(r.date)} ${r.start} · ${o.tmdb ? '📺 ' + o.plat : '📍 ' + o.t + ', ' + r.loc + ' · ' + priceOf(o) + (o.p ? ' p.p.' : '')}`)}`;
  const Act = ({ n, l, url }) => <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}><Icon n={n} s={22} /><Text style={{ fontFamily: F.semi, fontSize: 12, color: c.ink }}>{l}</Text></Pressable>;
  const close = () => router.canGoBack() ? router.back() : router.replace('/home');
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <LinearGradient colors={[c.purpleSoft, c.bg]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }} />
      <ScrollView contentContainerStyle={{ paddingTop: ins.top + 10, paddingBottom: ins.bottom + 28, paddingHorizontal: 16, alignItems: 'center', gap: 16 }}>
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><IBtn n="chevron-left" label="Terug" onPress={close} />{m.final && <Tag label="Definitief gekozen" tone="yes" />}</View>
        <Text style={{ fontFamily: F.displayBold, fontSize: 44, color: c.purpleInk }}>{m.type === 'deadline' ? 'Winnaar!' : m.type === 'willekeurig' ? 'Gekozen!' : 'Match!'}</Text>
        <Poster o={o} style={{ width: 140, height: 140, borderRadius: 36 }} fontSize={70} />
        <View style={{ gap: 6, maxWidth: 320, alignItems: 'center' }}><T v="h2" style={{ textAlign: 'center', fontSize: 21, lineHeight: 26 }}>{o.t}</T><T v="small" style={{ textAlign: 'center', fontSize: 14 }}>{matchText(m)}</T></View>
        <Avs ids={actives(r).map(x => x.id)} s={34} />
        <View style={{ alignSelf: 'stretch' }}><DL rows={[['Wanneer', `${dateNice(r.date)}, ${r.start}`], ['Waar', o.tmdb ? o.plat : o.osm ? (o.addr || o.city || r.loc) : o.km ? `${r.loc} · ${o.km} km` : 'Thuis'], ['Prijs', o.tmdb ? 'Inbegrepen bij abonnement' : priceOf(o) + (o.p ? ' p.p.' : '')], ['Groep', g.name]]} /></View>
        <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
          {o.tmdb ? <Act n="play-circle" l="Trailer" url={`https://www.youtube.com/results?search_query=${encodeURIComponent(o.t + ' ' + (o.year || '') + ' trailer')}`} /> : <Act n="map-pin" l="Route" url={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.t + ', ' + (o.addr || o.city || r.loc))}`} />}
          <Act n="calendar" l="Agenda" url={gcal(o, r)} />
          <Act n="share-2" l="WhatsApp" url={wa} />
          {o.tmdb ? <Act n="tv" l="Kijken" url={tmdbUrl(o)} /> : <Act n="credit-card" l={o.b ? 'Reserveren' : 'Info'} url={`https://www.google.com/search?q=${encodeURIComponent(o.t + ' reserveren')}`} />}
        </View>
        {!m.final && <Btn kind="purple" icon="check" title="Definitief kiezen" style={{ alignSelf: 'stretch' }} onPress={() => api.finalize(m.id).then(() => toast('Definitief gekozen. De groep ziet het meteen.'), e => toast(errText(e)))} />}
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Btn flex kind="ghost" title="Alternatieven" onPress={() => router.push(`/matches/${r.id}`)} />
          {r.status === 'active' ? <Btn flex kind="ghost" title="Verder swipen" onPress={close} /> : <Btn flex kind="ghost" title="Naar home" onPress={() => router.replace('/home')} />}
        </View>
        <Btn sm kind="ghost" title="Alle details" onPress={() => router.push({ pathname: '/detail/[oid]', params: { oid: o.id, rid: r.id } })} />
      </ScrollView>
      <Confetti key={mid} />
    </View>
  );
}
