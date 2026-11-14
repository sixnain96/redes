/* ==============================
   NETLAB · Tercer corte — cálculo
   Laboratorio de bits, calculadora de subredes con AND animado y tabla de prefijos.
================================ */
(() => {
  'use strict';
  const { qs, qsa, el, wait, reduceMotion, setActive, replay, whenVisible, countTo } = window.TC;
  const IP = window.IPCALC;

  const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

  /* ==============================
     Laboratorio de bits
  ================================ */
  const lab = qs('[data-bitlab]');
  if (lab) {
    const octetsBox = qs('[data-bitlab-octets]', lab);
    const ipOut = qs('[data-bitlab-ip]', lab);
    const binOut = qs('[data-bitlab-bin]', lab);
    const splitOut = qs('[data-bitlab-split]', lab);
    const methodList = qs('[data-bitlab-method]', lab);
    const methodTitle = qs('[data-bitlab-method-title]', lab);
    const classOut = qs('[data-bitlab-class]', lab);
    const presetsBox = qs('[data-bitlab-presets]', lab);

    const state = { octets: [192, 168, 49, 149], selected: 3 };
    const cards = [];

    const presets = [
      ['192.168.49.149', 'N = 49'],
      ['192.168.78.178', 'N = 78'],
      ['10.0.0.2', 'privada'],
      ['8.8.8.8', 'pública'],
      ['127.0.0.1', 'loopback'],
      ['169.254.15.3', 'APIPA'],
      ['224.0.0.5', 'multicast OSPF']
    ];

    for (let i = 0; i < 4; i += 1) {
      const card = el('div', 'octet');
      card.dataset.index = String(i);
      const head = el('div', 'octet__head');
      head.append(el('span', '', `Octeto ${i + 1}`));
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '255';
      input.className = 'octet__num';
      input.setAttribute('aria-label', `Valor decimal del octeto ${i + 1}`);
      head.append(input);
      const bitsRow = el('div', 'octet__bits');
      const bits = WEIGHTS.map((weight) => {
        const cell = el('div', 'octet__cell');
        cell.append(el('small', '', String(weight)));
        const button = el('button', 'bit', '0');
        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Bit de peso ${weight} del octeto ${i + 1}`);
        cell.append(button);
        bitsRow.append(cell);
        return button;
      });
      card.append(head, bitsRow);
      octetsBox.append(card);
      cards.push({ card, input, bits });

      bits.forEach((button, b) => button.addEventListener('click', () => {
        state.octets[i] ^= WEIGHTS[b];
        state.selected = i;
        paint({ flip: [[i, b]] });
      }));
      input.addEventListener('input', () => {
        const n = Math.max(0, Math.min(255, parseInt(input.value, 10) || 0));
        state.octets[i] = n;
        state.selected = i;
        paint({ keepInput: i });
      });
      input.addEventListener('focus', () => { state.selected = i; paintMethod(); markSelected(); });
    }

    const markSelected = () => cards.forEach((c, i) => c.card.classList.toggle('is-selected', i === state.selected));

    const paintMethod = () => {
      const v = state.octets[state.selected];
      methodTitle.textContent = `Método de la resta · octeto ${state.selected + 1} (${v})`;
      methodList.replaceChildren();
      let rest = v;
      WEIGHTS.forEach((weight) => {
        const on = rest >= weight;
        const li = el('li', on ? 'is-on' : '');
        li.append(el('b', '', String(weight)));
        li.append(el('span', '', on ? `${rest} − ${weight} = ${rest - weight}` : `${rest} < ${weight}`));
        li.append(el('i', '', on ? '1' : '0'));
        if (on) rest -= weight;
        methodList.append(li);
      });
      replay([...methodList.children]);
    };

    const paint = ({ flip = [], keepInput = -1, stagger = false } = {}) => {
      state.octets.forEach((value, i) => {
        const { input, bits } = cards[i];
        if (keepInput !== i) input.value = String(value);
        bits.forEach((button, b) => {
          const on = Boolean(value & WEIGHTS[b]);
          const changed = button.textContent !== (on ? '1' : '0');
          button.textContent = on ? '1' : '0';
          button.setAttribute('aria-pressed', String(on));
          button.classList.toggle('is-on', on);
          if (changed && !reduceMotion) {
            button.classList.remove('is-flip');
            void button.offsetWidth;
            if (stagger) button.style.setProperty('--d', `${(i * 8 + b) * 14}ms`); else button.style.removeProperty('--d');
            button.classList.add('is-flip');
          }
        });
      });
      markSelected();

      const text = state.octets.join('.');
      ipOut.textContent = text;
      binOut.textContent = state.octets.map(IP.bin8).join('.');
      paintMethod();

      const info = IP.classify(IP.toInt(state.octets));
      const prefix = info.defaultPrefix;
      splitOut.replaceChildren();
      state.octets.forEach((value, i) => {
        const isNet = prefix !== null && i < prefix / 8;
        const box = el('div', `split__box ${prefix === null ? 'is-none' : isNet ? 'is-net' : 'is-host'}`);
        box.append(el('b', '', String(value)), el('small', '', prefix === null ? '—' : isNet ? 'red' : 'host'));
        splitOut.append(box);
      });

      // La barra de clases del capítulo refleja la dirección que se está editando
      qsa('.class-bar > div').forEach((d) => d.classList.toggle('is-current', d.dataset.class === info.cls && !(state.octets[0] === 0 || state.octets[0] === 127)));
      const classText = qs('[data-class-text]');
      if (classText) {
        const first = state.octets[0];
        const maskTxt = prefix === null ? 'no tiene máscara por defecto (multicast o reservada)' : `máscara por defecto ${IP.toIp(IP.maskFromPrefix(prefix))} (/${prefix}), con ${prefix / 8} ${prefix / 8 === 1 ? 'octeto' : 'octetos'} para la red y ${4 - prefix / 8} para los equipos`;
        classText.innerHTML = `<b>${text}</b> empieza en ${first}, así que es de <b>clase ${info.cls}</b>: ${maskTxt}.`;
      }

      classOut.replaceChildren();
      const rows = [
        ['Clase', `${info.cls} · ${info.range}`],
        ['Máscara por defecto', prefix === null ? 'No aplica (multicast / reservada)' : `${IP.toIp(IP.maskFromPrefix(prefix))} (/${prefix})`],
        ['Tipo', info.kind === 'privada' ? 'Privada' : info.kind === 'pública' ? 'Pública' : 'Especial'],
        ['Bloque', info.block]
      ];
      rows.forEach(([k, v], i) => {
        const wrap = el('div', info.kind === 'privada' && k === 'Tipo' ? 'is-private' : '');
        wrap.append(el('dt', '', k), el('dd', '', v));
        wrap.style.setProperty('--i', String(i));
        classOut.append(wrap);
      });
      replay([...classOut.children]);
    };

    presets.forEach(([ip, note]) => {
      const button = el('button', 'chip-button chip-button--ink');
      button.type = 'button';
      button.append(document.createTextNode(ip), el('small', '', ` · ${note}`));
      button.addEventListener('click', () => {
        state.octets = ip.split('.').map(Number);
        state.selected = 3;
        paint({ stagger: true });
        qsa('button', presetsBox).forEach((b) => b.classList.toggle('is-active', b === button));
      });
      presetsBox.append(button);
    });
    presets.length && qs('button', presetsBox).classList.add('is-active');
    paint();
  }

  /* ==============================
     Calculadora de subredes
  ================================ */
  const sub = qs('[data-subnet]');
  if (sub) {
    const ipInput = qs('[data-subnet-ip]', sub);
    const range = qs('[data-subnet-prefix]', sub);
    const rangeOut = qs('[data-subnet-prefix-out]', sub);
    const errorEl = qs('[data-subnet-error]', sub);
    const binBox = qs('[data-subnet-binary]', sub);
    const cardsBox = qs('[data-subnet-cards]', sub);
    const blocksBox = qs('[data-subnet-blocks]', sub);
    const blocksTitle = qs('[data-subnet-blocks-title]', sub);
    const magicList = qs('[data-subnet-magic]', sub);
    const playBtn = qs('[data-subnet-play]', sub);
    const presetsBox = qs('[data-subnet-presets]', sub);

    let last = null;
    let playToken = 0;

    const presets = [
      ['192.168.49.149', 26, 'N = 49 · /26'],
      ['192.168.78.178', 26, 'N = 78 · /26'],
      ['172.16.49.199', 28, '49 · método rápido /28'],
      ['172.16.78.228', 28, '78 · método rápido /28'],
      ['192.168.49.107', 28, '49 · personalizado'],
      ['192.168.78.164', 27, '78 · personalizado'],
      ['172.16.49.2', 27, 'Taller 2 · LAN A'],
      ['172.16.49.38', 27, 'Taller 2 · LAN B']
    ];

    const buildRow = (label, bits, prefix, cls) => {
      const row = el('div', `brow ${cls || ''}`);
      row.append(el('span', 'brow__label', label));
      const cells = el('div', 'brow__cells');
      bits.split('').forEach((bit, i) => {
        const cell = el('span', `bcell ${i < prefix ? 'is-net' : 'is-host'} ${bit === '1' ? 'is-one' : ''}`, bit);
        if (i > 0 && i % 8 === 0) cell.classList.add('is-gap');
        if (i === prefix) cell.classList.add('is-edge');
        cell.dataset.col = String(i);
        cells.append(cell);
      });
      row.append(cells);
      return row;
    };

    const render = ({ animate = false } = {}) => {
      const prefix = Number(range.value);
      rangeOut.textContent = `/${prefix}`;
      const info = IP.analyze(ipInput.value, prefix);
      if (!info.ok) {
        errorEl.hidden = false;
        errorEl.textContent = 'Escribe una dirección IPv4 válida: cuatro números entre 0 y 255 separados por puntos.';
        ipInput.setAttribute('aria-invalid', 'true');
        sub.classList.add('is-invalid');
        return;
      }
      errorEl.hidden = true;
      ipInput.removeAttribute('aria-invalid');
      sub.classList.remove('is-invalid');
      const m = IP.magic(ipInput.value, prefix);

      // Filas binarias
      binBox.replaceChildren();
      const ipBits = IP.bin32(info.ip);
      const maskBits = IP.bin32(info.mask);
      const netBits = IP.bin32(info.network);
      const rowIp = buildRow('IP', ipBits, prefix);
      const rowMask = buildRow('Máscara', maskBits, prefix);
      const rowNet = buildRow('IP AND máscara', netBits, prefix, 'brow--result');
      [[rowIp, info.text.ip], [rowMask, info.text.mask], [rowNet, info.text.network]].forEach(([row, dec]) => row.append(el('span', 'brow__dec', dec)));
      const divider = el('div', 'brow__rule');
      const netTag = el('span', 'is-net', `${prefix} bits de red`);
      const hostTag = el('span', 'is-host', `${32 - prefix} bits de host`);
      divider.append(netTag, hostTag);
      binBox.append(rowIp, rowMask, rowNet, divider);
      binBox.dataset.ready = animate ? '0' : '1';
      if (animate) rowNet.classList.add('is-hidden');

      // Tarjetas
      const typeText = { host: 'Host', red: 'Dirección de red', broadcast: 'Broadcast' }[info.type];
      const values = [
        ['Máscara de red', info.text.mask, '', `/${prefix}`],
        ['Wildcard', info.text.wildcard, '', '255 − máscara'],
        ['Dirección de red', info.text.network, 'is-key', 'IP AND máscara'],
        ['Broadcast', info.text.broadcast, 'is-key', 'red + wildcard'],
        ['HostMin', info.text.hostMin, '', 'red + 1'],
        ['HostMax', info.text.hostMax, '', 'broadcast − 1'],
        ['Bits de host (h)', String(info.hostBits), '', `32 − ${prefix}`],
        ['Hosts utilizables', info.usable.toLocaleString('es'), 'is-key', `2^${info.hostBits} − 2`],
        ['Tipo de la dirección', typeText, info.type === 'host' ? '' : 'is-warn', info.type === 'host' ? 'dentro del rango útil' : 'no asignable a un equipo']
      ];
      cardsBox.replaceChildren();
      values.forEach(([label, value, cls, hint], i) => {
        const card = el('div', `scard ${cls}`);
        card.style.setProperty('--i', String(i));
        card.append(el('span', 'scard__label', label), el('b', 'scard__value', value), el('small', 'scard__hint', hint));
        cardsBox.append(card);
      });
      replay([...cardsBox.children]);

      // Bloques del octeto interesante
      const k = m.octetIndex;
      const block = m.block;
      const total = 256 / block;
      let first = 0;
      let count = total;
      if (total > 32) {
        count = 16;
        first = Math.max(0, Math.min(total - count, Math.floor(m.value / block) - 7));
      }
      blocksBox.replaceChildren();
      blocksTitle.textContent = block === 256
        ? `Octeto ${k + 1}: la máscara termina en un límite de octeto (un solo bloque de 256)`
        : `Octeto ${k + 1}: bloques de ${block} (256 − ${m.maskOctet})`;
      for (let i = first; i < first + count; i += 1) {
        const start = i * block;
        const isCur = start === m.start;
        const cell = el('div', `blk ${isCur ? 'is-current' : ''}`);
        cell.append(el('span', 'blk__start', String(start)));
        if (isCur) {
          const parts = el('div', 'blk__parts');
          parts.append(el('i', 'is-net'), el('i', 'is-host'), el('i', 'is-bc'));
          cell.append(parts);
          if (k === 3) cell.append(el('span', 'blk__ip', `.${m.value}`));
        }
        cell.title = `${start} – ${start + block - 1}`;
        blocksBox.append(cell);
      }
      if (total > 32) blocksBox.dataset.window = `Se muestran 16 de ${total} bloques`; else delete blocksBox.dataset.window;
      blocksBox.style.setProperty('--n', String(count));

      // Pasos del número mágico
      const ord = ['primero', 'segundo', 'tercero', 'cuarto'][k];
      const multiples = [m.start - 2 * block, m.start - block, m.start, m.next, m.next + block].filter((n) => n >= 0 && n <= 256).slice(-4);
      const netTxt = info.text.network.split('.');
      const bcTxt = info.text.broadcast;
      const steps = block === 256
        ? [
          `La máscara /${prefix} (${info.text.mask}) termina justo al final de un octeto: no hay octeto «interesante».`,
          'La dirección de red conserva los octetos de red y pone los de host en 0.',
          `Red ${info.text.network}, broadcast ${bcTxt}: de ${info.text.hostMin} a ${info.text.hostMax}.`
        ]
        : [
          `Máscara /${prefix} = ${info.text.mask}. El octeto interesante es el ${ord}, con valor ${m.maskOctet}.`,
          `Tamaño del bloque = 256 − ${m.maskOctet} = ${block} direcciones.`,
          `Múltiplos de ${block} cercanos a ${m.value}: ${multiples.join(', ')}.`,
          `Como ${m.start} ≤ ${m.value} ≤ ${m.next - 1}, el octeto de la red es ${m.start}: red ${info.text.network}.`,
          `El siguiente bloque empieza en ${m.next}; el broadcast termina en ${m.next} − 1 = ${m.next - 1}: ${bcTxt}.`,
          `Rango utilizable: ${info.text.hostMin} a ${info.text.hostMax} (${info.usable.toLocaleString('es')} hosts).`
        ];
      void netTxt;
      magicList.replaceChildren();
      steps.forEach((text, i) => { const li = el('li', '', text); li.style.setProperty('--i', String(i)); magicList.append(li); });
      replay([...magicList.children]);

      last = { info, prefix };
    };

    const playAnd = async () => {
      if (!last) return;
      const token = ++playToken;
      const rows = qsa('.brow', binBox);
      const rowIp = rows[0];
      const rowMask = rows[1];
      const rowNet = rows[2];
      if (!rowNet) return;
      playBtn.disabled = true;
      rowNet.classList.add('is-hidden');
      rowNet.classList.remove('is-done');
      const cellsIp = qsa('.bcell', rowIp);
      const cellsMask = qsa('.bcell', rowMask);
      const cellsNet = qsa('.bcell', rowNet);
      cellsNet.forEach((c) => c.classList.remove('is-revealed'));
      qsa('.bcell.is-scan', binBox).forEach((c) => c.classList.remove('is-scan'));
      await wait(120);
      for (let i = 0; i < 32; i += 1) {
        if (token !== playToken) return;
        [cellsIp[i], cellsMask[i], cellsNet[i]].forEach((c) => c.classList.add('is-scan'));
        cellsNet[i].classList.add('is-revealed');
        rowNet.classList.remove('is-hidden');
        await wait(reduceMotion ? 0 : (i % 8 === 7 ? 46 : 26));
        [cellsIp[i], cellsMask[i], cellsNet[i]].forEach((c) => c.classList.remove('is-scan'));
      }
      rowNet.classList.add('is-done');
      playBtn.disabled = false;
    };

    const setValues = (ip, prefix) => {
      ipInput.value = ip;
      range.value = String(prefix);
      render({ animate: true });
      playAnd();
    };

    ipInput.addEventListener('input', () => { playToken += 1; playBtn.disabled = false; render(); qsa('button', presetsBox).forEach((b) => b.classList.remove('is-active')); });
    range.addEventListener('input', () => { playToken += 1; playBtn.disabled = false; render(); qsa('button', presetsBox).forEach((b) => b.classList.remove('is-active')); });
    playBtn.addEventListener('click', () => { render({ animate: true }); playAnd(); });

    presets.forEach(([ip, prefix, label]) => {
      const button = el('button', 'chip-button');
      button.type = 'button';
      button.append(document.createTextNode(label), el('small', '', ` ${ip}/${prefix}`));
      button.addEventListener('click', () => {
        setValues(ip, prefix);
        qsa('button', presetsBox).forEach((b) => b.classList.toggle('is-active', b === button));
      });
      presetsBox.append(button);
    });
    qs('button', presetsBox).classList.add('is-active');
    render();
    whenVisible(sub, () => { render({ animate: true }); playAnd(); }, 0.3);
  }

  /* ==============================
     Tabla de prefijos
  ================================ */
  const tableBody = qs('[data-prefix-table] tbody');
  if (tableBody) {
    for (let p = 24; p <= 30; p += 1) {
      const mask = IP.maskFromPrefix(p);
      const wc = (~mask) >>> 0;
      const h = 32 - p;
      const tr = el('tr');
      [`/${p}`, IP.toIp(mask), IP.toIp(wc), String(h), String(2 ** h), String(2 ** h - 2)].forEach((v, i) => {
        const td = el('td', i === 0 ? 'is-strong' : '', v);
        tr.append(td);
      });
      if ([26, 27, 28].includes(p)) tr.classList.add('is-used');
      tableBody.append(tr);
    }
  }

  /* ==============================
     Entrenador de subredes
  ================================ */
  const tr = qs('[data-trainer]');
  if (tr) {
    const task = qs('[data-trainer-task]', tr);
    const form = qs('[data-trainer-form]', tr);
    const fb = qs('[data-trainer-feedback]', tr);
    const okEl = qs('[data-trainer-ok]', tr);
    const streakEl = qs('[data-trainer-streak]', tr);
    const levelBtns = qsa('[data-level]', tr);
    const fields = Object.fromEntries(qsa('[data-t-field]', tr).map((i) => [i.dataset.tField, i]));
    const levels = { easy: [25, 26, 27], mid: [26, 27, 28, 29, 30], hard: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] };
    const bestEl = qs('[data-trainer-best]', tr);
    let best = 0;
    try { best = Number(window.localStorage.getItem('netlab:trainer-best')) || 0; } catch (e) { /* sin almacenamiento */ }
    bestEl.textContent = String(best);
    const st = { level: 'easy', info: null, ok: 0, streak: 0, solved: false };
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

    const generate = (focus = false) => {
      const list = levels[st.level];
      const prefix = list[rnd(0, list.length - 1)];
      let info;
      do {
        const base = prefix >= 24 ? `192.168.${rnd(1, 254)}` : (Math.random() < 0.5 ? `172.${rnd(16, 31)}.${rnd(0, 255)}` : `10.${rnd(0, 255)}.${rnd(0, 255)}`);
        const ip = prefix >= 24 ? `${base}.${rnd(1, 254)}` : `${base}.${rnd(1, 254)}`;
        info = IP.analyze(ip, prefix);
      } while (info.type !== 'host');
      st.info = info;
      st.solved = false;
      task.textContent = `${info.text.ip}/${info.prefix}`;
      Object.values(fields).forEach((i) => { i.value = ''; i.classList.remove('is-ok', 'is-bad'); i.removeAttribute('aria-invalid'); i.disabled = false; });
      fb.textContent = '';
      fb.className = 'trainer__feedback';
      replay([task.parentElement], false);
      if (focus === true) fields.network.focus({ preventScroll: true });
    };

    const expected = () => ({
      network: st.info.text.network, broadcast: st.info.text.broadcast,
      hostMin: st.info.text.hostMin, hostMax: st.info.text.hostMax, usable: String(st.info.usable)
    });
    const same = (key, value) => {
      const v = value.trim();
      if (key === 'usable') return v.replace(/[.,\s]/g, '') === String(st.info.usable);
      const a = IP.parseIp(v);
      return a.ok && IP.toIp(a.int) === expected()[key];
    };
    const labels = { network: 'dirección de red', broadcast: 'broadcast', hostMin: 'HostMin', hostMax: 'HostMax', usable: 'hosts utilizables' };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!st.info || st.solved) return;
      const wrong = [];
      Object.entries(fields).forEach(([key, input]) => {
        const good = same(key, input.value);
        input.classList.toggle('is-ok', good);
        input.classList.toggle('is-bad', !good);
        if (!good) { input.setAttribute('aria-invalid', 'true'); wrong.push(key); } else input.removeAttribute('aria-invalid');
      });
      if (!wrong.length) {
        st.ok += 1;
        st.streak += 1;
        st.solved = true;
        okEl.textContent = String(st.ok);
        streakEl.textContent = String(st.streak);
        if (st.streak > best) {
          best = st.streak;
          bestEl.textContent = String(best);
          try { window.localStorage.setItem('netlab:trainer-best', String(best)); } catch (e) { /* sin almacenamiento */ }
        }
        fb.className = 'trainer__feedback is-ok';
        fb.textContent = `¡Correcto! ${st.info.text.ip}/${st.info.prefix} pertenece a la red ${st.info.text.network}, con ${st.info.usable.toLocaleString('es')} hosts utilizables. Pulsa «Nuevo ejercicio» para seguir.`;
        Object.values(fields).forEach((i) => { i.disabled = true; });
      } else {
        st.streak = 0;
        streakEl.textContent = '0';
        fb.className = 'trainer__feedback is-bad';
        fb.textContent = `Revisa: ${wrong.map((k) => labels[k]).join(', ')}. ${wrong.includes('network') ? 'Empieza por la red: IP AND máscara, o el número mágico.' : 'Si la red está bien, el resto sale de ella: broadcast = siguiente bloque − 1.'}`;
      }
    });

    qs('[data-trainer-new]', tr).addEventListener('click', () => generate(true));
    qs('[data-trainer-hint]', tr).addEventListener('click', () => {
      if (!st.info) return;
      const m = IP.magic(st.info.text.ip, st.info.prefix);
      fb.className = 'trainer__feedback is-hint';
      fb.textContent = m.block === 256
        ? `La máscara ${st.info.text.mask} termina justo al final de un octeto: la red conserva los octetos de red y pone los de host en 0.`
        : `Máscara ${st.info.text.mask}: el octeto interesante es el ${['primero', 'segundo', 'tercero', 'cuarto'][m.octetIndex]} y el bloque mide 256 − ${m.maskOctet} = ${m.block}. El valor ${m.value} cae entre ${m.start} y ${m.next - 1}.`;
    });
    qs('[data-trainer-reveal]', tr).addEventListener('click', () => {
      if (!st.info) return;
      const exp = expected();
      Object.entries(fields).forEach(([key, input]) => { input.value = exp[key]; input.classList.remove('is-ok', 'is-bad'); });
      st.streak = 0;
      streakEl.textContent = '0';
      fb.className = 'trainer__feedback is-hint';
      fb.textContent = `Solución: red ${exp.network}, broadcast ${exp.broadcast}, rango útil de ${exp.hostMin} a ${exp.hostMax} (${st.info.usable.toLocaleString('es')} hosts). Genera otro ejercicio para practicar.`;
    });
    levelBtns.forEach((b) => b.addEventListener('click', () => { st.level = b.dataset.level; setActive(levelBtns, b); generate(true); }));
    generate();
  }

  /* ==============================
     Hoja de fórmulas: copiar al portapapeles
  ================================ */
  qsa('[data-copy]').forEach((button) => {
    const label = qs('span', button);
    const original = label ? label.textContent : '';
    let timer = 0;
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      let done = false;
      try { await navigator.clipboard.writeText(text); done = true; } catch (e) {
        const area = document.createElement('textarea');
        area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.append(area); area.select();
        try { done = document.execCommand('copy'); } catch (err) { done = false; }
        area.remove();
      }
      if (label) label.textContent = done ? 'Copiado ✓' : 'Selecciona y copia';
      button.classList.toggle('is-copied', done);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (label) label.textContent = original; button.classList.remove('is-copied'); }, 1600);
    });
  });
  void countTo; void setActive;
})();
