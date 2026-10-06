import React, { useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CATS, LVLS, MOODS, INTS, CUIS, GENRES, DIETS, opt } from '../../lib/data';
import { tmdbUrl } from '../../lib/catalog';
import { useStore, rnd, kind, travel, euro, durStr, openStr, ioStr, dateNice, whyRanked, kmStr } from '../../lib/store';
import { useC, F, T, Screen, Header, Poster, Tag, DL, Btn, Box, Section, Icon, Sheet } from '../../components/ui';

export default function Detail() {
  const { oid, rid } = useLocalSearchParams();
  useStore(); const c = useC();
  const [menu, setMenu] = useState(false);
  const o = opt(oid), r = rid ? rnd(rid) : null, k = kind(o);
  const q = o.osm ? encodeURIComponent(`${o.t}, ${o.addr || o.city || `${o.lat},${o.lon}`}`) : encodeURIComponent(o.t + ' ' + (r?.loc || 'Venlo'));
  const rows = []; const add = (a, b) => { if (b !== undefined && b !== '' && b !== null) rows.push([a, b]); };
  if (o.osm) { add('Soort', o.kindL); if (o.cuisL) add('Keuken', o.cuisL); add('Adres', o.addr || o.city); add('Afstand', kmStr(o, r)); add(o.del ? 'Bezorgen' : 'Reistijd', travel(o, r)); add('Openingstijden', o.hours || 'Onbekend, check de website'); if (o.di.length) add('Dieetopties', o.di.map(d => DIETS[d]).join(', ')); add('Telefoon', o.phone); add('Website', o.web); if (r) add('Tijdslot', `${dateNice(r.date)} vanaf ${r.start}`); if (o.w) add('Rolstoeltoegankelijk', 'Ja'); }
  else if (o.tmdb) { add('Type', o.tmdb.kind === 'movie' ? 'Film' : 'Serie'); add('Genre', o.genres.map(g => GENRES[g]).join(', ')); add('Jaar', o.year); add('Score (TMDB)', o.score10 ? `${o.score10.toFixed(1)} / 10 · ${o.votesCount} stemmen` : ''); add('Kijken op', o.plat); add('Kosten', 'Inbegrepen bij je abonnement'); }
  else if (k === 'film') { add('Genre', GENRES[o.genre]); add('Jaar', o.year); add('Duur', o.eps ? `${o.eps} · ${o.dur} min` : durStr(o.dur)); add('Leeftijd', o.cert); add('Beoordeling', o.r.toFixed(1) + ' / 5'); add('Streamingdienst', o.plat); add('Bioscooptijden', o.times?.join(' · ')); add('Taal', o.lang); add('Prijs', euro(o.p)); }
  else if (k === 'thuis') { add('Sfeer', o.m.map(m => MOODS[m]).join(', ')); add('Benodigde tijd', durStr(o.dur)); add('Geschatte kosten', euro(o.p) + (o.p ? ' p.p.' : '')); add('Benodigdheden', o.need?.join(', ')); add('Aantal personen', `${o.g[0]}–${o.g[1]}`); add('Moeilijkheid', o.diff); add('Activiteitsniveau', LVLS[o.l]); }
  else if (k === 'dagje') { add('Reistijd', travel(o, r)); add('Afstand', kmStr(o, r)); add('Geschatte kosten', euro(o.p) + ' p.p.'); add('Op locatie', o.acts?.join(', ')); add('Groepsgrootte', `${o.g[0]}–${o.g[1]}`); add('Weersafhankelijk', o.wx ? 'Ja' : 'Nee'); add('Overnachting', o.over ? 'Ja' : 'Nee'); add('Reserveren', o.b ? 'Nodig' : 'Niet nodig'); }
  else {
    if (o.cu) add('Keuken', CUIS[o.cu]); if (o.menu) add('Voorbeeldgerechten', o.menu.join(', '));
    add(o.food ? 'Prijsklasse' : 'Prijs', o.food ? `${'€'.repeat(o.p < 20 ? 1 : o.p < 35 ? 2 : 3)} · ${euro(o.p)} p.p.` : euro(o.p) + (o.p ? ' p.p.' : ''));
    add('Beoordeling', o.r.toFixed(1) + ' / 5'); add('Afstand', kmStr(o, r)); add(o.del ? 'Bezorg-/reistijd' : 'Reistijd', travel(o, r)); add('Duur', durStr(o.dur)); add('Openingstijden', openStr(o));
    if (r) add('Tijdslot', `${dateNice(r.date)} vanaf ${r.start}`);
    add('Binnen/buiten', ioStr(o)); add('Activiteitsniveau', LVLS[o.l]); add('Groepsgrootte', `${o.g[0]}–${o.g[1]} personen`);
    if (o.di.length) add('Dieetopties', o.di.map(d => DIETS[d]).join(', '));
    add('Reserveren', o.b ? 'Nodig' : 'Niet nodig'); add('Rolstoeltoegankelijk', o.w ? 'Ja' : 'Nee'); if (o.dress) add('Kleding of voorbereiding', o.dress); if (o.age) add('Minimumleeftijd', o.age + ' jaar');
  }
  const btns = o.tmdb ? [[`https://www.youtube.com/results?search_query=${encodeURIComponent(o.t + ' ' + (o.year || '') + ' trailer')}`, 'Bekijk trailer'], [tmdbUrl(o), 'Waar te kijken']] : k === 'film' ? [[`https://www.youtube.com/results?search_query=${encodeURIComponent(o.t + ' trailer')}`, 'Bekijk trailer'], [`https://www.google.com/search?q=${encodeURIComponent(o.t + ' kijken')}`, 'Waar te kijken']]
    : o.osm ? [[`https://www.google.com/maps/search/?api=1&query=${q}`, 'Route en foto\'s'], [o.web || `https://www.google.com/search?q=${q}`, o.web ? 'Website' : 'Zoek online']]
    : k === 'thuis' ? [] : [[`https://www.google.com/maps/search/?api=1&query=${q}`, k === 'food' ? 'Route' : 'Bekijk locatie'], [`https://www.google.com/search?q=${q}+reserveren`, o.del && o.c[0] === 'bestellen' ? 'Bestellen' : 'Reserveren']];
  const why = r ? whyRanked(o) : [];
  return (
    <Screen header={<Header title={o.t} />}>
      <Poster o={o} contain style={{ height: o.poster ? 320 : 210, borderRadius: 24 }} fontSize={90}>
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(10,12,35,.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}><Text style={{ color: '#fff', fontFamily: F.semi, fontSize: 12 }}>{o.tmdb ? o.plat : o.osm ? o.kindL : CATS[o.c[0]]}</Text></View>
      </Poster>
      <View style={{ gap: 8 }}>
        <T v="h1" style={{ fontSize: 22, lineHeight: 28 }}>{o.t}</T>
        <T v="body">{o.desc}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{o.tmdb ? o.genres.map(g => <Tag key={g} label={GENRES[g]} tone="p" />) : <><Tag label={LVLS[o.l]} tone={o.l} /><Tag label={ioStr(o)} />{o.m.map(m => <Tag key={m} label={MOODS[m]} tone="p" />)}{o.i.map(i => <Tag key={i} label={INTS[i]} />)}</>}</View>
      </View>
      {btns.length > 0 && <View style={{ flexDirection: 'row', gap: 10 }}>{btns.map(([h, l], i) => <Btn key={l} sm flex kind={i ? 'primary' : 'ghost'} title={l} onPress={() => Linking.openURL(h)} />)}</View>}
      {o.menu && <Btn sm kind="ghost" title="Bekijk menu" onPress={() => setMenu(true)} />}
      <DL rows={rows} />
      {o.osm ? <T v="small">Plekgegevens: © OpenStreetMap-bijdragers. Prijzen en foto's vind je via Route en foto's.</T> : o.tmdb ? <T v="small">Film- en seriegegevens: TMDB. Beschikbaarheid: JustWatch. Deze app gebruikt de TMDB API, maar is niet goedgekeurd of gecertificeerd door TMDB.</T> : <Section title="Foto's">
        <View style={{ flexDirection: 'row', gap: 8 }}>{[0, 1, 2].map(i => <Poster key={i} o={o} style={{ flex: 1, aspectRatio: 1, borderRadius: 14, opacity: 1 - i * 0.12 }} fontSize={30} />)}</View>
        <T v="small">Voorbeeldbeelden. Echte foto's komen later via Google Places.</T>
      </Section>}
      {r && <Box><T v="b" style={{ fontSize: 14 }}>Waarom zie je deze kaart?</T><T v="body" style={{ fontSize: 14 }}>Past binnen alle filters van de ronde.{why.length ? ` Staat hoger voor jou door: ${why.join(', ')}.` : ''}</T></Box>}
      {r && r.status === 'active' && <Btn title="Terug naar swipen" onPress={() => router.back()} />}
      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <T v="h2" style={{ fontSize: 18 }}>Menu · {o.t}</T>
        {o.menu && <DL rows={o.menu.map((x, i) => [x, euro(Math.round(o.p * (0.45 + i * 0.12)))])} />}
        <T v="small">Voorbeeldmenu. Live menu's volgen via restaurantkoppelingen.</T>
      </Sheet>
    </Screen>
  );
}
