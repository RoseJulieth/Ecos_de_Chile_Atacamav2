export class InventorySystem {
    constructor() {
        this.maxSlots = 50;
        this.categories = {
            fragments: [],
            items: [],
            resources: []
        };
        this.collectedFragments = new Set();
    }

    addFragment(fragmentData) {
        if (this.collectedFragments.has(fragmentData.id)) {
            console.log(`⚠️ Fragmento ${fragmentData.id} ya recolectado`);
            return false;
        }

        if (this.getTotalItems() >= this.maxSlots) {
            console.warn('Inventario lleno');
            return false;
        }

        console.log(`✅ Agregando fragmento al inventario:`, fragmentData);
        this.categories.fragments.push(fragmentData);
        this.collectedFragments.add(fragmentData.id);
        this.save();
        console.log(`📦 Fragmentos en inventario:`, this.categories.fragments.length);
        return true;
    }

    addItem(itemData, category = 'items') {
        if (this.getTotalItems() >= this.maxSlots) {
            return false;
        }

        this.categories[category].push(itemData);
        this.save();
        return true;
    }

    getTotalItems() {
        return this.categories.fragments.length +
            this.categories.items.length +
            this.categories.resources.length;
    }

    getFragmentCount() {
        return this.categories.fragments.length;
    }

    hasFragment(id) {
        return this.collectedFragments.has(id);
    }

    save() {
        const data = {
            fragments: Array.from(this.collectedFragments),
            items: this.categories.items,
            resources: this.categories.resources
        };
        localStorage.setItem('ecos_atacama_inventory', JSON.stringify(data));
    }

    load(fragmentsData = null) {
        const saved = localStorage.getItem('ecos_atacama_inventory');
        if (saved) {
            const data = JSON.parse(saved);
            this.collectedFragments = new Set(data.fragments || []);
            this.categories.items = data.items || [];
            this.categories.resources = data.resources || [];

            // Reconstruir fragmentos completos desde fragmentsData
            if (fragmentsData && this.collectedFragments.size > 0) {
                console.log(`🔄 Reconstruyendo ${this.collectedFragments.size} fragmentos desde datos...`);
                this.categories.fragments = [];
                this.collectedFragments.forEach(id => {
                    const fragmentData = fragmentsData.find(f => f.id === id);
                    if (fragmentData) {
                        this.categories.fragments.push(fragmentData);
                        console.log(`  ✅ Fragmento reconstruido: ${fragmentData.name}`);
                    }
                });
            }

            console.log(`📦 Inventario cargado:`, {
                fragments: this.categories.fragments.length,
                items: this.categories.items.length,
                resources: this.categories.resources.length
            });

            return data;
        }
        return null;
    }

    clear() {
        this.categories = {
            fragments: [],
            items: [],
            resources: []
        };
        this.collectedFragments.clear();
        localStorage.removeItem('ecos_atacama_inventory');
    }

    getInventoryData() {
        return {
            total: this.getTotalItems(),
            max: this.maxSlots,
            fragments: this.categories.fragments,
            items: this.categories.items,
            resources: this.categories.resources
        };
    }
}
