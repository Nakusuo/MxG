/* =========================================================
   bouquet.js — construye el ramo de girasoles en SVG
   Todo es procedural: tallos, hojas, capullos, pétalos y semillas.
   Cada elemento recibe un retraso (--d) para la coreografía de entrada.
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* --- azar semillado: organico pero siempre igual al recargar --- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20240914);
  function rand(a, b) { return a + rnd() * (b - a); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function round(n) { return Math.round(n * 100) / 100; }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }
  function delay(node, seconds) {
    node.style.setProperty('--d', round(seconds) + 's');
    return node;
  }

  /* =======================================================
     LÍNEA DE TIEMPO (segundos)
     ======================================================= */
  var T = {
    stemStart: 0.50,
    stemStep: 0.09,
    stemDur: 1.75,
    leafStart: 1.60,
    leafStep: 0.09,
    leafSub: 0.15,
    budStart: 2.35,
    budStep: 0.11,
    openStart: 3.15,
    openStep: 0.17,
    petalLayer: 0.12,
    petalStep: 0.011
  };

  /* =======================================================
     PALETAS
     ======================================================= */
  /* dos familias: rosa y amarillo. El ramo las mezcla. */
  var PETALS = [
    /* 0-2 rosas */
    { base: '#dd6295', tip: '#ffc9de', edge: '#a33863', rose: true },
    { base: '#e87cac', tip: '#ffdcea', edge: '#b34a76', rose: true },
    { base: '#cf5285', tip: '#ffb6d1', edge: '#963055', rose: true },
    /* 3-5 amarillas */
    { base: '#dd9714', tip: '#ffdd80', edge: '#a9690b' },
    { base: '#e8a41f', tip: '#ffe9a3', edge: '#b3730f' },
    { base: '#efb62f', tip: '#fff0bc', edge: '#c0800f' },
    /* 6-7 rosas de verdad, más saturadas */
    { base: '#c9436f', tip: '#ff9fc0', edge: '#8b2749', rose: true },
    { base: '#d95a86', tip: '#ffb8d2', edge: '#9c3358', rose: true },
    /* 8 florecillas pálidas */
    { base: '#f3b8ce', tip: '#fff4f8', edge: '#c98aa6', rose: true }
  ];
  var ROSE_PALS = [0, 1, 2];
  var GOLD_PALS = [3, 4, 5];
  var BLOOM_PALS = [6, 7];
  var PALE_PAL = 8;

  var GREENS = [
    { blade: '#4f7d44', dark: '#2f4f2c', vein: '#84ad60' },
    { blade: '#437142', dark: '#2a4728', vein: '#749d54' },
    { blade: '#5b8749', dark: '#375630', vein: '#90b869' }
  ];

  /* =======================================================
     FORMAS
     ======================================================= */
  /* Ningún contorno es una fórmula limpia: se dibuja punto a punto,
     con temblor, y se suaviza con Catmull-Rom. Así ningún pétalo
     es igual a otro y nada queda perfectamente simétrico. */
  function smoothClosed(pts) {
    var n = pts.length;
    var d = 'M' + round(pts[0].x) + ',' + round(pts[0].y);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i],
          p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ' C' + round(p1.x + (p2.x - p0.x) / 6) + ',' + round(p1.y + (p2.y - p0.y) / 6) +
           ' ' + round(p2.x - (p3.x - p1.x) / 6) + ',' + round(p2.y - (p3.y - p1.y) / 6) +
           ' ' + round(p2.x) + ',' + round(p2.y);
    }
    return d + ' Z';
  }

  /* pétalo de girasol: puntiagudo, torcido, nunca simétrico */
  function petalShape(h, w) {
    var lean = rand(-0.16, 0.16);          /* se inclina hacia un lado */
    var fatL = rand(0.82, 1.14), fatR = rand(0.82, 1.14);
    var tipY = -h * rand(0.96, 1.04);
    var j = function (v) { return v * rand(0.9, 1.1); };
    function bend(y) { return lean * -y * 0.55; }

    var pts = [
      { x: j(0), y: 0 },
      { x: bend(-h * 0.2) - w * 0.5 * fatL, y: -h * j(0.2) },
      { x: bend(-h * 0.55) - w * 0.98 * fatL, y: -h * j(0.55) },
      { x: bend(-h * 0.85) - w * 0.48 * fatL, y: -h * j(0.86) },
      { x: bend(tipY) + rand(-w * 0.12, w * 0.12), y: tipY },
      { x: bend(-h * 0.85) + w * 0.48 * fatR, y: -h * j(0.86) },
      { x: bend(-h * 0.55) + w * 0.98 * fatR, y: -h * j(0.55) },
      { x: bend(-h * 0.2) + w * 0.5 * fatR, y: -h * j(0.2) }
    ];
    return smoothClosed(pts);
  }

  /* pétalo de rosa: ancho, acopado, con el borde ondulado */
  function rosePetalShape(h, w) {
    var lean = rand(-0.2, 0.2);
    var fatL = rand(0.86, 1.12), fatR = rand(0.86, 1.12);
    function bend(y) { return lean * -y * 0.5; }
    var j = function (v) { return v * rand(0.92, 1.08); };

    var pts = [
      { x: rand(-w * 0.1, w * 0.1), y: 0 },
      { x: bend(-h * 0.15) - w * 0.72 * fatL, y: -h * j(0.14) },
      { x: bend(-h * 0.55) - w * 1.02 * fatL, y: -h * j(0.55) },
      { x: bend(-h * 0.9) - w * 0.58 * fatL, y: -h * j(0.93) },
      { x: bend(-h) - w * rand(0.05, 0.2), y: -h * rand(1, 1.06) },
      { x: bend(-h) + w * rand(0.05, 0.2), y: -h * rand(0.98, 1.05) },
      { x: bend(-h * 0.9) + w * 0.58 * fatR, y: -h * j(0.93) },
      { x: bend(-h * 0.55) + w * 1.02 * fatR, y: -h * j(0.55) },
      { x: bend(-h * 0.15) + w * 0.72 * fatR, y: -h * j(0.14) }
    ];
    return smoothClosed(pts);
  }

  /* hoja: nervio torcido, un lado más gordo que el otro */
  function leafShape(L, W) {
    var droop = rand(-0.18, 0.18);
    var up = rand(0.82, 1.15), down = rand(0.82, 1.15);
    function sag(x) { return droop * x * 0.35; }
    var j = function (v) { return v * rand(0.9, 1.1); };

    var pts = [
      { x: 0, y: 0 },
      { x: L * j(0.2), y: sag(L * 0.2) - W * 0.74 * up },
      { x: L * j(0.48), y: sag(L * 0.48) - W * 1.04 * up },
      { x: L * j(0.72), y: sag(L * 0.72) - W * 0.78 * up },
      { x: L * j(0.9), y: sag(L * 0.9) - W * 0.34 * up },   /* se afila hacia la punta */
      { x: L * rand(1.02, 1.12), y: sag(L) + W * rand(-0.04, 0.06) },
      { x: L * j(0.88), y: sag(L * 0.88) + W * 0.36 * down },
      { x: L * j(0.7), y: sag(L * 0.7) + W * 0.78 * down },
      { x: L * j(0.45), y: sag(L * 0.45) + W * 1.0 * down },
      { x: L * j(0.18), y: sag(L * 0.18) + W * 0.7 * down }
    ];
    return smoothClosed(pts);
  }

  function sepalShape(h, w) {
    var lean = rand(-0.25, 0.25);
    var pts = [
      { x: 0, y: 0 },
      { x: -w * rand(0.85, 1.15) + lean * h * 0.2, y: -h * rand(0.34, 0.46) },
      { x: -w * rand(0.35, 0.6) + lean * h * 0.4, y: -h * rand(0.82, 0.94) },
      { x: lean * h * 0.5, y: -h * rand(0.96, 1.06) },
      { x: w * rand(0.35, 0.6) + lean * h * 0.4, y: -h * rand(0.82, 0.94) },
      { x: w * rand(0.85, 1.15) + lean * h * 0.2, y: -h * rand(0.34, 0.46) }
    ];
    return smoothClosed(pts);
  }

  /* trazo abierto que pasa por unos puntos, con la mano temblona */
  function smoothOpen(pts) {
    var n = pts.length;
    var d = 'M' + round(pts[0].x) + ',' + round(pts[0].y);
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i],
          p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      d += ' C' + round(p1.x + (p2.x - p0.x) / 6) + ',' + round(p1.y + (p2.y - p0.y) / 6) +
           ' ' + round(p2.x - (p3.x - p1.x) / 6) + ',' + round(p2.y - (p3.y - p1.y) / 6) +
           ' ' + round(p2.x) + ',' + round(p2.y);
    }
    return d;
  }

  /* círculo dibujado a pulso: ninguno sale redondo */
  function blobPath(r, n, wob) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 + rand(-0.09, 0.09);
      var rr = r * rand(1 - wob, 1 + wob);
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
    return smoothClosed(pts);
  }

  /* cada cabeza mira un poco hacia otro lado */
  function tiltHead(head) {
    return el('g', {
      transform: 'rotate(' + round(rand(-8, 8)) + ') scale(' +
        round(rand(0.95, 1.04)) + ',' + round(rand(0.89, 1.01)) + ')'
    }, head);
  }

  /* tinta: el mismo contorno, dibujado "a mano" un pelo desplazado.
     Es lo que hace que no parezca un vector perfecto. */
  var INK_PETAL = '#3d2130';
  var INK_LEAF = '#20351d';
  function inkOutline(parent, d, color, width) {
    /* el desplazamiento va en un grupo aparte para que la animación
       del pétalo (que usa transform) no lo pise */
    var g = el('g', {
      transform: 'translate(' + round(rand(-1.7, 1.7)) + ',' + round(rand(-1.7, 1.7)) +
                 ') rotate(' + round(rand(-1.2, 1.2)) + ')'
    }, parent);
    return el('path', {
      class: 'ink',
      d: d, fill: 'none',
      stroke: color || INK_PETAL,
      'stroke-width': round(width || rand(1.1, 2.1)),
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      opacity: round(rand(0.26, 0.46))
    }, g);
  }

  /* =======================================================
     DEFINICIÓN DEL RAMO
     x,y = punta del tallo (centro de la flor)
     depth: 0 = atrás, 1 = medio, 2 = frente
     ======================================================= */
  var FLOWERS = [
    { x: 214, y: 404, r: 96,  depth: 0, spread: 0.30, rose: true, type: 'rose' },
    { x: 792, y: 392, r: 99,  depth: 0, spread: 0.30, type: 'sun' },
    { x: 372, y: 246, r: 104, depth: 0, spread: 0.22, type: 'sun' },
    { x: 640, y: 258, r: 101, depth: 0, spread: 0.22, rose: true, type: 'rose' },
    { x: 502, y: 196, r: 122, depth: 1, spread: 0.10, rose: true, type: 'sun' },
    { x: 296, y: 556, r: 108, depth: 1, spread: 0.36, type: 'sun' },
    { x: 716, y: 546, r: 110, depth: 1, spread: 0.36, rose: true, type: 'rose' },
    { x: 388, y: 400, r: 128, depth: 2, spread: 0.20, rose: true, type: 'sun' },
    { x: 622, y: 396, r: 126, depth: 2, spread: 0.20, type: 'sun' },
    { x: 508, y: 570, r: 118, depth: 2, spread: 0.06, rose: true, type: 'rose' }
  ];

  /* florecillas de relleno, entre los tallos */
  var SMALLS = [
    { x: 152, y: 268, r: 30, depth: 0, spread: 0.42, type: 'daisy' },
    { x: 856, y: 252, r: 31, depth: 0, spread: 0.42, type: 'daisy' },
    { x: 292, y: 186, r: 27, depth: 0, spread: 0.26, type: 'daisy' },
    { x: 706, y: 178, r: 28, depth: 0, spread: 0.26, type: 'daisy' },
    { x: 104, y: 468, r: 29, depth: 0, spread: 0.5,  type: 'daisy' },
    { x: 906, y: 452, r: 28, depth: 0, spread: 0.5,  type: 'daisy' },
    { x: 402, y: 684, r: 27, depth: 2, spread: 0.3,  type: 'daisy' },
    { x: 640, y: 716, r: 26, depth: 2, spread: 0.26, type: 'daisy' }
  ];

  var BUDS = [
    { x: 148, y: 560, r: 30, depth: 0 },
    { x: 866, y: 548, r: 31, depth: 0 },
    { x: 250, y: 208, r: 26, depth: 0 },
    { x: 760, y: 196, r: 27, depth: 0 },
    { x: 604, y: 668, r: 26, depth: 2 }
  ];

  var BASE_X = 500, BASE_Y = 1035;

  /* =======================================================
     CONSTRUCCIÓN
     ======================================================= */
  function build() {
    var svg = document.getElementById('bouquet');
    if (!svg) return 0;

    var defs = document.getElementById('bq-defs');
    var back = document.getElementById('bq-back');
    var front = document.getElementById('bq-front');
    var wrap = document.getElementById('bq-wrap');

    var lastEnd = 0;

    /* --- degradados: solo los halos de luz, los pétalos van planos --- */
    var gg = el('radialGradient', { id: 'glowGrad', cx: '0.5', cy: '0.5', r: '0.5' }, defs);
    el('stop', { offset: '0', 'stop-color': '#ffd06a', 'stop-opacity': '0.42' }, gg);
    el('stop', { offset: '0.45', 'stop-color': '#ffb43c', 'stop-opacity': '0.20' }, gg);
    el('stop', { offset: '1', 'stop-color': '#ff9d1f', 'stop-opacity': '0' }, gg);

    var gr = el('radialGradient', { id: 'glowRose', cx: '0.5', cy: '0.5', r: '0.5' }, defs);
    el('stop', { offset: '0', 'stop-color': '#ffa8ca', 'stop-opacity': '0.40' }, gr);
    el('stop', { offset: '0.45', 'stop-color': '#f57eab', 'stop-opacity': '0.19' }, gr);
    el('stop', { offset: '1', 'stop-color': '#e35b90', 'stop-opacity': '0' }, gr);

    GREENS.forEach(function (g, i) {
      var lg = el('linearGradient', { id: 'lg' + i, x1: '0', y1: '0', x2: '1', y2: '0.3' }, defs);
      el('stop', { offset: '0', 'stop-color': g.dark }, lg);
      el('stop', { offset: '1', 'stop-color': g.blade }, lg);
    });

    /* --- todos los tallos, ordenados de atrás hacia adelante --- */
    var items = FLOWERS.map(function (f, i) { return { kind: 'flower', spec: f, i: i }; })
      .concat(SMALLS.map(function (s, i) { return { kind: 'flower', spec: s, i: i }; }))
      .concat(BUDS.map(function (b, i) { return { kind: 'bud', spec: b, i: i }; }));

    items.sort(function (a, b) { return a.spec.depth - b.spec.depth; });

    items.forEach(function (item, order) {
      var spec = item.spec;
      var parent = spec.depth === 2 ? front : back;
      var t = buildStalk(parent, spec, order, item.kind);
      if (t > lastEnd) lastEnd = t;
    });

    /* --- hojas grandes y lazo en la base (primer plano) --- */
    var wrapEnd = buildBase(wrap);
    if (wrapEnd > lastEnd) lastEnd = wrapEnd;

    /* --- medir tallos y colocar hojas (ya están en el DOM) --- */
    placeLeaves();

    return lastEnd;
  }

  var pendingStems = [];

  function buildStalk(parent, spec, order, kind) {
    var isBud = kind === 'bud';
    var g = el('g', { class: 'stalk' }, parent);

    var sway = rand(0.35, 1.05) * (spec.x < BASE_X ? -1 : 1);
    g.style.setProperty('--sw', round(sway) + 'deg');
    g.style.setProperty('--sway-dur', round(rand(6.5, 11)) + 's');
    g.style.setProperty('--sway-delay', round(-rand(0, 6)) + 's');

    /* --- trazado del tallo --- */
    var spread = spec.spread == null ? 0.30 : spec.spread;
    var bx = BASE_X + (spec.x - BASE_X) * 0.055 + rand(-14, 14);
    var by = BASE_Y;
    var dx = spec.x - bx, dy = by - spec.y;
    var c1x = bx + dx * 0.04 + rand(-10, 10);
    var c1y = by - dy * 0.42;
    var c2x = spec.x - dx * (0.18 + spread * 0.5);
    var c2y = spec.y + dy * (0.30 + rand(-0.05, 0.08));

    /* el tallo no es un arco perfecto: se dibuja pasando por puntos
       con un poco de temblor lateral, como un trazo a mano */
    var stemPts = [];
    for (var st = 0; st <= 1.0001; st += 0.2) {
      var u = 1 - st;
      var px = u * u * u * bx + 3 * u * u * st * c1x + 3 * u * st * st * c2x + st * st * st * spec.x;
      var py = u * u * u * by + 3 * u * u * st * c1y + 3 * u * st * st * c2y + st * st * st * spec.y;
      var wob = Math.sin(st * Math.PI) * rand(-7, 7);
      stemPts.push({ x: px + (st < 0.98 ? wob : 0), y: py + (st > 0.02 && st < 0.98 ? rand(-4, 4) : 0) });
    }
    var d = smoothOpen(stemPts);

    var small = spec.type === 'daisy';
    var green = GREENS[order % GREENS.length];
    var width = isBud ? rand(6, 8)
      : small ? rand(4.2, 6)
      : (spec.depth === 2 ? rand(11, 14) : rand(8.5, 11));

    var stemDelay = T.stemStart + order * T.stemStep;

    /* sombra del tallo, para dar volumen */
    el('path', {
      d: d, class: 'stem', stroke: green.dark,
      'stroke-width': round(width + 2.4), opacity: 0.55,
      style: '--d:' + round(stemDelay) + 's'
    }, g);

    var stem = el('path', {
      d: d, class: 'stem', stroke: 'url(#lg' + (order % GREENS.length) + ')',
      'stroke-width': round(width),
      style: '--d:' + round(stemDelay) + 's'
    }, g);
    stem.style.stroke = green.blade;

    /* brillo lateral del tallo */
    el('path', {
      d: d, class: 'stem', stroke: green.vein,
      'stroke-width': round(width * 0.26), opacity: 0.4,
      transform: 'translate(' + round(-width * 0.24) + ',0)',
      style: '--d:' + round(stemDelay + 0.1) + 's'
    }, g);

    /* --- hojas: se colocan luego, cuando podamos medir el trazado --- */
    var nLeaves = isBud ? 2 : small ? 2 : (spec.depth === 2 ? 4 : 3);
    pendingStems.push({
      path: stem, group: g, n: nLeaves, order: order, isBud: isBud,
      scale: isBud ? 0.62 : small ? 0.46 : (spec.depth === 2 ? 1.12 : 0.92),
      green: green
    });

    /* --- cabeza --- */
    var pos = el('g', { class: 'flower-pos', transform: 'translate(' + spec.x + ',' + spec.y + ')' }, g);
    var head = el('g', { class: 'flower-head' }, pos);
    head.style.setProperty('--nod', round(rand(0.7, 1.9)) + 'deg');
    head.style.setProperty('--nod-dur', round(rand(5.5, 9.5)) + 's');
    head.style.setProperty('--nod-delay', round(-rand(0, 5)) + 's');

    var budDelay = T.budStart + order * T.budStep;
    var openDelay = T.openStart + order * T.openStep;

    if (isBud) {
      buildBud(head, spec.r, budDelay, green);
      return budDelay + 1.0;
    }
    if (spec.type === 'rose') return buildRose(head, spec, order, budDelay, openDelay, green);
    if (small) return buildDaisy(head, spec, budDelay, openDelay, green);
    return buildFlower(head, spec, order, budDelay, openDelay, green);
  }

  /* --- capullo cerrado --- */
  function buildBud(head, r, dly, green) {
    var tilt = el('g', { transform: 'rotate(' + round(rand(-14, 14)) + ')' }, head);
    var inner = el('g', { class: 'bud-inner' }, tilt);
    delay(inner, dly);

    el('ellipse', { cx: 0, cy: 0, rx: r * 0.78, ry: r * 0.9, fill: green.dark }, inner);
    el('ellipse', { cx: -r * 0.16, cy: -r * 0.12, rx: r * 0.44, ry: r * 0.52, fill: green.blade, opacity: 0.85 }, inner);
    el('path', {
      d: 'M' + round(-r * 0.5) + ',' + round(-r * 0.2) + ' Q0,' + round(-r * 1.15) + ' ' + round(r * 0.5) + ',' + round(-r * 0.2),
      fill: 'none', stroke: '#e88fb2', 'stroke-width': r * 0.16, opacity: 0.5, 'stroke-linecap': 'round'
    }, inner);

    var n = 7;
    for (var i = 0; i < n; i++) {
      var a = -90 + (i - (n - 1) / 2) * 26 + rand(-5, 5);
      var s = el('path', {
        d: sepalShape(r * rand(1.05, 1.4), r * 0.34),
        fill: i % 2 ? green.blade : green.dark,
        stroke: green.dark, 'stroke-width': 1.2, 'stroke-linejoin': 'round',
        transform: 'rotate(' + round(a + 90) + ')', opacity: 0.95
      }, inner);
      s.setAttribute('class', 'sepal');
    }
  }

  /* --- girasol completo --- */
  function buildFlower(head, spec, order, budDelay, openDelay, green) {
    var r = spec.r;
    var family = spec.rose ? ROSE_PALS : GOLD_PALS;
    var pal = family[order % family.length];
    var palette = PETALS[pal];
    var dim = spec.depth === 0 ? 0.86 : (spec.depth === 1 ? 0.95 : 1);

    if (dim < 1) head.setAttribute('opacity', dim);
    head = tiltHead(head);

    /* resplandor detrás: una mancha, no un halo perfecto */
    var glow = el('ellipse', {
      class: 'glow', cx: round(rand(-r * 0.1, r * 0.1)), cy: round(rand(-r * 0.1, r * 0.1)),
      rx: round(r * rand(1.5, 1.8)), ry: round(r * rand(1.35, 1.7)),
      transform: 'rotate(' + round(rand(0, 180)) + ')',
      fill: spec.rose ? 'url(#glowRose)' : 'url(#glowGrad)'
    }, head);
    delay(glow, openDelay + 0.2);

    /* capullo verde: aparece antes y luego se abre en sépalos */
    var budInner = el('g', { class: 'bud-inner' }, head);
    delay(budInner, budDelay);
    el('path', { d: blobPath(r * 0.56, 9, 0.1), fill: green.dark }, budInner);
    el('path', {
      d: blobPath(r * 0.3, 8, 0.14), fill: green.blade, opacity: 0.7,
      transform: 'translate(' + round(-r * 0.14) + ',' + round(-r * 0.12) + ')'
    }, budInner);

    var sepals = el('g', { class: 'sepals' }, budInner);
    delay(sepals, openDelay);
    var ns = 11;
    for (var s = 0; s < ns; s++) {
      el('path', {
        d: sepalShape(r * rand(0.62, 0.86), r * 0.19),
        fill: s % 2 ? green.blade : green.dark,
        stroke: green.dark, 'stroke-width': 1.1, 'stroke-linejoin': 'round',
        transform: 'rotate(' + round(s * (360 / ns) + rand(-6, 6)) + ')'
      }, sepals);
    }

    /* pétalos: tres capas, repartidas a ojo (no a compás) */
    var layers = [
      { n: Math.round(r / 8) + 5, h: r * 1.12, w: r * 0.35, rot: 0,  op: 1,    shade: 0.86 },
      { n: Math.round(r / 9.5) + 4, h: r * 0.94, w: r * 0.32, rot: 11, op: 1,    shade: 1 },
      { n: Math.round(r / 12) + 3,  h: r * 0.72, w: r * 0.27, rot: 22, op: 0.98, shade: 1.12 }
    ];

    var maxEnd = openDelay;
    var petalsG = el('g', { class: 'petals' }, head);

    layers.forEach(function (L, li) {
      var lg = el('g', { opacity: L.op }, petalsG);
      /* el reparto angular se desordena: unos pétalos se juntan y otros se separan */
      var gaps = [], total = 0, gi;
      for (gi = 0; gi < L.n; gi++) { var gv = rand(0.72, 1.28); gaps.push(gv); total += gv; }
      var acc = rand(0, 40);

      for (var i = 0; i < L.n; i++) {
        var ang = acc + L.rot;
        acc += gaps[i] / total * 360;

        var h = L.h * rand(0.84, 1.14);
        var w = L.w * rand(0.84, 1.18);
        var pg = el('g', { transform: 'rotate(' + round(ang) + ')' }, lg);
        var d = petalShape(h, w);

        /* color plano, el mismo en toda la flor: los pétalos se separan
           por su contorno, no por un degradado */
        var p = el('path', {
          class: 'petal',
          d: d,
          fill: palette.base,
          stroke: palette.edge,
          'stroke-width': round(rand(1.6, 2.2)),
          'stroke-opacity': 0.9,
          'stroke-linejoin': 'round'
        }, pg);
        var pd = openDelay + li * T.petalLayer + i * T.petalStep + rand(0, 0.07);
        delay(p, pd);
        if (pd + 1.25 > maxEnd) maxEnd = pd + 1.25;

        /* el trazo de tinta, desplazado como si la mano no hubiera acertado */
        var ink = inkOutline(pg, d, INK_PETAL, rand(1, 2));
        ink.setAttribute('class', 'petal ink');
        delay(ink, pd);

        /* nervadura suave, solo en la capa exterior */
        if (li > 0) continue;
        var vein = el('path', {
          class: 'petal',
          d: 'M' + round(rand(-w * 0.1, w * 0.1)) + ',' + round(-h * 0.1) +
             ' Q' + round(rand(-w * 0.16, w * 0.16)) + ',' + round(-h * 0.5) +
             ' ' + round(rand(-w * 0.1, w * 0.1)) + ',' + round(-h * rand(0.72, 0.86)),
          stroke: INK_PETAL, 'stroke-width': round(rand(0.8, 1.3)), opacity: round(rand(0.12, 0.26)),
          fill: 'none', 'stroke-linecap': 'round', 'pointer-events': 'none'
        }, pg);
        delay(vein, pd);
      }
    });

    /* disco central con semillas */
    var disc = el('g', { class: 'disc-inner' }, head);
    delay(disc, openDelay + 0.28);

    /* sombra pintada donde los pétalos se juntan: da profundidad */
    el('path', {
      d: blobPath(r * rand(0.56, 0.68), 10, 0.1),
      fill: palette.edge, opacity: round(rand(0.1, 0.2)),
      transform: 'translate(' + round(rand(-3, 3)) + ',' + round(rand(0, 5)) + ')'
    }, disc);

    var dr = r * 0.365;
    var discD = blobPath(dr, 11, 0.07);
    el('path', {
      d: blobPath(dr * 1.07, 10, 0.08), fill: '#8a5a1c', opacity: 0.5,
      transform: 'translate(' + round(rand(-2, 2)) + ',' + round(rand(-1, 3)) + ')'
    }, disc);
    el('path', { d: discD, fill: '#3a2213' }, disc);
    inkOutline(disc, discD, '#241426', rand(1.4, 2.4)).setAttribute('opacity', 0.45);

    var seeds = Math.round(dr * 1.5);
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var k = 0; k < seeds; k++) {
      var rr = dr * 0.93 * Math.sqrt((k + 0.5) / seeds);
      var aa = k * golden;
      el('circle', {
        cx: round(Math.cos(aa) * rr),
        cy: round(Math.sin(aa) * rr),
        r: round(dr * 0.052 + rr * 0.016),
        fill: k % 3 === 0 ? '#6a4522' : (k % 3 === 1 ? '#4a2c14' : '#2a170b'),
        opacity: 0.9
      }, disc);
    }
    /* borde de florecillas del disco */
    var nd = Math.round(dr / 3.4);
    for (var m = 0; m < nd; m++) {
      var am = m * (360 / nd);
      el('ellipse', {
        cx: 0, cy: round(-dr * 0.96), rx: round(dr * 0.05), ry: round(dr * 0.1),
        fill: palette.base, opacity: 0.62,
        transform: 'rotate(' + round(am) + ')'
      }, disc);
    }
    /* luz superior del disco */
    el('ellipse', {
      cx: round(-dr * 0.28), cy: round(-dr * 0.3), rx: dr * 0.42, ry: dr * 0.3,
      fill: palette.tip, opacity: 0.11
    }, disc);

    return maxEnd;
  }

  /* --- una rosa abierta, vista desde arriba --- */
  function buildRose(head, spec, order, budDelay, openDelay, green) {
    var r = spec.r;
    var pal = BLOOM_PALS[order % BLOOM_PALS.length];
    var palette = PETALS[pal];
    var dim = spec.depth === 0 ? 0.86 : (spec.depth === 1 ? 0.95 : 1);
    if (dim < 1) head.setAttribute('opacity', dim);
    head = tiltHead(head);

    var glow = el('ellipse', {
      class: 'glow', cx: 0, cy: 0,
      rx: round(r * rand(1.4, 1.7)), ry: round(r * rand(1.3, 1.6)),
      transform: 'rotate(' + round(rand(0, 180)) + ')',
      fill: 'url(#glowRose)'
    }, head);
    delay(glow, openDelay + 0.2);

    /* sépalos verdes bajo la flor */
    var budInner = el('g', { class: 'bud-inner' }, head);
    delay(budInner, budDelay);
    el('path', { d: blobPath(r * 0.5, 9, 0.1), fill: green.dark }, budInner);

    var sepals = el('g', { class: 'sepals' }, budInner);
    delay(sepals, openDelay);
    for (var s = 0; s < 9; s++) {
      el('path', {
        d: sepalShape(r * rand(0.66, 0.9), r * 0.2),
        fill: s % 2 ? green.blade : green.dark,
        stroke: green.dark, 'stroke-width': 1.1, 'stroke-linejoin': 'round',
        transform: 'rotate(' + round(s * 40 + rand(-6, 6)) + ')'
      }, sepals);
    }

    /* coronas de pétalos, de fuera hacia dentro */
    var rings = [
      { n: 10, h: 1.08, w: 0.7, rot: 0 },
      { n: 8, h: 0.88, w: 0.64, rot: 22 },
      { n: 7, h: 0.64, w: 0.58, rot: 44 },
      { n: 6, h: 0.47, w: 0.52, rot: 16 },
      { n: 5, h: 0.32, w: 0.46, rot: 38 }
    ];

    var maxEnd = openDelay;
    var petalsG = el('g', { class: 'petals' }, head);

    rings.forEach(function (L, li) {
      var ring = el('g', {}, petalsG);
      var gaps = [], total = 0, gi;
      for (gi = 0; gi < L.n; gi++) { var gv = rand(0.75, 1.25); gaps.push(gv); total += gv; }
      var acc = rand(0, 40);

      for (var i = 0; i < L.n; i++) {
        var ang = acc + L.rot;
        acc += gaps[i] / total * 360;
        var h = r * L.h * rand(0.88, 1.1);
        var w = r * L.w * rand(0.86, 1.14);
        var pg = el('g', { transform: 'rotate(' + round(ang) + ')' }, ring);
        var d = rosePetalShape(h, w);
        var p = el('path', {
          class: 'petal',
          d: d,
          fill: palette.base,
          stroke: palette.edge,
          'stroke-width': round(rand(1.5, 2.1)),
          'stroke-opacity': 0.9,
          'stroke-linejoin': 'round'
        }, pg);
        var pd = openDelay + li * T.petalLayer + i * T.petalStep + rand(0, 0.06);
        delay(p, pd);
        if (pd + 1.25 > maxEnd) maxEnd = pd + 1.25;

        /* tinta solo en la corona de fuera: dentro se amontonaría */
        if (li > 0) continue;
        var ink = inkOutline(pg, d, INK_PETAL, rand(1, 1.9));
        ink.setAttribute('class', 'petal ink');
        delay(ink, pd);
      }
    });

    /* el cogollo enrollado del centro */
    var core = el('g', { class: 'disc-inner' }, head);
    delay(core, openDelay + 0.3);
    el('path', { d: blobPath(r * 0.2, 8, 0.12), fill: palette.base }, core);
    for (var c = 0; c < 3; c++) {
      var cd = rosePetalShape(r * (0.22 - c * 0.05), r * (0.2 - c * 0.04));
      el('path', {
        d: cd, fill: palette.base,
        transform: 'rotate(' + round(c * 118 + rand(6, 34)) + ')',
        style: 'filter:brightness(' + (0.9 - c * 0.06).toFixed(2) + ')'
      }, core);
    }
    inkOutline(core, blobPath(r * 0.21, 8, 0.12), INK_PETAL, rand(1, 1.6));
    el('ellipse', {
      cx: round(-r * 0.05), cy: round(-r * 0.05), rx: r * 0.07, ry: r * 0.05,
      fill: palette.tip, opacity: 0.5
    }, core);

    return maxEnd;
  }

  /* --- florecilla de relleno --- */
  function buildDaisy(head, spec, budDelay, openDelay, green) {
    var r = spec.r;
    var palette = PETALS[PALE_PAL];
    if (spec.depth === 0) head.setAttribute('opacity', 0.9);
    head = tiltHead(head);

    var glow = el('ellipse', {
      class: 'glow', cx: 0, cy: 0,
      rx: round(r * rand(1.7, 2.1)), ry: round(r * rand(1.6, 2)),
      transform: 'rotate(' + round(rand(0, 180)) + ')',
      fill: 'url(#glowRose)'
    }, head);
    delay(glow, openDelay + 0.2);

    var budInner = el('g', { class: 'bud-inner' }, head);
    delay(budInner, budDelay);
    el('path', { d: blobPath(r * 0.42, 8, 0.12), fill: green.dark }, budInner);
    var sepals = el('g', { class: 'sepals' }, budInner);
    delay(sepals, openDelay);
    for (var s = 0; s < 5; s++) {
      el('path', {
        d: sepalShape(r * rand(0.5, 0.7), r * 0.22),
        fill: green.blade, stroke: green.dark, 'stroke-width': 1,
        transform: 'rotate(' + round(s * 72 + rand(-8, 8)) + ')'
      }, sepals);
    }

    var maxEnd = openDelay;
    var n = 6 + Math.round(rand(0, 2));
    var petalsG = el('g', { class: 'petals' }, head);
    var gaps = [], total = 0, gi;
    for (gi = 0; gi < n; gi++) { var gv = rand(0.72, 1.28); gaps.push(gv); total += gv; }
    var acc = rand(0, 40);

    for (var i = 0; i < n; i++) {
      var pg = el('g', { transform: 'rotate(' + round(acc) + ')' }, petalsG);
      acc += gaps[i] / total * 360;
      var pdd = rosePetalShape(r * rand(0.86, 1.12), r * rand(0.3, 0.42));
      var p = el('path', {
        class: 'petal', d: pdd, fill: palette.base,
        stroke: palette.edge, 'stroke-width': round(rand(1.2, 1.7)), 'stroke-opacity': 0.85, 'stroke-linejoin': 'round'
      }, pg);
      var pd = openDelay + i * 0.03 + rand(0, 0.05);
      delay(p, pd);
      if (pd + 1.25 > maxEnd) maxEnd = pd + 1.25;
      var ink = inkOutline(pg, pdd, INK_PETAL, rand(0.8, 1.4));
      ink.setAttribute('class', 'petal ink');
      delay(ink, pd);
    }

    var core = el('g', { class: 'disc-inner' }, head);
    delay(core, openDelay + 0.26);
    var coreD = blobPath(r * 0.3, 8, 0.13);
    el('path', { d: coreD, fill: '#e8c04a' }, core);
    inkOutline(core, coreD, '#8a5a1c', rand(1, 1.5));
    for (var k = 0; k < 7; k++) {
      el('circle', {
        cx: round(Math.cos(k * 2.4) * r * 0.14),
        cy: round(Math.sin(k * 2.4) * r * 0.14),
        r: r * 0.045, fill: '#b8801a', opacity: 0.8
      }, core);
    }

    return maxEnd;
  }

  /* --- hojas: requieren el trazado ya montado en el DOM --- */
  function placeLeaves() {
    pendingStems.forEach(function (item) {
      var path = item.path;
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;

      /* los tres trazos del tallo comparten el mismo recorrido */
      var strokes = item.group.querySelectorAll(':scope > .stem');
      for (var s = 0; s < strokes.length; s++) {
        strokes[s].style.setProperty('--len', round(len + 2));
      }

      var base = T.leafStart + item.order * T.leafStep;
      for (var i = 0; i < item.n; i++) {
        var t = 0.20 + (i / Math.max(1, item.n)) * 0.55 + rand(-0.05, 0.05);
        var pt = path.getPointAtLength(len * t);
        var pt2 = path.getPointAtLength(Math.min(len, len * t + 6));
        var ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;

        var side = i % 2 === 0 ? -1 : 1;
        var open = rand(48, 74) * side;
        var flip = side < 0 ? -1 : 1;
        var sc = item.scale * rand(0.72, 1.16);

        var L = 132 * sc, W = 46 * sc;

        var leaf = el('g', {
          class: 'leaf',
          transform: 'translate(' + round(pt.x) + ',' + round(pt.y) + ') rotate(' + round(ang + open) + ') scale(1,' + flip + ')'
        }, null);
        /* insertar antes de la cabeza para que la flor quede encima */
        var pos = item.group.querySelector('.flower-pos');
        if (pos) item.group.insertBefore(leaf, pos); else item.group.appendChild(leaf);

        var inner = el('g', { class: 'leaf-inner' }, leaf);
        delay(inner, base + i * T.leafSub);
        inner.style.setProperty('--lsw', round(rand(1.5, 4.5) * (i % 2 ? 1 : -1)) + 'deg');

        var blade = leafShape(L, W);
        var leafGreen = GREENS[Math.floor(rand(0, GREENS.length))];
        el('path', {
          d: blade,
          fill: leafGreen.blade,
          stroke: leafGreen.dark, 'stroke-width': round(rand(1.8, 2.6)),
          'stroke-opacity': 0.9, 'stroke-linejoin': 'round'
        }, inner);
        el('path', {
          d: leafShape(L * 0.94, W * 0.62),
          fill: leafGreen.vein, opacity: 0.16,
          transform: 'translate(2,' + round(-W * 0.18) + ')'
        }, inner);
        inkOutline(inner, blade, INK_LEAF, rand(1.4, 2.6));
        el('path', {
          d: 'M' + round(L * 0.02) + ',' + round(rand(-2, 2)) +
             ' C' + round(L * 0.35) + ',' + round(-W * rand(0.1, 0.25)) +
             ' ' + round(L * 0.7) + ',' + round(-W * rand(0.08, 0.24)) +
             ' ' + round(L * rand(0.92, 1)) + ',' + round(-W * 0.08),
          fill: 'none', stroke: leafGreen.vein, 'stroke-width': round(rand(1.4, 2.2)),
          opacity: round(rand(0.35, 0.6)), 'stroke-linecap': 'round'
        }, inner);
        for (var v = 1; v <= 3; v++) {
          var vx = L * (0.16 + v * 0.2);
          el('path', {
            d: 'M' + round(vx * 0.9) + ',' + round(-W * 0.05) + ' Q' + round(vx) + ',' + round(-W * 0.42) +
               ' ' + round(vx + L * 0.11) + ',' + round(-W * 0.52),
            fill: 'none', stroke: item.green.vein, 'stroke-width': 1.1, opacity: 0.3
          }, inner);
          el('path', {
            d: 'M' + round(vx * 0.9) + ',' + round(W * 0.02) + ' Q' + round(vx) + ',' + round(W * 0.4) +
               ' ' + round(vx + L * 0.1) + ',' + round(W * 0.48),
            fill: 'none', stroke: item.green.vein, 'stroke-width': 1.1, opacity: 0.26
          }, inner);
        }
      }
    });
  }

  /* --- hojas grandes + lazo en la base del ramo --- */
  function buildBase(wrap) {
    var g = el('g', { class: 'stalk' }, wrap);
    g.style.setProperty('--sw', '0.28deg');
    g.style.setProperty('--sway-dur', '9.5s');
    g.style.setProperty('--sway-delay', '-2s');

    var end = 0;
    var big = [
      { x: 452, y: 906, a: 196, s: 1.55 },
      { x: 548, y: 902, a: -14, s: 1.5 },
      { x: 424, y: 812, a: 214, s: 1.2 },
      { x: 578, y: 806, a: -32, s: 1.25 },
      { x: 500, y: 950, a: 250, s: 1.0 },
      { x: 512, y: 946, a: -68, s: 1.0 }
    ];

    big.forEach(function (b, i) {
      var leaf = el('g', {
        class: 'leaf',
        transform: 'translate(' + b.x + ',' + b.y + ') rotate(' + b.a + ') scale(1,' + (i % 2 ? -1 : 1) + ')'
      }, g);
      var inner = el('g', { class: 'leaf-inner' }, leaf);
      var d = T.leafStart + 0.5 + i * 0.14;
      delay(inner, d);
      inner.style.setProperty('--lsw', round(rand(1.2, 3.2) * (i % 2 ? 1 : -1)) + 'deg');
      end = Math.max(end, d + 1.15);

      var green = GREENS[i % GREENS.length];
      var L = 150 * b.s, W = 54 * b.s;
      var blade = leafShape(L, W);
      el('path', {
        d: blade, fill: green.blade,
        stroke: green.dark, 'stroke-width': round(rand(2, 2.8)),
        'stroke-opacity': 0.9, 'stroke-linejoin': 'round'
      }, inner);
      /* una mancha de sombra en un lado del nervio */
      el('path', {
        d: leafShape(L * 0.86, W * 0.5), fill: green.dark, opacity: 0.16,
        transform: 'translate(' + round(L * 0.06) + ',' + round(W * 0.3) + ')'
      }, inner);
      inkOutline(inner, blade, INK_LEAF, rand(1.6, 2.8));
      /* nervio central y los que salen de él */
      el('path', {
        d: 'M' + round(L * 0.02) + ',0 C' + round(L * 0.4) + ',' + round(-W * rand(0.1, 0.24)) +
           ' ' + round(L * 0.72) + ',' + round(-W * rand(0.08, 0.2)) + ' ' + round(L * rand(0.96, 1.04)) + ',' + round(-W * 0.06),
        fill: 'none', stroke: green.vein, 'stroke-width': round(rand(1.8, 2.6)),
        opacity: round(rand(0.35, 0.5)), 'stroke-linecap': 'round'
      }, inner);
      for (var nv = 1; nv <= 4; nv++) {
        var nx = L * (0.12 + nv * 0.19) * rand(0.94, 1.06);
        var ny = -W * 0.12;
        el('path', {
          d: 'M' + round(nx) + ',' + round(ny) +
             ' Q' + round(nx + L * 0.07) + ',' + round(ny - W * rand(0.4, 0.6)) +
             ' ' + round(nx + L * rand(0.12, 0.2)) + ',' + round(ny - W * rand(0.62, 0.86)),
          fill: 'none', stroke: green.vein, 'stroke-width': 1.3, opacity: round(rand(0.18, 0.32))
        }, inner);
        el('path', {
          d: 'M' + round(nx) + ',' + round(ny + W * 0.16) +
             ' Q' + round(nx + L * 0.07) + ',' + round(ny + W * rand(0.5, 0.7)) +
             ' ' + round(nx + L * rand(0.12, 0.2)) + ',' + round(ny + W * rand(0.72, 0.96)),
          fill: 'none', stroke: green.vein, 'stroke-width': 1.3, opacity: round(rand(0.16, 0.28))
        }, inner);
      }
    });

    /* lazo de tela que ata el ramo */
    var ribbonPos = el('g', { transform: 'translate(500,952)' }, g);
    var ribbon = el('g', { class: 'bud-inner' }, ribbonPos);
    delay(ribbon, T.leafStart + 1.4);
    end = Math.max(end, T.leafStart + 2.4);

    el('path', {
      d: 'M-92,-16 C-40,-30 40,-30 92,-16 C96,4 92,20 86,32 C34,18 -34,18 -86,32 C-92,20 -96,4 -92,-16 Z',
      fill: '#2f4f2c', stroke: '#1d3520', 'stroke-width': 2.5, 'stroke-linejoin': 'round'
    }, ribbon);
    el('path', {
      d: 'M-88,-8 C-36,-22 36,-22 88,-8',
      fill: 'none', stroke: '#ffd6e4', 'stroke-width': 5, opacity: 0.42, 'stroke-linecap': 'round'
    }, ribbon);
    el('path', {
      d: 'M0,-6 C-34,-34 -78,-26 -74,-6 C-70,10 -30,10 0,-6 C30,10 70,10 74,-6 C78,-26 34,-34 0,-6 Z',
      fill: '#e87cac', stroke: '#b34a76', 'stroke-width': 2.4, 'stroke-linejoin': 'round'
    }, ribbon);
    el('circle', { cx: 0, cy: -4, r: 9, fill: '#ffd6e4', stroke: '#c07d92', 'stroke-width': 2 }, ribbon);
    el('path', {
      d: 'M-8,4 C-22,26 -30,40 -26,52 M8,4 C22,26 30,40 26,52',
      fill: 'none', stroke: '#e87cac', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.9
    }, ribbon);

    return end;
  }

  window.Bouquet = { build: build, T: T };
})();
