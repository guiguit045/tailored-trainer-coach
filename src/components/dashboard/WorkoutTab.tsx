import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repeat, Timer, Info, Sparkles, ChevronRight, Calendar, Play, CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { QuizData, Exercise, Workout } from "@/pages/Quiz";
import { getCurrentCycleCompletedWorkouts } from "@/lib/workoutStorage";

interface WorkoutTabProps {
  quizData: QuizData;
}

const generateWorkout = (quizData: QuizData): Exercise[] => {
  const isBeginnerOrLowExperience = 
    quizData.hasTrainedBefore === "no" || 
    quizData.experienceTime === "less-than-6-months";
  
  const isWeightLoss = quizData.mainGoal === "weight-loss";
  const isMuscleGain = quizData.mainGoal === "muscle-gain";
  
  if (isBeginnerOrLowExperience) {
    return [
      {
        name: "Agachamento Livre",
        sets: "3",
        reps: "12-15",
        rest: "60s",
        tip: "Mantenha os pés na largura dos ombros e desça até os joelhos formarem 90°. Olhe para frente.",
        why: "Trabalha pernas completas e core. Essencial para iniciantes ganharem força base.",
        variations: ["Agachamento na parede", "Agachamento com halteres"]
      },
      {
        name: "Flexão de Braço",
        sets: "3",
        reps: "8-12",
        rest: "60s",
        tip: "Corpo reto da cabeça aos pés. Se for difícil, apoie os joelhos no chão.",
        why: "Fortalece peito, ombros e tríceps. Movimento funcional que melhora força do tronco.",
        variations: ["Flexão nos joelhos", "Flexão elevada (mãos em banco)"]
      },
      {
        name: "Remada Curvada (barra ou halteres)",
        sets: "3",
        reps: "10-12",
        rest: "60s",
        tip: "Incline o tronco a 45°, puxe a barra até o abdômen. Mantenha as costas retas.",
        why: "Desenvolve costas e melhora postura. Equilibra o treino de empurrar com puxar.",
        variations: ["Remada unilateral com halter", "Remada com elástico"]
      },
      {
        name: "Desenvolvimento de Ombros",
        sets: "3",
        reps: "10-12",
        rest: "60s",
        tip: "Pressione halteres ou barra acima da cabeça, mantendo abdômen contraído.",
        why: "Fortalece ombros e melhora estabilidade. Importante para definição do tronco superior.",
        variations: ["Desenvolvimento com halteres sentado", "Elevação lateral"]
      },
      {
        name: "Prancha",
        sets: "3",
        reps: "30-45s",
        rest: "45s",
        tip: "Apoie antebraços e pontas dos pés, mantenha corpo reto como uma prancha.",
        why: "Fortalece core e previne lesões. Base para todos os exercícios.",
        variations: ["Prancha nos joelhos", "Prancha lateral"]
      }
    ];
  }
  
  if (isMuscleGain) {
    return [
      {
        name: "Supino Reto",
        sets: "4",
        reps: "8-10",
        rest: "90s",
        tip: "Deite no banco, desça a barra até o peito e empurre. Mantenha escápulas retraídas.",
        why: "Principal exercício para peitoral. Gera grande estímulo de hipertrofia.",
        variations: ["Supino inclinado", "Supino com halteres"]
      },
      {
        name: "Agachamento com Barra",
        sets: "4",
        reps: "8-10",
        rest: "2min",
        tip: "Barra nas costas, desça controlado até quebrar paralelo. Peito para fora.",
        why: "Rei dos exercícios para pernas. Estimula liberação hormonal e crescimento.",
        variations: ["Agachamento frontal", "Hack squat"]
      },
      {
        name: "Levantamento Terra",
        sets: "3",
        reps: "6-8",
        rest: "2min",
        tip: "Pegue a barra, mantenha costas neutras, empurre o chão com os pés.",
        why: "Trabalha corpo todo, especialmente costas e posteriores. Força bruta.",
        variations: ["Terra sumô", "Terra romeno"]
      },
      {
        name: "Barra Fixa",
        sets: "4",
        reps: "6-10",
        rest: "90s",
        tip: "Pegada pronada (palmas para frente), puxe até queixo passar da barra.",
        why: "Melhor exercício para dorsal. Desenvolve costas largas em V.",
        variations: ["Puxada frontal", "Barra com pegada neutra"]
      },
      {
        name: "Rosca Direta",
        sets: "3",
        reps: "10-12",
        rest: "60s",
        tip: "Cotovelos fixos, curve a barra até os bíceps. Controle na descida.",
        why: "Isolamento de bíceps. Desenvolve braços maiores.",
        variations: ["Rosca alternada", "Rosca martelo"]
      }
    ];
  }
  
  if (isWeightLoss) {
    return [
      {
        name: "Burpees",
        sets: "4",
        reps: "10-15",
        rest: "45s",
        tip: "Agache, apoie mãos, pule para prancha, faça flexão, volte e pule.",
        why: "Alto gasto calórico. Trabalha corpo todo e acelera metabolismo.",
        variations: ["Burpee sem flexão", "Burpee com salto alto"]
      },
      {
        name: "Mountain Climbers",
        sets: "4",
        reps: "20-30",
        rest: "30s",
        tip: "Posição de prancha, traga joelhos alternados ao peito rapidamente.",
        why: "Queima muitas calorias, trabalha core e aumenta frequência cardíaca.",
        variations: ["Mountain climber lento", "Cruzado (joelho para cotovelo oposto)"]
      },
      {
        name: "Agachamento com Salto",
        sets: "4",
        reps: "12-15",
        rest: "45s",
        tip: "Agache e exploda em salto vertical. Aterrize suave.",
        why: "Exercício pliométrico que aumenta gasto calórico e potência de pernas.",
        variations: ["Agachamento normal", "Salto em caixa"]
      },
      {
        name: "Remada Alta com Halteres",
        sets: "3",
        reps: "12-15",
        rest: "45s",
        tip: "Puxe halteres até altura do peito, cotovelos acima dos pulsos.",
        why: "Trabalha ombros e trapézio. Mantém músculos tonificados durante emagrecimento.",
        variations: ["Remada alta com barra", "Elevação frontal"]
      },
      {
        name: "Prancha com Toque no Ombro",
        sets: "3",
        reps: "20 toques",
        rest: "45s",
        tip: "Posição de prancha, toque ombro oposto alternando mãos. Minimize balanço.",
        why: "Core forte queima mais calorias em repouso. Estabilidade é crucial.",
        variations: ["Prancha estática", "Prancha com elevação de perna"]
      }
    ];
  }

  return [
    {
      name: "Agachamento Livre",
      sets: "3",
      reps: "12-15",
      rest: "60s",
      tip: "Mantenha os pés na largura dos ombros.",
      why: "Trabalha pernas e core.",
      variations: ["Agachamento com peso", "Agachamento búlgaro"]
    },
    {
      name: "Flexão de Braço",
      sets: "3",
      reps: "10-12",
      rest: "60s",
      tip: "Corpo reto da cabeça aos pés.",
      why: "Fortalece peito e braços.",
      variations: ["Flexão nos joelhos", "Flexão diamante"]
    }
  ];
};

