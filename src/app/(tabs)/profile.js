import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { TRANS, CUIS, DIETS, GENRES, LVLS, INTS } from '../../lib/data';
import { useStore, mutate, toast, errText, api } from '../../lib/store';
import { useC, T, Screen, Header, Av, Icon, Field, Input, Chips, toggleIn, Stepper, Box, SwitchRow, Item, Thumb, Btn, Section, Confirm } from '../../components/ui';

export default function Profile() {
  const S = useStore(), c = useC(), u = S.user;
  const [cf, setCf] = useState(null);
  const tog = k => v => mutate(s => toggleIn(s.user[k], v));
  const set = k => v => mutate(s => { s.user[k] = v; });
  const photo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (r.canceled) return; try { const url = await api.upload(r.assets[0].uri); mutate(s => { s.user.photo = url; }); toast('Profielfoto opgeslagen'); } catch (e) { toast(errText(e)); }
  };
  return (
    <Screen header={<Header back={false} title="Profiel en voorkeuren" />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={photo} accessibilityLabel="Profielfoto wijzigen">
          <Av id="me" s={72} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: c.purple, alignItems: 'center', justifyContent: 'center' }}><Icon n="camera" s={14} c="#fff" /></View>
        </Pressable>
        <View style={{ flex: 1 }}><T v="h2">{u.name || 'Jij'}</T><T v="small">{u.email}</T></View>
      </View>
      <T v="small">Je persoonlijke voorkeuren bepalen alleen de volgorde van kaarten. Ze laten nooit iets zien buiten de filters van een ronde.</T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Voornaam"><Input value={u.name} onChangeText={set('name')} /></Field></View>
        <View style={{ flex: 1 }}><Field label="Woonplaats"><Input value={u.city} onChangeText={set('city')} /></Field></View>
      </View>
      <Field label="Leeftijdscategorie (optioneel)"><Chips single sel={u.age} opts={[['18-24', '18–24'], ['25-34', '25–34'], ['35-49', '35–49'], ['50+', '50+'], ['', 'Zeg ik liever niet']]} onToggle={set('age')} /></Field>
      <Field label="Standaard reisafstand"><Stepper value={u.km} min={1} max={100} onChange={set('km')} suffix=" km" /></Field>
      <Field label="Vervoer"><Chips dict={TRANS} sel={u.trans} onToggle={tog('trans')} /></Field>
      <Field label="Budget"><Chips single sel={u.budget} opts={[['laag', 'Laag'], ['gemiddeld', 'Gemiddeld'], ['hoog', 'Hoog']]} onToggle={set('budget')} /></Field>
      <Field label="Favoriete keukens"><Chips dict={CUIS} sel={u.cuis} onToggle={tog('cuis')} /></Field>
      <Field label="Dieetwensen"><Chips dict={DIETS} sel={u.diets} onToggle={tog('diets')} /></Field>
      <Field label="Filmgenres"><Chips dict={GENRES} sel={u.genres} onToggle={tog('genres')} /></Field>
      <Field label="Activiteitsniveau"><Chips dict={LVLS} sel={u.lvls} onToggle={tog('lvls')} /></Field>
      <Field label="Interesses en favoriete activiteiten"><Chips dict={INTS} sel={u.ints} onToggle={tog('ints')} /></Field>
      <Field label="Binnen of buiten"><Chips single sel={u.io} opts={[['binnen', 'Binnen'], ['buiten', 'Buiten'], ['beide', 'Beide']]} onToggle={set('io')} /></Field>
      <Field label="Plannen"><Chips single sel={u.plan} opts={[['spontaan', 'Spontaan'], ['reserveren', 'Vooraf reserveren']]} onToggle={set('plan')} /></Field>
      <Field label="Doe ik liever niet"><Chips dict={INTS} sel={u.avoid} onToggle={tog('avoid')} /></Field>
      <Section title="Privacy en meldingen">
        <Box style={{ paddingVertical: 2 }}>
          <SwitchRow title="Locatie gebruiken" sub="Alleen voor afstanden en reistijden. Uit = je woonplaats wordt gebruikt." on={u.loc} onPress={() => { mutate(s => { s.user.loc = !s.user.loc; }); toast(!u.loc ? 'Locatie aan.' : 'Locatie uit. Je woonplaats wordt gebruikt.'); }} />
          <SwitchRow last title="Meldingen" sub="Nieuwe rondes, herinneringen en matches." on={u.notif} onPress={() => mutate(s => { s.user.notif = !s.user.notif; })} />
        </Box>
        <T v="small">Alleen groepsleden zien groepsinformatie. Niemand ziet jouw swipes. We verkopen nooit persoonsgegevens.</T>
      </Section>
      <Item onPress={() => router.push('/data')}>
        <Thumb bg={c.purpleSoft}><Icon n="database" s={22} c={c.purpleInk} /></Thumb>
        <View style={{ flex: 1 }}><T v="b">Datamodel en filterlogica</T><T v="small">Database-opzet en architectuur</T></View>
        <Icon n="chevron-right" s={18} c={c.muted} />
      </Item>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Uitloggen" kind="ghost" flex onPress={async () => { await api.signOut(); router.replace('/'); }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Data verwijderen" kind="danger" flex onPress={() => setCf({ title: 'Alle persoonsgegevens verwijderen?', text: 'Je voorkeuren en profielfoto worden gewist. Je account en groepen blijven bestaan.', ok: 'Verwijderen', danger: true, fn: () => { mutate(s => { Object.assign(s.user, { photo: '', city: '', age: '', cuis: [], diets: [], genres: [], ints: [], lvls: [], avoid: [], trans: [], loc: false }); }); toast('Voorkeuren en profielfoto verwijderd'); } })} />
        <Btn title="Account verwijderen" kind="danger" flex onPress={() => setCf({ title: 'Account definitief verwijderen?', text: 'Je account, groepslidmaatschappen en al je gegevens worden gewist. Dit kun je niet ongedaan maken.', ok: 'Account verwijderen', danger: true, fn: async () => { try { await api.deleteAccount(); router.replace('/'); toast('Je account is verwijderd'); } catch (e) { toast(errText(e)); } } })} />
      </View>
      <T v="small" style={{ textAlign: 'center' }}>SamenKiezen 1.0</T>
      <Confirm state={cf} setState={setCf} />
    </Screen>
  );
}
