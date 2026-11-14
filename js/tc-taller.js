/* ==============================
   NETLAB · Tercer corte — talleres
   Taller IPv4 (cédulas 49 y 78) y Taller 2 (puntos 1–8).
================================ */
(() => {
  'use strict';
  const { qs, qsa, el, wait, reduceMotion, setActive, replay, typeLines, countTo, createNet } = window.TC;
  const IP = window.IPCALC;

  /** Constructor de nodos: h('div', 'clase', [hijos o texto]) */
  const h = (tag, cls, children) => {
    const node = el(tag, cls);
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach((c) => {
      if (c === null || c === undefined) return;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return node;
  };
  const code = (t) => h('code', '', t);
  const table = (headers, rows, cls = '') => {
    const t = h('table', cls);
    const thead = h('thead', '', h('tr', '', headers.map((x) => h('th', '', x))));
    const tbody = h('tbody');
    rows.forEach((row) => tbody.append(h('tr', row.cls || '', (row.cells || row).map((c) => (c instanceof Node && c.tagName === 'TD' ? c : h('td', '', c))))));
    t.append(thead, tbody);
    return h('div', 'table-scroll', t);
  };
  const andTable = (ipOct, maskOct, resOct) => {
    const bits = (n) => IP.bin8(n).split('');
    const mk = (label, n, cls) => ({ cls, cells: [label, ...bits(n).map((b) => h('td', b === '1' ? 'is-one' : 'is-zero', b)), String(n)] });
    return table(['Elemento', '128', '64', '32', '16', '8', '4', '2', '1', 'Decimal'], [mk('IP', ipOct), mk('Máscara', maskOct), mk('IP AND máscara', resOct, 'is-result')], 'and-table');
  };
  const sumText = (n) => WEIGHTS.filter((w) => n & w).join(' + ') || '0';
  const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
  const para = (html) => { const p = h('p'); p.innerHTML = html; return p; };

  const pingLines = (target, opts) => {
    const { ttl, received = 4, kind = 'ok', from = target, unreachableFrom } = opts;
    const out = ['', `C:\\>ping ${target}`, '', `Pinging ${target} with 32 bytes of data:`, ''];
    if (kind === 'ok') {
      for (let i = 0; i < 4; i += 1) out.push(`Reply from ${from}: bytes=32 time<1ms TTL=${ttl}`);
      out.push('', `Ping statistics for ${target}:`, `    Packets: Sent = 4, Received = ${received}, Lost = ${4 - received} (${(4 - received) * 25}% loss),`, 'Approximate round trip times in milli-seconds:', '    Minimum = 0ms, Maximum = 0ms, Average = 0ms');
    } else {
      for (let i = 0; i < 4; i += 1) out.push(`Reply from ${unreachableFrom}: Destination host unreachable.`);
      out.push('', `Ping statistics for ${target}:`, '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),');
    }
    return out;
  };

  /* ==============================
     Taller IPv4 (cédulas 49 y 78)
  ================================ */
  const t1 = qs('[data-t1]');
  if (t1) {
    const studentBox = qs('[data-t1-student]', t1);
    const paramsBox = qs('[data-t1-params]', t1);
    const addrBox = qs('[data-t1-addresses]', t1);
    const partsBox = qs('[data-t1-parts]', t1);
    const panel = qs('[data-t1-panel]', t1);
    const state = { n: 49, part: 1 };
    const prefixByY = { 9: 28, 8: 27 };

    const model = () => {
      const n = state.n;
      const x = Math.floor(n / 10);
      const y = n % 10;
      const p4 = prefixByY[y];
      return {
        n, x, y, p4,
        a1: `192.168.${n}.${n + 100}`,
        a3: `172.16.${n}.${n + 150}`,
        a4: `192.168.${n}.${2 * n + y}`
      };
    };

    const renderHeader = () => {
      const m = model();
      paramsBox.replaceChildren(
        ...[['X', m.x], ['Y', m.y], ['N', m.n], ['Prefijo P4', `/${m.p4}`]].map(([k, v]) => h('div', '', [h('span', '', k), h('b', '', String(v))]))
      );
      addrBox.replaceChildren(
        ...[
          ['Partes 1 y 2', `192.168.N.(N+100)`, `192.168.${m.n}.${m.n + 100}`, `/26 en la Parte 2`],
          ['Parte 3', `172.16.N.(N+150)/28`, `172.16.${m.n}.${m.n + 150}`, '/28'],
          ['Parte 4', `192.168.N.(2×N+Y)/P`, `192.168.${m.n}.${2 * m.n + m.y}`, `/${m.p4}`]
        ].map(([title, formula, value, extra]) => h('article', 'addr-card', [h('span', '', title), h('code', 'addr-card__formula', formula), h('b', '', value), h('small', '', extra)]))
      );
      replay([...addrBox.children]);
      replay([...paramsBox.children]);
      qsa('[data-n-text]').forEach((s) => { s.textContent = String(m.n); });
    };

    const summary = (info, note) => {
      const rows = [
        ['Dirección asignada', `${info.text.ip}/${info.prefix}`],
        ['Netmask decimal', info.text.mask],
        ['Netmask binaria', IP.dottedBin(info.mask)],
        ['Bits de host', `32 − ${info.prefix} = ${info.hostBits}`],
        ['Wildcard', info.text.wildcard],
        ['Dirección de red', info.text.network],
        ['Broadcast', info.text.broadcast],
        ['HostMin', info.text.hostMin],
        ['HostMax', info.text.hostMax],
        ['Hosts utilizables', `2^${info.hostBits} − 2 = ${info.usable}`],
        ['Tipo de dirección', { host: 'Host', red: 'Red', broadcast: 'Broadcast' }[info.type]]
      ];
      return h('div', 'summary-block', [h('h4', '', note || 'Resumen completo'), table(['Concepto', 'Resultado'], rows.map(([k, v], i) => ({ cells: [k, h('td', i === 5 || i === 6 ? 'is-key' : '', v)] })))]);
    };

    const part1 = () => {
      const m = model();
      const octs = IP.parseIp(m.a1).octets;
      const rows = octs.map((o, i) => [String(i + 1), String(o), h('td', 'mono', IP.bin8(o)), sumText(o)]);
      const steps = octs.map((o, i) => {
        let rest = o;
        const parts = [];
        WEIGHTS.forEach((w) => { if (rest >= w) { parts.push(`${rest} − ${w} = ${rest - w}`); rest -= w; } });
        return h('li', '', [h('b', '', `Octeto ${i + 1} (${o})`), h('span', '', parts.length ? parts.join(' · ') : '0'), h('code', '', IP.bin8(o))]);
      });
      const cls = IP.classify(IP.toInt(octs));
      return [
        h('h4', '', `1.1 Conversión de ${m.a1} a binario`),
        para('Método de la resta con los pesos 128, 64, 32, 16, 8, 4, 2 y 1: se escribe 1 si el peso participa en la suma del octeto y 0 si no.'),
        table(['Octeto', 'Decimal', 'Binario (8 bits)', 'Suma de comprobación'], rows),
        h('ol', 'sub-steps', steps),
        h('p', 'binary-full', [h('span', '', 'Dirección completa de 32 bits'), h('code', '', IP.dottedBin(IP.toInt(octs)))]),
        h('h4', '', '1.2 Análisis de la estructura'),
        table(['Pregunta', 'Respuesta'], [
          ['¿Cuántos bits y octetos tiene?', '32 bits organizados en cuatro octetos de ocho bits.'],
          ['¿A qué clase pertenece y por qué?', `Clase ${cls.cls}: su primer octeto es ${octs[0]} y la clase ${cls.cls} abarca de ${cls.range.replace(' – ', ' a ')}.`],
          ['¿Pública o privada? ¿Cuál es su rango?', `Privada, por pertenecer al bloque RFC 1918 192.168.0.0/16 (192.168.0.0 a 192.168.255.255).`],
          ['Con la máscara por defecto, ¿cuál es la porción de red?', `192.168.${m.n}, equivalente a la dirección de red 192.168.${m.n}.0/24.`],
          ['Con la máscara por defecto, ¿cuál es la porción de host?', `El cuarto octeto, ${octs[3]}, dado que la máscara por defecto es 255.255.255.0 (/24).`]
        ])
      ];
    };

    const part2 = () => {
      const m = model();
      const info = IP.analyze(m.a1, 26);
      const octs = IP.parseIp(m.a1).octets;
      const mo = 192;
      return [
        h('h4', '', 'Paso 1 · De prefijo a netmask'),
        para(`La dirección asignada es <b>${m.a1}/26</b>. El prefijo /26 contiene 26 bits de red y 32 − 26 = <b>6 bits de host</b>: 8 + 8 + 8 + 2 = 26 unos, seguidos de seis ceros.`),
        table(['Representación', 'Octeto 1', 'Octeto 2', 'Octeto 3', 'Octeto 4'], [['Binario', '11111111', '11111111', '11111111', '11000000'], ['Decimal', '255', '255', '255', '192']]),
        para('El último octeto 11000000 = 128 + 64 = 192, por lo tanto <b>netmask = 255.255.255.192</b>. Hay 2<sup>6</sup> = 64 direcciones y 62 son utilizables.'),
        h('h4', '', 'Paso 2 · Dirección de red por AND'),
        para(`Los tres primeros octetos se conservan (192.168.${m.n}). En el cuarto: ${octs[3]} = ${IP.bin8(octs[3])} y la máscara 192 = 11000000. AND solo devuelve 1 cuando ambos bits son 1.`),
        andTable(octs[3], mo, octs[3] & mo),
        para(`${IP.bin8(octs[3])} AND 11000000 = ${IP.bin8(octs[3] & mo)} = ${octs[3] & mo}. La dirección de red es <b>${info.text.network}/26</b>.`),
        h('h4', '', 'Paso 3 · Wildcard y broadcast'),
        para(`Wildcard = 255.255.255.255 − 255.255.255.192 = <b>0.0.0.63</b>. En el cuarto octeto de la red (${info.network & 255}), los seis bits de host en 1 dan ${IP.bin8(info.broadcast & 255)} = ${info.broadcast & 255}.`),
        table(['Elemento', 'Cuarto octeto binario', 'Valor decimal'], [['Red', IP.bin8(info.network & 255), String(info.network & 255)], ['Wildcard', '00111111', '63'], ['Broadcast', IP.bin8(info.broadcast & 255), String(info.broadcast & 255)]]),
        h('h4', '', 'Paso 4 · HostMin, HostMax y hosts utilizables'),
        para(`HostMin = red + 1 = <b>${info.text.hostMin}</b>. HostMax = broadcast − 1 = <b>${info.text.hostMax}</b>. Hosts utilizables = 2<sup>6</sup> − 2 = <b>62</b>. La IP ${m.a1} es una dirección de host: no coincide con la red ni con el broadcast.`),
        summary(info, 'Resumen completo de la Parte 2')
      ];
    };

    const magicPart = (ip, prefix, title, intro) => {
      const info = IP.analyze(ip, prefix);
      const mg = IP.magic(ip, prefix);
      const mo = mg.maskOctet;
      const val = mg.value;
      const mult = [mg.start - 2 * mg.block, mg.start - mg.block, mg.start, mg.next, mg.next + mg.block].filter((x) => x >= 0 && x <= 256).slice(-4);
      return [
        h('h4', '', title),
        para(intro),
        h('ol', 'sub-steps', [
          h('li', '', [h('b', '', '1 · Tamaño del bloque'), h('span', '', `256 − ${mo} = ${mg.block} direcciones`)]),
          h('li', '', [h('b', '', '2 · Múltiplos cercanos'), h('span', '', `${mult.join(', ')}`)]),
          h('li', '', [h('b', '', '3 · Bloque de la IP'), h('span', '', `${mg.start} ≤ ${val} ≤ ${mg.next - 1} → la red termina en .${mg.start}`)]),
          h('li', '', [h('b', '', '4 · Broadcast'), h('span', '', `El siguiente bloque inicia en .${mg.next}; el broadcast termina en .${mg.next} − 1 = .${mg.next - 1}`)]),
          h('li', '', [h('b', '', '5 · Comprobación con AND'), h('span', '', `${val} = ${IP.bin8(val)} y ${mo} = ${IP.bin8(mo)}`)])
        ]),
        andTable(val, mo, val & mo),
        para(`${IP.bin8(val)} AND ${IP.bin8(mo)} = ${IP.bin8(val & mo)} = ${val & mo}. Dirección de red: <b>${info.text.network}</b>. h = 32 − ${prefix} = ${info.hostBits}; 2<sup>${info.hostBits}</sup> = ${info.total} direcciones y ${info.usable} hosts.`),
        summary(info)
      ];
    };

    const part3 = () => {
      const m = model();
      return magicPart(m.a3, 28, `Método rápido del número mágico con /28 · ${m.a3}/28`, `La máscara /28 es <b>255.255.255.240</b> (11111111.11111111.11111111.11110000); el octeto interesante es el cuarto, con valor 240.`);
    };
    const part4 = () => {
      const m = model();
      const prefix = m.p4;
      const out = magicPart(m.a4, prefix, `Prefijo personalizado · ${m.a4}/${prefix}`, `Con Y = ${m.y} la tabla del taller da el prefijo <b>/${prefix}</b>. La fórmula 192.168.N.(2 × N + Y)/P produce 192.168.${m.n}.(2 × ${m.n} + ${m.y}) = <b>${m.a4}/${prefix}</b>: el último octeto vale ${2 * m.n} + ${m.y} = ${2 * m.n + m.y}.`);
      return out;
    };

    const renderPanel = () => {
      const builders = { 1: part1, 2: part2, 3: part3, 4: part4 };
      panel.replaceChildren(...builders[state.part]());
      replay([...panel.children], true);
      panel.scrollTop = 0;
    };
    const renderAll = () => { renderHeader(); renderPanel(); renderPlan(); resetPt(); };

    qsa('button', studentBox).forEach((button) => button.addEventListener('click', () => {
      state.n = Number(button.dataset.n);
      setActive(qsa('button', studentBox), button);
      renderAll();
    }));
    qsa('button', partsBox).forEach((button) => button.addEventListener('click', () => {
      state.part = Number(button.dataset.part);
      setActive(qsa('button', partsBox), button, 'aria-selected');
      renderPanel();
    }));

    /* ----- Práctica en Packet Tracer ----- */
    const pt = qs('[data-t1-pt]');
    const netBox = qs('[data-t1-net]', pt);
    const out = qs('[data-t1-out]', pt);
    const verdict = qs('[data-t1-verdict]', pt);
    const planBody = qs('[data-t1-plan] tbody', pt);
    const farBtn = qs('[data-t1-test="far"]', pt);
    let net = null;
    let farActive = false;
    let busy = false;

    const buildNet = () => {
      const m = model();
      net = createNet(netBox, {
        width: 640, height: 270, label: 'Topología: R1, S1 y tres PC',
        nodes: [
          { id: 'r1', type: 'router', x: 320, y: 40, label: 'R1', sub: `192.168.${m.n}.129` },
          { id: 's1', type: 'switch', x: 320, y: 125, label: 'S1' },
          { id: 'pc1', type: 'pc', x: 120, y: 200, label: 'PC1', sub: `192.168.${m.n}.130` },
          { id: 'pc2', type: 'pc', x: 320, y: 205, label: 'PC2', sub: `192.168.${m.n}.131` },
          { id: 'pc3', type: 'pc', x: 520, y: 200, label: 'PC3', sub: `192.168.${m.n}.190` }
        ],
        links: [['r1', 's1', { a: 'Gi0/0/0', b: 'Gi0/1' }], ['s1', 'pc1', { a: 'Fa0/1', b: 'Fa0' }], ['s1', 'pc2', { a: 'Fa0/2', b: 'Fa0' }], ['s1', 'pc3', { a: 'Fa0/3', b: 'Fa0' }]]
      });
    };

    const renderPlan = () => {
      const m = model();
      const rows = [
        ['R1 G0/0/0', 'HostMin', `192.168.${m.n}.129`, '/26', 'No aplica', 'r1'],
        ['PC1', 'HostMin + 1', `192.168.${m.n}.130`, '/26', `192.168.${m.n}.129`, 'pc1'],
        ['PC2', 'HostMin + 2', `192.168.${m.n}.131`, '/26', `192.168.${m.n}.129`, 'pc2'],
        ['PC3', 'HostMax', `192.168.${m.n}.190`, '/26', `192.168.${m.n}.129`, 'pc3']
      ];
      planBody.replaceChildren(...rows.map(([a, b, c, d, e, id]) => {
        const tr = h('tr', '', [a, b, h('td', 'mono', c), d, h('td', 'mono', e)].map((x) => (x instanceof Node ? x : h('td', '', x))));
        tr.dataset.node = id;
        return tr;
      }));
    };
    const highlightPlan = (ids) => qsa('tr', planBody).forEach((tr) => tr.classList.toggle('is-lit', ids.includes(tr.dataset.node)));

    const resetPt = () => {
      farActive = false;
      farBtn.textContent = 'Mover PC2 a otra subred';
      farBtn.classList.remove('is-warn');
      out.textContent = 'C:\\> Elige una prueba para empezar.';
      verdict.textContent = '';
      verdict.className = 'lab__verdict';
      buildNet();
      highlightPlan([]);
    };

    const run = async (kind) => {
      if (busy) return;
      busy = true;
      qsa('[data-t1-test]', pt).forEach((b) => { b.disabled = true; });
      const m = model();
      const gw = `192.168.${m.n}.129`;
      const max = `192.168.${m.n}.190`;
      net.clearStates();
      verdict.textContent = '';
      verdict.className = 'lab__verdict';
      try {
        if (kind === 'gw') {
          highlightPlan(['pc1', 'r1']);
          out.textContent = `C:\\> ping ${gw}`;
          await net.send(['pc1', 's1', 'r1'], { label: 'ICMP' });
          await net.send(['r1', 's1', 'pc1'], { color: 'green', label: 'Reply' });
          await typeLines(out, pingLines(gw, { ttl: 255 }), { delay: reduceMotion ? 0 : 70 });
          verdict.textContent = 'R1 respondió: TTL 255, porque el router parte de 255. PC1 y R1 están en la misma subred /26.';
          verdict.classList.add('is-ok');
        } else if (kind === 'max') {
          highlightPlan(['pc1', 'pc3']);
          out.textContent = `C:\\> ping ${max}`;
          await net.send(['pc1', 's1', 'pc3'], { label: 'ICMP' });
          await net.send(['pc3', 's1', 'pc1'], { color: 'green', label: 'Reply' });
          await typeLines(out, pingLines(max, { ttl: 128 }), { delay: reduceMotion ? 0 : 70 });
          verdict.textContent = 'HostMax respondió con TTL 128: el paquete no pasó por el router, solo por el switch.';
          verdict.classList.add('is-ok');
        } else if (kind === 'far') {
          if (farActive) {
            farActive = false;
            net.setSub('pc2', `192.168.${m.n}.131`);
            net.setNode('pc2', '');
            farBtn.textContent = 'Mover PC2 a otra subred';
            farBtn.classList.remove('is-warn');
            out.textContent = `C:\\> PC2 volvió a 192.168.${m.n}.131 con máscara 255.255.255.192 y gateway ${gw}.`;
            verdict.textContent = 'Recuperación: se restauró la dirección original de PC2.';
            verdict.classList.add('is-ok');
          } else {
            const far = `192.168.${m.n}.198`;
            highlightPlan(['pc2', 'r1']);
            farActive = true;
            net.setSub('pc2', far);
            net.setNode('pc2', 'warn');
            farBtn.textContent = 'Devolver PC2 a su dirección';
            farBtn.classList.add('is-warn');
            out.textContent = `C:\\> PC2 → ${far} /26\nC:\\> ping ${far}`;
            await net.send(['pc1', 's1', 'r1'], { label: 'ICMP' });
            await net.send(['r1', 's1', 'pc1'], { color: 'red', label: 'Unreachable' });
            await typeLines(out, pingLines(far, { kind: 'fail', unreachableFrom: gw }), { delay: reduceMotion ? 0 : 70 });
            verdict.innerHTML = `198 AND 192 = ${198 & 192}: la dirección cae en <b>192.168.${m.n}.192/26</b>, no en <b>.128/26</b>. R1 solo tiene interfaz en .128/26 y responde «Destination host unreachable».`;
            verdict.classList.add('is-bad');
          }
        }
      } finally {
        busy = false;
        qsa('[data-t1-test]', pt).forEach((b) => { b.disabled = false; });
      }
    };
    qsa('[data-t1-test]', pt).forEach((button) => button.addEventListener('click', () => run(button.dataset.t1Test)));

    renderAll();
  }

  /* ==============================
     Taller 2 · puntos 1–8
  ================================ */
  const t2 = qs('[data-t2]');
  if (t2) {
    const nav = qsa('[data-point]', t2);
    const panels = qsa('[data-t2-panel]', t2);
    const bar = qs('[data-t2-bar]', t2);
    const count = qs('[data-t2-count]', t2);
    const prev = qs('[data-t2-prev]', t2);
    const next = qs('[data-t2-next]', t2);
    let current = 1;

    const show = (n, { focus = false } = {}) => {
      current = Math.max(1, Math.min(8, n));
      nav.forEach((b) => {
        const on = Number(b.dataset.point) === current;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('is-done', Number(b.dataset.point) < current);
      });
      panels.forEach((p) => {
        const on = Number(p.dataset.t2Panel) === current;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
        if (on) replay([...qs('.t2__text', p).children, ...qsa('.t2__media figure', p)]);
      });
      bar.style.transform = `scaleX(${current / 8})`;
      count.textContent = `Punto ${current} de 8`;
      prev.disabled = current === 1;
      next.disabled = current === 8;
      next.textContent = current === 8 ? 'Último punto' : 'Siguiente punto →';
      if (focus) nav[current - 1].focus();
      // Centra el punto activo solo en la barra (nunca desplaza la página)
      const strip = qs('[data-t2-nav]', t2);
      const activeBtn = nav[current - 1];
      if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: activeBtn.offsetLeft - (strip.clientWidth - activeBtn.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    nav.forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.point))));
    nav.forEach((b) => b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, { focus: true }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, { focus: true }); }
    }));
    prev.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    show(1);

    /* ----- Punto 5: ¿misma subred? ----- */
    const sn = qs('[data-samenet]', t2);
    if (sn) {
      const a = qs('[data-samenet-a]', sn);
      const b = qs('[data-samenet-b]', sn);
      const p = qs('[data-samenet-p]', sn);
      const outBox = qs('[data-samenet-out]', sn);
      const renderSn = () => {
        const prefix = Math.max(8, Math.min(30, parseInt(p.value, 10) || 26));
        const ia = IP.analyze(a.value, prefix);
        const ib = IP.analyze(b.value, prefix);
        outBox.replaceChildren();
        if (!ia.ok || !ib.ok) { outBox.append(h('p', 'field-error', 'Escribe dos direcciones IPv4 válidas.')); return; }
        const same = ia.network === ib.network;
        const lastBits = (info) => { const o = info.ip & 255; const mo = info.mask & 255; return `${o} = ${IP.bin8(o)}  AND  ${mo} = ${IP.bin8(mo)}  →  ${IP.bin8(o & mo)} = ${o & mo}`; };
        const row = (label, info) => h('div', 'samenet__host', [
          h('b', '', label),
          h('code', '', `${info.text.ip}/${prefix}`),
          prefix >= 24 ? h('small', 'mono', lastBits(info)) : null,
          h('span', 'samenet__net', ['red ', h('b', '', `${info.text.network}/${prefix}`)]),
          info.type !== 'host' ? h('em', '', info.type === 'broadcast' ? 'es el broadcast: no asignable' : 'es la dirección de red: no asignable') : null
        ]);
        const verdict = h('p', `samenet__verdict ${same ? 'is-ok' : 'is-bad'}`, same
          ? 'Misma red: el switch reenvía las tramas directamente y el ping funciona.'
          : 'Redes distintas: el switch no basta. PC1 debe enviar al gateway y el router no tiene ruta hacia la otra red → «Destination host unreachable».');
        outBox.append(row('PC1', ia), row('PC2', ib), verdict);
        replay([...outBox.children]);
      };
      [a, b, p].forEach((i) => i.addEventListener('input', renderSn));
      qsa('[data-samenet-preset]', sn).forEach((btn) => btn.addEventListener('click', () => { b.value = btn.dataset.samenetPreset; renderSn(); }));
      renderSn();
    }

    /* ----- Punto 6: dos LAN /27 y tracert ----- */
    const t2net = qs('[data-t2-net]', t2);
    if (t2net) {
      const net = createNet(t2net, {
        width: 640, height: 230, label: 'LAN A y LAN B unidas por R1',
        zones: [{ x: 8, y: 8, w: 232, h: 214, label: 'LAN A · 172.16.49.0/27' }, { x: 400, y: 8, w: 232, h: 214, label: 'LAN B · 172.16.49.32/27' }],
        nodes: [
          { id: 'pc1', type: 'pc', x: 60, y: 150, label: 'PC1', sub: '.2' },
          { id: 'pc2', type: 'pc', x: 180, y: 160, label: 'PC2', sub: '.30' },
          { id: 's1', type: 'switch', x: 120, y: 90, label: 'S1' },
          { id: 'r1', type: 'router', x: 320, y: 110, label: 'R1', sub: '.1 · .33' },
          { id: 's2', type: 'switch', x: 520, y: 90, label: 'S2' },
          { id: 'pc4', type: 'pc', x: 580, y: 150, label: 'PC4', sub: '.62' },
          { id: 'pc5', type: 'pc', x: 460, y: 160, label: 'PC5', sub: 'DHCP' }
        ],
        links: [['pc1', 's1'], ['pc2', 's1'], ['s1', 'r1', { mid: 'Gig0/0/0' }], ['r1', 's2', { mid: 'Gig0/0/1' }], ['s2', 'pc4'], ['s2', 'pc5']]
      });
      const btn = qs('[data-t2-tracert]', t2);
      const out = qs('[data-t2-tracert-out]', t2);
      let busy = false;
      btn.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        btn.disabled = true;
        const lines = ['', 'C:\\>tracert 172.16.49.62', '', 'Tracing route to 172.16.49.62 over a maximum of 30 hops:', ''];
        out.textContent = lines.join('\n');
        const hopLines = { r1: '  1   0 ms   0 ms   0 ms   172.16.49.1', pc4: '  2   0 ms   0 ms   0 ms   172.16.49.62' };
        await net.send(['pc1', 's1', 'r1', 's2', 'pc4'], {
          label: 'TTL 1',
          onHop: async (i, id, handle) => {
            if (id === 'r1') { handle.setLabel('TTL 2'); lines.push(hopLines.r1); out.textContent = lines.join('\n'); await wait(260); }
            if (id === 'pc4') { lines.push(hopLines.pc4, '', 'Trace complete.'); out.textContent = lines.join('\n'); }
          }
        });
        btn.disabled = false;
        busy = false;
      });
    }

    /* ----- Punto 7: DHCP y APIPA ----- */
    const d2 = qs('[data-dhcp2]', t2);
    if (d2) {
      const cellsBox = qs('[data-dhcp2-cells]', d2);
      const steps = qsa('[data-step]', d2);
      const result = qs('[data-dhcp2-result]', d2);
      const server = qs('[data-dhcp2-server]', d2);
      const reqBtn = qs('[data-dhcp2-request]', d2);
      const resetBtn = qs('[data-dhcp2-reset]', d2);
      let leased = false;
      let busy = false;

      const buildCells = () => {
        cellsBox.replaceChildren();
        for (let i = 32; i <= 63; i += 1) {
          let cls = 'is-free';
          let tag = '';
          if (i === 32) { cls = 'is-net'; tag = 'red'; }
          else if (i === 63) { cls = 'is-net'; tag = 'bc'; }
          else if (i === 33) { cls = 'is-excluded'; tag = 'GW'; }
          else if (i <= 37) cls = 'is-excluded';
          const cell = h('div', `dcell ${cls}`, [h('b', '', `.${i}`), tag ? h('small', '', tag) : null]);
          cell.dataset.addr = String(i);
          cellsBox.append(cell);
        }
      };
      const reset = () => {
        leased = false;
        buildCells();
        steps.forEach((s) => { s.classList.remove('is-on', 'is-fail', 'is-done'); });
        result.className = 'dhcp2__result';
        result.textContent = server.checked ? 'PC5 aún no tiene dirección.' : 'El servidor está apagado: PC5 no podrá obtener una dirección de R1.';
        reqBtn.disabled = false;
      };
      const lightStep = async (name, fail = false) => {
        const li = steps.find((s) => s.dataset.step === name);
        li.classList.add(fail ? 'is-fail' : 'is-on');
        await wait(520);
        if (!fail) { li.classList.remove('is-on'); li.classList.add('is-done'); }
      };
      reqBtn.addEventListener('click', async () => {
        if (busy || leased) return;
        busy = true;
        reqBtn.disabled = true;
        steps.forEach((s) => s.classList.remove('is-on', 'is-fail', 'is-done'));
        result.className = 'dhcp2__result';
        result.textContent = 'PC5 busca un servidor DHCP…';
        await lightStep('discover');
        if (server.checked) {
          await lightStep('offer');
          const cell = qs('[data-addr="38"]', cellsBox);
          cell.classList.add('is-offered');
          await lightStep('request');
          await lightStep('ack');
          cell.classList.remove('is-offered', 'is-free');
          cell.classList.add('is-leased');
          cell.append(h('small', '', 'PC5'));
          leased = true;
          result.className = 'dhcp2__result is-ok';
          result.innerHTML = 'PC5 recibió <b>172.16.49.38/27</b> · máscara 255.255.255.224 · gateway 172.16.49.33. Las direcciones .33 a .37 estaban excluidas, por eso la primera libre es .38.';
        } else {
          await lightStep('offer', true);
          await wait(500);
          const a = 1 + Math.floor(Math.random() * 254);
          const b = 1 + Math.floor(Math.random() * 254);
          result.className = 'dhcp2__result is-warn';
          result.innerHTML = `Sin respuesta: PC5 se autoasigna <b>169.254.${a}.${b}/16</b> (APIPA), sin gateway. Solo podría hablar con vecinos del mismo segmento; no está bien configurada para la LAN B.`;
          reqBtn.disabled = false;
        }
        busy = false;
      });
      resetBtn.addEventListener('click', () => { if (!busy) reset(); });
      server.addEventListener('change', () => { if (!busy) reset(); });
      reset();
    }

    /* ----- Punto 8: TTL en vivo ----- */
    const tl = qs('[data-ttl-lab]', t2);
    if (tl) {
      const net = createNet(qs('[data-ttl-net]', tl), {
        width: 640, height: 190, label: 'PC1, R1 y PC4',
        nodes: [
          { id: 'pc1', type: 'pc', x: 90, y: 90, label: 'PC1', sub: '172.16.49.2' },
          { id: 'r1', type: 'router', x: 320, y: 90, label: 'R1', sub: '.1 · .33' },
          { id: 'pc4', type: 'pc', x: 550, y: 90, label: 'PC4', sub: '172.16.49.62' }
        ],
        links: [['pc1', 'r1', { mid: 'LAN A' }], ['r1', 'pc4', { mid: 'LAN B' }]]
      });
      const ttlValue = qs('[data-ttl-value]', tl);
      const mac = qs('[data-ttl-mac]', tl);
      const caption = qs('[data-ttl-caption]', tl);
      const btn = qs('[data-ttl-send]', tl);
      const ttlField = qs('[data-f="ttl"]', tl);
      const macField = qs('[data-f="mac"]', tl);
      const reset = () => { ttlValue.textContent = '255'; mac.textContent = 'PC1 → R1'; caption.textContent = 'El TTL parte en 255 al salir de PC1.'; ttlField.classList.remove('is-hit'); macField.classList.remove('is-hit'); };
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        reset();
        await net.send(['pc1', 'r1', 'pc4'], {
          label: 'TTL 255',
          onHop: async (i, id, handle) => {
            if (id === 'r1') {
              handle.setLabel('TTL 254');
              countTo(ttlValue, 254, { duration: 380 });
              ttlField.classList.add('is-hit');
              macField.classList.add('is-hit');
              mac.textContent = 'R1 → PC4';
              caption.textContent = 'R1 resta 1 al TTL y reemplaza las MAC; las IP no cambian.';
              await wait(700);
            }
            if (id === 'pc4') caption.textContent = 'Llegó con TTL 254. Origen 172.16.49.2 y destino 172.16.49.62 se conservaron.';
          }
        });
        btn.disabled = false;
        btn.textContent = 'Enviar de nuevo';
      });
    }
  }
})();
