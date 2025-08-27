import { useRef, useEffect } from 'react';

/**
 * Utilitaire pour exporter une vidéo avec audio de doublage intégré en MP4
 */

export interface ExportProgress {
  phase: 'preparing' | 'processing' | 'finalizing' | 'complete';
  progress: number; // 0-100
  message: string;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Exporte une vidéo avec son audio de doublage intégré
   */
  async exportVideoWithDubbing(
    originalVideoUrl: string,
    dubbingAudioUrl: string,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    try {
      onProgress?.({
        phase: 'preparing',
        progress: 0,
        message: 'Préparation de l\'export...'
      });

      // Créer les éléments vidéo et audio
      const video = document.createElement('video');
      const audio = document.createElement('audio');
      
      // Charger la vidéo
      await this.loadMedia(video, originalVideoUrl);
      await this.loadMedia(audio, dubbingAudioUrl);

      // Configurer le canvas aux dimensions de la vidéo
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;

      onProgress?.({
        phase: 'preparing',
        progress: 25,
        message: 'Médias chargés, préparation de l\'enregistrement...'
      });

      // Créer les streams
      const canvasStream = this.canvas.captureStream(30); // 30 FPS
      const audioContext = new AudioContext();
      
      // Créer les sources audio
      const videoAudioSource = audioContext.createMediaElementSource(video);
      const dubbingAudioSource = audioContext.createMediaElementSource(audio);
      
      // Créer un gain node pour mixer les audios
      const videoGain = audioContext.createGain();
      const dubbingGain = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      // Configuration du mix audio
      // Baisser le volume de la vidéo originale et privilégier le doublage
      videoGain.gain.value = 0.1; // Volume très bas pour l'audio original
      dubbingGain.gain.value = 1.0; // Volume normal pour le doublage

      // Connecter les sources
      videoAudioSource.connect(videoGain);
      dubbingAudioSource.connect(dubbingGain);
      videoGain.connect(destination);
      dubbingGain.connect(destination);

      // Combiner le stream vidéo du canvas avec le stream audio mixé
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      onProgress?.({
        phase: 'preparing',
        progress: 50,
        message: 'Début de l\'enregistrement...'
      });

      // Configurer le MediaRecorder
      this.recordedChunks = [];
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps pour une bonne qualité
        audioBitsPerSecond: 128000   // 128 kbps pour l'audio
      };

      this.mediaRecorder = new MediaRecorder(combinedStream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Commencer l'enregistrement
      this.mediaRecorder.start();

      // Synchroniser et lire les médias
      video.currentTime = 0;
      audio.currentTime = 0;
      video.muted = true; // Mute la vidéo car on utilise le mix audio

      await Promise.all([
        video.play(),
        audio.play()
      ]);

      onProgress?.({
        phase: 'processing',
        progress: 60,
        message: 'Enregistrement en cours...'
      });

      // Dessiner les frames de la vidéo sur le canvas
      return new Promise((resolve, reject) => {
        const drawFrame = () => {
          if (video.ended || audio.ended) {
            // Arrêter l'enregistrement
            this.mediaRecorder?.stop();
            return;
          }

          // Dessiner la frame actuelle sur le canvas
          this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
          
          // Mettre à jour le progrès
          const progress = 60 + (video.currentTime / video.duration) * 30;
          onProgress?.({
            phase: 'processing',
            progress,
            message: `Traitement: ${Math.floor(video.currentTime)}s / ${Math.floor(video.duration)}s`
          });

          requestAnimationFrame(drawFrame);
        };

        this.mediaRecorder!.onstop = () => {
          onProgress?.({
            phase: 'finalizing',
            progress: 95,
            message: 'Finalisation du fichier...'
          });

          // Créer le blob final
          const finalBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
          
          onProgress?.({
            phase: 'complete',
            progress: 100,
            message: 'Export terminé!'
          });

          resolve(finalBlob);
        };

        this.mediaRecorder!.onerror = (error) => {
          reject(error);
        };

        drawFrame();
      });

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw new Error(`Erreur lors de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Charge un élément média (vidéo ou audio)
   */
  private loadMedia(element: HTMLVideoElement | HTMLAudioElement, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      element.onloadeddata = () => resolve();
      element.onerror = () => reject(new Error(`Impossible de charger le média: ${url}`));
      element.src = url;
      element.preload = 'metadata';
      element.load();
    });
  }

  /**
   * Télécharge le blob en tant que fichier MP4
   */
  downloadAsMP4(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.webm`; // WebM car c'est le format natif du navigateur
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.recordedChunks = [];
  }
}

/**
 * Hook React pour l'export de vidéos
 */
export const useVideoExporter = () => {
  const exporterRef = useRef<VideoExporter | null>(null);

  const getExporter = () => {
    if (!exporterRef.current) {
      exporterRef.current = new VideoExporter();
    }
    return exporterRef.current;
  };

  const exportVideo = async (
    originalVideoUrl: string,
    dubbingAudioUrl: string,
    onProgress?: (progress: ExportProgress) => void
  ) => {
    const exporter = getExporter();
    return await exporter.exportVideoWithDubbing(originalVideoUrl, dubbingAudioUrl, onProgress);
  };

  const downloadVideo = (blob: Blob, filename: string) => {
    const exporter = getExporter();
    exporter.downloadAsMP4(blob, filename);
  };

  useEffect(() => {
    return () => {
      exporterRef.current?.cleanup();
    };
  }, []);

  return {
    exportVideo,
    downloadVideo
  };
};