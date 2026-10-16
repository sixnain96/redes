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
    }
  ],

  glossary: [
    ['Access Point', 'Dispositivo que extiende una LAN cableada hacia una WLAN mediante IEEE 802.11.'],
    ['Broadcast', 'Tráfico de difusión enviado a todos los equipos de un dominio; los routers delimitan estos dominios.'],
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
    ['ARP', 'Protocolo que permite descubrir la dirección MAC asociada a una dirección IP dentro de la red local.'],
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
    ["Pool DHCP", "Conjunto de direcciones y parámetros que un servidor DHCP puede entregar a los clientes.", 'second'],
    ["Concesión (lease)", "Asignación de una dirección IP a un cliente por parte del servidor DHCP.", 'second'],
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
    ['WLAN', 'Red local inalámbrica que ofrece movilidad mediante ondas de radio.']
  ]
};
