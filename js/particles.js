/* =========================================================
   particles.js — polvo de estrellas, motas cálidas y pétalos
   Un lienzo detrás de todo, muy lento, casi imperceptible.

   En modo ligero (teléfonos) el trabajo por fotograma baja mucho:
   · las estrellas se pintan UNA vez en un lienzo aparte y luego
     solo se copian, en vez de redibujarse titilando una por una;
   · las motas usan un sello ya dibujado en vez de crear un
     degradado radial nuevo cada vez (eran ~46 por fotograma);
   · se dibuja a ~33 ms en lugar de a 16;
   · se para del todo cuando encima hay una pantalla opaca.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LITE = !!window.LITE;

  var W = 0, H = 0, dpr = 1;
  var stars = [], motes = [], petals = [];
  var raf = null, lastDraw = 0;
  var covered = false;

  var STEP = LITE ? 30 : 0;          /* ms mínimos entre fotogramas */

  var STAR_COL = { rose: '#ffc4da', gold: '#ffe096', cool: '#e2f0eb' };
  var STAR_HALO = { rose: '#ff96be', gold: '#ffce6e', cool: '#b4dcc8' };
  var HALO_A = { rose: 0.14, gold: 0.13, cool: 0.10 };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- sellos: se dibujan una vez y se copian ---------- */
  function moteStamp(rose) {
    var size = 64, c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, rose ? 'rgba(255,176,208,1)' : 'rgba(255,218,138,1)');
    grd.addColorStop(1, rose ? 'rgba(240,130,180,0)' : 'rgba(255,190,90,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }
  var STAMP_ROSE = moteStamp(true);
  var STAMP_GOLD = moteStamp(false);

  /* el cielo quieto: en ligero se hornea aquí y luego solo se copia */
  var sky = null;

  function paintStar(g, s, alpha) {
    g.globalAlpha = alpha;
    g.fillStyle = STAR_COL[s.kind];
    g.beginPath();
    g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    g.fill();
    if (s.r > 1.25) {
      g.globalAlpha = alpha * HALO_A[s.kind];
      g.fillStyle = STAR_HALO[s.kind];
      g.beginPath();
      g.arc(s.x, s.y, s.r * 5.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  function bakeSky() {
    sky = document.createElement('canvas');
    sky.width = Math.max(1, Math.floor(W * dpr));
    sky.height = Math.max(1, Math.floor(H * dpr));
    var g = sky.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < stars.length; i++) paintStar(g, stars[i], stars[i].a);
    g.globalAlpha = 1;
  }

  /* ---------- medidas ---------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (LITE) bakeSky();
  }

  function seed() {
    var area = W * H;
    /* en ligero las estrellas no cuestan por fotograma (van horneadas),
       así que se mantiene la densidad. Lo que se recorta es lo que se mueve. */
    var nStars = Math.round(Math.min(150, area / 9000));
    var nMotes = Math.round(Math.min(LITE ? 18 : 46, area / (LITE ? 52000 : 26000)));
    var nPetals = reduce ? 0 : Math.round(Math.min(LITE ? 7 : 16, area / (LITE ? 150000 : 78000)));

    stars = [];
    for (var i = 0; i < nStars; i++) {
      stars.push({
        x: rand(0, W), y: rand(0, H * 0.92),
        r: rand(0.5, 1.7),
        a: rand(0.15, 0.75),
        tw: rand(0.4, 1.5),
        ph: rand(0, Math.PI * 2),
        kind: Math.random() < 0.34 ? 'rose' : (Math.random() < 0.5 ? 'gold' : 'cool'),
        born: rand(0, 2.4)
      });
    }

    motes = [];
    for (var j = 0; j < nMotes; j++) {
      motes.push(newMote(rand(0, H)));
    }

    petals = [];
    for (var k = 0; k < nPetals; k++) {
      petals.push(newPetal(rand(0, H)));
    }
  }

  function newMote(y) {
    return {
      x: rand(0, W), y: y,
      r: rand(0.9, 2.6),
      vy: rand(-9, -3) / 60,
      vx: rand(-4, 4) / 60,
      a: rand(0.14, 0.5),
      ph: rand(0, Math.PI * 2),
      sp: rand(0.5, 1.4),
      rose: Math.random() < 0.5
    };
  }

  function newPetal(y) {
    return {
      x: rand(0, W), y: y,
      w: rand(5, 11),
      h: rand(2.6, 5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.5, 0.5) / 60,
      vy: rand(4, 12) / 60,
      vx: rand(-6, 6) / 60,
      sway: rand(0.3, 0.9),
      ph: rand(0, Math.PI * 2),
      a: rand(0.25, 0.6),
      hue: Math.random() < 0.58 ? 'rose' : 'gold'
    };
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);

    /* en ligero se salta un fotograma de cada dos: el polvo va tan lento
       que no se nota, y el teléfono respira */
    if (STEP && now - lastDraw < STEP) return;
    var dt = Math.min(64, lastDraw ? now - lastDraw : 16);
    lastDraw = now;
    var t = now / 1000;

    ctx.clearRect(0, 0, W, H);

    /* --- estrellas --- */
    if (sky) {
      ctx.drawImage(sky, 0, 0, W, H);
    } else {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (t < s.born) continue;
        var appear = Math.min(1, (t - s.born) / 1.8);
        var tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * s.tw + s.ph);
        paintStar(ctx, s, s.a * tw * appear);
      }
      ctx.globalAlpha = 1;
    }

    if (reduce) return;

    /* --- motas cálidas que suben --- */
    for (var j = 0; j < motes.length; j++) {
      var m = motes[j];
      m.y += m.vy * dt;
      m.x += (m.vx + Math.sin(t * m.sp + m.ph) * 0.12) * dt;
      if (m.y < -20) { motes[j] = newMote(H + 20); continue; }
      if (m.x < -30) m.x = W + 20;
      if (m.x > W + 30) m.x = -20;

      var ma = m.a * (0.55 + 0.45 * Math.sin(t * m.sp * 1.6 + m.ph));
      var d = m.r * 12;
      ctx.globalAlpha = Math.max(0, Math.min(1, ma * 0.85));
      ctx.drawImage(m.rose ? STAMP_ROSE : STAMP_GOLD, m.x - d / 2, m.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;

    /* --- pequeños pétalos flotando --- */
    for (var k = 0; k < petals.length; k++) {
      var p = petals[k];
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(t * p.sway + p.ph) * 0.35) * dt;
      p.rot += p.vr * dt * 0.06;
      if (p.y > H + 30) { petals[k] = newPetal(-30); continue; }
      if (p.x < -40) p.x = W + 30;
      if (p.x > W + 40) p.x = -30;

      var wobble = 0.55 + 0.45 * Math.abs(Math.sin(t * p.sway * 0.9 + p.ph));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + Math.sin(t * 0.5 + p.ph) * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.w * wobble, p.h, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.hue === 'rose'
        ? 'rgba(240, 150, 186, ' + p.a.toFixed(3) + ')'
        : 'rgba(255, 208, 106, ' + p.a.toFixed(3) + ')';
      ctx.fill();
      ctx.restore();
    }
  }

  function start() {
    if (raf || covered || document.hidden) return;
    lastDraw = 0;
    raf = requestAnimationFrame(draw);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  /* ---------- reencuadre ----------
     En el móvil la barra de direcciones aparece y desaparece al hacer
     scroll y dispara un "resize" de puro alto. Si volviéramos a sembrar
     en cada uno, el fondo daría un tirón. Solo reaccionamos a cambios
     de ancho o a saltos de alto de verdad (girar el teléfono). */
  var rt, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 140) return;
    lastW = w; lastH = h;
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  /* el cielo y la última pantalla tapan el lienzo por completo:
     mientras ella está ahí, no hay nada que pintar */
  var OPAQUE = { 'screen-cielo': 1, 'screen-final': 1 };
  var coverTimer;
  document.addEventListener('screen:enter', function (e) {
    clearTimeout(coverTimer);
    if (OPAQUE[e.detail.id]) {
      coverTimer = setTimeout(function () { covered = true; stop(); }, 2800);
    } else {
      covered = false;
      start();
    }
  });

  resize();
  start();

  window.Particles = { stop: stop, start: start };
})();
