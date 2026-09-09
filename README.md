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

En `MOMENTS` hay un hueco a propósito: el segundo recuerdo tiene
`fill: '[recuerdo específico]'`, pensado para rellenarlo.

Los textos se insertan con `textContent` (nunca `innerHTML`), así que para un
salto de línea se usa `\n` dentro de la cadena, no `<br>`.

## Caché

El HTML enlaza los archivos con `?v=18` y `js/intro.js` imprime
`build 18` en la consola. Si editas el CSS o el JS, sube ese número en los
cinco enlaces de `index.html` para que el navegador no sirva la versión vieja.

## Detalles

- **El ramo siempre sale igual.** `bouquet.js` usa un azar semillado
  (`mulberry32`), así que las imperfecciones dibujadas a mano son las mismas
  en cada carga.
- **Se respeta `prefers-reduced-motion`.** Con esa preferencia activa se
  quitan los pétalos y las motas, las estrellas dejan de titilar y la intro
  salta directa al final.
- **Se puede saltar la intro** con el botón o tocando el fondo del ramo.
- **Teclado:** `Esc` vuelve al ramo desde cualquier pantalla. Las flores y las
  cajitas son `<button>`, y las estrellas del cielo llevan `tabindex` y su
  propio manejo de `Enter` / espacio.
- **Sin dependencias** salvo las tipografías de Google Fonts (Caveat,
  Patrick Hand, Gloria Hallelujah). Sin ellas el sitio funciona igual, solo
  cambia la letra.
