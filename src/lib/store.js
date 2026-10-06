import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPTS, LVLS, INTS, CUIS, GENRES, REACH, SPEED, FOODCATS, STREAMS, CATS as CATS_L, opt } from './data';
import { sb } from './supabase';
import { ensureTitles } from './catalog';
import { ensurePlaces, kmBetween } from './places';

/* ============ Hulpfuncties ============ */
export const uid = () => Math.random().toString(36).slice(2, 9);
export function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseT = t => { const [a, b] = String(t || '0:0').split(':').map(Number); return a + (b || 0) / 60; };
export const fmtH = h => `${pad(Math.floor(h) % 24)}:${pad(Math.round((h % 1) * 60))}`;
export const DAYN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const DAYL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const MON = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
export const dateNice = s => { const d = new Date(s + 'T12:00'); return `${DAYL[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
export const euro = p => p == null ? 'Onbekend' : p === 0 ? 'Gratis' : '€' + (Number.isInteger(p) ? p : p.toFixed(2).replace('.', ','));
export const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'zojuist' : m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' u' : Math.round(m / 1440) + ' d'; };
export const durStr = m => !m ? '–' : m >= 1440 ? `${Math.round(m / 1440)} dagen` : m >= 60 ? `${Math.floor(m / 60)}u${m % 60 ? pad(m % 60) : ''}` : `${m} min`;
const localDT = iso => { if (!iso) return ''; const d = new Date(iso); return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ============ Store ============ */
const LOCAL_KEY = 'samenkiezen-local-v2';
export let S = null;
export let UID = null;
let version = 0;
const listeners = new Set();
const evListeners = new Set();
export const ui = { toast: null };
const defaultPrefs = () => ({ city: '', age: '', km: 15, trans: ['fiets', 'auto'], budget: 'gemiddeld', cuis: [], diets: [], genres: [], ints: [], lvls: [], io: 'beide', plan: 'spontaan', avoid: [], loc: false, notif: true });
const emptyState = () => ({ v: 2, onboarded: false, authed: false, loaded: false, user: { id: null, name: '', email: '', photo: '', col: '#16205c', ...defaultPrefs() }, groups: [], rounds: [], matches: [], msgs: [], notifs: [], profiles: {} });

function emit() { version++; listeners.forEach(l => l()); }
function saveLocal() { AsyncStorage.setItem(LOCAL_KEY, JSON.stringify({ onboarded: S.onboarded, notifs: S.notifs.slice(0, 60) })).catch(() => {}); }
export function commit() { emit(); saveLocal(); persistDiff(); }
export function mutate(fn) { fn(S); commit(); }
export function useStore() { useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => version); return S; }
export function onEvent(fn) { evListeners.add(fn); return () => evListeners.delete(fn); }
function fire(e) { evListeners.forEach(f => f(e)); }
let toastT;
export function toast(text) { ui.toast = text; emit(); clearTimeout(toastT); toastT = setTimeout(() => { ui.toast = null; emit(); }, 3400); }
export const errText = e => {
  const m = String(e?.message || e || '');
  if (/onbekende code/.test(m)) return 'Deze code bestaat niet. Controleer de code of vraag om een nieuwe uitnodiging.';
  if (/Invalid login/i.test(m)) return 'E-mail of wachtwoord klopt niet.';
  if (/Email not confirmed/i.test(m)) return 'Bevestig eerst je e-mailadres via de link in je mail.';
  if (/already registered/i.test(m)) return 'Er bestaat al een account met dit e-mailadres. Log in.';
  if (/rate limit/i.test(m)) return 'Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.';
  if (/Failed to fetch|Network/i.test(m)) return 'Geen verbinding. Controleer je internet en probeer het opnieuw.';
  return m || 'Er ging iets mis. Probeer het opnieuw.';
};
const fail = e => { toast(errText(e)); };

/* ============ Laden en synchroniseren ============ */
export async function loadStore() {
  S = emptyState();
  try { const raw = await AsyncStorage.getItem(LOCAL_KEY); const p = raw && JSON.parse(raw); if (p) { S.onboarded = !!p.onboarded; S.notifs = p.notifs || []; } } catch (e) {}
  const { data } = await sb.auth.getSession();
  if (data.session) await startSession(data.session); else emit();
  sb.auth.onAuthStateChange((evt, session) => {
    if (evt === 'PASSWORD_RECOVERY') { S.recovery = true; emit(); }
    if (evt === 'SIGNED_OUT') { stopSession(); S = { ...emptyState(), onboarded: S.onboarded, notifs: [] }; emit(); }
    else if (session && session.user.id !== UID) startSession(session);
  });
}

let channel = null, refreshT = null, firstLoad = true, closing = new Set();
async function startSession(session) {
  UID = session.user.id; S.authed = true; S.onboarded = true; S.user.id = UID; S.user.email = session.user.email || '';
  firstLoad = true;
  await refresh();
  if (channel) sb.removeChannel(channel);
  channel = sb.channel('samenkiezen-' + UID)
    .on('postgres_changes', { event: '*', schema: 'public' }, () => scheduleRefresh())
    .subscribe();
}
function stopSession() { if (channel) sb.removeChannel(channel); channel = null; UID = null; }
export function scheduleRefresh(ms = 250) { clearTimeout(refreshT); refreshT = setTimeout(refresh, ms); }

const me = id => (id === UID ? 'me' : id);
const unme = id => (id === 'me' ? UID : id);
let saved = { profile: '', groups: {} };

export async function refresh() {
  if (!UID) return;
  const q = await Promise.all([
    sb.from('profiles').select('id,name,color,photo_url,prefs'),
    sb.from('groups').select('*').order('created_at'),
    sb.from('group_members').select('*').order('joined_at'),
    sb.from('rounds').select('*').order('created_at', { ascending: false }),
    sb.from('votes').select('round_id,option_id,vote').eq('user_id', UID),
    sb.from('vote_progress').select('*'),
    sb.from('matches').select('*').order('matched_at', { ascending: false }),
    sb.from('messages').select('*').order('created_at', { ascending: false }).limit(400),
    sb.from('final_votes').select('*'),
  ]);
  const err = q.find(x => x.error); if (err) { if (!firstLoad) return; toast(errText(err.error)); }
  const [pr, gr, gm, rr, vv, vp, mm, ms, fv] = q.map(x => x.data || []);
  const prev = { rounds: new Set(S.rounds.map(r => r.id)), matches: new Set(S.matches.map(m => m.id)), finals: new Set(S.matches.filter(m => m.final).map(m => m.id)) };

  const mine = pr.find(p => p.id === UID);
  if (mine) {
    S.user = { ...S.user, ...defaultPrefs(), ...(mine.prefs || {}), id: UID, name: mine.name, photo: mine.photo_url || '', col: mine.color };
    saved.profile = profileKey();
  }
  S.profiles = Object.fromEntries(pr.map(p => [me(p.id), { n: p.name || 'Iemand', col: p.color, photo: p.photo_url || '' }]));
  S.groups = gr.map(g => ({ id: g.id, name: g.name, e: g.emoji, col: g.color, code: g.code, prefs: { ...newGroupPrefs(), ...(g.prefs || {}) }, learn: g.learn || {}, members: gm.filter(m => m.group_id === g.id).map(m => ({ id: me(m.user_id), role: m.role, active: m.active ? 1 : 0 })) }));
  saved.groups = Object.fromEntries(S.groups.map(g => [g.id, JSON.stringify(g.prefs)]));
  S.rounds = rr.map(r => {
    const f = r.filters || {};
    const myv = vv.filter(v => v.round_id === r.id);
    return {
      ...baseRound({}), ...f, id: r.id, gid: r.group_id, by: me(r.created_by), title: r.title, deck: r.deck || [],
      rule: { type: 'unaniem', pct: 70, ...(r.rule || {}), pair: (r.rule?.pair || []).map(me) },
      deadline: localDT(r.deadline), status: r.status, vetoed: r.vetoed || [], created: Date.parse(r.created_at),
      votes: { me: Object.fromEntries(myv.filter(v => v.vote !== 'l').map(v => [v.option_id, v.vote])) },
      saved: myv.filter(v => v.vote === 'l').map(v => v.option_id),
      progress: Object.fromEntries(vp.filter(p => p.round_id === r.id).map(p => [me(p.user_id), p.n])),
      finale: Object.fromEntries(fv.filter(x => x.round_id === r.id).map(x => [me(x.user_id), x.option_id])),
    };
  });
  const deckOf = Object.fromEntries(S.rounds.map(r => [r.id, new Set(r.deck)]));
  S.matches = mm.filter(m => m.final || !deckOf[m.round_id] || deckOf[m.round_id].has(m.option_id)).map(m => ({ id: m.id, rid: m.round_id, oid: m.option_id, type: m.match_type, at: Date.parse(m.matched_at), final: m.final, yes: m.yes_count, act: m.active_count }));
  S.msgs = ms.slice().reverse().map(m => ({ id: m.id, gid: m.group_id, rid: m.round_id || '', uid: m.user_id ? me(m.user_id) : '', type: m.type, text: m.text, img: m.image_url, oid: m.option_id, at: Date.parse(m.created_at), re: Object.fromEntries(Object.entries(m.reactions || {}).map(([k, v]) => [me(k), v])) }));

  try { const ids = [...S.rounds.flatMap(r => r.deck), ...S.matches.map(m => m.oid), ...S.msgs.filter(m => m.oid).map(m => m.oid)]; await Promise.all([ensureTitles(ids), ensurePlaces(ids)]); } catch (e) {}

  if (!firstLoad) {
    S.rounds.filter(r => !prev.rounds.has(r.id) && r.by !== 'me').forEach(r => { const g = grp(r.gid); notify('ronde', `${nameOf(r.by)} startte "${r.title}" in ${g?.name || 'je groep'}.`, r.id); toast(`Nieuwe ronde: ${r.title}`); });
    S.matches.filter(m => !prev.matches.has(m.id) && rnd(m.rid)).forEach(m => { const t = matchText(m); notify('match', t, m.id); toast(t); fire({ type: 'match', match: m }); });
    S.matches.filter(m => m.final && !prev.finals.has(m.id) && rnd(m.rid)).forEach(m => notify('match', `${opt(m.oid)?.t} is definitief gekozen voor "${rnd(m.rid).title}".`, m.id));
  }
  firstLoad = false; S.loaded = true;
  // Rondes met een verlopen deadline afronden
  S.rounds.filter(r => r.status === 'active' && r.deadline && new Date(r.deadline) < new Date() && ['deadline', 'willekeurig'].includes(r.rule.type) && !closing.has(r.id))
    .forEach(r => { closing.add(r.id); sb.rpc('close_round', { rid: r.id }).then(() => scheduleRefresh()); });
  emit(); saveLocal();
}

/* ============ Wijzigingen terugschrijven ============ */
const PREF_KEYS = Object.keys(defaultPrefs());
const profileKey = () => JSON.stringify([S.user.name, S.user.photo, PREF_KEYS.map(k => S.user[k])]);
let persistT;
function persistDiff() {
  if (!UID || !S.loaded) return;
  clearTimeout(persistT);
  persistT = setTimeout(async () => {
    if (profileKey() !== saved.profile) {
      saved.profile = profileKey();
      const prefs = Object.fromEntries(PREF_KEYS.map(k => [k, S.user[k]]));
      const { error } = await sb.from('profiles').update({ name: (S.user.name || '').trim() || 'Ik', photo_url: S.user.photo || null, prefs }).eq('id', UID);
      if (error) fail(error);
    }
    for (const g of S.groups) {
      const k = JSON.stringify(g.prefs);
      if (saved.groups[g.id] !== k) { saved.groups[g.id] = k; const { error } = await sb.rpc('update_group_prefs', { gid: g.id, p_prefs: g.prefs }); if (error) fail(error); }
    }
  }, 700);
}

/* ============ API ============ */
export const api = {
  async signUp(name, email, password) {
    const redirect = typeof window !== 'undefined' && window.location ? window.location.origin : undefined;
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirect } });
    if (error) throw error;
    return !!data.session;
  },
  async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async resetPassword(email) { const redirectTo = typeof window !== 'undefined' && window.location ? window.location.origin + '/nieuw-wachtwoord' : undefined; const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo }); if (error) throw error; },
  async setPassword(password) { const { error } = await sb.auth.updateUser({ password }); if (error) throw error; S.recovery = false; },
  async signOut() { await sb.auth.signOut(); },
  async deleteAccount() { const { error } = await sb.functions.invoke('delete-account', { method: 'POST' }); if (error) throw error; await sb.auth.signOut(); },
  async createGroup(name, emoji, color, prefs) { const { data, error } = await sb.rpc('create_group', { p_name: name, p_emoji: emoji, p_color: color, p_prefs: prefs }); if (error) throw error; await refresh(); return data; },
  async joinGroup(code) { const { data, error } = await sb.rpc('join_group', { p_code: code }); if (error) throw error; await refresh(); return data; },
  async leaveGroup(gid) { const { error } = await sb.from('group_members').delete().eq('group_id', gid).eq('user_id', UID); if (error) throw error; await refresh(); },
  async deleteGroup(gid) { const { error } = await sb.from('groups').delete().eq('id', gid); if (error) throw error; await refresh(); },
  async member(gid, pid, action) {
    const m = grp(gid)?.members.find(x => x.id === pid); if (!m) return;
    const q = sb.from('group_members');
    const res = action === 'remove' ? await q.delete().eq('group_id', gid).eq('user_id', unme(pid))
      : action === 'toggle_admin' ? await q.update({ role: m.role === 'beheerder' ? 'lid' : 'beheerder' }).eq('group_id', gid).eq('user_id', unme(pid))
      : await q.update({ active: !m.active }).eq('group_id', gid).eq('user_id', unme(pid));
    if (res.error) throw res.error; await refresh();
  },
  async createRound(d, deck) {
    const skip = ['id', 'gid', 'by', 'title', 'rule', 'deadline', 'status', 'created', 'votes', 'saved', 'vetoed', 'progress', 'finale', 'deck'];
    const filters = Object.fromEntries(Object.entries(d).filter(([k]) => !skip.includes(k)));
    const rule = { ...d.rule, pair: d.rule.pair.map(unme) };
    const deadline = d.deadline ? new Date(d.deadline).toISOString() : null;
    const { data, error } = await sb.rpc('create_round', { gid: d.gid, p_title: d.title.trim() || 'Nieuwe ronde', p_filters: filters, p_deck: deck, p_rule: rule, p_deadline: deadline });
    if (error) throw error; await refresh(); return data;
  },
  async updateRound(rid, d, deck) {
    const skip = ['id', 'gid', 'by', 'title', 'rule', 'deadline', 'status', 'created', 'votes', 'saved', 'vetoed', 'progress', 'finale', 'deck'];
    const filters = Object.fromEntries(Object.entries(d).filter(([k]) => !skip.includes(k)));
    const rule = { ...d.rule, pair: d.rule.pair.map(unme) };
    const deadline = d.deadline ? new Date(d.deadline).toISOString() : null;
    const { error } = await sb.rpc('update_round', { rid, p_title: d.title.trim() || 'Nieuwe ronde', p_filters: filters, p_deck: deck, p_rule: rule, p_deadline: deadline });
    if (error) throw error; await refresh();
  },
  async closeRound(rid) { const { error } = await sb.rpc('close_round', { rid }); if (error) throw error; await refresh(); },
  async finalize(mid) { const { error } = await sb.rpc('finalize_match', { mid }); if (error) throw error; await refresh(); },
  async finalVote(rid, oid) { const { error } = await sb.from('final_votes').insert({ round_id: rid, user_id: UID, option_id: oid }); if (error) throw error; await refresh(); },
  async send(gid, rid, o) {
    const row = { group_id: gid, round_id: rid || null, user_id: UID, type: o.type || 'text', text: o.text || '', image_url: o.img || null, option_id: o.oid || null };
    const { error } = await sb.from('messages').insert(row); if (error) throw error; scheduleRefresh(50);
  },
  async react(mid, e) { const { error } = await sb.rpc('react', { mid, p_emoji: e }); if (error) throw error; scheduleRefresh(50); },
  async upload(uri) {
    const res = await fetch(uri); const blob = await res.blob();
    const type = ['image/png', 'image/webp'].includes(blob.type) ? blob.type : 'image/jpeg';
    const path = `${UID}/${Date.now()}.${type.split('/')[1].replace('jpeg', 'jpg')}`;
    const buf = await new Response(blob).arrayBuffer();
    const { error } = await sb.storage.from('media').upload(path, buf, { contentType: type });
    if (error) throw error;
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  },
};

/* ============ Selectors ============ */
export const who = id => id === 'me' ? { n: S.user.name || 'Jij', col: S.user.col || '#16205c', me: 1, photo: S.user.photo } : (S.profiles[id] || { n: 'Iemand', col: '#8a8fb0' });
export const nameOf = id => id === 'me' ? 'Jij' : (S.profiles[id]?.n || 'Iemand');
export const grp = id => S.groups.find(g => g.id === id);
export const rnd = id => S.rounds.find(r => r.id === id);
export const actives = r => (grp(r.gid)?.members || []).filter(m => m.active);
export const vote = (r, p, o) => p === 'me' ? r.votes.me[o] : undefined;
export const vetoed = (r, o) => r.rule.type === 'veto' && r.vetoed.includes(o);
export const remaining = r => {
  const idx = {}; r.deck.forEach((o, i) => { idx[o] = i; });
  const left = r.deck.filter(o => !r.votes.me[o] && !r.saved.includes(o) && !vetoed(r, o) && opt(o) && !opt(o).hide);
  // Iedereen krijgt grofweg dezelfde volgorde (meer kans op matches); binnen blokken van 20 sorteren persoonlijke voorkeuren.
  return left.sort((a, b) => (Math.floor(idx[a] / 20) - Math.floor(idx[b] / 20)) || (rankScore(opt(b), r) - rankScore(opt(a), r)));
};
export const doneCount = (r, p) => p === 'me' ? Object.keys(r.votes.me).length + r.saved.length : (r.progress[p] || 0);
export const isAdmin = g => g?.members.find(m => m.id === 'me')?.role === 'beheerder';

/* ============ Stemmen ============ */
export function castVote(r, pid, oid, v) {
  if (pid !== 'me') return;
  const o = opt(oid);
  if (v === 'l') { if (!r.saved.includes(oid)) r.saved.push(oid); delete r.votes.me[oid]; }
  else { r.votes.me[oid] = v; r.saved = r.saved.filter(x => x !== oid); }
  sb.from('votes').upsert({ round_id: r.id, user_id: UID, option_id: oid, vote: v, tags: [o.l, ...o.m, ...o.i] }, { onConflict: 'round_id,user_id,option_id' })
    .then(({ error }) => { if (error) { fail(error); scheduleRefresh(); } });
}
export function unvote(r, oid) {
  delete r.votes.me[oid]; r.saved = r.saved.filter(x => x !== oid);
  sb.from('votes').delete().eq('round_id', r.id).eq('user_id', UID).eq('option_id', oid)
    .then(({ error }) => { if (error) { fail(error); scheduleRefresh(); } });
}

/* ============ Filterlogica (hard) ============
   Binnen één filtergroep OF, tussen groepen EN, lege groep = geen beperking. */
/* ============ Nieuwe rondes (v2): eerst kiezen wat je wil doen, dan per onderdeel de interesses ============ */
export const MAIN = {
  kijken: { l: 'Film of serie kijken', e: '🍿', sub: 'Netflix en Prime Video', cats: [] },
  activiteit: { l: 'Activiteit', e: '🎳', sub: 'Bowlen, escape room, karten…', cats: ['activiteit', 'sport', 'workshop'] },
  uiteten: { l: 'Uit eten', e: '🍝', sub: 'Restaurant in de buurt', cats: ['uiteten'] },
  bestellen: { l: 'Eten bestellen', e: '🛵', sub: 'Bezorgd aan huis', cats: ['bestellen'] },
  koffie: { l: 'Koffie, lunch of brunch', e: '☕', sub: 'Overdag iets drinken of eten', cats: ['koffie'] },
  uitgaan: { l: 'Borrel of uitgaan', e: '🍻', sub: 'Café, karaoke, club', cats: ['borrel', 'uitgaan'] },
  dagje: { l: 'Dagje weg of weekendje', e: '🧭', sub: 'Stad, natuur, overnachten', cats: ['dagje', 'weekend', 'vakantie'] },
  wellness: { l: 'Wellness', e: '🧖', sub: 'Sauna en ontspannen', cats: ['wellness'] },
  thuis: { l: 'Thuis iets doen', e: '🎲', sub: 'Spelletjes, koken, karaoke', cats: ['thuis'] },
};
export const DAYPARTS = { ochtend: ['Ochtend', 9, 12], middag: ['Middag', 12, 17], avond: ['Avond', 18, 23], nacht: ['Laat op de avond', 21, 26], dag: ['Hele dag', 10, 22] };
export const sectionsOf = main => {
  const s = [];
  if (main.includes('kijken')) s.push('kijken');
  if (main.includes('activiteit')) s.push('activiteit');
  if (main.some(m => ['uiteten', 'bestellen', 'koffie'].includes(m))) s.push('eten');
  if (main.some(m => ['uitgaan', 'dagje', 'wellness', 'thuis'].includes(m))) s.push('sfeer');
  return s;
};
export const needsPlace = main => main.some(m => !['kijken', 'thuis'].includes(m));
export const needsBudget = main => main.some(m => m !== 'kijken');
const num = v => (v === 'any' || v === null || v === undefined || v === '') ? Infinity : Number(v);
function failsV2(o, r) {
  const f = [], has = (a, b) => a.some(x => b.includes(x));
  const mains = r.main.filter(m => MAIN[m].cats.some(c => o.c.includes(c)));
  if (!mains.length) return ['categorie'];
  // Met een gekozen locatie tellen alleen echte plekken (geen voorbeelddata met vaste afstand)
  if (r.lat != null && !o.osm && o.km > 0) return ['locatie'];
  const sectionOk = m => {
    if (m === 'activiteit') {
      if (r.lvls.length && !r.lvls.includes('gemengd') && !r.lvls.includes(o.l)) return false;
      if (!r.intsAll && r.ints.length && !has(o.i, r.ints)) return false;
      if (r.io && r.io !== 'any' && ((r.io === 'binnen' && o.io === 'buiten') || (r.io === 'buiten' && o.io === 'binnen'))) return false;
      return true;
    }
    if (['uiteten', 'bestellen'].includes(m)) {
      // Echte plekken zonder bekende keuken of dieetinfo vallen niet weg (onbekend ≠ nee), ze komen wel lager
      const cus = o.cus && o.cus.length ? o.cus : o.cu ? [o.cu] : [];
      if (!r.cuisAll && r.cuis.length && !(cus.some(x => r.cuis.includes(x)) || (o.osm && !cus.length))) return false;
      if (r.diets.length && !r.diets.every(d => o.di.includes(d)) && !(o.osm && !o.di.length)) return false;
      return true;
    }
    if (m === 'koffie') return !r.diets.length || r.diets.every(d => o.di.includes(d)) || (o.osm && !o.di.length);
    if (!r.moodsAll && r.moods.length && !has(o.m, r.moods)) return false;
    return true;
  };
  if (!mains.some(sectionOk)) f.push('interesses');
  if (o.p != null && o.p > num(r.bmax)) f.push('budget');
  const km = kmTo(o, r);
  if (km > 0) {
    let k = num(r.km);
    if (r.trans.length && !o.del) k = Math.min(k, Math.max(...r.trans.map(t => REACH[t])));
    if (km > k) f.push('afstand');
  }
  if (o.h && o.h[1] < 48 && r.date && r.dayPart) {
    const day = new Date(r.date + 'T12:00').getDay(), [, s, e] = DAYPARTS[r.dayPart];
    const need = Math.min(o.dur / 60, e - s);
    if (!o.d.includes(String(day))) f.push('dag');
    else if (o.h[1] < s + need || o.h[0] > e - need) f.push('tijd');
  }
  if (r.size && (r.size < o.g[0] || r.size > o.g[1])) f.push('groepsgrootte');
  return f;
}
export function roundChips(r) {
  if (r.v !== 2) return [...r.cats.map(x => CATS_L[x] || x), ...r.lvls.map(x => LVLS[x]), `Max. €${r.bmax}`, `${r.km} km`];
  const out = r.main.map(m => MAIN[m].l);
  if (r.main.includes('kijken')) { out.push(...r.film.streams.map(s => STREAMS[s])); out.push(...(r.film.allGenres ? [] : r.film.genres.map(g => GENRES[g]))); if (r.film.minRating) out.push(`Score ${r.film.minRating}+`); }
  out.push(...r.lvls.map(x => LVLS[x]));
  if (needsBudget(r.main) && r.bmax && r.bmax !== 'any') out.push(`Max. €${r.bmax}`);
  if (needsPlace(r.main) && r.loc) out.push(`📍 ${r.loc.split(',')[0]}`);
  if (needsPlace(r.main) && r.km && r.km !== 'any') out.push(`${r.km} km`);
  if (r.dayPart) out.push(DAYPARTS[r.dayPart][0]);
  return out;
}
export function effKm(r) { let k = Number(r.km) || 0; if (r.trans.length) k = Math.min(k, Math.max(...r.trans.map(t => REACH[t]))); return k; }
export function fails(o, r) {
  if (r.v === 2) return failsV2(o, r);
  const f = [], has = (a, b) => a.some(x => b.includes(x));
  if (r.cats.length && !has(o.c, r.cats)) f.push('categorie');
  if (r.lvls.length && !r.lvls.includes('gemengd') && !r.lvls.includes(o.l)) f.push('activiteitsniveau');
  if (r.moods.length && !has(o.m, r.moods)) f.push('sfeer');
  if (r.ints.length && !has(o.i, r.ints)) f.push('interesse');
  if (o.p > Number(r.bmax) || o.p < Number(r.bmin || 0)) f.push('budget');
  if (o.km > (o.del ? Number(r.km) : effKm(r))) f.push('afstand');
  if (o.h[1] < 48) {
    const day = new Date(r.date + 'T12:00').getDay();
    if (!o.d.includes(String(day))) f.push('dag');
    else { const s = parseT(r.start); let e = parseT(r.end); if (e <= s) e += 24; const need = Math.min(o.dur / 60, e - s); if (o.h[0] > s || o.h[1] < s + need) f.push('tijd'); }
  }
  const n = Number(r.size) || 1; if (n < o.g[0] || n > o.g[1]) f.push('groepsgrootte');
  if (r.io.length === 1 && ((r.io[0] === 'binnen' && o.io === 'buiten') || (r.io[0] === 'buiten' && o.io === 'binnen'))) f.push('binnen/buiten');
  if (r.book === 'nee' && o.b) f.push('reservering');
  if (r.alc === 'nee' && o.alc === 'req') f.push('alcohol');
  if (r.age && o.age > Number(r.age)) f.push('leeftijd');
  if (r.wheel && !o.w) f.push('toegankelijkheid');
  if (r.diets.length && o.food && !r.diets.every(d => o.di.includes(d))) f.push('dieet');
  if (r.kid && !o.kid) f.push('kindvriendelijk');
  if (r.pet && !o.pet) f.push('huisdier');
  if (o.plat && (r.streams || []).length && !r.streams.some(s => o.plat.includes(STREAMS[s]))) f.push('streamingdienst');
  if (o.tmdb && (r.genres || []).length && !o.genres.some(g => r.genres.includes(g))) f.push('genre');
  if (o.tmdb && r.minRating && o.score10 < r.minRating) f.push('beoordeling');
  return f;
}
export const eligibleList = (r, extra = []) => [...OPTS, ...extra].filter(o => !fails(o, r).length);
// Statische opties en catalogustitels proportioneel mengen
export function mergeDeck(statics, titles) {
  if (!statics.length) return titles.map(o => o.id);
  if (!titles.length) return statics.map(o => o.id);
  const out = [], k = titles.length / statics.length; let ti = 0;
  statics.forEach((o, i) => { out.push(o.id); const until = Math.round((i + 1) * k); while (ti < until && ti < titles.length) out.push(titles[ti++].id); });
  while (ti < titles.length) out.push(titles[ti++].id);
  return out;
}

/* ============ Volgorde (zacht) — alleen binnen het kader ============ */
export function rankScore(o, r) {
  const u = S.user, g = grp(r.gid), gp = g?.prefs || {}, tags = [o.l, ...o.m, ...o.i]; let s = (o.r ?? 4.2) * 10;
  if (o.osm) {
    s += Math.max(0, 8 - kmTo(o, r) / 2);
    if (r.v === 2 && !r.cuisAll && r.cuis?.length && !(o.cus || []).some(x => r.cuis.includes(x))) s -= 8;
    if (r.v === 2 && r.diets?.length && !o.di.length) s -= 4;
  }
  s += 5 * o.i.filter(i => u.ints.includes(i)).length;
  if (u.lvls.includes(o.l)) s += 4;
  if (o.cu && u.cuis.includes(o.cu)) s += 4;
  if ((o.genres || [o.genre]).some(g => g && u.genres.includes(g))) s += 4;
  if (u.avoid.some(a => tags.includes(a))) s -= 10;
  if (o.cu && (gp.cuis || []).includes(o.cu)) s += 2;
  if ((o.genres || [o.genre]).some(g => g && (gp.genres || []).includes(g))) s += 2;
  s += 2 * o.i.filter(i => (gp.ints || []).includes(i)).length;
  if ((gp.never || []).some(a => tags.includes(a))) s -= 8;
  tags.forEach(t => { const L = g?.learn?.[t]; if (L) s += Math.max(-4, Math.min(4, (L.y - L.n) * 0.4)); });
  if (o.b) s += u.plan === 'reserveren' ? 2 : 0; else s += u.plan === 'spontaan' ? 2 : 0;
  return s + (hash((UID || 'me') + o.id) % 30) / 10;
}
export function whyRanked(o) { const u = S.user, out = []; o.i.filter(i => u.ints.includes(i)).forEach(i => out.push(INTS[i])); if (u.lvls.includes(o.l)) out.push(LVLS[o.l]); if (o.cu && u.cuis.includes(o.cu)) out.push(CUIS[o.cu]); if (o.genre && u.genres.includes(o.genre)) out.push(GENRES[o.genre]); return out; }
export const buildDeck = r => eligibleList(r).sort((a, b) => rankScore(b, r) - rankScore(a, r)).map(o => o.id);

export function matchText(m) {
  const r = rnd(m.rid), o = opt(m.oid); if (!r || !o) return 'Match!';
  if (m.type === 'meerderheid') return `Match! ${Math.round((m.yes / Math.max(1, m.act)) * 100)}% is enthousiast over ${o.t}.`;
  if (m.type === 'koppel') return `Match! ${r.rule.pair.map(nameOf).join(' en ')} zijn allebei enthousiast over ${o.t}.`;
  if (m.type === 'deadline') return `Tijd is om! ${o.t} kreeg de meeste ja-stemmen.`;
  if (m.type === 'willekeurig') return `De app koos ${o.t} uit jullie favorieten.`;
  return `Match! Iedereen is enthousiast over ${o.t}.`;
}
export function notify(type, text, ref) { S.notifs.unshift({ id: uid(), type, text, ref, at: Date.now(), read: false }); }

/* ============ Kaart-helpers ============ */
export function kind(o) { if (o.c.some(c => ['film', 'serie', 'bioscoop'].includes(c)) && !o.c.includes('uiteten')) return 'film'; if (o.c[0] === 'thuis') return 'thuis'; if (['dagje', 'weekend', 'vakantie'].includes(o.c[0])) return 'dagje'; if (FOODCATS.includes(o.c[0])) return 'food'; return 'act'; }
export function kmTo(o, r) {
  if (o.lat != null && r && r.lat != null) return Math.round(kmBetween(r.lat, r.lon, o.lat, o.lon) * 10) / 10;
  return o.km || 0;
}
export const priceOf = o => o.osm ? o.kindL : euro(o.p);
export const kmStr = (o, r) => { const k = kmTo(o, r); return k < 1 ? `${Math.round(k * 1000)} m` : `${String(k).replace('.', ',')} km`; };
export function travel(o, r) {
  const km = kmTo(o, r);
  if (!km && !o.osm) return o.c.includes('thuis') || kind(o) === 'film' ? 'Thuis' : 'Vanaf huis';
  if (o.del && o.c[0] === 'bestellen') return o.osm ? 'Bezorgen of afhalen' : `${o.dur} min bezorgen`;
  const tr = (r && r.trans.length ? r.trans : S.user.trans).filter(t => REACH[t] >= km);
  const t = tr.length ? [...tr].sort((a, b) => SPEED[b] - SPEED[a])[0] : 'auto';
  return `${Math.max(3, Math.round(km * 1.3 / SPEED[t] * 60) + (t === 'ov' ? 8 : 0))} min ${t === 'ov' ? 'ov' : t}`;
}
export const openStr = o => !o.h ? (o.hours || 'Onbekend') : o.h[1] >= 48 ? 'Altijd' : `${o.d.length === 7 ? 'Dagelijks' : o.d.split('').map(d => DAYN[d]).join(' ')} ${fmtH(o.h[0])}–${fmtH(o.h[1])}`;
export const ioStr = o => ({ binnen: 'Binnen', buiten: 'Buiten', beide: 'Binnen & buiten' })[o.io];

/* ============ Rondes ============ */
export function baseRound(o) {
  return Object.assign({ id: '', by: 'me', title: '', cats: [], lvls: [], moods: [], ints: [], loc: 'Venlo', km: 15, date: ymd(new Date()), start: '19:00', end: '23:30', bmin: 0, bmax: 35, size: 4, trans: ['fiets', 'auto'], io: [], book: 'any', alc: 'any', age: '', wheel: false, diets: [], pet: false, kid: false, streams: [], genres: [], minRating: 0, rule: { type: 'unaniem', pct: 70, pair: [] }, deadline: '', status: 'active', created: Date.now(), votes: { me: {} }, saved: [], vetoed: [], progress: {}, finale: {} }, o);
}
// Bestaande ronde aanpassen: begin met de huidige keuzes.
export function draftFromRound(r) {
  const base = newDraft(r.gid);
  const copy = JSON.parse(JSON.stringify(r));
  ['votes', 'saved', 'vetoed', 'progress', 'finale', 'deck', 'status', 'created', 'by'].forEach(k => delete copy[k]);
  return { ...base, ...copy, film: { ...base.film, ...(copy.film || {}) }, rule: { ...base.rule, ...copy.rule }, deadlineChoice: copy.deadline ? 'huidig' : 'geen' };
}
// Nieuwe ronde: alles begint leeg, de maker kiest zelf.
export function newDraft(gid) {
  return baseRound({
    v: 2, gid, title: '', main: [],
    film: { kinds: [], streams: [], genres: [], allGenres: false, minRating: null },
    lvls: [], ints: [], intsAll: false, io: null,
    cuis: [], cuisAll: false, diets: [], dietsNone: false,
    moods: [], moodsAll: false,
    date: '', dayPart: '', start: '', end: '', loc: '', lat: null, lon: null, km: null, trans: [], bmax: null, size: null,
    rule: { type: null, pct: null, pair: [] }, deadlineChoice: null, deadline: '',
  });
}
export function newGroupPrefs(o) { return Object.assign({ loc: '', km: 15, budget: 35, trans: ['fiets', 'auto'], cuis: [], genres: [], lvls: [], ints: [], never: [], io: 'beide', age: '', plan: 'spontaan' }, o); }
