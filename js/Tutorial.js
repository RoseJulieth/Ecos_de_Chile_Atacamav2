// Tutorial de controles y objetivo. Se muestra al empezar la partida y desde "Ver controles" en la pausa.
export class Tutorial {
    constructor() {
        this.el = document.getElementById('tutorial');
        this.opened = false;
    }

    open() {
        this.opened = true;
        this.el.style.display = 'flex';
        if (document.pointerLockElement) document.exitPointerLock();
        document.getElementById('tutorial-ok').focus({ preventScroll: true });
    }

    close() {
        this.opened = false;
        this.el.style.display = 'none';
    }

    isOpen() {
        return this.opened;
    }
}
