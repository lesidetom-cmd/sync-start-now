export interface Video {
  id: string;
  name: string;
  url: string;
  duration: number;
  file: File;
  size: number; // Ajout de la propriété size pour stocker la taille du fichier
  thumbnail?: string;
  dataUrl?: string; // URL de données pour la persistance des vidéos
  hasValidFile?: boolean; // Indicateur si le fichier est valide et disponible
}

export interface Recording {
  id: string;
  videoId: string;
  audioBlob: Blob | string; // Peut être un Blob ou une Data URL pour la persistance
  audioUrl: string;
  videoBlob?: Blob | string; // Optionnel - pour l'enregistrement vidéo + audio
  videoUrl?: string; // URL de la vidéo enregistrée
  recordingType: 'audio-only' | 'video-audio'; // Type d'enregistrement
  recordedAt: Date;
}

export interface GameRound {
  id: string;
  video: Video;
  recording: Recording | null;
  completed: boolean;
}

export interface GameSession {
  id: string;
  mode: 'meme' | 'serious';
  rounds: GameRound[];
  currentRoundIndex: number;
  completed: boolean;
  createdAt: Date;
}

export interface GameState {
  isCountingDown: boolean;
  countdownValue: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  canRecord: boolean;
  recordingType: 'audio-only' | 'video-audio'; // Type d'enregistrement choisi
}
