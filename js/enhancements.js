/* ==============================
   NETLAB — Mejoras de funcionalidad y movimiento
   Se carga después de script.js y trabaja sobre el DOM existente.
   Módulos: utilidades · revelado escalonado · indicadores deslizantes ·
   navegación y progreso · hero · topologías · comparador · T568 ·
   paquete · validador IPv4 · laboratorio.
================================ */
(() => {
  'use strict';

  const data = window.NETLAB_DATA;
  const api = window.NETLAB_API;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  document.documentElement.classList.add('js-enh');

  /* ---------- Almacenamiento seguro ---------- */
  const store = {
    get(key, fallback = null) {
      try {
        const raw = window.localStorage.getItem(`netlab:${key}`);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(`netlab:${key}`, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
    }
  };

  /* ---------- Utilidades ---------- */
  const replay = (elements, { stagger = true } = {}) => {
    const list = Array.isArray(elements) ? elements : [elements];
    list.filter(Boolean).forEach((el, index) => {
      if (stagger) el.style.setProperty('--i', String(index));
      el.classList.remove('anim-swap');
      void el.offsetWidth;
      el.classList.add('anim-swap');
    });
  };

  const toastEl = qs('[data-toast]');
  let toastTimer = null;
  const toast = (message, ms = 2600) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), ms);
  };

  const countUp = (el, to, { duration = 800, suffix = '' } = {}) => {
    if (reduceMotion || !Number.isFinite(to)) { el.textContent = `${to.toLocaleString('es')}${suffix}`; return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = `${Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString('es')}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const isTyping = (target) => target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

  /* ==============================
     Cortes académicos
  ================================ */
  const root = document.documentElement;
  const cutSwitches = qsa('[data-cut-switch]');
  const cutLabels = { first: 'Primer corte', second: 'Segundo corte' };
  const chapterNumbers = {
    first: { fundamentos: 1, topologias: 2, dispositivos: 3, medios: 4, cableado: 5, flujo: 6, ipv4: 7, laboratorio: 8, conclusiones: 9, evaluacion: 10, glosario: 11, cierre: 12 },
    second: { rj45: 1, encapsulamiento: 2, 'taller-dhcp': 3, seguridad: 4, conclusiones: 5, evaluacion: 6, glosario: 7, cierre: 8 }
  };
  const pageTitles = { inicio: 'Portada', fundamentos: 'Fundamentos', topologias: 'Topologías', dispositivos: 'Dispositivos', medios: 'Medios', cableado: 'Cableado UTP', flujo: 'Flujo de paquetes', rj45: 'Constructor RJ-45', ipv4: 'Direccionamiento IPv4', laboratorio: 'Packet Tracer', encapsulamiento: 'Encapsulamiento', 'taller-dhcp': 'Taller DHCP', seguridad: 'Seguridad', conclusiones: 'Conclusiones', evaluacion: 'Evaluación', glosario: 'Glosario', cierre: 'Cierre' };
  const getCut = () => (root.dataset.cut === 'second' ? 'second' : 'first');
  const inCut = (el) => !el.dataset.cut || el.dataset.cut === 'both' || el.dataset.cut === getCut();
  const visibleSections = () => qsa('main section[id]').filter(inCut);

  const refreshCut = () => {
    const cut = getCut();
    const numbers = chapterNumbers[cut];
    cutSwitches.forEach((group) => qsa('[data-cut-select]', group).forEach((button) => {
      const on = button.dataset.cutSelect === cut;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    }));
    qsa('[data-cut-card]').forEach((card) => card.classList.toggle('is-current', card.dataset.cutCard === cut));
    qsa('[data-nav-link]').forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const visible = inCut(link);
      link.hidden = !visible;
      const num = qs('span', link);
      if (num && numbers[id]) num.textContent = String(numbers[id]).padStart(2, '0');
    });
    Object.entries(numbers).forEach(([id, n]) => {
      const idx = qs(`#${id} .chapter-heading__index`);
      if (idx) idx.textContent = String(n).padStart(2, '0');
    });
    // Enlaces anterior / siguiente según el corte
    const order = visibleSections().map((section) => section.id).filter((id) => id !== 'cortes');
    order.forEach((id, i) => {
      const pager = qs(`#${id} .chapter-pager`);
      if (!pager || i === 0) return;
      const prev = order[i - 1];
      const next = order[i + 1];
      pager.replaceChildren();
      const a = document.createElement('a');
      a.href = `#${prev}`;
      a.textContent = `← ${pageTitles[prev]}`;
      pager.appendChild(a);
      if (next) {
        const b = document.createElement('a');
        b.href = `#${next}`;
        b.textContent = `${pageTitles[next]} →`;
        pager.appendChild(b);
      }
    });
    // Fuentes: numeración de las visibles
    qsa('.references ol li').filter(inCut).forEach((li, i) => {
      const n = qs('span', li);
      if (n) n.textContent = String(i + 1).padStart(2, '0');
    });
    const label = qs('.menu-panel__meta p:last-child');
    if (label) label.textContent = `Seccional Villavicencio · Redes · ${cutLabels[cut]}`;
  };

  const setCut = (cut, { scroll = true, announce = true } = {}) => {
    const next = cut === 'second' ? 'second' : 'first';
    if (next === getCut() && !scroll) return;
    const changed = next !== getCut();
    const main = qs('#main-content');
    const apply = () => {
      root.dataset.cut = next;
      store.set('cut', next);
      refreshCut();
      document.dispatchEvent(new CustomEvent('netlab:cut', { detail: { cut: next } }));
      if (scroll) {
        const target = qs(`#${next === 'second' ? 'rj45' : 'fundamentos'}`);
        if (target) target.scrollIntoView({ block: 'start' });
      }
      if (changed && announce) toast(`${cutLabels[next]}: ${next === 'second' ? 'RJ-45, Encapsulamiento, Taller DHCP y Seguridad' : 'fundamentos, medios, cableado y Packet Tracer'}`);
    };
    if (!changed || reduceMotion || !main) { apply(); return; }
    main.classList.add('is-switching');
    window.setTimeout(() => {
      apply();
      requestAnimationFrame(() => main.classList.remove('is-switching'));
    }, 220);
  };

  qsa('[data-cut-select]').forEach((button) => button.addEventListener('click', () => {
    const inMenu = Boolean(button.closest('[data-menu-panel]'));
    setCut(button.dataset.cutSelect, { scroll: !inMenu || button.dataset.cutSelect !== getCut() });
    if (inMenu) qs('[data-menu-close]')?.click();
  }));
  // Un enlace directo a una sección de otro corte cambia de corte
  window.addEventListener('hashchange', () => {
    const id = window.location.hash.replace('#', '');
    const target = id && document.getElementById(id);
    const section = target && target.closest('section[data-cut]');
    if (section && section.dataset.cut !== 'both' && section.dataset.cut !== getCut()) {
      root.dataset.cut = section.dataset.cut;
      refreshCut();
      document.dispatchEvent(new CustomEvent('netlab:cut', { detail: { cut: getCut() } }));
      target.scrollIntoView({ block: 'start' });
    }
  });
  refreshCut();

  /* Cifras de las conclusiones */
  qsa('[data-concl-stats]').forEach((box) => {
    const nums = qsa('[data-count]', box);
    const run = () => nums.forEach((el) => countUp(el, Number(el.dataset.count), { duration: 900 }));
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    nums.forEach((el) => { el.textContent = '0'; });
    new IntersectionObserver(([entry], observer) => {
      if (entry.isIntersecting && box.offsetParent !== null) { run(); observer.disconnect(); }
    }, { threshold: 0.4 }).observe(box);
  });

  /* ==============================
     Revelado escalonado de grupos
  ================================ */
  const staggerGroups = [
    '.media-principles > article', '.service-line > article', '.learning-summary > article',
    '.category-track > div', '.references ol > li', '.layer-strip > div', '.concept-pair > article',
    '.gateway-note > div', '.cable-rule > div', '.spec-grid > div', '.hero__academic > div',
    '.utp-categories__head', '.medium-row > article', '.media-paths > div'
  ];
  const staggerItems = [];
  staggerGroups.forEach((selector) => {
    const parents = new Map();
    qsa(selector).forEach((el) => {
      if (el.closest('[data-network-panel]')) return;
      const key = el.parentElement;
      const index = parents.get(key) || 0;
      parents.set(key, index + 1);
      el.classList.add('stagger-item');
      el.style.setProperty('--i', String(index));
      staggerItems.push(el);
    });
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    staggerItems.forEach((el) => el.classList.add('is-in'));
  } else {
    const staggerObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    staggerItems.forEach((el) => staggerObserver.observe(el));
  }

  /* ==============================
     Repetir animación al cambiar contenido
  ================================ */
  const hook = (selector, handler) => qsa(selector).forEach((el) => el.addEventListener('click', handler));

  hook('[data-network-type]', () => {
    const panel = qs('[data-network-panel]');
    replay([qs('.network-types__intro', panel), ...qsa('.spec-grid > div', panel)]);
  });
  hook('[data-device]', () => {
    const panel = qs('[data-device-panel]');
    replay([...qsa(':scope > h3, :scope > dl > div, :scope > p', panel)]);
  });
  hook('[data-scenario]', () => replay(qs('.scenario-explanation'), { stagger: false }));
  document.addEventListener('netlab:packet', () => replay(qsa('.packet-console h3, .packet-console p:not(.packet-console__status)'), { stagger: true }));
  document.addEventListener('netlab:lab', () => replay(qsa('.lab-instruction h3, .lab-instruction p'), { stagger: true }));

  /* ==============================
     Indicador deslizante (tabs y controles segmentados)
  ================================ */
  const makeSlider = (container, selector) => {
    if (!container) return;
    const pill = document.createElement('span');
    pill.className = 'slide-pill';
    pill.setAttribute('aria-hidden', 'true');
    container.appendChild(pill);
    container.classList.add('has-slider');

    const update = (instant = false) => {
      const active = qs(`${selector}.is-active`, container) || qs(`${selector}[aria-selected="true"]`, container);
      if (!active || !active.offsetWidth) return;
      if (instant) pill.style.transition = 'none';
      pill.style.setProperty('--x', `${active.offsetLeft}px`);
      pill.style.setProperty('--y', `${active.offsetTop}px`);
      pill.style.setProperty('--w', `${active.offsetWidth}px`);
      pill.style.setProperty('--h', `${active.offsetHeight}px`);
      if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
      pill.classList.add('is-ready');
    };

    const observer = new MutationObserver(() => update());
    qsa(selector, container).forEach((button) => observer.observe(button, { attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-pressed'] }));
    if ('ResizeObserver' in window) new ResizeObserver(() => update(true)).observe(container);
    window.addEventListener('resize', () => update(true));
    window.addEventListener('load', () => update(true));
    update(true);
  };

  makeSlider(qs('.network-types__tabs'), 'button');
  qsa('.segmented').forEach((segmented) => makeSlider(segmented, 'button'));

  /* ==============================
     Ripple en botones
  ================================ */
  document.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.button, .chip-button, .small-action') : null;
    if (!target || target.disabled || reduceMotion) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  /* ==============================
     Navegación: progreso, hash, volver arriba, atajos
  ================================ */
  const sectionEls = qsa('main section[id]');
  const navLinks = qsa('[data-nav-link]');
  const progressLinks = () => navLinks.filter((link) => !link.hidden);
  const visited = new Set(store.get('visited', []));
  const progressText = qs('[data-menu-progress-text]');
  const progressBar = qs('[data-menu-progress-bar]');

  const paintVisited = () => {
    navLinks.forEach((link) => link.classList.toggle('is-visited', visited.has(link.getAttribute('href').slice(1))));
    const links = progressLinks();
    const done = links.filter((link) => visited.has(link.getAttribute('href').slice(1))).length;
    if (progressText) progressText.textContent = `${done} / ${links.length}`;
    if (progressBar) progressBar.style.transform = `scaleX(${links.length ? done / links.length : 0})`;
  };
  paintVisited();
  document.addEventListener('netlab:cut', paintVisited);

  const markVisited = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    store.set('visited', [...visited]);
    paintVisited();
    if (progressLinks().length && progressLinks().every((link) => visited.has(link.getAttribute('href').slice(1)))) toast(`${cutLabels[getCut()]} completado. ¡Buen trabajo!`);
  };

  let userScrolled = false;
  let hashTimer = null;
  window.addEventListener('scroll', () => { userScrolled = true; }, { passive: true, once: true });

  if ('IntersectionObserver' in window) {
    const visitObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        markVisited(entry.target.id);
        if (!userScrolled) return;
        window.clearTimeout(hashTimer);
        hashTimer = window.setTimeout(() => {
          const id = entry.target.id;
          const next = id === 'inicio' ? window.location.pathname + window.location.search : `#${id}`;
          try { window.history.replaceState(null, '', next); } catch (e) { /* file:// restringido en algunos navegadores */ }
        }, 220);
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sectionEls.forEach((section) => visitObserver.observe(section));
  }

  const toTop = qs('[data-to-top]');
  const updateToTop = () => toTop?.classList.toggle('is-visible', window.scrollY > 900);
  window.addEventListener('scroll', updateToTop, { passive: true });
  updateToTop();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const currentSectionIndex = () => {
    const probe = window.innerHeight * 0.3;
    let index = 0;
    visibleSections().forEach((section, i) => { if (section.getBoundingClientRect().top <= probe) index = i; });
    return index;
  };
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
    if (qs('[data-menu-panel].is-open')) return;
    const key = event.key.toLowerCase();
    if (key === 'j' || key === 'k') {
      const list = visibleSections();
      const target = list[Math.max(0, Math.min(list.length - 1, currentSectionIndex() + (key === 'j' ? 1 : -1)))];
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    } else if (event.key === '?') {
      toast('Atajos: J / K cambian de capítulo · ← → mueven pasos en el laboratorio y el simulador', 4200);
    }
  });
  if (!store.get('tips-shown', false)) {
    store.set('tips-shown', true);
    window.setTimeout(() => toast('Consejo: usa J / K para saltar entre capítulos. Pulsa ? para ver más atajos.', 4200), 2600);
  }

  document.addEventListener('netlab:quiz-finished', (event) => {
    if (event.detail?.record) toast('Nuevo mejor puntaje guardado');
  });

  /* ==============================
     Hero: red animada de fondo y parallax suave
  ================================ */
  const heroCanvas = qs('[data-hero-network]');
  const hero = qs('.hero');
  if (heroCanvas && hero && !reduceMotion) {
    const ctx = heroCanvas.getContext('2d');
    let width = 0;
    let height = 0;
    let nodes = [];
    let running = false;
    let frame = 0;
    const pointer = { x: -999, y: -999 };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      heroCanvas.width = Math.round(width * ratio);
      heroCanvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(14, Math.min(46, Math.round((width * height) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.2 + Math.random() * 1.6
      }));
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;
      }
      const reach = 150;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < reach) {
            ctx.strokeStyle = `rgba(4,153,208,${(1 - d / reach) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (dp < 170) {
          ctx.strokeStyle = `rgba(4,153,208,${(1 - dp / 170) * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(4,153,208,.45)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const start = () => { if (!running && !document.hidden) { running = true; frame = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(frame); };

    resize();
    window.addEventListener('resize', resize);
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
    } else start();
  }

  const parallaxEl = qs('.hero__visual-frame');
  if (parallaxEl && !reduceMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        parallaxEl.style.transform = `translate3d(0, ${(y * 0.07).toFixed(1)}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ==============================
     Topologías: tráfico animado, rutas y fallos
  ================================ */
  const topoRoot = qs('.topology-explorer');
  if (topoRoot) {
    const statusEl = qs('[data-topology-status]');
    const sendBtn = qs('[data-topology-send]');
    const failBtn = qs('[data-topology-fail]');
    const resetBtn = qs('[data-topology-reset]');
    const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

    const makeNet = (viewKey, nodeDefs, edgePairs) => {
      const view = qs(`[data-topology-view="${viewKey}"]`);
      const svg = qs('svg', view);
      const overlay = document.createElementNS(NS, 'g');
      overlay.setAttribute('class', 'topology-overlay');
      const links = qs('.topology-links', svg);
      if (links) links.after(overlay); else svg.prepend(overlay);
      const tokens = document.createElementNS(NS, 'g');
      tokens.setAttribute('class', 'topology-tokens');
      svg.appendChild(tokens);

      const net = { key: viewKey, view, svg, overlay, tokens, nodes: new Map(), edges: [], failed: new Set(), selected: null, token: null, anim: 0 };
      nodeDefs.forEach((def) => { net.nodes.set(def.id, { ...def }); });

      edgePairs.forEach(([a, b]) => {
        const A = net.nodes.get(a);
        const B = net.nodes.get(b);
        const group = document.createElementNS(NS, 'g');
        group.setAttribute('class', 'topology-edge');
        const mk = (cls) => {
          const line = document.createElementNS(NS, 'line');
          line.setAttribute('x1', A.x); line.setAttribute('y1', A.y);
          line.setAttribute('x2', B.x); line.setAttribute('y2', B.y);
          line.setAttribute('class', cls);
          return line;
        };
        const cover = mk('topology-edge__cover');
        const dash = mk('topology-edge__dash');
        const glow = mk('topology-edge__glow');
        const hit = mk('topology-edge__hit');
        const cross = document.createElementNS(NS, 'text');
        cross.setAttribute('class', 'topology-edge__x');
        cross.setAttribute('x', (A.x + B.x) / 2);
        cross.setAttribute('y', (A.y + B.y) / 2 + 5);
        cross.textContent = '✕';
        const title = document.createElementNS(NS, 'title');
        title.textContent = `Enlace ${A.name}–${B.name}: clic para cortar o reparar`;
        group.append(cover, dash, glow, cross, hit, title);
        overlay.appendChild(group);
        const edge = { a, b, group, broken: false };
        hit.addEventListener('click', () => toggleEdge(net, edge));
        net.edges.push(edge);
      });

      net.nodes.forEach((node, id) => {
        const el = node.el;
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${node.name}: seleccionar como origen o destino`);
        el.classList.add('topology-clickable');
        el.addEventListener('click', () => pick(net, id));
        el.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(net, id); }
        });
      });
      return net;
    };

    const starSvg = qs('[data-topology-view="star"] svg');
    const starNodeEls = qsa('.topology-node', starSvg);
    const starDefs = [
      { id: 'sw', name: 'el switch', x: 310, y: 210, el: starNodeEls[0], hub: true },
      { id: 'pc1', name: 'PC1', x: 110, y: 88, el: starNodeEls[1] },
      { id: 'pc2', name: 'PC2', x: 510, y: 88, el: starNodeEls[2] },
      { id: 'pc3', name: 'PC3', x: 90, y: 320, el: starNodeEls[3] },
      { id: 'pc4', name: 'PC4', x: 530, y: 320, el: starNodeEls[4] },
      { id: 'pc5', name: 'PC5', x: 310, y: 370, el: starNodeEls[5] }
    ];
    const star = makeNet('star', starDefs, ['pc1', 'pc2', 'pc3', 'pc4', 'pc5'].map((id) => ['sw', id]));

    const meshSvg = qs('[data-topology-view="mesh"] svg');
    const meshEls = qsa('.topology-dot circle', meshSvg);
    const meshDefs = [
      { id: 'n1', name: 'N1', x: 310, y: 55, el: meshEls[0] },
      { id: 'n2', name: 'N2', x: 105, y: 170, el: meshEls[1] },
      { id: 'n3', name: 'N3', x: 515, y: 170, el: meshEls[2] },
      { id: 'n4', name: 'N4', x: 180, y: 360, el: meshEls[3] },
      { id: 'n5', name: 'N5', x: 440, y: 360, el: meshEls[4] }
    ];
    const meshPairs = [];
    for (let i = 0; i < meshDefs.length; i += 1) for (let j = i + 1; j < meshDefs.length; j += 1) meshPairs.push([meshDefs[i].id, meshDefs[j].id]);
    const mesh = makeNet('mesh', meshDefs, meshPairs);

    let current = star;
    let lastInteraction = 0;

    const edgeBetween = (net, a, b) => net.edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));

    const findPath = (net, from, to) => {
      if (net.failed.has(from) || net.failed.has(to)) return null;
      const queue = [[from]];
      const seen = new Set([from]);
      while (queue.length) {
        const path = queue.shift();
        const last = path[path.length - 1];
        if (last === to) return path;
        net.edges.forEach((edge) => {
          if (edge.broken) return;
          const next = edge.a === last ? edge.b : edge.b === last ? edge.a : null;
          if (!next || seen.has(next) || net.failed.has(next)) return;
          seen.add(next);
          queue.push([...path, next]);
        });
      }
      return null;
    };

    const clearToken = (net) => {
      cancelAnimationFrame(net.anim);
      net.token?.remove();
      net.token = null;
      net.edges.forEach((edge) => edge.group.classList.remove('is-active'));
    };

    const travel = (net, path, onDone) => {
      clearToken(net);
      const points = path.map((id) => net.nodes.get(id));
      const token = document.createElementNS(NS, 'circle');
      token.setAttribute('r', '7');
      token.setAttribute('class', 'topology-token');
      token.setAttribute('cx', points[0].x);
      token.setAttribute('cy', points[0].y);
      net.tokens.appendChild(token);
      net.token = token;

      const segments = [];
      for (let i = 0; i < points.length - 1; i += 1) {
        const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        segments.push({ from: points[i], to: points[i + 1], len, a: path[i], b: path[i + 1] });
      }
      const total = segments.reduce((sum, s) => sum + s.len, 0);
      const duration = reduceMotion ? 300 : Math.max(900, (total / 330) * 1000);
      const t0 = performance.now();
      let lastActive = -1;

      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        let dist = eased * total;
        let index = 0;
        while (index < segments.length - 1 && dist > segments[index].len) { dist -= segments[index].len; index += 1; }
        const seg = segments[index];
        const k = seg.len ? dist / seg.len : 1;
        token.setAttribute('cx', seg.from.x + (seg.to.x - seg.from.x) * k);
        token.setAttribute('cy', seg.from.y + (seg.to.y - seg.from.y) * k);
        if (index !== lastActive) {
          lastActive = index;
          net.edges.forEach((edge) => edge.group.classList.remove('is-active'));
          edgeBetween(net, seg.a, seg.b)?.group.classList.add('is-active');
        }
        if (t < 1) net.anim = requestAnimationFrame(step);
        else {
          token.classList.add('is-arrived');
          net.nodes.get(path[path.length - 1]).el.classList.add('is-arrived');
          window.setTimeout(() => {
            net.nodes.get(path[path.length - 1]).el.classList.remove('is-arrived');
            if (net.token === token) clearToken(net);
          }, 520);
          onDone?.();
        }
      };
      net.anim = requestAnimationFrame(step);
    };

    const setSelected = (net, id) => {
      net.nodes.forEach((node) => node.el.classList.toggle('is-selected', node.id === id));
      net.selected = id;
    };

    const isEndpoint = (net, id) => !net.nodes.get(id).hub;

    const send = (net, from, to, { announce = true } = {}) => {
      const A = net.nodes.get(from);
      const B = net.nodes.get(to);
      const path = findPath(net, from, to);
      if (!path) {
        clearToken(net);
        const reason = net.key === 'star' && net.failed.has('sw')
          ? 'El switch está caído: en una topología en estrella es un punto único de falla y toda la red se queda sin comunicación.'
          : `No existe una ruta disponible entre ${A.name} y ${B.name}.`;
        setStatus(reason);
        net.nodes.get(from).el.classList.add('is-shake');
        window.setTimeout(() => net.nodes.get(from).el.classList.remove('is-shake'), 520);
        return false;
      }
      if (announce) {
        const hops = path.slice(1, -1).map((id) => net.nodes.get(id).name);
        const via = hops.length ? ` pasando por ${hops.join(' → ')}` : ' por un enlace directo';
        setStatus(`Paquete ${A.name} → ${B.name}${via} (${path.length - 1} ${path.length - 1 === 1 ? 'salto' : 'saltos'}).`);
      }
      travel(net, path);
      return true;
    };

    function pick(net, id) {
      lastInteraction = performance.now();
      if (!isEndpoint(net, id)) { setStatus('El switch es el nodo central. Elige un PC como origen y otro como destino.'); return; }
      if (net.selected === null) {
        setSelected(net, id);
        setStatus(`Origen: ${net.nodes.get(id).name}. Ahora elige el destino.`);
      } else if (net.selected === id) {
        setSelected(net, null);
        setStatus('Selección cancelada. Elige un equipo de origen.');
      } else {
        const from = net.selected;
        setSelected(net, null);
        send(net, from, id);
      }
    }

    function toggleEdge(net, edge) {
      lastInteraction = performance.now();
      edge.broken = !edge.broken;
      edge.group.classList.toggle('is-broken', edge.broken);
      clearToken(net);
      const A = net.nodes.get(edge.a);
      const B = net.nodes.get(edge.b);
      if (edge.broken) {
        setStatus(net.key === 'mesh'
          ? `Enlace ${A.name}–${B.name} cortado. La malla sigue funcionando: los paquetes se reencaminan por otros nodos.`
          : `Enlace ${B.name} cortado: ese equipo queda aislado del resto de la red.`);
      } else setStatus('Enlace reparado.');
    }

    const randomPair = (net) => {
      const ids = [...net.nodes.values()].filter((n) => !n.hub).map((n) => n.id);
      const from = ids[Math.floor(Math.random() * ids.length)];
      let to = from;
      while (to === from) to = ids[Math.floor(Math.random() * ids.length)];
      return [from, to];
    };

    const reset = (net) => {
      clearToken(net);
      net.failed.clear();
      net.edges.forEach((edge) => { edge.broken = false; edge.group.classList.remove('is-broken'); });
      net.nodes.forEach((node) => node.el.classList.remove('is-failed', 'is-selected'));
      net.selected = null;
      failBtn?.setAttribute('aria-pressed', 'false');
      failBtn?.classList.remove('is-active');
    };

    sendBtn?.addEventListener('click', () => {
      lastInteraction = performance.now();
      setSelected(current, null);
      const [a, b] = randomPair(current);
      send(current, a, b);
    });

    failBtn?.addEventListener('click', () => {
      lastInteraction = performance.now();
      clearToken(current);
      setSelected(current, null);
      if (current.key === 'star') {
        const down = !current.failed.has('sw');
        if (down) current.failed.add('sw'); else current.failed.delete('sw');
        current.nodes.get('sw').el.classList.toggle('is-failed', down);
        failBtn.setAttribute('aria-pressed', String(down));
        failBtn.classList.toggle('is-active', down);
        setStatus(down
          ? 'Switch caído. Prueba a enviar un paquete: en la estrella no hay ruta alternativa.'
          : 'Switch restablecido. La red vuelve a comunicarse.');
        if (down) { const [a, b] = randomPair(current); send(current, a, b); }
      } else {
        current.edges.forEach((edge) => { edge.broken = false; edge.group.classList.remove('is-broken'); });
        const [a, b] = randomPair(current);
        const direct = edgeBetween(current, a, b);
        direct.broken = true;
        direct.group.classList.add('is-broken');
        window.setTimeout(() => send(current, a, b), 250);
        setStatus(`Se cortó el enlace directo ${current.nodes.get(a).name}–${current.nodes.get(b).name}…`);
      }
    });

    resetBtn?.addEventListener('click', () => {
      lastInteraction = performance.now();
      reset(current);
      setStatus('Topología restablecida. Haz clic en un equipo de origen y luego en uno de destino.');
    });

    qsa('[data-topology-button]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.topologyButton;
      reset(current);
      current = key === 'mesh' ? mesh : star;
      if (failBtn) failBtn.textContent = key === 'mesh' ? 'Cortar un enlace' : 'Simular fallo';
      setStatus(key === 'mesh'
        ? 'Haz clic en dos nodos para enviar un paquete, o en un enlace para cortarlo y ver cómo se reencamina.'
        : 'Haz clic en un equipo de origen y luego en uno de destino. También puedes cortar un enlace.');
      replay(qs('.topology-copy', current.view), { stagger: false });
      replay(current.view.querySelector('svg'), { stagger: false });
    }));

    // Demostración automática mientras la sección es visible y nadie interactúa
    if (!reduceMotion && 'IntersectionObserver' in window) {
      let visible = false;
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.3 }).observe(topoRoot);
      window.setInterval(() => {
        if (!visible || document.hidden || current.token || current.selected) return;
        if (performance.now() - lastInteraction < 6000) return;
        if (current.failed.size || current.edges.some((e) => e.broken)) return;
        const [a, b] = randomPair(current);
        if (findPath(current, a, b)) travel(current, findPath(current, a, b));
      }, 2600);
    }
  }

  /* ==============================
     Comparador de medios: barras relativas
  ================================ */
  const barsRoot = qs('[data-media-bars]');
  if (barsRoot) {
    const media = [
      { key: 'utp', label: 'UTP' },
      { key: 'fiber', label: 'Fibra' },
      { key: 'wireless', label: 'Inalámbrico' }
    ];
    const metrics = [
      { label: 'Velocidad', values: { utp: 55, fiber: 100, wireless: 45 } },
      { label: 'Alcance', values: { utp: 20, fiber: 100, wireless: 25 } },
      { label: 'Resistencia a EMI', values: { utp: 35, fiber: 100, wireless: 15 } },
      { label: 'Movilidad', values: { utp: 0, fiber: 0, wireless: 100 } },
      { label: 'Economía', values: { utp: 90, fiber: 25, wireless: 60 } }
    ];
    const heading = document.createElement('p');
    heading.className = 'media-bars__note';
    heading.textContent = 'Comparación relativa e ilustrativa, derivada de las características del material.';
    barsRoot.appendChild(heading);
    const legend = document.createElement('div');
    legend.className = 'media-bars__legend';
    media.forEach((m) => {
      const item = document.createElement('span');
      item.dataset.medium = m.key;
      item.textContent = m.label;
      legend.appendChild(item);
    });
    barsRoot.appendChild(legend);
    const grid = document.createElement('div');
    grid.className = 'media-bars__grid';
    metrics.forEach((metric, mi) => {
      const row = document.createElement('div');
      row.className = 'media-bars__row';
      row.style.setProperty('--i', String(mi));
      const name = document.createElement('span');
      name.className = 'media-bars__name';
      name.textContent = metric.label;
      row.appendChild(name);
      const bars = document.createElement('div');
      bars.className = 'media-bars__bars';
      media.forEach((m) => {
        const track = document.createElement('div');
        track.className = 'media-bars__track';
        track.dataset.medium = m.key;
        const fill = document.createElement('i');
        fill.style.setProperty('--v', String(metric.values[m.key] / 100));
        track.title = `${m.label}: ${metric.values[m.key]}%`;
        track.append(fill);
        bars.appendChild(track);
      });
      row.appendChild(bars);
      grid.appendChild(row);
    });
    barsRoot.appendChild(grid);

    const syncRecommended = () => {
      const rec = qs('.medium-profile.is-recommended')?.dataset.medium;
      barsRoot.dataset.recommended = rec || '';
    };
    qsa('[data-scenario]').forEach((button) => button.addEventListener('click', syncRecommended));
    syncRecommended();

    if (reduceMotion || !('IntersectionObserver' in window)) barsRoot.classList.add('is-in');
    else {
      new IntersectionObserver(([entry], observer) => {
        if (entry.isIntersecting) { barsRoot.classList.add('is-in'); observer.disconnect(); }
      }, { threshold: 0.25 }).observe(barsRoot);
    }
  }

  /* ==============================
     Constructor T568A / T568B con práctica
  ================================ */
  const pinRoot = qs('[data-pin-list]');
  if (pinRoot && data?.pinouts) {
    const ol = qs('ol', pinRoot);
    const standardTitle = qs('[data-standard-title]');
    const pinButtons = qsa('[data-pin-standard]');
    const modeBtn = qs('[data-pin-mode]');
    const checkBtn = qs('[data-pin-check]');
    const solveBtn = qs('[data-pin-solve]');
    const msg = qs('[data-pin-msg]');

    const familyOf = (label) => {
      const parts = label.split('/');
      const base = (parts[1] || parts[0]).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      return { family: base, striped: parts.length > 1 };
    };

    let standard = 'b';
    let order = [...data.pinouts.b];
    let practice = false;
    let selectedLabel = null;
    const items = new Map();

    const makeItem = (label) => {
      const li = document.createElement('li');
      li.dataset.pin = '';
      li.dataset.wire = label;
      const { family, striped } = familyOf(label);
      li.dataset.family = family;
      li.dataset.striped = String(striped);
      li.dataset.pattern = '1';
      const visual = document.createElement('span');
      visual.className = 'pin-visual';
      const num = document.createElement('b');
      const name = document.createElement('span');
      name.dataset.pinLabel = '';
      name.textContent = label;
      li.append(visual, num, name);
      li.addEventListener('click', () => onPick(label));
      li.addEventListener('keydown', (event) => onKey(event, label));
      li.addEventListener('dragstart', (event) => { if (!practice) { event.preventDefault(); return; } event.dataTransfer.setData('text/plain', label); li.classList.add('is-dragging'); });
      li.addEventListener('dragend', () => li.classList.remove('is-dragging'));
      li.addEventListener('dragover', (event) => { if (practice) { event.preventDefault(); li.classList.add('is-drop'); } });
      li.addEventListener('dragleave', () => li.classList.remove('is-drop'));
      li.addEventListener('drop', (event) => {
        if (!practice) return;
        event.preventDefault();
        li.classList.remove('is-drop');
        swap(event.dataTransfer.getData('text/plain'), label);
      });
      items.set(label, li);
      return li;
    };

    const layout = (animate) => {
      const before = new Map();
      if (animate && !reduceMotion) items.forEach((li, label) => before.set(label, li.getBoundingClientRect()));
      order.forEach((label, index) => {
        const li = items.get(label);
        ol.appendChild(li);
        qs('b', li).textContent = String(index + 1);
      });
      if (!animate || reduceMotion) return;
      order.forEach((label, index) => {
        const li = items.get(label);
        const from = before.get(label);
        const to = li.getBoundingClientRect();
        const dx = from.left - to.left;
        if (!dx) return;
        li.style.transition = 'none';
        li.style.transform = `translateX(${dx}px)`;
        void li.offsetWidth;
        li.style.transition = `transform 560ms cubic-bezier(.2,.8,.2,1) ${index * 24}ms`;
        li.style.transform = '';
        li.addEventListener('transitionend', () => { li.style.transition = ''; }, { once: true });
      });
    };

    const setMsg = (text, kind = '') => {
      if (!msg) return;
      msg.hidden = !text;
      msg.textContent = text || '';
      msg.className = `pin-practice__msg ${kind ? `is-${kind}` : ''}`;
    };

    const clearMarks = () => items.forEach((li) => li.classList.remove('is-ok', 'is-wrong', 'is-selected'));

    function swap(a, b) {
      if (!a || !b || a === b) return;
      const i = order.indexOf(a);
      const j = order.indexOf(b);
      if (i < 0 || j < 0) return;
      [order[i], order[j]] = [order[j], order[i]];
      clearMarks();
      selectedLabel = null;
      layout(true);
      setMsg('');
    }

    function onPick(label) {
      if (!practice) return;
      if (selectedLabel === null) {
        selectedLabel = label;
        clearMarks();
        items.get(label).classList.add('is-selected');
      } else if (selectedLabel === label) {
        selectedLabel = null;
        items.get(label).classList.remove('is-selected');
      } else swap(selectedLabel, label);
    }

    function onKey(event, label) {
      if (!practice) return;
      const index = order.indexOf(label);
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPick(label); }
      else if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); swap(label, order[index - 1]); items.get(label).focus(); }
      else if (event.key === 'ArrowRight' && index < order.length - 1) { event.preventDefault(); swap(label, order[index + 1]); items.get(label).focus(); }
    }

    const shuffleOrder = () => {
      const target = data.pinouts[standard];
      let next;
      do {
        next = [...target];
        for (let i = next.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
      } while (next.every((label, i) => label === target[i]));
      order = next;
    };

    const setPractice = (on) => {
      practice = on;
      selectedLabel = null;
      clearMarks();
      pinRoot.classList.toggle('is-practice', on);
      modeBtn?.setAttribute('aria-pressed', String(on));
      if (modeBtn) modeBtn.textContent = on ? 'Salir de la práctica' : 'Practicar: ordena los hilos';
      if (checkBtn) checkBtn.hidden = !on;
      if (solveBtn) solveBtn.hidden = !on;
      items.forEach((li) => {
        li.draggable = on;
        if (on) li.tabIndex = 0; else li.removeAttribute('tabindex');
      });
      if (on) {
        shuffleOrder();
        layout(true);
        setMsg(`Ordena los hilos según ${standard === 'a' ? 'T568A' : 'T568B'}: arrastra, toca dos hilos para intercambiarlos o usa ← → con el teclado.`);
      } else {
        order = [...data.pinouts[standard]];
        layout(true);
        setMsg('');
      }
    };

    const render = (next) => {
      standard = next;
      if (standardTitle) standardTitle.textContent = next === 'a' ? 'T568A' : 'T568B';
      pinButtons.forEach((button) => {
        const active = button.dataset.pinStandard === next;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (practice) {
        clearMarks();
        setMsg(`Ahora el objetivo es ${next === 'a' ? 'T568A' : 'T568B'}. Reordena los hilos y pulsa Comprobar.`);
      } else {
        order = [...data.pinouts[next]];
        layout(true);
      }
    };

    // Se reemplaza el contenido estático por elementos con identidad propia
    ol.replaceChildren();
    [...new Set([...data.pinouts.a, ...data.pinouts.b])].forEach((label) => makeItem(label));
    layout(false);
    pinButtons.forEach((button) => button.addEventListener('click', () => render(button.dataset.pinStandard)));
    modeBtn?.addEventListener('click', () => setPractice(!practice));
    checkBtn?.addEventListener('click', () => {
      const target = data.pinouts[standard];
      let ok = 0;
      order.forEach((label, index) => {
        const good = label === target[index];
        if (good) ok += 1;
        const li = items.get(label);
        li.classList.remove('is-ok', 'is-wrong', 'is-selected');
        li.classList.add(good ? 'is-ok' : 'is-wrong');
      });
      selectedLabel = null;
      if (ok === target.length) setMsg('¡Perfecto! Los 8 hilos están en el orden correcto.', 'ok');
      else setMsg(`${ok} de ${target.length} hilos están en su posición. Revisa los marcados.`, 'bad');
    });
    solveBtn?.addEventListener('click', () => {
      order = [...data.pinouts[standard]];
      clearMarks();
      layout(true);
      setMsg(`Así queda ${standard === 'a' ? 'T568A' : 'T568B'}.`);
    });
  }

  /* ==============================
     Simulador de paquetes: token, velocidad y teclado
  ================================ */
  const route = qs('.packet-route');
  if (route && api?.packet) {
    const nodes = qsa('[data-packet-node]', route);
    const token = document.createElement('span');
    token.className = 'packet-token';
    token.setAttribute('aria-hidden', 'true');
    route.appendChild(token);
    const tags = ['Solicitud HTTP', 'Trama · MAC', 'Paquete · IP', 'Respuesta'];

    const place = (index, instant = false) => {
      const node = nodes[index];
      const icon = node && qs('svg', node);
      if (!icon) return;
      const r = route.getBoundingClientRect();
      const c = icon.getBoundingClientRect();
      if (instant) token.style.transition = 'none';
      token.style.transform = `translate(${c.left - r.left + c.width / 2}px, ${c.top - r.top + c.height / 2}px)`;
      token.dataset.label = tags[index] || '';
      if (instant) { void token.offsetWidth; token.style.transition = ''; }
      token.classList.add('is-ready');
    };

    document.addEventListener('netlab:packet', (event) => place(event.detail.index));
    window.addEventListener('resize', () => place(api.packet.index, true));
    window.addEventListener('load', () => place(api.packet.index, true));
    place(api.packet.index, true);

    nodes.forEach((node, index) => {
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `Ir al paso ${index + 1}: ${qs('b', node)?.textContent || ''}`);
      node.addEventListener('click', () => api.packet.go(index));
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); api.packet.go(index); }
      });
    });

    const speedGroup = qs('[data-packet-speed]');
    qsa('[data-speed]', speedGroup).forEach((button) => button.addEventListener('click', () => {
      const value = Number(button.dataset.speed);
      api.packet.setSpeed(value);
      route.style.setProperty('--packet-speed', String(1 / value));
      qsa('[data-speed]', speedGroup).forEach((b) => {
        const on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }));

    const sim = qs('.packet-simulator');
    sim?.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLButtonElement && event.key === ' ') return;
      if (event.key === 'ArrowRight') { event.preventDefault(); api.packet.go(api.packet.index + 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); api.packet.go(api.packet.index - 1); }
    });
  }

  /* ==============================
     Validador IPv4 + calculadora
  ================================ */
  const ipForm = qs('[data-ip-form]');
  if (ipForm) {
    const ipInput = qs('#host-ip', ipForm);
    const maskInput = qs('#host-mask', ipForm);
    const feedback = qs('[data-ip-feedback]', ipForm);
    const results = qs('[data-ip-results]', ipForm);
    const submitBtn = qs('button[type="submit"]', ipForm);
    const title = qs('[data-ip-title]');
    const intro = qs('[data-ip-intro]');
    const modeButtons = qsa('[data-ip-mode]');
    const EXPECTED = { ip: '192.168.10.30', mask: '255.255.255.0', prefix: 24, net: '192.168.10.0' };
    const KNOWN = { '192.168.10.10': 'PC1', '192.168.10.20': 'PC2', '192.168.10.30': 'PC3', '192.168.10.40': 'PC4', '192.168.10.50': 'PC5' };
    let mode = 'exercise';

    const toInt = (octets) => (((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0);
    const toDot = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    const prefixToMask = (p) => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);

    const parseIp = (raw) => {
      const text = raw.trim().replace(/\s+/g, '');
      if (!text) return { error: 'Escribe una dirección IP.' };
      const parts = text.split('.');
      if (parts.length !== 4) return { error: 'Una dirección IPv4 tiene 4 octetos separados por puntos, por ejemplo 192.168.10.30.' };
      const octets = [];
      for (const part of parts) {
        if (!/^\d{1,3}$/.test(part)) return { error: `«${part || 'vacío'}» no es un número válido. Cada octeto debe ser un entero de 0 a 255.` };
        if (part.length > 1 && part.startsWith('0')) return { error: `Evita ceros a la izquierda en «${part}»; escribe ${Number(part)}.` };
        const value = Number(part);
        if (value > 255) return { error: `El octeto ${value} es mayor que 255.` };
        octets.push(value);
      }
      return { value: toInt(octets), text: octets.join('.') };
    };

    const parseMask = (raw) => {
      const text = raw.trim().replace(/\s+/g, '');
      if (!text) return { error: 'Escribe la máscara de subred.' };
      if (/^\/?\d{1,2}$/.test(text)) {
        const prefix = Number(text.replace('/', ''));
        if (prefix > 32) return { error: 'El prefijo CIDR debe estar entre /0 y /32.' };
        return { prefix, value: prefixToMask(prefix), text: toDot(prefixToMask(prefix)) };
      }
      const ip = parseIp(text);
      if (ip.error) return { error: ip.error.replace('dirección IP', 'máscara').replace('Una dirección IPv4', 'Una máscara') };
      const bin = ip.value.toString(2).padStart(32, '0');
      if (!/^1*0*$/.test(bin)) return { error: `La máscara ${ip.text} no es válida: debe tener unos continuos seguidos de ceros (por ejemplo 255.255.255.0).` };
      const prefix = bin.indexOf('0') === -1 ? 32 : bin.indexOf('0');
      return { prefix, value: ip.value, text: ip.text };
    };

    const classify = (n) => {
      const first = n >>> 24;
      const cls = first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D (multicast)' : 'E (reservada)';
      let kind = 'Pública';
      if (first === 10 || (first === 172 && ((n >>> 16) & 255) >= 16 && ((n >>> 16) & 255) <= 31) || (first === 192 && ((n >>> 16) & 255) === 168)) kind = 'Privada (RFC 1918)';
      else if (first === 127) kind = 'Loopback';
      else if (first === 169 && ((n >>> 16) & 255) === 254) kind = 'APIPA (link-local)';
      return { cls, kind };
    };

    const bitsRow = (value, prefix) => {
      const frag = document.createDocumentFragment();
      const bin = value.toString(2).padStart(32, '0');
      for (let o = 0; o < 4; o += 1) {
        const group = document.createElement('span');
        group.className = 'bits__octet';
        for (let b = 0; b < 8; b += 1) {
          const idx = o * 8 + b;
          const bit = document.createElement('i');
          bit.className = idx < prefix ? 'is-net' : 'is-host';
          bit.textContent = bin[idx];
          group.appendChild(bit);
        }
        frag.appendChild(group);
      }
      return frag;
    };

    const calc = (ip, mask) => {
      const network = (ip.value & mask.value) >>> 0;
      const broadcast = (network | (~mask.value >>> 0)) >>> 0;
      const p = mask.prefix;
      let first = (network + 1) >>> 0;
      let last = (broadcast - 1) >>> 0;
      let hosts = Math.pow(2, 32 - p) - 2;
      if (p === 31) { first = network; last = broadcast; hosts = 2; }
      if (p === 32) { first = last = network; hosts = 1; }
      const role = ip.value === network && p < 31 ? 'Es la dirección de red (no se asigna a un host)'
        : ip.value === broadcast && p < 31 ? 'Es la dirección de broadcast (no se asigna a un host)'
          : 'Es una dirección de host válida';
      return { network, broadcast, first, last, hosts, role, ...classify(ip.value) };
    };

    const row = (label, value, { wide = false, count = false, node = null } = {}, i = 0) => {
      const div = document.createElement('div');
      div.style.setProperty('--i', String(i));
      if (wide) div.className = 'is-wide';
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      if (node) dd.appendChild(node);
      else dd.textContent = value;
      if (count) dd.dataset.count = String(value);
      div.append(dt, dd);
      return div;
    };

    const showResults = (ip, mask) => {
      const r = calc(ip, mask);
      results.replaceChildren();
      const bitsIp = document.createElement('span'); bitsIp.className = 'bits'; bitsIp.appendChild(bitsRow(ip.value, mask.prefix));
      const bitsMask = document.createElement('span'); bitsMask.className = 'bits'; bitsMask.appendChild(bitsRow(mask.value, mask.prefix));
      const rows = [
        row('Dirección de red', `${toDot(r.network)}/${mask.prefix}`),
        row('Broadcast', toDot(r.broadcast)),
        row('Primer host', toDot(r.first)),
        row('Último host', toDot(r.last)),
        row('Hosts útiles', r.hosts, { count: true }),
        row('Máscara', `${mask.text} (/${mask.prefix})`),
        row('Clase / tipo', `Clase ${r.cls} · ${r.kind}`),
        row('Esta dirección', r.role),
        row('IP en binario', '', { wide: true, node: bitsIp }),
        row('Máscara en binario', '', { wide: true, node: bitsMask })
      ];
      rows.forEach((node, i) => { node.style.setProperty('--i', String(i)); results.appendChild(node); });
      results.hidden = false;
      results.classList.remove('anim-swap'); void results.offsetWidth; results.classList.add('anim-swap');
      const hostsEl = qs('[data-count]', results);
      if (hostsEl) countUp(hostsEl, Number(hostsEl.dataset.count), { duration: 700 });
    };

    const setFeedback = (text, ok) => {
      feedback.hidden = !text;
      feedback.textContent = text || '';
      feedback.className = `form-feedback ${ok === undefined ? '' : ok ? 'is-correct' : 'is-incorrect'}`;
      if (text) { feedback.classList.remove('anim-swap'); void feedback.offsetWidth; feedback.classList.add('anim-swap'); }
    };

    const clearAll = () => { setFeedback(''); results.hidden = true; results.replaceChildren(); ipInput.classList.remove('is-invalid'); maskInput.classList.remove('is-invalid'); };

    const diagnose = (ip, mask) => {
      const sameNet = (ip.value & mask.value) >>> 0;
      const problems = [];
      if (ip.text !== EXPECTED.ip) {
        const known = KNOWN[ip.text];
        if (known) problems.push(`Esa IP (${ip.text}) pertenece a ${known}. Para PC3 el taller usa ${EXPECTED.ip}.`);
        else if (toDot(ip.value & prefixToMask(24)) !== EXPECTED.net) problems.push(`${ip.text} no pertenece a la red ${EXPECTED.net}/24 del taller.`);
        else if ((ip.value & 255) === 0) problems.push(`${ip.text} es la dirección de red; no puede asignarse a un equipo.`);
        else if ((ip.value & 255) === 255) problems.push(`${ip.text} es la dirección de broadcast; no puede asignarse a un equipo.`);
        else problems.push(`${ip.text} es válida en la red del taller, pero PC3 usa ${EXPECTED.ip}.`);
      }
      if (mask.text !== EXPECTED.mask) {
        problems.push(mask.prefix === EXPECTED.prefix ? '' : `Con la máscara ${mask.text} (/${mask.prefix}) la red sería ${toDot(sameNet)}/${mask.prefix}; el taller usa ${EXPECTED.mask} (/24).`);
      }
      return problems.filter(Boolean).join(' ');
    };

    const evaluate = () => {
      const ip = parseIp(ipInput.value);
      const mask = parseMask(maskInput.value);
      ipInput.classList.toggle('is-invalid', Boolean(ip.error));
      maskInput.classList.toggle('is-invalid', Boolean(mask.error));
      if (ip.error || mask.error) {
        results.hidden = true;
        setFeedback(ip.error || mask.error, false);
        (ip.error ? ipInput : maskInput).focus();
        return;
      }
      if (mode === 'calc') {
        setFeedback(`${ip.text}/${mask.prefix}: resultados del cálculo.`, true);
        showResults(ip, mask);
        return;
      }
      const message = diagnose(ip, mask);
      if (!message) {
        setFeedback('Configuración correcta para PC3. Pertenece a la red 192.168.10.0/24 usada en el taller de cinco equipos.', true);
        showResults(ip, mask);
      } else {
        results.hidden = true;
        setFeedback(message, false);
      }
    };

    ipForm.addEventListener('submit', (event) => { event.preventDefault(); evaluate(); }, true);
    ipForm.addEventListener('reset', () => window.setTimeout(clearAll, 0));
    [ipInput, maskInput].forEach((input) => input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      if (mode !== 'calc') return;
      const ip = parseIp(ipInput.value);
      const mask = parseMask(maskInput.value);
      if (!ip.error && !mask.error) { setFeedback(`${ip.text}/${mask.prefix}: resultados del cálculo.`, true); showResults(ip, mask); }
    }));

    const setMode = (next) => {
      mode = next;
      modeButtons.forEach((b) => {
        const on = b.dataset.ipMode === next;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const calcMode = next === 'calc';
      if (title) title.textContent = calcMode ? 'Calculadora de subredes' : 'Configura PC3';
      if (intro) intro.textContent = calcMode
        ? 'Escribe cualquier IP y máscara (255.255.255.0 o /24) para obtener red, broadcast, rango de hosts y su representación binaria.'
        : 'Completa los datos exactamente como aparecen en el taller y comprueba la configuración.';
      ipInput.placeholder = calcMode ? '192.168.1.25' : '192.168.10.30';
      maskInput.placeholder = calcMode ? '255.255.255.0 o /24' : '255.255.255.0';
      if (submitBtn) submitBtn.textContent = calcMode ? 'Calcular' : 'Comprobar';
      ipForm.reset();
      clearAll();
    };
    modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.ipMode)));
  }

  /* ==============================
     Laboratorio: progreso, teclado, enlace directo y memoria
  ================================ */
  const labBench = qs('.lab-workbench');
  if (labBench && api?.lab) {
    const bar = qs('[data-lab-progress]');
    const stepButtons = qsa('[data-lab-step]');
    let ready = false;

    const paint = (index, total) => {
      if (bar) bar.style.transform = `scaleX(${(index + 1) / total})`;
      stepButtons.forEach((button, i) => button.classList.toggle('is-done', i < index));
      if (ready) {
        store.set('lab-step', index);
        try { window.history.replaceState(null, '', `#laboratorio-paso-${index + 1}`); } catch (e) { /* file:// */ }
      }
    };
    document.addEventListener('netlab:lab', (event) => paint(event.detail.index, event.detail.total));

    const match = /^#laboratorio-paso-(\d+)$/.exec(window.location.hash);
    const total = data?.labSteps?.length || stepButtons.length;
    if (match && Number(match[1]) >= 1 && Number(match[1]) <= total) {
      api.lab.go(Number(match[1]) - 1);
      window.setTimeout(() => qs('#laboratorio')?.scrollIntoView({ block: 'start' }), 120);
    } else {
      const saved = store.get('lab-step', 0);
      if (Number.isInteger(saved) && saved > 0 && saved < total) api.lab.go(saved);
      else paint(0, total);
    }
    ready = true;

    labBench.addEventListener('keydown', (event) => {
      if (isTyping(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); api.lab.go(api.lab.index + 1); }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); api.lab.go(api.lab.index - 1); }
    });
  }
})();
