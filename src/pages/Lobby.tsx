import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useGameSession } from '@/context/GameSessionContext';
import { useToast } from '@/hooks/use-toast';
import { Smile, Settings, Play, Users, RotateCcw, Trash2 } from 'lucide-react';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { resetAllData, videos, currentSession } = useGameSession();
  const { toast } = useToast();

  const handleReset = () => {
    resetAllData();
    toast({
      title: "Reset effectué",
      description: "Toutes les données ont été effacées. Vous repartez de zéro !",
    });
  };

  const hasData = videos.length > 0 || currentSession;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center mx-auto">
              <h1 className="text-5xl font-bold text-foreground mb-2">
                🎭 DubSync Fixer
              </h1>
              <p className="text-xl text-muted-foreground">
                Le jeu ultime de doublage délirant !
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="bg-secondary/50 hover:bg-secondary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
              
              {hasData && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Description du jeu */}
          <Card className="p-8 mb-12 bg-gradient-card border-border/50 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-3xl font-bold text-foreground">
                Comment ça marche ?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mt-8 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Compte à rebours</h3>
                    <p className="text-sm text-muted-foreground">
                      3, 2, 1... Préparez-vous à doubler !
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Doublez en live</h3>
                    <p className="text-sm text-muted-foreground">
                      Enregistrez votre voix pendant la vidéo
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-status-synced rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">3 tours par partie</h3>
                    <p className="text-sm text-muted-foreground">
                      Créez votre chef-d'œuvre en 3 actes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Modes de jeu */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              Choisissez votre mode de jeu
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Mode Mème drôle */}
              <Card className="p-6 bg-gradient-primary border-primary/30 hover:shadow-glow transition-all cursor-pointer group">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4 group-hover:animate-bounce">
                    😂
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                      Mème Drôle
                    </h3>
                    <p className="text-primary-foreground/90 mb-4">
                      Doublez des scènes cultes avec votre humour ! 
                      Créez des mèmes audio hilarants.
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-2 mb-6">
                    <Badge className="bg-white/20 text-primary-foreground">
                      3 tours
                    </Badge>
                    <Badge className="bg-white/20 text-primary-foreground">
                      Enregistrement live
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={() => navigate('/game?mode=meme')}
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-bold w-full"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Commencer la partie
                  </Button>
                </div>
              </Card>

              {/* Mode Sérieux (bientôt disponible) */}
              <Card className="p-6 bg-muted border-border/50 opacity-60">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">
                    🎯
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Mode Sérieux
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Pour les doublages professionnels et les voix-off de qualité.
                    </p>
                  </div>
                  
                  <Badge variant="secondary" className="mb-6">
                    Bientôt disponible
                  </Badge>
                  
                  <Button
                    disabled
                    size="lg"
                    className="w-full"
                    variant="outline"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Prochainement
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Info complémentaire */}
          <Card className="p-6 mt-12 bg-accent/10 border-accent/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Administration</span>
            </div>
            <p className="text-muted-foreground">
              Gérez vos vidéos et personnalisez vos parties dans l'espace Admin
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Lobby;
