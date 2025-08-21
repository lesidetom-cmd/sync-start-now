import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useGameSession } from '@/hooks/useGameSession';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Trash2, 
  Video, 
  ArrowLeft, 
  Play, 
  Clock,
  HardDrive
} from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { videos, addVideo, deleteVideo } = useGameSession();
  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        try {
          await addVideo(file);
          toast({
            title: "Vidéo ajoutée",
            description: `"${file.name}" a été ajoutée à la bibliothèque.`,
          });
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: `Impossible d'ajouter "${file.name}". Vérifiez le format.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Format non supporté",
          description: `"${file.name}" n'est pas un fichier vidéo valide.`,
          variant: "destructive",
        });
      }
    }
    
    event.target.value = '';
  };

  const handleDeleteVideo = (id: string) => {
    const video = videos.find(v => v.id === id);
    deleteVideo(id);
    
    if (video) {
      toast({
        title: "Vidéo supprimée",
        description: `"${video.name}" a été supprimée de la bibliothèque.`,
      });
    }
  };

  const canCreateGame = videos.length >= 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="bg-secondary/50 hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au lobby
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Administration
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestion des vidéos et configuration des parties
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Section upload */}
          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Bibliothèque de Vidéos
                  </h2>
                </div>
                
                <Button
                  onClick={() => videoInputRef.current?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer des vidéos
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

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>Comment ça marche :</strong> Importez vos vidéos favorites depuis votre PC. 
                      Elles seront automatiquement sélectionnées de façon aléatoire pour créer des parties de 3 tours.
                    </p>
                    <p>
                      <strong>Formats supportés :</strong> MP4, WebM, AVI, MOV et autres formats vidéo courants.
                    </p>
                    <p>
                      <strong>Minimum requis :</strong> Au moins 3 vidéos pour pouvoir créer une partie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Status et actions rapides */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-card border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Statut du jeu</p>
                  <p className="font-semibold text-foreground">
                    {canCreateGame ? 'Prêt à jouer' : 'Vidéos manquantes'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  canCreateGame ? 'bg-status-synced animate-pulse' : 'bg-destructive'
                }`}></div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-primary border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/90">Action rapide</p>
                  <p className="font-semibold text-primary-foreground">
                    Lancer une partie
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/game?mode=meme')}
                  disabled={!canCreateGame}
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Go
                </Button>
              </div>
            </Card>
          </div>

          {/* Liste des vidéos */}
          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Vidéos disponibles
                </h3>
                <Badge variant="secondary">
                  {videos.length} élément{videos.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h4 className="text-lg font-medium mb-2">Aucune vidéo importée</h4>
                    <p className="text-sm mb-4">
                      Importez vos premières vidéos pour commencer à créer des parties de doublage
                    </p>
                    <Button
                      onClick={() => videoInputRef.current?.click()}
                      variant="outline"
                      className="bg-primary/10 border-primary/30 text-primary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importer maintenant
                    </Button>
                  </div>
                ) : (
                  videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition-colors"
                    >
                      {/* Numéro et icône */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Informations vidéo */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {video.name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(video.duration)}</span>
                          </div>
                          <span>{formatFileSize(video.file.size)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <Button
                        onClick={() => handleDeleteVideo(video.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Info minimum vidéos */}
          {!canCreateGame && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <p className="text-sm text-foreground">
                  <strong>Attention :</strong> Il vous faut au moins 3 vidéos pour créer une partie. 
                  Actuellement : {videos.length}/3 vidéos.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;