import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Modal, useColorScheme, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import Svg, { Rect, G, Path } from 'react-native-svg';
import { gradOf } from '../lib/data';
import { who } from '../lib/store';

const LIGHT = { bg: '#f2f3f9', surface: '#ffffff', surface2: '#e8eaf5', ink: '#11163a', muted: '#5a6087', line: '#dcdfee', primary: '#16205c', onPrimary: '#ffffff', purple: '#7b4dff', purpleSoft: '#ece5ff', purpleInk: '#5a2fe0', yes: '#0fa871', yesSoft: '#dcf7ec', no: '#e63a56', noSoft: '#fde3e7', later: '#e08a00', laterSoft: '#fef1d6', rustig: '#dff1ff', rustigInk: '#0b5a8f', dark: false };
const DARK = { bg: '#0a0d22', surface: '#141936', surface2: '#1e2449', ink: '#eef0ff', muted: '#a1a7cf', line: '#2a3160', primary: '#8f9bff', onPrimary: '#0a0d22', purple: '#9c7bff', purpleSoft: '#2a2156', purpleInk: '#cbb9ff', yes: '#2fd39a', yesSoft: '#123a2f', no: '#ff5f78', noSoft: '#3c1622', later: '#fbb52f', laterSoft: '#3a2a0c', rustig: '#13314a', rustigInk: '#8fd0ff', dark: true };
export const F = { display: 'Unbounded_600SemiBold', displayBold: 'Unbounded_700Bold', body: 'Onest_400Regular', medium: 'Onest_500Medium', semi: 'Onest_600SemiBold', bold: 'Onest_700Bold' };
export function useC() { return useColorScheme() === 'dark' ? DARK : LIGHT; }

export function T({ style, v = 'body', c: color, children, ...p }) {
  const c = useC();
  const base = {
    h1: { fontFamily: F.displayBold, fontSize: 26, lineHeight: 31, color: c.ink },
    h2: { fontFamily: F.display, fontSize: 19, lineHeight: 24, color: c.ink },
    h3: { fontFamily: F.display, fontSize: 14, lineHeight: 19, color: c.ink },
    body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: c.ink },
    b: { fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: c.ink },
    small: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: c.muted },
    eyebrow: { fontFamily: F.semi, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase', color: c.muted },
  }[v];
  return <Text style={[base, color && { color }, style]} {...p}>{children}</Text>;
}

export const Icon = ({ n, s = 20, c }) => { const cc = useC(); return <Feather name={n} size={s} color={c || cc.ink} />; };

export function Logo({ size = 34 }) {
  const c = useC();
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="7" y="10" width="21" height="29" rx="5" fill={c.purple} transform="rotate(-14 17.5 24.5)" />
      <G transform="rotate(9 29 23)">
        <Rect x="18" y="8" width="22" height="30" rx="5" fill={c.primary} />
        <Path d="M23 23l4.5 4.5L35 19" stroke={c.yes} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}
export function Wordmark() { return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Logo /><T v="h3" style={{ fontSize: 17, fontFamily: F.displayBold }}>SamenKiezen</T></View>; }

export function Screen({ children, scroll = true, header, footer, pad = true, contentStyle }) {
  const c = useC(), ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: header === false ? 0 : ins.top }}>
      {header}
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ padding: pad ? 16 : 0, paddingTop: 4, paddingBottom: 32, gap: 18 }, contentStyle]}>{children}</ScrollView> : children}
      {footer}
    </View>
  );
}

export function Header({ title, back = true, right, onBack }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, minHeight: 58 }}>
      {back && <IBtn n="chevron-left" label="Terug" onPress={onBack || (() => router.canGoBack() ? router.back() : router.replace('/home'))} />}
      <View style={{ flex: 1, minWidth: 0 }}>{typeof title === 'string' ? <T v="h3" style={{ fontSize: 17 }} numberOfLines={1}>{title}</T> : title}</View>
      {right}
    </View>
  );
}

