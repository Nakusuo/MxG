# Para ti ♡

Un pequeño sitio hecho a mano: un ramo de girasoles dibujado en SVG que se arma
solo al cargar, y detrás de él cinco rincones con cartas, recuerdos y cajitas.
No hay librerías, no hay build, no hay servidor. Son cuatro archivos y un HTML.

## Cómo verlo

Basta con abrir `index.html` en el navegador.

Si prefieres servirlo (recomendado, evita rarezas con caché):

```sh
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Qué hay dentro

```
index.html        estructura de las seis pantallas
css/styles.css    todo el estilo y las animaciones
js/particles.js   el lienzo de fondo: estrellas, motas y pétalos
js/bouquet.js     construye el ramo en SVG, flor por flor
js/intro.js       la coreografía de entrada y la navegación
js/sections.js    el contenido de cada rincón
```

### Las pantallas

| Pantalla | Qué es |
|---|---|
| **El ramo** | La entrada. El ramo se dibuja solo y luego aparece el menú. |
| **Tengo algo para ti** | Una carta que se escribe sola, párrafo a párrafo. |
| **Quiero recordar algo** | Un jardín: cada flor se abre y enseña un recuerdo. |
| **Abre una cajita** | Tres cajitas de regalo con las cosas difíciles de decir. |
| **Déjame llevarte a otro lugar** | Una constelación en forma de corazón; se enciende estrella por estrella. |
| **Mira lo que veo** | Una capa oscura que solo se revela donde pasas el dedo. |
| **Y una última cosa** | Oculta. Aparece al final (ver abajo). |

### La última puerta

La sexta tarjeta (`.opt-last`) empieza con `hidden`. El módulo `Progress`
(`js/sections.js:94`) la destapa cuando se cumplen dos condiciones:

1. Se visitaron las cinco pantallas de `DOORS` (`js/sections.js:96`).
2. Se abrieron **todas** las cajitas.

El progreso vive en memoria: al recargar la página vuelve a empezar.

## Cómo cambiar los textos

Casi todo el contenido está en arrays al principio de cada módulo:

- Recuerdos del jardín → `MOMENTS`, `js/sections.js:172`
- Cajitas (texto y colores) → `GIFTS`, `js/sections.js:253`
- Frases del cielo → `LINES`, `js/sections.js:379`
- Palabras de "Mira lo que veo" → `GLIMPSES`, `js/sections.js:533`
- La carta → directamente en `index.html:92`
- El cierre → directamente en `index.html:180`

Los textos se insertan con `textContent` (nunca `innerHTML`), así que para un
salto de línea se usa `\n` dentro de la cadena, no `<br>`.

## Caché

El HTML enlaza los archivos con `?v=25` y `js/intro.js` imprime
`build 25` en la consola, para que el navegador no sirva la versión vieja.

De eso se encarga el hook `.githooks/pre-commit`: cuando un commit toca
`css/` o `js/`, sube el número solo. Para activarlo en un clon nuevo:

```sh
git config core.hooksPath .githooks
```

## Detalles

- **El ramo siempre sale igual.** `bouquet.js` usa un azar semillado
  (`mulberry32`), así que las imperfecciones dibujadas a mano son las mismas
  en cada carga —y en cualquier aparato: lo que el modo ligero se salta se
  calcula igualmente, solo que no se dibuja, para no mover la semilla.
- **Se respeta `prefers-reduced-motion`.** Con esa preferencia activa se
  quitan los pétalos y las motas, las estrellas dejan de titilar y la intro
  salta directa al final.
- **En el teléfono se enciende el modo ligero.** Un script al principio de
  `index.html` decide si el aparato es modesto (pantalla pequeña con dedo,
  poca memoria o pocos núcleos), pone `window.LITE` y la clase `lite` en
  `<html>`. Con eso:

  - el ramo se dibuja **exactamente igual** —mismo número de pétalos, misma
    silueta, mismo azar— pero se ahorra lo que a ese tamaño no se distingue:
    la tinta de las capas interiores, las nervaduras finas y algunas semillas;
  - **la entrada no anima el SVG.** Animar ~1.000 piezas dentro de un SVG
    obliga al teléfono a repintar el ramo entero en cada fotograma, y la
    entrada iba a trompicones. En su lugar, `Bouquet.sprite()` pinta el ramo
    una sola vez en trozos —tallos de atrás, cada cabeza, tallos de delante,
    lazo—, cada uno en su propio `<canvas>`, y lo que se anima son esos
    lienzos con `transform` y `opacity`, que la GPU mueve sin repintar.
    Para que no quede tieso, cada flor se corta en capas —capullo, pétalos
    de fuera, pétalos de dentro, centro y resplandor— y se abre por etapas
    como en el SVG; cada flor cabecea a su ritmo, y los tallos de atrás, los
    de delante y el lazo se mecen por separado desde la base. El SVG queda
    escondido (clase `sprited`); si algo falla al pintar, se vuelve a él;
  - en vez de mecer cada tallo, cada hoja y cada cabeza por separado (eran
    unas 133 animaciones eternas repintando el SVG entero a 60 fps), se mece
    el ramo completo con un solo `transform`, que la tarjeta gráfica ya tiene
    guardado. Empieza cuando la entrada termina, con la clase `is-settled`;
  - el grano se queda quieto, y se van los `backdrop-filter` y el desenfoque
    al cambiar de pantalla;
  - el lienzo del fondo dibuja las estrellas una sola vez y luego las copia,
    usa sellos en vez de crear degradados, y va a ~30 fps.

  En escritorio no cambia nada: el vaivén sigue siendo pieza por pieza.

- **Una pantalla que no se ve no gasta.** Al salir de una pantalla, sus
  animaciones se pausan y el ramo deja de renderizarse
  (`content-visibility`). Al volver siguen donde estaban.

- **Se puede saltar la intro** con el botón o tocando el fondo del ramo.
- **Teclado:** `Esc` vuelve al ramo desde cualquier pantalla. Las flores y las
  cajitas son `<button>`, y las estrellas del cielo llevan `tabindex` y su
  propio manejo de `Enter` / espacio.
- **Sin dependencias** salvo las tipografías de Google Fonts (Caveat,
  Patrick Hand, Gloria Hallelujah). Sin ellas el sitio funciona igual, solo
  cambia la letra.
