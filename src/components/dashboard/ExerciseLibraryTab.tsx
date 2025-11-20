import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Play, X } from "lucide-react";
import { searchExerciseByName, type ExerciseVideo, clearExerciseCache } from "@/lib/exerciseDB";
import { toast } from "sonner";

// Lista de exercícios comuns organizados por grupo muscular
const exercisesByMuscle = {
  "Peito": ["supino reto", "supino inclinado", "supino declinado", "crucifixo", "flexão"],
  "Costas": ["remada curvada", "puxada frontal", "remada unilateral", "levantamento terra", "pullover"],
  "Pernas": ["agachamento", "leg press", "cadeira extensora", "cadeira flexora", "panturrilha"],
  "Ombros": ["desenvolvimento", "elevação lateral", "elevação frontal", "remada alta", "crucifixo inverso"],
  "Bíceps": ["rosca direta", "rosca alternada", "rosca martelo", "rosca concentrada", "rosca scott"],
  "Tríceps": ["tríceps testa", "tríceps corda", "tríceps francês", "mergulho", "tríceps coice"],
  "Abdômen": ["abdominal", "prancha", "elevação de pernas", "abdominal oblíquo", "mountain climber"],
  "Glúteos": ["hip thrust", "elevação pélvica", "glúteo na máquina", "stiff", "ponte"],
};

export function ExerciseLibraryTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [videoDialog, setVideoDialog] = useState<{
    isOpen: boolean;
    exercise: ExerciseVideo | null;
    loading: boolean;
  }>({
    isOpen: false,
    exercise: null,
    loading: false,
  });

  const openExerciseVideo = async (exerciseName: string) => {
    setVideoDialog({ isOpen: true, exercise: null, loading: true });
    
    try {
      const exerciseData = await searchExerciseByName(exerciseName);
      
      if (exerciseData) {
        setVideoDialog({ isOpen: true, exercise: exerciseData, loading: false });
      } else {
        toast.error("Vídeo não encontrado", {
          description: "Não foi possível encontrar um vídeo demonstrativo para este exercício.",
        });
        setVideoDialog({ isOpen: false, exercise: null, loading: false });
      }
    } catch (error) {
      toast.error("Erro ao buscar vídeo", {
        description: "Ocorreu um erro ao tentar carregar o vídeo.",
      });
      setVideoDialog({ isOpen: false, exercise: null, loading: false });
    }
  };

  const handleClearCache = () => {
    clearExerciseCache();
    toast.success("Cache limpo com sucesso!");
  };

  const filteredMuscles = Object.entries(exercisesByMuscle).filter(([muscle]) =>
    muscle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupo muscular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleClearCache}>
          Limpar Cache
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredMuscles.map(([muscle, exercises]) => (
          <Card key={muscle}>
            <CardHeader>
              <CardTitle className="text-lg">{muscle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {exercises.map((exercise) => (
                  <Button
                    key={exercise}
                    variant="outline"
                    className="justify-between h-auto py-3"
                    onClick={() => openExerciseVideo(exercise)}
                  >
                    <span className="text-left flex-1 capitalize">{exercise}</span>
                    <Play className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMuscles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum grupo muscular encontrado para "{searchTerm}"
        </div>
      )}

      {/* Video Dialog */}
      <Dialog open={videoDialog.isOpen} onOpenChange={(open) => !open && setVideoDialog({ isOpen: false, exercise: null, loading: false })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {videoDialog.loading ? "Carregando..." : videoDialog.exercise?.name}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVideoDialog({ isOpen: false, exercise: null, loading: false })}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {videoDialog.loading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-64" />
              <Skeleton className="w-full h-20" />
            </div>
          ) : videoDialog.exercise ? (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={videoDialog.exercise.gifUrl}
                  alt={videoDialog.exercise.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {videoDialog.exercise.bodyPart}
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-sm">
                    {videoDialog.exercise.target}
                  </span>
                  <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full text-sm">
                    {videoDialog.exercise.equipment}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Instruções:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {videoDialog.exercise.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
