/* =========================================================
   particles.js — polvo de estrellas, motas cálidas y pétalos
   Un lienzo detrás de todo, muy lento, casi imperceptible.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, dpr = 1;
  var stars = [], motes = [], petals = [];
  var running = true, raf = null, last = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var area = W * H;
    var nStars = Math.round(Math.min(150, area / 9000));
    var nMotes = Math.round(Math.min(46, area / 26000));
    var nPetals = reduce ? 0 : Math.round(Math.min(16, area / 78000));

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
    if (!last) last = now;
    var dt = Math.min(64, now - last);
    last = now;
    var t = now / 1000;

    ctx.clearRect(0, 0, W, H);

    /* --- estrellas --- */
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (t < s.born) continue;
      var appear = Math.min(1, (t - s.born) / 1.8);
      var tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * s.tw + s.ph);
      var alpha = s.a * tw * appear;
      ctx.beginPath();
      ctx.fillStyle = s.kind === 'rose'
        ? 'rgba(255, 196, 218, ' + alpha.toFixed(3) + ')'
        : (s.kind === 'gold'
          ? 'rgba(255, 224, 150, ' + alpha.toFixed(3) + ')'
          : 'rgba(226, 240, 235, ' + alpha.toFixed(3) + ')');
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.r > 1.25) {
        ctx.beginPath();
        ctx.fillStyle = s.kind === 'rose'
          ? 'rgba(255, 150, 190, ' + (alpha * 0.14).toFixed(3) + ')'
          : (s.kind === 'gold'
            ? 'rgba(255, 206, 110, ' + (alpha * 0.13).toFixed(3) + ')'
            : 'rgba(180, 220, 200, ' + (alpha * 0.1).toFixed(3) + ')');
        ctx.arc(s.x, s.y, s.r * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
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
      var grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 6);
      grd.addColorStop(0, m.rose
        ? 'rgba(255, 176, 208, ' + (ma * 0.8).toFixed(3) + ')'
        : 'rgba(255, 218, 138, ' + (ma * 0.85).toFixed(3) + ')');
      grd.addColorStop(1, m.rose ? 'rgba(240, 130, 180, 0)' : 'rgba(255, 190, 90, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }

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
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(draw);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  resize();
  start();

  window.Particles = { stop: stop, start: start };
})();
