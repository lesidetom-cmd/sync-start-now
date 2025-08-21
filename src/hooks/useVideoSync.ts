import { useState, useRef, useCallback } from 'react';

export interface VideoFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  file: File;
}

export interface AudioFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  file: File;
}

export interface SyncState {
  isPlaying: boolean;
  isCountingDown: boolean;
  countdownValue: number;
  currentTime: number;
  totalDuration: number;
  videoOffset: number;
  audioOffset: number;
}

export const useVideoSync = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  
  const [syncState, setSyncState] = useState<SyncState>({
    isPlaying: false,
    isCountingDown: false,
    countdownValue: 0,
    currentTime: 0,
    totalDuration: 0,
    videoOffset: 0,
    audioOffset: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout>();

  // Fonction pour obtenir la durée réelle d'un fichier vidéo
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

  // Fonction pour obtenir la durée réelle d'un fichier audio
  const getAudioDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        resolve(0);
      };
      
      audio.src = URL.createObjectURL(file);
    });
  }, []);

  const addVideo = useCallback(async (file: File) => {
    const duration = await getVideoDuration(file);
    const url = URL.createObjectURL(file);
    
    const videoFile: VideoFile = {
      id: Date.now().toString(),
      name: file.name,
      url,
      duration,
      file,
    };
    
    setVideos(prev => [...prev, videoFile]);
    
    // Auto-sélectionner si c'est la première vidéo
    if (videos.length === 0) {
      setSelectedVideo(videoFile);
    }
  }, [videos.length, getVideoDuration]);

  const addAudio = useCallback(async (file: File) => {
    const duration = await getAudioDuration(file);
    const url = URL.createObjectURL(file);
    
    const audioFile: AudioFile = {
      id: Date.now().toString(),
      name: file.name,
      url,
      duration,
      file,
    };
    
    setAudios(prev => [...prev, audioFile]);
    
    // Auto-sélectionner si c'est le premier audio
    if (audios.length === 0) {
      setSelectedAudio(audioFile);
    }
  }, [audios.length, getAudioDuration]);

  const startCountdownAndPlay = useCallback(() => {
    if (!selectedVideo || !selectedAudio) return;
    
    setSyncState(prev => ({ 
      ...prev, 
      isCountingDown: true, 
      countdownValue: 3 
    }));

    // Compte à rebours 3, 2, 1
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      setSyncState(prev => ({ 
        ...prev, 
        countdownValue: countdown 
      }));
      
      if (countdown === 0) {
        clearInterval(countdownInterval);
        
        // Démarrer la lecture synchronisée
        setSyncState(prev => ({
          ...prev,
          isCountingDown: false,
          isPlaying: true,
          totalDuration: Math.max(selectedVideo.duration, selectedAudio.duration)
        }));
        
        // Synchroniser et démarrer vidéo et audio
        if (videoRef.current && audioRef.current) {
          videoRef.current.currentTime = syncState.videoOffset;
          audioRef.current.currentTime = syncState.audioOffset;
          
          Promise.all([
            videoRef.current.play(),
            audioRef.current.play()
          ]).catch(console.error);
        }
      }
    }, 1000);
  }, [selectedVideo, selectedAudio, syncState.videoOffset, syncState.audioOffset]);

  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setSyncState(prev => ({
      ...prev,
      isPlaying: false,
      isCountingDown: false,
      currentTime: 0
    }));
    
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
    }
  }, []);

  const deleteVideo = useCallback((id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
      URL.revokeObjectURL(video.url);
      setVideos(prev => prev.filter(v => v.id !== id));
      if (selectedVideo?.id === id) {
        setSelectedVideo(null);
      }
    }
  }, [videos, selectedVideo]);

  const deleteAudio = useCallback((id: string) => {
    const audio = audios.find(a => a.id === id);
    if (audio) {
      URL.revokeObjectURL(audio.url);
      setAudios(prev => prev.filter(a => a.id !== id));
      if (selectedAudio?.id === id) {
        setSelectedAudio(null);
      }
    }
  }, [audios, selectedAudio]);

  return {
    videos,
    audios,
    selectedVideo,
    selectedAudio,
    syncState,
    videoRef,
    audioRef,
    setSelectedVideo,
    setSelectedAudio,
    addVideo,
    addAudio,
    startCountdownAndPlay,
    restart,
    deleteVideo,
    deleteAudio,
    setSyncState,
  };
};