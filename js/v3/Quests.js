// Misiones de los NPC: te las ofrecen al hablarles, piden algo y te entregan un ítem de la zona.
//
// Tipos de objetivo:
//   collect: recoger `count` objetos brillantes repartidos por la escena (se colocan en scenes.js con ctx.pickup)
//   sight:   avistar animales (ids de especie, ver Fauna.js); cuenta lo que ya esté en el inventario
//
// Estados de una misión: 'new' (sin aceptar) -> 'active' (aceptada) -> 'ready' (objetivo cumplido) -> 'done' (ítem entregado)

export const QUESTS = [
    {
        id: 'q_batallon', npc: 'npc_003', title: 'Munición perdida',
        offer: 'Soldado, perdimos tres cajas de munición durante la última marcha y sin ellas el batallón queda desarmado. ¿Puedes recuperarlas? Búscalas por el campamento: brillan sobre la arena.',
        waiting: 'Todavía faltan cajas de munición. Revisa cerca de las carpas y de las trincheras.',
        finish: '¡Las tres cajas! El Batallón Atacama te lo agradece. Toma esta carabina: sirvió a quienes defendieron nuestro país.',
        goal: { type: 'collect', count: 3, label: 'cajas de munición' },
        reward: { id: 'item_carabina', name: 'Carabina de infantería', icon: '🔫', place: 'Batallón Atacama', info: 'Arma de carga por la recámara, como las que usó el ejército chileno durante la Guerra del Pacífico (1879-1884).' }
    },
    {
        id: 'q_diaguita', npc: 'npc_011', title: 'Tiestos diaguitas',
        offer: 'Estoy reconstruyendo una vasija diaguita, pero faltan tres fragmentos. Seguro quedaron cerca de los muros y las chozas. ¿Me ayudas a encontrarlos? Brillan entre la arena.',
        waiting: 'Aún faltan tiestos de cerámica. Busca cerca de los muros y de las chozas.',
        finish: '¡Perfecto! Con estos tiestos puedo completar la vasija. Como agradecimiento, toma esta daga de cobre.',
        goal: { type: 'collect', count: 3, label: 'tiestos de cerámica' },
        reward: { id: 'item_daga', name: 'Daga de cobre', icon: '🗡️', place: 'Cultura Diaguita', info: 'Los pueblos del Norte Chico de Chile trabajaron el cobre desde hace siglos para hacer herramientas, armas y adornos.' }
    },
    {
        id: 'q_chanarcillo', npc: 'npc_001', title: 'Muestras de plata',
        offer: 'Se me perdieron unas muestras de mineral al bajar de la mina. Si me traes tres, sabré qué vetas siguen dando plata. Brillan entre las rocas.',
        waiting: 'Faltan muestras de mineral. Mira entre las rocas y cerca de los rieles.',
        finish: '¡Plata de la buena! El capataz va a estar contento. Llévate mi viejo pico: me acompañó muchos años en la mina.',
        goal: { type: 'collect', count: 3, label: 'muestras de mineral' },
        reward: { id: 'item_pico', name: 'Pico de minero', icon: '⛏️', place: 'Chañarcillo', info: 'Herramienta con la que se arrancaba el mineral de las vetas de plata de Chañarcillo.' }
    },
    {
        id: 'q_semillas', npc: 'npc_004', title: 'Semillas dormidas',
        offer: 'Para que el desierto florezca hay que cuidar las semillas. Hoy se me cayeron tres de mi bolso. ¿Puedes recogerlas entre las flores? Las verás brillar.',
        waiting: 'Aún faltan semillas. Búscalas entre las flores y las rocas.',
        finish: '¡Gracias! Las guardaré para el próximo desierto florido. Toma unas semillas para que recuerdes este lugar.',
        goal: { type: 'collect', count: 3, label: 'semillas' },
        reward: { id: 'item_semillas', name: 'Semillas del desierto', icon: '🌱', place: 'Desierto Florido', info: 'Las plantas del Desierto Florido, como la añañuca, pueden esperar años bajo la tierra hasta que una lluvia inusual las despierta.' }
    },
    {
        id: 'q_polinizadoras', npc: 'npc_005', title: 'Las polinizadoras',
        offer: 'Las flores no se reproducen solas. Busca a las abejas que van de flor en flor y míralas de cerca: así entenderás cómo viaja el polen.',
        waiting: 'Aún no has observado de cerca a las abejas. Acércate a las flores y espera un momento.',
        finish: '¡Las viste! Sin ellas no habría semillas. Toma mi lupa de botánico para seguir observando la naturaleza.',
        goal: { type: 'sight', species: ['fauna_abeja'], label: 'abejas nativas' },
        reward: { id: 'item_lupa', name: 'Lupa de botánico', icon: '🔍', place: 'Desierto Florido', info: 'Sirve para observar de cerca flores, semillas e insectos.' }
    },
    {
        id: 'q_conchas', npc: 'npc_006', title: 'Conchas en la orilla',
        offer: 'Mis nietos coleccionan conchas, pero el mar se llevó las que tenía. ¿Me recoges tres en la playa? Brillan cerca de la orilla.',
        waiting: 'Todavía faltan conchas. Recorre la orilla y los alrededores de los botes.',
        finish: '¡Qué conchas más lindas! Toma esta caña artesanal: con paciencia y respeto por el mar, siempre hay pesca.',
        goal: { type: 'collect', count: 3, label: 'conchas' },
        reward: { id: 'item_cana', name: 'Caña de pescar artesanal', icon: '🎣', place: 'Bahía Inglesa', info: 'Los pescadores artesanales de la costa de Atacama pescan con caña y anzuelo desde la orilla y desde pequeños botes.' }
    },
    {
        id: 'q_aves', npc: 'npc_007', title: 'Aves de la bahía',
        offer: 'Estoy contando las aves de la bahía para mi estudio. ¿Puedes observar de cerca a las gaviotas? Las que están posadas se asustan si te acercas rápido.',
        waiting: 'Todavía no has observado las gaviotas de cerca. Mira hacia el mar y la orilla.',
        finish: '¡Gracias por tu ayuda! Aquí tienes unos binoculares para observar aves sin molestarlas.',
        goal: { type: 'sight', species: ['fauna_gaviota'], label: 'gaviotas' },
        reward: { id: 'item_binoculares', name: 'Binoculares', icon: '🔭', place: 'Bahía Inglesa', info: 'Permiten observar aves a distancia sin asustarlas.' }
    },
    {
        id: 'q_vecinos', npc: 'npc_008', title: 'Los vecinos de cuatro patas',
        offer: 'En el pueblo viven gatos y perros que casi nadie mira de cerca. El gato es tímido y el quiltro, muy curioso. ¿Los encuentras a los dos?',
        waiting: 'Aún te falta conocer a uno de los vecinos. Recorre la plaza y las calles.',
        finish: '¡Los conociste! Ellos también son vecinos de Copiapó. Toma este poncho tejido para el frío de la noche.',
        goal: { type: 'sight', species: ['fauna_gato', 'fauna_perro'], label: 'el gato y el quiltro' },
        reward: { id: 'item_poncho', name: 'Poncho tejido', icon: '🧥', place: 'Copiapó', info: 'Prenda tradicional de lana, muy usada en el campo chileno para abrigarse del frío.' }
    }
];

