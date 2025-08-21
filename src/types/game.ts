export interface Video {
  id: string;
  name: string;
  url: string;
  duration: number;
  file: File;
  thumbnail?: string;
}

export interface Recording {
  id: string;
  videoId: string;
  audioBlob: Blob;
  audioUrl: string;
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
}