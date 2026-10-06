import { sb } from './supabase';
import { TITLE_CACHE as TITLES } from './titlesCache';
import { GENRES, GENRE_IDS, STREAMS } from './data';

// Film- en seriecatalogus: het volledige abonnementsaanbod van Netflix en Prime Video (NL),
// dagelijks bijgewerkt vanuit TMDB (beschikbaarheid via JustWatch).
const KEY_BY_ID = {};
Object.entries(GENRE_IDS).forEach(([k, ids]) => ids.forEach(id => { if (!KEY_BY_ID[id]) KEY_BY_ID[id] = k; }));
const KIDS = [16, 10751, 10762];
const EMO = { actie: '💥', avontuur: '🧭', komedie: '😂', drama: '🎭', thriller: '🔪', scifi: '🚀', fantasy: '🐉', misdaad: '🕵️', romantiek: '💘', animatie: '🎨', familie: '👨‍👩‍👧', horror: '👻', documentaire: '🎥', oorlog: '🎖️', reality: '📺' };
const COLS = ['id', 'kind', 'tmdb_id', 'title', 'overview', 'poster', 'year', 'genres', 'rating', 'votes', 'popularity', 'adult', 'providers', 'latin'].join(',');

export function toOpt(t) {
  const keys = [...new Set((t.genres || []).map(g => KEY_BY_ID[g]).filter(Boolean))];
  const kid = (t.genres || []).some(g => KIDS.includes(g)) ? 1 : 0;
  const o = {
    id: t.id, tmdb: { kind: t.kind, id: t.tmdb_id }, t: t.title, e: EMO[keys[0]] || '🎬', poster: t.poster || null,
    c: [t.kind === 'movie' ? 'film' : 'serie'], l: 'rustig', m: ['ontspannen', 'binnen', 'gezellig'], i: ['film', 'thuis'], io: 'binnen',
    p: 0, r: Math.round((Number(t.rating) || 0) * 5) / 10, score10: Number(t.rating) || 0, votesCount: t.votes || 0, km: 0, dur: 0, h: [0, 48], d: '0123456', g: [1, 20], b: 0,
    genre: keys[0], genres: keys, year: t.year, plat: (t.providers || []).map(p => STREAMS[p]).filter(Boolean).join(' · '),
    desc: t.overview || 'Er is nog geen beschrijving beschikbaar.', hide: t.latin === false, kid, pet: 1, w: 1, alc: 'none', age: t.adult ? 18 : 0, di: [], food: false,
  };
  TITLES[o.id] = o;
  return o;
}

// Zou een film of serie door de niet-catalogusfilters van deze ronde komen?
export function titleKinds(r) {
  if (r.v === 2) return r.main.includes('kijken') ? r.film.kinds.map(k => (k === 'film' ? 'movie' : 'tv')) : [];
  const kinds = [];
  const want = k => !r.cats.length || r.cats.includes(k);
  const passes = r.lvls.length === 0 || r.lvls.includes('rustig') || r.lvls.includes('gemengd');
  const moodOk = !r.moods.length || r.moods.some(m => ['ontspannen', 'binnen', 'gezellig'].includes(m));
  const intOk = !r.ints.length || r.ints.some(i => ['film', 'thuis'].includes(i));
  const ioOk = !(r.io.length === 1 && r.io[0] === 'buiten');
  if (!(passes && moodOk && intOk && ioOk && Number(r.bmin || 0) <= 0)) return [];
  if (want('film')) kinds.push('movie');
  if (want('serie')) kinds.push('tv');
  return kinds;
}

function query(r, select, head) {
  const kinds = titleKinds(r); if (!kinds.length) return null;
  const fs = r.v === 2 ? r.film : r;
  let q = sb.from('titles').select(select, head ? { count: 'exact', head: true } : undefined).eq('available', true).eq('latin', true).in('kind', kinds)
    .overlaps('providers', fs.streams && fs.streams.length ? fs.streams : Object.keys(STREAMS));
  const g = (fs.allGenres ? [] : (fs.genres || [])).flatMap(k => GENRE_IDS[k] || []);
  if (g.length) q = q.overlaps('genres', g);
  if (r.kid) q = q.overlaps('genres', KIDS);
  if (fs.minRating) q = q.gte('rating', fs.minRating).gte('votes', 20);
  return q;
}

export async function countTitles(r) {
  const q = query(r, 'id', true); if (!q) return 0;
  const { count, error } = await q; if (error) return 0;
  return count || 0;
}

export async function deckTitles(r, limit = 1000) {
  const q = query(r, COLS, false); if (!q) return [];
  const out = [];
  for (let from = 0; from < limit; from += 500) {
    const { data, error } = await q.order('popularity', { ascending: false }).range(from, Math.min(from + 500, limit) - 1);
    if (error) throw error;
    data.forEach(t => out.push(toOpt(t)));
    if (data.length < 500) break;
  }
  return out;
}

export async function ensureTitles(ids) {
  const missing = [...new Set(ids)].filter(id => /^[mt]\d+$/.test(id) && !TITLES[id]);
  for (let i = 0; i < missing.length; i += 200) {
    const { data } = await sb.from('titles').select(COLS).in('id', missing.slice(i, i + 200));
    (data || []).forEach(toOpt);
  }
}

export const tmdbUrl = o => `https://www.themoviedb.org/${o.tmdb.kind}/${o.tmdb.id}/watch?locale=NL`;
export const GENRE_LABEL = k => GENRES[k] || k;