const KEY = 'ecos_atacama_quests';

export class Quests {
    constructor(inventory) {
        this.inventory = inventory;
        this.byId = new Map(QUESTS.map((q) => [q.id, q]));
        this.state = {};      // id -> 'active' | 'ready' | 'done'
        this.picked = {};     // id -> [índices de objetos ya recogidos]
        this.onChange = null; // se llama cuando cambia algo (para refrescar HUD y objetos de la escena)
        this.load();
    }

    // ---------- consulta ----------
    forNpc(npcId) { return QUESTS.filter((q) => q.npc === npcId); }
    stateOf(id) { return this.state[id] || 'new'; }
    isActive(id) { return this.state[id] === 'active' || this.state[id] === 'ready'; }
    pickedIndexes(id) { return this.picked[id] || []; }
    isPicked(id, index) { return this.pickedIndexes(id).includes(index); }

    /** Misión que muestra el NPC ahora: la primera sin entregar. */
    current(npcId) { return this.forNpc(npcId).find((q) => this.stateOf(q.id) !== 'done') || null; }

    /** Estado visible para la marca sobre el NPC: 'available' | 'active' | 'ready' | 'done' | null */
    markerState(npcId) {
        const list = this.forNpc(npcId);
        if (!list.length) return null;
        const q = this.current(npcId);
        if (!q) return 'done';
        const st = this.stateOf(q.id);
        return st === 'new' ? 'available' : st;
    }

