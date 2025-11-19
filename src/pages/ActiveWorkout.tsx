import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Workout } from "./Quiz";

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const workoutIndex = parseInt(searchParams.get("workout") || "0");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [workoutStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("quizData");
    if (!storedData) {
      navigate("/quiz");
      return;
    }

    const quizData = JSON.parse(storedData);
    const workouts = quizData.aiWorkoutPlan || [];
    
    if (workouts[workoutIndex]) {
      setWorkout(workouts[workoutIndex]);
      // Initialize completed sets for all exercises
      const initialSets: Record<number, boolean[]> = {};
      workouts[workoutIndex].exercises.forEach((exercise: any, idx: number) => {
        const setsCount = parseInt(exercise.sets) || 3;
        initialSets[idx] = Array(setsCount).fill(false);
      });
      setCompletedSets(initialSets);
    } else {
      navigate("/dashboard?tab=workout");
    }

    // Create audio element for timer notification
    audioRef.current = new Audio();
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBAKQ5zd8bllHAU2j9Xxx3wsBSSAzfLaizsIGWi+7+WdTAwOUKjj8LdjHAY4kdjyzXssBCR3x/DdkUAKFF+06+qnVRQKRZ/g8r9sIQUxh9Lz04MzBh5uwO/jmUgQCkOd3fG5ZRwFNo/T8ch8LAQkgM7y2os7CBlovu/mnUsMDlCo4/C3YxwGOJHY8s17LAYkd8fw3ZFACBR";

    // Start elapsed time timer
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [navigate, workoutIndex, workoutStartTime]);

  const startRestTimer = (restSeconds: number) => {
    setIsResting(true);
    setRestTimeLeft(restSeconds);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsResting(false);
          // Play notification sound
          audioRef.current?.play().catch(() => {});
          toast({
            title: "Descanso terminado!",
            description: "Hora de fazer a próxima série",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    setCompletedSets((prev) => {
      const newSets = { ...prev };
      newSets[exerciseIdx] = [...(prev[exerciseIdx] || [])];
      newSets[exerciseIdx][setIdx] = !newSets[exerciseIdx][setIdx];
      
      // If set was just completed, start rest timer
      if (newSets[exerciseIdx][setIdx] && workout) {
        const exercise = workout.exercises[exerciseIdx];
        const restTime = parseInt(exercise.rest.replace(/[^0-9]/g, "")) || 60;
        startRestTimer(restTime);
      }
      
      return newSets;
    });
  };

  const toggleExerciseExpanded = (exerciseIdx: number) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseIdx]: !prev[exerciseIdx],
    }));
  };

  const finishWorkout = () => {
    toast({
      title: "Treino concluído! 🎉",
      description: "Parabéns por completar seu treino!",
    });
    navigate("/dashboard?tab=workout");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!workout) return null;

  const totalSets = workout.exercises.reduce((acc, ex) => acc + parseInt(ex.sets), 0);
  const completedSetsCount = Object.values(completedSets).reduce(
    (acc, sets) => acc + sets.filter(Boolean).length,
    0
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard?tab=workout")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{workout.day.split(" - ")[0]}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{formatTime(elapsedTime)}</span>
              {isResting && (
                <>
                  <span>•</span>
                  <span className="text-accent font-medium">Descanso: {formatTime(restTimeLeft)}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Exercises List */}
      <main className="px-4 py-4 space-y-3">
        {workout.exercises.map((exercise, exerciseIdx) => {
          const setsCount = parseInt(exercise.sets);
          const completedCount = completedSets[exerciseIdx]?.filter(Boolean).length || 0;
          const isExpanded = expandedExercises[exerciseIdx];

          return (
            <Card key={exerciseIdx} className="overflow-hidden">
              <button
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => toggleExerciseExpanded(exerciseIdx)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{setsCount} feito(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "Dica",
                          description: exercise.tip,
                        });
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 space-y-2 border-t pt-3">
                      {/* Sets List */}
                      {Array.from({ length: setsCount }).map((_, setIdx) => {
                        const isCompleted = completedSets[exerciseIdx]?.[setIdx];
                        return (
                          <div
                            key={setIdx}
                            className="bg-muted/30 rounded-lg p-3 flex items-center gap-3"
                          >
                            <button
                              onClick={() => toggleSetComplete(exerciseIdx, setIdx)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                isCompleted
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {isCompleted && (
                                <span className="text-primary-foreground text-lg">✓</span>
                              )}
                            </button>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="font-semibold text-lg min-w-[20px]">{setIdx + 1}</span>
                              <div className="flex-1 flex items-center gap-2">
                                <div className="bg-muted rounded px-3 py-1.5 text-center min-w-[60px]">
                                  <span className="text-sm font-medium">{exercise.reps.split("-")[0]}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">KG</span>
                                <div className="bg-muted rounded px-3 py-1.5 text-center min-w-[60px]">
                                  <span className="text-sm font-medium">{exercise.reps.split("-")[1] || exercise.reps.split("-")[0]}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Rep.</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Tips */}
                      <div className="mt-3 bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <p className="text-xs font-semibold text-primary mb-1">💡 Dica</p>
                        <p className="text-xs text-muted-foreground">{exercise.tip}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
        <Button
          onClick={finishWorkout}
          className="w-full h-14 text-base font-bold"
          size="lg"
        >
          REGISTRAR A PRÓXIMA SÉRIE
        </Button>
      </div>
    </div>
  );
};

export default ActiveWorkout;
