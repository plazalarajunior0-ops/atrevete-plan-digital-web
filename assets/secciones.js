/* Interacciones propias de las secciones (regalo, pauta, semana a semana, antes de arrancar). */
/* --- regalo --- */
/* Lo que ustedes deciden: las marcas se guardan en este navegador, como en «Antes de arrancar». */
(function () {
  var LLAVE = 'atrevete-digital-regalo';
  var casillas = document.querySelectorAll('#regalo .regalo-lista input[type="checkbox"]');
  var guardado = [];
  try {
    guardado = JSON.parse(localStorage.getItem(LLAVE) || '[]');
    if (!Array.isArray(guardado)) guardado = [];
  } catch (e) { guardado = []; }
  for (var i = 0; i < casillas.length; i++) {
    (function (c, i) {
      var fila = c.parentNode;
      if (guardado[i] === true) c.checked = true;
      if (fila && fila.classList) fila.classList.toggle('hecho', c.checked);
      c.addEventListener('change', function () {
        if (fila && fila.classList) fila.classList.toggle('hecho', c.checked);
        guardado[i] = c.checked;
        try { localStorage.setItem(LLAVE, JSON.stringify(guardado)); } catch (e) {}
      });
    })(casillas[i], i);
  }
})();

/* --- pauta --- */
/* Pauta: lectura de la gráfica diaria y simulador de boletas. */
(function () {
  var sec = document.getElementById('pauta');
  if (!sec) return;
  var TRM = 3191.47, PAUTA = 1220000; /* fases 2 y 3: $805.000 + $415.000 */
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function cop(n) { return '$' + miles(Math.round(n)); }
  function usd(n) { var p = (n / TRM).toFixed(2).split('.'); return 'USD ' + miles(p[0]) + ',' + p[1]; }

  /* ---------- Gráfica: pauta de cada día ---------- */
  var caja = document.getElementById('pauta-dias'), lee = document.getElementById('pauta-lee');
  if (caja && lee) {
    var barras = caja.getElementsByTagName('i'), actual = -1;
    var mostrar = function (i) {
      if (i < 0 || i >= barras.length || i === actual) return;
      if (actual >= 0) barras[actual].className = '';
      actual = i;
      var b = barras[i], v = +b.getAttribute('data-v');
      b.className = 'sel';
      lee.innerHTML = '<b>' + b.getAttribute('data-d') + ':</b> ' + cop(v) + ' (≈ ' + usd(v) + ') · ' + b.getAttribute('data-f');
    };
    var buscar = function (x, y) {
      var el = document.elementFromPoint(x, y);
      for (var i = 0; i < barras.length; i++) { if (barras[i] === el) return mostrar(i); }
      var r = caja.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        mostrar(Math.min(barras.length - 1, Math.floor((x - r.left) / (r.width / barras.length))));
      }
    };
    caja.addEventListener('mousemove', function (e) { buscar(e.clientX, e.clientY); });
    caja.addEventListener('click', function (e) { buscar(e.clientX, e.clientY); });
    caja.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t) buscar(t.clientX, t.clientY); }, { passive: true });
    caja.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) buscar(t.clientX, t.clientY); }, { passive: true });
    caja.addEventListener('keydown', function (e) {
      var k = e.key || e.keyCode;
      if (k === 'ArrowRight' || k === 'Right' || k === 39) { e.preventDefault(); mostrar(actual < 0 ? 0 : actual + 1); }
      else if (k === 'ArrowLeft' || k === 'Left' || k === 37) { e.preventDefault(); mostrar(actual < 0 ? 0 : actual - 1); }
      else if (k === 'Home' || k === 36) { e.preventDefault(); mostrar(0); }
      else if (k === 'End' || k === 35) { e.preventDefault(); mostrar(barras.length - 1); }
    });
    caja.addEventListener('focus', function () { if (actual < 0) mostrar(0); });
  }

  /* ---------- Simulador: cuántas boletas compra la pauta ---------- */
  var rc = document.getElementById('pauta-costo'), rb = document.getElementById('pauta-bol');
  if (!rc || !rb) return;
  var botones = sec.querySelectorAll('[data-pauta-costo]');
  function txt(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function calcular() {
    var c = +rc.value, n = +rb.value;
    var compras = Math.floor(PAUTA / c), boletas = compras * n, porBoleta = c / n;
    txt('pauta-costo-v', cop(c)); txt('pauta-costo-u', '≈ ' + usd(c));
    rc.setAttribute('aria-valuetext', cop(c) + ' por compra');
    txt('pauta-bol-v', String(n)); txt('pauta-bol-u', n === 1 ? 'boleta por compra' : 'boletas por compra');
    rb.setAttribute('aria-valuetext', n + (n === 1 ? ' boleta' : ' boletas') + ' por compra');
    txt('pauta-r-compras', miles(compras)); txt('pauta-r-boletas', miles(boletas));
    txt('pauta-r-costo', cop(porBoleta)); txt('pauta-r-costo-u', '≈ ' + usd(porBoleta));
    var estado;
    if (porBoleta <= 18000) estado = '<b class="lima">✓ Dentro de la meta:</b> hasta $18.000 por boleta (≈ USD 5,64), el 20 % del precio.';
    else if (porBoleta <= 22500) estado = '<b class="cyan">Aceptable, hay que vigilarla:</b> la meta es $18.000 por boleta (≈ USD 5,64).';
    else if (porBoleta <= 45000) estado = '<b class="rosa">✕ Se cambian las piezas:</b> pasa de $22.500 por boleta (≈ USD 7,05).';
    else estado = '<b class="rosa">✕ Se deja de pautarle a gente nueva:</b> pasa de $45.000 por boleta (≈ USD 14,10).';
    var e = document.getElementById('pauta-r-estado'); if (e) e.innerHTML = estado;
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute('aria-pressed', +botones[i].getAttribute('data-pauta-costo') === c ? 'true' : 'false');
    }
  }
  for (var j = 0; j < botones.length; j++) {
    botones[j].addEventListener('click', function () { rc.value = this.getAttribute('data-pauta-costo'); calcular(); });
  }
  rc.addEventListener('input', calcular); rc.addEventListener('change', calcular);
  rb.addEventListener('input', calcular); rb.addEventListener('change', calcular);
  calcular();
})();

