/* ==============================
   NETLAB · Tercer corte — capa de red
   Simulador de enrutamiento, búsqueda de ruta, IPv6, EUI-64,
   laboratorio de fallas, OSPF y tarjeta animada de la portada.
================================ */
(() => {
  'use strict';
  const { qs, qsa, el, wait, reduceMotion, setActive, replay, typeLines, whileVisible, createNet, figures } = window.TC;
  const IP = window.IPCALC;

  const h = (tag, cls, children) => {
    const node = el(tag, cls);
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach((c) => {
      if (c === null || c === undefined) return;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  /* ==============================
     Topología compartida del taller de capa de red
  ================================ */
  const topoSpec = (opts = {}) => ({
    width: 720, height: 290, label: 'Topología: LAN1, R1, R2, LAN2 y LAN3',
    zones: [
      { x: 8, y: 10, w: 236, h: 270, label: 'LAN1 · 192.168.10.0/24' },
      { x: 482, y: 10, w: 230, h: 130, label: 'LAN2 · 192.168.20.0/24' },
      { x: 482, y: 150, w: 230, h: 130, label: 'LAN3 · 192.168.30.0/24' }
    ],
    nodes: [
      { id: 'pc0', type: 'pc', x: 62, y: 80, label: 'PC0', sub: '192.168.10.10' },
      { id: 'pc1', type: 'pc', x: 62, y: 205, label: 'PC1', sub: '192.168.10.20' },
      { id: 'sw0', type: 'switch', x: 168, y: 145, label: 'SW0' },
      { id: 'r1', type: 'router', x: 290, y: 145, label: 'R1', sub: '10.0.0.1' },
      { id: 'r2', type: 'router', x: 410, y: 145, label: 'R2', sub: '10.0.0.2' },
      { id: 'sw1', type: 'switch', x: 548, y: 80, label: 'SW1' },
      { id: 'pc2', type: 'pc', x: 656, y: 85, label: 'PC2', sub: '192.168.20.10' },
      { id: 'sw2', type: 'switch', x: 548, y: 215, label: 'SW2' },
      { id: 'pc3', type: 'pc', x: 656, y: 220, label: 'PC3', sub: '192.168.30.10' }
    ],
    links: [
      ['pc0', 'sw0'], ['pc1', 'sw0'], ['sw0', 'r1', { mid: 'G0/0' }], ['r1', 'r2', { mid: '10.0.0.0/30' }],
      ['r2', 'sw1', { mid: 'G0/1' }], ['r2', 'sw2', { mid: 'G0/2' }], ['sw1', 'pc2'], ['sw2', 'pc3']
    ],
    ...opts
  });

  const HOSTS = {
    pc0: { name: 'PC0', lan: 1, v4: '192.168.10.10', v6: '2001:DB8:ACAD:10::10', sw: 'sw0', gw: 'r1', gw4: '192.168.10.1', gwIf: 'R1 G0/0' },
    pc1: { name: 'PC1', lan: 1, v4: '192.168.10.20', v6: '2001:DB8:ACAD:10:206:2AFF:FEE7:3E35', sw: 'sw0', gw: 'r1', gw4: '192.168.10.1', gwIf: 'R1 G0/0' },
    pc2: { name: 'PC2', lan: 2, v4: '192.168.20.10', v6: '2001:DB8:ACAD:20::10', sw: 'sw1', gw: 'r2', gw4: '192.168.20.1', gwIf: 'R2 G0/1' },
    pc3: { name: 'PC3', lan: 3, v4: '192.168.30.10', v6: '2001:DB8:ACAD:30::10', sw: 'sw2', gw: 'r2', gw4: '192.168.30.1', gwIf: 'R2 G0/2' }
  };
  const ADJ = {
    pc0: ['sw0'], pc1: ['sw0'], sw0: ['pc0', 'pc1', 'r1'], r1: ['sw0', 'r2'], r2: ['r1', 'sw1', 'sw2'],
    sw1: ['r2', 'pc2'], sw2: ['r2', 'pc3'], pc2: ['sw1'], pc3: ['sw2']
  };
  const findPath = (from, to) => {
    const queue = [[from]];
    const seen = new Set([from]);
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (last === to) return path;
      (ADJ[last] || []).forEach((n) => { if (!seen.has(n)) { seen.add(n); queue.push([...path, n]); } });
    }
    return null;
  };
  const isRouter = (id) => id === 'r1' || id === 'r2';
  const LAN_NET = { 1: '192.168.10.0/24', 2: '192.168.20.0/24', 3: '192.168.30.0/24' };

  /** ¿Qué LAN conoce cada router según el modo de enrutamiento? */
  const known = (router, mode) => {
    if (router === 'r1') {
      const s = new Set([1]);
      if (mode === 'oneway' || mode === 'static' || mode === 'ospf') s.add(2);
      if (mode === 'static' || mode === 'ospf') s.add(3);
      return s;
    }
    const s = new Set([2, 3]);
    if (mode === 'static' || mode === 'ospf') s.add(1);
    return s;
  };

  /* ---------- Tablas de rutas ---------- */
  const routeTable = (router, mode, proto = 'v4') => {
    const rows = [];
    const add = (code, net, prefix, extra) => rows.push({ code, net, prefix, ...extra });
    if (proto === 'v4') {
      if (router === 'r1') {
        add('C', '10.0.0.0', 30, { text: 'is directly connected, GigabitEthernet0/1' });
        add('L', '10.0.0.1', 32, { text: 'is directly connected, GigabitEthernet0/1' });
        add('C', '192.168.10.0', 24, { text: 'is directly connected, GigabitEthernet0/0' });
        add('L', '192.168.10.1', 32, { text: 'is directly connected, GigabitEthernet0/0' });
        if (mode === 'oneway') add('S', '192.168.20.0', 24, { text: '[1/0] via 10.0.0.2' });
        if (mode === 'static') {
          add('S', '192.168.20.0', 24, { text: '[1/0] via 10.0.0.2' });
          add('S', '192.168.30.0', 24, { text: '[1/0] via 10.0.0.2' });
        }
        if (mode === 'ospf') {
          add('O', '192.168.20.0', 24, { text: '[110/2] via 10.0.0.2, 00:01:05, GigabitEthernet0/1' });
          add('O', '192.168.30.0', 24, { text: '[110/2] via 10.0.0.2, 00:01:05, GigabitEthernet0/1' });
        }
      } else {
        add('C', '10.0.0.0', 30, { text: 'is directly connected, GigabitEthernet0/0' });
        add('L', '10.0.0.2', 32, { text: 'is directly connected, GigabitEthernet0/0' });
        add('C', '192.168.20.0', 24, { text: 'is directly connected, GigabitEthernet0/1' });
        add('L', '192.168.20.1', 32, { text: 'is directly connected, GigabitEthernet0/1' });
        add('C', '192.168.30.0', 24, { text: 'is directly connected, GigabitEthernet0/2' });
        add('L', '192.168.30.1', 32, { text: 'is directly connected, GigabitEthernet0/2' });
        if (mode === 'static') {
          add('S', '192.168.10.0', 24, { text: '[1/0] via 10.0.0.1' });
          add('S*', '0.0.0.0', 0, { text: '[1/0] via 10.0.0.1' });
        }
        if (mode === 'ospf') add('O', '192.168.10.0', 24, { text: '[110/2] via 10.0.0.1, 00:01:05, GigabitEthernet0/0' });
      }
    } else if (router === 'r1') {
      add('C', '2001:DB8:ACAD:10::', 64, { text: 'via GigabitEthernet0/0, directly connected', p64: '2001:DB8:ACAD:0010' });
      add('C', '2001:DB8:ACAD:100::', 64, { text: 'via GigabitEthernet0/1, directly connected', p64: '2001:DB8:ACAD:0100' });
      if (mode === 'oneway' || mode === 'static' || mode === 'ospf') add('S', '2001:DB8:ACAD:20::', 64, { text: '[1/0] via 2001:DB8:ACAD:100::2', p64: '2001:DB8:ACAD:0020' });
      if (mode === 'static' || mode === 'ospf') add('S', '2001:DB8:ACAD:30::', 64, { text: '[1/0] via 2001:DB8:ACAD:100::2', p64: '2001:DB8:ACAD:0030' });
    } else {
      add('C', '2001:DB8:ACAD:20::', 64, { text: 'via GigabitEthernet0/1, directly connected', p64: '2001:DB8:ACAD:0020' });
      add('C', '2001:DB8:ACAD:30::', 64, { text: 'via GigabitEthernet0/2, directly connected', p64: '2001:DB8:ACAD:0030' });
      add('C', '2001:DB8:ACAD:100::', 64, { text: 'via GigabitEthernet0/0, directly connected', p64: '2001:DB8:ACAD:0100' });
      if (mode === 'static' || mode === 'ospf') add('S', '2001:DB8:ACAD:10::', 64, { text: '[1/0] via 2001:DB8:ACAD:100::1', p64: '2001:DB8:ACAD:0010' });
    }
    return rows;
  };

  const renderRoutes = (box, rows, { title, hitIndex = -1, note } = {}) => {
    box.replaceChildren();
    box.append(h('div', 'route-table__title', title));
    const list = h('ol', 'route-table__list');
    rows.forEach((r, i) => {
      const li = h('li', `${i === hitIndex ? 'is-hit' : ''}`, [
        h('b', `code code--${r.code.replace('*', 'star')}`, r.code),
        h('span', 'net', `${r.net}/${r.prefix}`),
        h('span', 'txt', r.text)
      ]);
      list.append(li);
    });
    if (!rows.some((r) => r.code === 'S' || r.code === 'S*' || r.code === 'O')) list.append(h('li', 'is-empty', 'Sin rutas hacia redes remotas'));
    box.append(list);
    if (note) box.append(h('p', 'route-table__note', note));
    replay([...list.children]);
  };

  /* ==============================
     Simulador de enrutamiento
  ================================ */
  const ns = qs('[data-netsim]');
  if (ns) {
    const net = createNet(qs('[data-ns-net]', ns), topoSpec());
    const srcSel = qs('[data-ns-src]', ns);
    const dstSel = qs('[data-ns-dst]', ns);
    const sendBtn = qs('[data-ns-send]', ns);
    const status = qs('[data-ns-status]', ns);
    const routesBox = qs('[data-ns-routes]', ns);
    const logBox = qs('[data-ns-log]', ns);
    const arpToggle = qs('[data-ns-arp]', ns);
    const protoBtns = qsa('[data-proto]', ns);
    const routingBtns = qsa('[data-routing]', ns);
    const f = {
      hop: qs('[data-ns-hop]', ns), ttl: qs('[data-ns-ttl]', ns), ttlLabel: qs('[data-ns-ttl-label]', ns),
      sip: qs('[data-ns-sip]', ns), dip: qs('[data-ns-dip]', ns), smac: qs('[data-ns-smac]', ns), dmac: qs('[data-ns-dmac]', ns), note: qs('[data-ns-note]', ns)
    };
    const st = { proto: 'v4', routing: 'static', busy: false, tab: 'r1' };
    let tabsEl = null;

    Object.entries(HOSTS).forEach(([id, host]) => {
      srcSel.append(new Option(`${host.name} · ${host.v4}`, id));
      dstSel.append(new Option(`${host.name} · ${host.v4}`, id));
    });
    srcSel.value = 'pc0';
    dstSel.value = 'pc2';

    const addr = (id) => (st.proto === 'v4' ? HOSTS[id].v4 : HOSTS[id].v6);
    const log = (text, cls = '') => {
      const li = h('li', cls, text);
      logBox.append(li);
      logBox.scrollTop = logBox.scrollHeight;
    };
    const setField = (key, value) => { f[key].textContent = value; };
    const flashFields = () => replay(qsa('.inspector dl > div', ns), false);

    const showRoutes = (router, hit) => {
      const rows = routeTable(router, st.routing, st.proto);
      let hitIndex = -1;
      if (hit) {
        if (st.proto === 'v4') {
          const best = IP.longestPrefixMatch(rows.map((r) => ({ ...r, network: r.net })), hit);
          hitIndex = best ? rows.indexOf(rows.find((r) => r.net === best.net && r.prefix === best.prefix)) : -1;
        } else {
          const groups = IP.expand6(hit);
          const key = groups ? groups.slice(0, 4).join(':') : '';
          hitIndex = rows.findIndex((r) => r.p64 === key);
        }
      }
      st.tab = router;
      if (tabsEl) qsa('button', tabsEl).forEach((b) => b.classList.toggle('is-active', b.textContent.toLowerCase() === router));
      renderRoutes(routesBox, rows, {
        title: `${router.toUpperCase()}#show ${st.proto === 'v4' ? 'ip' : 'ipv6'} route`,
        hitIndex,
        note: st.proto === 'v6' && st.routing === 'ospf' ? 'OSPFv2 cubre solo IPv4: las rutas IPv6 se mantuvieron estáticas.' : undefined
      });
    };

    const macs = (path, i, src, dst) => {
      // Valores observados en el informe para PC0 → PC2 (IPv4); en los demás casos se indica el enlace
      const real = src === 'pc0' && dst === 'pc2' && st.proto === 'v4';
      const hopId = path[i];
      const nextId = path[i + 1];
      const label = (id, side) => {
        if (id === 'pc0' || id === 'pc1' || id === 'pc2' || id === 'pc3') return `${HOSTS[id].name} Fa0`;
        if (isRouter(id)) return `${id.toUpperCase()} ${side}`;
        return id.toUpperCase();
      };
      if (real) {
        if (hopId === 'r1') return ['0090.0C42.4102', '0090.2128.5B01', 'valores observados en el informe'];
        if (hopId === 'r2') return ['0090.2128.5B02', '0001.64E1.D1D1', 'valores observados en el informe'];
      }
      return [label(hopId, 'salida'), nextId ? label(nextId, 'entrada') : '—', real ? '' : 'enlace indicado (el informe no registra estas MAC)'];
    };

    const run = async () => {
      if (st.busy) return;
      const src = srcSel.value;
      const dst = dstSel.value;
      if (src === dst) { status.textContent = 'Elige un destino distinto del origen.'; return; }
      st.busy = true;
      sendBtn.disabled = true;
      logBox.replaceChildren();
      net.clearStates();
      const path = findPath(src, dst);
      const proto = st.proto;
      const hostS = HOSTS[src];
      const hostD = HOSTS[dst];
      f.ttlLabel.textContent = proto === 'v4' ? 'TTL' : 'Hop Limit';
      setField('sip', addr(src));
      setField('dip', addr(dst));
      const routersInPath = path.filter(isRouter);
      const crosses = routersInPath.length > 0;

      // ¿Dónde se corta? (ida y regreso)
      let blockFwd = -1;
      let blockBack = -1;
      routersInPath.forEach((r) => {
        const idx = path.indexOf(r);
        if (blockFwd < 0 && !known(r, st.routing).has(hostD.lan) && hostD.lan !== hostS.lan) blockFwd = idx;
      });
      if (blockFwd < 0) {
        [...routersInPath].reverse().forEach((r) => {
          const idx = path.indexOf(r);
          if (blockBack < 0 && !known(r, st.routing).has(hostS.lan)) blockBack = idx;
        });
      }

      status.textContent = `${hostS.name} → ${hostD.name} (${proto === 'v4' ? 'IPv4' : 'IPv6'})`;
      log(`${hostS.name} genera la solicitud ${proto === 'v4' ? 'ICMP' : 'ICMPv6'} hacia ${addr(dst)}.`);

      // ARP / Neighbor Discovery
      if (arpToggle.checked && crosses) {
        const gw = hostS.gw;
        const proto2 = proto === 'v4' ? 'ARP' : 'Neighbor Solicitation';
        log(`${hostS.name}: el destino está en otra red; ${proto2} pregunta por la MAC de su gateway ${proto === 'v4' ? hostS.gw4 : 'FE80::1'}.`, 'is-arp');
        f.hop.textContent = proto2;
        setField('ttl', '—');
        setField('smac', `${hostS.name} Fa0`);
        setField('dmac', 'FFFF.FFFF.FFFF (broadcast)');
        f.note.textContent = 'La solicitud se envía por broadcast; solo el gateway responde.';
        flashFields();
        await net.send([src, hostS.sw, gw], { color: 'amber', label: proto2 === 'ARP' ? 'ARP' : 'NS' });
        log(`${hostS.sw.toUpperCase()}: difunde la solicitud por todos sus puertos.`, 'is-arp');
        const other = Object.keys(HOSTS).find((id) => HOSTS[id].sw === hostS.sw && id !== src);
        if (other) log(`${HOSTS[other].name}: recibe una solicitud que no le corresponde y la descarta.`, 'is-arp');
        log(`${gw.toUpperCase()}: recibe la solicitud dirigida a su dirección y responde.`, 'is-arp');
        await net.send([gw, hostS.sw, src], { color: 'amber', label: proto2 === 'ARP' ? 'ARP reply' : 'NA' });
        log(`${hostS.sw.toUpperCase()}: la respuesta regresa a ${hostS.name}; ya se conoce la MAC del gateway.`, 'is-arp');
      }

      const startTtl = 255;
      const lastIndex = blockFwd >= 0 ? blockFwd : path.length - 1;
      const walk = path.slice(0, lastIndex + 1);
      let routersCrossed = 0;
      let outcome = 'ok';

      const onHop = async (i, id, handle, flags = {}) => {
        const dev = isRouter(id) ? id.toUpperCase() : id.startsWith('pc') ? HOSTS[id].name : id.toUpperCase();
        if (isRouter(id) && i > 0 && !flags.blocked && !flags.stopped) routersCrossed += 1;
        const ttl = startTtl - (isRouter(id) ? routersCrossed : routersCrossed);
        const shown = proto === 'v4' ? String(ttl) : routersCrossed === 0 ? 'n' : `n − ${routersCrossed}`;
        f.hop.textContent = `Saliendo de ${dev}`;
        setField('ttl', shown);
        const [sm, dm, note] = macs(path, i, src, dst);
        setField('smac', sm);
        setField('dmac', dm);
        f.note.textContent = note ? `MAC: ${note}.${proto === 'v6' ? ' El informe no registra el valor numérico del Hop Limit.' : ''}` : '';
        handle.setLabel(proto === 'v4' ? `TTL ${ttl}` : `HL n${routersCrossed ? `−${routersCrossed}` : ''}`);
        flashFields();
        if (isRouter(id) && i > 0) {
          showRoutes(id, addr(dst));
          if (!flags.blocked && !flags.stopped) log(`${dev}: consulta su tabla de rutas y reenvía; ${proto === 'v4' ? `TTL ${ttl}` : 'Hop Limit − 1'}.`);
        } else if (i > 0 && id === dst) {
          log(`${dev}: recibe la solicitud ${proto === 'v4' ? `con TTL ${ttl}` : ''}.`.replace(' .', '.'));
        }
        if (flags.stopped || flags.blocked) outcome = 'blocked';
      };

      await net.send(walk, { label: proto === 'v4' ? `TTL ${startTtl}` : 'HL n', stopAt: blockFwd >= 0 ? blockFwd : undefined, onHop });

      if (blockFwd >= 0) {
        const r = path[blockFwd];
        const lan = HOSTS[dst].lan;
        showRoutes(r, addr(dst));
        log(`${r.toUpperCase()} no tiene ruta hacia ${LAN_NET[lan]}: descarta el paquete.`, 'is-bad');
        log(`${r.toUpperCase()} devuelve «Destination host unreachable» a ${hostS.name}.`, 'is-bad');
        status.textContent = `Falla: ${r.toUpperCase()} no conoce la red ${LAN_NET[lan]}. Destination host unreachable.`;
        f.note.textContent = `${r.toUpperCase()} no encontró una ruta que coincida y envió un mensaje ICMP de destino inalcanzable.`;
        const back = path.slice(0, blockFwd + 1).reverse();
        await net.send(back, { color: 'red', label: 'Unreachable' });
      } else {
        // Respuesta
        const rev = [...path].reverse();
        log(`${hostD.name} responde.`, 'is-ok');
        if (blockBack >= 0) {
          const walkBack = rev.slice(0, rev.indexOf(path[blockBack]) + 1);
          await net.send(walkBack, { color: 'green', label: 'Reply', stopAt: walkBack.length - 1 });
          const r = path[blockBack];
          showRoutes(r, addr(src));
          log(`${r.toUpperCase()} no tiene ruta de regreso hacia ${LAN_NET[hostS.lan]}: la respuesta se pierde.`, 'is-bad');
          status.textContent = `La solicitud llegó, pero ${r.toUpperCase()} no tiene ruta de regreso a ${LAN_NET[hostS.lan]}: Request timed out.`;
          f.note.textContent = 'Que exista ruta de ida no garantiza la conectividad: la respuesta también debe poder volver.';
          outcome = 'noreturn';
        } else {
          await net.send(rev, { color: 'green', label: proto === 'v4' ? `TTL ${128 - routersInPath.length}` : 'Reply' });
          log(`${hostS.name} recibe la respuesta: comunicación completa.`, 'is-ok');
          status.textContent = crosses
            ? `Comunicación completa. El paquete cruzó ${routersInPath.length} ${routersInPath.length === 1 ? 'router' : 'routers'} y el TTL de la respuesta fue ${128 - routersInPath.length}.`
            : 'Comunicación completa dentro de la misma LAN: el switch reenvía la trama y no interviene ningún router.';
        }
      }
      void outcome;
      st.busy = false;
      sendBtn.disabled = false;
    };

    sendBtn.addEventListener('click', run);
    protoBtns.forEach((b) => b.addEventListener('click', () => { st.proto = b.dataset.proto; setActive(protoBtns, b); showRoutes(st.tab); }));
    routingBtns.forEach((b) => b.addEventListener('click', () => { st.routing = b.dataset.routing; setActive(routingBtns, b); showRoutes(st.tab); status.textContent = { none: 'Sin rutas: cada router solo conoce sus redes conectadas.', oneway: 'Solo ida: R1 conoce LAN2, pero R2 no tiene la ruta de regreso a LAN1.', static: 'Rutas estáticas en ambos sentidos y ruta por defecto en R2.', ospf: 'OSPF: los routers aprenden las redes IPv4 entre sí (código O, [110/2]).' }[st.routing]; }));
    [srcSel, dstSel].forEach((s) => s.addEventListener('change', () => { net.cancel(); }));
    showRoutes('r1');

    // Pestañas de router bajo la tabla
    const tabs = h('div', 'route-tabs');
    tabsEl = tabs;
    ['r1', 'r2'].forEach((r) => {
      const b = h('button', `chip-button ${r === 'r1' ? 'is-active' : ''}`, r.toUpperCase());
      b.type = 'button';
      b.addEventListener('click', () => { qsa('button', tabs).forEach((x) => x.classList.toggle('is-active', x === b)); showRoutes(r); });
      tabs.append(b);
    });
    routesBox.before(tabs);
  }

  /* ==============================
     Búsqueda de la ruta más específica
  ================================ */
  const lk = qs('[data-lookup]');
  if (lk) {
    const input = qs('[data-lookup-ip]', lk);
    const tableBox = qs('[data-lookup-table]', lk);
    const verdict = qs('[data-lookup-verdict]', lk);
    const modeBtns = qsa('[data-default]', lk);
    let withDefault = true;

    const render = () => {
      const rows = routeTable('r2', 'static', 'v4').filter((r) => withDefault || r.code !== 'S*');
      const ip = input.value.trim();
      const parsed = IP.parseIp(ip);
      let hitIndex = -1;
      let best = null;
      if (parsed.ok) {
        best = IP.longestPrefixMatch(rows.map((r) => ({ ...r, network: r.net })), ip);
        if (best) hitIndex = rows.findIndex((r) => r.net === best.net && r.prefix === best.prefix);
      }
      renderRoutes(tableBox, rows, { title: 'R2#show ip route', hitIndex });
      verdict.className = 'lookup__verdict';
      if (!parsed.ok) { verdict.textContent = 'Escribe una dirección IPv4 válida.'; verdict.classList.add('is-bad'); return; }
      if (!best) {
        verdict.textContent = `Ninguna entrada coincide con ${ip}: R2 descarta el paquete y responde «Destination host unreachable».`;
        verdict.classList.add('is-bad');
      } else if (best.code === 'S*') {
        verdict.textContent = `Solo coincide la ruta por defecto S* 0.0.0.0/0: R2 envía el paquete a 10.0.0.1. Ojo: eso no garantiza que R1 conozca ${ip}; si no lo conoce, lo descartará.`;
        verdict.classList.add('is-warn');
      } else if (best.code === 'L') {
        verdict.textContent = `${ip} es una dirección local de R2 (código L, /32): el paquete es para el propio router.`;
        verdict.classList.add('is-ok');
      } else {
        verdict.textContent = `Coincide con ${best.net}/${best.prefix} (${best.code}): R2 usa esa entrada, la de prefijo más largo.`;
        verdict.classList.add('is-ok');
      }
    };
    input.addEventListener('input', render);
    qsa('[data-lookup-preset]', lk).forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.lookupPreset; render(); }));
    modeBtns.forEach((b) => b.addEventListener('click', () => { withDefault = b.dataset.default === '1'; setActive(modeBtns, b); render(); }));
    render();
  }

  /* ==============================
     IPv6: abreviar y expandir
  ================================ */
  const v6 = qs('[data-ipv6]');
  if (v6) {
    const input = qs('[data-v6-input]', v6);
    const groupsBox = qs('[data-v6-groups]', v6);
    const full = qs('[data-v6-full]', v6);
    const trim = qs('[data-v6-trim]', v6);
    const short = qs('[data-v6-short]', v6);
    const err = qs('[data-v6-error]', v6);
    const presetsBox = qs('[data-v6-presets]', v6);
    const examples = [
      ['2001:0DB8:ACAD:0010:0000:0000:0000:0001', '→ 2001:DB8:ACAD:10::1'],
      ['FE80:0000:0000:0000:0000:0000:0000:0001', '→ FE80::1'],
      ['2001:DB8:ACAD:100::2', 'expandir'],
      ['2001:DB8:ACAD:10:206:2AFF:FEE7:3E35', 'SLAAC']
    ];
    const render = () => {
      const groups = IP.expand6(input.value);
      if (!groups) {
        err.hidden = false;
        err.textContent = 'Dirección IPv6 no válida: ocho grupos de hasta cuatro dígitos hexadecimales, con un solo «::» como máximo.';
        return;
      }
      err.hidden = true;
      const trimmed = IP.trimGroups(groups);
      // racha más larga de ceros
      let bs = -1; let bl = 0;
      for (let i = 0; i < 8;) { if (trimmed[i] !== '0') { i += 1; continue; } let j = i; while (j < 8 && trimmed[j] === '0') j += 1; if (j - i > bl) { bs = i; bl = j - i; } i = j; }
      if (bl < 2) { bs = -1; bl = 0; }
      groupsBox.replaceChildren();
      groups.forEach((g, i) => {
        const inRun = bs >= 0 && i >= bs && i < bs + bl;
        const box = h('div', `v6g ${inRun ? 'is-run' : ''}`, [h('small', '', `${i + 1}`), h('b', '', g), h('span', '', trimmed[i])]);
        box.style.setProperty('--i', String(i));
        groupsBox.append(box);
      });
      replay([...groupsBox.children], false);
      full.textContent = groups.join(':');
      trim.textContent = trimmed.join(':');
      short.textContent = IP.compress6(groups);
    };
    examples.forEach(([addr, note]) => {
      const b = h('button', 'chip-button', [addr.length > 24 ? `${addr.slice(0, 22)}…` : addr, h('small', '', ` ${note}`)]);
      b.type = 'button';
      b.title = addr;
      b.addEventListener('click', () => { input.value = addr; render(); });
      presetsBox.append(b);
    });
    input.addEventListener('input', render);
    render();
  }

  /* ==============================
     EUI-64 y SLAAC
  ================================ */
  const eui = qs('[data-eui]');
  if (eui) {
    const input = qs('[data-eui-input]', eui);
    const steps = qs('[data-eui-steps]', eui);
    const idOut = qs('[data-eui-id]', eui);
    const globalOut = qs('[data-eui-global]', eui);
    const linkOut = qs('[data-eui-link]', eui);
    const err = qs('[data-eui-error]', eui);
    const presetsBox = qs('[data-eui-presets]', eui);
    const examples = [['0006.2AE7.3E35', 'PC1 reconstruido'], ['0040.0B72.9095', 'primera topología']];
    const byteRow = (title, bytes, hi = []) => h('div', 'eui__row', [h('span', 'eui__title', title), h('div', 'eui__bytes', bytes.map((b, i) => h('i', hi.includes(i) ? 'is-hi' : '', b)))]);
    const render = () => {
      const r = IP.eui64(input.value);
      if (!r) {
        err.hidden = false;
        err.textContent = 'Escribe una MAC de 12 dígitos hexadecimales, por ejemplo 0006.2AE7.3E35 o 00:06:2A:E7:3E:35.';
        return;
      }
      err.hidden = true;
      steps.replaceChildren(
        byteRow('1 · MAC de 48 bits', r.bytes, [0]),
        byteRow('2 · Insertar FFFE en el centro', r.withFffe.map((b, i) => (i === 0 ? r.firstBefore : b)), [3, 4]),
        h('div', 'eui__row', [
          h('span', 'eui__title', '3 · Invertir el séptimo bit del primer byte'),
          h('div', 'eui__flip', [
            h('code', '', `${r.firstBefore} = ${parseInt(r.firstBefore, 16).toString(2).padStart(8, '0').slice(0, 6)}`),
            h('i', 'bitflip', parseInt(r.firstBefore, 16).toString(2).padStart(8, '0')[6]),
            h('code', '', parseInt(r.firstBefore, 16).toString(2).padStart(8, '0')[7]),
            h('span', 'arrow', '→'),
            h('code', '', `${r.flippedFirst} = ${parseInt(r.flippedFirst, 16).toString(2).padStart(8, '0').slice(0, 6)}`),
            h('i', 'bitflip is-new', parseInt(r.flippedFirst, 16).toString(2).padStart(8, '0')[6]),
            h('code', '', parseInt(r.flippedFirst, 16).toString(2).padStart(8, '0')[7])
          ])
        ])
      );
      replay([...steps.children]);
      idOut.textContent = r.id;
      globalOut.textContent = `2001:DB8:ACAD:10:${r.id}`;
      linkOut.textContent = `FE80::${r.id}`;
    };
    examples.forEach(([mac, note]) => {
      const b = h('button', 'chip-button', [mac, h('small', '', ` ${note}`)]);
      b.type = 'button';
      b.addEventListener('click', () => { input.value = mac; render(); });
      presetsBox.append(b);
    });
    input.addEventListener('input', render);
    render();
  }

  /* ==============================
     Laboratorio de fallas
  ================================ */
  const fl = qs('[data-faultlab]');
  if (fl) {
    const list = qs('[data-fl-list]', fl);
    const net = createNet(qs('[data-fl-net]', fl), topoSpec());
    const stateBox = qs('[data-fl-state]', fl);
    const panel = qs('[data-fl-panel]', fl);
    const out = qs('[data-fl-out]', fl);
    const termTitle = qs('[data-fl-term-title]', fl);
    const lesson = qs('[data-fl-lesson]', fl);
    const lessonText = qs('[data-fl-lesson-text]', fl);
    const lessonFig = qs('[data-fl-figure]', fl);
    const stepBtns = qsa('[data-fl-step]', fl);
    const ping = (target, mode, from) => {
      const o = ['', `C:\\>ping ${target}`, '', `Pinging ${target} with 32 bytes of data:`, ''];
      if (mode.startsWith('ok')) {
        const ttl = mode.split(':')[1] || '126';
        for (let i = 0; i < 4; i += 1) o.push(`Reply from ${target}: bytes=32 time<1ms TTL=${ttl}`);
        o.push('', `Ping statistics for ${target}:`, '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
      } else if (mode === 'unreach') {
        for (let i = 0; i < 4; i += 1) o.push(`Reply from ${from}: Destination host unreachable.`);
        o.push('', `Ping statistics for ${target}:`, '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),');
      } else {
        for (let i = 0; i < 4; i += 1) o.push('Request timed out.');
        o.push('', `Ping statistics for ${target}:`, '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),');
      }
      return o;
    };
    const ipconfig = (gw, mask) => ['', 'C:\\>ipconfig', '', 'FastEthernet0 Connection:(default port)', '', '   Connection-specific DNS Suffix..:', '   IPv4 Address....................: 192.168.10.10', `   Subnet Mask.....................: ${mask}`, `   Default Gateway.................: ${gw}`];
    const ipconfig2 = (mask) => ['', 'C:\\>ipconfig', '', 'FastEthernet0 Connection:(default port)', '', '   IPv4 Address....................: 192.168.10.20', `   Subnet Mask.....................: ${mask}`, '   Default Gateway.................: 192.168.10.1'];
    const brief = (r1g1, extra = '') => ['', 'R1#show ip interface brief', 'Interface              IP-Address      OK? Method Status                Protocol', 'GigabitEthernet0/0     192.168.10.1    YES manual up                    up', `GigabitEthernet0/1     10.0.0.1        YES manual ${r1g1}`, 'GigabitEthernet0/2     unassigned      YES unset  administratively down down', extra].filter((x, i) => i < 6 || x);
    const r2route = (opts) => ['', 'R2#show ip route', 'Codes: C - connected, S - static, O - OSPF, * - candidate default', '', ...(opts.defaultRoute ? ['Gateway of last resort is 10.0.0.1 to network 0.0.0.0', ''] : ['Gateway of last resort is not set', '']),
      '     10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks', 'C       10.0.0.0/30 is directly connected, GigabitEthernet0/0', 'L       10.0.0.2/32 is directly connected, GigabitEthernet0/0',
      ...(opts.specific ? ['S    192.168.10.0/24 [1/0] via 10.0.0.1'] : []),
      '     192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks', 'C       192.168.20.0/24 is directly connected, GigabitEthernet0/1', 'L       192.168.20.1/32 is directly connected, GigabitEthernet0/1',
      ...(opts.defaultRoute ? ['S*   0.0.0.0/0 [1/0] via 10.0.0.1'] : [])];

    const faults = [
      {
        id: 1, title: 'Interfaz apagada', short: 'shutdown en R1 G0/1', fig: 'cr-falla1', host: 'PC0',
        symptom: 'Desde PC0 no se alcanza nada de LAN2.',
        injectCmd: 'R1(config)# interface gigabitEthernet 0/1\nR1(config-if)# shutdown',
        apply(s) { net.setLink('r1', 'r2', 'down'); net.setNode('r1', 'warn'); s.chips = ['R1 G0/1: administratively down', 'Enlace R1 ↔ R2 sin tráfico']; },
        cmds: [
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: () => ({ lines: ping('192.168.20.10', 'unreach', '192.168.10.1'), path: ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], fail: { at: 'r1', back: 'red' } }) },
          { id: 'ping-local', label: 'ping 192.168.10.20', run: () => ({ lines: ping('192.168.10.20', 'ok:128'), path: ['pc0', 'sw0', 'pc1'], ok: true }) },
          { id: 'brief', label: 'show ip interface brief (R1)', run: () => ({ lines: brief('administratively down down'), term: 'R1 · CLI' }) }
        ],
        fix: { label: 'no shutdown en R1 G0/1', options: ['no shutdown en R1 G0/1', 'Cambiar el cable por uno cruzado', 'Cambiar la máscara de PC0'], correct: 0 },
        clear(s) { net.setLink('r1', 'r2', 'up'); net.setNode('r1', ''); s.chips = []; },
        lesson: 'Una interfaz con shutdown aparece administratively down/down y no intercambia tráfico. show ip interface brief lo muestra de inmediato; no shutdown la habilita. El mismo olvido explica un router en rojo recién conectado.'
      },
      {
        id: 2, title: 'Gateway incorrecto', short: 'PC0 con gateway 192.168.10.99', fig: 'cr-falla2', host: 'PC0',
        symptom: 'LAN1 responde, LAN2 no.',
        injectCmd: 'PC0 · IP Configuration\nDefault Gateway: 192.168.10.99',
        apply(s) { net.setNode('pc0', 'warn'); s.gw = '192.168.10.99'; s.chips = ['PC0: gateway 192.168.10.99 (no existe)']; },
        cmds: [
          { id: 'ping-local', label: 'ping 192.168.10.20', run: () => ({ lines: ping('192.168.10.20', 'ok:128'), path: ['pc0', 'sw0', 'pc1'], ok: true }) },
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: () => ({ lines: ping('192.168.20.10', 'timeout'), path: ['pc0', 'sw0'], fail: { at: 'sw0', back: null } }) },
          { id: 'ipconfig', label: 'ipconfig (PC0)', run: (s) => ({ lines: ipconfig(s.gw || '192.168.10.99', '255.255.255.0'), term: 'PC0 · Command Prompt' }) }
        ],
        fix: { label: 'Restituir el gateway 192.168.10.1', options: ['Restituir el gateway 192.168.10.1', 'Ejecutar no shutdown en R2', 'Agregar una ruta estática en R1'], correct: 0 },
        clear(s) { net.setNode('pc0', ''); s.gw = null; s.chips = []; },
        lesson: 'Con el gateway equivocado, el PC alcanza su propia LAN pero no puede entregar nada fuera de ella. La pista es que el ping local funciona y el remoto no: ipconfig revela la dirección incorrecta.'
      },
      {
        id: 3, title: 'Máscara incorrecta', short: 'PC1 con máscara 255.255.0.0', fig: 'cr-falla3', host: 'PC1', surprise: true,
        symptom: 'No hay síntoma: todo sigue respondiendo.',
        injectCmd: 'PC1 · IP Configuration\nSubnet Mask: 255.255.0.0',
        apply(s) { net.setNode('pc1', 'warn'); s.mask = '255.255.0.0'; s.chips = ['PC1: máscara 255.255.0.0 (debería ser 255.255.255.0)']; },
        cmds: [
          { id: 'ping-gw', label: 'ping 192.168.10.1', run: () => ({ lines: ping('192.168.10.1', 'ok:255'), path: ['pc1', 'sw0', 'r1'], ok: true }) },
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: () => ({ lines: ping('192.168.20.10', 'ok:126'), path: ['pc1', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], ok: true }) },
          { id: 'ipconfig', label: 'ipconfig (PC1)', run: (s) => ({ lines: ipconfig2(s.mask || '255.255.0.0'), term: 'PC1 · Command Prompt' }) }
        ],
        fix: { label: 'Restituir la máscara 255.255.255.0', options: ['Restituir la máscara 255.255.255.0', 'No hace falta corregir nada', 'Apagar la interfaz de R1'], correct: 0 },
        clear(s) { net.setNode('pc1', ''); s.mask = null; s.chips = []; },
        lesson: 'Aquí los ping respondieron aunque la máscara es incorrecta. El informe sugiere Proxy ARP, pero no lo verificó en el router. Que un ping funcione no demuestra que la configuración sea correcta: ipconfig sí muestra el error.'
      },
      {
        id: 4, title: 'Ruta de retorno eliminada', short: 'R2 sin ruta hacia LAN1', fig: 'cr-falla4', host: 'PC0', stages: 2,
        symptom: 'Al quitar solo la ruta específica no pasa nada… todavía.',
        injectCmd: ['R2(config)# no ip route 192.168.10.0 255.255.255.0 10.0.0.1', 'R2(config)# no ip route 0.0.0.0 0.0.0.0 10.0.0.1'],
        stageLabels: ['Quitar la ruta específica a LAN1', 'Quitar también la ruta por defecto'],
        apply(s, stage) {
          s.stage = stage;
          if (stage >= 2) { net.setNode('r2', 'warn'); s.chips = ['R2 sin ruta específica ni por defecto hacia LAN1']; } else { s.chips = ['R2 sin ruta específica; conserva la ruta por defecto S*']; }
        },
        cmds: [
          { id: 'route', label: 'show ip route (R2)', run: (s) => ({ lines: r2route({ specific: false, defaultRoute: (s.stage || 0) < 2 }), term: 'R2 · CLI' }) },
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: (s) => (((s.stage || 0) < 2)
            ? { lines: ping('192.168.20.10', 'ok:126'), path: ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], ok: true }
            : { lines: ping('192.168.20.10', 'timeout'), path: ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], fail: { back: 'noreturn', at: 'r2' } }) }
        ],
        fix: { label: 'Restaurar la ruta a LAN1 y la ruta por defecto en R2', options: ['Restaurar la ruta a LAN1 y la ruta por defecto en R2', 'Quitar la ruta estática de R1', 'Cambiar el gateway de PC2'], correct: 0 },
        clear(s) { net.setNode('r2', ''); s.stage = 0; s.chips = []; },
        lesson: 'La ruta por defecto escondió la falta de la ruta específica hasta que se retiró. Con ambas fuera, la solicitud llega a LAN2 pero la respuesta no encuentra camino de regreso: «el ping llega, pero no vuelve». show ip route en R2 lo delata.'
      },
      {
        id: 5, title: 'IPv6 sin reenvío', short: 'no ipv6 unicast-routing en R2', fig: 'cr-falla5', host: 'PC0',
        symptom: 'IPv4 funciona; IPv6 no atraviesa R2.',
        injectCmd: 'R2(config)# no ipv6 unicast-routing',
        apply(s) { net.setNode('r2', 'warn'); s.chips = ['R2: reenvío IPv6 desactivado', 'IPv4 sin cambios']; },
        cmds: [
          { id: 'ping-v6', label: 'ping 2001:DB8:ACAD:20::10', run: () => ({ lines: ping('2001:DB8:ACAD:20::10', 'timeout'), path: ['pc0', 'sw0', 'r1', 'r2'], fail: { at: 'r2', back: null, proto: 'v6' } }) },
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: () => ({ lines: ping('192.168.20.10', 'ok:126'), path: ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], ok: true }) },
          { id: 'route6', label: 'show ipv6 route (R2)', run: () => ({ lines: ['', 'R2#show ipv6 route', '% IPv6 routing not enabled'], term: 'R2 · CLI' }) }
        ],
        fix: { label: 'ipv6 unicast-routing en R2', options: ['ipv6 unicast-routing en R2', 'Cambiar la máscara IPv4 de R2', 'Reiniciar PC2'], correct: 0 },
        clear(s) { net.setNode('r2', ''); s.chips = []; },
        lesson: 'Un router sin ipv6 unicast-routing no reenvía paquetes IPv6 entre sus interfaces, mientras IPv4 sigue funcionando. Comparar ambos ping aísla el problema en la capa 3 de IPv6.'
      },
      {
        id: 6, title: 'Cable directo entre routers', short: 'cable directo en R1 ↔ R2', fig: 'cr-falla6', host: 'R1', surprise: true,
        symptom: 'El enlace no se cae: respuestas al 80 %.',
        injectCmd: 'Se reemplaza el cable cruzado por un cable directo entre R1 y R2',
        apply(s) { net.setLink('r1', 'r2', 'warn'); s.chips = ['Cable directo en un enlace router–router', 'Auto-MDIX compensa']; },
        cmds: [
          { id: 'ping-link', label: 'ping 10.0.0.2 (R1)', run: () => ({ lines: ['', 'R1#ping 10.0.0.2', '', 'Type escape sequence to abort.', 'Sending 5, 100-byte ICMP Echos to 10.0.0.2, timeout is 2 seconds:', '.!!!!', 'Success rate is 80 percent (4/5), round-trip min/avg/max = 0/0/0 ms'], term: 'R1 · CLI', path: ['r1', 'r2'], ok: true }) },
          { id: 'brief', label: 'show ip interface brief (R1)', run: () => ({ lines: brief('up                    up'), term: 'R1 · CLI' }) },
          { id: 'ping-remote', label: 'ping 192.168.20.10', run: () => ({ lines: ping('192.168.20.10', 'ok:126'), path: ['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], ok: true }) }
        ],
        fix: { label: 'Devolver el cable cruzado', options: ['Devolver el cable cruzado', 'Cambiar la IP de R2', 'Apagar OSPF'], correct: 0 },
        clear(s) { net.setLink('r1', 'r2', 'up'); s.chips = []; },
        lesson: 'El enlace siguió funcionando con 4 de 5 respuestas. Es compatible con Auto-MDIX, que adapta el medio automáticamente en el simulador. En equipos sin esa función, el resultado habría sido distinto: usa el cable que corresponde.'
      }
    ];

    const S = { fault: null, step: 'inject', stage: 0, injected: false, fixed: false, busy: false, token: { cancelled: false }, chips: [], gw: null, mask: null };

    const paintChips = () => {
      stateBox.replaceChildren(...S.chips.map((c) => h('span', 'chip-state is-bad', c)));
      if (!S.chips.length) stateBox.append(h('span', 'chip-state is-ok', S.fixed ? 'Red restaurada' : 'Red sana'));
    };
    const setStep = (step) => {
      S.step = step;
      stepBtns.forEach((b) => {
        b.classList.toggle('is-active', b.dataset.flStep === step);
        b.disabled = (b.dataset.flStep === 'diagnose' && !S.injected) || (b.dataset.flStep === 'fix' && !S.injected);
      });
      renderPanel();
    };
    const print = async (lines) => { S.token.cancelled = true; S.token = { cancelled: false }; await typeLines(out, lines, { delay: reduceMotion ? 0 : 34, token: S.token }); };

    const select = (fault) => {
      if (S.busy) return;
      net.cancel();
      net.clearStates();
      Object.assign(S, { fault, step: 'inject', stage: 0, injected: false, fixed: false, chips: [], gw: null, mask: null });
      qsa('button', list).forEach((b) => { const on = Number(b.dataset.id) === fault.id; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
      lesson.hidden = true;
      out.textContent = `Falla ${fault.id}: ${fault.title}. Pulsa «Inyectar» para provocarla.`;
      termTitle.textContent = `${fault.host} · Command Prompt`;
      paintChips();
      setStep('inject');
    };

    const renderPanel = () => {
      const f = S.fault;
      panel.replaceChildren();
      if (!f) return;
      if (S.step === 'inject') {
        const stageCount = f.stages || 1;
        const label = stageCount > 1 ? f.stageLabels[Math.min(S.stage, stageCount - 1)] : 'Inyectar la falla';
        const cmdText = Array.isArray(f.injectCmd) ? f.injectCmd[Math.min(S.stage, stageCount - 1)] : f.injectCmd;
        panel.append(
          h('p', 'faultlab__symptom', [h('b', '', `Falla ${f.id} · ${f.title}. `), `Síntoma esperado: ${f.symptom}`]),
          h('pre', 'faultlab__cmd', h('code', '', cmdText))
        );
        const btn = h('button', 'button button--primary button--compact', S.stage >= stageCount ? 'Falla inyectada' : label);
        btn.type = 'button';
        btn.disabled = S.stage >= stageCount || S.fixed;
        btn.addEventListener('click', async () => {
          S.stage += 1;
          S.injected = true;
          f.apply(S, S.stage);
          paintChips();
          out.textContent = `Se aplicó: ${(Array.isArray(f.injectCmd) ? f.injectCmd[S.stage - 1] : f.injectCmd).replace(/\n/g, ' · ')}`;
          if ((f.stages || 1) > 1 && S.stage < f.stages) { renderPanel(); setStep('inject'); return; }
          setStep('diagnose');
        });
        panel.append(btn);
        if ((f.stages || 1) > 1 && S.stage > 0 && S.stage < f.stages) panel.append(h('p', 'faultlab__hint', 'Prueba un ping ahora: con solo la ruta específica fuera, todavía responde. Pasa a «Diagnosticar», comprueba y luego vuelve aquí para quitar la ruta por defecto.'));
      } else if (S.step === 'diagnose') {
        panel.append(h('p', 'faultlab__hint', 'Ejecuta los comandos de diagnóstico y compara lo que ves con lo que esperarías de una red sana.'));
        const box = h('div', 'faultlab__cmds');
        f.cmds.forEach((c) => {
          const b = h('button', 'chip-button chip-button--ink chip-button--cmd', c.label);
          b.type = 'button';
          b.addEventListener('click', async () => {
            if (S.busy) return;
            S.busy = true;
            qsa('button', box).forEach((x) => { x.disabled = true; });
            const r = c.run(S);
            termTitle.textContent = r.term || `${f.host} · Command Prompt`;
            net.cancel();
            const lines = r.lines;
            const animate = async () => {
              if (!r.path) return;
              if (r.ok) { await net.send(r.path, { label: 'ICMP' }); await net.send([...r.path].reverse(), { color: 'green', label: 'Reply' }); return; }
              if (r.fail) {
                const idx = r.path.indexOf(r.fail.at);
                if (r.fail.back === 'noreturn') {
                  await net.send(r.path, { label: 'ICMP' });
                  const rev = [...r.path].reverse();
                  const cut = rev.indexOf('r2');
                  await net.send(rev.slice(0, cut + 1), { color: 'red', label: 'Reply', stopAt: cut });
                } else {
                  await net.send(r.path.slice(0, idx + 1), { color: r.fail.proto === 'v6' ? 'amber' : 'blue', label: r.fail.proto === 'v6' ? 'ICMPv6' : 'ICMP', stopAt: idx > 0 ? idx : undefined });
                  if (r.fail.back === 'red') await net.send(r.path.slice(0, idx + 1).reverse(), { color: 'red', label: 'Unreachable' });
                }
              }
            };
            await Promise.all([print(lines), animate()]);
            S.busy = false;
            qsa('button', box).forEach((x) => { x.disabled = false; });
          });
          box.append(b);
        });
        panel.append(box);
        const nextBtn = h('button', 'button button--ghost button--compact', 'Ya sé qué corregir →');
        nextBtn.type = 'button';
        nextBtn.addEventListener('click', () => {
          if ((f.stages || 1) > 1 && S.stage < f.stages) { setStep('inject'); return; }
          setStep('fix');
        });
        panel.append(nextBtn);
      } else {
        panel.append(h('p', 'faultlab__hint', '¿Cuál es la corrección adecuada?'));
        const box = h('div', 'faultlab__options');
        const opts = f.fix.options.map((text, i) => ({ text, i }));
        const rot = f.id % 3;
        const order = opts.map((_, k) => opts[(k + rot) % opts.length]);
        order.forEach((o) => {
          const b = h('button', 'option', o.text);
          b.type = 'button';
          b.disabled = S.fixed;
          b.addEventListener('click', async () => {
            if (o.i !== f.fix.correct) {
              b.classList.add('is-wrong');
              panel.querySelector('.faultlab__feedback')?.remove();
              panel.append(h('p', 'faultlab__feedback is-bad', 'Esa acción no resuelve el síntoma que observaste. Revisa la salida de los comandos y vuelve a intentarlo.'));
              return;
            }
            b.classList.add('is-right');
            S.fixed = true;
            f.clear(S);
            net.clearStates();
            paintChips();
            qsa('button', box).forEach((x) => { x.disabled = true; });
            panel.querySelector('.faultlab__feedback')?.remove();
            panel.append(h('p', 'faultlab__feedback is-ok', `Corregido: ${f.fix.label}.`));
            out.textContent = `Se aplicó: ${f.fix.label}. Vuelve a probar con ping para confirmar.`;
            await net.send(['pc0', 'sw0', 'r1', 'r2', 'sw1', 'pc2'], { label: 'ICMP' });
            await net.send(['pc2', 'sw1', 'r2', 'r1', 'sw0', 'pc0'], { color: 'green', label: 'Reply' });
            lessonText.textContent = f.lesson;
            const fig = figures.find((x) => x.key === f.fig);
            lessonFig.replaceChildren();
            if (fig) {
              const open = h('button', 'evidence__open');
              open.type = 'button';
              open.dataset.gallery = fig.group;
              open.dataset.galleryOpen = String(window.TC.groups[fig.group].indexOf(fig));
              const img = document.createElement('img');
              img.src = fig.src; img.alt = fig.alt; img.width = fig.w; img.height = fig.h; img.loading = 'lazy';
              open.append(img, h('span', 'evidence__zoom', 'Ampliar'));
              lessonFig.append(open, h('figcaption', '', [h('b', '', `${fig.title}. `), fig.cap]));
              lessonFig.className = 'evidence evidence--inline';
            }
            lesson.hidden = false;
            replay([...lesson.children]);
          });
          box.append(b);
        });
        panel.append(box);
      }
      replay([...panel.children]);
    };

    faults.forEach((f) => {
      const b = h('button', 'fault-chip', [h('b', '', String(f.id)), h('span', '', f.title), h('small', '', f.short)]);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.dataset.id = String(f.id);
      if (f.surprise) b.classList.add('has-surprise');
      b.addEventListener('click', () => select(f));
      list.append(b);
    });
    stepBtns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) setStep(b.dataset.flStep); }));
    // Navegación con flechas entre las fallas (patrón de pestañas)
    const chips = qsa('.fault-chip', list);
    chips.forEach((chip, i) => chip.addEventListener('keydown', (e) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!move) return;
      e.preventDefault();
      const next = chips[(i + move + chips.length) % chips.length];
      next.focus();
      next.click();
    }));
    select(faults[0]);
  }

  /* ==============================
     OSPF: rutas estáticas vs. dinámico
  ================================ */
  const os = qs('[data-ospf]');
  if (os) {
    const modeBtns = qsa('[data-mode]', os);
    const runBtn = qs('[data-ospf-run]', os);
    const resetBtn = qs('[data-ospf-reset]', os);
    const cmds = qs('[data-ospf-cmds]', os);
    const tableBox = qs('[data-ospf-table]', os);
    const countEl = qs('[data-ospf-count]', os);
    const countLabel = qs('[data-ospf-count-label]', os);
    const fsm = qsa('[data-ospf-fsm] li', os);
    const note = qs('[data-ospf-note]', os);
    const packet = qs('[data-ospf-packet]', os);
    const msg = qs('[data-ospf-msg]', os);
    const wire = qs('.ospf__wire', os);
    const S = { mode: 'static', added: false, busy: false, formed: false, token: { cancelled: false } };

    const baseRows = (mode) => {
      const rows = [
        { code: 'C', net: '10.0.0.0', prefix: 30, text: 'is directly connected, GigabitEthernet0/1' },
        { code: 'L', net: '10.0.0.1', prefix: 32, text: 'is directly connected, GigabitEthernet0/1' },
        { code: 'C', net: '192.168.10.0', prefix: 24, text: 'is directly connected, GigabitEthernet0/0' },
        { code: 'L', net: '192.168.10.1', prefix: 32, text: 'is directly connected, GigabitEthernet0/0' }
      ];
      rows.push(mode === 'ospf'
        ? { code: 'O', net: '192.168.20.0', prefix: 24, text: '[110/2] via 10.0.0.2, 00:01:05, GigabitEthernet0/1' }
        : { code: 'S', net: '192.168.20.0', prefix: 24, text: '[1/0] via 10.0.0.2' });
      return rows;
    };
    const paintTable = (withLan3, flashNew) => {
      const rows = baseRows(S.mode);
      if (withLan3) rows.push(S.mode === 'ospf'
        ? { code: 'O', net: '192.168.30.0', prefix: 24, text: '[110/2] via 10.0.0.2, 00:00:03, GigabitEthernet0/1' }
        : { code: 'S', net: '192.168.30.0', prefix: 24, text: '[1/0] via 10.0.0.2' });
      renderRoutes(tableBox, rows, { title: 'R1#show ip route', hitIndex: flashNew ? rows.length - 1 : -1 });
    };
    const setFsm = (idx) => fsm.forEach((li, i) => { li.classList.toggle('is-done', i < idx); li.classList.toggle('is-on', i === idx); });
    const sendMsg = async (text, dir = 1) => {
      msg.textContent = text;
      wire.classList.toggle('is-back', dir < 0);
      packet.classList.remove('is-go');
      void packet.offsetWidth;
      packet.classList.add('is-go');
      await wait(reduceMotion ? 0 : 900);
    };
    const resetFsm = () => { setFsm(-1); fsm[0].classList.add('is-on'); msg.textContent = '—'; packet.classList.remove('is-go'); };

    const form = async () => {
      S.token = { cancelled: false };
      const tk = S.token;
      const seq = [
        [0, 'Hello · R1 → 224.0.0.5', 1, 'R1 envía su primer Hello al grupo multicast de los routers OSPF.'],
        [1, 'Hello · R2 → 224.0.0.5', -1, 'Init: R2 recibió un Hello de R1 pero aún no se ve a sí mismo en la lista de vecinos.'],
        [2, 'Hello con vecino 192.168.10.1', -1, '2-Way: cada router se ve en el Hello del otro. Se elige DR (10.0.0.2) y BDR (10.0.0.1).'],
        [3, 'DBD · quién será maestro', 1, 'ExStart: negocian maestro y esclavo para intercambiar sus bases de datos.'],
        [4, 'DBD · resumen de la base', -1, 'Exchange: intercambian resúmenes de las redes que conocen.'],
        [5, 'LSR / LSU · lo que falta', 1, 'Loading: piden y reciben los anuncios (LSA) que no tenían.'],
        [6, 'Vecindad FULL', -1, 'Full: las bases están sincronizadas. R1 muestra FULL/DR y R2 FULL/BDR.']
      ];
      for (const [i, text, dir, explain] of seq) {
        if (tk.cancelled) return;
        setFsm(i);
        note.textContent = explain;
        await sendMsg(text, dir);
      }
      S.formed = true;
    };

    const run = async () => {
      if (S.busy || S.added) return;
      S.busy = true;
      runBtn.disabled = true;
      paintTable(false);
      const lines = S.mode === 'static'
        ? ['R2(config)# interface gigabitEthernet 0/2', 'R2(config-if)# ip address 192.168.30.1 255.255.255.0', 'R2(config-if)# no shutdown', '', '! R1 no conoce LAN3: hay que decírselo', 'R1(config)# ip route 192.168.30.0 255.255.255.0 10.0.0.2', 'R1(config)# ipv6 route 2001:DB8:ACAD:30::/64 2001:DB8:ACAD:100::2']
        : ['R2(config)# interface gigabitEthernet 0/2', 'R2(config-if)# ip address 192.168.30.1 255.255.255.0', 'R2(config-if)# no shutdown', 'R2(config)# router ospf 1', 'R2(config-router)# network 192.168.30.0 0.0.0.255 area 0', '', '! En R1 no se escribe nada para LAN3']
      ;
      cmds.textContent = '';
      for (const line of lines) { cmds.textContent += `${line}\n`; await wait(reduceMotion ? 0 : 150); }
      if (S.mode === 'static') {
        window.TC.countTo(countEl, 2, { duration: 500 });
        countLabel.textContent = 'comandos específicos hacia LAN3 en R1';
        paintTable(true, true);
        note.textContent = 'Con rutas estáticas, R1 necesitó una ruta IPv4 y otra IPv6 para alcanzar LAN3.';
      } else {
        if (!S.formed) await form();
        await sendMsg('LSA · 192.168.30.0/24', -1);
        window.TC.countTo(countEl, 0, { duration: 500 });
        countLabel.textContent = 'comandos específicos hacia LAN3 en R1';
        paintTable(true, true);
        note.textContent = 'R1 aprendió O 192.168.30.0/24 [110/2] vía 10.0.0.2 sin ninguna ruta específica: ese es el valor del routing dinámico.';
      }
      S.added = true;
      S.busy = false;
    };
    const reset = () => {
      S.token.cancelled = true;
      Object.assign(S, { added: false, busy: false, formed: false });
      cmds.textContent = S.mode === 'static' ? '# Pulsa «Añadir LAN3 a la red» para ver qué hay que escribir con rutas estáticas.' : '# Pulsa «Añadir LAN3 a la red» para ver qué hay que escribir con OSPF y cómo se forma la vecindad.';
      countEl.textContent = '0';
      runBtn.disabled = false;
      paintTable(false);
      resetFsm();
      note.textContent = S.mode === 'static' ? 'Con rutas estáticas no hay vecindad: cada ruta se escribe a mano.' : 'Con OSPF, la vecindad llegó a FULL/DR en R1 y FULL/BDR en R2.';
      os.classList.toggle('is-static', S.mode === 'static');
    };
    modeBtns.forEach((b) => b.addEventListener('click', () => { S.mode = b.dataset.mode; setActive(modeBtns, b); reset(); }));
    runBtn.addEventListener('click', run);
    resetBtn.addEventListener('click', reset);
    reset();
  }

  /* ---------- Paquete Hello ---------- */
  const hello = qs('[data-hello]');
  if (hello) {
    const detail = qs('[data-hello-detail]', hello);
    const info = {
      ipsrc: 'Origen 10.0.0.1: la interfaz de R1 en el enlace entre routers.',
      ipdst: 'Destino 224.0.0.5: multicast reservado a todos los routers OSPF. Solo los routers OSPF del enlace procesan el Hello.',
      ttl: 'TTL 1: el Hello solo vive en su enlace; ningún router lo reenvía.',
      proto: 'Protocolo IP 89 identifica a OSPF dentro del encabezado IP.',
      ver: 'OSPFv2 es la versión para IPv4.',
      type: 'Tipo 1 = Hello. Los otros tipos son DBD, LSR, LSU y LSAck.',
      rid: 'Router ID 192.168.10.1: identifica a R1 dentro del dominio OSPF.',
      area: 'Área 0.0.0.0: el área troncal; todas las redes del taller se anunciaron en ella.',
      mask: 'Máscara 255.255.255.252: la del enlace /30. Los vecinos deben coincidir.',
      hello: 'Intervalo Hello de 10 segundos: cada cuánto se envía este paquete.',
      dead: 'Dead Interval de 40 segundos: si no llega un Hello en ese tiempo, el vecino se da por caído.',
      dr: 'DR 10.0.0.2: el router designado del segmento es R2.',
      bdr: 'BDR 10.0.0.1: el respaldo del router designado es R1.',
      nbr: 'Vecino 192.168.30.1: el Router ID de R2, ya visto por R1; así se confirma la comunicación en ambos sentidos.'
    };
    const buttons = qsa('[data-hf]', hello);
    const show = (b) => {
      buttons.forEach((x) => x.classList.toggle('is-active', x === b));
      detail.textContent = info[b.dataset.hf];
      replay(detail, false);
    };
    buttons.forEach((b) => { b.addEventListener('mouseenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('click', () => show(b)); });
  }

  /* ==============================
     Tarjeta animada de la portada
  ================================ */
  const rc = qs('[data-route-card]');
  if (rc) {
    const net = createNet(qs('[data-route-svg]', rc).parentElement, {
      width: 560, height: 190, label: 'Paquete de PC0 a PC2 con tres saltos',
      nodes: [
        { id: 'pc0', type: 'pc', x: 60, y: 90, label: 'PC0' },
        { id: 'r1', type: 'router', x: 210, y: 90, label: 'R1' },
        { id: 'r2', type: 'router', x: 350, y: 90, label: 'R2' },
        { id: 'pc2', type: 'pc', x: 500, y: 90, label: 'PC2' }
      ],
      links: [['pc0', 'r1'], ['r1', 'r2', { mid: '10.0.0.0/30' }], ['r2', 'pc2']]
    });
    const ttl = qs('[data-rc="ttl"]', rc);
    const mac = qs('[data-rc="mac"]', rc);
    const status = qs('[data-route-card-status]', rc);
    let running = false;
    const loop = async () => {
      while (running) {
        ttl.textContent = '255';
        mac.textContent = 'enlace PC0 → R1';
        status.textContent = 'PC0 → PC2 · TTL 255';
        const ok = await net.send(['pc0', 'r1', 'r2', 'pc2'], {
          label: 'TTL 255', speed: 230,
          onHop: async (i, id, handle) => {
            if (id === 'r1') { handle.setLabel('TTL 254'); ttl.textContent = '254'; mac.textContent = 'enlace R1 → R2'; status.textContent = 'Salió de R1 · TTL 254'; await wait(240); }
            if (id === 'r2') { handle.setLabel('TTL 253'); ttl.textContent = '253'; mac.textContent = 'enlace R2 → PC2'; status.textContent = 'Salió de R2 · TTL 253'; await wait(240); }
            if (id === 'pc2') status.textContent = 'Llegó a PC2 · TTL 253';
          }
        });
        if (!running) return;
        await wait(ok ? 1800 : 400);
      }
    };
    whileVisible(rc, () => { if (!running) { running = true; loop(); } }, () => { running = false; net.cancel(); });
  }
})();
