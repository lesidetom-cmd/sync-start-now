import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Trash2, Video, Music } from 'lucide-react';
import { VideoFile, AudioFile } from '@/hooks/useVideoSync';

interface VideoLibraryProps {
  videos: VideoFile[];
  audios: AudioFile[];
  selectedVideo: VideoFile | null;
  selectedAudio: AudioFile | null;
  onVideoSelect: (video: VideoFile) => void;
  onAudioSelect: (audio: AudioFile) => void;
  onVideoAdd: (file: File) => void;
  onAudioAdd: (file: File) => void;
  onVideoDelete: (id: string) => void;
  onAudioDelete: (id: string) => void;
  onStartSync: () => void;
  isReadyToSync: boolean;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  audios,
  selectedVideo,
  selectedAudio,
  onVideoSelect,
  onAudioSelect,
  onVideoAdd,
  onAudioAdd,
  onVideoDelete,
  onAudioDelete,
  onStartSync,
  isReadyToSync,
}) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('video/')) {
          onVideoAdd(file);
        }
      });
    }
    event.target.value = '';
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
          onAudioAdd(file);
        }
      });
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Section Vidéos */}
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">
                Bibliothèque Vidéos
              </h3>
              <Badge variant="secondary" className="ml-2">
                {videos.length}
              </Badge>
            </div>
            
            <Button
              onClick={() => videoInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter Vidéo
            </Button>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />

          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {videos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune vidéo importée</p>
                <p className="text-sm">Cliquez sur "Ajouter Vidéo" pour commencer</p>
              </div>
            ) : (
              videos.map(video => (
                <div
                  key={video.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                    selectedVideo?.id === video.id 
                      ? 'border-primary bg-primary/10 shadow-glow' 
                      : 'border-border bg-card/50'
                  }`}
                  onClick={() => onVideoSelect(video)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {video.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Durée: {formatDuration(video.duration)}</span>
                        <span>Taille: {formatFileSize(video.file.size)}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVideoDelete(video.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Section Audio */}
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold text-foreground">
                Pistes de Doublage
              </h3>
              <Badge variant="secondary" className="ml-2">
                {audios.length}
              </Badge>
            </div>
            
            <Button
              onClick={() => audioInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter Audio
            </Button>
          </div>

          <input
            ref={audioInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />

          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {audios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune piste audio importée</p>
                <p className="text-sm">Cliquez sur "Ajouter Audio" pour commencer</p>
              </div>
            ) : (
              audios.map(audio => (
                <div
                  key={audio.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                    selectedAudio?.id === audio.id 
                      ? 'border-accent bg-accent/10 shadow-glow' 
                      : 'border-border bg-card/50'
                  }`}
                  onClick={() => onAudioSelect(audio)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {audio.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Durée: {formatDuration(audio.duration)}</span>
                        <span>Taille: {formatFileSize(audio.file.size)}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAudioDelete(audio.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Bouton de démarrage synchronisation */}
      <Card className="p-4 bg-gradient-primary border-primary/30">
        <div className="flex items-center justify-between">
          <div className="text-primary-foreground">
            <p className="font-semibold">
              {isReadyToSync ? 'Prêt pour la synchronisation' : 'Sélectionnez une vidéo et un audio'}
            </p>
            <p className="text-sm opacity-90">
              {isReadyToSync 
                ? 'Compte à rebours de 3 secondes puis lecture synchronisée' 
                : 'Choisissez vos fichiers dans les bibliothèques ci-dessus'
              }
            </p>
          </div>
          
          <Button
            onClick={onStartSync}
            disabled={!isReadyToSync}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-bold px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Synchroniser
          </Button>
        </div>
      </Card>
    </div>
  );
};
