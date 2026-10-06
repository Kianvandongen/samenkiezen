import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore, mutate, rnd, ago } from '../lib/store';
import { useC, T, Screen, Header, Item, Thumb, Icon } from '../components/ui';

export default function Notifs() {
  const S = useStore(), c = useC();
  useEffect(() => { mutate(s => s.notifs.forEach(n => { n.read = true; })); }, []);
  return (
    <Screen header={<Header title="Meldingen" />}>
      {S.notifs.length ? S.notifs.map(n => (
        <Item key={n.id} onPress={() => router.push(n.type === 'match' ? `/match/${n.ref}` : n.type === 'groep' ? `/group/${n.ref}` : rnd(n.ref)?.status === 'active' ? `/swipe/${n.ref}` : '/home')}>
          <Thumb bg={n.type === 'match' ? c.yesSoft : c.purpleSoft}><Icon n={n.type === 'match' ? 'heart' : 'bell'} s={22} c={n.type === 'match' ? c.yes : c.purpleInk} /></Thumb>
          <View style={{ flex: 1 }}><T v="body" style={{ fontSize: 14 }}>{n.text}</T><T v="small">{ago(n.at)} geleden</T></View>
        </Item>
      )) : <T v="small" style={{ textAlign: 'center', paddingTop: 40 }}>Geen meldingen</T>}
    </Screen>
  );
}
