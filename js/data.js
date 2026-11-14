/* ==============================
   Datos educativos de NETLAB
   Basados exclusivamente en el material suministrado.
================================ */
window.NETLAB_DATA = {
  networkTypes: {
    lan: {
      short: 'LAN',
      title: 'Red de Área Local',
      range: '10 m – 1 km',
      speed: '1 Gbps – 10 Gbps',
      medium: 'Cable UTP (Ethernet)',
      use: 'Redes de oficina y hogar',
      description: 'Cobertura limitada a un edificio, oficina o residencia. Se caracteriza por alta velocidad y baja latencia.'
    },
    wlan: {
      short: 'WLAN',
      title: 'Red Local Inalámbrica',
      range: '10 m – 100 m',
      speed: '54 Mbps – 9.6 Gbps',
      medium: 'Ondas de radio (Wi-Fi)',
      use: 'Dispositivos móviles e IoT',
      description: 'Conecta dispositivos mediante ondas de radio y permite movilidad dentro de un área local.'
    },
    man: {
      short: 'MAN',
      title: 'Red de Área Metropolitana',
      range: '10 km – 50 km',
      speed: '100 Mbps – 1 Gbps',
      medium: 'Fibra óptica / microondas',
      use: 'Campus urbanos e ISPs locales',
      description: 'Cubre una ciudad o municipio y se utiliza para interconectar sedes dentro de una zona urbana.'
    },
    wan: {
      short: 'WAN',
      title: 'Red de Área Amplia',
      range: '> 100 km (global)',
      speed: 'Variable, hasta Gbps',
      medium: 'Fibra submarina / satelital',
      use: 'Interconexión global',
      description: 'Conecta regiones, países o continentes. Internet es el ejemplo de mayor escala.'
    }
  },

  devices: {
    host: {
      title: 'Host / PC',
      layer: 'Capas 1–7',
      addressing: 'MAC e IP',
      role: 'Genera y consume tráfico final de red.',
      detail: 'Un host es cualquier dispositivo con interfaz de red que genera o consume información: PC, laptop, impresora o dispositivo IoT. Utiliza una dirección MAC física y una dirección IP lógica.'
    },
    server: {
      title: 'Servidor',
      layer: 'Capas superiores y servicios',
      addressing: 'IP + servicios de aplicación',
      role: 'Atiende solicitudes de múltiples clientes y centraliza recursos.',
      detail: 'Los servicios trabajados en clase incluyen DHCP para asignación dinámica, DNS para traducir nombres a direcciones IP y HTTP/HTTPS para entregar páginas web.'
    },
    switch: {
      title: 'Switch',
      layer: 'Capa 2 — Enlace de datos',
      addressing: 'Direcciones MAC',
      role: 'Conmuta tramas dentro de una LAN.',
      detail: 'Aprende la MAC de origen y la asocia a un puerto en su tabla CAM/MAC. Si desconoce la MAC destino realiza flooding; si la conoce, reenvía de forma unicast por el puerto correspondiente.'
    },
    router: {
      title: 'Router',
      layer: 'Capa 3 — Red',
      addressing: 'Direcciones IP',
      role: 'Enruta paquetes entre subredes.',
      detail: 'Examina la IP destino y consulta su tabla de enrutamiento para decidir la mejor salida. Además delimita dominios de broadcast.'
    },
    ap: {
      title: 'Access Point',
      layer: 'Capas 1–2',
      addressing: 'MAC / IEEE 802.11',
      role: 'Extiende la LAN cableada hacia una WLAN.',
      detail: 'Un AP dedicado actúa como puente entre Ethernet 802.3 y Wi-Fi 802.11. A diferencia de un router inalámbrico doméstico, no integra por sí solo router, switch, DHCP y NAT.'
    }
  },

  mediaProfiles: {
    utp: {
      title: 'UTP',
      speed: 'Hasta 10 Gbps',
      distance: 'Hasta 100 m por segmento',
      cost: 'Bajo',
      interference: 'Susceptible a EMI',
      mobility: 'Nula',
      best: 'Estabilidad y cableado de redes locales',
      note: 'Flexible, económico y fácil de instalar. Utiliza 4 pares trenzados y conector RJ-45.'
    },
    fiber: {
      title: 'Fibra óptica',
      speed: 'Gbps – Tbps',
      distance: 'Decenas de km',
      cost: 'Alto',
      interference: 'Inmune a EMI',
      mobility: 'Nula',
      best: 'Largas distancias y alto tráfico',
      note: 'Transporta información mediante pulsos de luz. Monomodo para largas distancias y multimodo para campus y centros de datos.'
    },
    wireless: {
      title: 'Inalámbrico',
      speed: 'Hasta ~9.6 Gbps teórico',
      distance: 'Decenas / cientos de m',
      cost: 'Medio',
      interference: 'Muy susceptible',
      mobility: 'Total',
      best: 'Movilidad y despliegue flexible',
      note: 'Transporta datos por ondas electromagnéticas. Wi-Fi se rige por IEEE 802.11.'
    }
  },

  scenarios: {
    home: {
      label: 'Casa u oficina pequeña',
      recommended: 'utp',
      reason: 'El material recomienda cable cuando se busca estabilidad y velocidad garantizada en distancias de red local.'
    },
    campus: {
      label: 'Campus / centro de datos',
      recommended: 'fiber',
      reason: 'La fibra multimodo se plantea para redes internas de campus y centros de datos, con mayor capacidad y resistencia a interferencias.'
    },
    city: {
      label: 'Enlace entre ciudades',
      recommended: 'fiber',
      reason: 'La fibra monomodo está orientada a distancias largas y backbones entre ciudades o proveedores de Internet.'
    },
    mobility: {
      label: 'Usuarios móviles',
      recommended: 'wireless',
      reason: 'El medio inalámbrico aporta movilidad total y facilita la conexión de laptops, celulares y dispositivos IoT.'
    }
  },

  pinouts: {
    a: [
      'Blanco/Verde', 'Verde', 'Blanco/Naranja', 'Azul',
      'Blanco/Azul', 'Naranja', 'Blanco/Café', 'Café'
    ],
    b: [
      'Blanco/Naranja', 'Naranja', 'Blanco/Verde', 'Azul',
      'Blanco/Azul', 'Verde', 'Blanco/Café', 'Café'
    ]
  },

  packetSteps: [
    {
      key: 'host',
      title: '1. Host de origen',
      body: 'Genera la solicitud HTTP y la encapsula con la IP de destino y el gateway local.'
    },
    {
      key: 'switch',
      title: '2. Switch LAN',
      body: 'Conmuta la trama dentro de la red local hacia la interfaz del router que funciona como gateway.'
    },
    {
      key: 'router',
      title: '3. Router WAN',
      body: 'Examina la dirección IP destino y enruta el paquete hacia la red donde se encuentra el servidor.'
    },
    {
      key: 'server',
      title: '4. Servidor',
      body: 'Procesa la petición en la capa de aplicación y responde al cliente siguiendo la ruta de retorno.'
    }
  ],

  labSteps: [
    {
      number: '01',
      title: 'Colocar los dispositivos',
      body: 'Agrega 2 PC, 1 laptop, 2 switches Cisco 2960, 1 router 1941 y 1 Access Point AP-PT.'
    },
    {
      number: '02',
      title: 'Conectar con UTP',
      body: 'Conecta PC0 y PC1 al Switch1 con Copper Straight-Through. Une Switch1 con Switch0 mediante Copper Cross-Over y el Access Point a Switch0 con cable directo.'
    },
    {
      number: '03',
      title: 'Implementar fibra',
      body: 'Utiliza un enlace de fibra entre Switch0 y el router con puertos o módulos compatibles. La guía trabaja con SFP / 100BASE-FX.'
    },
    {
      number: '04',
      title: 'Configurar Wi-Fi',
      body: 'Activa el Access Point, configura el SSID “RedPractica” e instala el módulo inalámbrico WPC300N en la laptop para conectarla.'
    },
    {
      number: '05',
      title: 'Asignar IPv4',
      body: 'Trabaja en la subred 192.168.1.0/24: PC0 192.168.1.10, PC1 192.168.1.11, Laptop0 192.168.1.12 y Router0 192.168.1.1 como gateway.'
    },
    {
      number: '06',
      title: 'Verificar conectividad',
      body: 'Desde PC0 ejecuta ping 192.168.1.12 y utiliza Simulation para observar el recorrido del paquete por UTP, switches, fibra y Wi-Fi.'
    }
  ],

  quiz: [
    {
      question: '¿En qué capa del modelo OSI opera un switch LAN convencional y qué estructura utiliza para decidir el reenvío?',
      options: ['Capa 3 — Tabla de enrutamiento', 'Capa 2 — Tabla de direcciones MAC', 'Capa 1 — Tabla ARP', 'Capa 4 — Tabla de sockets'],
      answer: 1,
      explanation: 'El switch LAN convencional opera en Capa 2 y toma decisiones de reenvío utilizando direcciones MAC almacenadas en su tabla CAM/MAC.'
    },
    {
      question: '¿Cuál es la función principal del gateway predeterminado configurado en un host?',
      options: ['Traducir nombres de dominio', 'Asignar direcciones IP dinámicas', 'Enviar tráfico hacia destinos fuera de la subred local', 'Filtrar virus en el host'],
      answer: 2,
      explanation: 'El gateway es la dirección de la interfaz del router local utilizada para salir hacia otras redes.'
    },
    {
      question: '¿Qué dispositivo delimita los dominios de broadcast?',
      options: ['Hub', 'Switch', 'Access Point', 'Router'],
      answer: 3,
      explanation: 'Los routers no reenvían el tráfico de broadcast entre sus interfaces, por eso delimitan esos dominios.'
    },
    {
      question: 'Si un host necesita traducir “www.cisco.com” a una dirección IP, ¿qué servicio consulta?',
      options: ['DHCP', 'HTTP', 'DNS', 'FTP'],
      answer: 2,
      explanation: 'DNS traduce nombres de dominio legibles a direcciones IP.'
    },
    {
      question: '¿Qué ocurre si un switch recibe una trama cuya MAC destino no está en su tabla?',
      options: ['La descarta', 'La envía únicamente al router', 'Realiza flooding por los puertos activos excepto el de origen', 'Envía ICMP Unreachable'],
      answer: 2,
      explanation: 'Cuando desconoce la MAC destino, el switch realiza flooding para intentar localizarla.'
    },
    {
      question: '¿Qué servicio evita configurar manualmente IP, máscara y gateway en muchos computadores?',
      options: ['HTTP', 'SMTP', 'DHCP', 'SSH'],
      answer: 2,
      explanation: 'DHCP asigna dinámicamente direcciones IP, máscaras y gateways a los clientes.'
    },
    {
      question: 'Entre dos saltos de router, ¿qué direcciones cambian en la trama?',
      options: ['Las IP de origen y destino', 'Las MAC de origen y destino', 'Los puertos TCP/UDP', 'La máscara de subred'],
      answer: 1,
      explanation: 'En cada enlace se reconstruye la trama de Capa 2 y cambian las direcciones MAC. Las IP de extremo a extremo se mantienen para el paquete.'
    },
    {
      question: '¿Qué cable se utiliza típicamente para conectar un PC a un switch en Packet Tracer?',
      options: ['Serial DCE', 'Coaxial', 'Copper Straight-Through', 'Copper Cross-Over'],
      answer: 2,
      explanation: 'Para conectar dispositivos diferentes como PC y switch se utiliza cable directo Copper Straight-Through.'
    },
    {
      question: '¿Cuántos bits tiene una dirección MAC?',
      options: ['32 bits', '48 bits', '64 bits', '128 bits'],
      answer: 1,
      explanation: 'Una dirección MAC tiene 48 bits, escritos como 12 dígitos hexadecimales (por ejemplo 00:1A:2B:3C:4D:5E).'
    },
    {
      question: '¿Qué identifican los primeros tres bytes (OUI) de una dirección MAC?',
      options: ['El puerto del switch', 'La red a la que pertenece', 'El fabricante de la interfaz', 'El sistema operativo del host'],
      answer: 2,
      explanation: 'El OUI identifica al fabricante de la interfaz; los tres bytes restantes identifican la interfaz concreta.'
    },
    {
      question: 'Un switch recibe una trama cuya MAC de origen no está en su tabla. ¿Qué hace con esa dirección?',
      options: ['La descarta', 'La asocia al puerto por el que llegó la trama', 'La convierte en una dirección IP', 'Se la pide al servidor DNS'],
      answer: 1,
      explanation: 'El switch aprende la MAC de origen y la asocia al puerto de entrada en su tabla CAM/MAC.'
    },
    {
      cut: 'second',
      question: "¿Cómo se llama la PDU de la capa de Transporte cuando se utiliza TCP?",
      options: ["Trama", "Segmento", "Paquete", "Bits"],
      answer: 1,
      explanation: "Con TCP la PDU de Transporte es el segmento; con UDP se suele llamar datagrama. La trama pertenece a la capa de Enlace de datos."
    },
    {
      cut: 'second',
      question: "¿Dónde ocurre el desencapsulamiento?",
      options: ["En el equipo emisor, al bajar por las capas", "En el equipo receptor, al subir por las capas", "Únicamente en el router", "Solo en el medio físico"],
      answer: 1,
      explanation: "El desencapsulamiento ocurre en el receptor: cada capa retira su encabezado y entrega el resto a la capa superior."
    },
    {
      cut: 'second',
      question: "¿En qué capa se agregan las direcciones MAC de origen y destino?",
      options: ["Red", "Transporte", "Enlace de datos", "Aplicación"],
      answer: 2,
      explanation: "Las direcciones MAC pertenecen a la capa de Enlace de datos y forman parte del encabezado de la trama; en la capa de Red se usan direcciones IP."
    },
    {
      cut: 'second',
      question: "Un firewall que permite o bloquea tráfico según reglas es un ejemplo de:",
      options: ["Seguridad física", "Seguridad lógica", "Encapsulamiento", "PDU de capa física"],
      answer: 1,
      explanation: "El firewall aplica reglas para permitir o bloquear tráfico, por lo que es una medida de seguridad lógica."
    },
    {
      cut: 'second',
      question: "En una captura, el puerto TCP de destino es 443. ¿Qué protocolo de aplicación es el más probable?",
      options: ["HTTP", "SMTP", "HTTPS", "DNS"],
      answer: 2,
      explanation: "El puerto 443 se usa normalmente para conexiones web seguras (HTTPS). El puerto de origen, como 51422, es temporal y lo asigna el cliente."
    },
    {
      cut: 'second',
      question: "¿Cuántas capas tiene el modelo OSI?",
      options: ["4", "5", "7", "8"],
      answer: 2,
      explanation: "OSI tiene siete capas. TCP/IP usa cuatro y en el taller se estudian cinco: Aplicación, Transporte, Red, Enlace de datos y Física."
    },
    {
      cut: 'second',
      question: "¿Cuál de las siguientes NO es una buena práctica de seguridad?",
      options: ["Control de acceso al cuarto de telecomunicaciones", "Uso de UPS", "Compartir la misma contraseña de Wi-Fi indefinidamente", "Videovigilancia en cuartos de datos"],
      answer: 2,
      explanation: "Compartir una sola contraseña de Wi-Fi sin cambiarla es una mala práctica de seguridad lógica."
    },
    {
      cut: 'second',
      question: "¿Qué medida mitiga la falta de separación entre la red administrativa y la de invitados?",
      options: ["Un switch más grande", "Videovigilancia", "VLAN separadas con reglas de firewall o ACL", "Cambiar el cable UTP"],
      answer: 2,
      explanation: "Las VLAN segmentan la red y el firewall o las ACL controlan qué tráfico puede pasar entre ellas."
    },
    {
      cut: 'second',
      question: "¿Para qué sirve el comando ip dhcp excluded-address en el taller de DHCP?",
      options: ["Apagar el servicio DHCP", "Reservar direcciones que el pool no debe entregar", "Cambiar la máscara de subred", "Crear una VLAN"],
      answer: 1,
      explanation: "Las exclusiones reservan el gateway y evitan entregar direcciones distintas a las previstas (.10, .11 y .12)."
    },
    {
      cut: 'second',
      question: "En el taller, ¿por qué no fue necesario crear rutas estáticas en Router0?",
      options: ["Porque DHCP las crea", "Porque el router está conectado directamente a las dos redes", "Porque los switches enrutan", "Porque Server0 es estático"],
      answer: 1,
      explanation: "Router0 tiene una interfaz en cada red (192.168.10.0/24 y 192.168.30.0/24), así que ambas son redes directamente conectadas."
    },
    {
      cut: 'second',
      question: "¿Qué comando mostró en Router0 las direcciones entregadas por DHCP y las MAC de los clientes?",
      options: ["show ip interface brief", "show ip dhcp binding", "ping 192.168.10.1", "service dhcp"],
      answer: 1,
      explanation: "show ip dhcp binding lista cada dirección concedida con el identificador (MAC) del cliente y el tipo de asignación."
    },
    {
      cut: 'second',
      question: "PC0 recibió TTL 128 de Laptop0 y TTL 127 de Server0. ¿Qué lo explica?",
      options: ["Server0 es más lento", "El paquete hacia Server0 atravesó un router, que resta 1 al TTL", "El switch cambió el TTL", "DHCP modifica el TTL"],
      answer: 1,
      explanation: "Cada router que reenvía un paquete disminuye su TTL en uno. Laptop0 está en la misma red; Server0 está un salto de router más lejos."
    },
    {
      cut: 'second',
      question: "Al diagnosticar que un PC no llega a un servidor, ¿cuál es un orden razonable de revisión?",
      options: ["IP, luego cable, luego servicio", "Conexión física, VLAN y switch, IP/máscara/gateway, y por último puertos y servicio", "Reinstalar el sistema operativo", "Cambiar el servidor"],
      answer: 1,
      explanation: "El modelo de capas permite revisar de forma ordenada, de la capa física hacia arriba, en lugar de probar soluciones al azar."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿Cuántos bits tiene una dirección IPv4 y cómo se organizan?",
      options: ["32 bits en cuatro octetos de 8 bits", "48 bits en seis grupos de 8 bits", "64 bits en dos bloques de 32", "128 bits en ocho grupos de 16"],
      answer: 0,
      explanation: "Una dirección IPv4 tiene 32 bits repartidos en cuatro octetos de ocho bits, escritos en decimal separados por puntos."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿Cuál es la representación binaria del octeto 149?",
      options: ["10010101", "10100101", "10010011", "01001011"],
      answer: 0,
      explanation: "149 = 128 + 16 + 4 + 1, es decir 10010101. Con el método de la resta: 149 − 128 = 21; 21 − 16 = 5; 5 − 4 = 1; 1 − 1 = 0."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿A qué clase pertenece 192.168.49.149 y cuál es su máscara por defecto?",
      options: ["Clase C, 255.255.255.0 (/24)", "Clase B, 255.255.0.0 (/16)", "Clase A, 255.0.0.0 (/8)", "Clase D, sin máscara"],
      answer: 0,
      explanation: "El primer octeto 192 está entre 192 y 223, así que es clase C; su máscara por defecto es 255.255.255.0."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿Cuál de estas direcciones es privada según el RFC 1918?",
      options: ["172.16.49.199", "172.32.0.1", "8.8.8.8", "169.254.15.3"],
      answer: 0,
      explanation: "El bloque privado 172.16.0.0/12 llega hasta 172.31.255.255. 172.32.0.1 y 8.8.8.8 son públicas y 169.254.x.x es enlace local (APIPA)."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿Qué indica una dirección 169.254.x.x en un PC?",
      options: ["Que no obtuvo dirección de un servidor DHCP y usó APIPA", "Que está conectado directamente a Internet", "Que usa la dirección de loopback", "Que pertenece a una red OSPF"],
      answer: 0,
      explanation: "169.254.0.0/16 es el rango de enlace local que usa APIPA cuando no hay respuesta DHCP; permite comunicación solo con vecinos del segmento."
    },
    {
      cut: 'third',
      topic: 'estructura-ipv4',
      question: "¿Para qué sirve hacer ping a 127.0.0.1?",
      options: ["Para comprobar la pila TCP/IP del propio equipo", "Para probar el gateway", "Para alcanzar el servidor DHCP", "Para verificar el cable hacia el switch"],
      answer: 0,
      explanation: "127.0.0.1 es loopback: el paquete se procesa dentro del equipo y no circula por el enlace físico."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Cuál es la máscara decimal de un prefijo /26?",
      options: ["255.255.255.192", "255.255.255.224", "255.255.255.128", "255.255.255.240"],
      answer: 0,
      explanation: "/26 son 26 unos: 8 + 8 + 8 + 2. El último octeto 11000000 = 128 + 64 = 192."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Cuántos hosts utilizables tiene una red /26?",
      options: ["62", "64", "30", "126"],
      answer: 0,
      explanation: "h = 32 − 26 = 6 bits de host: 2^6 = 64 direcciones y 64 − 2 = 62 utilizables."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Por qué se restan dos direcciones en la fórmula 2^h − 2?",
      options: ["Una es la dirección de red y otra el broadcast", "Una es el gateway y otra el servidor DHCP", "Son direcciones multicast reservadas", "Una es el loopback y otra APIPA"],
      answer: 0,
      explanation: "La primera dirección identifica a la red y la última es el broadcast; ninguna se asigna a un equipo final."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Cuál es la dirección de red de 192.168.49.149/26?",
      options: ["192.168.49.128", "192.168.49.64", "192.168.49.192", "192.168.49.0"],
      answer: 0,
      explanation: "149 AND 192 = 10010101 AND 11000000 = 10000000 = 128."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Cuál es el broadcast de la red 192.168.49.128/26?",
      options: ["192.168.49.191", "192.168.49.190", "192.168.49.255", "192.168.49.129"],
      answer: 0,
      explanation: "La wildcard es 0.0.0.63 y 128 + 63 = 191."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "En 172.16.49.199/28, ¿cuál es el tamaño del bloque según el número mágico?",
      options: ["16 direcciones", "14 direcciones", "28 direcciones", "240 direcciones"],
      answer: 0,
      explanation: "256 − 240 = 16. Los múltiplos de 16 cercanos a 199 son 192 y 208, así que la red es .192 y el broadcast .207."
    },
    {
      cut: 'third',
      topic: 'subredes',
      question: "¿Cuál es la wildcard de una máscara 255.255.255.240?",
      options: ["0.0.0.15", "0.0.0.16", "0.0.0.240", "0.0.0.14"],
      answer: 0,
      explanation: "La wildcard es la máscara invertida bit a bit: 255 − 240 = 15."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "¿Por qué falló el ping de PC1 (192.168.49.66/26) a un PC con 192.168.49.130/26 en el mismo switch?",
      options: ["Porque pertenecen a subredes distintas y no hay ruta entre ellas", "Porque el switch bloquea las direcciones .130", "Porque el cable estaba cruzado", "Porque .130 es el broadcast"],
      answer: 0,
      explanation: "130 AND 192 = 128: el PC quedó en 192.168.49.128/26 y PC1 en .64/26. El switch no enruta entre subredes."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "¿Qué mensaje mostró Packet Tracer al asignar 192.168.49.255/24 a un PC?",
      options: ["Invalid IP for this subnet mask entered", "Destination host unreachable", "Request timed out", "DHCP request failed"],
      answer: 0,
      explanation: "La dirección .255 es el broadcast de la red /24, por eso Packet Tracer la rechaza como IP de host."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "¿Por qué una interfaz de router queda en rojo al conectarla?",
      options: ["Está administrativamente apagada hasta ejecutar no shutdown", "El cable es de categoría incorrecta", "El router no tiene IP pública", "El switch no soporta Gigabit"],
      answer: 0,
      explanation: "Las interfaces de un router Cisco pueden estar deshabilitadas por defecto; no shutdown las habilita."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "En un tracert de PC1 a PC4 en otra subred, ¿por qué el primer salto es el gateway?",
      options: ["Porque el PC entrega al gateway todo destino de otra subred", "Porque el gateway es el servidor DNS", "Porque el switch responde por el router", "Porque el TTL empieza en 1"],
      answer: 0,
      explanation: "PC1 detecta que el destino pertenece a otra red y envía la trama al gateway, que reenvía el paquete."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "¿Por qué la primera dirección que recibió PC5 por DHCP fue 172.16.49.38?",
      options: ["Porque .33 a .37 estaban excluidas del pool", "Porque .38 es el HostMin de la red", "Porque PC5 tenía MAC terminada en 38", "Porque DHCP siempre empieza en .38"],
      answer: 0,
      explanation: "El pool LAN-B excluyó .33 (gateway) a .37; la primera dirección libre es .38."
    },
    {
      cut: 'third',
      topic: 'taller-subredes',
      question: "Al cruzar R1, ¿qué campo de la cabecera IPv4 cambió de 255 a 254?",
      options: ["TTL", "Protocolo", "IP de origen", "IP de destino"],
      answer: 0,
      explanation: "Cada router reduce el TTL en una unidad para evitar que los paquetes circulen indefinidamente."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "Al pasar por un router, ¿qué se reemplaza en cada enlace?",
      options: ["Las direcciones MAC de la trama", "Las direcciones IP de origen y destino", "El número de versión de IP", "El protocolo ICMP"],
      answer: 0,
      explanation: "Cada router desencapsula la trama y crea otra con nuevas MAC; las IP de los extremos se mantienen si no hay NAT."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Por qué un ping desde la consola respondió con TTL 126 tras atravesar dos routers?",
      options: ["El host parte de 128 y cada router resta 1", "El router suma 2 al TTL", "Es el TTL de IPv6", "El switch resta 1 por puerto"],
      answer: 0,
      explanation: "128 − 2 = 126. En Simulation, un PDU simple parte de 255 y llega con 254 y 253."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Cuál es la primera dirección que PC0 resuelve con ARP para enviar a 192.168.20.10?",
      options: ["La MAC de su gateway 192.168.10.1", "La MAC de 192.168.20.10", "La MAC de R2", "La MAC del switch"],
      answer: 0,
      explanation: "El destino está en otra red, así que PC0 pregunta por la MAC del gateway."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Qué sustituye a ARP en IPv6?",
      options: ["Neighbor Discovery (ICMPv6)", "DHCPv6", "OSPFv3", "APIPA"],
      answer: 0,
      explanation: "IPv6 usa Neighbor Solicitation y Neighbor Advertisement de ICMPv6 para descubrir vecinos."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Cómo obtiene su dirección global un PC con SLAAC?",
      options: ["Recibe el prefijo del router y completa el identificador con su MAC (EUI-64)", "Un servidor DHCPv6 se la asigna", "La escribe el administrador", "La calcula con el TTL"],
      answer: 0,
      explanation: "El Router Advertisement anuncia el prefijo /64 y el equipo genera el identificador de interfaz a partir de su MAC."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Qué se hace en EUI-64 con la MAC 0006.2AE7.3E35?",
      options: ["Se inserta FFFE en medio y se invierte el séptimo bit: 0206:2AFF:FEE7:3E35", "Se duplica la MAC", "Se reemplaza por la IPv4", "Se convierte a decimal"],
      answer: 0,
      explanation: "La MAC se parte en 0006.2A y E7.3E35, se inserta FFFE y 00 pasa a 02 al invertir el bit U/L."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Cómo se abrevia 2001:0DB8:ACAD:0010:0000:0000:0000:0001?",
      options: ["2001:DB8:ACAD:10::1", "2001:DB8:ACAD:10:0:0:0:1::", "2001:DB8:ACAD:0010::1", "2001:DB8:ACAD::10:1"],
      answer: 0,
      explanation: "Se quitan los ceros iniciales de cada grupo y la racha de tres grupos en cero se reemplaza por ::."
    },
    {
      cut: 'third',
      topic: 'fallas',
      question: "¿Qué ocurre en un router sin ipv6 unicast-routing?",
      options: ["No reenvía paquetes IPv6 entre sus interfaces", "No reenvía paquetes IPv4", "Apaga todas sus interfaces", "Pierde su configuración IPv4"],
      answer: 0,
      explanation: "Sin ese comando el router no hace routing IPv6; el tráfico IPv4 sigue funcionando con normalidad."
    },
    {
      cut: 'third',
      topic: 'fallas',
      question: "R1 tiene la ruta hacia LAN2 pero R2 no tiene ruta de regreso. ¿Qué pasa con el ping?",
      options: ["Se pierde: la solicitud llega, pero la respuesta no regresa", "Responde con normalidad", "Responde con TTL más alto", "R1 aprende la ruta solo"],
      answer: 0,
      explanation: "Las respuestas ICMP también deben poder volver al origen; sin ruta de ida y de regreso no hay comunicación."
    },
    {
      cut: 'third',
      topic: 'capa-red',
      question: "¿Qué significa la entrada S* 0.0.0.0/0 [1/0] via 10.0.0.1?",
      options: ["Ruta estática por defecto con distancia administrativa 1", "Una ruta OSPF con costo 1", "Una red conectada directamente", "Una ruta IPv6 aprendida por SLAAC"],
      answer: 0,
      explanation: "S es ruta estática, * es candidata a ruta por defecto, 1 es la distancia administrativa y 0 la métrica mostrada."
    },
    {
      cut: 'third',
      topic: 'ospf',
      question: "¿Qué mide el 110 en [110/2] de una ruta O?",
      options: ["La distancia administrativa predeterminada de OSPF", "El costo acumulado", "El número de saltos", "El TTL de la ruta"],
      answer: 0,
      explanation: "110 es la distancia administrativa de OSPF; el 2 es el costo acumulado hasta la red."
    },
    {
      cut: 'third',
      topic: 'ospf',
      question: "¿A qué dirección se envían los paquetes Hello de OSPF?",
      options: ["224.0.0.5", "255.255.255.255", "10.0.0.2", "127.0.0.1"],
      answer: 0,
      explanation: "224.0.0.5 es la multicast reservada para los routers OSPF; el TTL es 1."
    },
    {
      cut: 'third',
      topic: 'ospf',
      question: "¿Qué se escribe en la sentencia network de OSPF para una red /24?",
      options: ["La wildcard 0.0.0.255", "La máscara 255.255.255.0", "El prefijo /24", "El número de área"],
      answer: 0,
      explanation: "OSPF usa wildcard en network: 192.168.10.0 0.0.0.255 area 0."
    },
    {
      cut: 'third',
      topic: 'ospf',
      question: "Con OSPF, ¿qué se agregó en R1 para alcanzar LAN3?",
      options: ["Ningún comando específico: la aprendió de R2", "Una ruta estática por cada red", "Una ruta por defecto", "Un nuevo cable"],
      answer: 0,
      explanation: "R1 aprendió O 192.168.30.0/24 [110/2] vía 10.0.0.2 sin ruta específica; con rutas estáticas hacen falta dos comandos."
    },
    {
      cut: 'third',
      topic: 'fallas',
      question: "En la falla 3, la máscara 255.255.0.0 en un PC no impidió el ping. ¿Qué conclusión es correcta?",
      options: ["Que responda el ping no prueba que la configuración sea correcta", "La máscara no importa nunca", "Siempre es culpa del switch", "El router desactivó la capa 3"],
      answer: 0,
      explanation: "El informe registra lo observado y sugiere Proxy ARP sin verificarlo; la máscara incorrecta sigue siendo un error de configuración."
    },
    {
      cut: 'third',
      topic: 'fallas',
      question: "¿Qué fallas se diagnostican con show ip interface brief?",
      options: ["Interfaces apagadas o sin dirección", "Cables cruzados mal ponchados", "Gateway incorrecto en un PC", "Contraseñas débiles"],
      answer: 0,
      explanation: "El comando muestra IP, estado y protocolo de cada interfaz; una interfaz con shutdown aparece administratively down."
    },
    {
      cut: 'third',
      topic: 'fallas',
      question: "¿Por qué el enlace entre routers siguió funcionando con un cable directo?",
      options: ["Por Auto-MDIX, que adapta el medio automáticamente", "Porque los routers no usan cables", "Porque el cable directo es siempre igual al cruzado", "Porque OSPF compensa el error"],
      answer: 0,
      explanation: "Con Auto-MDIX, el puerto detecta el tipo de cable y ajusta los pares; en equipos sin esa función el resultado sería distinto."
    }
  ],

  glossary: [
    ['Access Point', 'Dispositivo que extiende una LAN cableada hacia una WLAN mediante IEEE 802.11.'],
    ['Broadcast', 'Tráfico de difusión enviado a todos los equipos de un dominio; los routers delimitan estos dominios.', ['first','third']],
    ['DHCP', 'Servicio que asigna dinámicamente direcciones IP, máscara de subred y gateway.', 'both'],
    ['DNS', 'Servicio que traduce nombres de dominio legibles a direcciones IP.'],
    ['Fibra óptica', 'Medio guiado que transporta información mediante pulsos de luz.'],
    ['Flooding', 'Acción de un switch cuando desconoce la MAC destino: reenvía la trama por todos los puertos activos excepto el de origen.'],
    ['Gateway', 'Dirección IP de la interfaz del router local utilizada para salir a otras redes.', 'both'],
    ['Host', 'Dispositivo final con interfaz de red que genera o consume información.', 'both'],
    ['HTTP/HTTPS', 'Protocolos utilizados por servidores web para entregar contenido a los navegadores.'],
    ['ICMP', 'Protocolo utilizado en pruebas de conectividad como ping.', 'both'],
    ['IP', 'Identificador lógico utilizado para la comunicación dentro y fuera de una subred.', 'both'],
    ['LAN', 'Red de área local con cobertura limitada a un edificio, oficina o residencia.'],
    ['MAC', 'Dirección física de 48 bits asociada a una interfaz de red y utilizada por switches en Capa 2.', 'both'],
    ['OUI', 'Primeros 3 bytes de una dirección MAC; identifican al fabricante de la interfaz.'],
    ['ARP', 'Protocolo que permite descubrir la dirección MAC asociada a una dirección IP dentro de la red local.', ['first','third']],
    ['Tabla CAM / MAC', 'Tabla del switch que asocia direcciones MAC aprendidas con el puerto por el que se alcanzan.', 'both'],
    ["Encapsulamiento", "Proceso por el cual cada capa agrega su encabezado a la PDU recibida de la capa superior antes de entregarla a la inferior.", 'second'],
    ["Desencapsulamiento", "Proceso inverso en el receptor: cada capa retira su encabezado y entrega el resto a la capa superior.", 'second'],
    ["PDU", "Unidad de Datos de Protocolo: nombre que recibe la información en cada capa (datos, segmento, paquete, trama, bits).", 'second'],
    ["Segmento", "PDU de la capa de Transporte cuando se usa TCP; con UDP se suele llamar datagrama.", 'second'],
    ["Paquete", "PDU de la capa de Red; contiene las direcciones IP de origen y destino.", 'second'],
    ["Trama", "PDU de la capa de Enlace de datos; contiene las direcciones MAC y datos de verificación de errores.", 'second'],
    ["TCP", "Protocolo de Transporte orientado a conexión, con confirmaciones y control de flujo y errores.", 'second'],
    ["UDP", "Protocolo de Transporte sin conexión, con baja sobrecarga y sin confirmación de entrega.", 'second'],
    ["Puerto", "Número que identifica la aplicación o proceso de destino en la capa de Transporte (por ejemplo, 443 para HTTPS).", 'second'],
    ["OSI", "Modelo de referencia de siete capas que describe funciones de red.", 'second'],
    ["TCP/IP", "Modelo práctico de cuatro capas sobre el que funciona Internet.", 'second'],
    ["VLAN", "Segmentación lógica de una red para separar usuarios y servicios dentro de la misma infraestructura.", 'second'],
    ["Firewall", "Medida de seguridad lógica que aplica reglas para permitir o bloquear tráfico.", 'second'],
    ["ACL", "Lista de control de acceso: reglas que permiten o deniegan tráfico específico entre redes o dispositivos.", 'second'],
    ["Pool DHCP", "Conjunto de direcciones y parámetros que un servidor DHCP puede entregar a los clientes.", ['second','third']],
    ["Concesión (lease)", "Asignación de una dirección IP a un cliente por parte del servidor DHCP.", ['second','third']],
    ["Troubleshooting", "Diagnóstico ordenado de fallas de red, normalmente capa por capa.", 'second'],
    ["NIC", "Tarjeta o interfaz de red; también los últimos 3 bytes de una MAC que identifican la interfaz.", 'both'],
    ["Sniffing", "Interceptación de tráfico no cifrado para robar información.", 'second'],
    ["Phishing", "Engaño a personas para obtener credenciales o accesos.", 'second'],
    ["DoS / DDoS", "Ataque que satura recursos o ancho de banda para dejar un servicio fuera de línea.", 'second'],
    ["MITM", "Ataque en el que un intermediario se interpone entre dos partes que se comunican.", 'second'],
    ["AAA", "Modelo de Autenticación, Autorización y Auditoría (accounting) de los accesos.", 'second'],
    ["Backup", "Copia de seguridad periódica de configuraciones y datos críticos.", 'second'],
    ['MAN', 'Red de área metropolitana que cubre una ciudad o municipio.'],
    ['Máscara de subred', 'Valor que define qué parte de una dirección IP corresponde a la red y cuál al host.', 'both'],
    ['Ping', 'Comando de verificación utilizado para comprobar conectividad mediante ICMP.', 'both'],
    ['RJ-45', 'Conector 8P8C utilizado con cableado de par trenzado Ethernet.', 'both'],
    ['Router', 'Dispositivo de Capa 3 que enruta paquetes entre subredes usando direcciones IP.', 'both'],
    ['Switch', 'Dispositivo de Capa 2 que conmuta tramas dentro de una LAN usando direcciones MAC.', 'both'],
    ['T568A', 'Norma de ordenamiento de los ocho conductores de un cable de par trenzado.', 'both'],
    ['T568B', 'Norma alternativa de ordenamiento de los ocho conductores de un cable de par trenzado.', 'both'],
    ['UTP', 'Par trenzado no blindado compuesto por cuatro pares de cobre.'],
    ['WAN', 'Red de área amplia que conecta regiones, países o continentes.'],
    ['Wi-Fi', 'Tecnología inalámbrica regida por el estándar IEEE 802.11.'],
    ['WLAN', 'Red local inalámbrica que ofrece movilidad mediante ondas de radio.'],
    ["Octeto", "Grupo de 8 bits. Una dirección IPv4 tiene cuatro octetos separados por puntos.", 'third'],
    ["Notación binaria", "Representación de un número con unos y ceros. Cada octeto IPv4 se escribe con 8 bits.", 'third'],
    ["Clase de dirección", "Clasificación histórica de IPv4 según el primer octeto: A (1–126), B (128–191), C (192–223), D (multicast) y E (reservada).", 'third'],
    ["RFC 1918", "Documento que reserva los bloques privados 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16, que no se enrutan en Internet.", 'third'],
    ["Dirección privada", "Dirección IPv4 de uso interno, tomada de los bloques del RFC 1918.", 'third'],
    ["Loopback", "Dirección 127.0.0.1: el paquete se procesa en el propio equipo y sirve para probar la pila TCP/IP.", 'third'],
    ["APIPA", "Autoconfiguración 169.254.x.x que usa un equipo cuando no obtiene dirección de un servidor DHCP.", 'third'],
    ["Prefijo (CIDR)", "Número de bits de red de una dirección, escrito tras una barra: /26 equivale a 255.255.255.192.", 'third'],
    ["Netmask", "Máscara con unos en la porción de red y ceros en la de host.", 'third'],
    ["Wildcard", "Máscara invertida bit a bit de la netmask. 255.255.255.192 tiene wildcard 0.0.0.63; OSPF la usa en network.", 'third'],
    ["AND lógico", "Operación bit a bit que devuelve 1 solo si ambos bits son 1. IP AND máscara = dirección de red.", 'third'],
    ["Dirección de red", "Primera dirección de una subred, con todos los bits de host en 0. Identifica a la red y no se asigna a equipos.", 'third'],
    ["HostMin / HostMax", "Primera y última direcciones utilizables de una subred: red + 1 y broadcast − 1.", 'third'],
    ["Número mágico", "256 menos el valor del octeto interesante de la máscara; es el tamaño del bloque de cada subred.", 'third'],
    ["Subred", "Parte de una red obtenida al tomar bits de host para ampliar la porción de red.", 'third'],
    ["Bits de host (h)", "Cantidad de bits que quedan para equipos: h = 32 − prefijo. Hay 2^h − 2 hosts utilizables.", 'third'],
    ["Subred diferente", "Dos equipos con IP y máscara que producen direcciones de red distintas no se comunican sin un router.", 'third'],
    ["TTL", "Campo IPv4 que cada router reduce en uno; si llega a cero el paquete se descarta. Evita bucles.", 'third'],
    ["Hop Limit", "Equivalente del TTL en IPv6: baja en uno en cada router.", 'third'],
    ["Ruta estática", "Ruta escrita manualmente por el administrador con ip route o ipv6 route.", 'third'],
    ["Ruta por defecto", "Ruta 0.0.0.0/0 que se usa cuando ninguna ruta más específica coincide.", 'third'],
    ["Distancia administrativa", "Valor que indica la preferencia entre fuentes de rutas: 1 para estáticas y 110 para OSPF.", 'third'],
    ["Tabla de enrutamiento", "Lista de redes que conoce un router, con la interfaz o el siguiente salto para alcanzarlas.", 'third'],
    ["Siguiente salto", "Dirección IP del próximo router al que se entrega el paquete para llegar a una red.", 'third'],
    ["IPv6", "Protocolo de 128 bits escrito en hexadecimal; usa prefijos /64 en las LAN y Hop Limit en lugar de TTL.", 'third'],
    ["Link-local", "Dirección IPv6 FE80::/10 válida solo en el enlace local; se usa, por ejemplo, como gateway (FE80::1).", 'third'],
    ["SLAAC", "Autoconfiguración IPv6 sin estado: el router anuncia el prefijo y el equipo genera su identificador.", 'third'],
    ["EUI-64", "Método que construye el identificador de interfaz IPv6 a partir de la MAC: inserta FFFE e invierte el séptimo bit.", 'third'],
    ["Neighbor Discovery", "Mecanismo de IPv6, con mensajes ICMPv6, para descubrir vecinos; reemplaza a ARP.", 'third'],
    ["ipv6 unicast-routing", "Comando que habilita el reenvío de paquetes IPv6 en un router.", 'third'],
    ["OSPF", "Protocolo de routing dinámico de estado de enlace; los routers intercambian información y calculan rutas.", 'third'],
    ["Área 0", "Área troncal de OSPF; en los talleres todas las redes se anuncian en el área 0.", 'third'],
    ["Router ID", "Identificador de 32 bits de un router OSPF; por defecto, la IP más alta de sus interfaces.", 'third'],
    ["DR / BDR", "Router designado y respaldo de un segmento OSPF. En el taller, 10.0.0.2 fue DR y 10.0.0.1 BDR.", 'third'],
    ["Hello (OSPF)", "Paquete multicast a 224.0.0.5 con el que los routers se descubren; se envía cada 10 s con Dead Interval de 40 s.", 'third'],
    ["Multicast", "Envío a un grupo de destinos; 224.0.0.5 es el grupo de los routers OSPF.", 'third'],
    ["Auto-MDIX", "Función que detecta el tipo de cable y ajusta los pares, por lo que un cable directo puede funcionar donde se esperaba uno cruzado.", 'third'],
    ["Proxy ARP", "Mecanismo por el que un router responde a un ARP en nombre de otro destino; explica algunos casos de máscara errónea que aún funcionan.", 'third'],
    ["Modo Simulation", "Modo de Packet Tracer que muestra paso a paso cada PDU, sus cabeceras y los eventos por dispositivo.", 'third']
  ]
};
