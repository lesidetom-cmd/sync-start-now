import { useState, useCallback, useRef, useEffect } from 'react';
import { Video, GameSession, GameRound, Recording, GameState } from '@/types/game';

const LOCAL_STORAGE_VIDEOS_KEY = 'dubsync_videos';
const LOCAL_STORAGE_SESSION_KEY = 'dubsync_game_session';

export const useGameSession = () => {
  // Initialiser les vidéos depuis le localStorage ou un tableau vide
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const storedVideos = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (storedVideos) {
        const parsedVideos = JSON.parse(storedVideos);
        console.log('Found stored video metadata:', parsedVideos.length, 'videos');
        
        // Pour l'instant, on initialise avec des placeholders
        // Les vrais fichiers devront être ré-importés par l'utilisateur
        return parsedVideos
          .filter((video: any) => video.hasValidFile) // Ne garder que ceux qui avaient des fichiers valides
          .map((video: any) => ({
            ...video,
            file: new File([], video.name, { type: 'video/mp4' }), // Placeholder
            url: '', // Pas d'URL valide au chargement
            dataUrl: undefined, // Pas de dataUrl au chargement
            hasValidFile: false, // Marquer comme nécessitant une ré-importation
          }));
      }
    } catch (error) {
      console.error("Failed to parse videos from localStorage", error);
    }
    return [];
  });

  // Ne pas initialiser automatiquement la session depuis le localStorage
  // L'utilisateur devra explicitement créer une nouvelle session
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    isCountingDown: false,
    countdownValue: 0,
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    canRecord: false,
    recordingType: 'audio-only', // Par défaut audio seul
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Effet pour sauvegarder les vidéos dans le localStorage chaque fois qu'elles changent
  useEffect(() => {
    const saveVideos = async () => {
      try {
        // Pour les vidéos très lourdes, on garde seulement les métadonnées essentielles en localStorage
        // Les URL d'objet seront recréées à chaque session
        const videosToStore = videos.map((video) => {
          const { file, url, dataUrl, ...videoMetadata } = video;
          
          // Ne sauvegarder que les métadonnées pour éviter de saturer localStorage
          return {
            ...videoMetadata,
            // Garder un indicateur qu'on a une vidéo valide
            hasValidFile: file && file.size > 0,
          };
        });
        
        const videosJson = JSON.stringify(videosToStore);
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, videosJson);
        console.log(`Saved ${videos.length} video metadata to localStorage`);
        
      } catch (error) {
        console.error("Failed to save videos to localStorage", error);
      }
    };

    saveVideos();
  }, [videos]);

  // Effet pour sauvegarder la session de jeu dans le localStorage chaque fois qu'elle change
  useEffect(() => {
    const saveSession = async () => {
      if (currentSession) {
        try {
          const sessionToStore = {
            ...currentSession,
            rounds: await Promise.all(currentSession.rounds.map(async round => {
              if (round.recording) {
                const updatedRecording = { ...round.recording };
                
                // Pour les enregistrements audio seulement
                if (round.recording.recordingType === 'audio-only' && round.recording.audioBlob instanceof Blob) {
                  // Convertir le Blob audio en Data URL pour stockage
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(round.recording.audioBlob as Blob);
                  });
                  updatedRecording.audioBlob = dataUrl; // Stocker comme Data URL string
                }
                
                // Pour les enregistrements vidéo + audio, on ne sauvegarde PAS dans localStorage car trop volumineux
                // On va juste stocker les métadonnées et l'utilisateur devra re-enregistrer
                if (round.recording.recordingType === 'video-audio') {
                  updatedRecording.videoBlob = 'too-large-for-storage'; // Marqueur
                  updatedRecording.videoUrl = ''; // Pas d'URL valide après rechargement
                }
                
                return {
                  ...round,
                  recording: updatedRecording,
                };
              }
              return round; // Pas d'enregistrement
            })),
          };
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionToStore));
        } catch (error) {
          console.error("Failed to save game session to localStorage", error);
          // Si erreur de quota, on nettoie le localStorage pour les sessions anciennes
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.log('Quota exceeded, clearing session to make space');
            localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          }
        }
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    };

    saveSession();
  }, [currentSession]);

  // Fonction pour obtenir la durée d'une vidéo
  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      
      video.onerror = () => {
        resolve(0);
      };
      
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Ajouter une vidéo à la bibliothèque
  const addVideo = useCallback(async (file: File) => {
    const duration = await getVideoDuration(file);
    
    // Convertir le fichier en Data URL pour la persistance
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Pour les gros fichiers vidéo, ne pas les stocker dans localStorage
    // Créer une URL d'objet temporaire pour la session en cours
    const sessionUrl = URL.createObjectURL(file);
    
      const video: Video = {
        id: Date.now().toString(),
        name: file.name,
        url: sessionUrl, // URL d'objet pour la session en cours
        duration,
        file, // L'objet File est stocké en mémoire pour la session actuelle
        size: file.size, // Stocker la taille du fichier
        dataUrl, // Stocker la Data URL pour la persistance
        hasValidFile: true, // Marquer comme ayant un fichier valide
      };
    
    setVideos(prev => [...prev, video]);
    return video;
  }, [getVideoDuration]);

  // Supprimer une vidéo
  const deleteVideo = useCallback((id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
      // Révoquer l'URL d'objet pour libérer la mémoire
      if (video.url.startsWith('blob:')) {
        URL.revokeObjectURL(video.url);
      }
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  }, [videos]);

  // Nettoyer complètement les sessions précédentes
  const clearPreviousSession = useCallback(() => {
    // Effacer complètement le localStorage de la session
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setCurrentSession(null);
  }, []);

  // Créer une nouvelle session de jeu
  const createGameSession = useCallback((mode: 'meme' | 'serious') => {
    // Vérifier qu'il y a au moins 3 vidéos avec des fichiers valides
    const validVideos = videos.filter(video => video.hasValidFile && video.url);
    
    if (validVideos.length < 3) {
      throw new Error('Il faut au moins 3 vidéos valides pour créer une partie');
    }

    // Nettoyer l'ancienne session si elle existe
    if (currentSession) {
      // Révoquer les URLs des anciens enregistrements pour libérer la mémoire
      currentSession.rounds.forEach(round => {
        if (round.recording) {
          if (round.recording.audioUrl) {
            URL.revokeObjectURL(round.recording.audioUrl);
          }
          if (round.recording.videoUrl) {
            URL.revokeObjectURL(round.recording.videoUrl);
          }
        }
      });
    }

    // COMPLÈTEMENT effacer le localStorage de la session
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);

    // Sélectionner 3 vidéos aléatoirement parmi les valides
    const shuffled = [...validVideos].sort(() => 0.5 - Math.random());
    const selectedVideos = shuffled.slice(0, 3);

    const rounds: GameRound[] = selectedVideos.map((video, index) => ({
      id: `round-${Date.now()}-${index}`,
      video,
      recording: null,
      completed: false,
    }));

    const session: GameSession = {
      id: Date.now().toString(),
      mode,
      rounds,
      currentRoundIndex: 0,
      completed: false,
      createdAt: new Date(),
    };

    setCurrentSession(session);
    return session;
  }, [videos, currentSession]);

  // Démarrer l'enregistrement audio ou vidéo+audio
  const startRecording = useCallback(async () => {
    try {
      // Contraintes selon le type d'enregistrement
      const constraints = gameState.recordingType === 'video-audio' 
        ? {
            // Contraintes vidéo + audio haute qualité
            video: {
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, min: 24 },
              facingMode: 'user' // Caméra frontale
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true, 
              autoGainControl: false, // Désactiver pour garder le niveau naturel du bon micro
              sampleRate: { ideal: 48000, min: 44100 }, // 48kHz standard professionnel
              channelCount: { ideal: 2, min: 1 },
              sampleSize: { ideal: 24, min: 16 }, // 24-bit pour plus de dynamique
              latency: { ideal: 0.01 }, // Faible latence
              volume: { ideal: 1.0 } // Volume maximal
            }
          }
        : {
            // Contraintes audio seul haute qualité
            audio: {
              echoCancellation: true,
              noiseSuppression: true, 
              autoGainControl: false, // Désactiver pour garder le niveau naturel du bon micro
              sampleRate: { ideal: 48000, min: 44100 }, // 48kHz standard professionnel
              channelCount: { ideal: 2, min: 1 },
              sampleSize: { ideal: 24, min: 16 }, // 24-bit pour plus de dynamique
              latency: { ideal: 0.01 }, // Faible latence
              volume: { ideal: 1.0 } // Volume maximal
            }
          };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Options MediaRecorder haute qualité selon le type
      const highQualityOptions = gameState.recordingType === 'video-audio'
        ? [
            // Formats vidéo + audio haute qualité
            { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 5000000, audioBitsPerSecond: 320000 }, // VP9 + Opus
            { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 3000000, audioBitsPerSecond: 256000 }, // VP8 + Opus
            { mimeType: 'video/mp4;codecs=h264,aac', videoBitsPerSecond: 4000000, audioBitsPerSecond: 256000 }, // H264 + AAC
            { mimeType: 'video/webm', videoBitsPerSecond: 2500000, audioBitsPerSecond: 192000 }, // Fallback WebM
          ]
        : [
            // Formats audio seul haute qualité
            { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 320000 }, // 320 kbps qualité maximale
            { mimeType: 'audio/mp4;codecs=mp4a.40.2', audioBitsPerSecond: 256000 }, // AAC 256 kbps
            { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }, // Opus 256 kbps
            { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 192000 }, // Ogg Opus 192 kbps
            { mimeType: 'audio/webm', audioBitsPerSecond: 192000 }, // Fallback WebM
          ];
      
      // Trouver le meilleur format supporté
      let mediaRecorder;
      let selectedFormat = null;
      
      for (const options of highQualityOptions) {
        if (MediaRecorder.isTypeSupported(options.mimeType)) {
          mediaRecorder = new MediaRecorder(stream, options);
          selectedFormat = options;
          break;
        }
      }
      
      // Fallback ultime si aucun format spécifique n'est supporté
      if (!mediaRecorder) {
        const fallbackOptions = gameState.recordingType === 'video-audio'
          ? { videoBitsPerSecond: 2000000, audioBitsPerSecond: 256000 }
          : { audioBitsPerSecond: 256000 };
        mediaRecorder = new MediaRecorder(stream, fallbackOptions);
        selectedFormat = { mimeType: 'default', ...fallbackOptions };
      }
      
      console.log('Format enregistrement sélectionné:', selectedFormat);
      console.log('Type d\'enregistrement:', gameState.recordingType);
      
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      
      setGameState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      throw error;
    }
  }, [gameState.recordingType]);

  // Arrêter l'enregistrement
  const stopRecording = useCallback((): Promise<{ audioBlob: Blob; videoBlob?: Blob }> => {
    return new Promise(async (resolve) => {
      if (!mediaRecorderRef.current) {
        resolve({ audioBlob: new Blob() });
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        if (gameState.recordingType === 'video-audio') {
          // Pour vidéo + audio, le blob contient les deux
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          
          // Extraire l'audio du blob vidéo pour le rendu final
          const audioBlob = await extractAudioFromVideo(videoBlob);
          
          setGameState(prev => ({ ...prev, isRecording: false }));
          resolve({ audioBlob, videoBlob });
        } else {
          // Pour audio seul
          const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          setGameState(prev => ({ ...prev, isRecording: false }));
          resolve({ audioBlob });
        }
      };

      mediaRecorderRef.current.stop();
      
      // Arrêter tous les tracks du stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    });
  }, [gameState.recordingType]);

  // Fonction utilitaire pour extraire l'audio d'une vidéo
  const extractAudioFromVideo = useCallback(async (videoBlob: Blob): Promise<Blob> => {
    try {
      const videoElement = document.createElement('video');
      const audioContext = new AudioContext();
      
      return new Promise((resolve, reject) => {
        videoElement.onloadeddata = async () => {
          try {
            const source = audioContext.createMediaElementSource(videoElement);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            
            const mediaRecorder = new MediaRecorder(destination.stream, {
              mimeType: 'audio/webm;codecs=opus',
              audioBitsPerSecond: 320000
            });
            
            const audioChunks: Blob[] = [];
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunks.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              resolve(audioBlob);
            };
            
            mediaRecorder.start();
            videoElement.currentTime = 0;
            await videoElement.play();
            
            videoElement.onended = () => {
              mediaRecorder.stop();
            };
            
          } catch (error) {
            console.warn('Impossible d\'extraire l\'audio, utilisation du blob original:', error);
            resolve(videoBlob); // Fallback: utiliser le blob vidéo comme audio
          }
        };
        
        videoElement.onerror = () => {
          console.warn('Erreur de chargement vidéo, utilisation du blob original');
          resolve(videoBlob); // Fallback
        };
        
        videoElement.src = URL.createObjectURL(videoBlob);
      });
    } catch (error) {
      console.warn('Extraction audio échouée, utilisation du blob original:', error);
      return videoBlob; // Fallback
    }
  }, []);

  // Démarrer le compte à rebours et la lecture
  const startCountdownAndPlay = useCallback(async () => {
    if (!currentSession) return;

    const currentRound = currentSession.rounds[currentSession.currentRoundIndex];
    if (!currentRound) return;

    setGameState(prev => ({ 
      ...prev, 
      isCountingDown: true, 
      countdownValue: 3,
      canRecord: false
    }));

    // Compte à rebours
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      countdown--;
      setGameState(prev => ({ ...prev, countdownValue: countdown }));
      
      if (countdown === 0) {
        clearInterval(countdownInterval);
        
        // Démarrer la vidéo et l'enregistrement
        setGameState(prev => ({
          ...prev,
          isCountingDown: false,
          isPlaying: true,
          canRecord: true
        }));
        
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        }
        
        // Démarrer l'enregistrement automatiquement
        startRecording().catch(console.error);
      }
    }, 1000);
  }, [currentSession, startRecording]);

  // Terminer le tour actuel
  const finishCurrentRound = useCallback(async () => {
    if (!currentSession) return;

    const currentRound = currentSession.rounds[currentSession.currentRoundIndex];
    if (!currentRound) return;

    try {
      // Arrêter l'enregistrement
      const recordingResult = await stopRecording();
      
      let recording: Recording;
      
      if (gameState.recordingType === 'video-audio' && recordingResult.videoBlob) {
        // Enregistrement vidéo + audio
        const videoUrl = URL.createObjectURL(recordingResult.videoBlob);
        const audioUrl = recordingResult.audioBlob ? URL.createObjectURL(recordingResult.audioBlob) : '';
        
        recording = {
          id: Date.now().toString(),
          videoId: currentRound.video.id,
          audioBlob: recordingResult.audioBlob || new Blob(),
          audioUrl,
          videoBlob: recordingResult.videoBlob,
          videoUrl,
          recordingType: 'video-audio',
          recordedAt: new Date(),
        };
      } else {
        // Enregistrement audio seul
        const audioUrl = URL.createObjectURL(recordingResult.audioBlob);
        
        recording = {
          id: Date.now().toString(),
          videoId: currentRound.video.id,
          audioBlob: recordingResult.audioBlob,
          audioUrl,
          recordingType: 'audio-only',
          recordedAt: new Date(),
        };
      }

      // Mettre à jour la session
      const updatedSession = {
        ...currentSession,
        rounds: currentSession.rounds.map((round, index) => 
          index === currentSession.currentRoundIndex 
            ? { ...round, recording, completed: true }
            : round
        ),
      };

      setCurrentSession(updatedSession);
      
      // Arrêter la vidéo
      if (videoRef.current) {
        videoRef.current.pause();
      }

      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        isRecording: false,
        canRecord: false
      }));

      return recording;
    } catch (error) {
      console.error('Erreur lors de la finalisation du tour:', error);
      throw error;
    }
  }, [currentSession, stopRecording, gameState.recordingType]);

  // Passer au tour suivant
  const nextRound = useCallback(() => {
    if (!currentSession) return;

    const nextIndex = currentSession.currentRoundIndex + 1;
    
    if (nextIndex < currentSession.rounds.length) {
      setCurrentSession(prev => prev ? {
        ...prev,
        currentRoundIndex: nextIndex
      } : null);
    } else {
      // Partie terminée
      setCurrentSession(prev => prev ? {
        ...prev,
        completed: true
      } : null);
    }
  }, [currentSession]);

  // Redémarrer le tour actuel
  const restartRound = useCallback(() => {
    // Arrêter l'enregistrement s'il est en cours
    if (mediaRecorderRef.current && gameState.isRecording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    // Arrêter la vidéo
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Réinitialiser l'état
    setGameState({
      isCountingDown: false,
      countdownValue: 0,
      isPlaying: false,
      isRecording: false,
      currentTime: 0,
      canRecord: false,
      recordingType: gameState.recordingType, // Préserver le type d'enregistrement
    });
  }, [gameState.isRecording]);

  // Gérer la mise à jour du temps
  const handleTimeUpdate = useCallback((currentTime: number) => {
    setGameState(prev => ({ ...prev, currentTime }));
  }, []);

  // Changer le type d'enregistrement
  const setRecordingType = useCallback((type: 'audio-only' | 'video-audio') => {
    setGameState(prev => ({ ...prev, recordingType: type }));
  }, []);

  // Reset complet de toutes les données
  const resetAllData = useCallback(() => {
    // Arrêter l'enregistrement s'il est en cours
    if (mediaRecorderRef.current && gameState.isRecording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    // Arrêter la vidéo
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Révoquer toutes les URLs d'objets pour libérer la mémoire
    videos.forEach(video => {
      if (video.url && video.url.startsWith('blob:')) {
        URL.revokeObjectURL(video.url);
      }
    });

    // Révoquer les URLs des enregistrements de la session actuelle
    if (currentSession) {
      currentSession.rounds.forEach(round => {
        if (round.recording) {
          if (round.recording.audioUrl && round.recording.audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(round.recording.audioUrl);
          }
          if (round.recording.videoUrl && round.recording.videoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(round.recording.videoUrl);
          }
        }
      });
    }

    // Nettoyer le localStorage
    localStorage.removeItem(LOCAL_STORAGE_VIDEOS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);

    // Réinitialiser tous les états
    setVideos([]);
    setCurrentSession(null);
    setGameState({
      isCountingDown: false,
      countdownValue: 0,
      isPlaying: false,
      isRecording: false,
      currentTime: 0,
      canRecord: false,
      recordingType: 'audio-only',
    });

    console.log('🧹 Reset complet effectué - Toutes les données ont été effacées');
  }, [videos, currentSession, gameState.isRecording]);

    return {
    // État
    videos,
    currentSession,
    gameState,
    videoRef,
    
    // Actions
    addVideo,
    deleteVideo,
    createGameSession,
    startCountdownAndPlay,
    finishCurrentRound,
    nextRound,
    restartRound,
    handleTimeUpdate,
    setRecordingType,
    resetAllData,
    
    // Utilitaires
    currentRound: currentSession?.rounds[currentSession.currentRoundIndex] || null,
    isLastRound: currentSession ? currentSession.currentRoundIndex === currentSession.rounds.length - 1 : false,
    playableVideoUrl: currentSession?.rounds[currentSession.currentRoundIndex]?.video?.url || '',
  };
};
