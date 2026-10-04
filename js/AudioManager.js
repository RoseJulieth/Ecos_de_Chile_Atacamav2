import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.listener = new THREE.AudioListener();
        this.sounds = new Map();
        this.soundConfig = null;
        this.currentMusic = null;
        this.currentAmbient = null;

        // Capas de ambiente (viento, olas): suenan a la vez y cambian de volumen según la zona
        this.layerTargets = new Map(); // id -> volumen objetivo (0..1)
        this.layerGains = new Map();   // id -> volumen actual (0..1)

        // Configuración de volumen global
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.ambientVolume = 0.6;
        this.uiVolume = 0.5;

        // Estado de mute
        this.isMuted = false;

        console.log('🔊 AudioManager inicializado');
    }

    /**
     * Cargar configuración de sonidos desde JSON
     */
    async loadSoundConfig() {
        try {
            const response = await fetch('data/soundConfig.json');
            this.soundConfig = await response.json();
            console.log('✅ Configuración de sonidos cargada');
            return this.soundConfig;
        } catch (error) {
            console.error('❌ Error cargando configuración de sonidos:', error);
            return null;
        }
    }

    /**
     * Agregar listener a la cámara
     */
    attachToCamera(camera) {
        camera.add(this.listener);
        console.log('🎧 Audio listener agregado a la cámara');
    }

    /**
     * Precargar un sonido
     */
    async loadSound(soundId, soundData, type = 'sfx') {
        return new Promise((resolve, reject) => {
            const audioLoader = new THREE.AudioLoader();

            audioLoader.load(
                soundData.path,
                (buffer) => {
                    // Crear audio según el tipo
                    let audio;
                    if (type === 'music' || type === 'ambient') {
                        audio = new THREE.Audio(this.listener);
                    } else {
                        audio = new THREE.Audio(this.listener);
                    }

                    audio.setBuffer(buffer);
                    audio.setLoop(soundData.loop || false);
                    audio.setVolume(this.calculateVolume(soundData.volume, type));

                    // Guardar referencia
                    this.sounds.set(soundId, {
                        audio: audio,
                        type: type,
                        baseVolume: soundData.volume,
                        description: soundData.description
                    });

                    console.log(`✅ Sonido cargado: ${soundId} (${type})`);
                    resolve(audio);
                },
                (progress) => {
                    // Progreso de carga (opcional)
                },
                (error) => {
                    console.warn(`⚠️ No se pudo cargar: ${soundId}`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Precargar todos los sonidos de la configuración
     */
    async preloadAllSounds() {
        if (!this.soundConfig) {
            await this.loadSoundConfig();
        }

        if (!this.soundConfig) {
            console.warn('⚠️ No hay configuración de sonidos para cargar');
            return;
        }

        const loadPromises = [];

        // Cargar música
        for (const [id, data] of Object.entries(this.soundConfig.music || {})) {
            loadPromises.push(
                this.loadSound(id, data, 'music').catch(err => {
                    console.warn(`⚠️ Música no disponible: ${id}`);
                })
            );
        }

        // Cargar ambiente
        for (const [id, data] of Object.entries(this.soundConfig.ambient || {})) {
            loadPromises.push(
                this.loadSound(id, data, 'ambient').catch(err => {
                    console.warn(`⚠️ Ambiente no disponible: ${id}`);
                })
            );
        }

        // Cargar efectos de sonido
        for (const [id, data] of Object.entries(this.soundConfig.sfx || {})) {
            loadPromises.push(
                this.loadSound(id, data, 'sfx').catch(err => {
                    console.warn(`⚠️ SFX no disponible: ${id}`);
                })
            );
        }

        // Cargar sonidos de UI
        for (const [id, data] of Object.entries(this.soundConfig.ui || {})) {
            loadPromises.push(
                this.loadSound(id, data, 'ui').catch(err => {
                    console.warn(`⚠️ UI sound no disponible: ${id}`);
                })
            );
        }

        await Promise.allSettled(loadPromises);
        console.log(`✅ Sonidos precargados: ${this.sounds.size} sonidos disponibles`);
    }

    /**
     * Calcular volumen final según tipo y configuración global
     */
    calculateVolume(baseVolume, type) {
        if (this.isMuted) return 0;

        let typeVolume = 1.0;
        switch (type) {
            case 'music':
                typeVolume = this.musicVolume;
                break;
            case 'sfx':
                typeVolume = this.sfxVolume;
                break;
            case 'ambient':
                typeVolume = this.ambientVolume;
                break;
            case 'ui':
                typeVolume = this.uiVolume;
                break;
        }

        return baseVolume * typeVolume * this.masterVolume;
    }

    /**
     * Reproducir un sonido
     */
    play(soundId) {
        const soundData = this.sounds.get(soundId);
        if (!soundData) {
            console.warn(`⚠️ Sonido no encontrado: ${soundId}`);
            return false;
        }

        const { audio, type } = soundData;

        // Si es música, detener música anterior
        if (type === 'music') {
            this.stopMusic();
            this.currentMusic = soundId;
        }

        // Si es ambiente, detener ambiente anterior
        if (type === 'ambient') {
            this.stopAmbient();
            this.currentAmbient = soundId;
        }

        // Reproducir
        if (!audio.isPlaying) {
            audio.play();
            console.log(`🔊 Reproduciendo: ${soundId}`);
        }

        return true;
    }

    /**
     * Detener un sonido
     */
    stop(soundId) {
        const soundData = this.sounds.get(soundId);
        if (!soundData) return false;

        const { audio } = soundData;
        if (audio.isPlaying) {
            audio.stop();
        }

        return true;
    }

    /**
     * Pausar un sonido
     */
    pause(soundId) {
        const soundData = this.sounds.get(soundId);
        if (!soundData) return false;

        const { audio } = soundData;
        if (audio.isPlaying) {
            audio.pause();
        }

        return true;
    }

    /**
     * Detener música actual
     */
    stopMusic() {
        if (this.currentMusic) {
            this.stop(this.currentMusic);
            this.currentMusic = null;
        }
    }

    /**
     * Detener ambiente actual
     */
    stopAmbient() {
        this.stopLayers();
        if (this.currentAmbient) {
            this.stop(this.currentAmbient);
            this.currentAmbient = null;
        }
    }

    /**
     * Cambiar música con fade
     */
    async changeMusicWithFade(newMusicId, fadeTime = 1.0) {
        // Fade out música actual
        if (this.currentMusic) {
            const currentData = this.sounds.get(this.currentMusic);
            if (currentData) {
                await this.fadeOut(this.currentMusic, fadeTime);
            }
        }

        // Fade in nueva música
        this.play(newMusicId);
        await this.fadeIn(newMusicId, fadeTime);
    }

    /**
     * Fade out de un sonido
     */
    async fadeOut(soundId, duration = 1.0) {
        const soundData = this.sounds.get(soundId);
        if (!soundData) return;

        const { audio, baseVolume, type } = soundData;
        const targetVolume = this.calculateVolume(baseVolume, type);
        const steps = 20;
        const stepTime = (duration * 1000) / steps;
        const volumeStep = targetVolume / steps;

        for (let i = steps; i >= 0; i--) {
            audio.setVolume(volumeStep * i);
            await new Promise(resolve => setTimeout(resolve, stepTime));
        }

        audio.stop();
    }

    /**
     * Fade in de un sonido
     */
    async fadeIn(soundId, duration = 1.0) {
        const soundData = this.sounds.get(soundId);
        if (!soundData) return;

        const { audio, baseVolume, type } = soundData;
        const targetVolume = this.calculateVolume(baseVolume, type);
        const steps = 20;
        const stepTime = (duration * 1000) / steps;
        const volumeStep = targetVolume / steps;

        audio.setVolume(0);

        for (let i = 0; i <= steps; i++) {
            audio.setVolume(volumeStep * i);
            await new Promise(resolve => setTimeout(resolve, stepTime));
        }
    }

    /**
     * Ajustar volumen master
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * Ajustar volumen de música
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * Ajustar volumen de efectos
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * Ajustar volumen de ambiente
     */
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * Actualizar volúmenes de todos los sonidos activos
     */
    updateAllVolumes() {
        for (const [soundId, soundData] of this.sounds) {
            const { audio, baseVolume, type } = soundData;
            const layerGain = this.layerGains.has(soundId) ? this.layerGains.get(soundId) : 1;
            audio.setVolume(this.calculateVolume(baseVolume, type) * layerGain);
        }
    }

    /**
     * Definir a qué volumen (0..1) debe llegar una capa de ambiente; el cambio es gradual.
     * La capa empieza a sonar sola cuando su objetivo es mayor que 0.
     */
    setLayerTarget(soundId, target) {
        this.layerTargets.set(soundId, Math.max(0, Math.min(1, target)));
    }

    /**
     * Acercar cada capa a su objetivo. Llamar una vez por frame.
     * @param {number} delta segundos desde el frame anterior
     * @param {number} fadeTime segundos que tarda una capa en ir de 0 a 1
     */
    updateLayers(delta, fadeTime = 1.5) {
        for (const [soundId, target] of this.layerTargets) {
            const soundData = this.sounds.get(soundId);
            if (!soundData) continue;

            const { audio, baseVolume, type } = soundData;
            let gain = this.layerGains.has(soundId) ? this.layerGains.get(soundId) : 0;
            const step = delta / fadeTime;

            if (gain < target) gain = Math.min(target, gain + step);
            else if (gain > target) gain = Math.max(target, gain - step);
            else if (audio.isPlaying === (gain > 0)) continue; // sin cambios

            this.layerGains.set(soundId, gain);
            audio.setVolume(this.calculateVolume(baseVolume, type) * gain);

            if (gain > 0 && !audio.isPlaying) {
                audio.play();
            } else if (gain === 0 && audio.isPlaying) {
                audio.stop(); // silencio total: no gastar audio
            }
        }
    }

    /**
     * Detener todas las capas de ambiente
     */
    stopLayers() {
        for (const soundId of this.layerTargets.keys()) {
            this.layerGains.set(soundId, 0);
            this.layerTargets.set(soundId, 0);
            const soundData = this.sounds.get(soundId);
            if (soundData && soundData.audio.isPlaying) soundData.audio.stop();
        }
    }

    /**
     * Mutear/desmutear todo el audio
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateAllVolumes();
        console.log(`🔇 Audio ${this.isMuted ? 'muteado' : 'activado'}`);
        return this.isMuted;
    }

    /**
     * Obtener lista de sonidos cargados
     */
    getLoadedSounds() {
        const soundList = [];
        for (const [id, data] of this.sounds) {
            soundList.push({
                id: id,
                type: data.type,
                description: data.description,
                isPlaying: data.audio.isPlaying
            });
        }
        return soundList;
    }

    /**
     * Limpiar recursos de audio
     */
    dispose() {
        for (const [soundId, soundData] of this.sounds) {
            soundData.audio.stop();
            soundData.audio.disconnect();
        }
        this.sounds.clear();
        console.log('🔇 AudioManager limpiado');
    }
}
