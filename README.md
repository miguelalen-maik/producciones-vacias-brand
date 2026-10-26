# Producciones Vacías — Web de marca

Web estática en HTML, CSS y JavaScript. No necesita instalar paquetes ni compilar.

## Abrir en local

Desde esta carpeta, ejecutar:

```sh
python3 server.py
```

Abrir **http://localhost:5173**. Para detener el servidor, pulsar `Ctrl+C` en la terminal.

## Implementación

- Desktop basado en el frame `113:213`, tablet en `138:283` y móvil en `138:538` del archivo de Figma.
- Desktop desde 1200 px: composición aprobada de 1680 px escalada proporcionalmente. Tablet de 768 a 1199 px y móvil hasta 767 px: layouts fluidos según los frames de 834 y 390 px de Figma.
- Header visible al hacer scroll. En tablet y móvil, menú fullscreen con cierre por botón, Escape o selección de una sección, y navegación accesible por teclado.
- Navegación interna a concepto, logo, colores, tipografía y kit de marca.
- Descargas reales desde archivos relativos del proyecto. El botón de tipografía conserva el enlace a Google Fonts.
- Carteles y entrada originales de `assets/carteles`; imágenes adicionales exportadas de Figma en `assets/figma`.
- Hanken Grotesk alojada localmente en `assets/fonts`, con su licencia OFL.
- El archivo de Figma no se modifica.

## Archivos principales

- `index.html`: estructura y contenido.
- `styles.css`: tipografía, colores y composición desktop.
- `responsive.css`: layouts tablet/móvil y menú fullscreen.
- `motion.css`: microinteracciones y respeto de movimiento reducido.
- `app.js`: ajuste del lienzo desktop, navegación, menú, botones y apariciones con IntersectionObserver, sin librerías externas.
- `server.py`: servidor local, con Python 3 y sin dependencias externas.

## Descargas

Los botones utilizan archivos estáticos: funcionan en local y al publicar el proyecto, también dentro de una subcarpeta. No necesitan un servidor de aplicación.

| Botón | Descarga | Contenido |
| --- | --- | --- |
| Logotipos | `assets/downloads/producciones-vacias-logos.zip` | 20 SVG/PNG, agrupados por logo principal/horizontal y formato. |
| Plantillas y acciones | `assets/downloads/producciones-vacias-plantillas-y-acciones.zip` | La plantilla PSD y la acción de Photoshop ATN originales. |
| Carteles | `assets/downloads/producciones-vacias-carteles.zip` | Los 19 archivos PSD/PDF/PNG de carteles y entradas, organizados por carpeta. |
| Recursos | `assets/recursos/iconos.svg` | El SVG original, descargado como `producciones-vacias-recursos.svg`. |
| Tipografía | Google Fonts | El enlace existente de Hanken Grotesk. No se incluye la fuente en los paquetes. |

El ZIP completo de carteles ocupa aproximadamente **2,86 GB** porque contiene los originales sin reducir su calidad. Las descargas se solicitan solo al pulsar los botones.

Los originales se conservan en sus carpetas. Los ZIP no incluyen archivos ocultos ni metadatos de macOS. Sus nombres internos se simplifican para facilitar su uso en distintos sistemas, sin alterar los archivos.

Para reconstruir los paquetes después de actualizar los originales:

```sh
python3 scripts/build-downloads.py
python3 scripts/verify-downloads.py
```

`assets/downloads/manifest.json` registra los archivos incluidos, tamaños y hashes SHA-256. La verificación comprueba la integridad de cada ZIP y que sus archivos son idénticos a los originales.

## Git y archivos grandes

Los PNG, PDF y PSD originales se versionan con **Git LFS**. En otro equipo es necesario instalar Git LFS antes de clonar, o ejecutar después:

```sh
git lfs install
git lfs pull
```

Los ZIP de `assets/downloads` son archivos generados y no se suben a Git: duplican los originales y el paquete de carteles supera el límite por archivo de Git LFS para cuentas Free/Pro. Se conservan localmente. Después de clonar y antes de publicar la web, reconstruirlos con:

```sh
python3 scripts/build-downloads.py
python3 scripts/verify-downloads.py
```

El resto de la web se sirve directamente como archivos estáticos. No publicar una copia que contenga únicamente los punteros de Git LFS: deben descargarse los originales antes de preparar el despliegue.
