import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.listener = new THREE.AudioListener();
        this.sounds = new Map();
        this.soundConfig = null;
        this.currentMusic = null;
        this.currentAmbient = null;

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
            audio.setVolume(this.calculateVolume(baseVolume, type));
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
