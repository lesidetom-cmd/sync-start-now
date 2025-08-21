import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { VideoLibrary } from './VideoLibrary';
import { useVideoSync } from '@/hooks/useVideoSync';
import { useToast } from '@/hooks/use-toast';

export const DubSyncApp: React.FC = () => {
  const {
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
  } = useVideoSync();

  const { toast } = useToast();

  const handleTimeUpdate = (currentTime: number) => {
    setSyncState(prev => ({
      ...prev,
      currentTime
    }));
  };

  const handleStartSync = () => {
    if (!selectedVideo || !selectedAudio) {
      toast({
        title: "Fichiers manquants",
        description: "Veuillez sélectionner une vidéo et un fichier audio.",
        variant: "destructive",
      });
      return;
    }

    if (selectedVideo.duration === 0) {
      toast({
        title: "Erreur de chargement vidéo",
        description: "La vidéo sélectionnée n'a pas pu être chargée correctement.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAudio.duration === 0) {
      toast({
        title: "Erreur de chargement audio",
        description: "Le fichier audio sélectionné n'a pas pu être chargé correctement.",
        variant: "destructive",
      });
      return;
    }

    startCountdownAndPlay();
    
    toast({
      title: "Synchronisation démarrée",
      description: `Lecture de "${selectedVideo.name}" avec "${selectedAudio.name}"`,
    });
  };

  const handleVideoAdd = async (file: File) => {
    try {
      await addVideo(file);
      toast({
        title: "Vidéo ajoutée",
        description: `"${file.name}" a été ajoutée à la bibliothèque.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'ajouter cette vidéo. Vérifiez le format.",
        variant: "destructive",
      });
    }
  };

  const handleAudioAdd = async (file: File) => {
    try {
      await addAudio(file);
      toast({
        title: "Audio ajouté",
        description: `"${file.name}" a été ajouté à la bibliothèque.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'ajouter ce fichier audio. Vérifiez le format.",
        variant: "destructive",
      });
    }
  };

  const isReadyToSync = selectedVideo && selectedAudio && !syncState.isPlaying && !syncState.isCountingDown;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                DubSync Fixer
              </h1>
              <p className="text-muted-foreground">
                Synchronisation professionnelle doublage-vidéo
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-status-synced rounded-full"></div>
              <span>Système prêt</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Lecteur vidéo */}
          <div className="lg:col-span-2">
            <VideoPlayer
              selectedVideo={selectedVideo}
              selectedAudio={selectedAudio}
              syncState={syncState}
              videoRef={videoRef}
              audioRef={audioRef}
              onRestart={restart}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {/* Colonne droite: Bibliothèques */}
          <div className="lg:col-span-1">
            <VideoLibrary
              videos={videos}
              audios={audios}
              selectedVideo={selectedVideo}
              selectedAudio={selectedAudio}
              onVideoSelect={setSelectedVideo}
              onAudioSelect={setSelectedAudio}
              onVideoAdd={handleVideoAdd}
              onAudioAdd={handleAudioAdd}
              onVideoDelete={deleteVideo}
              onAudioDelete={deleteAudio}
              onStartSync={handleStartSync}
              isReadyToSync={!!isReadyToSync}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/20 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © 2024 DubSync Fixer - Synchronisation professionnelle pour le doublage
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};