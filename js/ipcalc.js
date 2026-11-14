/* ==============================
   NETLAB — Biblioteca de cálculo IPv4 / IPv6
   Funciones puras (sin DOM) usadas por los simuladores del tercer corte.
   Se expone como window.IPCALC (y como módulo en Node para pruebas).
================================ */
(function (root) {
  'use strict';

  const toInt = (octets) => octets.reduce((acc, o) => acc * 256 + o, 0) >>> 0;
  const toIp = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  /** Convierte «a.b.c.d» en { ok, octets, int }. */
  const parseIp = (text) => {
    const parts = String(text).trim().split('.');
    if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return { ok: false };
    const octets = parts.map(Number);
    if (octets.some((o) => o > 255)) return { ok: false };
    return { ok: true, octets, int: toInt(octets) };
  };

  const maskFromPrefix = (prefix) => (prefix <= 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0);
  const prefixFromMask = (maskInt) => {
    let bits = 0;
    let seenZero = false;
    for (let i = 31; i >= 0; i -= 1) {
      const bit = (maskInt >>> i) & 1;
      if (bit && seenZero) return -1; // máscara no contigua
      if (bit) bits += 1; else seenZero = true;
    }
    return bits;
  };

  const bin8 = (n) => n.toString(2).padStart(8, '0');
  const bin32 = (n) => (n >>> 0).toString(2).padStart(32, '0');
  const dottedBin = (n) => bin32(n).match(/.{8}/g).join('.');

  /** Clasificación por clase y por tipo de dirección. */
  const classify = (int) => {
    const a = (int >>> 24) & 255;
    const b = (int >>> 16) & 255;
    let cls = 'A';
    let range = '1 – 126';
    let defaultPrefix = 8;
    if (a >= 224 && a <= 239) { cls = 'D'; range = '224 – 239'; defaultPrefix = null; }
    else if (a >= 240) { cls = 'E'; range = '240 – 255'; defaultPrefix = null; }
    else if (a >= 192) { cls = 'C'; range = '192 – 223'; defaultPrefix = 24; }
    else if (a >= 128) { cls = 'B'; range = '128 – 191'; defaultPrefix = 16; }
    else if (a === 127) { cls = 'A'; range = '127 (loopback)'; }
    else if (a === 0) { cls = 'A'; range = '0 (reservada)'; }

    let kind = 'pública';
    let block = 'Direccionamiento público enrutable en Internet';
    if (a === 10) { kind = 'privada'; block = 'RFC 1918 · 10.0.0.0/8 (10.0.0.0 – 10.255.255.255)'; }
    else if (a === 172 && b >= 16 && b <= 31) { kind = 'privada'; block = 'RFC 1918 · 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)'; }
    else if (a === 192 && b === 168) { kind = 'privada'; block = 'RFC 1918 · 192.168.0.0/16 (192.168.0.0 – 192.168.255.255)'; }
    else if (a === 127) { kind = 'especial'; block = 'Loopback 127.0.0.0/8 · pruebas de la pila TCP/IP del propio equipo'; }
    else if (a === 169 && b === 254) { kind = 'especial'; block = 'Enlace local 169.254.0.0/16 · APIPA, sin servidor DHCP'; }
    else if (a >= 224 && a <= 239) { kind = 'especial'; block = 'Multicast 224.0.0.0/4 · por ejemplo 224.0.0.5 (routers OSPF)'; }
    else if (a >= 240) { kind = 'especial'; block = 'Reservada (clase E) · uso experimental'; }
    else if (a === 0) { kind = 'especial'; block = 'Red 0.0.0.0/8 · «esta red»; 0.0.0.0/0 es la ruta por defecto'; }
    return { cls, range, defaultPrefix, kind, block };
  };

  /** Todos los parámetros de una dirección con prefijo. */
  const analyze = (ipText, prefix) => {
    const parsed = typeof ipText === 'number' ? { ok: true, int: ipText >>> 0 } : parseIp(ipText);
    if (!parsed.ok || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return { ok: false };
    const ip = parsed.int;
    const mask = maskFromPrefix(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const hostBits = 32 - prefix;
    const total = 2 ** hostBits;
    const usable = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(total - 2, 0);
    const hostMin = prefix >= 31 ? network : (network + 1) >>> 0;
    const hostMax = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
    let type = 'host';
    if (prefix < 31) {
      if (ip === network) type = 'red';
      else if (ip === broadcast) type = 'broadcast';
    }
    return {
      ok: true, ip, prefix, mask, wildcard, network, broadcast, hostBits, total, usable, hostMin, hostMax, type,
      text: {
        ip: toIp(ip), mask: toIp(mask), wildcard: toIp(wildcard), network: toIp(network),
        broadcast: toIp(broadcast), hostMin: toIp(hostMin), hostMax: toIp(hostMax)
      }
    };
  };

  const sameNetwork = (ipA, ipB, prefix) => {
    const a = parseIp(ipA);
    const b = parseIp(ipB);
    if (!a.ok || !b.ok) return null;
    const mask = maskFromPrefix(prefix);
    return ((a.int & mask) >>> 0) === ((b.int & mask) >>> 0);
  };

  /** Número mágico: octeto interesante, tamaño de bloque y múltiplos cercanos. */
  const magic = (ipText, prefix) => {
    const info = analyze(ipText, prefix);
    if (!info.ok) return { ok: false };
    // Si la máscara termina justo en un límite de octeto, el «octeto interesante» es el primero de host y el bloque es 256
    const octetIndex = Math.min(3, prefix % 8 === 0 && prefix < 32 ? prefix / 8 : Math.max(0, Math.ceil(prefix / 8) - 1));
    const bitsInOctet = prefix - octetIndex * 8; // 1..8 (o 0 si prefix = 0)
    const block = 2 ** (8 - Math.max(0, Math.min(8, bitsInOctet)));
    const value = (info.ip >>> (24 - octetIndex * 8)) & 255;
    const start = Math.floor(value / block) * block;
    return {
      ok: true, info, octetIndex, block, value, start,
      maskOctet: (info.mask >>> (24 - octetIndex * 8)) & 255,
      next: start + block
    };
  };

  /** Búsqueda de la ruta más específica (longest prefix match). */
  const longestPrefixMatch = (routes, dstText) => {
    const dst = parseIp(dstText);
    if (!dst.ok) return null;
    let best = null;
    routes.forEach((route) => {
      const net = parseIp(route.network);
      if (!net.ok) return;
      const mask = maskFromPrefix(route.prefix);
      if (((dst.int & mask) >>> 0) === ((net.int & mask) >>> 0)) {
        if (!best || route.prefix > best.prefix) best = route;
      }
    });
    return best;
  };

  /* ---------- IPv6 ---------- */
  const expand6 = (text) => {
    let src = String(text).trim();
    if (!src || /[^0-9a-fA-F:]/.test(src) || (src.match(/::/g) || []).length > 1 || /:::/.test(src)) return null;
    const hasGap = src.includes('::');
    let head = [];
    let tail = [];
    if (hasGap) {
      const [left, right] = src.split('::');
      head = left ? left.split(':') : [];
      tail = right ? right.split(':') : [];
      const missing = 8 - head.length - tail.length;
      if (missing < 1) return null;
      src = [...head, ...Array(missing).fill('0'), ...tail].join(':');
    }
    const groups = src.split(':');
    if (groups.length !== 8 || groups.some((g) => g.length < 1 || g.length > 4)) return null;
    return groups.map((g) => g.toUpperCase().padStart(4, '0'));
  };

  const trimGroups = (groups) => groups.map((g) => g.replace(/^0+(?=.)/, ''));

  /** Abreviación: sin ceros a la izquierda y «::» en la racha más larga de ceros (≥ 2 grupos). */
  const compress6 = (groups) => {
    const g = trimGroups(groups);
    let bestStart = -1;
    let bestLen = 0;
    for (let i = 0; i < 8;) {
      if (g[i] !== '0') { i += 1; continue; }
      let j = i;
      while (j < 8 && g[j] === '0') j += 1;
      if (j - i > bestLen) { bestStart = i; bestLen = j - i; }
      i = j;
    }
    if (bestLen < 2) return g.join(':');
    const left = g.slice(0, bestStart).join(':');
    const right = g.slice(bestStart + bestLen).join(':');
    return `${left}::${right}`;
  };

  const parseMac = (text) => {
    const clean = String(text).replace(/[^0-9a-fA-F]/g, '');
    if (clean.length !== 12) return null;
    return clean.match(/.{2}/g).map((h) => parseInt(h, 16));
  };
  const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, '0');

  /** EUI-64 a partir de una MAC. Devuelve cada paso del proceso. */
  const eui64 = (macText) => {
    const bytes = parseMac(macText);
    if (!bytes) return null;
    const flipped = bytes.slice();
    flipped[0] ^= 0x02;
    const full = [...flipped.slice(0, 3), 0xFF, 0xFE, ...flipped.slice(3)];
    const groups = [];
    for (let i = 0; i < 8; i += 2) groups.push(hex2(full[i]) + hex2(full[i + 1]));
    return {
      bytes: bytes.map(hex2),
      flippedFirst: hex2(flipped[0]),
      firstBefore: hex2(bytes[0]),
      withFffe: full.map(hex2),
      groups,
      id: trimGroups(groups).join(':')
    };
  };

  const api = {
    toInt, toIp, parseIp, maskFromPrefix, prefixFromMask, bin8, bin32, dottedBin,
    classify, analyze, sameNetwork, magic, longestPrefixMatch, expand6, compress6, trimGroups, parseMac, eui64
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.IPCALC = api;
})(typeof window !== 'undefined' ? window : globalThis);
