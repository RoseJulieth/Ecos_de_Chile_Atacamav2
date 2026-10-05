// Minimapa circular: toda la escena vista desde arriba, girada para que "arriba" sea hacia donde mira la cámara.
// Muestra casas, portales, NPC, al jugador y una guía hacia el fragmento de la escena.
const FRAGMENT_OF_PORTAL = { diaguita: 1, batallon: 2, florido: 3, chanarcillo: 4, bahia: 5 };

export class Minimap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = canvas.width;
        this.visible = true;
        try { this.visible = localStorage.getItem('ecos_minimap') !== '0'; } catch (e) { /* sin almacenamiento */ }
        this.apply();
        this.frame = 0;
    }

    toggle() {
        this.visible = !this.visible;
        try { localStorage.setItem('ecos_minimap', this.visible ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
        this.apply();
    }

    apply() { this.canvas.style.display = this.visible ? 'block' : 'none'; }

    /**
     * @param cur escena actual (World.current)
     * @param player {x, z, heading} posición y hacia dónde mira (radianes)
     * @param camAngle ángulo horizontal de la cámara
     * @param inventory inventario (para saber qué fragmentos ya están recogidos)
     * @param t tiempo en segundos
     */
    update(cur, player, camAngle, inventory, t) {
        if (!this.visible || !cur) return;
        if ((this.frame++ & 1) === 1) return; // 30 veces por segundo bastan

        const { ctx, size } = this;
        const cx = size / 2, cy = size / 2, R = size / 2 - 6;
        const k = R / (cur.radius + 3);

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

        // fondo con el color del suelo
        const g = '#' + cur.def.ground.toString(16).padStart(6, '0');
        ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(20,12,6,0.35)'; ctx.fillRect(0, 0, size, size);

        // mundo (x, z) -> mapa, girado según la cámara
        ctx.translate(cx, cy);
        ctx.rotate(camAngle);
        ctx.scale(k, k);

        // borde jugable
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2 / k;
        ctx.beginPath(); ctx.arc(0, 0, cur.radius, 0, Math.PI * 2); ctx.stroke();

        // casas y agua (colisiones rectangulares)
        for (const c of cur.colliders.list) {
            if (c.t !== 'r') continue;
            ctx.save();
            ctx.translate(c.x, c.z);
            ctx.rotate(-Math.atan2(c.sin, c.cos));
            ctx.fillStyle = c.hw > 100 ? 'rgba(47,181,201,0.85)' : 'rgba(78,52,30,0.9)';
            ctx.fillRect(-c.hw, -c.hd, c.hw * 2, c.hd * 2);
            ctx.restore();
        }

        // portales
        for (const p of cur.portals) {
            const { x, z } = p.userData.pos;
            const done = inventory.hasFragment(FRAGMENT_OF_PORTAL[p.userData.target]);
            ctx.fillStyle = '#' + p.userData.color.toString(16).padStart(6, '0');
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8 / k;
            ctx.beginPath(); ctx.arc(x, z, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (done) {
                ctx.fillStyle = '#0a3d12'; ctx.font = `bold ${5.5}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('✔', x, z + 0.3);
            }
        }

        // NPC
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 0.7 / k;
        for (const n of cur.npcs) {
            ctx.beginPath(); ctx.arc(n.position.x, n.position.z, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // fragmento de la escena (si falta): estrella que late + línea guía
        const frag = cur.fragments.find((f) => f.visible);
        if (frag) {
            const fx = frag.position.x, fz = frag.position.z;
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255,224,102,0.8)'; ctx.lineWidth = 1.4 / k;
            ctx.beginPath(); ctx.moveTo(player.x, player.z); ctx.lineTo(fx, fz); ctx.stroke();
            ctx.setLineDash([]);

            const pulse = 1 + Math.sin(t * 5) * 0.2;
            ctx.fillStyle = 'rgba(255,224,102,0.35)';
            ctx.beginPath(); ctx.arc(fx, fz, 5.5 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffd83a'; ctx.strokeStyle = '#7a4b00'; ctx.lineWidth = 0.9 / k;
            this.star(fx, fz, 3.6 * pulse, 1.5 * pulse);
        }

        // jugador (flecha)
        ctx.save();
        ctx.translate(player.x, player.z);
        ctx.rotate(Math.atan2(Math.cos(player.heading), Math.sin(player.heading)));
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d140b'; ctx.lineWidth = 1 / k;
        ctx.beginPath(); ctx.moveTo(3.4, 0); ctx.lineTo(-2.4, 2.4); ctx.lineTo(-1.2, 0); ctx.lineTo(-2.4, -2.4); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();

        ctx.restore();

        // marco y norte
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        const nx = cx + Math.sin(camAngle) * (R - 12), ny = cy - Math.cos(camAngle) * (R - 12);
        ctx.fillStyle = '#fff6dc'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 4; ctx.strokeText('N', nx, ny); ctx.fillText('N', nx, ny);

        this.caption(cur, player, camAngle, frag, inventory);
    }

    star(x, z, outer, inner) {
        const { ctx } = this;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 ? inner : outer, a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
            if (i) ctx.lineTo(px, pz); else ctx.moveTo(px, pz);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    /** Cartel inferior: distancia y flecha hacia el fragmento (brújula). */
    caption(cur, player, camAngle, frag, inventory) {
        const { ctx, size } = this;
        const w = size * 0.86, h = 40, x = (size - w) / 2, y = size - h - 4;
        ctx.fillStyle = 'rgba(20,12,6,0.88)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#fff6dc'; ctx.textBaseline = 'middle'; ctx.font = 'bold 19px sans-serif';
        if (frag) {
            const dx = frag.position.x - player.x, dz = frag.position.z - player.z;
            const dist = Math.hypot(dx, dz);
            // ángulo relativo a la cámara: 0 = justo adelante
            const rel = Math.atan2(dx * Math.cos(camAngle) - dz * Math.sin(camAngle), -(dx * Math.sin(camAngle) + dz * Math.cos(camAngle)));
            ctx.save();
            ctx.translate(x + 26, y + h / 2);
            ctx.rotate(rel);
            ctx.fillStyle = '#ffd83a'; ctx.strokeStyle = '#7a4b00'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(10, 10); ctx.lineTo(0, 5); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
            ctx.fillStyle = '#fff6dc'; ctx.textAlign = 'left';
            ctx.fillText(`${frag.userData.icon} Fragmento · ${Math.round(dist)} m`, x + 48, y + h / 2 + 1, w - 56);
        } else if (cur.fragments.length) {
            ctx.textAlign = 'center';
            ctx.fillText('✔ Fragmento recogido', size / 2, y + h / 2 + 1, w - 16);
        } else {
            ctx.textAlign = 'center';
            ctx.fillText(`Fragmentos: ${inventory.getFragmentCount()}/5`, size / 2, y + h / 2 + 1, w - 16);
        }
    }
}
