import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Dumbbell, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  instructions: string[];
}

const RAPIDAPI_KEY = "6c5912ddddmsh039de1d7dbb33bbp10d478jsn984f546dd437";

const bodyPartEmojis: Record<string, string> = {
  "back": "🦴",
  "cardio": "❤️",
  "chest": "💪",
  "lower arms": "💪",
  "lower legs": "🦵",
  "neck": "🧑",
  "shoulders": "💪",
  "upper arms": "💪",
  "upper legs": "🦵",
  "waist": "🔥"
};

const translateExerciseName = (name: string): string => {
  const translations: Record<string, string> = {
    // Common exercise terms
    "push": "empurrar",
    "pull": "puxar",
    "up": "para cima",
    "down": "para baixo",
    "press": "pressão",
    "curl": "rosca",
    "raise": "elevação",
    "row": "remada",
    "squat": "agachamento",
    "lunge": "afundo",
    "crunch": "abdominal",
    "plank": "prancha",
    "bridge": "ponte",
    "deadlift": "levantamento terra",
    "bench": "banco",
    "dumbbell": "halter",
    "barbell": "barra",
    "cable": "cabo",
    "machine": "máquina",
    "band": "elástico",
    "body weight": "peso corporal",
    "assisted": "assistido",
    "standing": "em pé",
    "seated": "sentado",
    "lying": "deitado",
    "incline": "inclinado",
    "decline": "declinado",
    "alternating": "alternado",
    "single": "único",
    "leg": "perna",
    "arm": "braço",
    "shoulder": "ombro",
    "chest": "peito",
    "back": "costas",
    "biceps": "bíceps",
    "triceps": "tríceps",
    "lateral": "lateral",
    "front": "frontal",
    "rear": "posterior"
  };
  
  let translated = name.toLowerCase();
  Object.entries(translations).forEach(([eng, pt]) => {
    translated = translated.replace(new RegExp(eng, 'gi'), pt);
  });
  
  return translated.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const translateInstruction = (instruction: string): string => {
  const translations: Record<string, string> = {
    "stand": "fique em pé",
    "sit": "sente-se",
    "lie": "deite-se",
    "hold": "segure",
    "grab": "pegue",
    "place": "coloque",
    "position": "posicione",
    "keep": "mantenha",
    "slowly": "lentamente",
    "lower": "abaixe",
    "lift": "levante",
    "raise": "eleve",
    "return": "retorne",
    "repeat": "repita",
    "exhale": "expire",
    "inhale": "inspire",
    "breathe": "respire",
    "arms": "braços",
    "legs": "pernas",
    "back": "costas",
    "chest": "peito",
    "shoulders": "ombros",
    "feet": "pés",
    "hands": "mãos",
    "floor": "chão",
    "ground": "solo",
    "bench": "banco",
    "bar": "barra",
    "weight": "peso",
    "dumbbell": "halter",
    "your": "seu(s)/sua(s)",
    "the": "o/a",
    "and": "e",
    "with": "com",
    "without": "sem",
    "until": "até",
    "then": "então",
    "while": "enquanto",
    "starting": "começando",
    "forward": "para frente",
    "backward": "para trás",
    "upward": "para cima",
    "downward": "para baixo"
  };
  
  let translated = instruction.toLowerCase();
  Object.entries(translations).forEach(([eng, pt]) => {
    translated = translated.replace(new RegExp(`\\b${eng}\\b`, 'gi'), pt);
  });
  
  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

const bodyPartTranslations: Record<string, string> = {
  "back": "Costas",
  "cardio": "Cardio",
  "chest": "Peito",
  "lower arms": "Antebraços",
  "lower legs": "Panturrilhas",
  "neck": "Pescoço",
  "shoulders": "Ombros",
  "upper arms": "Braços",
  "upper legs": "Pernas",
  "waist": "Abdômen"
};

const equipmentTranslations: Record<string, string> = {
  "assisted": "Assistido",
  "band": "Elástico",
  "barbell": "Barra",
  "body weight": "Peso Corporal",
  "bosu ball": "Bosu",
  "cable": "Cabo",
  "dumbbell": "Halter",
  "elliptical machine": "Elíptico",
  "ez barbell": "Barra EZ",
  "hammer": "Martelo",
  "kettlebell": "Kettlebell",
  "leverage machine": "Máquina",
  "medicine ball": "Medicine Ball",
  "olympic barbell": "Barra Olímpica",
  "resistance band": "Faixa de Resistência",
  "roller": "Roller",
  "rope": "Corda",
  "skierg machine": "SkiErg",
  "sled machine": "Trenó",
  "smith machine": "Smith Machine",
  "stability ball": "Bola Suíça",
  "stationary bike": "Bicicleta Ergométrica",
  "stepmill machine": "Stepmill",
  "tire": "Pneu",
  "trap bar": "Trap Bar",
  "upper body ergometer": "Ergômetro",
  "weighted": "Com Peso",
  "wheel roller": "Roda Abdominal"
};

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        
        // Fetch exercises for all body parts
        const bodyParts = Object.keys(bodyPartTranslations);
        const allExercises: Exercise[] = [];

        for (const bodyPart of bodyParts) {
          try {
            const response = await fetch(
              `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}?limit=50`,
              {
                headers: {
                  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
                  'x-rapidapi-key': '6c5912ddddmsh039de1d7dbb33bbp10d478jsn984f546dd437',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log('Exercícios recebidos:', data.slice(0, 2)); // Log para debug
              allExercises.push(...data);
            } else {
              console.error('Erro na resposta da API:', response.status, await response.text());
            }
          } catch (error) {
            console.error(`Error fetching ${bodyPart}:`, error);
          }
        }

        setExercises(allExercises);
        setFilteredExercises(allExercises);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  useEffect(() => {
    let filtered = exercises;

    if (selectedBodyPart !== "all") {
      filtered = filtered.filter(ex => ex.bodyPart === selectedBodyPart);
    }

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  }, [searchTerm, selectedBodyPart, exercises]);

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const bodyPart = exercise.bodyPart;
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Carregando biblioteca de exercícios...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card shadow-medium">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Biblioteca de Exercícios</h2>
            <p className="text-muted-foreground">Mais de {exercises.length} exercícios com demonstrações</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício por nome ou músculo alvo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Tabs value={selectedBodyPart} onValueChange={setSelectedBodyPart} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 gap-1">
            <TabsTrigger value="all" className="whitespace-nowrap">
              Todos
            </TabsTrigger>
            {Object.entries(bodyPartTranslations).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="whitespace-nowrap">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={selectedBodyPart} className="space-y-6 mt-6">
          {Object.entries(groupedExercises).map(([bodyPart, exercises]) => (
            <motion.div
              key={bodyPart}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full" />
                {bodyPartTranslations[bodyPart] || bodyPart}
                <Badge variant="secondary">{exercises.length}</Badge>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden flex items-center justify-center">
                        <span className="text-8xl">
                          {bodyPartEmojis[exercise.bodyPart] || "💪"}
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-2 line-clamp-2">
                          {translateExerciseName(exercise.name)}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {exercise.target}
                          </Badge>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {equipmentTranslations[exercise.equipment] || exercise.equipment}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {filteredExercises.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum exercício encontrado com os filtros aplicados.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {translateExerciseName(selectedExercise.name)}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 pb-4">
                <Badge variant="outline" className="capitalize">
                  {bodyPartTranslations[selectedExercise.bodyPart] || selectedExercise.bodyPart}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  Alvo: {selectedExercise.target}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {equipmentTranslations[selectedExercise.equipment] || selectedExercise.equipment}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg overflow-hidden flex items-center justify-center">
                  <span className="text-9xl">
                    {bodyPartEmojis[selectedExercise.bodyPart] || "💪"}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Instruções:</h4>
                  <ol className="space-y-2">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{translateInstruction(instruction)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseLibrary;