/* --- cierre --- */
/* Semana a semana, ritmo de la sala y lista de lo que debe estar listo. */
(function () {
  function fechaHoy() {
    var h = new Date();
    return h.getFullYear() + '-' + ('0' + (h.getMonth() + 1)).slice(-2) + '-' + ('0' + h.getDate()).slice(-2);
  }
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function marcar(el, clase, on) { if (on) el.classList.add(clase); else el.classList.remove(clase); }

  /* ---------- Semana a semana: botones de semana y su detalle ---------- */
  var lista = document.getElementById('calendario-lista');
  if (lista) {
    var botones = Array.prototype.slice.call(lista.querySelectorAll('[role="tab"]'));
    var elegir = function (b, foco, centrar) {
      botones.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.setAttribute('tabindex', on ? '0' : '-1');
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (foco) b.focus();
      if (centrar) lista.scrollLeft += b.getBoundingClientRect().left - lista.getBoundingClientRect().left - 8;
    };
    botones.forEach(function (b, i) {
      b.addEventListener('click', function () { elegir(b, false, false); });
      b.addEventListener('keydown', function (e) {
        var j = -1, n = botones.length;
        if (e.key === 'ArrowRight' || e.key === 'Right') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'Left') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j > -1) { e.preventDefault(); elegir(botones[j], true, true); }
      });
    });
    /* Abre en la semana de hoy y la marca; después del show, en la última. */
    var hoy = fechaHoy(), inicial = botones[0];
    botones.forEach(function (b) {
      if (hoy >= b.getAttribute('data-desde') && hoy <= b.getAttribute('data-hasta')) {
        inicial = b;
        var marca = document.createElement('span');
        marca.className = 'calendario-hoy';
        marca.textContent = 'Esta semana';
        b.appendChild(marca);
      }
    });
    if (botones.length && hoy > botones[botones.length - 1].getAttribute('data-hasta')) inicial = botones[botones.length - 1];
    if (inicial) elegir(inicial, false, true);
  }

  /* ---------- Cómo medimos: metas de cada control según los puestos de la sala ---------- */
  var aforo = document.getElementById('medicion-aforo');
  if (aforo) {
    var metas = Array.prototype.slice.call(document.querySelectorAll('#medicion [data-pct]'));
    var pintar = function () {
      var n = parseInt(String(aforo.value).replace(/[^\d]/g, ''), 10);
      metas.forEach(function (m) {
        m.textContent = n > 0 ? miles(Math.round(n * Number(m.getAttribute('data-pct')) / 100)) : '________';
      });
    };
    try {
      var previo = localStorage.getItem('atrevete-digital-aforo');
      if (previo) aforo.value = previo;
    } catch (e) {}
    aforo.addEventListener('input', function () {
      pintar();
      try { localStorage.setItem('atrevete-digital-aforo', aforo.value); } catch (e) {}
    });
    pintar();
  }

  /* ---------- Antes de arrancar: las marcas se guardan en este navegador ---------- */
  var LLAVE = 'atrevete-digital-listo';
  var lc = document.getElementById('listos-lista');
  if (lc) {
    var guardado = {};
    try {
      guardado = JSON.parse(localStorage.getItem(LLAVE) || '{}');
      if (!guardado || typeof guardado !== 'object') guardado = {};
    } catch (e) { guardado = {}; }
    var cajas = Array.prototype.slice.call(lc.querySelectorAll('input[type="checkbox"]'));
    var cuenta = document.getElementById('listos-cuenta');
    var contar = function () {
      var n = 0;
      cajas.forEach(function (c) { if (c.checked) n++; });
      if (cuenta) cuenta.textContent = n + ' de ' + cajas.length + ' listos';
    };
    cajas.forEach(function (c) {
      var k = c.getAttribute('data-k'), item = c.parentNode;
      if (guardado[k] === true) c.checked = true;
      marcar(item, 'hecho', c.checked);
      c.addEventListener('change', function () {
        marcar(item, 'hecho', c.checked);
        guardado[k] = c.checked;
        try { localStorage.setItem(LLAVE, JSON.stringify(guardado)); } catch (e) {}
        contar();
      });
    });
    contar();
  }
})();
