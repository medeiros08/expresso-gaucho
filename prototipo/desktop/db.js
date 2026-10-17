// Camada de dados compartilhada entre o site do passageiro e a área da empresa.
// Os dados oficiais vêm de dados.js e geo.js. O que a empresa publica no painel fica salvo
// no navegador (localStorage) e passa a valer para o site do passageiro.
(function () {
  var KEY = 'fronteira:db';
  var LIVE_KEY = 'fronteira:aovivo';   // atrasos/cancelamentos e relatos do dia
  var SIM_KEY = 'fronteira:sim';       // relógio do modo demonstração (compartilhado)

  function slug(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

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
      paradas: clone(window.PARADAS || {}),   // { nome: {lat, lng, prec} }
      rotas: clone(window.ROTAS || {}),       // { "linha::sentido": [[[lat,lng],...] por trecho] }
      tempos: clone(window.TEMPOS || {})      // { "linha::sentido": { banda: [min extra por trecho] } }
    };
  }

  function load() {
    var d = null;
    try { var s = localStorage.getItem(KEY); if (s) d = JSON.parse(s); } catch (e) {}
    if (!d || !d.linhas || !d.horarios) return defaults();
    // dados publicados antes da versão 2 não têm mapa nem ajustes: completa com os oficiais
    var def = null;
    ['paradas', 'rotas', 'tempos'].forEach(function (k) { if (!d[k]) { def = def || defaults(); d[k] = def[k]; } });
    return d;
  }

  function save(d) {
    d.atualizado = new Date().toISOString();
    d.origem = 'editado';
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function isCustom() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

  // Relógio comum: usa o modo demonstração se estiver ligado no site do passageiro.
  function now() {
    var sim = null;
    try { sim = JSON.parse(localStorage.getItem(SIM_KEY)); } catch (e) {}
    if (sim && sim.on) return { dow: sim.dow, min: sim.min, sim: true };
    var t = new Date();
    return { dow: t.getDay(), min: t.getHours() * 60 + t.getMinutes() + t.getSeconds() / 60, sim: false };
  }
  function dayKey(n) {
    if (n.sim) return 'demo-' + n.dow;
    var t = new Date();
    return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
  }

  // Informações ao vivo do dia: { chaveDaViagem: {delay, cancel, src, min, from} }
  function loadLive(n) {
    var all = {};
    try { all = JSON.parse(localStorage.getItem(LIVE_KEY)) || {}; } catch (e) {}
    return all[dayKey(n || now())] || {};
  }
  function setLive(tripKey, info, n) {
    n = n || now();
    var k = dayKey(n), all = {};
    try { all = JSON.parse(localStorage.getItem(LIVE_KEY)) || {}; } catch (e) {}
    var day = all[k] || {};
    if (info) day[tripKey] = info; else delete day[tripKey];
    var out = {}; out[k] = day;               // guarda só o dia atual
    localStorage.setItem(LIVE_KEY, JSON.stringify(out));
  }

  window.DB = {
    KEY: KEY, LIVE_KEY: LIVE_KEY, SIM_KEY: SIM_KEY, BANDAS: BANDAS, banda: banda,
    load: load, save: save, reset: reset, defaults: defaults, isCustom: isCustom, slug: slug, dayTypes: dayTypes,
    now: now, dayKey: dayKey, loadLive: loadLive, setLive: setLive
  };
})();
