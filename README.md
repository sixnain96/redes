# NETLAB — Fundamentos de Redes

Plataforma web educativa desarrollada para la asignatura **Redes** de la **Universidad Santo Tomás, Seccional Villavicencio**. Integra los contenidos de los talleres y presentaciones suministrados: fundamentos de redes, tipos y topologías, dispositivos, medios de transmisión, cableado UTP, direccionamiento IPv4, flujo de paquetes y prácticas en Cisco Packet Tracer.

## Tecnologías

- HTML5 semántico
- CSS3 responsive
- JavaScript moderno sin frameworks
- SVG propio para iconografía e ilustraciones

No requiere backend ni instalación de dependencias.

## Estructura

```text
NETLAB_Redes_USTA/
├── index.html
├── ABRIR_NETLAB.bat
├── css/
│   ├── styles.css          (diseño original)
│   └── enhancements.css    (movimiento y componentes nuevos)
├── js/
│   ├── data.js             (contenido educativo)
│   ├── script.js           (interacciones principales)
│   ├── quiz.js             (evaluación)
│   ├── mac.js              (simulador de tabla MAC del switch)
│   ├── talleres.js         (encapsulamiento, taller DHCP, seguridad, visor de evidencias)
│   ├── enhancements.js     (topologías, T568, validador IPv4, progreso…)
│   └── video.js            (video de YouTube en la portada)
├── assets/
│   ├── evidencias/         (capturas del informe de Packet Tracer)
│   ├── icons/favicon.svg
│   └── illustrations/network-hero.svg
└── README.md
```

## Organización por cortes

- **Primer corte (8 capítulos):** Fundamentos, Topologías, Dispositivos (con direcciones MAC), Medios, Cableado UTP, Flujo de paquetes, Direccionamiento IPv4 y Packet Tracer.
- **Segundo corte (4 capítulos):** Constructor RJ-45 (T568A/T568B con colores reales), Encapsulamiento y PDU, Taller DHCP (con las capturas del informe) y Seguridad de la infraestructura.
- Cada corte tiene sus **conclusiones** (cifras clave y 8 aprendizajes con enlace al capítulo), su propia evaluación (10 preguntas al azar de su banco), glosario, fuentes y progreso. Se cambia con el selector «Corte 1 / Corte 2» de la cabecera o del menú.

## Funciones destacadas

- **Topologías interactivas:** envía paquetes entre equipos, simula el fallo del switch (estrella) o corta enlaces y observa cómo la malla reencamina.
- **Direcciones MAC:** formato (OUI + NIC) y simulador de switch que aprende MAC, hace flooding y reenvía por unicast.
- **Encapsulamiento y PDU:** simulador que construye y desarma una PDU capa por capa, análisis de una captura (Ethernet, IP, TCP), diagnóstico por capas y verdadero/falso.
- **Taller DHCP:** tablas del informe, simulador del pool DHCP, comandos del router y visor de capturas ampliables.
- **Seguridad de la red:** amenazas, buenas prácticas físicas y lógicas, riesgos por capa y el caso TecnoAndina.
- **Comparador de medios** con barras relativas animadas.
- **Constructor T568A/T568B** (segundo corte) con colores reales y reordenamiento animado y modo práctica (arrastrar, tocar o usar ← →).
- **Simulador de paquetes** con paquete animado, velocidad 0.5×/1×/2×, pasos clicables y teclado.
- **Validador IPv4 y calculadora de subredes** (máscara en punto o CIDR, red, broadcast, rango, hosts y binario).
- **Laboratorio** con barra de progreso, teclado, enlace directo (`#laboratorio-paso-3`) y memoria del último paso.
- **Quiz** de 10 preguntas al azar sobre un banco de 24, con orden aleatorio, atajos (A–D / 1–4, Enter), repaso de fallos y mejor puntaje guardado.
- **Glosario** sin distinción de tildes, con resaltado, filtro por letra y expandir/colapsar todo.
- **Progreso del recorrido** guardado en el navegador, botón «volver arriba» y atajos (J / K para cambiar de capítulo, ? para ayuda).
- Respeta `prefers-reduced-motion`.

## Cómo ejecutar (importante para el video de YouTube)

La página educativa funciona sin un servidor, **pero el video de YouTube integrado puede fallar con error 153 si abres `index.html` haciendo doble clic (`file://`)**. Por eso usa uno de estos métodos:

**Opción A — Visual Studio Code (recomendada):** abre la carpeta, haz clic derecho en `index.html` y selecciona **Open with Live Server** (instala la extensión *Live Server* si es necesario). Comprueba que la barra de direcciones comience por `http://127.0.0.1:5500/` o una URL `http://localhost/...`.

**Opción B — Windows, un clic:** ejecuta `ABRIR_NETLAB.bat` en esta carpeta. Utiliza `jwebserver` del JDK 18+ o Python, si están instalados, y abre NETLAB en `http://127.0.0.1:8765/index.html`. Conserva abierta la ventana del servidor. No requiere descargar dependencias de este proyecto.

**Si no tienes Live Server, Java ni Python:** puedes abrir `index.html` normalmente, pero para evitar mostrar un reproductor con error 153, NETLAB indicará cómo abrir el video directamente en YouTube.

Todos los demás módulos y actividades locales funcionan sin conexión a Internet. El video necesita Internet y que YouTube autorice su inserción.

### Video integrado en la portada

- Enlace del video: https://youtu.be/G1w7-xRyzm4
- Se reproduce en la portada, junto al título y la información académica.
- El video se reproduce dentro de la página al pulsar el botón de play (con Live Server, localhost o un sitio publicado). Si abres `index.html` con doble clic (`file://`), YouTube bloquea la incrustación (error 153); en ese caso el botón abre el video en una ventana emergente y **Abrir en YouTube** sigue disponible.
- Para mejorar la compatibilidad con YouTube, se recomienda abrir la página mediante un servidor local (por ejemplo, la extensión **Live Server** de Visual Studio Code, con clic derecho sobre `index.html` → **Open with Live Server**). Abrir `index.html` directamente con `file://` puede impedir que YouTube reciba el referente HTTP requerido y mostrar el error 153.
- Título y contexto: **Práctica de ponchado de cable UTP con T568B**. Se muestra preparación del cable, orden de los ocho hilos, crimpado del RJ-45 y verificación final. El cierre incluye una explicación sobre el trenzado y los cables directos y cruzados.


## Integrantes

- Juan José Montoya Garzón
- Santiago Saray Quevedo

**Docente:** Omar Camilo Santiago  
**Materia:** Redes  
**Universidad:** Universidad Santo Tomás — Seccional Villavicencio  
**Año:** 2026
