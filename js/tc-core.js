/* ==============================
   NETLAB · Tercer corte — núcleo
   Utilidades compartidas, motor de diagramas de red (NetViz) y evidencias.
================================ */
(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? Math.min(ms, 40) : ms));

  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const svgEl = (tag, attrs = {}, parent) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (parent) parent.appendChild(node);
    return node;
  };
  const setActive = (buttons, active, attr = 'aria-pressed') => {
    buttons.forEach((button) => {
      const on = button === active;
      button.classList.toggle('is-active', on);
      button.setAttribute(attr, String(on));
    });
  };
  const replay = (nodes, stagger = true) => {
    (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean).forEach((node, index) => {
      if (stagger) node.style.setProperty('--i', String(index));
      node.classList.remove('anim-swap');
      void node.offsetWidth;
      node.classList.add('anim-swap');
    });
  };
  /** Ejecuta fn cuando el elemento entra en pantalla por primera vez (o de inmediato sin IntersectionObserver). */
  const whenVisible = (node, fn, threshold = 0.25) => {
    if (!node) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    new IntersectionObserver(([entry], observer) => {
      if (entry.isIntersecting) { observer.disconnect(); fn(); }
    }, { threshold }).observe(node);
  };
  /** Activa/pausa un bucle según la visibilidad del elemento. */
  const whileVisible = (node, start, stop) => {
    if (!node || !('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(node);
  };
  const typeLines = async (target, lines, { delay = 38, token } = {}) => {
    target.textContent = '';
    for (const line of lines) {
      if (token && token.cancelled) return;
      target.textContent += `${line}\n`;
      await wait(delay);
    }
  };
  const countTo = (node, to, { duration = 600, suffix = '' } = {}) => {
    if (reduceMotion) { node.textContent = `${to}${suffix}`; return; }
    const from = Number(String(node.textContent).replace(/\D/g, '')) || 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      node.textContent = `${Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ==============================
     NetViz: diagramas de red SVG con paquetes animados
  ================================ */
  const drawIcon = (type, g) => {
    if (type === 'pc') {
      svgEl('rect', { x: -17, y: -17, width: 34, height: 23, rx: 3, class: 'nv-body' }, g);
      svgEl('rect', { x: -13, y: -13, width: 26, height: 15, rx: 1.5, class: 'nv-screen' }, g);
      svgEl('rect', { x: -4, y: 6, width: 8, height: 5, class: 'nv-body' }, g);
      svgEl('rect', { x: -11, y: 11, width: 22, height: 3.5, rx: 1.75, class: 'nv-body' }, g);
    } else if (type === 'router') {
      svgEl('circle', { r: 20, class: 'nv-body' }, g);
      svgEl('circle', { r: 15.5, class: 'nv-screen' }, g);
      svgEl('path', { d: 'M-10 0H10M6 -4l4 4-4 4M-6 -4l-4 4 4 4M0 -10V10M-4 -6l4 -4 4 4M-4 6l4 4 4-4', class: 'nv-glyph' }, g);
    } else if (type === 'switch') {
      svgEl('rect', { x: -25, y: -13, width: 50, height: 26, rx: 4, class: 'nv-body' }, g);
      svgEl('rect', { x: -21, y: -9, width: 42, height: 18, rx: 2, class: 'nv-screen' }, g);
      svgEl('path', { d: 'M-14 -3H14M10 -6l4 3-4 3M14 3H-14M-10 0l-4 3 4 3', class: 'nv-glyph' }, g);
    } else if (type === 'server') {
      svgEl('rect', { x: -14, y: -19, width: 28, height: 38, rx: 3, class: 'nv-body' }, g);
      [-12, -3, 6].forEach((y) => {
        svgEl('rect', { x: -10, y, width: 20, height: 6, rx: 1.5, class: 'nv-screen' }, g);
        svgEl('circle', { cx: 6, cy: y + 3, r: 1.1, class: 'nv-led' }, g);
      });
    }
  };

  const createNet = (container, spec) => {
    const W = spec.width || 640;
    const H = spec.height || 240;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': spec.label || 'Diagrama de red', class: 'nv-svg' });
    container.replaceChildren(svg);
    container.classList.add('netviz');
    const gZones = svgEl('g', { class: 'nv-zones' }, svg);
    const gLinks = svgEl('g', { class: 'nv-links' }, svg);
    const gNodes = svgEl('g', { class: 'nv-nodes' }, svg);
    const gTokens = svgEl('g', { class: 'nv-tokens' }, svg);

    (spec.zones || []).forEach((zone) => {
      svgEl('rect', { x: zone.x, y: zone.y, width: zone.w, height: zone.h, rx: 14, class: 'nv-zone' }, gZones);
      const t = svgEl('text', { x: zone.x + 14, y: zone.y + 20, class: 'nv-zone-label' }, gZones);
      t.textContent = zone.label;
    });

    const nodes = new Map();
    const links = [];
    spec.nodes.forEach((n) => {
      const g = svgEl('g', { class: `nv-node nv-node--${n.type}`, transform: `translate(${n.x} ${n.y})`, 'data-id': n.id }, gNodes);
      svgEl('circle', { r: 30, class: 'nv-halo' }, g);
      drawIcon(n.type, g);
      const label = svgEl('text', { y: n.type === 'pc' ? 31 : 36, class: 'nv-label', 'text-anchor': 'middle' }, g);
      label.textContent = n.label;
      let subEl = null;
      if (n.sub) {
        subEl = svgEl('text', { y: n.type === 'pc' ? 44 : 49, class: 'nv-sub', 'text-anchor': 'middle' }, g);
        subEl.textContent = n.sub;
      }
      nodes.set(n.id, { ...n, g, subEl });
    });
    (spec.links || []).forEach(([a, b, opts = {}]) => {
      const A = nodes.get(a);
      const B = nodes.get(b);
      const group = svgEl('g', { class: 'nv-link' }, gLinks);
      svgEl('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'nv-wire' }, group);
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      svgEl('text', { x: mx, y: my + 5, class: 'nv-x', 'text-anchor': 'middle' }, group).textContent = '✕';
      if (opts.mid) {
        const mt = svgEl('text', { x: mx, y: my - 7, class: 'nv-mid', 'text-anchor': 'middle' }, group);
        mt.textContent = opts.mid;
      }
      ['a', 'b'].forEach((side, i) => {
        if (!opts[side]) return;
        const P = i === 0 ? A : B;
        const Q = i === 0 ? B : A;
        const len = Math.hypot(Q.x - P.x, Q.y - P.y) || 1;
        const ux = (Q.x - P.x) / len;
        const uy = (Q.y - P.y) / len;
        // Etiqueta de puerto: a lo largo del enlace y desplazada hacia un lado para no pisar las IP
        const px = P.x + ux * 52 + -uy * 15;
        const py = P.y + uy * 52 + ux * 15;
        const t = svgEl('text', { x: px, y: py + 3, class: 'nv-port', 'text-anchor': 'middle' }, group);
        t.textContent = opts[side];
      });
      links.push({ a, b, group, state: 'up' });
    });

    let run = 0;
    const net = { svg, nodes, links, container };

    const link = (a, b) => links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
    net.setLink = (a, b, state) => {
      const l = link(a, b);
      if (!l) return;
      l.state = state;
      l.group.classList.toggle('is-down', state === 'down');
      l.group.classList.toggle('is-warn', state === 'warn');
    };
    net.setNode = (id, state) => {
      const n = nodes.get(id);
      if (!n) return;
      n.g.classList.remove('is-bad', 'is-warn', 'is-ok', 'is-active');
      if (state) n.g.classList.add(`is-${state}`);
    };
    net.clearStates = () => {
      links.forEach((l) => { l.state = 'up'; l.group.classList.remove('is-down', 'is-warn'); });
      nodes.forEach((n) => n.g.classList.remove('is-bad', 'is-warn', 'is-ok', 'is-active'));
    };
    net.setSub = (id, text) => { const n = nodes.get(id); if (n && n.subEl) n.subEl.textContent = text; };
    net.pulse = (id, cls = 'is-active', ms = 900) => {
      const n = nodes.get(id);
      if (!n) return;
      n.g.classList.add(cls);
      window.setTimeout(() => n.g.classList.remove(cls), ms);
    };
    net.cancel = () => { run += 1; gTokens.replaceChildren(); };

    /** Anima un paquete por una lista de nodos. Devuelve true si llega al final. */
    net.send = async (path, opts = {}) => {
      const myRun = ++run;
      gTokens.replaceChildren();
      const color = opts.color || 'blue';
      const token = svgEl('g', { class: `nv-token nv-token--${color}` }, gTokens);
      svgEl('circle', { r: 11, class: 'nv-token__glow' }, token);
      svgEl('circle', { r: 5.5, class: 'nv-token__dot' }, token);
      const tagBg = svgEl('rect', { x: -26, y: -30, width: 52, height: 16, rx: 8, class: 'nv-token__tag' }, token);
      const tag = svgEl('text', { y: -18.5, 'text-anchor': 'middle', class: 'nv-token__text' }, token);
      const setLabel = (text) => {
        tag.textContent = text || '';
        const w = Math.max(26, String(text || '').length * 6.2 + 14);
        tagBg.setAttribute('width', w);
        tagBg.setAttribute('x', -w / 2);
        token.classList.toggle('has-label', Boolean(text));
      };
      setLabel(opts.label);
      const first = nodes.get(path[0]);
      token.setAttribute('transform', `translate(${first.x} ${first.y})`);
      const handle = { setLabel, setColor: (c) => { token.setAttribute('class', `nv-token nv-token--${c} has-label`); } };
      if (opts.onHop) await opts.onHop(0, path[0], handle);
      if (myRun !== run) return false;
      for (let i = 1; i < path.length; i += 1) {
        const A = nodes.get(path[i - 1]);
        const B = nodes.get(path[i]);
        const l = link(path[i - 1], path[i]);
        if (l && l.state === 'down') {
          await animate(token, A, B, 0.55, opts.speed, () => myRun === run);
          if (myRun !== run) return false;
          net.pulse(path[i - 1], 'is-bad', 1400);
          token.classList.add('is-lost');
          if (opts.onHop) await opts.onHop(i, path[i - 1], handle, { blocked: true });
          await wait(700);
          return false;
        }
        await animate(token, A, B, 1, opts.speed, () => myRun === run);
        if (myRun !== run) return false;
        A.g.classList.remove('is-active');
        B.g.classList.add('is-active');
        window.setTimeout(() => B.g.classList.remove('is-active'), 900);
        if (opts.stopAt === i) {
          token.classList.add('is-lost');
          net.pulse(path[i], 'is-bad', 1600);
          if (opts.onHop) await opts.onHop(i, path[i], handle, { stopped: true });
          await wait(700);
          return false;
        }
        if (opts.onHop) await opts.onHop(i, path[i], handle);
        if (myRun !== run) return false;
      }
      token.classList.add('is-done');
      await wait(260);
      if (myRun === run) gTokens.replaceChildren();
      return true;
    };

    const animate = (token, A, B, fraction, speed = 300, alive = () => true) => new Promise((resolve) => {
      const dx = (B.x - A.x) * fraction;
      const dy = (B.y - A.y) * fraction;
      const len = Math.hypot(dx, dy);
      const duration = reduceMotion ? 30 : Math.max(320, Math.min(1100, (len / speed) * 1000));
      const start = performance.now();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const tick = (now) => {
        if (!alive()) { resolve(); return; }
        const t = Math.min(1, (now - start) / duration);
        const k = ease(t);
        token.setAttribute('transform', `translate(${A.x + dx * k} ${A.y + dy * k})`);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });

    return net;
  };

  /* ==============================
     Evidencias: figuras en línea, cuadrículas y galerías del visor
  ================================ */
  const figures = Array.isArray(window.TC_FIGURES) ? window.TC_FIGURES : [];
  const groups = {};
  figures.forEach((fig) => { (groups[fig.group] = groups[fig.group] || []).push(fig); });
  const indexOf = (fig) => groups[fig.group].indexOf(fig);

  const makeCard = (fig, className) => {
    const button = el('button', className);
    button.type = 'button';
    button.dataset.gallery = fig.group;
    button.dataset.galleryOpen = String(indexOf(fig));
    button.setAttribute('aria-label', `Ampliar: ${fig.title}`);
    const img = document.createElement('img');
    img.src = fig.src;
    img.alt = fig.alt;
    img.width = fig.w;
    img.height = fig.h;
    img.loading = 'lazy';
    img.decoding = 'async';
    button.append(img);
    return button;
  };

  qsa('[data-fig]').forEach((slot) => {
    const fig = figures.find((f) => f.key === slot.dataset.fig);
    if (!fig) return;
    slot.className = 'evidence evidence--inline';
    const open = makeCard(fig, 'evidence__open');
    open.append(el('span', 'evidence__zoom', 'Ampliar'));
    const caption = el('figcaption');
    caption.append(el('b', '', `${fig.title}. `), document.createTextNode(fig.cap));
    slot.append(open, caption);
  });

  qsa('[data-fig-grid]').forEach((grid) => {
    const key = grid.dataset.figGrid;
    const list = figures.filter((fig) => (key.includes('-') ? `${fig.group}-${fig.grid}` === key : fig.group === key));
    list.forEach((fig, i) => {
      const card = makeCard(fig, 'evidence-card');
      card.style.setProperty('--i', String(i % 4));
      card.append(el('span', '', fig.title));
      grid.appendChild(card);
    });
  });

  const registerGalleries = () => {
    if (!window.NETLAB_LIGHTBOX) return;
    Object.entries(groups).forEach(([name, list]) => window.NETLAB_LIGHTBOX.register(name, list.map((fig) => ({
      src: fig.src, w: fig.w, h: fig.h, title: fig.title, cap: fig.cap, alt: fig.alt
    }))));
  };
  registerGalleries();

  window.TC = { qs, qsa, el, svgEl, wait, reduceMotion, setActive, replay, whenVisible, whileVisible, typeLines, countTo, createNet, figures, groups };
})();
