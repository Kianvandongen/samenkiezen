import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { useC, F, T, Item, Thumb, Icon, Sheet, Btn } from './ui';

export function GroupPicker({ visible, onClose }) {
  const S = useStore();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="h2" style={{ fontSize: 18 }}>In welke groep?</T>
      {S.groups.map(g => (
        <Item key={g.id} onPress={() => { onClose(); router.push({ pathname: '/wizard', params: { gid: g.id } }); }}>
          <Thumb emoji={g.e} bg={g.col + '22'} /><View style={{ flex: 1 }}><T v="b">{g.name}</T><T v="small">{g.members.length} leden</T></View>
        </Item>
      ))}
      <Btn title="Nieuwe groep" icon="plus" kind="ghost" onPress={() => { onClose(); router.push('/group/new'); }} />
    </Sheet>
  );
}

export function Cta({ onPress, sub }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22, backgroundColor: c.primary, opacity: pressed ? 0.9 : 1, shadowColor: '#16205c', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 })}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.purple, alignItems: 'center', justifyContent: 'center' }}><Icon n="plus" s={26} c="#fff" /></View>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 17, color: c.onPrimary }}>Start nieuwe ronde</Text><Text style={{ fontFamily: F.body, fontSize: 13, color: c.onPrimary, opacity: 0.8 }}>{sub}</Text></View>
    </Pressable>
  );
}

