import { useState, useCallback, useRef } from 'react';
import { Video, GameSession, GameRound, Recording, GameState } from '@/types/game';

export const useGameSession = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    isCountingDown: false,
    countdownValue: 0,
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    canRecord: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
    const url = URL.createObjectURL(file);
    
    const video: Video = {
      id: Date.now().toString(),
      name: file.name,
      url,
      duration,
      file,
    };
    
    setVideos(prev => [...prev, video]);
    return video;
  }, [getVideoDuration]);

  // Supprimer une vidéo
  const deleteVideo = useCallback((id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
      URL.revokeObjectURL(video.url);
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  }, [videos]);

  // Créer une nouvelle session de jeu
  const createGameSession = useCallback((mode: 'meme' | 'serious') => {
    if (videos.length < 3) {
      throw new Error('Il faut au moins 3 vidéos pour créer une partie');
    }

    // Sélectionner 3 vidéos aléatoirement
    const shuffled = [...videos].sort(() => 0.5 - Math.random());
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
  }, [videos]);

  // Démarrer l'enregistrement audio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
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
  }, []);

  // Arrêter l'enregistrement
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob());
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setGameState(prev => ({ ...prev, isRecording: false }));
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      
      // Arrêter tous les tracks du stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    });
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
      const audioBlob = await stopRecording();
      const audioUrl = URL.createObjectURL(audioBlob);

      const recording: Recording = {
        id: Date.now().toString(),
        videoId: currentRound.video.id,
        audioBlob,
        audioUrl,
        recordedAt: new Date(),
      };

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
  }, [currentSession, stopRecording]);

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
    });
  }, [gameState.isRecording]);

  // Gérer la mise à jour du temps
  const handleTimeUpdate = useCallback((currentTime: number) => {
    setGameState(prev => ({ ...prev, currentTime }));
  }, []);

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
    
    // Utilitaires
    currentRound: currentSession?.rounds[currentSession.currentRoundIndex] || null,
    isLastRound: currentSession ? currentSession.currentRoundIndex === currentSession.rounds.length - 1 : false,
  };
};