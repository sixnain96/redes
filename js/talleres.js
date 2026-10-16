/* ==============================
   NETLAB — Contenido de los talleres
   Encapsulamiento y PDU · Taller DHCP · Seguridad · Visor de evidencias
================================ */
(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const replay = (elements, stagger = true) => {
    (Array.isArray(elements) ? elements : [elements]).filter(Boolean).forEach((el, index) => {
      if (stagger) el.style.setProperty('--i', String(index));
      el.classList.remove('anim-swap');
      void el.offsetWidth;
      el.classList.add('anim-swap');
    });
  };

  const setActive = (buttons, active, attr = 'aria-pressed') => {
    buttons.forEach((button) => {
      const on = button === active;
      button.classList.toggle('is-active', on);
      button.setAttribute(attr, String(on));
    });
  };

  const text = (tag, content, className) => {
    const node = document.createElement(tag);
    node.textContent = content;
    if (className) node.className = className;
    return node;
  };

  /* ==============================
     Simulador de encapsulamiento
  ================================ */
  const encapRoot = qs('[data-encap]');
  if (encapRoot) {
    const layers = [
      { key: 'app', name: 'Aplicación', pdu: 'Datos', device: 'Computador cliente y servidor', parts: ['data'] },
      { key: 'transport', name: 'Transporte', pdu: 'Segmento (TCP)', device: 'Equipos finales', parts: ['tcp', 'data'] },
      { key: 'network', name: 'Red', pdu: 'Paquete', device: 'Router', parts: ['ip', 'tcp', 'data'] },
      { key: 'link', name: 'Enlace de datos', pdu: 'Trama', device: 'Switch y tarjeta de red (NIC)', parts: ['eth', 'ip', 'tcp', 'data', 'fcs'] },
      { key: 'physical', name: 'Física', pdu: 'Bits', device: 'Cables, fibra, antenas y medio físico', parts: ['eth', 'ip', 'tcp', 'data', 'fcs'], bits: true }
    ];
    const partLabels = { eth: 'Ethernet', ip: 'IP', tcp: 'TCP', data: 'Datos', fcs: 'FCS' };
    const removes = { link: ['eth', 'fcs'], network: ['ip'], transport: ['tcp'] };
    const scenarios = {
      https: { app: 'Solicitud HTTP al abrir una página web segura', proto: 'HTTPS', dport: '443' },
      mail: { app: 'Mensaje de correo electrónico y datos del servicio SMTP', proto: 'SMTP', dport: '25' }
    };
    const down = {
      app: 'El usuario genera la información. Todavía no tiene encabezados de red: es la información «cruda» que se quiere transmitir.',
      transport: 'Divide los datos en unidades manejables y agrega los números de puerto de origen y destino, además de los campos de control propios de TCP.',
      network: 'Agrega las direcciones IP de origen y destino al segmento. Con ellas el paquete puede llegar a otra red.',
      link: 'Agrega las direcciones MAC del enlace actual y un tráiler con datos para verificar la integridad de la trama.',
      physical: 'La trama se convierte en una secuencia de bits que viaja como señales eléctricas, ópticas o de radio por el medio.'
    };
    const up = {
      physical: 'La interfaz recibe las señales y las interpreta como bits.',
      link: 'Reconstruye la trama, verifica la MAC de destino y comprueba que no tenga errores. Luego retira el encabezado Ethernet y el tráiler.',
      network: 'Revisa la IP de destino, determina que el protocolo superior es TCP y retira el encabezado IP.',
      transport: 'TCP usa el puerto de destino para elegir el proceso correcto, retira su encabezado y entrega los datos.',
      app: 'La aplicación recibe los datos originales, tal como los generó el emisor, y continúa el procesamiento de la sesión.'
    };

    const state = { scenario: 'https', dir: 'down', step: 0, timer: null };
    const layersEl = qs('[data-encap-layers]', encapRoot);
    const pduEl = qs('[data-encap-pdu]', encapRoot);
    const flowEl = qs('[data-encap-flow]', encapRoot);
    const nameEl = qs('[data-encap-name]', encapRoot);
    const titleEl = qs('[data-encap-title]', encapRoot);
    const textEl = qs('[data-encap-text]', encapRoot);
    const fieldsEl = qs('[data-encap-fields]', encapRoot);
    const counterEl = qs('[data-encap-counter]', encapRoot);
    const prevBtn = qs('[data-encap-prev]', encapRoot);
    const nextBtn = qs('[data-encap-next]', encapRoot);
    const playBtn = qs('[data-encap-play]', encapRoot);
    const resetBtn = qs('[data-encap-reset]', encapRoot);
    const scenarioBtns = qsa('[data-scenario-key]', encapRoot);
    const dirBtns = qsa('[data-dir-key]', encapRoot);

    const layerIndex = () => (state.dir === 'down' ? state.step : 4 - state.step);

    const fieldsFor = (layer) => {
      const sc = scenarios[state.scenario];
      switch (layer.key) {
        case 'app': return [['Información', sc.app], ['Direccionamiento', 'No aplica']];
        case 'transport': return [['Puerto de origen', '51422 (temporal, asignado al cliente)'], ['Puerto de destino', `${sc.dport} (${sc.proto})`]];
        case 'network': return [['IP de origen', '192.168.1.10'], ['IP de destino', '200.14.55.2']];
        case 'link': return [['MAC de origen', 'AA:BB:CC:11:22:33'], ['MAC de destino', 'FF:EE:DD:44:55:66']];
        default: return [['Medio', 'Señales eléctricas, ópticas o inalámbricas'], ['Direccionamiento', 'No aplica']];
      }
    };

    const buildLayers = () => {
      layersEl.replaceChildren();
      layers.forEach((layer, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.layer = String(i);
        btn.append(text('span', String(5 - i), 'encap__n'), text('b', layer.name), text('small', layer.pdu));
        btn.addEventListener('click', () => { stop(); state.step = state.dir === 'down' ? i : 4 - i; render(true); });
        li.appendChild(btn);
        layersEl.appendChild(li);
      });
    };

    const render = (animate = true) => {
      const li = layerIndex();
      const layer = layers[li];
      const isDown = state.dir === 'down';

      qsa('button', layersEl).forEach((btn, i) => {
        const pos = isDown ? i : 4 - i;
        btn.classList.toggle('is-active', i === li);
        btn.classList.toggle('is-done', pos < state.step);
        btn.setAttribute('aria-current', i === li ? 'step' : 'false');
      });

      pduEl.replaceChildren();
      pduEl.classList.toggle('is-bits', Boolean(layer.bits));
      const removing = !isDown ? (removes[layer.key] || []) : [];
      layer.parts.forEach((part, index) => {
        const span = document.createElement('span');
        span.className = `part part--${part}`;
        span.style.setProperty('--i', String(index));
        if (layer.bits) span.textContent = ({ eth: '10101010 11101011', ip: '11000000 10101000', tcp: '11001000 11100010', data: '01001000 01010100', fcs: '00110101' })[part];
        else span.textContent = partLabels[part];
        const isNew = isDown && ((layer.key === 'app' && part === 'data') || (layer.key === 'transport' && part === 'tcp') || (layer.key === 'network' && part === 'ip') || (layer.key === 'link' && (part === 'eth' || part === 'fcs')));
        if (isNew && animate) span.classList.add('is-new');
        if (removing.includes(part)) span.classList.add('is-removing');
        pduEl.appendChild(span);
      });
      pduEl.setAttribute('aria-label', `${layer.pdu}: ${layer.parts.map((p) => partLabels[p]).join(', ')}`);

      flowEl.textContent = isDown
        ? 'Equipo emisor · la información baja por las capas'
        : 'Equipo receptor · la información sube por las capas';

      nameEl.textContent = `Capa ${5 - li} · ${layer.name}`;
      titleEl.textContent = `PDU: ${layer.pdu}`;
      textEl.textContent = (isDown ? down : up)[layer.key];
      fieldsEl.replaceChildren();
      [...fieldsFor(layer), ['Dispositivo asociado', layer.device]].forEach(([k, v], i) => {
        const row = document.createElement('div');
        row.style.setProperty('--i', String(i));
        row.append(text('dt', k), text('dd', v));
        fieldsEl.appendChild(row);
      });
      if (animate) replay([nameEl, titleEl, textEl, ...qsa('div', fieldsEl)]);

      counterEl.textContent = `Paso ${state.step + 1} de 5`;
      prevBtn.disabled = state.step === 0;
      nextBtn.disabled = state.step === 4;
    };

    function stop() {
      if (state.timer) window.clearInterval(state.timer);
      state.timer = null;
      playBtn.dataset.playing = 'false';
      playBtn.textContent = 'Reproducir';
    }

    prevBtn.addEventListener('click', () => { stop(); state.step = Math.max(0, state.step - 1); render(); });
    nextBtn.addEventListener('click', () => { stop(); state.step = Math.min(4, state.step + 1); render(); });
    resetBtn.addEventListener('click', () => { stop(); state.step = 0; render(); });
    playBtn.addEventListener('click', () => {
      if (state.timer) { stop(); return; }
      if (state.step >= 4) { state.step = 0; render(); }
      playBtn.dataset.playing = 'true';
      playBtn.textContent = 'Pausar';
      state.timer = window.setInterval(() => {
        if (state.step >= 4) { stop(); return; }
        state.step += 1;
        render();
      }, reduceMotion ? 1800 : 1500);
    });
    scenarioBtns.forEach((btn) => btn.addEventListener('click', () => {
      state.scenario = btn.dataset.scenarioKey;
      setActive(scenarioBtns, btn);
      render();
    }));
    dirBtns.forEach((btn) => btn.addEventListener('click', () => {
      stop();
      state.dir = btn.dataset.dirKey;
      state.step = 0;
      setActive(dirBtns, btn);
      render();
    }));
    encapRoot.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLSelectElement) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); nextBtn.click(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); prevBtn.click(); }
    });

    buildLayers();
    render(false);
  }

  /* ==============================
     Análisis de la captura
  ================================ */
  const capForm = qs('[data-capture-form]');
  if (capForm) {
    const feedback = qs('[data-capture-feedback]', capForm);
    const selects = qsa('[data-capture-answer]', capForm);
    capForm.addEventListener('submit', (event) => {
      event.preventDefault();
      let ok = 0;
      let empty = 0;
      selects.forEach((select) => {
        const label = select.closest('label');
        label.classList.remove('is-correct', 'is-incorrect');
        if (!select.value) { empty += 1; return; }
        const expected = select.dataset.captureAnswer === 'proto' ? 'https' : select.dataset.captureAnswer;
        const good = select.value === expected;
        if (good) ok += 1;
        label.classList.add(good ? 'is-correct' : 'is-incorrect');
      });
      feedback.hidden = false;
      if (empty) {
        feedback.className = 'form-feedback is-incorrect';
        feedback.textContent = 'Responde las cuatro preguntas antes de comprobar.';
      } else if (ok === selects.length) {
        feedback.className = 'form-feedback is-correct';
        feedback.textContent = 'Correcto. Ethernet y MAC son Enlace de datos; IP es Red; TCP y puertos son Transporte. El puerto 443 indica HTTPS y el 51422 es un puerto temporal del cliente.';
      } else {
        feedback.className = 'form-feedback is-incorrect';
        feedback.textContent = `${ok} de ${selects.length} correctas. Recuerda: las MAC viven en el Enlace de datos, las IP en la capa de Red y los puertos en Transporte.`;
      }
      replay(feedback, false);
    });
    capForm.addEventListener('reset', () => window.setTimeout(() => {
      feedback.hidden = true;
      qsa('label', capForm).forEach((label) => label.classList.remove('is-correct', 'is-incorrect'));
    }, 0));
  }

  /* ==============================
     Diagnóstico por capas
  ================================ */
  const debugRoot = qs('[data-debug]');
  if (debugRoot) {
    const info = {
      physical: ['Cable dañado o sin luz de enlace en el puerto.', 'Revisa el cableado, los conectores y los indicadores del puerto: deben estar en verde.', '1.º Comprueba que exista conexión física.'],
      link: ['La MAC no se aprende o la VLAN es incorrecta.', 'Revisa el switch, su tabla MAC y la VLAN configurada en el puerto.', '2.º Verifica la VLAN y el funcionamiento del switch.'],
      network: ['No hay respuesta al ping o la ruta es incorrecta.', 'Revisa la dirección IP, la máscara de subred, la puerta de enlace y el enrutamiento.', '3.º Comprueba IP, máscara y gateway.'],
      transport: ['El puerto está cerrado o bloqueado, aunque la red responda.', 'Revisa el firewall, los puertos y el estado del servicio de aplicación.', '4.º Por último, revisa los puertos y el servicio.']
    };
    const buttons = qsa('[data-debug-key]', debugRoot);
    const fill = (key) => {
      const [symptom, check, order] = info[key];
      qs('[data-debug-symptom]', debugRoot).textContent = symptom;
      qs('[data-debug-check]', debugRoot).textContent = check;
      qs('[data-debug-order]', debugRoot).textContent = order;
      replay(qsa('[data-debug-panel] > div', debugRoot));
    };
    buttons.forEach((btn) => btn.addEventListener('click', () => { setActive(buttons, btn); fill(btn.dataset.debugKey); }));
    fill('physical');
  }

  /* ==============================
     Verdadero o falso
  ================================ */
  const tfList = qs('[data-tf-list]');
  if (tfList) {
    const items = [
      ['La PDU de la capa de Transporte se llama «trama».', false, 'Falso. Con TCP se llama segmento y con UDP, datagrama. La trama es la PDU de la capa de Enlace de datos.'],
      ['El desencapsulamiento ocurre en el equipo receptor, a medida que la información sube por las capas.', true, 'Verdadero. Sube desde la capa Física hasta la de Aplicación, retirando un encabezado en cada capa.'],
      ['Las direcciones MAC se agregan en la capa de Red.', false, 'Falso. Las MAC pertenecen a la capa de Enlace de datos; en la capa de Red se manejan direcciones IP.'],
      ['Un firewall es un ejemplo de buena práctica de seguridad lógica.', true, 'Verdadero. Aplica reglas para permitir o bloquear tráfico de red.'],
      ['El modelo OSI está compuesto por 4 capas.', false, 'Falso. OSI tiene siete capas. TCP/IP tiene cuatro y en el taller se estudian cinco: Aplicación, Transporte, Red, Enlace de datos y Física.']
    ];
    let answered = 0;
    items.forEach(([statement, truth, why], index) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', String(index));
      const p = text('p', statement);
      const actions = document.createElement('div');
      actions.className = 'tf__actions';
      const yes = text('button', 'Verdadero');
      const no = text('button', 'Falso');
      [yes, no].forEach((b) => { b.type = 'button'; });
      const result = text('p', '', 'tf__result');
      result.hidden = true;
      const pick = (value) => {
        [yes, no].forEach((b) => { b.disabled = true; });
        const right = value === truth;
        (value ? yes : no).classList.add(right ? 'is-correct' : 'is-incorrect');
        if (!right) (truth ? yes : no).classList.add('is-correct');
        result.hidden = false;
        result.textContent = `${right ? 'Correcto. ' : 'No exactamente. '}${why}`;
        result.className = `tf__result ${right ? 'is-correct' : 'is-incorrect'}`;
        replay(result, false);
        answered += 1;
      };
      yes.addEventListener('click', () => pick(true));
      no.addEventListener('click', () => pick(false));
      actions.append(yes, no);
      li.append(p, actions, result);
      tfList.appendChild(li);
    });
  }

  /* ==============================
     Tablas del informe
  ================================ */
  const tableTabs = qsa('[data-table-key]');
  if (tableTabs.length) {
    const panels = qsa('[data-table-panel]');
    tableTabs.forEach((btn) => btn.addEventListener('click', () => {
      setActive(tableTabs, btn);
      panels.forEach((panel) => {
        const show = panel.dataset.tablePanel === btn.dataset.tableKey;
        panel.hidden = !show;
        if (show) replay(qsa('tbody tr', panel));
      });
    }));
  }

  /* ==============================
     Simulador DHCP
  ================================ */
  const dhcpRoot = qs('[data-dhcp]');
  if (dhcpRoot) {
    const clients = [
      { id: 'PC0', mac: '0002.4AB4.CEE0' },
      { id: 'PC1', mac: '00D0.BAB1.02C2' },
      { id: 'Laptop0', mac: '00D0.5889.78C6' }
    ];
    const cellsEl = qs('[data-dhcp-cells]', dhcpRoot);
    const clientsEl = qs('[data-dhcp-clients]', dhcpRoot);
    const logEl = qs('[data-dhcp-log]', dhcpRoot);
    const resetBtn = qs('[data-dhcp-reset]', dhcpRoot);
    const leases = new Map();

    const cellState = (n) => {
      if (leases.has(n)) return 'leased';
      return n >= 10 && n <= 12 ? 'free' : 'excluded';
    };

    const renderCells = (flash) => {
      cellsEl.replaceChildren();
      for (let n = 1; n <= 16; n += 1) {
        const cell = document.createElement('div');
        const st = cellState(n);
        cell.className = `cell is-${st}${flash === n ? ' is-flash' : ''}`;
        cell.append(text('b', `.${n}`), text('small', st === 'leased' ? leases.get(n) : st === 'excluded' ? (n === 1 ? 'gateway' : 'excl.') : 'libre'));
        cellsEl.appendChild(cell);
      }
    };

    const renderClients = () => {
      clientsEl.replaceChildren();
      const given = [...leases.values()].length;
      clients.forEach((client, i) => {
        const row = document.createElement('div');
        row.className = 'client';
        const has = [...leases.entries()].find(([, id]) => id === client.id);
        const info = document.createElement('div');
        info.append(text('b', client.id), text('small', has ? `192.168.10.${has[0]}` : `MAC ${client.mac}`));
        const btn = text('button', has ? 'Recibida' : 'Solicitar IP', 'chip-button chip-button--ink');
        btn.type = 'button';
        btn.disabled = Boolean(has) || i !== given;
        btn.addEventListener('click', () => request(client));
        row.append(info, btn);
        clientsEl.appendChild(row);
      });
    };

    const say = (message) => { logEl.textContent = message; replay(logEl, false); };

    function request(client) {
      const next = [10, 11, 12].find((n) => !leases.has(n));
      if (!next) { say('El pool no tiene direcciones libres: el resto está excluido.'); return; }
      leases.set(next, client.id);
      renderCells(next);
      renderClients();
      const tail = leases.size === 3
        ? ' Con esto el pool queda agotado: un cuarto equipo no recibiría dirección, porque las demás están excluidas.'
        : '';
      say(`${client.id} solicita parámetros. Router0 responde con la primera dirección libre del pool: 192.168.10.${next}, máscara 255.255.255.0 y gateway 192.168.10.1.${tail}`);
    }

    resetBtn.addEventListener('click', () => {
      leases.clear();
      renderCells();
      renderClients();
      say('Ningún equipo ha solicitado dirección todavía.');
    });

    renderCells();
    renderClients();
  }

  /* ==============================
     Seguridad: buenas prácticas
  ================================ */
  const practiceRoot = qs('[data-practices]');
  if (practiceRoot) {
    const content = {
      physical: ['Proteger el hardware y los medios de transmisión es la primera línea de defensa: si alguien accede físicamente a un equipo, puede comprometer toda la red.', [
        ['Control de acceso físico', 'Cuartos de telecomunicaciones con cerradura, tarjetas o biometría, y registro de ingreso de visitantes.'],
        ['Racks y gabinetes cerrados', 'Equipos activos en racks con llave, etiquetados y con cableado estructurado ordenado.'],
        ['Energía y ambiente', 'UPS, plantas eléctricas y control de temperatura y humedad para evitar fallas.'],
        ['Videovigilancia y alarmas', 'Cámaras y sensores en los cuartos de datos y en los puntos críticos de la red.']
      ]],
      logical: ['Controlar quién y qué puede comunicarse dentro de la red reduce drásticamente la superficie de ataque.', [
        ['Segmentación con VLAN', 'Separar el tráfico por área o función para limitar el alcance de un incidente.'],
        ['Firewalls', 'Filtrado del tráfico entrante y saliente según reglas de seguridad definidas.'],
        ['Listas de control de acceso (ACL)', 'Permitir o denegar tráfico específico entre redes o dispositivos.'],
        ['Cifrado de comunicaciones', 'VPN, WPA2/WPA3 y HTTPS para proteger los datos en tránsito.']
      ]],
      access: ['Los usuarios y el software desactualizado son de los puntos más explotados por los atacantes.', [
        ['Modelo AAA', 'Autenticación, autorización y auditoría (accounting) de cada acceso a los dispositivos.'],
        ['Contraseñas robustas', 'Políticas de longitud, complejidad, cambio periódico y doble factor de autenticación.'],
        ['Actualización y parches', 'Mantener el firmware y los sistemas operativos de red al día (hardening).'],
        ['Mínimo privilegio', 'Cada usuario o proceso solo con los permisos estrictamente necesarios.']
      ]],
      monitor: ['Ninguna red es 100 % invulnerable: por eso son igual de importantes la detección temprana y la capacidad de recuperación.', [
        ['Monitoreo continuo', 'IDS/IPS, registros centralizados y alertas ante tráfico o comportamiento anómalo.'],
        ['Copias de respaldo', 'Respaldo periódico de configuraciones y datos críticos, con pruebas de restauración.'],
        ['Plan de respuesta a incidentes', 'Contención, erradicación, recuperación y lecciones aprendidas.'],
        ['Auditorías y pruebas', 'Revisiones periódicas y pruebas de vulnerabilidad para verificar los controles.']
      ]]
    };
    const buttons = qsa('[data-practice-key]', practiceRoot);
    const lead = qs('[data-practice-lead]', practiceRoot);
    const list = qs('[data-practice-list]', practiceRoot);
    const show = (key) => {
      const [intro, items] = content[key];
      lead.textContent = intro;
      list.replaceChildren();
      items.forEach(([title, body]) => {
        const li = document.createElement('li');
        li.append(text('b', title), text('span', body));
        list.appendChild(li);
      });
      replay([lead, ...qsa('li', list)]);
    };
    buttons.forEach((btn) => btn.addEventListener('click', () => { setActive(buttons, btn); show(btn.dataset.practiceKey); }));
    show('physical');
  }

  /* ==============================
     Caso TecnoAndina
  ================================ */
  const caseRoot = qs('[data-case]');
  if (caseRoot) {
    const risks = [
      ['El cuarto de equipos de red no tiene cerradura y cualquier empleado puede ingresar.', 'physical', 'Instalar cerradura o control de acceso, permitir el ingreso solo a personal autorizado, llevar un registro y usar videovigilancia.'],
      ['Todos usan la misma contraseña de Wi-Fi y no se ha cambiado en tres años.', 'logical', 'Cambiar la contraseña, usar WPA2 o WPA3 y evitar que una sola credencial sea compartida por todos.'],
      ['No hay VLAN entre el área administrativa y la red de invitados.', 'logical', 'Crear VLAN separadas y controlar la comunicación entre ellas con reglas de firewall o ACL.'],
      ['No se realizan copias de respaldo de la configuración de los equipos de red.', 'logical', 'Hacer copias periódicas de routers y switches y guardarlas en un lugar seguro.'],
      ['El firmware de los routers no se ha actualizado en más de dos años.', 'logical', 'Establecer un plan de actualización con las versiones recomendadas por el fabricante, tras revisar su compatibilidad.']
    ];
    const list = qs('[data-case-list]', caseRoot);
    const scoreEl = qs('[data-case-score]', caseRoot);
    const critical = qs('[data-case-critical]', caseRoot);
    let done = 0;
    let right = 0;
    const names = { physical: 'Seguridad física', logical: 'Seguridad lógica' };

    risks.forEach(([risk, type, fix], index) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', String(index));
      const head = document.createElement('div');
      head.className = 'case__risk';
      head.append(text('span', String(index + 1).padStart(2, '0')), text('p', risk));
      const actions = document.createElement('div');
      actions.className = 'case__actions';
      const buttons = ['physical', 'logical'].map((kind) => {
        const b = text('button', names[kind], 'chip-button chip-button--ink');
        b.type = 'button';
        b.dataset.kind = kind;
        return b;
      });
      const result = document.createElement('div');
      result.className = 'case__result';
      result.hidden = true;
      buttons.forEach((b) => b.addEventListener('click', () => {
        const good = b.dataset.kind === type;
        buttons.forEach((x) => { x.disabled = true; });
        b.classList.add(good ? 'is-correct' : 'is-incorrect');
        if (!good) buttons.find((x) => x.dataset.kind === type).classList.add('is-correct');
        result.hidden = false;
        result.replaceChildren(text('b', `${good ? 'Correcto' : 'Es'}: ${names[type]}`), text('p', fix));
        replay(result, false);
        done += 1;
        if (good) right += 1;
        scoreEl.textContent = `${right} / ${risks.length}`;
        if (done === risks.length) { critical.hidden = false; replay(critical, false); }
      }));
      actions.append(...buttons);
      li.append(head, actions, result);
      list.appendChild(li);
    });
  }

  /* ==============================
     Evidencias: cuadrícula y visor
  ================================ */
  const figures = [
    { src: 'assets/evidencias/fig1-topologia.jpg', w: 943, h: 415, title: 'Figura 1. Topología completa', cap: 'Topología completa implementada en Packet Tracer. Los indicadores verdes muestran enlaces físicos activos.', alt: 'Topología con PC0, PC1 y Laptop0 conectados a Switch0, Router0, Switch1 y Server0.' },
    { src: 'assets/evidencias/fig2-interfaces-router.jpg', w: 892, h: 169, title: 'Figura 2. Interfaces de Router0', cap: 'Salida de show ip interface brief. Las interfaces G0/0 (192.168.10.1) y G0/1 (192.168.30.1) aparecen en estado up/up.', alt: 'Consola de Router0 con la salida de show ip interface brief.' },
    { src: 'assets/evidencias/fig3-dhcp-pc0.jpg', w: 1050, h: 1069, title: 'Figura 3. DHCP en PC0', cap: 'PC0 recibió 192.168.10.10, máscara 255.255.255.0 y gateway 192.168.10.1.', alt: 'Ventana IP Configuration de PC0 con DHCP activo.' },
    { src: 'assets/evidencias/fig4-dhcp-pc1.jpg', w: 1048, h: 1068, title: 'Figura 4. DHCP en PC1', cap: 'PC1 recibió la dirección 192.168.10.11.', alt: 'Ventana IP Configuration de PC1 con DHCP activo.' },
    { src: 'assets/evidencias/fig5-dhcp-laptop0.jpg', w: 1048, h: 1056, title: 'Figura 5. DHCP en Laptop0', cap: 'Laptop0 recibió la dirección 192.168.10.12.', alt: 'Ventana IP Configuration de Laptop0 con DHCP activo.' },
    { src: 'assets/evidencias/fig6-dhcp-binding.jpg', w: 826, h: 159, title: 'Figura 6. Concesiones DHCP', cap: 'Salida de show ip dhcp binding en Router0: tres concesiones automáticas con la MAC de cada cliente.', alt: 'Consola de Router0 con la salida de show ip dhcp binding.' },
    { src: 'assets/evidencias/fig7-ping-pc0.jpg', w: 1047, h: 1062, title: 'Figura 7. Pruebas de conectividad desde PC0', cap: 'Tres pings con cuatro respuestas y cero por ciento de pérdida. El mensaje «Invalid Command» fue un intento de limpiar la consola (cls) y no afecta las pruebas.', alt: 'Símbolo del sistema de PC0 con tres pings exitosos.' }
  ];

  const grid = qs('[data-evidence-grid]');
  if (grid) {
    figures.forEach((fig, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'evidence-card';
      btn.dataset.galleryOpen = String(index);
      btn.style.setProperty('--i', String(index % 4));
      const img = document.createElement('img');
      img.src = fig.src;
      img.alt = fig.alt;
      img.width = fig.w;
      img.height = fig.h;
      img.loading = 'lazy';
      btn.append(img, text('span', fig.title));
      grid.appendChild(btn);
    });
  }

  const box = qs('[data-lightbox]');
  if (box) {
    const img = qs('[data-lightbox-img]', box);
    const cap = qs('[data-lightbox-caption]', box);
    const count = qs('[data-lightbox-count]', box);
    const closeBtn = qs('[data-lightbox-close]', box);
    const prevBtn = qs('[data-lightbox-prev]', box);
    const nextBtn = qs('[data-lightbox-next]', box);
    let current = 0;
    let lastFocus = null;

    const show = (index) => {
      current = (index + figures.length) % figures.length;
      const fig = figures[current];
      box.classList.remove('is-zoomed');
      img.classList.remove('is-in');
      img.src = fig.src;
      img.alt = fig.alt;
      cap.textContent = `${fig.title}. ${fig.cap}`;
      count.textContent = `${current + 1} / ${figures.length}`;
      requestAnimationFrame(() => img.classList.add('is-in'));
    };
    const open = (index) => {
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add('lightbox-open');
      requestAnimationFrame(() => box.classList.add('is-open'));
      show(index);
      closeBtn.focus();
    };
    const close = () => {
      box.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      window.setTimeout(() => { box.hidden = true; }, reduceMotion ? 0 : 240);
      if (lastFocus instanceof HTMLElement) lastFocus.focus();
    };

    document.addEventListener('click', (event) => {
      const trigger = event.target instanceof Element ? event.target.closest('[data-gallery-open]') : null;
      if (trigger) open(Number(trigger.dataset.galleryOpen));
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    box.addEventListener('click', (event) => { if (event.target === box) close(); });
    img.addEventListener('click', () => box.classList.toggle('is-zoomed'));
    document.addEventListener('keydown', (event) => {
      if (box.hidden) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') show(current + 1);
      else if (event.key === 'ArrowLeft') show(current - 1);
      else if (event.key === 'Tab') {
        const items = [closeBtn, prevBtn, nextBtn];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
})();
