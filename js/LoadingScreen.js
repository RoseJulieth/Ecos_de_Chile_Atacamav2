// Pantalla de carga: barra de progreso real (por etapas de initGame) y datos curiosos de Atacama.
const CURIOSIDADES = [
    'El Desierto Florido ocurre cuando lluvias poco comunes hacen brotar miles de flores en Atacama.',
    'Copiapó es la capital de la Región de Atacama y su historia está muy ligada a la minería.',
    'Bahía Inglesa es famosa por sus aguas turquesas y sus playas de arena blanca.',
    'El pueblo Diaguita habitó los valles de Atacama y es reconocido por su cerámica.',
    'El descubrimiento de plata en Chañarcillo (1832) impulsó el crecimiento de toda la región.',
    'Consejo: acércate a los NPC y a los fragmentos brillantes y presiona E para interactuar.',
    'Consejo: mantén Shift para correr y usa la barra espaciadora para saltar.'
];

export class LoadingScreen {
    constructor() {
        this.el = document.getElementById('loading-screen');
        this.bar = document.getElementById('loading-bar-fill');
        this.pct = document.getElementById('loading-pct');
        this.label = document.getElementById('loading-label');
        this.tip = document.getElementById('loading-tip');
        this.progress = 0;
        this.tipIndex = Math.floor(Math.random() * CURIOSIDADES.length);

        this.showTip();
        this.tipTimer = setInterval(() => this.showTip(), 4000);
    }

    showTip() {
        this.tip.textContent = CURIOSIDADES[this.tipIndex % CURIOSIDADES.length];
        this.tipIndex++;
    }

    /** fraction: 0..1 (nunca retrocede). label: qué se está cargando. */
    set(fraction, label) {
        this.progress = Math.max(this.progress, Math.min(1, fraction));
        const pct = Math.round(this.progress * 100);
        this.bar.style.width = `${pct}%`;
        this.pct.textContent = `${pct}%`;
        if (label) this.label.textContent = label;
    }

    /** Algo salió mal: mostrar el aviso y dejar entrar igualmente. */
    fail(mensaje) {
        this.label.textContent = mensaje;
        this.label.classList.add('error');
        const btn = document.getElementById('loading-continue');
        btn.style.display = 'inline-block';
        btn.onclick = () => this.hide();
    }

    hide() {
        clearInterval(this.tipTimer);
        this.el.classList.add('hidden');
        setTimeout(() => { this.el.style.display = 'none'; }, 600);
    }
}
