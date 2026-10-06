import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { searchLocations, reverseLocation } from '../lib/places';
import { useC, F, T, Input, Icon } from './ui';

// Zoekveld zoals in Maps: typen geeft een lijst met plaats, provincie en land. Pas na kiezen is de locatie vast.
export function LocationField({ value, picked, onPick, onClear, placeholder = 'Zoek plaats, wijk of adres' }) {
  const c = useC();
  const [q, setQ] = useState(value || '');
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ctl = useRef(null);

  useEffect(() => { setQ(value || ''); }, [value]);
  useEffect(() => {
    if (!open || q.trim().length < 2) { setList([]); return; }
    setBusy(true); setErr('');
    const t = setTimeout(async () => {
      ctl.current?.abort(); const a = (ctl.current = new AbortController());
      try { const r = await searchLocations(q, a.signal); if (!a.signal.aborted) { setList(r); setBusy(false); } }
      catch (e) { if (!a.signal.aborted) { setErr('Zoeken lukt nu niet. Controleer je internet.'); setBusy(false); } }
    }, 280);
    return () => clearTimeout(t);
  }, [q, open]);

  const choose = it => { setOpen(false); setList([]); setQ(it.label); onPick(it); };
  const useGps = () => {
    if (Platform.OS !== 'web' || !navigator.geolocation) return setErr('Locatie delen werkt hier niet. Typ je plaats.');
    setBusy(true); setErr('');
    navigator.geolocation.getCurrentPosition(
      async p => { try { choose(await reverseLocation(p.coords.latitude, p.coords.longitude)); } catch { setErr('Locatie niet gevonden.'); } setBusy(false); },
      () => { setBusy(false); setErr('Geen toestemming voor je locatie. Typ je plaats.'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <View style={{ gap: 6, zIndex: 10 }}>
      <View>
        <Input value={q} placeholder={placeholder} autoCorrect={false} autoComplete="off"
          onFocus={() => setOpen(true)}
          onChangeText={t => { setQ(t); setOpen(true); if (picked) onClear(); }}
          style={{ paddingRight: 40, borderColor: picked ? c.yes : open && q ? c.purple : c.line }} />
        <View style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
          {busy ? <ActivityIndicator size="small" color={c.purple} /> : picked ? <Icon n="check-circle" s={20} c={c.yes} /> : <Icon n="search" s={18} c={c.muted} />}
        </View>
      </View>
      {open && list.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, backgroundColor: c.surface, overflow: 'hidden', shadowColor: '#16205c', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
          {list.map((it, i) => (
            <Pressable key={it.id + i} onPress={() => choose(it)} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: pressed ? c.surface2 : 'transparent', borderTopWidth: i ? 1 : 0, borderTopColor: c.line })}>
              <Icon n="map-pin" s={18} c={c.purple} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 15, color: c.ink }} numberOfLines={1}>{it.main}</Text>
                <Text style={{ fontFamily: F.body, fontSize: 12.5, color: c.muted }} numberOfLines={1}>{[it.kind, it.sub].filter(Boolean).join(' · ')}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {open && !busy && !err && q.trim().length >= 2 && !list.length && <T v="small">Niets gevonden. Probeer een andere spelling of alleen de plaatsnaam.</T>}
      {!!err && <T v="small" c={c.no}>{err}</T>}
      {!picked && q.trim().length > 0 && !open && <T v="small" c={c.later}>Kies een plaats uit de lijst, dan weet de app zeker welke je bedoelt.</T>}
      <Pressable onPress={useGps} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4 }}>
        <Icon n="navigation" s={14} c={c.purple} /><Text style={{ fontFamily: F.semi, fontSize: 13, color: c.purpleInk }}>Gebruik mijn huidige locatie</Text>
      </Pressable>
    </View>
  );
}