const WorkoutTab = ({ quizData }: WorkoutTabProps) => {
  const navigate = useNavigate();
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);

  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      const completed = await getCurrentCycleCompletedWorkouts();
      setCompletedWorkouts(completed.map(w => w.day_name));
    };
    loadCompletedWorkouts();
  }, []);
  
  // Use AI-generated workout if available, otherwise fall back to template
  const hasAIWorkout = quizData.aiWorkoutPlan && quizData.aiWorkoutPlan.length > 0;
  const fallbackWorkout: Workout[] = [
    {
      day: "Treino Completo",
      description: "Treino de corpo inteiro para iniciantes",
      exercises: generateWorkout(quizData)
    }
  ];
  const workouts = hasAIWorkout ? quizData.aiWorkoutPlan! : fallbackWorkout;

  return (
    <div className="space-y-6">
      {/* Header Card with Plan Info */}
      <Card className="overflow-hidden bg-gradient-hero text-primary-foreground shadow-elegant">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                {hasAIWorkout && <Sparkles className="h-6 w-6" />}
                {quizData.mainGoal === "weight-loss" && "Emagrecimento"}
                {quizData.mainGoal === "muscle-gain" && "Fortalecimento Muscular"}
                {quizData.mainGoal === "conditioning" && "Condicionamento Físico"}
                {quizData.mainGoal === "health" && "Saúde Geral"}
                {quizData.mainGoal === "endurance" && "Resistência"}
              </h3>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {workouts.length === 1 ? "Treino Completo" : `${workouts.length} Dias de Treino`}
              </p>
            </div>
            {hasAIWorkout && (
              <Badge className="bg-white/20 text-primary-foreground border-white/30">
                IA Personalizado
              </Badge>
            )}
          </div>
          <p className="text-sm opacity-90">
            {hasAIWorkout 
              ? "Plano criado por IA baseado em todas as suas informações" 
              : "Plano personalizado baseado em seu perfil e objetivos"}
          </p>
        </div>
      </Card>

      {quizData.bodyAnalysis && (
        <Card className="p-6 bg-gradient-accent shadow-medium">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Análise por IA do seu corpo</h4>
              <p className="text-sm text-muted-foreground">
                Baseado nas fotos que você enviou
              </p>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {quizData.bodyAnalysis}
            </p>
          </div>
        </Card>
      )}

      {/* Workout Days Accordion */}
      <div className="space-y-3">
        <Accordion type="single" collapsible className="space-y-3">
          {workouts.map((workout, workoutIdx) => {
            const isCompleted = completedWorkouts.includes(workout.day);
            
            return (
              <AccordionItem 
                key={workoutIdx} 
                value={`day-${workoutIdx}`}
                className="border-0"
              >
                <Card className="overflow-hidden hover:shadow-medium transition-all">
                  <AccordionTrigger className="px-4 sm:px-6 py-4 hover:no-underline [&[data-state=open]]:bg-gradient-hero [&[data-state=open]]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base sm:text-lg font-bold mb-1">
                            {workout.day.split(" - ")[0]}
                          </h4>
                          {isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm opacity-80">
                          {workout.day.includes(" - ") ? workout.day.split(" - ")[1] : workout.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                            Concluído
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {workout.exercises.length}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 pt-4">
                  <Button
                    onClick={() => navigate(`/workout/active?workout=${workoutIdx}`)}
                    className="w-full mb-4"
                    size="lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Iniciar Treino
                  </Button>
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, exerciseIdx) => (
                      <div key={exerciseIdx} className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-bold mb-1">{exercise.name}</h5>
                            <Badge variant="secondary" className="text-xs">
                              Exercício {exerciseIdx + 1}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Séries</p>
                              <p className="font-semibold text-sm">{exercise.sets}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-secondary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Reps</p>
                              <p className="font-semibold text-sm">{exercise.reps}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-accent" />
                            <div>
                              <p className="text-xs text-muted-foreground">Descanso</p>
                              <p className="font-semibold text-sm">{exercise.rest}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-primary mb-1">Dica de Execução</p>
                                <p className="text-xs">{exercise.tip}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-accent/5 p-3 rounded-lg border border-accent/10">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">Por que este exercício?</p>
                                <p className="text-xs">{exercise.why}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Variações</p>
                            <div className="flex flex-wrap gap-1.5">
                              {exercise.variations.map((variation, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {variation}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
          })}
        </Accordion>
      </div>

      {/* Tips Card */}
      <Card className="p-6 bg-gradient-accent">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <span>💡</span> Lembre-se
        </h4>
        <ul className="text-sm space-y-2">
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Aumente a carga progressivamente</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Mantenha a técnica correta sempre</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Hidrate-se bem durante o treino</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Descanse adequadamente entre treinos</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default WorkoutTab;
