import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { opt } from '../../lib/data';
import { useStore, mutate, castVote, euro } from '../../lib/store';
import { useC, T, Screen, Header, Item, Thumb, Btn, Chip, Icon } from '../../components/ui';

export default function Saved() {
  const S = useStore(), c = useC();
  const [f, setF] = useState('all');
  const rs = S.rounds.filter(r => r.saved.length);
  const list = rs.filter(r => f === 'all' || r.id === f).flatMap(r => r.saved.map(oid => ({ r, o: opt(oid) })));
  const vote = (r, oid, v) => mutate(() => castVote(r, 'me', oid, v));
  return (
    <Screen header={<Header back={false} title="Opgeslagen voor later" />}>
      {rs.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Chip label="Alles" on={f === 'all'} onPress={() => setF('all')} />{rs.map(r => <Chip key={r.id} label={r.title} on={f === r.id} onPress={() => setF(r.id)} />)}</ScrollView>}
      {list.length ? list.map(({ r, o }) => (
        <Item key={r.id + o.id} style={{ flexWrap: 'wrap' }}>
          <Thumb o={o} />
          <View style={{ flex: 1 }}><T v="b" numberOfLines={1}>{o.t}</T><T v="small" numberOfLines={1}>{r.title} · {euro(o.p)}</T></View>
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            {r.status === 'active' ? <>
              <Btn sm flex kind="danger" icon="x" title="Nee" onPress={() => vote(r, o.id, 'n')} />
              <Btn sm flex kind="yes" icon="heart" title="Ja" onPress={() => vote(r, o.id, 'y')} />
            </> : <T v="small" style={{ flex: 1, alignSelf: 'center' }}>Ronde afgerond</T>}
            <Btn sm kind="ghost" title="Info" onPress={() => router.push({ pathname: '/detail/[oid]', params: { oid: o.id, rid: r.id } })} />
          </View>
        </Item>
      )) : (
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 60 }}>
          <Thumb bg={c.laterSoft} size={64}><Icon n="bookmark" s={30} c={c.later} /></Thumb>
          <T v="small" style={{ textAlign: 'center', maxWidth: 260 }}>Swipe een kaart omhoog om hem hier te bewaren en later alsnog ja of nee te stemmen.</T>
        </View>
      )}
    </Screen>
  );
}
