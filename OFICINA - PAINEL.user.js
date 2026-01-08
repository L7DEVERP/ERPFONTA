// ==UserScript==
// @name         OFICINA - PAINEL (ANTI-SPA)
// @namespace    http://fontanella/oficina
// @version      2.2
// @description  Coleta e exibe mecânicos trabalhando, resistente a reload interno (React)
// @match        https://erp.fontanellatransportes.com.br/app/oficina/*
// @run-at       document-end
// @downloadURL  https://github.com/L7DEVERP/ERPFONTA/blob/main/OFICINA%20-%20PAINEL.user.js
// @updateURL    https://github.com/L7DEVERP/ERPFONTA/blob/main/OFICINA%20-%20PAINEL.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var STORAGE_KEY = 'OFICINA_STATUS_ATUAL';
  var INTERVALO = 2000;
  var coletorAtivo = false;

  /* ===== RELOAD AUTOMÁTICO A CADA 30s ===== */
  setTimeout(function () {
    location.reload();
  }, 30000);

  /* ================= COLETOR ================= */

  function coletar() {
    var rows = document.querySelectorAll('div[style*="margin-top"] .row');
    if (!rows.length) return;

    var mapa = {};

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var cols = row.querySelectorAll('.col-md-2, .col-md-6');
      var img = row.querySelector('img');

      if (!cols || cols.length < 3 || !img) continue;

      var mecanico = cols[1].innerText.trim();
      if (!mecanico) continue;

      var frota = cols[0].innerText.trim();
      var os = cols[2].innerText.trim();

      var status = img.src.indexOf('walkin') !== -1
        ? 'TRABALHANDO'
        : 'FORA';

      if (!mapa[mecanico]) {
        mapa[mecanico] = {
          mecanico: mecanico,
          frota: frota,
          os: os,
          status: status,
          atualizadoEm: new Date().toISOString()
        };
      }
    }

    var ativos = [];
    for (var nome in mapa) {
      if (mapa[nome].status === 'TRABALHANDO') {
        ativos.push(mapa[nome]);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(ativos));
  }

  function iniciarColetor() {
    if (coletorAtivo) return;
    coletorAtivo = true;

    coletar();
    setInterval(coletar, INTERVALO);

    console.log('[OFICINA] Coletor ativo');
  }

  /* ================= PAINEL ================= */

  function criarPainel() {
    if (document.getElementById('painelOficina')) return;

    var painel = document.createElement('div');
    painel.id = 'painelOficina';
    painel.style =
      'position:fixed;top:0;right:0;width:35%;height:100%;' +
      'background:#020617;color:#e5e7eb;z-index:99999;' +
      'padding:20px;overflow:auto;font-family:Arial';

    painel.innerHTML =
      '<h2>Mecânicos em Execução</h2>' +
      '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr><th>Mecânico</th><th>Frota</th><th>OS</th></tr></thead>' +
      '<tbody id="painelCorpo"></tbody></table>';

    document.body.appendChild(painel);

    setInterval(function () {
      var dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      var corpo = document.getElementById('painelCorpo');
      if (!corpo) return;

      corpo.innerHTML = '';
      for (var i = 0; i < dados.length; i++) {
        var m = dados[i];
        corpo.innerHTML +=
          '<tr style="background:#064e3b">' +
          '<td>' + m.mecanico + '</td>' +
          '<td>' + m.frota + '</td>' +
          '<td>' + m.os + '</td>' +
          '</tr>';
      }
    }, INTERVALO);
  }

  /* ================= OBSERVADOR SPA ================= */

  var observer = new MutationObserver(function () {
    if (document.querySelector('div[style*="margin-top"] .row')) {
      iniciarColetor();
      criarPainel();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();


