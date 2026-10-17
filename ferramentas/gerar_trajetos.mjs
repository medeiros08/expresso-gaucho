// Gera geo.js: posição das paradas (com precisão) e traçado pelas ruas de cada sentido.
// Uso: node rotas.mjs <dados.js> <geo.json> <saida geo.js>
import fs from 'node:fs';

const [, , DADOS, GEO, SAIDA] = process.argv;
globalThis.window = {};
eval(fs.readFileSync(DADOS, 'utf8'));
const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));
const norm = s => s.replace(/\s*↩$/, '').trim();
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toMin = t => { const r = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return r ? +r[1] * 60 + +r[2] : null; };
const r5 = x => Math.round(x * 1e5) / 1e5;

// 1) precisão: ponto de interesse = 'ponto'; bairro/rua = 'aproximada'
const AREA = new Set(['suburb', 'neighbourhood', 'quarter', 'residential', 'primary', 'secondary', 'tertiary', 'unclassified', 'living_street', 'hamlet', 'village', 'locality', 'administrative', 'trunk']);
const P = {};
for (const [nome, g] of Object.entries(geo)) P[nome] = { lat: r5(g.lat), lng: r5(g.lng), prec: AREA.has(g.tipo) ? 'aproximada' : 'ponto' };

// 2) sentidos (sequência de paradas + tempo médio de cada trecho)
const dirs = [];
for (const l of window.LINHAS) {
  const H = window.HORARIOS[l.nome]; if (!H) continue;
  const id = slug(l.nome);
  for (const b of H) for (const d of b.dirs) {
    const stops = d.rows.map(r => norm(r[0]));
    if (stops.length < 2) continue;
    const key = id + '::' + d.dir;
    if (dirs.some(x => x.key === key)) continue;
    // tempo médio de cada parada desde o início, para interpolar paradas sem coordenada
    const n = Math.max(...d.rows.map(r => r.length)) - 1; const t = stops.map(() => []);
    for (let j = 0; j < n; j++) { const ts = d.rows.map(r => toMin(r[j + 1])); const s0 = ts.find(x => x != null); ts.forEach((x, i) => { if (x != null && s0 != null) t[i].push(x - s0); }); }
    const tm = t.map(a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
    dirs.push({ key, stops, tm });
  }
}

// 3) paradas sem coordenada: interpola entre vizinhas conhecidas pelo tempo (repete até estabilizar)
for (let it = 0; it < 6; it++) {
  const acc = {};
  for (const d of dirs) d.stops.forEach((s, i) => {
    if (P[s] && P[s].prec !== 'estimada') return;
    let a = i - 1; while (a >= 0 && !P[d.stops[a]]) a--;
    let b = i + 1; while (b < d.stops.length && !P[d.stops[b]]) b++;
    if (a < 0 && b >= d.stops.length) return;
    let lat, lng;
    if (a < 0 || b >= d.stops.length) { const k = a < 0 ? b : a; lat = P[d.stops[k]].lat + 0.0015; lng = P[d.stops[k]].lng + 0.0015; }
    else {
      const ta = d.tm[a] ?? a, tb = d.tm[b] ?? b, ti = d.tm[i] ?? i;
      const f = tb === ta ? 0.5 : Math.min(1, Math.max(0, (ti - ta) / (tb - ta)));
      lat = P[d.stops[a]].lat + (P[d.stops[b]].lat - P[d.stops[a]].lat) * f;
      lng = P[d.stops[a]].lng + (P[d.stops[b]].lng - P[d.stops[a]].lng) * f;
    }
    (acc[s] ||= []).push([lat, lng]);
  });
  for (const [s, v] of Object.entries(acc)) P[s] = { lat: r5(v.reduce((x, y) => x + y[0], 0) / v.length), lng: r5(v.reduce((x, y) => x + y[1], 0) / v.length), prec: 'estimada' };
}

// 4) traçado pelas ruas (OSRM), separado por trecho entre paradas
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ROTAS = {};
for (const d of dirs) {
  const pts = d.stops.map(s => P[s]);
  if (pts.some(p => !p)) { console.log('sem coordenada:', d.key); continue; }
  const coords = pts.map(p => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=true&geometries=geojson`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ExpressoGaucho-prototipo/1.0 (projeto academico Unipampa)' } });
    const j = await res.json();
    if (j.code !== 'Ok') throw new Error(j.code);
    ROTAS[d.key] = j.routes[0].legs.map(leg => {
      const seg = [];
      for (const st of leg.steps) for (const [lng, lat] of st.geometry.coordinates) {
        const p = [r5(lat), r5(lng)]; const q = seg[seg.length - 1];
        if (!q || q[0] !== p[0] || q[1] !== p[1]) seg.push(p);
      }
      return seg;
    });
    console.log('OK ', d.key, ROTAS[d.key].length, 'trechos', (j.routes[0].distance / 1000).toFixed(1) + ' km');
  } catch (e) { console.log('ERRO', d.key, e.message); }
  await sleep(1100);
}

const cont = Object.values(P).reduce((a, p) => (a[p.prec] = (a[p.prec] || 0) + 1, a), {});
fs.writeFileSync(SAIDA, `// Gerado a partir do OpenStreetMap (Nominatim + OSRM) em ${new Date().toISOString().slice(0, 10)}.
// PARADAS: posição de cada parada. prec = 'ponto' (local exato no mapa), 'aproximada' (centro do bairro/rua)
// ou 'estimada' (não encontrada; posição calculada entre as paradas vizinhas). A empresa pode corrigir no painel.
// ROTAS: para cada "linha::sentido", o traçado pelas ruas de cada trecho entre paradas consecutivas.
window.PARADAS = ${JSON.stringify(P)};
window.ROTAS = ${JSON.stringify(ROTAS)};
`);
console.log('paradas', Object.keys(P).length, cont, '| sentidos', Object.keys(ROTAS).length, '/', dirs.length);
