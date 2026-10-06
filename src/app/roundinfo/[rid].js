import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CATS, LVLS, MOODS, INTS, RULES } from '../../lib/data';
import { roundChips, DAYPARTS } from '../../lib/store';
import { useStore, toast, errText, api, rnd, grp, actives, doneCount, nameOf, isAdmin, dateNice, pad, DAYN, MON } from '../../lib/store';
import { useC, T, Screen, Header, Tag, DL, Section, Item, Av, Bar, Toggle, Btn, Confirm } from '../../components/ui';

export default function RoundInfo() {
  const { rid } = useLocalSearchParams();
  const S = useStore(), c = useC();
  const [cf, setCf] = useState(null);
  const r = rnd(rid); if (!r) return null;
  const g = grp(r.gid), tot = r.deck.length, admin = isAdmin(g) || r.by === 'me';
  const dl = r.deadline ? new Date(r.deadline) : null;
  const chips = roundChips(r);
  const when = r.v === 2 ? `${r.date ? dateNice(r.date) : 'Geen dag'}${r.dayPart ? ', ' + DAYPARTS[r.dayPart][0].toLowerCase() : ''}` : `${dateNice(r.date)}, ${r.start}–${r.end}`;
  return (
    <Screen header={<Header title="Ronde-informatie" />}>
      <View><T v="eyebrow">{g.name} · gestart door {nameOf(r.by)}</T><T v="h1" style={{ fontSize: 22, marginTop: 4 }}>{r.title}</T></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{chips.map((x, i) => <Tag key={i} label={x} />)}</View>
      <DL rows={[['Wanneer', when], ...(r.loc ? [['Waar', r.loc]] : []), ['Besluitregel', RULES[r.rule.type][0] + (r.rule.type === 'meerderheid' ? ` · ${r.rule.pct}%` : '') + (r.rule.type === 'koppel' ? ` · ${r.rule.pair.map(nameOf).join(' + ')}` : '')], ['Deadline', dl ? `${DAYN[dl.getDay()]} ${dl.getDate()} ${MON[dl.getMonth()]} ${pad(dl.getHours())}:${pad(dl.getMinutes())}` : 'Geen'], ['Opties in deze ronde', tot]]} />
      <Section title="Wie heeft gestemd">
        <T v="small">Je ziet alleen de voortgang, niet wat iemand stemt. Alleen actieve deelnemers tellen mee voor een match.</T>
        {g.members.map(m => { const n = doneCount(r, m.id); return (
          <Item key={m.id}>
            <Av id={m.id} s={36} />
            <View style={{ flex: 1, gap: 5 }}><T v="b">{nameOf(m.id)}</T><Bar pct={n / Math.max(1, tot) * 100} color={m.active ? undefined : c.muted} /><T v="small">{!m.active ? 'Inactief' : n >= tot ? 'Klaar' : n ? `${n} van ${tot}` : 'Nog niet begonnen'}</T></View>
            {admin && m.id !== 'me' && <Toggle on={m.active} label={`${nameOf(m.id)} actief`} onPress={() => api.member(g.id, m.id, 'toggle_active').catch(e => toast(errText(e)))} />}
          </Item>); })}
      </Section>
      {r.status === 'active' && <>
        <Btn kind="ghost" icon="bell" title="Stuur een vriendelijke herinnering" onPress={() => { const w = actives(r).filter(m => m.id !== 'me' && doneCount(r, m.id) < tot); if (!w.length) return toast('Iedereen heeft al gestemd'); api.send(r.gid, rid, { text: `⏰ ${w.map(m => nameOf(m.id)).join(', ')}: nog even swipen voor "${r.title}"!` }).then(() => toast('Herinnering geplaatst in de chat'), e => toast(errText(e))); }} />
        {admin && <Btn kind="danger" title="Ronde nu afronden" onPress={() => setCf({ title: 'Ronde afronden?', text: 'Daarna kan niemand meer stemmen. Bij de regels Deadline en Willekeurig kiest de app nu de winnaar.', ok: 'Afronden', danger: true, fn: () => api.closeRound(rid).then(() => router.replace(`/matches/${rid}`), e => toast(errText(e))) })} />}
      </>}
      <Btn title={`Onze matches (${S.matches.filter(m => m.rid === rid).length})`} onPress={() => router.push(`/matches/${rid}`)} />
      <Confirm state={cf} setState={setCf} />
    </Screen>
  );
}