export function IBtn({ n, onPress, label, badge, style }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.7 : 1 }, style]}>
      <Icon n={n} />
      {!!badge && <View style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.no, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}><Text style={{ color: '#fff', fontSize: 11, fontFamily: F.bold }}>{badge}</Text></View>}
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = 'primary', icon, sm, disabled, style, flex }) {
  const c = useC();
  const map = { primary: [c.primary, c.onPrimary], ghost: [c.surface, c.ink], purple: [c.purple, '#fff'], danger: [c.noSoft, c.no], yes: [c.yes, '#fff'], wa: ['#25d366', '#05301a'] }[kind];
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [{ height: sm ? 40 : 50, paddingHorizontal: sm ? 14 : 20, borderRadius: sm ? 12 : 15, backgroundColor: map[0], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: c.line, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, flex && { flex: 1 }, style]}>
      {icon && <Icon n={icon} s={sm ? 16 : 18} c={map[1]} />}
      <Text style={{ color: map[1], fontFamily: F.semi, fontSize: sm ? 14 : 15 }} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, style }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }} style={[{ minHeight: 38, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: on ? c.purple : c.line, backgroundColor: on ? c.purpleSoft : c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      {on && <Icon n="check" s={14} c={c.purpleInk} />}
      <Text style={{ fontFamily: on ? F.semi : F.medium, fontSize: 14, color: on ? c.purpleInk : c.ink }}>{label}</Text>
    </Pressable>
  );
}
export function Chips({ dict, sel, onToggle, single, opts }) {
  const entries = opts || Object.entries(dict);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{entries.map(([v, l]) => <Chip key={v} label={l} on={single ? sel === v : sel.includes(v)} onPress={() => onToggle(v)} />)}</View>;
}
export const toggleIn = (arr, v) => { const i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); };

export function Tag({ label, tone }) {
  const c = useC();
  const t = { p: [c.purpleSoft, c.purpleInk], rustig: [c.rustig, c.rustigInk], licht: [c.yesSoft, c.yes], actief: [c.laterSoft, c.later], avontuur: [c.noSoft, c.no], yes: [c.yesSoft, c.yes] }[tone] || [c.surface2, c.ink];
  return <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t[0], justifyContent: 'center' }}><Text style={{ fontSize: 12, fontFamily: F.semi, color: t[1] }} numberOfLines={1}>{label}</Text></View>;
}

