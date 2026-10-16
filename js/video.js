/* ==============================
   Video de YouTube dentro de la página
   - Con http(s) (Live Server, localhost, sitio publicado): se reproduce
     incrustado en la portada al pulsar play.
   - Con file:// YouTube bloquea el reproductor incrustado (error 153) porque
     no recibe el referente HTTP. En ese caso el mismo botón abre el video en
     una ventana emergente de reproductor y se explica cómo verlo integrado.
================================ */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const root = document.querySelector('[data-video]');
  if (!root) return;

  const id = root.dataset.videoId;
  const button = root.querySelector('[data-video-play]');
  const thumb = root.querySelector('[data-video-thumb]');
  const note = document.querySelector('[data-video-note]');
  const isFile = window.location.protocol === 'file:';
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  // Si no hay Internet, la miniatura no carga: se mantiene el fondo oscuro.
  thumb?.addEventListener('error', () => { thumb.hidden = true; root.classList.add('is-no-thumb'); });

  if (isFile) {
    root.classList.add('is-local-file');
    if (note) note.textContent = 'Modo archivo: se abrirá en ventana. Para verlo aquí, usa ABRIR_NETLAB.bat o Live Server.';
  }

  const embed = () => {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    });
    if (window.location.origin && window.location.origin !== 'null') params.set('origin', window.location.origin);

    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube.com/embed/${id}?${params}`;
    frame.title = 'Práctica académica de ponchado de cable UTP con estándar T568B';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.className = 'video-frame';
    root.appendChild(frame);
    requestAnimationFrame(() => root.classList.add('is-playing'));
    window.setTimeout(() => button?.remove(), 450);
  };

  button?.addEventListener('click', () => {
    if (isFile) {
      // La página normal de YouTube siempre funciona; es la opción fiable fuera de un servidor.
      const width = 1000;
      const height = 640;
      const win = window.open(watchUrl, 'netlab-video', `popup=yes,width=${width},height=${height}`);
      if (!win) window.open(watchUrl, '_blank', 'noopener');
    } else {
      embed();
    }
  });

});
