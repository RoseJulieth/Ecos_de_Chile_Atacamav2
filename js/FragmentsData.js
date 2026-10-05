// Los 5 fragmentos históricos del juego (datos que muestran el inventario y los avisos).
// Cada fragmento está en una escena distinta; ver js/scenes.js.

export const FRAGMENTS = [
    {
        id: 1,
        name: "Cultura Diaguita",
        icon: "🏺",
        color: 0xFFD700,
        info: "Pueblo originario (1000-1540 d.C). Famosos por su cerámica 'jarro-pato'.",
        period: "1000-1540 d.C",
        origin: "Valle de Copiapó, Región de Atacama",
        belongedTo: "Pueblo Diaguita",
        description: "Los Diaguitas fueron maestros alfareros que habitaron los valles de Atacama. Sus jarros-pato son considerados obras maestras de la cerámica precolombina, combinando funcionalidad con representaciones artísticas de aves acuáticas.",
        fact: "Sus jarros-pato combinaban funcionalidad con arte, representando patos que nadaban en el agua."
    },
    {
        id: 2,
        name: "Batallón Atacama",
        icon: "⚔️",
        color: 0x8B0000,
        info: "Unidad militar de 1879, conocidos como 'Los Curitas' por sus uniformes negros.",
        period: "1879 - Guerra del Pacífico",
        origin: "Copiapó, Región de Atacama",
        belongedTo: "Ejército de Chile",
        description: "El Batallón Atacama fue una unidad militar legendaria durante la Guerra del Pacífico. Apodados 'Los Curitas' por sus uniformes negros, demostraron un valor inquebrantable en la Batalla de Tacna el 26 de mayo de 1880.",
        fact: "Participaron heroicamente en la Batalla de Tacna, siendo reconocidos por su valentía."
    },
    {
        id: 3,
        name: "Desierto Florido",
        icon: "🌸",
        color: 0xFF69B4,
        info: "Fenómeno único donde semillas latentes florecen tras lluvias inusuales.",
        period: "Fenómeno Natural Cíclico",
        origin: "Desierto de Atacama",
        belongedTo: "Patrimonio Natural de Chile",
        description: "El Desierto Florido es uno de los fenómenos naturales más espectaculares del planeta. Semillas que permanecen latentes durante décadas germinan simultáneamente cuando las lluvias del fenómeno de El Niño llegan al desierto más árido del mundo.",
        fact: "Ocurre cada 5-7 años cuando El Niño trae lluvias al desierto más árido del mundo."
    },
    {
        id: 4,
        name: "Plata Chañarcillo",
        icon: "💎",
        color: 0xC0C0C0,
        info: "Descubierto en 1832, convirtió a Copiapó en capital minera.",
        period: "1832-1875",
        origin: "Mina de Chañarcillo, Copiapó",
        belongedTo: "Mineros de Atacama",
        description: "El descubrimiento de plata en Chañarcillo por Juan Godoy en 1832 transformó a Copiapó de un pueblo polvoriento en la capital minera de Chile. La riqueza generada financió el primer ferrocarril de Sudamérica y modernizó toda la región.",
        fact: "El descubrimiento fue realizado por Juan Godoy, un arriero que cambió la historia de Chile."
    },
    {
        id: 5,
        name: "Bahía Inglesa",
        icon: "🏖️",
        color: 0x1E90FF,
        info: "Puerto histórico. Nombrado por la visita del corsario Edward Davis en 1687.",
        period: "Siglo XVII - Actualidad",
        origin: "Bahía Inglesa, Caldera",
        belongedTo: "Pescadores Changos y Corsarios",
        description: "Bahía Inglesa recibió su nombre en 1687 cuando el corsario inglés Edward Davis ancló aquí. Antes, los changos (pescadores indígenas) ya conocían estas aguas. Hoy es famosa por sus playas de arena blanca y aguas turquesas.",
        fact: "Sus aguas turquesas y arena blanca la convierten en una de las playas más hermosas de Chile."
    }
];
