import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useStore, toast, errText, api, newGroupPrefs } from '../../lib/store';
import { useC, T, Screen, Header, Field, Input, Chip, Btn } from '../../components/ui';

const EMOJIS = ['🎉', '🍕', '🏠', '💜', '💼', '👨‍👩‍👧', '🎮', '⚽', '🍻', '🎬', '🏕️', '☕'];
const COLS = ['#7b4dff', '#0f9b74', '#d63c78', '#2f7de1', '#e0703a'];
export default function NewGroup() {
  const S = useStore(), c = useC();
  const [name, setName] = useState('');
  const [e, setE] = useState('🎉');
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!name.trim()) return toast('Geef je groep een naam');
    setBusy(true);
    try {
      const id = await api.createGroup(name.trim(), e, COLS[S.groups.length % 5], newGroupPrefs({ loc: S.user.city, km: S.user.km, trans: [...S.user.trans] }));
      router.replace({ pathname: '/group/[id]', params: { id, tab: 'leden' } });
      toast('Groep gemaakt. Nodig nu je vrienden uit.');
    } catch (err) { toast(errText(err)); } finally { setBusy(false); }
  };
  return (
    <Screen header={<Header title="Nieuwe groep" />}>
      <Field label="Groepsnaam"><Input value={name} onChangeText={setName} maxLength={40} placeholder="Bijv. Vriendengroep Venlo" /></Field>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Vrijdagavond', 'Huisgenoten', 'Date night', 'Teamuitje', 'Familie', 'Weekendplannen'].map(n => <Chip key={n} label={n} on={name === n} onPress={() => setName(n)} />)}</View>
      <Field label="Groepsafbeelding">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{EMOJIS.map(x => (
          <Pressable key={x} onPress={() => setE(x)} accessibilityLabel={`Afbeelding ${x}`} style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: e === x ? c.purple : c.line, backgroundColor: e === x ? c.purpleSoft : c.surface }}><Text style={{ fontSize: 24 }}>{x}</Text></Pressable>
        ))}</View>
      </Field>
      <Btn title={busy ? 'Bezig…' : 'Groep maken en uitnodigen'} disabled={busy} onPress={create} />
    </Screen>
  );
}
