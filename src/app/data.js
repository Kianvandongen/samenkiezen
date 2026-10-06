import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SQL } from '../lib/schema';
import { toast } from '../lib/store';
import { useC, T, Screen, Header, Section, Box, LinkText } from '../components/ui';

const LOGIC = `eligible(optie, ronde) =
  (cats ∩ ronde.cats ≠ ∅ of ronde.cats leeg)
  EN (niveau ∈ ronde.niveaus of leeg of 'gemengd')
  EN (sferen ∩ ronde.sferen ≠ ∅ of leeg)
  EN (interesses ∩ ronde.interesses ≠ ∅ of leeg)
  EN budget_min ≤ prijs ≤ budget_max
  EN afstand ≤ min(max_km, bereik(vervoer))
  EN open op datum en tijdslot EN groepsgrootte past
  EN binnen/buiten, reservering, alcohol, leeftijd,
     toegankelijkheid, dieet, kind, huisdier

volgorde = beoordeling + persoonlijke match
         + groepsprofiel + geleerde ja/nee-ratio`;

function Code({ text }) {
  const c = useC();
  return <ScrollView horizontal style={{ backgroundColor: c.surface2, borderRadius: 14 }} contentContainerStyle={{ padding: 14 }}><Text selectable style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 18, color: c.ink }}>{text}</Text></ScrollView>;
}
export default function Data() {
  return (
    <Screen header={<Header title="Datamodel en logica" />}>
      <Section title="Filterregel">
        <Box><T v="body" style={{ fontSize: 14 }}>Binnen één filtergroep geldt OF, tussen groepen EN. Een lege groep is geen beperking. Persoonlijke voorkeuren en groepsleren sorteren alleen binnen dat kader.</T></Box>
        <Code text={LOGIC} />
      </Section>
      <Section title="Database (PostgreSQL / Supabase)" right={<LinkText title="Kopieer SQL" onPress={async () => { await Clipboard.setStringAsync(SQL); toast('SQL gekopieerd'); }} />}><Code text={SQL} /></Section>
      <Section title="Koppelingen (na MVP)"><Box><T v="body" style={{ fontSize: 14 }}>Google Maps en Places · TMDB · streaming- en bioscoopdata · weer · Google/Apple/Outlook Calendar · WhatsApp-delen · reserveringen · betaalverzoeken · pushmeldingen. In deze testversie staat realistische voorbeelddata op dezelfde velden.</T></Box></Section>
    </Screen>
  );
}
