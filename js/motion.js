/* ==============================
   NETLAB · Movimiento y primera visita
   - Pantalla de bienvenida y salto al inicio del tercer corte (solo la primera vez)
   - Titular de la portada por palabras, spotlight en tarjetas, botones magnéticos
   - Desplazamiento con curva suave para enlaces internos
   - Pistas animadas en el primer botón de cada simulador
================================ */
(() => {
  'use strict';

  const root = document.documentElement;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cuts = () => window.NETLAB_CUTS;

  root.classList.add('js-motion');

  /* ---------- Titular por palabras ---------- */
  const heroTitle = qs('.hero h1');
  if (heroTitle && !reduceMotion) {
    let index = 0;
    const split = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
            outer.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.style.setProperty('--wi', String(index));
            index += 1;
            inner.textContent = part;
            outer.append(inner);
            frag.append(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) split(child);
      });
    };
    heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());
    split(heroTitle);
  }

  /* ---------- Toast propio (misma pieza de interfaz que el resto) ---------- */
  const toastEl = qs('[data-toast]');
  const toast = (message, ms = 5200) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    window.setTimeout(() => toastEl.classList.remove('is-visible'), ms);
  };

  /* ---------- Primera visita: bienvenida y tercer corte ---------- */
  const welcome = root.getAttribute('data-welcome') === 'third';
  const jumpToStart = () => {
    const target = document.getElementById('estructura-ipv4');
    if (!target) return;
    root.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = '';
  };

  if (welcome) {
    jumpToStart();
    window.addEventListener('load', jumpToStart, { once: true });
    if (!reduceMotion) {
      const intro = document.createElement('div');
      intro.className = 'intro';
      intro.setAttribute('role', 'status');
      intro.setAttribute('aria-label', 'Bienvenida a NETLAB, tercer corte');
      intro.innerHTML = '<div class="intro__inner"><div class="intro__mark" aria-hidden="true"><svg viewBox="0 0 34 34"><path d="M6 24V10l11 14V10M17 24l11-14v14"/></svg></div><div class="intro__name">NETLAB</div><div class="intro__cut">Tercer corte · Capa de red</div><div class="intro__bar" aria-hidden="true"><i></i></div></div>';
      document.body.append(intro);
      document.body.classList.add('is-intro');
      const close = () => {
        intro.classList.add('is-leaving');
        document.body.classList.remove('is-intro');
        window.setTimeout(() => { intro.remove(); jumpToStart(); }, 950);
      };
      window.setTimeout(close, 2300);
      intro.addEventListener('click', close);
    }
    window.setTimeout(() => toast('Estás en el Tercer corte. La próxima vez que abras NETLAB empezarás en el inicio; usa el selector Corte 1 · 2 · 3 para cambiar.'), reduceMotion ? 800 : 3600);
  }

  /* ---------- Desplazamiento suave con curva propia ---------- */
  let scrolling = false;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smoothTo = (top) => {
    if (reduceMotion) { window.scrollTo(0, top); return; }
    const from = window.scrollY;
    const distance = top - from;
    if (Math.abs(distance) < 4) return;
    const duration = Math.max(520, Math.min(1250, Math.abs(distance) * 0.45));
    const start = performance.now();
    scrolling = true;
    root.style.scrollBehavior = 'auto';
    const cancel = () => { scrolling = false; };
    ['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
    const step = (now) => {
      if (!scrolling) { root.style.scrollBehavior = ''; return; }
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + distance * easeInOut(t));
      if (t < 1) requestAnimationFrame(step); else { scrolling = false; root.style.scrollBehavior = ''; }
    };
    requestAnimationFrame(step);
  };
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link || link.closest('[data-menu-panel]') || link.classList.contains('skip-link')) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    const section = target.closest('section[data-cut]');
    const api = cuts();
    if (section && api && !api.matches(section.dataset.cut, api.getCut())) return; // lo gestiona el cambio de corte
    event.preventDefault();
    const offset = parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 72;
    smoothTo(target.getBoundingClientRect().top + window.scrollY - offset - 12);
    try { window.history.pushState(null, '', `#${id}`); } catch (e) { /* file:// */ }
  });

  /* ---------- Spotlight bajo el cursor ---------- */
  if (finePointer && !reduceMotion) {
    const spotSelector = '.cut-card, .concl-item, .evidence-card, .service-line article, .threats__grid article, .analysis article, .addr-card, .three-ip__grid article, .surprises article, .split-note article, .learning-summary article';
    qsa(spotSelector).forEach((node) => node.classList.add('spot'));
    document.addEventListener('pointermove', (event) => {
      const node = event.target instanceof Element ? event.target.closest('.spot') : null;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      node.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });

    /* Botones magnéticos de la portada */
    qsa('.hero__actions .button').forEach((button) => {
      let frame = 0;
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { button.style.transform = `translate(${(x * 8).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`; });
      });
      button.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); button.style.transform = ''; });
    });
  }

  /* ---------- Pista animada en el primer botón de cada simulador ---------- */
  const hints = ['[data-subnet-play]', '[data-ns-send]', '[data-ospf-run]', '[data-ttl-send]', '[data-dhcp2-request]', '[data-t2-tracert]', '[data-t1-test="gw"]'];
  hints.forEach((selector) => {
    const button = qs(selector);
    if (!button || reduceMotion) return;
    const remove = () => button.classList.remove('pulse-hint');
    button.addEventListener('click', remove, { once: true });
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry], observer) => {
      if (entry.isIntersecting && button.offsetParent !== null) { window.setTimeout(() => button.classList.add('pulse-hint'), 900); observer.disconnect(); }
    }, { threshold: 0.6 }).observe(button);
  });
})();

/* ==============================
   Barra lateral de capítulos (solo pantallas anchas)
================================ */
(() => {
  'use strict';
  const root = document.documentElement;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rail = document.createElement('nav');
  rail.className = 'rail';
  rail.setAttribute('aria-label', 'Capítulos del corte actual');
  document.body.append(rail);

  const matches = (value, cut) => {
    if (!value) return true;
    const list = value.split(/\s+/);
    return list.includes('both') || list.includes(cut);
  };
  let items = [];
  const build = () => {
    const cut = root.dataset.cut || 'first';
    rail.replaceChildren();
    items = qsa('main section[id]').filter((s) => s.id !== 'cortes' && matches(s.dataset.cut, cut)).map((section) => {
      const a = document.createElement('a');
      a.href = `#${section.id}`;
      a.dataset.rail = section.id;
      const dot = document.createElement('i');
      const label = document.createElement('span');
      label.textContent = section.dataset.navTitle || section.id;
      a.append(label, dot);
      rail.append(a);
      return { id: section.id, section, a };
    });
    update();
  };
  const update = () => {
    const probe = window.innerHeight * 0.4;
    let current = items[0];
    items.forEach((item) => { if (item.section.getBoundingClientRect().top <= probe) current = item; });
    items.forEach((item) => item.a.classList.toggle('is-current', item === current));
    rail.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.6);
  };
  let ticking = false;
  window.addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }, { passive: true });
  window.addEventListener('resize', update);
  document.addEventListener('netlab:cut', () => window.setTimeout(build, 60));
  const menu = qs('[data-menu-panel]');
  if (menu) new MutationObserver(() => rail.classList.toggle('is-hidden', menu.classList.contains('is-open'))).observe(menu, { attributes: true, attributeFilter: ['class'] });
  void reduceMotion;
  build();
})();
