import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { QUICK, opt } from '../lib/data';
import { useStore, toast, errText, api, grp, rnd, nameOf, euro } from '../lib/store';
import { useC, F, T, Header, Av, Avs, IBtn, Chip, Sheet, Item, Thumb } from '../components/ui';

export default function Chat() {
  const { gid, rid = '' } = useLocalSearchParams();
  const S = useStore(), c = useC(), ins = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [share, setShare] = useState(false);
  const sc = useRef(null);
  const g = grp(gid), r = rid ? rnd(rid) : null;
  if (!g) return null;
  const msgs = S.msgs.filter(m => m.gid === gid && (rid ? m.rid === rid : !m.rid));
  const post = o => api.send(gid, rid, o).catch(e => toast(errText(e)));
  const send = () => { const t = text.trim(); if (!t) return; setText(''); post({ text: t }); };
  const photo = async () => { const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 }); if (res.canceled) return; try { const url = await api.upload(res.assets[0].uri); post({ type: 'img', img: url }); } catch (e) { toast(errText(e)); } };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg, paddingTop: ins.top }}>
      <Header title={r ? r.title : `${g.name} · chat`} right={<Avs ids={g.members.slice(0, 3).map(m => m.id)} s={26} />} />
      <ScrollView ref={sc} onContentSizeChange={() => sc.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ padding: 16, gap: 10 }}>
        <View style={{ alignSelf: 'center', backgroundColor: c.surface2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}><T v="small" style={{ fontSize: 12.5 }}>{r ? 'Bespreek opties vrij: jouw swipes blijven privé.' : `Groepschat van ${g.name}`}</T></View>
        {msgs.map(m => {
          if (m.type === 'system') return <View key={m.id} style={{ alignSelf: 'center', backgroundColor: c.surface2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, maxWidth: '90%' }}><T v="small" style={{ fontSize: 12.5, textAlign: 'center' }}>{m.text}</T></View>;
          const mine = m.uid === 'me', o = m.oid ? opt(m.oid) : null, rc = {}; Object.values(m.re || {}).forEach(e => (rc[e] = (rc[e] || 0) + 1));
          return (
            <View key={m.id} style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', maxWidth: '86%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && <Av id={m.uid} s={28} />}
              <View style={{ flexShrink: 1 }}>
                <View style={{ backgroundColor: mine ? c.primary : c.surface, borderWidth: mine ? 0 : 1, borderColor: c.line, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, borderBottomLeftRadius: mine ? 18 : 6, borderBottomRightRadius: mine ? 6 : 18 }}>
                  {!mine && <Text style={{ fontSize: 11, fontFamily: F.bold, color: c.muted, marginBottom: 2 }}>{nameOf(m.uid)}</Text>}
                  {m.type === 'img' && <Image source={{ uri: m.img }} style={{ width: 200, height: 200, borderRadius: 12 }} accessibilityLabel="Gedeelde foto" />}
                  {!!m.text && <Text style={{ fontFamily: F.body, fontSize: 14.5, color: mine ? c.onPrimary : c.ink }}>{m.text}</Text>}
                  {o && <Pressable onPress={() => router.push({ pathname: '/detail/[oid]', params: { oid: o.id, rid: m.rid } })} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 6, borderRadius: 14, backgroundColor: c.surface2, marginTop: 4 }}><Thumb o={o} size={40} /><View style={{ flexShrink: 1 }}><T v="b" style={{ fontSize: 13 }} numberOfLines={1}>{o.t}</T><T v="small">{euro(o.p)} · bekijk</T></View></Pressable>}
                </View>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  {['🔥', '👍', '😂'].map(e => <Pressable key={e} accessibilityLabel={`Reageer ${e}`} onPress={() => api.react(m.id, e).catch(er => toast(errText(er)))} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: m.re?.me === e ? c.purpleSoft : c.surface2 }}><Text style={{ fontSize: 12, color: c.ink }}>{e}{rc[e] ? ' ' + rc[e] : ''}</Text></Pressable>)}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>{QUICK.map(q => <Chip key={q} label={q} onPress={() => post({ text: q })} />)}</ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 + ins.bottom, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface }}>
        <IBtn n="camera" label="Foto delen" onPress={photo} />
        {r && <IBtn n="credit-card" label="Kaart delen" onPress={() => setShare(true)} />}
        <TextInput value={text} onChangeText={setText} placeholder="Bericht" placeholderTextColor={c.muted} onSubmitEditing={send} returnKeyType="send" style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: c.line, paddingHorizontal: 16, fontFamily: F.body, fontSize: 15, color: c.ink, backgroundColor: c.bg }} />
        <IBtn n="send" label="Versturen" onPress={send} />
      </View>
      <Sheet visible={share} onClose={() => setShare(false)}>
        <T v="h2" style={{ fontSize: 18 }}>Kaart delen in chat</T>
        <T v="small">Je stem blijft privé.</T>
        {r?.deck.map(oid => { const o = opt(oid); return <Item key={oid} onPress={() => { setShare(false); post({ type: 'card', oid, text: 'Wat vinden jullie hiervan?' }); }}><Thumb o={o} /><View style={{ flex: 1 }}><T v="b" numberOfLines={1}>{o.t}</T><T v="small">{euro(o.p)}</T></View></Item>; })}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
