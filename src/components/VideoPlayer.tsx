import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import { VideoFile, AudioFile, SyncState } from '@/hooks/useVideoSync';

interface VideoPlayerProps {
  selectedVideo: VideoFile | null;
  selectedAudio: AudioFile | null;
  syncState: SyncState;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  onRestart: () => void;
  onTimeUpdate: (currentTime: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  selectedVideo,
  selectedAudio,
  syncState,
  videoRef,
  audioRef,
  onRestart,
  onTimeUpdate,
}) => {
  // Mettre à jour le temps actuel
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="space-y-4">
        {/* Titre et contrôles */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Lecteur de Synchronisation
          </h2>
          
          <Button
            onClick={onRestart}
            variant="outline"
            size="sm"
            className="bg-secondary/50 hover:bg-secondary border-accent/30 hover:border-accent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>

        {/* Zone de lecture vidéo */}
        <div className="relative bg-black rounded-lg overflow-hidden min-h-[1000px] flex items-center justify-center">
          {selectedVideo ? (
            <video
              ref={videoRef}
              src={selectedVideo.url}
              className="w-full h-full object-contain"
              controls={false}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">📹</div>
              <p className="text-lg">Sélectionnez une vidéo pour commencer</p>
            </div>
          )}
          
          {/* Overlay compte à rebours */}
          {syncState.isCountingDown && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-8xl font-bold text-primary animate-countdown">
                {syncState.countdownValue}
              </div>
            </div>
          )}
          
          {/* Overlay status */}
          {syncState.isPlaying && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-status-playing rounded-full animate-pulse"></div>
              <span className="text-white font-medium bg-black/50 px-2 py-1 rounded">
                EN LECTURE
              </span>
            </div>
          )}
        </div>

        {/* Audio (caché) */}
        {selectedAudio && (
          <audio
            ref={audioRef}
            src={selectedAudio.url}
            className="hidden"
          />
        )}

        {/* Informations de lecture */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-muted-foreground">Vidéo sélectionnée:</div>
            <div className="font-medium text-foreground">
              {selectedVideo ? selectedVideo.name : 'Aucune vidéo'}
            </div>
            {selectedVideo && (
              <div className="text-accent">
                Durée: {formatTime(selectedVideo.duration)}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-muted-foreground">Audio sélectionné:</div>
            <div className="font-medium text-foreground">
              {selectedAudio ? selectedAudio.name : 'Aucun audio'}
            </div>
            {selectedAudio && (
              <div className="text-accent">
                Durée: {formatTime(selectedAudio.duration)}
              </div>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        {syncState.totalDuration > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(syncState.currentTime)}</span>
              <span>{formatTime(syncState.totalDuration)}</span>
            </div>
            <div className="w-full bg-timeline-track rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-200"
                style={{ 
                  width: `${(syncState.currentTime / syncState.totalDuration) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
