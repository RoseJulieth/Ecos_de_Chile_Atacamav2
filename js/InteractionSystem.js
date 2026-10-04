export class InteractionSystem {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.nearestInteractable = null;
        this.interactionRange = 3.0;
        this.isDialogOpen = false;
    }

    update(playerPosition, interactables) {
        let nearest = null;
        let minDistance = Infinity;

        // Encontrar el objeto interactuable más cercano
        interactables.forEach(obj => {
            if (!obj.userData.interactable) return;

            const distance = playerPosition.distanceTo(obj.position);

            if (distance < this.interactionRange && distance < minDistance) {
                minDistance = distance;
                nearest = obj;
            }
        });

        // Actualizar UI de interacción
        if (nearest !== this.nearestInteractable) {
            this.nearestInteractable = nearest;
            this.updateInteractionPrompt();
        }
    }

    updateInteractionPrompt() {
        if (!this.nearestInteractable) {
            this.uiManager.hideInteractionPrompt();
            return;
        }

        const type = this.nearestInteractable.userData.type;
        let promptText = '';

        switch (type) {
            case 'fragment':
                promptText = 'E: Recolectar';
                break;
            case 'npc':
                promptText = 'E: Hablar';
                break;
            case 'info_sign':
                promptText = 'E: Leer información';
                break;
            default:
                promptText = 'E: Interactuar';
        }

        this.uiManager.showInteractionPrompt(promptText);
    }

    tryInteract() {
        if (!this.nearestInteractable || this.isDialogOpen) {
            return null;
        }

        return {
            object: this.nearestInteractable,
            type: this.nearestInteractable.userData.type,
            data: this.nearestInteractable.userData
        };
    }

    openDialog(npcData) {
        this.isDialogOpen = true;
        this.uiManager.showNPCDialog(npcData);
    }

    closeDialog() {
        this.isDialogOpen = false;
        this.uiManager.hideNPCDialog();
        this.updateInteractionPrompt();
    }

    isInDialog() {
        return this.isDialogOpen;
    }

    getNearestInteractable() {
        return this.nearestInteractable;
    }
}
