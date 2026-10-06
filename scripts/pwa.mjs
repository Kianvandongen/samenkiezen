// Voegt PWA-tags toe aan de geëxporteerde index.html (zodat "Zet op beginscherm" werkt).
import fs from 'node:fs';
const out = process.argv[2] || 'web-build';
const p = `${out}/index.html`;
let h = fs.readFileSync(p, 'utf8');
const head = `<title>SamenKiezen</title>
<meta name="description" content="Samen snel kiezen wat jullie gaan doen, eten of kijken.">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-180.png">
<meta name="theme-color" content="#16205c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SamenKiezen">`;
h = h.replace(/<title>[\s\S]*?<\/title>/, '').replace('</head>', head + '\n</head>');
h = h.replace(/content="width=device-width, initial-scale=1, shrink-to-fit=no"/, 'content="width=device-width, initial-scale=1, viewport-fit=cover"');
fs.writeFileSync(p, h);
for (const f of ['manifest.json', '_redirects', 'icon-192.png']) if (!fs.existsSync(`${out}/${f}`)) { console.error('Ontbreekt:', f); process.exit(1); }
console.log('PWA klaar:', out);
