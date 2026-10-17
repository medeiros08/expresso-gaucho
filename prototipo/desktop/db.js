// Camada de dados compartilhada entre o site do passageiro e a área da empresa.
//
// Dois modos:
//  - Local (config.js vazio): o que a empresa publica fica salvo neste navegador.
//  - Servidor (config.js preenchido): publicações, atrasos e relatos ficam no Supabase,
//    valem para todos e chegam em tempo real. Uma cópia fica no aparelho para uso offline.
//
// Os dados oficiais (ponto de partida) vêm de dados.js e geo.js.
(function () {
  var KEY = 'fronteira:db';                // publicação (modo local)
  var CACHE_KEY = 'fronteira:db-servidor'; // última publicação baixada do servidor
  var LIVE_KEY = 'fronteira:aovivo';       // atrasos/cancelamentos e relatos (modo local)
  var SIM_KEY = 'fronteira:sim';           // relógio do modo demonstração (compartilhado)

  function slug(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function lsGet(k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function dayTypes(label) {
    if (/segunda a sexta/i.test(label)) return [1, 2, 3, 4, 5];
    if (/segunda a s[áa]bado/i.test(label)) return [1, 2, 3, 4, 5, 6];
    if (/^s[áa]bado/i.test(label)) return [6];
    if (/domingo/i.test(label)) return [0];
    return [1, 2, 3, 4, 5];
  }

  // Faixas de horário usadas nos ajustes de tempo de percurso (minutos desde 00:00).
  var BANDAS = [
    { id: 'manha', nome: 'Pico da manhã', de: 0, ate: 540 },
    { id: 'dia', nome: 'Entrepico', de: 540, ate: 960 },
    { id: 'tarde', nome: 'Pico da tarde', de: 960, ate: 1140 },
    { id: 'noite', nome: 'Noite', de: 1140, ate: 1440 }
  ];
  function banda(min) {
    for (var i = 0; i < BANDAS.length; i++) if (min < BANDAS[i].ate) return BANDAS[i];
    return BANDAS[BANDAS.length - 1];
  }

  var AVISOS_PADRAO = [
    { id: 1, titulo: 'Operação de domingo', tipo: 'alerta', ativo: true, linhas: [],
      texto: 'Aos domingos operam apenas as linhas Domingo João XXIII, Domingo Piola e Domingo Vera Cruz.' },
    { id: 2, titulo: 'Balneário Caverá', tipo: 'info', ativo: true, linhas: ['terminal-nova-brasilia'],
      texto: 'Sábado (até 14:00): a linha Terminal - Nova Brasília atende o Balneário Caverá.' }
  ];

  function defaults() {
    var linhas = window.LINHAS.map(function (l) {
      return { id: slug(l.nome), nome: l.nome, tipo: l.tipo, desc: l.desc, cod: l.cod, status: l.status || 'ativa' };
    });
    var horarios = {};
    window.LINHAS.forEach(function (l) {
      var h = window.HORARIOS[l.nome];
      if (!h) return;
      horarios[slug(l.nome)] = h.map(function (b) {
        return {
          day: b.day,
          days: b.days || dayTypes(b.day),
          dirs: b.dirs.map(function (d) { return { dir: d.dir, rows: d.rows.map(function (r) { return r.slice(); }) }; })
        };
      });
    });
    return {
      versao: 2, origem: 'oficial', atualizado: null, linhas: linhas, horarios: horarios,
      avisos: clone(window.AVISOS || AVISOS_PADRAO), log: [],
      paradas: clone(window.PARADAS || {}),
      rotas: clone(window.ROTAS || {}),
      tempos: clone(window.TEMPOS || {})
    };
  }
  function completar(d) {
    var def = null;
    ['paradas', 'rotas', 'tempos', 'avisos', 'log'].forEach(function (k) { if (!d[k]) { def = def || defaults(); d[k] = def[k]; } });
    return d;
  }

  /* ---------------- servidor (Supabase) ---------------- */
  var sb = null, canal = null, ouvintes = [], ultimoId = null;
  function remoto() {
    return !!(window.SUPABASE && window.SUPABASE.url && window.SUPABASE.anonKey && window.supabase && window.supabase.createClient);
  }
  function cliente() {
    if (!sb && remoto()) {
      sb = window.supabase.createClient(window.SUPABASE.url, window.SUPABASE.anonKey, {
        auth: { persistSession: true, storageKey: 'fronteira:auth' }
      });
    }
    return sb;
  }

  // Baixa a publicação mais recente. Resolve true se mudou em relação à cópia do aparelho.
  function sync() {
    if (!remoto()) return Promise.resolve(false);
    return cliente().from('publicacoes').select('id,conteudo,criado_em,autor').order('id', { ascending: false }).limit(1)
      .then(function (r) {
        if (r.error) throw r.error;
        var atual = lsGet(CACHE_KEY);
        var row = r.data && r.data[0];
        if (!row) { if (atual) { lsDel(CACHE_KEY); return true; } return false; }
        ultimoId = row.id;
        if (atual && atual.pubId === row.id) return false;
        var d = completar(row.conteudo || {});
        d.pubId = row.id; d.atualizado = row.criado_em; d.origem = 'editado';
        lsSet(CACHE_KEY, d);
        return true;
      });
  }

  function load() {
    var d = remoto() ? lsGet(CACHE_KEY) : lsGet(KEY);
    if (!d || !d.linhas || !d.horarios) return defaults();
    return completar(d);
  }

  // Publica. No modo servidor exige login de alguém da equipe (regras em schema.sql).
  function save(d) {
    if (!remoto()) {
      d.atualizado = new Date().toISOString(); d.origem = 'editado';
      localStorage.setItem(KEY, JSON.stringify(d));
      return Promise.resolve();
    }
    var c = clone(d); delete c.pubId; delete c.atualizado; delete c.origem;
    return cliente().auth.getUser().then(function (u) {
      var email = u && u.data && u.data.user && u.data.user.email;
      if (!email) throw new Error('Sessão expirada. Entre de novo.');
      var itens = (d.log && d.log[0] && d.log[0].itens) || [];
      return cliente().from('publicacoes').insert({ conteudo: c, itens: itens, autor: email }).select('id,criado_em').single();
    }).then(function (r) {
      if (r.error) throw r.error;
      var cache = clone(d); cache.pubId = r.data.id; cache.atualizado = r.data.criado_em; cache.origem = 'editado';
      ultimoId = r.data.id; lsSet(CACHE_KEY, cache);
    });
  }

  function reset() {
    if (!remoto()) { lsDel(KEY); return Promise.resolve(); }
    var d = defaults(); d.log = [{ t: Date.now(), usuario: 'equipe', itens: ['Dados oficiais restaurados'] }];
    return save(d);
  }
  function isCustom() { return !!lsGet(remoto() ? CACHE_KEY : KEY); }

  /* ---------------- relógio ---------------- */
  // Usa o modo demonstração se estiver ligado no site do passageiro.
  function now() {
    var sim = lsGet(SIM_KEY);
    if (sim && sim.on) return { dow: sim.dow, min: sim.min, sim: true };
    var t = new Date();
    return { dow: t.getDay(), min: t.getHours() * 60 + t.getMinutes() + t.getSeconds() / 60, sim: false };
  }
  function dayKey(n) {
    if (n.sim) return 'demo-' + n.dow;
    var t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  /* ---------------- informação ao vivo ----------------
     Formato devolvido por loadLive: { chaveDaViagem: {delay, cancel, src, min, from} }
     src = 'empresa' (atraso/cancelamento) ou 'passageiro' (relato). A empresa prevalece. */
  var VIVO = {}; // dia → { empresa: {key: info}, relatos: [{id,key,delay,from,min}], carregado }

  function carregarDia(dia) {
    var v0 = VIVO[dia];
    if (v0 && !(v0.erro && Date.now() - v0.erro > 30000)) return; // sem internet: tenta de novo a cada 30 s
    VIVO[dia] = { empresa: v0 ? v0.empresa : {}, relatos: v0 ? v0.relatos : [], carregado: false };
    Promise.all([
      cliente().from('aovivo').select('*').eq('dia', dia),
      cliente().from('relatos').select('*').eq('dia', dia).order('id', { ascending: true })
    ]).then(function (rs) {
      var v = VIVO[dia];
      (rs[0].data || []).forEach(function (r) { v.empresa[r.trip_key] = linhaVivo(r); });
      v.relatos = (rs[1].data || []).map(linhaRelato);
      if (rs[0].error || rs[1].error) throw rs[0].error || rs[1].error;
      v.carregado = true; avisar('aovivo');
    }).catch(function () { VIVO[dia].erro = Date.now(); });
  }
  function linhaVivo(r) { return { delay: r.atraso, cancel: r.cancelada, src: 'empresa', min: r.minuto, from: r.parada, autor: r.autor }; }
  function linhaRelato(r) { return { id: r.id, key: r.trip_key, delay: r.atraso, from: r.parada, min: r.minuto }; }

  function loadLive(n) {
    n = n || now();
    if (!remoto()) { var all = lsGet(LIVE_KEY) || {}; return all[dayKey(n)] || {}; }
    var dia = dayKey(n); carregarDia(dia);
    var v = VIVO[dia], out = {};
    v.relatos.forEach(function (r) { out[r.key] = { delay: r.delay, from: r.from, src: 'passageiro', min: r.min, id: r.id }; });
    Object.keys(v.empresa).forEach(function (k) { out[k] = v.empresa[k]; });
    return out;
  }
  function relatos(n) {
    n = n || now();
    if (!remoto()) {
      var m = loadLive(n);
      return Object.keys(m).filter(function (k) { return m[k].src === 'passageiro'; })
        .map(function (k) { return { key: k, delay: m[k].delay, from: m[k].from, min: m[k].min }; });
    }
    var dia = dayKey(n); carregarDia(dia);
    var ult = {}; VIVO[dia].relatos.forEach(function (r) { ult[r.key] = r; });
    return Object.keys(ult).map(function (k) { return ult[k]; });
  }

  // info = {delay, cancel, src, min, from} ou null para apagar. Devolve uma Promise.
  function setLive(tripKey, info, n) {
    n = n || now();
    var dia = dayKey(n);
    if (!remoto()) {
      var all = lsGet(LIVE_KEY) || {}; var day = all[dia] || {};
      if (info) day[tripKey] = info; else delete day[tripKey];
      var out = {}; out[dia] = day; lsSet(LIVE_KEY, out);
      return Promise.resolve();
    }
    carregarDia(dia); var v = VIVO[dia];
    if (info && info.src === 'passageiro') {
      var rel = { dia: dia, trip_key: tripKey, atraso: Math.round(info.delay || 0), parada: info.from || 0, minuto: info.min };
      v.relatos.push({ id: -Date.now(), key: tripKey, delay: rel.atraso, from: rel.parada, min: rel.minuto });
      return cliente().from('relatos').insert(rel).then(function (r) { if (r.error) throw r.error; });
    }
    if (!info) {
      delete v.empresa[tripKey];
      return cliente().from('aovivo').delete().eq('dia', dia).eq('trip_key', tripKey).then(function (r) { if (r.error) throw r.error; });
    }
    return cliente().auth.getUser().then(function (u) {
      var email = u && u.data && u.data.user && u.data.user.email;
      var row = { dia: dia, trip_key: tripKey, atraso: Math.round(info.delay || 0), cancelada: !!info.cancel, parada: info.from || 0, minuto: info.min, autor: email || null, atualizado: new Date().toISOString() };
      v.empresa[tripKey] = linhaVivo(row);
      return cliente().from('aovivo').upsert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function descartarRelatos(tripKey, n) {
    n = n || now();
    if (!remoto()) return setLive(tripKey, null, n);
    var dia = dayKey(n); carregarDia(dia);
    VIVO[dia].relatos = VIVO[dia].relatos.filter(function (r) { return r.key !== tripKey; });
    return cliente().from('relatos').delete().eq('dia', dia).eq('trip_key', tripKey).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------------- tempo real ---------------- */
  function avisar(tipo, dado) { ouvintes.forEach(function (f) { try { f(tipo, dado); } catch (e) {} }); }
  function onChange(f) { ouvintes.push(f); }
  function conectar() {
    if (!remoto() || canal) return;
    canal = cliente().channel('fronteira')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'publicacoes' }, function (p) {
        if (p.new && p.new.id !== ultimoId) sync().then(function (mudou) { if (mudou) avisar('publicacao'); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aovivo' }, function (p) {
        var r = p.eventType === 'DELETE' ? p.old : p.new; if (!r || !VIVO[r.dia]) return;
        if (p.eventType === 'DELETE') delete VIVO[r.dia].empresa[r.trip_key];
        else VIVO[r.dia].empresa[r.trip_key] = linhaVivo(r);
        avisar('aovivo');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relatos' }, function (p) {
        if (p.eventType === 'INSERT' && p.new && VIVO[p.new.dia]) {
          var v = VIVO[p.new.dia]; v.relatos = v.relatos.filter(function (r) { return r.id > 0; }); v.relatos.push(linhaRelato(p.new));
        } else if (p.eventType === 'DELETE') {
          Object.keys(VIVO).forEach(function (d) { delete VIVO[d]; }); // relê na próxima consulta
        }
        avisar('aovivo');
      })
      .subscribe(function (st) { avisar('conexao', st); });
  }
  // Inicia o modo servidor: baixa a publicação e escuta mudanças.
  function start() {
    if (!remoto()) return Promise.resolve(false);
    conectar();
    return sync().catch(function () { return false; });
  }

  window.DB = {
    KEY: KEY, CACHE_KEY: CACHE_KEY, LIVE_KEY: LIVE_KEY, SIM_KEY: SIM_KEY, BANDAS: BANDAS, banda: banda,
    load: load, save: save, reset: reset, defaults: defaults, isCustom: isCustom, slug: slug, dayTypes: dayTypes,
    now: now, dayKey: dayKey, loadLive: loadLive, setLive: setLive, relatos: relatos, descartarRelatos: descartarRelatos,
    remoto: remoto, cliente: cliente, sync: sync, start: start, onChange: onChange
  };
})();
