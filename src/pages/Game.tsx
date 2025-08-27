import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameSession } from '@/context/GameSessionContext';
import { useToast } from '@/hooks/use-toast';
import { 
  RotateCcw, 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Play,
  Square,
  ArrowRight,
  Eye,
  RefreshCw,
  SkipForward
} from 'lucide-react';

const Game: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'meme';
  const { toast } = useToast();
  const [showEndOptions, setShowEndOptions] = useState(false);

  const {
    videos,
    currentSession,
    gameState,
    videoRef,
    currentRound,
    isLastRound,
    createGameSession,
    startCountdownAndPlay,
    finishCurrentRound,
    nextRound,
    restartRound,
    setRecordingType,
    handleTimeUpdate,
  } = useGameSession();

  // Créer une session au montage du composant
  useEffect(() => {
    if (!currentSession && videos.length >= 3) {
      try {
        createGameSession(mode as 'meme' | 'serious');
        toast({
          title: "Partie créée",
          description: `Nouvelle partie "${mode}" avec 3 vidéos sélectionnées !`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la partie. Vérifiez qu'il y a au moins 3 vidéos.",
          variant: "destructive",
        });
        navigate('/admin');
      }
    }
  }, [videos, currentSession, mode, createGameSession, toast, navigate]);

  // Gérer la mise à jour du temps vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Régler le volume de la vidéo pour qu'elle soit audible pendant le doublage
    video.volume = 1.0;

    const onTimeUpdate = () => {
      handleTimeUpdate(video.currentTime);
    };

    const onEnded = async () => {
      console.log('Video ended, isRecording:', gameState.isRecording, 'showEndOptions:', showEndOptions);
      
      // Ne traiter l'événement que si on est en train d'enregistrer et que les options ne sont pas déjà affichées
      if (gameState.isRecording && !showEndOptions) {
        try {
          // Arrêter l'enregistrement d'abord
          await finishCurrentRound();
          console.log('Round finished, showing end options');
          // Puis montrer les options
          setShowEndOptions(true);
        } catch (error) {
          console.error('Error finishing round:', error);
          toast({
            title: "Erreur",
            description: "Problème lors de la finalisation de l'enregistrement",
            variant: "destructive",
          });
        }
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoRef, handleTimeUpdate, finishCurrentRound, gameState.isRecording, showEndOptions, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishAndNext = async () => {
    setShowEndOptions(false);
    
    if (isLastRound) {
      toast({
        title: "Partie terminée !",
        description: "Tous les tours sont terminés. Visionnez votre création !",
      });
      navigate('/results');
    } else {
      nextRound();
      toast({
        title: "Tour terminé",
        description: "Passons au tour suivant !",
      });
    }
  };

  const handleRestartRound = () => {
    setShowEndOptions(false);
    restartRound();
    toast({
      title: "Tour redémarré",
      description: "Vous pouvez refaire le doublage !",
    });
  };

  // Reset showEndOptions quand on change de round
  useEffect(() => {
    setShowEndOptions(false);
  }, [currentSession?.currentRoundIndex]);

  if (!currentSession || !currentRound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">Session non trouvée</h2>
          <p className="text-muted-foreground mb-6">
            Impossible de charger la partie. Assurez-vous d'avoir au moins 3 vidéos dans l'admin.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/admin')} 
              className="w-full"
            >
              Aller à l'Admin
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

  const progressPercentage = currentRound.video.duration > 0 
    ? (gameState.currentTime / currentRound.video.duration) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="bg-secondary/50 hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quitter
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {mode === 'meme' ? '😂 Mème Drôle' : '🎯 Mode Sérieux'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tour {currentSession.currentRoundIndex + 1}/3
                </p>
              </div>
            </div>
            
            {/* Bouton Restart permanent */}
            <Button
              onClick={() => {
                setShowEndOptions(false);
                restartRound();
              }}
              variant="outline"
              size="sm"
              className="bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
          
          {/* Progress bar des tours */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progression de la partie</span>
              <span>{currentSession.currentRoundIndex + 1}/3 tours</span>
            </div>
            <Progress 
              value={((currentSession.currentRoundIndex + 1) / 3) * 100}
              className="h-2"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Zone vidéo principale */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-gradient-card border-border/50">
              <div className="space-y-4">
                
                {/* Info du tour actuel */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      Tour {currentSession.currentRoundIndex + 1}
                    </Badge>
                    <h2 className="font-semibold text-foreground">
                      {currentRound.video.name}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {gameState.isRecording && (
                      <>
                        <div className="w-2 h-2 bg-status-recording rounded-full animate-pulse"></div>
                        <span>ENREGISTREMENT</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Zone de lecture vidéo */}
                <div className="relative bg-black rounded-lg overflow-hidden min-h-[1000px] flex items-center justify-center">
                  {currentRound?.video?.url ? (
                    <video
                      ref={videoRef}
                      src={currentRound.video.url}
                      className="w-full h-full object-contain max-h-[1000px]"
                      controls={false}
                      muted={false}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-lg">Chargement de la vidéo...</p>
                    </div>
                  )}
                  
                  {/* Overlay compte à rebours */}
                  {gameState.isCountingDown && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-9xl font-bold text-primary animate-countdown mb-4">
                          {gameState.countdownValue}
                        </div>
                        <p className="text-xl text-white">
                          Préparez-vous à doubler !
                        </p>
                      </div>
                    </div>
                   )}
                   
                   {/* Overlay des options de fin */}
                   {showEndOptions && (
                     <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                       <Card className="p-8 max-w-md w-full mx-4 bg-card/95 backdrop-blur-sm">
                         <div className="text-center space-y-6">
                           <div className="text-4xl mb-4">🎬</div>
                           <h3 className="text-xl font-bold text-foreground">
                             Vidéo terminée !
                           </h3>
                           <p className="text-muted-foreground">
                             Que voulez-vous faire maintenant ?
                           </p>
                           
                           <div className="space-y-3">
                             <Button
                               onClick={handleRestartRound}
                               variant="outline"
                               className="w-full flex items-center justify-center gap-2"
                               size="lg"
                             >
                               <RefreshCw className="w-5 h-5" />
                               Recommencer le doublage
                             </Button>
                             
                             <Button
                               onClick={handleFinishAndNext}
                               className="w-full flex items-center justify-center gap-2"
                               size="lg"
                             >
                               <SkipForward className="w-5 h-5" />
                               {isLastRound ? 'Terminer la partie' : 'Tour suivant'}
                             </Button>
                           </div>
                         </div>
                       </Card>
                     </div>
                   )}
                   
                   {/* Status overlay */}
                   <div className="absolute top-4 left-4 flex gap-2">
                     {gameState.isPlaying && (
                       <Badge className="bg-black/50 text-white border-0">
                         <Play className="w-3 h-3 mr-1" />
                         EN LECTURE
                       </Badge>
                     )}
                     {gameState.isRecording && (
                       <Badge className="bg-status-recording text-white border-0 animate-pulse">
                         <Mic className="w-3 h-3 mr-1" />
                         REC
                       </Badge>
                     )}
                   </div>
                </div>

                {/* Barre de progression vidéo */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(gameState.currentTime)}</span>
                    <span>{formatTime(currentRound.video.duration)}</span>
                  </div>
                  <Progress 
                    value={progressPercentage}
                    className="h-2"
                  />
                </div>

                {/* Contrôles principaux */}
                <div className="flex justify-center gap-4 pt-4">
                  {!gameState.isPlaying && !gameState.isCountingDown && !showEndOptions && (
                    <Button
                      onClick={startCountdownAndPlay}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 px-8"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Commencer le doublage
                    </Button>
                  )}
                  
                  {gameState.isPlaying && !showEndOptions && (
                    <div className="flex gap-4">
                      <Button
                        onClick={async () => {
                          if (gameState.isRecording) {
                            try {
                              await finishCurrentRound();
                              setShowEndOptions(true);
                            } catch (error) {
                              console.error('Error finishing round manually:', error);
                              toast({
                                title: "Erreur",
                                description: "Problème lors de l'arrêt de l'enregistrement",
                                variant: "destructive",
                              });
                            }
                          } else {
                            setShowEndOptions(true);
                          }
                        }}
                        size="lg"
                        className="bg-accent hover:bg-accent/90 px-8"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Arrêter l'enregistrement
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Panneau de contrôle */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              
              {/* Choix du type d'enregistrement */}
              <Card className="p-4 bg-gradient-card border-border/50">
                <h3 className="font-semibold text-foreground mb-3">Mode d'enregistrement</h3>
                <div className="space-y-3">
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      gameState.recordingType === 'audio-only'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    onClick={() => setRecordingType('audio-only')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        gameState.recordingType === 'audio-only'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {gameState.recordingType === 'audio-only' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">🎤 Audio seul</div>
                        <div className="text-xs text-muted-foreground">Doublage vocal uniquement</div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      gameState.recordingType === 'video-audio'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    onClick={() => setRecordingType('video-audio')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        gameState.recordingType === 'video-audio'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {gameState.recordingType === 'video-audio' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">📹 Vidéo + Audio</div>
                        <div className="text-xs text-muted-foreground">Votre visage + voix</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status de l'enregistrement */}
              <Card className="p-4 bg-gradient-card border-border/50">
                <div className="text-center space-y-3">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    gameState.isRecording 
                      ? 'bg-status-recording animate-pulse' 
                      : 'bg-muted'
                  }`}>
                    {gameState.isRecording ? (
                      <Mic className="w-8 h-8 text-white" />
                    ) : (
                      <MicOff className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground">
                      {gameState.isRecording ? 'Enregistrement...' : 'Microphone'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {gameState.isRecording 
                        ? 'Doublez maintenant !' 
                        : 'Prêt à enregistrer'
                      }
                    </p>
                  </div>
                </div>
              </Card>

              {/* Tours de la partie */}
              <Card className="p-4 bg-gradient-card border-border/50">
                <h3 className="font-semibold text-foreground mb-3">Tours de la partie</h3>
                <div className="space-y-2">
                  {currentSession.rounds.map((round, index) => (
                    <div 
                      key={round.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        index === currentSession.currentRoundIndex
                          ? 'bg-primary/20 border border-primary/30'
                          : round.completed
                          ? 'bg-status-synced/20 text-status-synced'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === currentSession.currentRoundIndex
                            ? 'bg-primary text-primary-foreground'
                            : round.completed
                            ? 'bg-status-synced text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="truncate text-xs">
                          {round.video.name.length > 15 
                            ? round.video.name.substring(0, 15) + '...'
                            : round.video.name
                          }
                        </span>
                      </div>
                      
                      {round.completed && (
                        <div className="w-2 h-2 bg-status-synced rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action rapide */}
              <Card className="p-4 bg-accent/10 border-accent/30">
                <div className="text-center space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-accent" />
                  <p className="text-sm font-medium text-foreground">
                    Voir les résultats
                  </p>
                  <Button
                    onClick={() => navigate('/results')}
                    variant="outline"
                    size="sm"
                    className="w-full border-accent/30 text-accent hover:bg-accent/10"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Résultats
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Game;
