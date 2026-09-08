/* =========================================================
   intro.js — coreografía de entrada y navegación entre pantallas
   ========================================================= */
(function () {
  'use strict';

  /* para saber de un vistazo si el navegador cargó la versión nueva */
  if (window.console) console.info('Para ti ♡ · build 18');

  var intro = document.getElementById('screen-intro');
  var skipBtn = document.getElementById('skip-btn');
  var options = document.getElementById('options');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------
     Navegación entre pantallas
     --------------------------------------------------- */
  var Nav = {
    current: 'screen-intro',
    busy: false,
    go: function (id) {
      if (this.busy || id === this.current) return;
      var from = document.getElementById(this.current);
      var to = document.getElementById(id);
      if (!to) return;

      this.busy = true;
      if (from) {
        from.classList.add('is-leaving');
        from.classList.remove('is-active');
      }

      var self = this;
      setTimeout(function () {
        if (from) from.classList.remove('is-leaving');
        to.classList.add('is-active');
        to.scrollTop = 0;
        self.current = id;
        self.busy = false;
        document.dispatchEvent(new CustomEvent('screen:enter', { detail: { id: id } }));
        var focusable = to.querySelector('.back, .opt');
        if (focusable) { try { focusable.focus({ preventScroll: true }); } catch (e) {} }
      }, reduce ? 60 : 460);
    }
  };
  window.Nav = Nav;

  /* botones de opciones y de regreso */
  document.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('.opt') : null;
    if (opt && opt.dataset.go) {
      opt.classList.add('is-chosen');
      setTimeout(function () { opt.classList.remove('is-chosen'); }, 900);
      Nav.go(opt.dataset.go);
      return;
    }
    var back = e.target.closest ? e.target.closest('[data-back]') : null;
    if (back) Nav.go('screen-intro');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && Nav.current !== 'screen-intro') Nav.go('screen-intro');
  });

  /* ---------------------------------------------------
     Secuencia del ramo
     --------------------------------------------------- */
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  var end = 0;
  if (window.Bouquet) {
    try {
      end = window.Bouquet.build() || 8;
    } catch (err) {
      end = 8;
      if (window.console) console.warn('No se pudo dibujar el ramo:', err);
    }
  }

  /* retrasos de las cajitas */
  var cards = options ? options.querySelectorAll('.opt') : [];
  for (var i = 0; i < cards.length; i++) {
    cards[i].style.setProperty('--d', (i * 0.17) + 's');
  }

  /* ---------------------------------------------------
     Encuadre del ramo según la pantalla
     En móvil recortamos los lados vacíos del lienzo para que
     el ramo llene el alto sin quedarse pequeño.
     --------------------------------------------------- */
  var bouquetSvg = document.getElementById('bouquet');
  var stageEl = document.getElementById('stage');
  function frameBouquet() {
    if (!bouquetSvg) return;
    var w = window.innerWidth;
    var box = stageEl ? stageEl.getBoundingClientRect() : { width: w, height: window.innerHeight };
    var tall = box.height / Math.max(1, box.width) > 1.15;
    if (w <= 640 && tall) {
      bouquetSvg.setAttribute('viewBox', '190 20 620 1020');
    } else if (w <= 640) {
      bouquetSvg.setAttribute('viewBox', '80 20 840 1020');
    } else {
      bouquetSvg.setAttribute('viewBox', '0 0 1000 1040');
    }
  }
  frameBouquet();
  var frameTimer;
  window.addEventListener('resize', function () {
    clearTimeout(frameTimer);
    frameTimer = setTimeout(frameBouquet, 150);
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      intro.classList.add('is-playing');
    });
  });

  var tTitle = (end + 0.15) * 1000;
  var tInvite = (end + 0.95) * 1000;

  later(function () { intro.classList.add('step-title'); }, tTitle);
  later(function () {
    intro.classList.add('step-invite');
    if (skipBtn) skipBtn.classList.add('gone');
  }, tInvite);

  /* ---------------------------------------------------
     El menú se abre al tocar "¿Cómo quieres continuar?"
     Así el ramo se ve entero hasta que ella decide.
     --------------------------------------------------- */
  var inviteBtn = document.getElementById('invite');

  function openMenu() {
    intro.classList.add('step-options', 'menu-open');
    if (inviteBtn) inviteBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    intro.classList.remove('menu-open');
    if (inviteBtn) inviteBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    if (intro.classList.contains('menu-open')) closeMenu(); else openMenu();
  }

  if (inviteBtn) inviteBtn.addEventListener('click', toggleMenu);

  /* cuando termina de entrar, la tarjeta se queda fija por CSS
     (si no, al pasar el cursor por encima se borraba) */
  for (var c = 0; c < cards.length; c++) {
    cards[c].addEventListener('animationend', function (e) {
      if (e.animationName === 'cardIn' || e.animationName === 'lastCardIn') {
        e.currentTarget.classList.add('is-in');
      }
    });
  }

  window.Intro = {
    openMenu: openMenu,
    settle: function (card) {
      if (card) setTimeout(function () { card.classList.add('is-in'); }, 1700);
    }
  };

  /* ---------------------------------------------------
     Saltar la animación
     --------------------------------------------------- */
  function fastForward() {
    timers.forEach(clearTimeout);
    timers = [];
    intro.classList.add('step-title', 'step-invite');
    if (skipBtn) skipBtn.classList.add('gone');

    if (typeof document.getAnimations === 'function') {
      requestAnimationFrame(function () {
        document.getAnimations().forEach(function (a) {
          if (!a.effect || !a.effect.getComputedTiming) return;
          var t = a.effect.getComputedTiming();
          try {
            if (t.iterations === Infinity) {
              if (t.delay > 0) a.currentTime = t.delay;
            } else {
              a.finish();
            }
          } catch (e) { /* alguna animación no se deja adelantar; da igual */ }
        });
      });
    } else {
      intro.classList.add('skipping');
    }
  }

  if (skipBtn) skipBtn.addEventListener('click', fastForward);

  if (reduce) later(fastForward, 40);

  /* también se puede saltar tocando el fondo del ramo */
  var stage = document.getElementById('stage');
  if (stage) {
    stage.addEventListener('click', function () {
      if (!intro.classList.contains('step-options')) fastForward();
    });
  }
})();