    progress(q) {
        const g = q.goal;
        if (g.type === 'collect') return { have: this.pickedIndexes(q.id).length, need: g.count };
        const have = g.species.filter((id) => this.inventory.categories.items.some((i) => i.id === id)).length;
        return { have, need: g.species.length };
    }

    isComplete(q) { const p = this.progress(q); return p.have >= p.need; }

    /** Misiones aceptadas y sin entregar (para el panel de seguimiento). */
    activeQuests() { return QUESTS.filter((q) => this.isActive(q.id)); }

    // ---------- cambios ----------
    /** Actualiza 'active' -> 'ready' si el objetivo ya está cumplido. Devuelve las misiones que acaban de quedar listas. */
    refresh() {
        const newlyReady = [];
        let changed = false;
        for (const q of QUESTS) {
            if (this.state[q.id] === 'active' && this.isComplete(q)) { this.state[q.id] = 'ready'; changed = true; newlyReady.push(q); }
            else if (this.state[q.id] === 'ready' && !this.isComplete(q)) { this.state[q.id] = 'active'; changed = true; }
        }
        if (changed) this.changed();
        return newlyReady;
    }

    accept(id) {
        if (this.stateOf(id) !== 'new') return;
        this.state[id] = 'active';
        this.refresh();
        this.changed();
    }

    /** Se recogió el objeto `index` de la misión `id`. Devuelve el progreso. */
    collect(id, index) {
        if (!this.isActive(id) || this.isPicked(id, index)) return null;
        (this.picked[id] ||= []).push(index);
        this.refresh();
        this.changed();
        return this.progress(this.byId.get(id));
    }

    /** Entrega el ítem de recompensa. Devuelve el ítem o null. */
    complete(id) {
        const q = this.byId.get(id);
        if (!q || this.stateOf(id) !== 'ready') return null;
        this.state[id] = 'done';
        if (!this.inventory.categories.items.some((i) => i.id === q.reward.id)) this.inventory.addItem({ ...q.reward });
        this.changed();
        return q.reward;
    }

    reset() { this.state = {}; this.picked = {}; try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ } this.changed(); }

    changed() { this.save(); if (this.onChange) this.onChange(); }

    save() { try { localStorage.setItem(KEY, JSON.stringify({ state: this.state, picked: this.picked })); } catch (e) { /* sin almacenamiento */ } }

    load() {
        try {
            const d = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (d) { this.state = d.state || {}; this.picked = d.picked || {}; }
        } catch (e) { /* datos dañados: se ignoran */ }
    }

    // ---------- texto del diálogo ----------
    /** HTML que se agrega al diálogo del NPC según el estado de su misión. */
    dialogHtml(q, justAccepted = false, reward = null) {
        const box = (color, inner) => `<div style="margin:18px 0 4px;padding:16px 18px;border-radius:10px;background:rgba(0,0,0,.4);border:2px solid ${color};line-height:1.55;text-align:left">${inner}</div>`;
        const p = this.progress(q);
        if (reward) {
            return box('#58e07a', `<div style="color:#58e07a;font-weight:bold;margin-bottom:6px">✅ ¡Misión completada! · ${q.title}</div>${q.finish}
                <div style="margin-top:12px;padding:10px 12px;background:rgba(255,215,0,.12);border-radius:8px;color:#FFD700"><span style="font-size:26px">${reward.icon}</span> <b>${reward.name}</b> <small style="color:#ddd">· se agregó a tus Items</small></div>`);
        }
        const st = this.stateOf(q.id);
        if (justAccepted) return box('#FFD700', `<div style="color:#FFD700;font-weight:bold;margin-bottom:6px">📜 Nueva misión · ${q.title}</div>${q.offer}<div style="margin-top:10px;color:#9ad">Objetivo: ${q.goal.label} (${p.have}/${p.need})</div>`);
        if (st === 'active') return box('#7fb3e6', `<div style="color:#7fb3e6;font-weight:bold;margin-bottom:6px">📜 Misión en curso · ${q.title}</div>${q.waiting}<div style="margin-top:10px;color:#9ad">Progreso: ${q.goal.label} (${p.have}/${p.need})</div>`);
        return '';
    }
}
