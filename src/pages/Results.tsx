import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameSession } from '@/hooks/useGameSession';
import { 
  ArrowLeft, 
  Play, 
  Download, 
  RotateCcw,
  Volume2,
  VolumeX,
  Home
} from 'lucide-react';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession } = useGameSession();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const completedRounds = currentSession?.rounds.filter(round => round.completed && round.recording) || [];

  const handlePlayRound = async (index: number) => {
    // Arrêter toutes les autres lectures
    videoRefs.current.forEach((video, i) => {
      if (video && i !== index) {
        video.pause();
        video.currentTime = 0;
      }
    });
    audioRefs.current.forEach((audio, i) => {
      if (audio && i !== index) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    const video = videoRefs.current[index];
    const audio = audioRefs.current[index];

    if (video && audio) {
      if (playingIndex === index) {
        // Arrêter la lecture
        video.pause();
        audio.pause();
        setPlayingIndex(null);
      } else {
        // Démarrer la lecture synchronisée
        video.currentTime = 0;
        audio.currentTime = 0;
        
        try {
          await Promise.all([
            video.play(),
            audio.play()
          ]);
          setPlayingIndex(index);
        } catch (error) {
          console.error('Erreur lors de la lecture:', error);
        }
      }
    }
  };

  const handleVideoEnded = (index: number) => {
    setPlayingIndex(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadRecording = (recording: any, videoName: string) => {
    const url = recording.audioUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `doublage-${videoName.replace(/\.[^/.]+$/, '')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!currentSession || completedRounds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🤷</div>
          <h2 className="text-xl font-bold mb-4">Aucun résultat trouvé</h2>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore terminé de partie ou vos enregistrements n'ont pas été sauvegardés.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/game?mode=meme')} 
              className="w-full"
            >
              Commencer une partie
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full"
            >
              Retour au lobby
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/game?mode=meme')}
                variant="outline"
                size="sm"
                className="bg-secondary/50 hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au jeu
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  🎬 Vos Créations
                </h1>
                <p className="text-sm text-muted-foreground">
                  {completedRounds.length} doublage{completedRounds.length > 1 ? 's' : ''} terminé{completedRounds.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant="outline"
                size="sm"
                className="bg-muted/50 hover:bg-muted"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/30 text-primary"
              >
                <Home className="w-4 h-4 mr-2" />
                Lobby
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Summary card */}
          <Card className="p-6 bg-gradient-primary border-primary/30 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                  Félicitations !
                </h2>
                <p className="text-primary-foreground/90">
                  Vous avez terminé {completedRounds.length} tour{completedRounds.length > 1 ? 's' : ''} de doublage. 
                  Visionnez vos créations ci-dessous !
                </p>
              </div>
              
              <div className="flex justify-center gap-2">
                <Badge className="bg-white/20 text-primary-foreground">
                  Mode: {currentSession.mode === 'meme' ? 'Mème Drôle' : 'Sérieux'}
                </Badge>
                <Badge className="bg-white/20 text-primary-foreground">
                  {completedRounds.length}/3 tours
                </Badge>
              </div>
            </div>
          </Card>

          {/* Liste des doublages */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Vos doublages enregistrés
            </h3>
            
            {completedRounds.map((round, index) => (
              <Card key={round.id} className="p-6 bg-gradient-card border-border/50">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Vidéo */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">
                        Tour {index + 1}: {round.video.name}
                      </h4>
                      <Badge variant="secondary">
                        {formatTime(round.video.duration)}
                      </Badge>
                    </div>
                    
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={el => videoRefs.current[index] = el}
                        src={round.video.url}
                        className="w-full h-48 object-contain"
                        muted={isMuted}
                        onEnded={() => handleVideoEnded(index)}
                        controls={false}
                      />
                      
                      {/* Overlay de contrôle */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                        <Button
                          onClick={() => handlePlayRound(index)}
                          size="lg"
                          className="bg-white/90 text-black hover:bg-white"
                        >
                          {playingIndex === index ? (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <div className="w-2 h-4 bg-black mx-0.5"></div>
                              <div className="w-2 h-4 bg-black mx-0.5"></div>
                            </div>
                          ) : (
                            <Play className="w-6 h-6" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Audio caché pour synchronisation */}
                    {round.recording && (
                      <audio
                        ref={el => audioRefs.current[index] = el}
                        src={round.recording.audioUrl}
                        className="hidden"
                      />
                    )}
                  </div>

                  {/* Informations et actions */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-status-synced rounded-full"></div>
                        <span className="text-sm font-medium text-foreground">
                          Doublage terminé
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Enregistré le {round.recording && 
                          new Date(round.recording.recordedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => handlePlayRound(index)}
                        className="w-full"
                        variant={playingIndex === index ? "secondary" : "default"}
                      >
                        {playingIndex === index ? (
                          <>
                            <div className="w-4 h-4 flex items-center justify-center mr-2">
                              <div className="w-1 h-3 bg-current mx-0.5"></div>
                              <div className="w-1 h-3 bg-current mx-0.5"></div>
                            </div>
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Lire avec doublage
                          </>
                        )}
                      </Button>
                      
                      {round.recording && (
                        <Button
                          onClick={() => downloadRecording(round.recording, round.video.name)}
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger l'audio
                        </Button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: Cliquez sur "Lire avec doublage" pour voir le résultat final 
                        avec votre voix synchronisée !
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions finales */}
          <Card className="p-6 bg-gradient-card border-border/50 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Que voulez-vous faire maintenant ?
              </h3>
              
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => navigate('/game?mode=meme')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nouvelle partie
                </Button>
                
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="bg-accent/10 border-accent/30 text-accent"
                >
                  Gérer les vidéos
                </Button>
                
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour au lobby
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;