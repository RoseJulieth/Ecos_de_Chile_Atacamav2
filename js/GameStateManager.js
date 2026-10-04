export class GameStateManager {
    constructor() {
        this.currentState = 'menu'; // menu, playing, paused
    }
    
    saveGame(playerState, inventoryState) {
        const gameData = {
            player: playerState,
            inventory: inventoryState,
            timestamp: Date.now()
        };
        localStorage.setItem('ecos_atacama_save', JSON.stringify(gameData));
    }
    
    loadGame() {
        const saved = localStorage.getItem('ecos_atacama_save');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }
    
    hasSavedGame() {
        return localStorage.getItem('ecos_atacama_save') !== null;
    }
    
    clearSave() {
        localStorage.removeItem('ecos_atacama_save');
        localStorage.removeItem('ecos_atacama_inventory');
    }
    
    setState(state) {
        this.currentState = state;
    }
    
    getState() {
        return this.currentState;
    }
    
    isPlaying() {
        return this.currentState === 'playing';
    }
    
    isPaused() {
        return this.currentState === 'paused';
    }
}
