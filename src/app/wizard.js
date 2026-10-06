import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LVLS, LVLEX, MOODS, INTS, TRANS, DIETS, RULES, STREAMS, GENRES, CUIS } from '../lib/data';
import { countTitles, deckTitles, titleKinds } from '../lib/catalog';
import { useStore, toast, errText, api, newDraft, draftFromRound, rnd, eligibleList, buildDeck, mergeDeck, grp, nameOf, ymd, dateNice, euro, pad, DAYN, MON, MAIN, DAYPARTS, sectionsOf, needsPlace, needsBudget, priceOf, rankScore, kmStr } from '../lib/store';
import { useC, F, T, Field, Input, Chip, toggleIn, Box, Warn, Btn, Confirm, Section, Header } from '../components/ui';
import { OptMini } from '../components/cards';
import { LocationField } from '../components/LocationField';
import { fetchPlaces, savePlaces } from '../lib/places';

const ALL = '__alle__';
const SECTION_TITLE = { kijken: 'Film of serie', activiteit: 'Activiteit', eten: 'Eten en drinken', sfeer: 'Sfeer' };
const ACT_INTS = ['sport', 'games', 'natuur', 'creatief', 'cultuur', 'motor', 'muziek', 'dieren', 'tech', 'familie'];
const SFEER = ['gezellig', 'ontspannen', 'romantisch', 'feestelijk', 'avontuurlijk', 'cultureel', 'luxe', 'laagdrempelig', 'muziek', 'buiten', 'binnen'];

// Meerkeuze-chips met een expliciete "maakt niet uit"-optie (er wordt niets vooraf ingevuld)
function Multi({ dict, keys, sel, all, onToggle, onAll, allLabel = 'Maakt niet uit' }) {
  const ks = keys || Object.keys(dict);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {onAll && <Chip label={allLabel} on={all} onPress={onAll} />}
      {ks.map(k => <Chip key={k} label={dict[k]} on={!all && sel.includes(k)} onPress={() => onToggle(k)} />)}
    </View>
  );
}
function Single({ opts, val, onPick }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{opts.map(([v, l]) => <Chip key={String(v)} label={l} on={val === v} onPress={() => onPick(v)} />)}</View>;
}
const Q = ({ label, hint, done, children }) => {
  const c = useC();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <T v="b" style={{ flex: 1 }}>{label}</T>
        {!done && <Text style={{ fontSize: 11, fontFamily: F.semi, color: c.later }}>Nog kiezen</Text>}
      </View>
      {hint && <T v="small">{hint}</T>}
      {children}
    </View>
  );
};

