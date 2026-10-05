export class UIManager {
    constructor(fragmentsData) {
        this.fragmentsData = fragmentsData;
        this.setupUI();
    }

    setupUI() {
        // Crear lista de fragmentos en el panel
        const listContainer = document.getElementById('list-fragments');
        listContainer.innerHTML = '';

        this.fragmentsData.forEach(data => {
            const item = document.createElement('div');
            item.className = 'fragment-item';
            item.id = `ui-frag-${data.id}`;
            const icon = data.icon || '🏺';
            item.innerHTML = `🔒 ${icon} ${data.name}`;
            listContainer.appendChild(item);
        });
    }

    showMainMenu() {
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
    }

    showHUD() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('pause-menu').style.display = 'none';
    }

    showPauseMenu() {
        document.getElementById('pause-menu').style.display = 'flex';
    }

    hidePauseMenu() {
        document.getElementById('pause-menu').style.display = 'none';
    }

    updateFragmentUI(fragmentId, collected) {
        const item = document.getElementById(`ui-frag-${fragmentId}`);
        if (item) {
            const fragment = this.fragmentsData.find(f => f.id === fragmentId);
            const icon = fragment.icon || '🏺';
            if (collected) {
                item.classList.add('collected');
                item.innerHTML = `✅ ${icon} ${fragment.name}`;
            } else {
                item.classList.remove('collected');
                item.innerHTML = `🔒 ${icon} ${fragment.name}`;
            }
        }
    }

    updateCounter(count, total) {
        document.getElementById('counter').innerText = `${count}/${total}`;
    }

    showNotification(title, info, header = '¡Fragmento Recolectado!') {
        const notif = document.getElementById('notification');
        notif.innerHTML = `
            <strong>${header}</strong><br>
            <span style="font-size: 20px; color: #FFD700;">${title}</span><br>
            <i style="font-size: 14px; color: #DDD;">${info}</i>
        `;
        notif.style.display = 'block';

        setTimeout(() => {
            notif.style.display = 'none';
        }, 5000);
    }

    showInventoryPanel() {
        const panel = document.getElementById('full-inventory');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    updateInventoryPanel(inventoryData) {
        console.log('📦 Actualizando panel de inventario:', inventoryData);

        const slotsUsed = document.getElementById('slots-used');
        if (slotsUsed) {
            slotsUsed.innerText = `${inventoryData.total}/${inventoryData.max}`;
        }

        // Actualizar categorías
        this.updateCategory('inv-fragments', inventoryData.fragments, 'fragments');
        this.updateCategory('inv-items', inventoryData.items, 'items');
        this.updateCategory('inv-resources', inventoryData.resources, 'resources');
    }

    updateCategory(elementId, items, categoryName) {
        const container = document.getElementById(elementId);
        if (!container) {
            console.warn(`⚠️ Contenedor no encontrado: ${elementId}`);
            return;
        }

        container.innerHTML = '';

        console.log(`📦 Actualizando categoría ${categoryName}:`, items);

        if (items && items.length > 0) {
            items.forEach(item => {
                console.log(`  ➕ Agregando item:`, item.name);
                const div = document.createElement('div');
                div.className = 'inv-item';

                // Formato especial para fragmentos con iconos y descripciones detalladas
                if (categoryName === 'fragments') {
                    const icon = item.icon || '🏺';
                    div.innerHTML = `
                        <div style="display: flex; align-items: start; gap: 10px; margin-bottom: 10px;">
                            <div style="font-size: 32px; flex-shrink: 0;">${icon}</div>
                            <div style="flex: 1;">
                                <strong style="color: #FFD700; font-size: 16px;">${item.name}</strong><br>
                                <small style="color: #DDD; line-height: 1.4;">${item.description || item.info}</small>
                            </div>
                        </div>
                        <div style="padding-left: 42px; border-left: 3px solid #FFD700; margin-left: 16px;">
                            <small style="color: #AAA; display: block; margin: 3px 0;">
                                <strong>📅 Período:</strong> ${item.period || 'N/A'}
                            </small>
                            <small style="color: #AAA; display: block; margin: 3px 0;">
                                <strong>📍 Origen:</strong> ${item.origin || 'Región de Atacama'}
                            </small>
                            <small style="color: #AAA; display: block; margin: 3px 0;">
                                <strong>👥 Pertenece a:</strong> ${item.belongedTo || 'Patrimonio de Atacama'}
                            </small>
                            ${item.fact ? `<small style="color: #9370DB; display: block; margin-top: 5px; font-style: italic;">
                                💡 ${item.fact}
                            </small>` : ''}
                        </div>
                    `;
                } else {
                    div.innerHTML = `
                        <strong>${item.icon ? item.icon + ' ' : ''}${item.name}</strong>${item.place ? ` <small style="opacity:.7">· ${item.place}</small>` : ''}<br>
                        <small>${item.info || item.description || ''}</small>
                    `;
                }

                container.appendChild(div);
            });

            console.log(`✅ ${items.length} items agregados a ${categoryName}`);
        } else {
            container.innerHTML = '<p style="opacity: 0.5; text-align: center;">Vacío</p>';
            console.log(`📭 Categoría ${categoryName} vacía`);
        }
    }

    showVictoryMessage() {
        const notif = document.getElementById('notification');
        notif.innerHTML = `
            <h2 style="color: #FFD700; margin: 0;">¡FELICIDADES!</h2>
            <p style="margin: 10px 0;">Has completado el recorrido histórico de Atacama</p>
            <p style="font-size: 14px;">Todos los fragmentos han sido recolectados</p>
        `;
        notif.style.display = 'block';
        notif.style.padding = '30px';
    }

    // Sistema de interacción
    showInteractionPrompt(text) {
        let prompt = document.getElementById('interaction-prompt');
        if (!prompt) {
            prompt = document.createElement('div');
            prompt.id = 'interaction-prompt';
            prompt.style.cssText = `
                position: absolute;
                bottom: 30%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                border: 2px solid #FFD700;
                font-size: 18px;
                font-weight: bold;
                pointer-events: none;
                z-index: 1000;
            `;
            document.getElementById('hud').appendChild(prompt);
        }
        prompt.innerText = text;
        prompt.style.display = 'block';
    }

    hideInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.style.display = 'none';
        }
    }

    // Sistema de diálogo con NPCs con integración de múltiples videos de YouTube
    showNPCDialog(npcData) {
        let dialog = document.getElementById('npc-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'npc-dialog';
            dialog.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(20, 20, 20, 0.95);
                color: white;
                padding: 30px;
                border-radius: 15px;
                border: 3px solid #FFD700;
                max-width: 900px;
                max-height: 90vh;
                overflow-y: auto;
                pointer-events: auto;
                z-index: 2000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            `;
            document.getElementById('hud').appendChild(dialog);
        }

        const typeColors = {
            'Historia': '#8B4513',
            'Leyenda': '#9370DB',
            'Turismo': '#20B2AA',
            'Paisaje': '#32CD32'
        };

        const typeIcons = {
            'Historia': '📜',
            'Leyenda': '✨',
            'Turismo': '🗺️',
            'Paisaje': '🌄'
        };

        // Convertir URL de YouTube a formato embebido
        const getYouTubeEmbedUrl = (url) => {
            if (!url) return null;

            // Extraer el ID del video de diferentes formatos de URL de YouTube
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);

            if (match && match[2].length === 11) {
                return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1&showinfo=0`;
            }
            return null;
        };

        // 🎬 SISTEMA DE MÚLTIPLES VIDEOS
        // Soporta tanto formato antiguo (youtube_video) como nuevo (youtube_videos array)
        let videos = [];

        // Compatibilidad con formato anterior (un solo video)
        if (npcData.youtube_video) {
            videos.push({
                title: "Video Relacionado",
                url: npcData.youtube_video,
                description: `Contenido educativo sobre ${npcData.name}`
            });
        }

        // Nuevo formato (múltiples videos)
        if (npcData.youtube_videos && Array.isArray(npcData.youtube_videos)) {
            videos = [...videos, ...npcData.youtube_videos];
        }

        // Crear sección de videos si hay videos disponibles
        let videoSection = '';
        if (videos.length > 0) {
            // Si hay múltiples videos, crear sistema de pestañas
            if (videos.length > 1) {
                videoSection = `
                    <div style="margin: 20px 0; text-align: center;">
                        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: 2px solid #d4a017;">
                            <h4 style="color: #FFD700; margin: 0 0 15px 0; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                🎥 Videos Relacionados (${videos.length})
                            </h4>
                            
                            <!-- Pestañas de videos -->
                            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                                ${videos.map((video, index) => `
                                    <button 
                                        onclick="window.switchVideo(${index})" 
                                        id="video-tab-${index}"
                                        style="
                                            padding: 8px 15px;
                                            font-size: 12px;
                                            background: ${index === 0 ? '#d4a017' : 'rgba(100,100,100,0.5)'};
                                            color: white;
                                            border: 2px solid ${index === 0 ? '#FFD700' : '#666'};
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-weight: bold;
                                            transition: all 0.3s ease;
                                        "
                                        onmouseover="this.style.background='#ffbe2e'"
                                        onmouseout="this.style.background='${index === 0 ? '#d4a017' : 'rgba(100,100,100,0.5)'}'"
                                    >
                                        📺 ${index + 1}
                                    </button>
                                `).join('')}
                            </div>
                            
                            <!-- Contenedor del video activo -->
                            <div id="video-container">
                                ${videos.map((video, index) => {
                    const embedUrl = getYouTubeEmbedUrl(video.url);
                    return `
                                        <div 
                                            id="video-${index}" 
                                            style="display: ${index === 0 ? 'block' : 'none'};"
                                        >
                                            <h5 style="color: #FFD700; margin: 0 0 10px 0;">${video.title}</h5>
                                            <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                                                <iframe 
                                                    src="${embedUrl}" 
                                                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                                    allowfullscreen
                                                    title="${video.title}">
                                                </iframe>
                                            </div>
                                            <p style="color: #AAA; font-size: 12px; margin: 10px 0 0 0; font-style: italic;">
                                                📝 ${video.description}
                                            </p>
                                            <button 
                                                onclick="window.open('${video.url}', '_blank')" 
                                                style="
                                                    margin-top: 10px;
                                                    padding: 6px 12px;
                                                    font-size: 12px;
                                                    background: #8B0000;
                                                    color: white;
                                                    border: 1px solid #FF4444;
                                                    border-radius: 4px;
                                                    cursor: pointer;
                                                "
                                            >
                                                🎬 Ver en YouTube
                                            </button>
                                        </div>
                                    `;
                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Un solo video - formato simple
                const video = videos[0];
                const embedUrl = getYouTubeEmbedUrl(video.url);
                videoSection = `
                    <div style="margin: 20px 0; text-align: center;">
                        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: 2px solid #d4a017;">
                            <h4 style="color: #FFD700; margin: 0 0 15px 0; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                🎥 ${video.title}
                            </h4>
                            <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                                <iframe 
                                    src="${embedUrl}" 
                                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                    allowfullscreen
                                    title="${video.title}">
                                </iframe>
                            </div>
                            <p style="color: #AAA; font-size: 12px; margin: 10px 0 0 0; font-style: italic;">
                                📝 ${video.description}
                            </p>
                        </div>
                    </div>
                `;
            }
        }

        dialog.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">
                    ${typeIcons[npcData.dialog_type] || '💬'}
                </div>
                <h2 style="color: ${typeColors[npcData.dialog_type] || '#FFD700'}; margin: 0;">
                    ${npcData.name}
                </h2>
                <p style="color: #AAA; font-size: 14px; margin: 5px 0;">
                    ${npcData.dialog_type}
                </p>
            </div>
            
            <div style="line-height: 1.6; text-align: justify; margin: 20px 0; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; border-left: 4px solid ${typeColors[npcData.dialog_type] || '#FFD700'};">
                ${npcData.historical_cue}
            </div>
            
            ${videoSection}
            
            <div style="text-align: center; margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                ${videos.length > 0 ? `
                    <button onclick="window.openAllVideosInYouTube()" style="
                        padding: 10px 20px;
                        font-size: 14px;
                        background: #8B0000;
                        color: white;
                        border: 2px solid #FF4444;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        🎬 Ver Todos en YouTube
                    </button>
                ` : ''}
                
                <button onclick="window.closeNPCDialog()" style="
                    padding: 10px 30px;
                    font-size: 16px;
                    background: #d4a017;
                    color: white;
                    border: 2px solid #FFD700;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    Cerrar (E)
                </button>
            </div>
        `;

        dialog.style.display = 'block';

        // Guardar datos de videos para las funciones globales
        if (videos.length > 0) {
            dialog.setAttribute('data-videos', JSON.stringify(videos));
        }
    }

    hideNPCDialog() {
        const dialog = document.getElementById('npc-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }
}
