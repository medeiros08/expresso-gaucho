// Camada de dados compartilhada entre o site do passageiro e a área da empresa.
// Os dados oficiais vêm de dados.js. O que a empresa publica no painel fica salvo
// no navegador (localStorage) e passa a valer para o site do passageiro.
(function () {
  var KEY = 'fronteira:db';

  function slug(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function dayTypes(label) {
    if (/segunda a sexta/i.test(label)) return [1, 2, 3, 4, 5];
    if (/segunda a s[áa]bado/i.test(label)) return [1, 2, 3, 4, 5, 6];
    if (/^s[áa]bado/i.test(label)) return [6];
    if (/domingo/i.test(label)) return [0];
    return [1, 2, 3, 4, 5];
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
      versao: 1, origem: 'oficial', atualizado: null, linhas: linhas, horarios: horarios,
      avisos: JSON.parse(JSON.stringify(window.AVISOS || AVISOS_PADRAO)), log: []
    };
  }

  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) {
        var d = JSON.parse(s);
        if (d && d.linhas && d.horarios) return d;
      }
    } catch (e) {}
    return defaults();
  }

  function save(d) {
    d.atualizado = new Date().toISOString();
    d.origem = 'editado';
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function isCustom() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

  window.DB = { KEY: KEY, load: load, save: save, reset: reset, defaults: defaults, isCustom: isCustom, slug: slug, dayTypes: dayTypes };
})();
