/* ==============================
   Simulador de tabla MAC de un switch
   Aprendizaje de origen, unicast y flooding.
================================ */
(() => {
  'use strict';

  const root = document.querySelector('[data-mac-lab]');
  if (!root) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs = (selector, scope = root) => scope.querySelector(selector);

  const SWITCH = { x: 310, y: 88 };
  const pcs = {
    a: { name: 'PC-A', port: 'Fa0/1', mac: '00:1A:2B:3C:4D:0A', x: 80, y: 250 },
    b: { name: 'PC-B', port: 'Fa0/2', mac: '00:1A:2B:3C:4D:0B', x: 240, y: 270 },
    c: { name: 'PC-C', port: 'Fa0/3', mac: '00:1A:2B:3C:4D:0C', x: 380, y: 270 },
    d: { name: 'PC-D', port: 'Fa0/4', mac: '00:1A:2B:3C:4D:0D', x: 540, y: 250 }
  };

  const svg = qs('.mac-sim__svg');
  const linksG = qs('[data-mac-links]');
  const pcsG = qs('[data-mac-pcs]');
  const tokensG = qs('[data-mac-tokens]');
  const rowsEl = qs('[data-mac-rows]');
  const countEl = qs('[data-mac-count]');
  const statusEl = qs('[data-mac-status]');
  const srcSel = qs('[data-mac-src]');
  const dstSel = qs('[data-mac-dst]');
  const sendBtn = qs('[data-mac-send]');
  const resetBtn = qs('[data-mac-reset]');

  const table = new Map();
  let busy = false;

  const el = (name, attrs = {}, text) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  };

  Object.entries(pcs).forEach(([key, pc]) => {
    const line = el('line', { x1: SWITCH.x, y1: SWITCH.y, x2: pc.x, y2: pc.y - 28, class: 'mac-link' });
    linksG.appendChild(line);
    pc.line = line;
    const label = el('text', {
      x: (SWITCH.x + pc.x) / 2 + (pc.x < SWITCH.x ? -22 : 22),
      y: (SWITCH.y + pc.y - 28) / 2,
      class: 'mac-port'
    }, pc.port);
    linksG.appendChild(label);

    const group = el('g', { class: 'mac-pc', 'data-pc': key });
    group.appendChild(el('rect', { x: pc.x - 52, y: pc.y - 28, width: 104, height: 56, rx: 7 }));
    group.appendChild(el('text', { x: pc.x, y: pc.y - 4, class: 'mac-pc__name' }, pc.name));
    group.appendChild(el('text', { x: pc.x, y: pc.y + 14, class: 'mac-pc__mac' }, pc.mac.slice(-5)));
    const badge = el('text', { x: pc.x, y: pc.y - 36, class: 'mac-pc__badge' }, '');
    group.appendChild(badge);
    pcsG.appendChild(group);
    pc.el = group;
    pc.badge = badge;
  });

  const setBadge = (key, text, kind) => {
    const pc = pcs[key];
    pc.badge.textContent = text;
    pc.el.classList.remove('is-accept', 'is-drop');
    if (kind) pc.el.classList.add(kind);
  };
  const clearBadges = () => Object.keys(pcs).forEach((key) => setBadge(key, '', ''));

  const renderTable = (highlight) => {
    rowsEl.replaceChildren();
    if (!table.size) {
      const tr = document.createElement('tr');
      tr.className = 'is-empty';
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = 'Vacía: el switch todavía no conoce a nadie.';
      tr.appendChild(td);
      rowsEl.appendChild(tr);
    } else {
      table.forEach((key) => {
        const pc = pcs[key];
        const tr = document.createElement('tr');
        if (key === highlight) tr.className = 'is-new';
        const port = document.createElement('td');
        port.textContent = pc.port;
        const mac = document.createElement('td');
        mac.textContent = pc.mac;
        tr.append(port, mac);
        rowsEl.appendChild(tr);
      });
    }
    countEl.textContent = `${table.size} ${table.size === 1 ? 'entrada' : 'entradas'}`;
  };

  const status = (text) => { statusEl.textContent = text; statusEl.classList.remove('anim-swap'); void statusEl.offsetWidth; statusEl.classList.add('anim-swap'); };

  const move = (from, to, duration) => new Promise((resolve) => {
    const token = el('circle', { r: 8, class: 'mac-token', cx: from.x, cy: from.y });
    tokensG.appendChild(token);
    const total = reduceMotion ? 1 : duration;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / total);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      token.setAttribute('cx', from.x + (to.x - from.x) * e);
      token.setAttribute('cy', from.y + (to.y - from.y) * e);
      if (t < 1) requestAnimationFrame(step);
      else { token.remove(); resolve(); }
    };
    requestAnimationFrame(step);
  });

  const endpoint = (key) => ({ x: pcs[key].x, y: pcs[key].y - 28 });
  const flash = (key) => {
    pcs[key].line.classList.add('is-active');
    window.setTimeout(() => pcs[key].line.classList.remove('is-active'), 700);
  };

  const send = async () => {
    if (busy) return;
    const src = srcSel.value;
    const dst = dstSel.value;
    if (src === dst) { status('Origen y destino son el mismo equipo. Elige un destino distinto.'); return; }
    busy = true;
    sendBtn.disabled = true;
    clearBadges();
    const S = pcs[src];
    const D = pcs[dst];
    status(`${S.name} envía una trama con origen ${S.mac} y destino ${D.mac}.`);
    flash(src);
    await move(endpoint(src), SWITCH, 700);

    const isNew = !table.has(src) ? true : false;
    const known = table.has(dst);
    table.set(src, src);
    renderTable(isNew ? src : null);

    const learnedText = isNew
      ? `El switch aprende que ${S.mac} está en ${S.port} y lo guarda en su tabla. `
      : `La MAC de ${S.name} ya estaba en la tabla (${S.port}). `;

    if (known) {
      status(`${learnedText}Como conoce el destino (${D.port}), reenvía solo por ese puerto: unicast.`);
      flash(dst);
      await move(SWITCH, endpoint(dst), 700);
      setBadge(dst, 'acepta', 'is-accept');
    } else {
      const others = Object.keys(pcs).filter((key) => key !== src);
      status(`${learnedText}No conoce ${D.mac}, así que hace flooding: copia la trama por todos los puertos menos ${S.port}.`);
      others.forEach(flash);
      await Promise.all(others.map((key) => move(SWITCH, endpoint(key), 750)));
      others.forEach((key) => (key === dst ? setBadge(key, 'acepta', 'is-accept') : setBadge(key, 'descarta', 'is-drop')));
    }
    busy = false;
    sendBtn.disabled = false;
  };

  sendBtn.addEventListener('click', send);
  resetBtn.addEventListener('click', () => {
    if (busy) return;
    table.clear();
    clearBadges();
    renderTable(null);
    status('Tabla vaciada. El siguiente envío provocará flooding otra vez.');
  });

  // Evita elegir el mismo equipo como origen y destino de forma accidental
  srcSel.addEventListener('change', () => {
    if (srcSel.value === dstSel.value) {
      dstSel.value = Object.keys(pcs).find((key) => key !== srcSel.value);
    }
  });

  renderTable(null);
})();
