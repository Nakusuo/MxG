/* =========================================================
   sections.js — las puertas del jardín
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function make(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  /* texto con saltos de línea, sin usar innerHTML */
  function lines(node, text) {
    text.split('\n').forEach(function (line, i) {
      if (i) node.appendChild(document.createElement('br'));
      node.appendChild(document.createTextNode(line));
    });
    return node;
  }

  /* chispas que salen de un elemento */
  function sparkle(node, icons, n) {
    for (var i = 0; i < (n || 6); i++) {
      var s = make('span', 'spark', node);
      s.textContent = icons[i % icons.length];
      s.style.left = (28 + Math.random() * 44) + '%';
      s.style.top = '38%';
      s.style.setProperty('--dx', (Math.random() * 150 - 75) + 'px');
      s.style.setProperty('--dy', (-50 - Math.random() * 80) + 'px');
      s.style.setProperty('--dr', (Math.random() * 260 - 130) + 'deg');
      s.style.animationDelay = (Math.random() * 0.3) + 's';
      (function (el) { setTimeout(function () { el.remove(); }, 2400); })(s);
    }
  }

  /* aviso breve, arriba del todo */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 5200);
  }

  /* flor pequeña reutilizable: rosa o amarilla */
  var HUES = {
    gold: { a: '#f2c14b', b: '#e8a41f', edge: '#b3730f', core: '#3a2213', shine: '#5c3a1e' },
    rose: { a: '#e87cac', b: '#dd6295', edge: '#a33863', core: '#4a2331', shine: '#6d3549' }
  };

  function sunflower(parent, opts) {
    opts = opts || {};
    var n = opts.petals || 14;
    var hue = HUES[opts.hue] || HUES.gold;
    var g = svgEl('g', { class: 'mini-flower', transform: opts.at || '' }, parent);

    var petals = svgEl('g', { class: 'mf-petals' }, g);
    var rr = function (a, b) { return a + Math.random() * (b - a); };
    for (var i = 0; i < n; i++) {
      /* la rotación va en un grupo aparte: el CSS anima el pétalo de dentro.
         Con un poco de desorden para que no parezca hecho con compás. */
      var slot = svgEl('g', {
        transform: 'rotate(' + (i * (360 / n) + rr(-7, 7)).toFixed(1) + ')'
      }, petals);
      var p = svgEl('ellipse', {
        class: 'mf-petal',
        cx: rr(-1, 1).toFixed(1), cy: -(opts.r || 26) * rr(0.93, 1.07),
        rx: (opts.pw || 6.4) * rr(0.86, 1.14),
        ry: (opts.ph || 15) * rr(0.88, 1.12),
        fill: i % 2 ? hue.a : hue.b,
        stroke: hue.edge, 'stroke-width': rr(0.9, 1.6).toFixed(1),
        opacity: rr(0.93, 1).toFixed(2)
      }, slot);
      p.style.setProperty('--k', i % 7);
    }
    var disc = svgEl('g', { class: 'mf-disc' }, g);
    svgEl('circle', { cx: 0, cy: 0, r: (opts.dr || 11), fill: hue.core }, disc);
    svgEl('circle', { cx: -3, cy: -3, r: (opts.dr || 11) * 0.34, fill: hue.shine, opacity: 0.7 }, disc);
    return g;
  }

  /* =======================================================
     PROGRESO — la última puerta se abre al final
     ======================================================= */
  var Progress = (function () {
    var DOORS = ['screen-carta', 'screen-recuerdos', 'screen-cajita', 'screen-cielo', 'screen-mirada'];
    var seen = {}, boxesOpen = 0, boxesTotal = 0, unlocked = false;

    function ready() {
      if (boxesTotal === 0 || boxesOpen < boxesTotal) return false;
      for (var i = 0; i < DOORS.length; i++) if (!seen[DOORS[i]]) return false;
      return true;
    }

    function unlock() {
      if (unlocked || !ready()) return;
      unlocked = true;
      var card = document.querySelector('.opt-last');
      var invite = document.querySelector('#invite .invite-text');
      if (card) {
        card.hidden = false;
        requestAnimationFrame(function () { card.classList.add('revealed'); });
        if (window.Intro && window.Intro.settle) window.Intro.settle(card);
      }
      if (invite) invite.textContent = 'Queda una última cosa…';
      /* que al volver al ramo ya esté abierto, con la nueva a la vista */
      if (window.Intro && window.Intro.openMenu) window.Intro.openMenu();
      toast('Se abrió algo nuevo junto al ramo 🌙');
    }

    return {
      setBoxes: function (n) { boxesTotal = n; },
      boxOpened: function () { boxesOpen++; unlock(); },
      visit: function (id) { seen[id] = true; unlock(); },
      isUnlocked: function () { return unlocked; }
    };
  })();

  document.addEventListener('screen:enter', function (e) {
    Progress.visit(e.detail.id);
  });

  /* =======================================================
     1 · LA CARTA
     ======================================================= */
  (function letter() {
    var body = document.getElementById('letter-body');
    if (!body) return;
    var ps = body.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) ps[i].style.setProperty('--i', i);

    var flower = document.querySelector('.letter-flower');
    if (!flower) return;
    var g = svgEl('g', { transform: 'translate(60,58)' }, flower);
    for (var k = 0; k < 16; k++) {
      svgEl('ellipse', {
        cx: 0, cy: -34, rx: 8.5, ry: 22,
        fill: k % 2 ? '#e87cac' : '#dd6295',
        stroke: '#a33863', 'stroke-width': 1.4,
        transform: 'rotate(' + (k * 22.5) + ')'
      }, g);
    }
    svgEl('circle', { cx: 0, cy: 0, r: 17, fill: '#4a2331' }, g);
    svgEl('circle', { cx: -5, cy: -5, r: 6, fill: '#6d3549', opacity: 0.6 }, g);
    svgEl('path', {
      d: 'M0,17 C4,34 2,48 -4,58', fill: 'none',
      stroke: '#4a7440', 'stroke-width': 5, 'stroke-linecap': 'round'
    }, g);
    svgEl('path', {
      d: 'M2,30 C16,26 26,32 28,42 C16,46 6,40 2,30 Z',
      fill: '#4a7440', stroke: '#2d4a2b', 'stroke-width': 1.4
    }, g);
  })();

  /* =======================================================
     2 · JARDÍN DE RECUERDOS
     ======================================================= */
  (function garden() {
    var host = document.getElementById('garden');
    if (!host) return;

    var MOMENTS = [
      {
        label: 'Nuestro primer momento',
        text: 'Quién diría que ese primer encuentro, que en su momento parecía una cosa tan pequeña, iba a terminar convirtiéndose en el comienzo de nosotras.'
      },
      {
        label: 'Ese día',
        text: 'Todavía me acuerdo de ese día en el cine, de llegar tarde y de que, sin saberlo, estaba llegando también al comienzo de una de las personas que más quiero tener cerca.'
      },
      {
        label: 'Nosotras',
        text: 'Me gusta pensar que nuestra historia está hecha justamente de estas pequeñas cosas: de las conversaciones que se alargan, de las risas por cualquier tontería, de querer contarnos hasta lo más insignificante del día y de cómo, poquito a poquito, empezaste a formar parte de mi rutina sin que siquiera me diera cuenta.'
      },
      {
        label: 'Hoy',
        text: 'Y este momento también quería guardarlo aquí. Porque quizá algún día miremos todo esto desde lejos y nos dé risa pensar en cómo empezó, pero yo voy a seguir pensando que qué bonito fue encontrarte justo a ti.'
      }
    ];

    MOMENTS.forEach(function (m, i) {
      var b = make('button', 'memory', host);
      b.type = 'button';
      b.style.setProperty('--i', i);
      b.style.setProperty('--tilt', (i % 2 ? 0.7 : -0.8) + 'deg');
      b.setAttribute('aria-expanded', 'false');

      var art = make('div', 'memory-art', b);
      var svg = svgEl('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, art);
      svgEl('path', {
        class: 'mf-stem',
        d: 'M50,52 C52,70 51,84 47,96',
        fill: 'none', stroke: '#4a7440', 'stroke-width': 5, 'stroke-linecap': 'round'
      }, svg);
      svgEl('path', {
        class: 'mf-leaf',
        d: 'M51,68 C64,63 76,68 78,79 C65,84 54,79 51,68 Z',
        fill: '#4a7440', stroke: '#2d4a2b', 'stroke-width': 1.4
      }, svg);
      var bud = svgEl('g', { class: 'mf-bud', transform: 'translate(50,42)' }, svg);
      svgEl('circle', { cx: 0, cy: 0, r: 12, fill: '#2d4a2b' }, bud);
      for (var s = 0; s < 6; s++) {
        svgEl('ellipse', {
          cx: 0, cy: -11, rx: 5, ry: 11, fill: s % 2 ? '#4a7440' : '#3f6a3a',
          stroke: '#2d4a2b', 'stroke-width': 1,
          transform: 'rotate(' + (s * 60) + ')'
        }, bud);
      }
      sunflower(svg, { at: 'translate(50,42)', r: 24, pw: 6, ph: 14, dr: 10, hue: i % 2 ? 'gold' : 'rose' });

      var txt = make('div', 'memory-body', b);
      var label = make('span', 'memory-label', txt);
      label.textContent = m.label;
      var para = make('span', 'memory-text', txt);
      if (m.fill) {
        para.appendChild(document.createTextNode(m.text));
        var mark = make('span', 'fill-me', para);
        mark.textContent = m.fill;
        para.appendChild(document.createTextNode(m.after || ''));
      } else {
        para.textContent = m.text;
      }
      var hint = make('span', 'memory-hint', b);
      hint.textContent = 'tócame';

      b.addEventListener('click', function () {
        var open = b.classList.toggle('open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) sparkle(b, ['✨', '🌼', '💗'], 5);
      });
    });
  })();

  /* =======================================================
     3 · LAS CAJITAS
     ======================================================= */
  (function boxes() {
    var host = document.getElementById('boxes');
    if (!host) return;

    var GIFTS = [
      {
        label: 'Lo que nunca sé cómo decirte',
        paras: [
          'Hay veces en las que quiero decirte algo bonito y termino diciendo cualquier tontería.\nNo porque no tenga nada que decir.\nTodo lo contrario.',
          'Creo que a veces siento demasiado y no sé cómo ponerlo en palabras sin que suene enorme.',
          'Pero si pudiera decirte una sola cosa sin preocuparme por cómo suena, sería esta:',
          'me haces sentir muy afortunada.',
          'De todas las personas que pude haber conocido,\nde todas las casualidades que pudieron pasar,\nme tocó encontrarte a ti.',
          'Y todavía me parece increíble.'
        ],
        strong: [3],
        lid: '#c9628e', base: '#ac5077', ribbon: '#bfe0a8'
      },
      {
        label: 'Una cosa que guardo',
        paras: [
          'Hay momentos contigo que probablemente tú ya olvidaste.\nYo no.',
          'Y no porque hayan sido momentos enormes.\nJustamente porque fueron pequeños.',
          'Esos son los que más me gustan.\nLos que nadie más habría considerado importantes,\npero que por alguna razón se quedaron conmigo.',
          'Creo que ahí es donde más se nota cuánto te quiero:\nen todas esas cosas que guardo sin que tú siquiera sepas que las guardé.'
        ],
        strong: [3],
        lid: '#4f7d52', base: '#3f6644', ribbon: '#ffc2da'
      },
      {
        label: 'Si alguna vez lo dudas',
        paras: [
          'Si alguna vez dudas de cuánto significas para mí,\nojalá recuerdes que no hice esto por tener algo bonito que darte.',
          'Lo hice porque quería dejarte algo que pudieras volver a mirar algún día\ny encontrarme aquí.',
          'En cada palabra.\nEn cada detalle.\nEn cada pequeño rincón que hice pensando en ti.',
          'Porque aunque no siempre sepa decirte todo lo que siento,\nhay algo que sí sé:',
          'quiero que tengas pruebas de que te quise en este momento de nuestras vidas.',
          'De verdad.\nCon todo lo que soy ahora.'
        ],
        strong: [4],
        lid: '#b04f77', base: '#963f64', ribbon: '#d7ecc4'
      }
    ];

    Progress.setBoxes(GIFTS.length);

    GIFTS.forEach(function (gift, i) {
      var b = make('button', 'gift', host);
      b.type = 'button';
      b.style.setProperty('--i', i);
      b.style.setProperty('--tilt', (i % 2 ? 0.9 : -1) + 'deg');
      b.setAttribute('aria-expanded', 'false');

      var art = make('div', 'gift-art', b);
      var svg = svgEl('svg', { viewBox: '0 0 140 124', 'aria-hidden': 'true' }, art);

      /* lo que asoma al abrirla */
      var inside = svgEl('g', { class: 'gift-inside' }, svg);
      sunflower(inside, {
        at: 'translate(70,44)', petals: 12, r: 18, pw: 5, ph: 11, dr: 8,
        hue: i % 2 ? 'gold' : 'rose'
      });
      var heart = 'M0,0 C-4,-5 -10,-4 -10,1 C-10,6 -4,9 0,13 C4,9 10,6 10,1 C10,-4 4,-5 0,0 Z';
      svgEl('path', {
        d: heart, fill: '#e79ab0', opacity: 0.9,
        transform: 'translate(40,40) scale(0.8) rotate(-14)'
      }, inside);
      svgEl('path', {
        d: heart, fill: '#bfe0a8', opacity: 0.85,
        transform: 'translate(102,46) scale(0.62) rotate(18)'
      }, inside);

      /* caja */
      var base = svgEl('g', { class: 'gift-base' }, svg);
      svgEl('rect', { x: 24, y: 62, width: 92, height: 54, rx: 11, fill: gift.base }, base);
      svgEl('rect', { x: 63, y: 62, width: 14, height: 54, fill: gift.ribbon, opacity: 0.92 }, base);
      svgEl('rect', {
        x: 24, y: 62, width: 92, height: 54, rx: 11, fill: 'none',
        stroke: 'rgba(0,0,0,.35)', 'stroke-width': 2
      }, base);

      var lid = svgEl('g', { class: 'gift-lid' }, svg);
      svgEl('rect', { x: 16, y: 42, width: 108, height: 24, rx: 9, fill: gift.lid }, lid);
      svgEl('rect', { x: 63, y: 42, width: 14, height: 24, fill: gift.ribbon, opacity: 0.92 }, lid);
      svgEl('rect', {
        x: 16, y: 42, width: 108, height: 24, rx: 9, fill: 'none',
        stroke: 'rgba(0,0,0,.35)', 'stroke-width': 2
      }, lid);
      svgEl('path', {
        d: 'M70,44 C58,28 40,30 40,40 C40,48 56,50 70,44 C84,50 100,48 100,40 C100,30 82,28 70,44 Z',
        fill: gift.ribbon, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 1.8, 'stroke-linejoin': 'round'
      }, lid);

      var body = make('div', 'gift-body', b);
      var label = make('span', 'gift-label', body);
      label.textContent = gift.label;

      var text = make('div', 'gift-text', body);
      gift.paras.forEach(function (para, k) {
        var p = make('p', 'gift-para' + (gift.strong.indexOf(k) >= 0 ? ' gift-strong' : ''), text);
        lines(p, para);
      });

      var hint = make('span', 'gift-hint', b);
      hint.textContent = 'ábreme';

      var opened = false;
      b.addEventListener('click', function () {
        var open = b.classList.toggle('open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          sparkle(b, ['💗', '✨', '🌸', '♡'], 7);
          if (!opened) { opened = true; Progress.boxOpened(); }
        }
      });
    });
  })();

  /* =======================================================
     4 · OTRO LUGAR
     ======================================================= */
  (function sky() {
    var svg = document.getElementById('sky');
    var lineEl = document.getElementById('sky-line');
    var wrap = document.getElementById('sky-wrap');
    var hint = document.getElementById('sky-hint');
    var finalEl = document.getElementById('sky-final');
    var screen = document.getElementById('screen-cielo');
    if (!svg || !screen) return;

    var LINES = [
      'Cierra los ojos por un segundo.',
      'Literalmente no claroXD porque necesito que sigas mirando la pantalla jkasdj.',
      'Pero imagina que por un momento estamos en algún lugar lejos de todo.',
      'Solo tú y yo.'
    ];

    var CX = 200, CY = 168, S = 10.6, N = 14;

    function heartAt(t) {
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return { x: CX + x * S, y: CY - y * S };
    }

    /* repartir por longitud de curva, no por ángulo:
       si no, las estrellas se amontonan en la punta y en el pico */
    var SAMPLES = 720;
    var walk = [], acc = [0], total = 0, prev = heartAt(Math.PI);
    walk.push(prev);
    for (var w = 1; w <= SAMPLES; w++) {
      var p = heartAt(Math.PI + (w / SAMPLES) * Math.PI * 2);
      total += Math.hypot(p.x - prev.x, p.y - prev.y);
      acc.push(total);
      walk.push(p);
      prev = p;
    }

    var raw = [], cursor = 0;
    for (var i = 0; i < N; i++) {
      var target = (i / N) * total;
      while (cursor < acc.length - 1 && acc[cursor] < target) cursor++;
      raw.push(walk[cursor]);
    }

    /* Guardián: si dos estrellas caen encima (a menos de 24), se queda una.
       Pasaba en las puntas del corazón y no se podían tocar por separado. */
    var MIN_GAP = 24;
    var pts = [];
    raw.forEach(function (p) {
      for (var k = 0; k < pts.length; k++) {
        if (Math.hypot(p.x - pts[k].x, p.y - pts[k].y) < MIN_GAP) return;
      }
      pts.push(p);
    });
    if (window.console && pts.length < raw.length) {
      console.info('Estrellas pegadas eliminadas:', raw.length - pts.length);
    }

    var deco = svgEl('g', { opacity: 0.55 }, svg);
    for (var d = 0; d < 46; d++) {
      svgEl('circle', {
        cx: (Math.random() * 400).toFixed(1),
        cy: (Math.random() * 360).toFixed(1),
        r: (Math.random() * 1.2 + 0.3).toFixed(2),
        fill: 'rgba(255,238,246,' + (0.15 + Math.random() * 0.4).toFixed(2) + ')'
      }, deco);
    }

    var lineLayer = svgEl('g', {}, svg);
    var starLayer = svgEl('g', {}, svg);
    var lit = 0, drawn = false;

    pts.forEach(function (p, idx) {
      var g = svgEl('g', { class: 'star-hit', tabindex: '0', role: 'button' }, starLayer);
      g.setAttribute('aria-label', 'Estrella ' + (idx + 1));
      svgEl('circle', { cx: p.x, cy: p.y, r: 17, fill: 'transparent' }, g);
      svgEl('circle', { class: 'star-halo', cx: p.x, cy: p.y, r: 11 }, g);
      svgEl('circle', { class: 'star-dot', cx: p.x, cy: p.y, r: 3.1 }, g);

      function light() {
        if (g.classList.contains('lit') || drawn) return;
        g.classList.add('lit');
        lit++;
        if (hint) {
          hint.textContent = lit < pts.length ? 'Faltan ' + (pts.length - lit) + '…' : 'Ahí está.';
        }
        if (lit === pts.length) drawHeart();
      }
      g.addEventListener('click', light);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); light(); }
      });
    });

    function drawHeart() {
      drawn = true;
      var d = 'M' + pts.map(function (p) {
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      }).join(' L') + ' Z';
      var path = svgEl('path', { class: 'const-line', d: d }, lineLayer);
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(.22,.61,.36,1)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
      });
      setTimeout(function () {
        if (finalEl) finalEl.classList.add('show');
      }, 2400);
    }

    var started = false, idx = 0, timer = null;

    function showLine(i) {
      if (!lineEl) return;
      lineEl.classList.remove('show');
      setTimeout(function () {
        lineEl.textContent = LINES[i];
        lineEl.classList.add('show');
      }, 480);
    }

    function next() {
      idx++;
      if (idx < LINES.length) {
        showLine(idx);
        timer = setTimeout(next, idx === 1 ? 4200 : 3600);
      } else {
        clearTimeout(timer);
        if (wrap) wrap.classList.add('show');
      }
    }

    function start() {
      if (started) return;
      started = true;
      showLine(0);
      timer = setTimeout(next, 3200);
    }

    if (lineEl) lineEl.addEventListener('click', function () {
      if (!started || idx >= LINES.length) return;
      clearTimeout(timer);
      next();
    });

    document.addEventListener('screen:enter', function (e) {
      if (e.detail.id === 'screen-cielo') setTimeout(start, 500);
    });
  })();

  /* =======================================================
     5 · MIRA LO QUE VEO
     ======================================================= */
  (function mirada() {
    var host = document.getElementById('eyes');
    var lens = document.getElementById('eye-lens');
    var hint = document.getElementById('eye-hint');
    var end = document.getElementById('mirada-end');
    if (!host) return;

    /* x,y para pantalla ancha · mx,my para móvil (columna centrada) */
    var GLIMPSES = [
      { t: 'La ternura que encuentro en ti.', x: 26, y: 24, mx: 50, my: 20, big: true },
      { t: 'La persona que admiro.', x: 72, y: 46, mx: 50, my: 48, big: true },
      { t: 'La persona que me hace sonreír\nincluso cuando no estoy hablando contigo.', x: 38, y: 76, mx: 50, my: 78, big: true },
      { t: '🌻', x: 86, y: 18, mx: 84, my: 10 },
      { t: '♡', x: 12, y: 54, mx: 12, my: 36 },
      { t: '✧', x: 58, y: 12, mx: 22, my: 8 },
      { t: '♡', x: 88, y: 80, mx: 86, my: 66 },
      { t: '✧', x: 46, y: 46, mx: 80, my: 34 },
      { t: '🌸', x: 16, y: 86, mx: 14, my: 92 }
    ];

    var narrow = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;

    var nodes = GLIMPSES.map(function (g) {
      var n = make('span', 'glimpse' + (g.big ? ' glimpse-big' : ''), host);
      lines(n, g.t);
      n.style.setProperty('--rot', (Math.random() * 5 - 2.5).toFixed(1) + 'deg');
      return { el: n, spec: g, big: g.big, found: false };
    });

    function place() {
      var small = narrow ? narrow.matches : window.innerWidth <= 640;
      nodes.forEach(function (n) {
        n.el.style.left = (small ? n.spec.mx : n.spec.x) + '%';
        n.el.style.top = (small ? n.spec.my : n.spec.y) + '%';
      });
    }
    place();
    if (narrow && narrow.addEventListener) narrow.addEventListener('change', place);
    else window.addEventListener('resize', place);

    var reveal = make('button', 'mini-btn reveal-all', null);
    reveal.type = 'button';
    reveal.textContent = 'enséñamelo todo ✧';
    host.parentNode.insertBefore(reveal, end);

    var found = 0;
    var pending = null;

    function apply(px, py) {
      var box = host.getBoundingClientRect();
      var R = Math.max(150, Math.min(box.width, box.height) * 0.42);
      nodes.forEach(function (n) {
        var b = n.el.getBoundingClientRect();
        var cx = b.left - box.left + b.width / 2;
        var cy = b.top - box.top + b.height / 2;
        var dist = Math.hypot(cx - px, cy - py);
        var k = Math.max(0, 1 - dist / R);
        var o = n.found ? Math.max(0.22, k) : k;
        n.el.style.opacity = o.toFixed(3);
        n.el.style.transform = 'translate(-50%,-50%) rotate(var(--rot)) scale(' + (0.9 + k * 0.14).toFixed(3) + ')';
        if (!n.found && k > 0.72) {
          n.found = true;
          n.el.classList.add('found');
          if (n.big) {
            found++;
            if (found === 3) finish();
          }
        }
      });
    }

    function move(e) {
      var box = host.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      var px = p.clientX - box.left;
      var py = p.clientY - box.top;
      if (lens) {
        lens.style.opacity = '1';
        lens.style.transform = 'translate(' + px + 'px,' + py + 'px)';
      }
      if (hint) hint.classList.add('faded');
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(function () { apply(px, py); });
    }

    function leave() {
      if (lens) lens.style.opacity = '0';
      nodes.forEach(function (n) {
        n.el.style.opacity = n.found ? '0.22' : '0';
        n.el.style.transform = 'translate(-50%,-50%) rotate(var(--rot)) scale(.94)';
      });
    }

    host.addEventListener('mousemove', move);
    host.addEventListener('mouseleave', leave);
    host.addEventListener('touchstart', function (e) { move(e); }, { passive: true });
    host.addEventListener('touchmove', function (e) { move(e); }, { passive: true });
    host.addEventListener('touchend', leave);

    function finish() {
      setTimeout(function () {
        if (end) end.classList.add('show');
        host.classList.add('done');
      }, 900);
    }

    reveal.addEventListener('click', function () {
      host.classList.add('all');
      nodes.forEach(function (n) {
        n.found = true;
        n.el.classList.add('found');
        n.el.style.opacity = '';
        n.el.style.transform = '';
      });
      reveal.disabled = true;
      reveal.textContent = 'ahí está todo ♡';
      if (hint) hint.classList.add('faded');
      finish();
    });
  })();

  /* =======================================================
     6 · LA ÚLTIMA
     ======================================================= */
  (function final() {
    var body = document.getElementById('final-body');
    if (!body) return;
    var ps = body.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) ps[i].style.setProperty('--i', i);

    var screen = document.getElementById('screen-final');
    var timers = [];

    /* si ella se pone a leer por su cuenta, dejamos de mover la página */
    var manual = false;
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
      if (screen) screen.addEventListener(ev, function () { manual = true; }, { passive: true });
    });

    document.addEventListener('screen:enter', function (e) {
      if (e.detail.id !== 'screen-final') return;

      var host = document.querySelector('#screen-final .panel');
      if (host) setTimeout(function () { sparkle(host, ['🌸', '♡', '✧', '💗'], 10); }, 400);

      /* la página va bajando al ritmo en que aparecen las frases */
      timers.forEach(clearTimeout);
      timers = [];
      manual = false;
      for (var i = 0; i < ps.length; i++) {
        (function (p, k) {
          timers.push(setTimeout(function () {
            if (manual || !screen || !screen.classList.contains('is-active')) return;
            var box = p.getBoundingClientRect();
            if (box.bottom > window.innerHeight - 40 || box.top < 60) {
              try {
                p.scrollIntoView({ block: 'center', behavior: 'smooth' });
              } catch (err) { p.scrollIntoView(false); }
            }
          }, 1200 + k * 850));
        })(ps[i], i);
      }
    });
  })();
})();
