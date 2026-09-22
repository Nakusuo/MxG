/* =========================================================
   backdrop.js — el muro de palabras del fondo
   Filas de una misma palabra repetida, como un cartel serigrafiado:
   la mayoría macizas, algunas solo de contorno. Cada pantalla
   tiene su palabra.

   Es texto quieto: se monta una vez por pantalla y no se vuelve
   a tocar, así que no cuesta nada por fotograma (ni en el teléfono).
   ========================================================= */
(function () {
  'use strict';

  var wall = document.getElementById('wall');
  if (!wall) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WORDS = {
    'screen-intro':     'para ti',
    'screen-carta':     'léeme',
    'screen-recuerdos': 'recuerdo',
    'screen-cajita':    'ábrela',
    'screen-cielo':     'lejos',
    'screen-mirada':    'mírate',
    'screen-final':     'no se me pasa'
  };
  var word = WORDS['screen-intro'];

  /* azar semillado: el muro sale igual en cada carga */
  var seed = 1;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function build() {
    seed = 20240521;
    wall.textContent = '';

    /* se mide una palabra de verdad, con la tipografía ya cargada */
    var probe = document.createElement('span');
    probe.className = 'wall-w solid';
    probe.textContent = word;
    wall.appendChild(probe);
    var wordW = probe.getBoundingClientRect().width || 200;
    var lineH = parseFloat(getComputedStyle(wall).fontSize) * 0.98 || 60;
    var gap = parseFloat(getComputedStyle(probe).marginRight) || 0;
    wall.removeChild(probe);

    var step = wordW + gap;
    var rows = Math.ceil(window.innerHeight / lineH) + 1;
    var perRow = Math.ceil(window.innerWidth / step) + 2;

    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      var row = document.createElement('span');
      row.className = 'wall-row';
      /* cada fila empieza corrida, para que las palabras no se apilen */
      row.style.marginLeft = (-rand() * step).toFixed(1) + 'px';
      for (var i = 0; i < perRow; i++) {
        var w = document.createElement('span');
        w.className = 'wall-w ' + (rand() < 0.3 ? 'out' : 'solid');
        w.textContent = word;
        row.appendChild(w);
      }
      frag.appendChild(row);
    }
    wall.appendChild(frag);
    wall.classList.add('on');
  }

  /* cambiar de palabra: se apaga, se rehace y se enciende */
  var swapTimer;
  function setWord(next) {
    if (!next || next === word) return;
    word = next;
    clearTimeout(swapTimer);
    if (reduce) { build(); return; }
    wall.classList.remove('on');
    swapTimer = setTimeout(build, 220);
  }

  document.addEventListener('screen:enter', function (e) {
    setWord(WORDS[e.detail.id]);
  });

  /* ---------- reencuadre ----------
     En el móvil la barra de direcciones aparece y desaparece al hacer
     scroll y dispara un "resize" de puro alto. Solo reaccionamos a
     cambios de ancho o a saltos de alto de verdad (girar el teléfono). */
  var rt, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 140) return;
    lastW = w; lastH = h;
    clearTimeout(rt);
    rt = setTimeout(build, 180);
  });

  /* se monta ya, y otra vez cuando llega la tipografía de cartel:
     con la de reserva las palabras miden distinto */
  build();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('1em Anton').then(function () { build(); }, function () {});
  }
})();
