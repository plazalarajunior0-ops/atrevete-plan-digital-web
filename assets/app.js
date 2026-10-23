/* Propuesta de dirección digital: pestañas, menú con la sección activa y barra de avance. */
(function () {
  /* ---------- Pestañas ---------- */
  document.querySelectorAll('.pestanas').forEach(function (grupo) {
    var botones = grupo.querySelectorAll('[role="tab"]');
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        botones.forEach(function (x) {
          var on = x === b;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(x.getAttribute('data-p'));
          if (p) p.hidden = !on;
        });
      });
    });
  });

  /* ---------- Ganchos (datos en ganchos.js) ---------- */
  var G = window.GANCHOS || {};
  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texto') n.textContent = attrs[k];
      else if (k === 'clase') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) n.append(h); });
    return n;
  }
  var filtros = { cuenta: '', quien: '' }, texto = '', limite = 12;
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function botonesFiltro(campo) {
    var cont = document.querySelector('.grupo[data-filtro="' + campo + '"]');
    if (!cont) return;
    var vistos = [];
    (G.ganchos || []).forEach(function (g) { if (vistos.indexOf(g[campo]) < 0) vistos.push(g[campo]); });
    [''].concat(vistos).forEach(function (v) {
      var b = el('button', { clase: 'f', type: 'button', 'aria-pressed': v === '' ? 'true' : 'false', texto: v === '' ? 'Todos' : v });
      b.addEventListener('click', function () {
        filtros[campo] = v; limite = 12;
        cont.querySelectorAll('.f').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        pintarGanchos();
      });
      cont.append(b);
    });
  }
  function pintarGanchos() {
    var lista = document.getElementById('lista-ganchos');
    if (!lista) return;
    var t = norm(texto);
    var vis = (G.ganchos || []).filter(function (g) {
      return (!filtros.cuenta || g.cuenta === filtros.cuenta) && (!filtros.quien || g.quien === filtros.quien) &&
        (!t || norm(g.texto + ' ' + g.tipo + ' ' + g.porque + ' ' + g.cierre + ' ' + g.base).indexOf(t) >= 0);
    });
    lista.innerHTML = '';
    vis.slice(0, limite).forEach(function (g) {
      var copiar = el('button', { clase: 'copiar', type: 'button', texto: 'Copiar' });
      copiar.addEventListener('click', function () {
        var txt = g.texto + '\n\nCierre: ' + g.cierre;
        var hecho = function () { copiar.textContent = '¡Copiado!'; setTimeout(function () { copiar.textContent = 'Copiar'; }, 1600); };
        var falla = function () { copiar.textContent = 'Selecciona el texto y cópialo'; };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(hecho, falla); else falla();
      });
      lista.append(el('article', { clase: 'tarjeta gancho' }, [
        el('div', { clase: 'top' }, [el('span', { clase: 'tag quien', texto: g.quien }), el('span', { clase: 'tag pilar', texto: g.cuenta }), el('span', { clase: 'tag', texto: g.tipo })]),
        el('q', { texto: g.texto }),
        el('p', { clase: 'det' }, [el('b', { texto: 'Por qué funciona: ' }), document.createTextNode(g.porque)]),
        el('p', { clase: 'det' }, [el('b', { texto: 'Cierre: ' }), document.createTextNode(g.cierre)]),
        el('p', { clase: 'det' }, [el('b', { texto: 'Basado en: ' }), document.createTextNode(g.base)]),
        el('div', { clase: 'pie' }, [el('span', { clase: 'fmt', texto: g.formato }), copiar])
      ]));
    });
    if (!vis.length) lista.append(el('p', { clase: 'vacio', texto: 'No hay ganchos con ese filtro. Prueba con «Todos» o con otra palabra.' }));
    document.getElementById('cuenta').textContent = vis.length + (vis.length === 1 ? ' gancho' : ' ganchos');
    document.getElementById('mas').hidden = vis.length <= limite;
  }
  if (document.getElementById('lista-ganchos')) {
    botonesFiltro('cuenta');
    botonesFiltro('quien');
    document.getElementById('buscar').addEventListener('input', function () { texto = this.value; limite = 12; pintarGanchos(); });
    document.getElementById('mas').addEventListener('click', function () { limite += 12; pintarGanchos(); });
    pintarGanchos();
  }

  /* ---------- Videos de ejemplo (datos en videos.js) con reproductor dentro de la página ---------- */
  var V = window.VIDEOS || [];
  var dlg = document.getElementById('reproductor');
  function abrirVideo(v) {
    if (!v.yt || !dlg || !dlg.showModal) { window.open(v.url, '_blank', 'noopener'); return; }
    var marco = document.getElementById('marco-video');
    marco.innerHTML = '';
    marco.append(el('iframe', {
      src: 'https://www.youtube-nocookie.com/embed/' + v.yt + '?autoplay=1&rel=0', title: v.titulo,
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: ''
    }));
    var pie = document.getElementById('pie-video');
    pie.innerHTML = '';
    pie.append(document.createTextNode(v.titulo + ' · '), el('a', { href: v.url, target: '_blank', rel: 'noopener', texto: 'Abrir en YouTube' }));
    dlg.showModal();
  }
  if (dlg) {
    var cerrarVideo = function () { document.getElementById('marco-video').innerHTML = ''; if (dlg.open) dlg.close(); };
    document.getElementById('cerrar-video').addEventListener('click', cerrarVideo);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrarVideo(); });
    dlg.addEventListener('close', function () { document.getElementById('marco-video').innerHTML = ''; });
  }
  function miniatura(v) {
    var esYt = !!v.yt;
    var b = el(esYt ? 'button' : 'a', esYt ? { clase: 'mini', type: 'button', 'aria-label': 'Ver video: ' + v.titulo }
      : { clase: 'mini', href: v.url, target: '_blank', rel: 'noopener', 'aria-label': 'Abrir en ' + v.plataforma + ': ' + v.titulo });
    var img = el('span', { clase: 'img' + (esYt ? '' : ' red') }, esYt ? [] : [el('span', { clase: 'red-n', texto: v.plataforma })]);
    if (esYt) img.style.backgroundImage = 'url("https://i.ytimg.com/vi/' + v.yt + '/hqdefault.jpg")';
    b.append(img, el('span', { clase: 'tit', texto: v.titulo }));
    if (esYt) b.addEventListener('click', function () { abrirVideo(v); });
    return b;
  }
  var grupoV = 'Moisés';
  function pintarVideos() {
    var cont = document.getElementById('lista-videos');
    if (!cont) return;
    cont.innerHTML = '';
    V.filter(function (v) { return v.grupo === grupoV; }).forEach(function (v) {
      cont.append(el('article', { clase: 'tarjeta video' }, [
        miniatura(v),
        el('div', { clase: 'top', style: 'margin-top:12px' }, [el('span', { clase: 'tag pilar', texto: v.categoria }), el('span', { clase: 'tag', texto: v.plataforma + ' · ' + v.duracion })]),
        el('p', { clase: 'meta-v', texto: v.cuenta + ' · ' + v.cifras }),
        el('p', {}, [el('b', { texto: 'Los primeros segundos: ' }), document.createTextNode(v.gancho)]),
        el('p', {}, [el('b', { texto: 'Por qué da ganas de ir: ' }), document.createTextNode(v.porque)]),
        el('p', { clase: 'para-a' }, [el('b', { texto: 'Para Atrévete: ' }), document.createTextNode(v.atrevete)])
      ]));
    });
  }
  document.querySelectorAll('.grupo-videos button').forEach(function (b) {
    b.addEventListener('click', function () {
      grupoV = b.getAttribute('data-g');
      document.querySelectorAll('.grupo-videos button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      pintarVideos();
    });
  });
  pintarVideos();

  /* ---------- Menú: sección activa y barra de avance ---------- */
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('.menu a'));
  var secciones = enlaces.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  var activoPrevio = null;
  function alDesplazar() {
    var barra = document.querySelector('.barra');
    var y = window.scrollY + (barra ? barra.offsetHeight + 20 : 90), actual = secciones[0];
    secciones.forEach(function (s) { if (s.offsetTop <= y) actual = s; });
    enlaces.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + actual.id;
      a.classList.toggle('activo', on);
      if (on && a !== activoPrevio) {
        var menu = a.parentNode, rm = menu.getBoundingClientRect(), ra = a.getBoundingClientRect();
        menu.scrollLeft += (ra.left - rm.left) - (rm.width - ra.width) / 2;
        activoPrevio = a;
      }
    });
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    document.getElementById('progreso').style.width = (alto > 0 ? (window.scrollY / alto) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
})();