export function Box({ children, style }) { const c = useC(); return <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 14 }, style]}>{children}</View>; }
export function Item({ children, onPress, style }) {
  const c = useC();
  const inner = [{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }, style];
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [inner, { opacity: pressed ? 0.8 : 1 }]}>{children}</Pressable> : <View style={inner}>{children}</View>;
}
export function Thumb({ o, emoji, bg, size = 48, children }) {
  const inner = <Text style={{ fontSize: size * 0.5 }}>{o ? o.e : emoji}</Text>;
  if (o && o.poster) return <Image source={{ uri: o.poster }} style={{ width: size, height: size, borderRadius: size * 0.22 }} resizeMode="cover" accessibilityIgnoresInvertColors />;
  if (o) { const g = gradOf(o); return <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.27, alignItems: 'center', justifyContent: 'center' }}>{inner}</LinearGradient>; }
  return <View style={{ width: size, height: size, borderRadius: size * 0.27, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>{children || inner}</View>;
}
export function Poster({ o, style, children, fontSize = 82, contain }) {
  if (o.poster) return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#11163a' }, style]}>
      <Image source={{ uri: o.poster }} blurRadius={contain ? 18 : 0} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: contain ? 0.55 : 1 }} resizeMode="cover" />
      {contain && <Image source={{ uri: o.poster }} style={{ height: '100%', aspectRatio: 2 / 3 }} resizeMode="contain" accessibilityLabel={`Poster van ${o.t}`} />}
      {children}
    </View>
  );
  return <LinearGradient colors={gradOf(o)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ fontSize }}>{o.e}</Text>{children}</LinearGradient>;
}
export function Av({ id, s = 32, ring = true }) {
  const c = useC(); const w = who(id); if (!w) return null;
  return (
    <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: w.col, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: c.surface, overflow: 'hidden' }}>
      {w.photo ? <ImageAv uri={w.photo} s={s} /> : <Text style={{ color: '#fff', fontFamily: F.bold, fontSize: s * 0.42 }}>{(w.n || '?')[0]}</Text>}
    </View>
  );
}
const ImageAv = ({ uri, s }) => <Image source={{ uri }} style={{ width: s, height: s }} />;
export function Avs({ ids, s = 24 }) { return <View style={{ flexDirection: 'row' }}>{ids.map((id, i) => <View key={id} style={{ marginLeft: i ? -8 : 0 }}><Av id={id} s={s} /></View>)}</View>; }
export function Bar({ pct, color, h = 6 }) { const c = useC(); return <View style={{ height: h, borderRadius: h / 2, backgroundColor: c.surface2, overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color || c.purple, borderRadius: h / 2 }} /></View>; }
export function Toggle({ on, onPress, label }) {
  const c = useC();
  return <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: !!on }} accessibilityLabel={label} style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: on ? c.yes : c.surface2, padding: 3 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: on ? 20 : 0 }], shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} /></Pressable>;
}
export function SwitchRow({ title, sub, on, onPress, last }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}><View style={{ flex: 1 }}><T v="b">{title}</T>{sub && <T v="small">{sub}</T>}</View><Toggle on={on} onPress={onPress} label={title} /></View>;
}
export function Field({ label, children }) { return <View style={{ gap: 6 }}><T v="small" style={{ fontFamily: F.semi }}>{label}</T>{children}</View>; }
export function Input(p) {
  const c = useC();
  return <TextInput placeholderTextColor={c.muted} {...p} style={[{ height: 48, borderRadius: 13, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 14, fontFamily: F.body, fontSize: 15, color: c.ink }, p.style]} />;
}
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix = '' }) {
  const c = useC();
  const btn = (n, d) => <Pressable onPress={() => onChange(Math.max(min, Math.min(max, Number(value || 0) + d)))} accessibilityLabel={d > 0 ? 'Meer' : 'Minder'} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon n={n} s={18} /></Pressable>;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, borderRadius: 13, padding: 2 }}>{btn('minus', -step)}<Text style={{ flex: 1, textAlign: 'center', fontFamily: F.semi, fontSize: 16, color: c.ink, fontVariant: ['tabular-nums'] }}>{value === '' ? '–' : value}{suffix}</Text>{btn('plus', step)}</View>;
}
export function Section({ title, right, children }) { return <View style={{ gap: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><T v="h3">{title}</T>{right}</View>{children}</View>; }
export function LinkText({ title, onPress }) { const c = useC(); return <Pressable onPress={onPress} hitSlop={8}><Text style={{ color: c.purpleInk, fontFamily: F.semi, fontSize: 13 }}>{title}</Text></Pressable>; }
export function Empty({ text }) { return <Box><T v="small">{text}</T></Box>; }
export function Tabs({ tabs, value, onChange }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', gap: 4, backgroundColor: c.surface2, padding: 4, borderRadius: 14 }}>{tabs.map(([k, l]) => <Pressable key={k} onPress={() => onChange(k)} style={{ flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: value === k ? c.surface : 'transparent' }}><Text style={{ fontFamily: F.semi, fontSize: 13.5, color: value === k ? c.ink : c.muted }}>{l}</Text></Pressable>)}</View>;
}
export function DL({ rows }) {
  const c = useC();
  return <Box style={{ paddingVertical: 4 }}>{rows.map(([a, b], i) => <View key={a} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: c.line }}><T v="body" c={c.muted} style={{ fontSize: 14 }}>{a}</T><T v="b" style={{ fontSize: 14, flex: 1, textAlign: 'right' }}>{String(b)}</T></View>)}</Box>;
}
export function Warn({ text }) { const c = useC(); return <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.laterSoft }}><Icon n="alert-triangle" c={c.later} /><T v="body" style={{ flex: 1, fontSize: 13.5 }}>{text}</T></View>; }

export function Sheet({ visible, onClose, children }) {
  const c = useC(), ins = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,10,30,.5)' }]} onPress={onClose} accessibilityLabel="Sluiten" />
        <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 + ins.bottom, gap: 14 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center' }} />
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Confirm({ state, setState }) {
  if (!state) return <Sheet visible={false} onClose={() => {}} />;
  return (
    <Sheet visible onClose={() => setState(null)}>
      <T v="h2" style={{ fontSize: 18 }}>{state.title}</T>
      <T v="body" c={undefined} style={{ opacity: 0.75 }}>{state.text}</T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Annuleren" kind="ghost" flex onPress={() => setState(null)} />
        <Btn title={state.ok} kind={state.danger ? 'danger' : 'primary'} flex onPress={() => { const f = state.fn; setState(null); f(); }} />
      </View>
    </Sheet>
  );
}
