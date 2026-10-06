import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore, rnd } from '../../lib/store';
import { T, Screen, Header, IBtn, Item, Thumb, Avs, Btn } from '../../components/ui';

export default function Groups() {
  const S = useStore();
  return (
    <Screen header={<Header back={false} title="Groepen" right={<IBtn n="plus" label="Groep maken" onPress={() => router.push('/group/new')} />} />}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Groep maken" icon="plus" flex onPress={() => router.push('/group/new')} />
        <Btn title="Code invoeren" icon="link" kind="ghost" flex onPress={() => router.push('/join')} />
      </View>
      {S.groups.map(g => {
        const a = S.rounds.filter(r => r.gid === g.id && r.status === 'active').length, m = S.matches.filter(x => rnd(x.rid)?.gid === g.id).length;
        return (
          <Item key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
            <Thumb emoji={g.e} bg={g.col + '22'} />
            <View style={{ flex: 1 }}><T v="b">{g.name}</T><T v="small">{g.members.length} leden · {a} actief · {m} matches</T></View>
            <Avs ids={g.members.slice(0, 4).map(x => x.id)} s={26} />
          </Item>
        );
      })}
    </Screen>
  );
}
