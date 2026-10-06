import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore, remaining } from '../../lib/store';
import { useC, F, T, Screen, Header, IBtn, Wordmark, Section, Item, Thumb, Avs, Icon, LinkText, Empty, Sheet, Btn } from '../../components/ui';
import { RoundCard, MatchMini } from '../../components/cards';
import { GroupPicker, Cta } from '../../components/picker';

export default function Home() {
  const S = useStore(), c = useC();
  const [pick, setPick] = useState(false);
  const act = S.rounds.filter(r => r.status === 'active'), un = S.notifs.filter(n => !n.read).length;
  const saved = S.rounds.reduce((a, r) => a + r.saved.length, 0), pending = act.reduce((a, r) => a + remaining(r).length, 0);
  return (
    <Screen header={<Header back={false} title={<Wordmark />} right={<IBtn n="bell" label="Meldingen" badge={un} onPress={() => router.push('/notifs')} />} />}>
      <View style={{ gap: 4 }}><T v="h1">Hoi {S.user.name || 'daar'}</T><T v="small" style={{ fontSize: 15 }}>{pending ? `Je hebt nog ${pending} kaarten om te swipen.` : 'Wat gaan jullie doen?'}</T></View>
      <Cta onPress={() => S.groups.length ? setPick(true) : router.push('/group/new')} sub="Filters kiezen, groep laten swipen, klaar" />
      <Section title="Actieve rondes">{act.length ? act.map(r => <RoundCard key={r.id} r={r} />) : <Empty text="Geen actieve rondes. Start er een met de knop hierboven." />}</Section>
      <Section title="Recente matches">{S.matches.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ marginHorizontal: -16 }} contentInset={{ left: 16, right: 16 }}><View style={{ width: 4 }} />{S.matches.slice(0, 8).map(m => <MatchMini key={m.id} m={m} />)}<View style={{ width: 4 }} /></ScrollView> : <Empty text="Nog geen matches. De eerste komt eraan." />}</Section>
      <Section title="Je groepen" right={<LinkText title="Code invoeren" onPress={() => router.push('/join')} />}>
        {!S.groups.length && <Item onPress={() => router.push('/group/new')}><Thumb bg={c.purpleSoft}><Icon n="plus" s={22} c={c.purpleInk} /></Thumb><View style={{ flex: 1 }}><T v="b">Maak je eerste groep</T><T v="small">Of vul een code in die je van een vriend kreeg.</T></View></Item>}
        {S.groups.map(g => (
          <Item key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
            <Thumb emoji={g.e} bg={g.col + '22'} />
            <View style={{ flex: 1 }}><T v="b">{g.name}</T><T v="small">{g.members.length} leden</T></View>
            <Avs ids={g.members.slice(0, 4).map(m => m.id)} />
          </Item>
        ))}
      </Section>
      <Item onPress={() => router.push('/saved')}>
        <Thumb bg={c.laterSoft}><Icon n="bookmark" s={22} c={c.later} /></Thumb>
        <View style={{ flex: 1 }}><T v="b">Opgeslagen voor later</T><T v="small">{saved} opties wachten op je stem</T></View>
        <Icon n="chevron-right" s={18} c={c.muted} />
      </Item>
      <GroupPicker visible={pick} onClose={() => setPick(false)} />
    </Screen>
  );
}