export default function Wizard() {
  const { gid: gid0, rid: editId } = useLocalSearchParams();
  const editing = editId ? rnd(editId) : null;
  const gid = editing ? editing.gid : gid0;
  useStore(); const c = useC(), ins = useSafeAreaInsets();
  const dRef = useRef(null);
  if (!dRef.current) dRef.current = editing ? draftFromRound(editing) : newDraft(gid);
  const d = dRef.current, g = grp(gid);
  const [step, setStep] = useState(0);
  const [, force] = useState(0);
  const [tc, setTc] = useState(null);
  const [preview, setPreview] = useState([]);
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState([]);
  const [pState, setPState] = useState('');
  const [cf, setCf] = useState(null);
  const scroll = useRef(null);
  const up = fn => { fn(d); force(x => x + 1); };

  const sections = sectionsOf(d.main);
  const steps = ['wat', ...sections, 'praktisch', 'beslissen', 'samenvatting'];
  const cur = steps[Math.min(step, steps.length - 1)];
  const films = titleKinds(d).length > 0;
  const L = d.main.length ? eligibleList(d, places) : [];
  const n = L.length + (tc || 0);
  const fkey = JSON.stringify([d.main, d.film]);
  useEffect(() => {
    let on = true; setTc(null);
    if (!films) { setTc(0); return; }
    const t = setTimeout(() => { countTitles(d).then(x => { if (on) setTc(x); }); }, 250);
    return () => { on = false; clearTimeout(t); };
  }, [fkey]);
  // Echte plekken rond de gekozen locatie ophalen (OpenStreetMap)
  const pkey = JSON.stringify([d.lat, d.lon, d.km, d.main]);
  useEffect(() => {
    let on = true;
    if (d.lat == null || d.km === null || !needsPlace(d.main)) { setPlaces([]); setPState(''); return; }
    setPState('busy');
    fetchPlaces(d).then(x => { if (on) { setPlaces(x); setPState('ok'); } }).catch(() => { if (on) { setPlaces([]); setPState('err'); } });
    return () => { on = false; };
  }, [pkey]);
  useEffect(() => { if (cur === 'samenvatting' && films) deckTitles(d, 12).then(setPreview).catch(() => setPreview([])); }, [cur, fkey]);

  // Welke vragen zijn nog niet beantwoord in deze stap?
  const missing = (() => {
    const m = [];
    if (cur === 'wat' && !d.main.length) m.push('Kies minstens één ding');
    if (cur === 'kijken') {
      if (!d.film.kinds.length) m.push('Films of series');
      if (!d.film.streams.length) m.push('Streamingdienst');
      if (!d.film.allGenres && !d.film.genres.length) m.push('Genres');
      if (d.film.minRating === null) m.push('Minimale score');
    }
    if (cur === 'activiteit') {
      if (!d.lvls.length) m.push('Hoe actief');
      if (!d.intsAll && !d.ints.length) m.push('Interesses');
      if (!d.io) m.push('Binnen of buiten');
    }
    if (cur === 'eten') {
      if (d.main.some(x => ['uiteten', 'bestellen'].includes(x)) && !d.cuisAll && !d.cuis.length) m.push('Keuken');
      if (!d.dietsNone && !d.diets.length) m.push('Dieetwensen');
    }
    if (cur === 'sfeer' && !d.moodsAll && !d.moods.length) m.push('Sfeer');
    if (cur === 'praktisch') {
      if (!d.date) m.push('Dag');
      if (!d.dayPart) m.push('Dagdeel');
      if (needsPlace(d.main)) { if (!d.loc.trim() || d.lat == null) m.push('Plaats (kies uit de lijst)'); if (d.km === null) m.push('Afstand'); }
      if (needsBudget(d.main) && d.bmax === null) m.push('Budget');
      if (needsBudget(d.main) && d.size === null) m.push('Aantal personen');
    }
    if (cur === 'beslissen') {
      if (!d.rule.type) m.push('Besluitregel');
      if (d.rule.type === 'meerderheid' && !d.rule.pct) m.push('Percentage');
      if (d.rule.type === 'koppel' && d.rule.pair.length !== 2) m.push('Twee personen');
      if (!d.deadlineChoice) m.push('Deadline');
      if (['deadline', 'willekeurig'].includes(d.rule.type) && d.deadlineChoice === 'geen') m.push('Een deadline (nodig bij deze regel)');
    }
    return m;
  })();

  const goStep = s => { setStep(s); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const next = () => {
    if (missing.length) return toast(`Nog kiezen: ${missing.join(', ')}`);
    if (cur === 'activiteit' && d.lvls.includes('rustig') && d.lvls.includes('avontuur') && !d._ack)
      return setCf({ title: 'Brede selectie', text: 'Je hebt sterk verschillende activiteitsniveaus gekozen. Hierdoor worden de suggesties breder. Wil je doorgaan?', ok: 'Doorgaan', fn: () => { d._ack = true; goStep(step + 1); } });
    goStep(step + 1);
  };
  const start = async () => {
    if (busy) return;
    if (pState === 'busy') return toast('Even geduld, plekken in de buurt worden nog gezocht.');
    if (!n) return toast('Geen opties gevonden. Ga terug en verruim een keuze.');
    setBusy(true);
    try {
      const titles = films ? await deckTitles(d, 1000) : [];
      const ranked = [...L].sort((a, b) => rankScore(b, d) - rankScore(a, d));
      const real = ranked.filter(o => o.osm).slice(0, 500), statics = ranked.filter(o => !o.osm);
      if (real.length) await savePlaces(real);
      const deck = mergeDeck([...real, ...statics], titles);
      if (!deck.length) { setBusy(false); return toast('Geen opties gevonden. Ga terug en verruim een keuze.'); }
      const data = { ...d, title: d.title.trim() || d.main.map(m => MAIN[m].l).join(' + ') };
      if (editing) {
        await api.updateRound(editing.id, data, deck);
        toast('Ronde aangepast. Stemmen op opties die blijven, tellen nog mee.');
        router.replace(`/swipe/${editing.id}`);
      } else {
        const rid = await api.createRound(data, deck);
        toast(g.members.length > 1 ? 'Ronde gestart. Je groep ziet hem meteen.' : 'Ronde gestart. Nodig leden uit om samen te swipen.');
        router.replace(`/swipe/${rid}`);
      }
    } catch (e) { toast(errText(e)); setBusy(false); }
  };

  const days = Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + i); return ymd(x); });
  const dayLabel = s => { const x = new Date(s + 'T12:00'), i = days.indexOf(s); return i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : `${DAYN[x.getDay()]} ${x.getDate()} ${MON[x.getMonth()]}`; };
  const setDeadline = v => up(x => {
    x.deadlineChoice = v;
    const now = new Date(), t = new Date();
    if (v === '1u') t.setTime(now.getTime() + 3600e3);
    else if (v === '3u') t.setTime(now.getTime() + 3 * 3600e3);
    else if (v === 'vanavond') { t.setHours(20, 0, 0, 0); if (t < now) t.setDate(t.getDate() + 1); }
    else if (v === 'morgen') { t.setDate(t.getDate() + 1); t.setHours(12, 0, 0, 0); }
    x.deadline = v === 'geen' ? '' : `${ymd(t)}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
  });
  const togF = k => v => up(x => { toggleIn(x.film[k], v); if (k === 'genres') x.film.allGenres = false; });

  let title, body;
  if (cur === 'wat') {
    title = 'Wat willen jullie doen?';
    body = <>
      <T v="small" style={{ fontSize: 14 }}>Kies één of meer dingen. Daarna stel ik per onderdeel een paar korte vragen.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {Object.entries(MAIN).map(([k, m]) => { const on = d.main.includes(k); return (
          <Pressable key={k} onPress={() => up(x => toggleIn(x.main, k))} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            style={{ width: '48%', flexGrow: 1, minHeight: 104, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: on ? c.purple : c.line, backgroundColor: on ? c.purpleSoft : c.surface, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 28 }}>{m.e}</Text>{on && <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.purple, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontFamily: F.bold }}>✓</Text></View>}</View>
            <T v="b" c={on ? c.purpleInk : c.ink} style={{ fontSize: 15 }}>{m.l}</T>
            <T v="small" style={{ fontSize: 12 }}>{m.sub}</T>
          </Pressable>); })}
      </View>
      <Field label="Naam van de ronde (optioneel)"><Input value={d.title} onChangeText={t => up(x => { x.title = t; })} maxLength={60} placeholder="Bijv. Vrijdagavond" /></Field>
    </>;
  }
  if (cur === 'kijken') {
    title = 'Film of serie';
    body = <>
      <Q label="Wat willen jullie kijken?" done={!!d.film.kinds.length}><Multi dict={{ film: 'Films', serie: 'Series' }} sel={d.film.kinds} onToggle={togF('kinds')} /></Q>
      <Q label="Welke streamingdienst hebben jullie?" hint="Alleen titels die bij het abonnement zitten, dus zonder bijbetalen." done={!!d.film.streams.length}><Multi dict={STREAMS} sel={d.film.streams} onToggle={togF('streams')} /></Q>
      <Q label="Welke genres vinden jullie leuk?" done={d.film.allGenres || !!d.film.genres.length}><Multi dict={GENRES} sel={d.film.genres} all={d.film.allGenres} onToggle={togF('genres')} onAll={() => up(x => { x.film.allGenres = !x.film.allGenres; x.film.genres = []; })} allLabel="Alle genres" /></Q>
      <Q label="Hoe goed moet hij minstens zijn?" hint="Score van kijkers op TMDB, van 0 tot 10." done={d.film.minRating !== null}><Single opts={[[0, 'Maakt niet uit'], [6, '6+'], [7, '7+'], [8, '8+']]} val={d.film.minRating} onPick={v => up(x => { x.film.minRating = v; })} /></Q>
    </>;
  }
  if (cur === 'activiteit') {
    title = 'Activiteit';
    body = <>
      <Q label="Hoe actief willen jullie zijn?" hint="Meerdere keuzes mogelijk." done={!!d.lvls.length}>
        {Object.entries(LVLS).map(([k, l]) => { const on = d.lvls.includes(k); return (
          <Pressable key={k} onPress={() => up(x => { toggleIn(x.lvls, k); x._ack = false; })} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.purple : c.line, backgroundColor: on ? c.purpleSoft : c.surface, gap: 2 }}>
            <T v="b" c={on ? c.purpleInk : c.ink}>{on ? '✓ ' : ''}{l}</T><T v="small">{LVLEX[k]}</T>
          </Pressable>); })}
      </Q>
      {d.lvls.includes('rustig') && d.lvls.includes('avontuur') && <Warn text="Sterk verschillende niveaus gekozen. De suggesties worden breder; elke kaart toont het niveau." />}
      <Q label="Waar liggen jullie interesses?" done={d.intsAll || !!d.ints.length}><Multi dict={INTS} keys={ACT_INTS} sel={d.ints} all={d.intsAll} onToggle={v => up(x => { toggleIn(x.ints, v); x.intsAll = false; })} onAll={() => up(x => { x.intsAll = !x.intsAll; x.ints = []; })} /></Q>
      <Q label="Binnen of buiten?" done={!!d.io}><Single opts={[['binnen', 'Binnen'], ['buiten', 'Buiten'], ['any', 'Maakt niet uit']]} val={d.io} onPick={v => up(x => { x.io = v; })} /></Q>
    </>;
  }
  if (cur === 'eten') {
    title = 'Eten en drinken';
    body = <>
      {d.main.some(x => ['uiteten', 'bestellen'].includes(x)) && <Q label="Waar hebben jullie zin in?" done={d.cuisAll || !!d.cuis.length}><Multi dict={CUIS} sel={d.cuis} all={d.cuisAll} onToggle={v => up(x => { toggleIn(x.cuis, v); x.cuisAll = false; })} onAll={() => up(x => { x.cuisAll = !x.cuisAll; x.cuis = []; })} allLabel="Alles is goed" /></Q>}
      <Q label="Dieetwensen in de groep?" done={d.dietsNone || !!d.diets.length}><Multi dict={DIETS} sel={d.diets} all={d.dietsNone} onToggle={v => up(x => { toggleIn(x.diets, v); x.dietsNone = false; })} onAll={() => up(x => { x.dietsNone = !x.dietsNone; x.diets = []; })} allLabel="Geen" /></Q>
    </>;
  }
  if (cur === 'sfeer') {
    title = 'Sfeer';
    body = <Q label="Welke sfeer zoeken jullie?" hint="Voor uitgaan, dagje weg, wellness en thuis." done={d.moodsAll || !!d.moods.length}><Multi dict={MOODS} keys={SFEER} sel={d.moods} all={d.moodsAll} onToggle={v => up(x => { toggleIn(x.moods, v); x.moodsAll = false; })} onAll={() => up(x => { x.moodsAll = !x.moodsAll; x.moods = []; })} /></Q>;
  }
  if (cur === 'praktisch') {
    title = 'Wanneer en waar';
    const place = needsPlace(d.main), budget = needsBudget(d.main);
    body = <>
      <Q label="Welke dag?" done={!!d.date}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{days.map(s => <Chip key={s} label={dayLabel(s)} on={d.date === s} onPress={() => up(x => { x.date = s; })} />)}</ScrollView></Q>
      {<Q label="Welk deel van de dag?" done={!!d.dayPart}><Single opts={Object.entries(DAYPARTS).map(([k, v]) => [k, v[0]])} val={d.dayPart} onPick={v => up(x => { x.dayPart = v; const [, s, e] = DAYPARTS[v]; x.start = `${pad(s % 24)}:00`; x.end = `${pad(e % 24)}:00`; })} /></Q>}
      {place && <>
        <Q label="Waar zijn jullie?" hint="Typ en kies uit de lijst. Je ziet er de provincie en het land bij." done={d.lat != null}>
          <LocationField value={d.loc} picked={d.lat != null} onPick={it => up(x => { x.loc = it.label; x.lat = it.lat; x.lon = it.lon; })} onClear={() => up(x => { x.lat = null; x.lon = null; })} />
        </Q>
        <Q label="Hoe ver willen jullie reizen?" done={d.km !== null}><Single opts={[[3, 'Max. 3 km'], [10, '10 km'], [25, '25 km'], [50, '50 km'], ['any', 'Maakt niet uit']]} val={d.km} onPick={v => up(x => { x.km = v; })} /></Q>
        {pState === 'busy' && <T v="small">Echte plekken rond {d.loc} zoeken…</T>}
        {pState === 'ok' && <T v="small" c={c.yes}>{places.length.toLocaleString('nl-NL')} echte plekken gevonden binnen {d.km === 'any' ? 'de regio' : `${d.km} km`} van {d.loc}.</T>}
        {pState === 'err' && <Warn text="Plekken in de buurt ophalen lukte niet. Controleer je internet en kies de afstand opnieuw." />}
        <Q label="Hoe gaan jullie erheen? (optioneel)" done><Multi dict={TRANS} sel={d.trans} onToggle={v => up(x => toggleIn(x.trans, v))} /></Q>
      </>}
      {budget && <>
        <Q label="Budget per persoon" done={d.bmax !== null}><Single opts={[[10, 'Tot €10'], [20, 'Tot €20'], [35, 'Tot €35'], [50, 'Tot €50'], ['any', 'Maakt niet uit']]} val={d.bmax} onPick={v => up(x => { x.bmax = v; })} /></Q>
        <Q label="Met hoeveel personen?" done={d.size !== null}><Single opts={[2, 3, 4, 5, 6, 8, 10, 15].map(v => [v, v === 15 ? '15+' : String(v)])} val={d.size} onPick={v => up(x => { x.size = v; })} /></Q>
      </>}
    </>;
  }
  if (cur === 'beslissen') {
    title = 'Hoe beslissen jullie?';
    body = <>
      <Q label="Wanneer is het een match?" done={!!d.rule.type}>
        {Object.entries(RULES).map(([k, [l, s]]) => { const on = d.rule.type === k; return (
          <Pressable key={k} onPress={() => up(x => { x.rule.type = k; })} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ padding: 13, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.purple : c.line, backgroundColor: on ? c.purpleSoft : c.surface, gap: 2 }}>
            <T v="b">{l}</T><T v="small">{s}</T>
          </Pressable>); })}
      </Q>
      {d.rule.type === 'meerderheid' && <Q label="Hoeveel procent moet ja zeggen?" done={!!d.rule.pct}><Single opts={[50, 60, 70, 80, 90].map(p => [p, p + '%'])} val={d.rule.pct} onPick={v => up(x => { x.rule.pct = v; })} /></Q>}
      {d.rule.type === 'koppel' && <Q label="Welke twee personen?" done={d.rule.pair.length === 2}><Multi dict={Object.fromEntries(g.members.map(m => [m.id, nameOf(m.id)]))} sel={d.rule.pair} onToggle={v => up(x => { const p = x.rule.pair, i = p.indexOf(v); if (i >= 0) p.splice(i, 1); else { p.push(v); if (p.length > 2) p.shift(); } })} /></Q>}
      <Q label="Tot wanneer kan iedereen stemmen?" done={!!d.deadlineChoice}><Single opts={[...(editing && editing.deadline ? [['huidig', 'Zoals het was']] : []), ['1u', 'Over 1 uur'], ['3u', 'Over 3 uur'], ['vanavond', 'Vanavond 20:00'], ['morgen', 'Morgen 12:00'], ['geen', 'Geen deadline']]} val={d.deadlineChoice} onPick={v => v === 'huidig' ? up(x => { x.deadlineChoice = 'huidig'; x.deadline = editing.deadline; }) : setDeadline(v)} /></Q>
    </>;
  }
  if (cur === 'samenvatting') {
    title = 'Klopt dit?';
    const rows = [['Groep', g.name], ['Wat', d.main.map(m => MAIN[m].l).join(', ')]];
    if (d.main.includes('kijken')) rows.push(['Kijken', `${d.film.kinds.map(k => (k === 'film' ? 'Films' : 'Series')).join(' en ')} op ${d.film.streams.map(s => STREAMS[s]).join(' en ')}`], ['Genres', d.film.allGenres ? 'Alle genres' : d.film.genres.map(x => GENRES[x]).join(', ')]);
    if (d.main.includes('activiteit')) rows.push(['Activiteit', `${d.lvls.map(x => LVLS[x]).join(', ')} · ${d.intsAll ? 'alle interesses' : d.ints.map(x => INTS[x]).join(', ')}`]);
    if (sections.includes('eten')) rows.push(['Eten', `${d.cuisAll || !d.cuis.length ? 'Alles' : d.cuis.map(x => CUIS[x]).join(', ')}${d.diets.length ? ' · ' + d.diets.map(x => DIETS[x]).join(', ') : ''}`]);
    if (sections.includes('sfeer')) rows.push(['Sfeer', d.moodsAll ? 'Maakt niet uit' : d.moods.map(x => MOODS[x]).join(', ')]);
    rows.push(['Wanneer', `${dateNice(d.date)}${d.dayPart ? ', ' + DAYPARTS[d.dayPart][0].toLowerCase() : ''}`]);
    if (needsPlace(d.main)) rows.push(['Waar', `${d.loc}${d.km === 'any' ? '' : `, max. ${d.km} km`}`]);
    if (needsBudget(d.main)) rows.push(['Budget', d.bmax === 'any' ? 'Maakt niet uit' : `Tot €${d.bmax} p.p.`], ['Personen', d.size]);
    rows.push(['Besluitregel', RULES[d.rule.type][0] + (d.rule.type === 'meerderheid' ? ` (${d.rule.pct}%)` : '') + (d.rule.type === 'koppel' ? ` (${d.rule.pair.map(nameOf).join(' + ')})` : '')]);
    body = <>
      <Box style={{ paddingVertical: 4 }}>{rows.map(([a, b], i) => (
        <View key={a} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: c.line }}>
          <T v="small" style={{ width: 96, fontFamily: F.semi }}>{a}</T><T v="body" style={{ flex: 1, fontSize: 14 }}>{String(b)}</T>
        </View>))}</Box>
      <Section title={`Voorproefje (${n.toLocaleString('nl-NL')})`}>
        {n ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{[...L.slice(0, 6), ...preview].slice(0, 14).map(o => <OptMini key={o.id} o={o} sub={o.tmdb ? o.plat : o.osm ? kmStr(o, d) : priceOf(o)} />)}</ScrollView>
          : <Warn text="Geen enkele optie past. Ga terug en verruim een keuze." />}
      </Section>
    </>;
  }

  const last = cur === 'samenvatting';
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top }}>
      <Header title={`${editing ? 'Aanpassen · ' : ''}${step + 1}/${steps.length} · ${title}`} onBack={() => step ? goStep(step - 1) : router.back()} />
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16 }}>{steps.map((_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.purple : c.surface2 }} />)}</View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 20, paddingBottom: 30 }}>{body}</ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 + ins.bottom, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface }}>
        <View style={{ flex: 1 }}>
          {d.main.length ? <>
            <Text style={{ fontFamily: F.displayBold, fontSize: 18, color: n || tc === null ? c.ink : c.no, fontVariant: ['tabular-nums'] }}>{(tc === null && films) || pState === 'busy' ? `${L.length}+` : n.toLocaleString('nl-NL')} opties</Text>
            <T v="small" style={{ lineHeight: 16 }}>{missing.length ? `Nog kiezen: ${missing[0]}` : n ? 'passen bij jullie keuzes' : 'passen nu. Verruim een keuze.'}</T>
          </> : <T v="small">Kies wat jullie willen doen</T>}
        </View>
        {step > 0 && <Btn sm kind="ghost" title="Terug" onPress={() => goStep(step - 1)} />}
        <Btn sm kind={last ? 'purple' : 'primary'} title={last ? (busy ? 'Bezig…' : editing ? 'Opslaan' : 'Start ronde') : 'Volgende'} disabled={last ? (!n || busy) : !!missing.length} onPress={last ? start : next} />
      </View>
      <Confirm state={cf} setState={setCf} />
    </View>
  );
}
