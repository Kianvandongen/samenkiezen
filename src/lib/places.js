// Echte plekken via OpenStreetMap (gratis): Photon voor het zoekveld, Overpass voor plekken rond de locatie.
import { sb } from './supabase';
import { TITLE_CACHE as CACHE } from './titlesCache';

const PHOTON = 'https://photon.komoot.io';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

export function kmBetween(a, b, c, d) {
  const R = 6371, r = x => x * Math.PI / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const KIND_NL = { city: 'Stad', town: 'Plaats', village: 'Dorp', hamlet: 'Buurtschap', suburb: 'Wijk', neighbourhood: 'Buurt', quarter: 'Wijk', street: 'Straat', house: 'Adres', locality: 'Plaats', district: 'Wijk', county: 'Gemeente', state: 'Provincie' };
const COUNTRY_NL = { Netherlands: 'Nederland', Nederland: 'Nederland', Belgium: 'België', België: 'België', Germany: 'Duitsland', Deutschland: 'Duitsland', France: 'Frankrijk', Luxembourg: 'Luxemburg' };

function photonItem(f) {
  const p = f.properties || {}, [lon, lat] = f.geometry.coordinates;
  const street = p.street ? `${p.street}${p.housenumber ? ' ' + p.housenumber : ''}` : '';
  const main = p.type === 'house' || (!p.name && street) ? street || p.name : p.name || street;
  const town = p.city || p.town || p.village || p.locality || p.district;
  const sub = [town && town !== main ? town : '', p.state, COUNTRY_NL[p.country] || p.country].filter(Boolean).join(', ');
  return { id: `${p.osm_type}${p.osm_id}`, main, sub, kind: KIND_NL[p.type] || '', label: [main, town && town !== main ? town : '', p.state].filter(Boolean).join(', '), lat, lon };
}

// Zoekt plaatsen, wijken, straten en adressen (voorkeur voor NL/BE/DE)
export async function searchLocations(q, signal) {
  if (!q || q.trim().length < 2) return [];
  const url = `${PHOTON}/api/?q=${encodeURIComponent(q.trim())}&limit=10&lat=52.1&lon=5.3&location_bias_scale=0.3`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Zoeken mislukt');
  const js = await res.json(), seen = new Map(), out = [];
  for (const f of js.features || []) {
    const it = photonItem(f), key = it.main + '|' + it.sub;
    if (!it.main) continue;
    // Bij dubbele treffers: het dorpscentrum (place) is beter dan het midden van de gemeentegrens
    if (seen.has(key)) { if (f.properties?.osm_key === 'place') Object.assign(seen.get(key), { lat: it.lat, lon: it.lon }); continue; }
    seen.set(key, it); out.push(it);
  }
  return out.slice(0, 7);
}

export async function reverseLocation(lat, lon) {
  const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lon}&limit=1`);
  const js = await res.json(), f = js.features?.[0];
  return f ? { ...photonItem(f), lat, lon } : { main: 'Mijn locatie', sub: '', label: 'Mijn locatie', lat, lon };
}

/* ---------- Plekken rond de locatie ---------- */
const CUIS_MAP = { italian: 'italiaans', pasta: 'italiaans', pizza: 'pizza', sushi: 'sushi', japanese: 'sushi', burger: 'burgers', indonesian: 'indonesisch', lebanese: 'libanees', thai: 'thais', tapas: 'tapas', spanish: 'tapas', steak_house: 'steak', steak: 'steak', grill: 'steak', regional: 'hollands', dutch: 'hollands', french: 'frans', chinese: 'chinees', asian: 'aziatisch', vietnamese: 'aziatisch', korean: 'aziatisch', wok: 'aziatisch', greek: 'grieks', turkish: 'turks', kebab: 'turks', mexican: 'mexicaans', 'tex-mex': 'mexicaans', indian: 'indiaas', pancake: 'pannenkoeken', friture: 'friet', fries: 'friet', chips: 'friet', fish: 'vis', seafood: 'vis', fish_and_chips: 'vis' };
const CUIS_EMOJI = { italiaans: '🍝', pizza: '🍕', sushi: '🍣', burgers: '🍔', indonesisch: '🍛', libanees: '🧆', thais: '🍜', tapas: '🥘', steak: '🥩', hollands: '🍽️', frans: '🥖', chinees: '🥡', aziatisch: '🍜', grieks: '🫒', turks: '🥙', mexicaans: '🌮', indiaas: '🍛', pannenkoeken: '🥞', friet: '🍟', vis: '🐟' };
const CUIS_NL = { italian: 'Italiaans', pizza: 'Pizza', sushi: 'Sushi', japanese: 'Japans', burger: 'Burgers', indonesian: 'Indonesisch', lebanese: 'Libanees', thai: 'Thais', tapas: 'Tapas', spanish: 'Spaans', steak_house: 'Steakhouse', chinese: 'Chinees', indian: 'Indiaas', greek: 'Grieks', turkish: 'Turks', french: 'Frans', mexican: 'Mexicaans', asian: 'Aziatisch', regional: 'Hollands', dutch: 'Hollands', kebab: 'Kebab', chicken: 'Kip', fish: 'Vis', vietnamese: 'Vietnamees', korean: 'Koreaans', surinamese: 'Surinaams', german: 'Duits', coffee_shop: 'Koffie', cake: 'Taart', ice_cream: 'IJs', sandwich: 'Broodjes', breakfast: 'Ontbijt', friture: 'Friet', fries: 'Friet', snackbar: 'Snackbar', vegetarian: 'Vegetarisch', vegan: 'Vegan' };

const SPORT = {
  climbing: ['Klimhal', '🧗', 'actief', ['sport']], padel: ['Padel', '🎾', 'actief', ['sport']], tennis: ['Tennis', '🎾', 'actief', ['sport']],
  karting: ['Karten', '🏎️', 'actief', ['motor', 'sport', 'games']], laser_tag: ['Lasergamen', '🔦', 'actief', ['games', 'sport']], swimming: ['Zwembad', '🏊', 'actief', ['sport', 'familie']],
  bowling: ['Bowling', '🎳', 'licht', ['games', 'sport']], '10pin': ['Bowling', '🎳', 'licht', ['games', 'sport']], ice_skating: ['Schaatsen', '⛸️', 'actief', ['sport']], trampoline: ['Trampolinepark', '🤸', 'actief', ['sport', 'familie']], billiards: ['Biljart en pool', '🎱', 'licht', ['games']],
};
const LEIS = {
  bowling_alley: ['Bowling', '🎳', 'licht', ['games', 'sport'], 'binnen'], escape_game: ['Escape room', '🔐', 'licht', ['games'], 'binnen'], miniature_golf: ['Minigolf', '⛳', 'licht', ['games'], 'beide'],
  amusement_arcade: ['Arcadehal', '🕹️', 'licht', ['games', 'tech'], 'binnen'], trampoline_park: ['Trampolinepark', '🤸', 'actief', ['sport', 'familie'], 'binnen'], ice_rink: ['IJsbaan', '⛸️', 'actief', ['sport'], 'beide'],
  water_park: ['Zwemparadijs', '🌊', 'actief', ['sport', 'familie'], 'beide'], horse_riding: ['Paardrijden', '🐴', 'actief', ['dieren', 'natuur'], 'buiten'],
};

function classify(t) {
  const a = t.amenity, l = t.leisure, tr = t.tourism;
  const base = { l: 'rustig', m: ['gezellig', 'binnen'], i: [], io: 'binnen', dur: 120 };
  if (a === 'restaurant' || a === 'fast_food') {
    const raw = (t.cuisine || '').split(';').map(s => s.trim().toLowerCase()).filter(Boolean);
    const cus = [...new Set(raw.map(x => CUIS_MAP[x]).filter(Boolean))], cu = cus[0] || null;
    const fast = a === 'fast_food', delivers = t.delivery === 'yes' || (fast && t.takeaway !== 'no');
    const c = fast ? ['bestellen'] : delivers ? ['uiteten', 'bestellen'] : ['uiteten'];
    return { ...base, c, cu, cus, del: delivers ? 1 : 0, e: CUIS_EMOJI[cu] || (fast ? '🍟' : '🍽️'), m: ['gezellig', 'eten', 'binnen'], i: ['eten'], dur: fast ? 45 : 120, kindL: fast ? 'Snackbar / afhaal' : 'Restaurant', cuisL: raw.map(x => CUIS_NL[x] || x.replace(/_/g, ' ')).slice(0, 3).join(', ') };
  }
  if (a === 'cafe') return { ...base, c: ['koffie'], e: '☕', m: ['gezellig', 'ontspannen', 'laagdrempelig', 'binnen'], i: ['eten'], dur: 90, kindL: 'Café / lunchroom' };
  if (['bar', 'pub', 'biergarten'].includes(a)) return { ...base, c: ['borrel'], e: a === 'biergarten' ? '🍺' : '🍻', m: ['gezellig', 'laagdrempelig', 'muziek', a === 'biergarten' ? 'buiten' : 'binnen'], i: ['muziek', 'nacht'], io: a === 'biergarten' ? 'buiten' : 'binnen', dur: 150, kindL: a === 'pub' ? 'Kroeg' : a === 'bar' ? 'Bar' : 'Biertuin' };
  if (a === 'nightclub') return { ...base, l: 'licht', c: ['uitgaan'], e: '🪩', m: ['feestelijk', 'muziek', 'binnen'], i: ['muziek', 'nacht'], dur: 240, kindL: 'Club' };
  if (a === 'karaoke_box') return { ...base, l: 'licht', c: ['uitgaan', 'activiteit'], e: '🎤', m: ['feestelijk', 'muziek', 'gezellig', 'binnen'], i: ['muziek', 'nacht'], kindL: 'Karaoke' };
  if (a === 'cinema') return { ...base, c: ['bioscoop', 'activiteit'], e: '🎬', m: ['gezellig', 'binnen', 'romantisch'], i: ['film'], dur: 150, kindL: 'Bioscoop' };
  if (a === 'public_bath' || l === 'sauna' || l === 'spa') return { ...base, c: ['wellness'], e: '🧖', m: ['ontspannen', 'luxe', 'binnen'], i: ['wellness'], dur: 240, kindL: l === 'sauna' ? 'Sauna' : 'Wellness' };
  if (LEIS[l]) { const [k, e, lv, i, io] = LEIS[l]; return { ...base, c: ['activiteit'], e, l: lv, i, io, m: ['gezellig', 'competitief', io === 'buiten' ? 'buiten' : 'binnen'], dur: 90, kindL: k }; }
  if (l === 'sports_centre') { const s = (t.sport || '').split(';').map(x => SPORT[x.trim()]).find(Boolean); if (!s) return null; const [k, e, lv, i] = s; return { ...base, c: ['activiteit', 'sport'], e, l: lv, i, m: ['competitief', 'team', 'binnen'], dur: 90, kindL: k }; }
  if (tr === 'museum') return { ...base, c: ['activiteit', 'dagje'], e: '🏛️', m: ['cultureel', 'leerzaam', 'binnen', 'ontspannen'], i: ['cultuur'], dur: 150, kindL: 'Museum' };
  if (tr === 'zoo' || tr === 'aquarium') return { ...base, l: 'licht', c: ['activiteit', 'dagje'], e: tr === 'zoo' ? '🦁' : '🐠', m: ['gezellig', 'kind', 'buiten'], i: ['dieren', 'familie', 'natuur'], io: tr === 'zoo' ? 'buiten' : 'binnen', dur: 300, kindL: tr === 'zoo' ? 'Dierentuin' : 'Aquarium' };
  if (tr === 'theme_park') return { ...base, l: 'actief', c: ['dagje', 'activiteit'], e: '🎢', m: ['avontuurlijk', 'feestelijk', 'buiten', 'kind'], i: ['familie', 'sport'], io: 'buiten', dur: 420, kindL: 'Pretpark' };
  if (l === 'nature_reserve') return { ...base, l: 'licht', c: ['dagje'], e: '🌲', m: ['buiten', 'ontspannen', 'avontuurlijk'], i: ['natuur'], io: 'buiten', dur: 240, kindL: 'Natuurgebied' };
  if (t.historic === 'castle') return { ...base, l: 'licht', c: ['dagje'], e: '🏰', m: ['cultureel', 'buiten', 'romantisch'], i: ['cultuur'], io: 'beide', dur: 180, kindL: 'Kasteel' };
  return null;
}

function diets(t) {
  const y = k => ['yes', 'only'].includes(t['diet:' + k]);
  const cu = (t.cuisine || '').toLowerCase();
  const d = [];
  if (y('vegetarian') || cu.includes('vegetarian')) d.push('veg');
  if (y('vegan') || cu.includes('vegan')) d.push('vegan');
  if (y('halal')) d.push('halal');
  if (y('gluten_free')) d.push('gluten');
  if (y('lactose_free')) d.push('lactose');
  if (d.includes('vegan') && !d.includes('veg')) d.push('veg');
  return d;
}

function toPlace(el, center) {
  const t = el.tags || {}; if (!t.name) return null;
  const k = classify(t); if (!k) return null;
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon; if (lat == null) return null;
  const city = t['addr:city'] || '';
  const addr = [t['addr:street'] ? `${t['addr:street']} ${t['addr:housenumber'] || ''}`.trim() : '', [t['addr:postcode'], city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const km = Math.round(kmBetween(center.lat, center.lon, lat, lon) * 10) / 10;
  const o = {
    id: `p${el.type[0]}${el.id}`, osm: 1, t: t.name, e: k.e, c: k.c, l: k.l, m: k.m, i: k.i, io: k.io,
    p: null, r: null, km, lat, lon, dur: k.dur, d: '0123456', h: null, hours: t.opening_hours || '', g: [1, 40], b: t.reservation === 'required' ? 1 : 0,
    di: diets(t), cu: k.cu || null, cus: k.cus || [], del: k.del || 0, kindL: k.kindL, cuisL: k.cuisL || '', city, addr,
    web: t.website || t['contact:website'] || '', phone: t.phone || t['contact:phone'] || '', w: t.wheelchair === 'yes' ? 1 : 0,
    desc: [k.kindL + (k.cuisL ? ` · ${k.cuisL}` : ''), addr || city].filter(Boolean).join(' · '),
  };
  CACHE[o.id] = o;
  return o;
}

const PARTS = {
  uiteten: ['nwr["amenity"="restaurant"]["name"]'],
  bestellen: ['nwr["amenity"="fast_food"]["name"]', 'nwr["amenity"="restaurant"]["delivery"="yes"]["name"]'],
  koffie: ['nwr["amenity"="cafe"]["name"]'],
  uitgaan: ['nwr["amenity"~"^(bar|pub|biergarten|nightclub|karaoke_box)$"]["name"]'],
  activiteit: ['nwr["leisure"~"^(bowling_alley|escape_game|miniature_golf|amusement_arcade|trampoline_park|ice_rink|water_park|horse_riding)$"]["name"]', 'nwr["amenity"~"^(cinema|karaoke_box)$"]["name"]', 'nwr["leisure"="sports_centre"]["sport"~"climbing|padel|karting|laser_tag|swimming|bowling|10pin|ice_skating|trampoline|billiards"]["name"]', 'nwr["tourism"~"^(museum|zoo|aquarium|theme_park)$"]["name"]'],
  wellness: ['nwr["leisure"~"^(sauna|spa)$"]["name"]', 'nwr["amenity"="public_bath"]["name"]'],
  dagje: ['nwr["tourism"~"^(museum|zoo|aquarium|theme_park)$"]["name"]', 'nwr["leisure"="nature_reserve"]["name"]', 'nwr["historic"="castle"]["name"]'],
};
export const PLACE_MAINS = Object.keys(PARTS);
export const radiusKm = (km, main) => km === 'any' || km == null ? (main === 'dagje' ? 75 : 40) : Number(km);

const memo = new Map();
// Haalt echte plekken op rond r.lat/r.lon voor alle gekozen onderdelen
export async function fetchPlaces(r) {
  if (r.lat == null || r.lon == null) return [];
  const mains = r.main.filter(m => PARTS[m]); if (!mains.length) return [];
  const key = JSON.stringify([r.lat.toFixed(4), r.lon.toFixed(4), r.km, mains]);
  if (memo.has(key)) return memo.get(key);
  const lines = [];
  mains.forEach(m => { const R = Math.round(radiusKm(r.km, m) * 1000); PARTS[m].forEach(p => lines.push(`${p}(around:${R},${r.lat},${r.lon});`)); });
  const q = `[out:json][timeout:25];(${[...new Set(lines)].join('')});out center tags 3000;`;
  let js = null, err = null;
  for (const u of OVERPASS) {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: ctl.signal });
      clearTimeout(tm);
      if (res.ok) { const j = await res.json(); if (j.remark && !(j.elements || []).length && /runtime error|timed out/i.test(j.remark)) { err = new Error(j.remark); continue; } js = j; break; }
      err = new Error('Plekken ophalen mislukt (' + res.status + ')');
    } catch (e) { err = e; }
  }
  if (!js) throw err || new Error('Plekken ophalen mislukt');
  const seen = new Set(), out = [];
  for (const el of js.elements || []) {
    const o = toPlace(el, r); if (!o) continue;
    const k = o.t.toLowerCase() + '|' + o.kindL; if (seen.has(k)) continue; seen.add(k);
    out.push(o);
  }
  out.sort((a, b) => a.km - b.km);
  memo.set(key, out);
  return out;
}

// Plekken in de database zetten zodat groepsleden dezelfde kaarten zien
export async function savePlaces(list) {
  for (let i = 0; i < list.length; i += 1000) {
    const { error } = await sb.rpc('upsert_places', { items: list.slice(i, i + 1000) });
    if (error) throw error;
  }
}
export async function ensurePlaces(ids) {
  const missing = [...new Set(ids)].filter(id => /^p[nwr]\d+$/.test(id) && !CACHE[id]);
  for (let i = 0; i < missing.length; i += 200) {
    const { data } = await sb.from('places').select('id,data').in('id', missing.slice(i, i + 200));
    (data || []).forEach(x => { CACHE[x.id] = x.data; });
  }
}
