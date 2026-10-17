# Ferramentas

Scripts usados para gerar `prototipo/desktop/geo.js` (posição das paradas e trajetos pelas ruas) a partir do OpenStreetMap.

```bash
# 1) lista as paradas e busca as coordenadas no Nominatim (1 consulta por segundo)
node -e "global.window={};eval(require('fs').readFileSync('prototipo/desktop/dados.js','utf8'));const s=new Set();for(const k in window.HORARIOS)for(const b of window.HORARIOS[k])for(const d of b.dirs)for(const r of d.rows)s.add(r[0].replace(/\s*↩$/,'').trim());require('fs').writeFileSync('paradas.txt',[...s].sort().join('\n'))"
python ferramentas/geocodificar_paradas.py paradas.txt geo.json

# 2) estima as paradas não encontradas e calcula os trajetos pelas ruas (OSRM)
node ferramentas/gerar_trajetos.mjs prototipo/desktop/dados.js geo.json prototipo/desktop/geo.js
```

Depois disso, a posição de cada parada pode ser corrigida pela empresa na tela **Paradas** da área da empresa, que recalcula os trajetos e permite exportar um novo `geo.js` (em **Publicação**).
