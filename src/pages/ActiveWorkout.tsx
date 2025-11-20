import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Workout } from "./Quiz";
import { getActiveWorkoutPlan, startWorkoutSession, completeWorkoutSession, saveExerciseLog, updateUserStreak } from "@/lib/workoutStorage";


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
  const [setData, setSetData] = useState<Record<number, Array<{ weight: string; reps: string }>>>({});
  const [setsCount, setSetsCount] = useState<Record<number, number>>({});
  const [originalSetsCount, setOriginalSetsCount] = useState<Record<number, number>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workoutPlanId, setWorkoutPlanId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ exerciseIdx: number; setIdx: number } | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initWorkout = async () => {
      const storedData = localStorage.getItem("quizData");
      if (!storedData) {
        navigate("/quiz");
        return;
      }

      const quizData = JSON.parse(storedData);
      const workouts = quizData.aiWorkoutPlan || [];
      
      if (workouts[workoutIndex]) {
        const currentWorkout = workouts[workoutIndex];
        setWorkout(currentWorkout);
        
        // Start workout session in database
        try {
          const activePlan = await getActiveWorkoutPlan();
          if (activePlan?.id) {
            setWorkoutPlanId(activePlan.id);
            const session = await startWorkoutSession(activePlan.id, currentWorkout.day);
            setSessionId(session.id);
          }
        } catch (error) {
          console.error("Error starting workout session:", error);
        }
        
        // Initialize completed sets and data for all exercises
        const initialSets: Record<number, boolean[]> = {};
        const initialData: Record<number, Array<{ weight: string; reps: string }>> = {};
        const initialCounts: Record<number, number> = {};
        
        currentWorkout.exercises.forEach((exercise: any, idx: number) => {
          const count = parseInt(exercise.sets) || 3;
          initialSets[idx] = Array(count).fill(false);
          initialCounts[idx] = count;
          
          // Parse reps range (e.g., "8-10" or "12")
          const repsRange = exercise.reps.split("-");
          const defaultReps = repsRange[0];
          
          initialData[idx] = Array(count).fill({ weight: "", reps: defaultReps });
        });
        
        setCompletedSets(initialSets);
        setSetData(initialData);
        setSetsCount(initialCounts);
        setOriginalSetsCount(initialCounts);
      } else {
        navigate("/dashboard?tab=workout");
      }
    };

    initWorkout();

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

  const updateSetData = (exerciseIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setSetData((prev) => {
      const newData = { ...prev };
      newData[exerciseIdx] = [...(prev[exerciseIdx] || [])];
      newData[exerciseIdx][setIdx] = {
        ...newData[exerciseIdx][setIdx],
        [field]: value,
      };
      return newData;
    });
  };

  const addSet = (exerciseIdx: number) => {
    setSetsCount((prev) => ({
      ...prev,
      [exerciseIdx]: (prev[exerciseIdx] || 0) + 1,
    }));
    
    setCompletedSets((prev) => {
      const newSets = { ...prev };
      newSets[exerciseIdx] = [...(prev[exerciseIdx] || []), false];
      return newSets;
    });
    
    setSetData((prev) => {
      const newData = { ...prev };
      const lastSet = prev[exerciseIdx]?.[prev[exerciseIdx].length - 1] || { weight: "", reps: "" };
      newData[exerciseIdx] = [...(prev[exerciseIdx] || []), { ...lastSet }];
      return newData;
    });
    
    toast({
      title: "Série adicionada",
      description: "Nova série adicionada ao exercício",
    });
  };

  const confirmRemoveSet = () => {
    if (!deleteConfirmation) return;
    
    const { exerciseIdx, setIdx } = deleteConfirmation;

    setSetsCount((prev) => ({
      ...prev,
      [exerciseIdx]: Math.max(1, (prev[exerciseIdx] || 0) - 1),
    }));
    
    setCompletedSets((prev) => {
      const newSets = { ...prev };
      newSets[exerciseIdx] = newSets[exerciseIdx].filter((_, idx) => idx !== setIdx);
      return newSets;
    });
    
    setSetData((prev) => {
      const newData = { ...prev };
      newData[exerciseIdx] = newData[exerciseIdx].filter((_, idx) => idx !== setIdx);
      return newData;
    });
    
    toast({
      title: "Série removida",
      description: "Série excluída do exercício",
    });
    
    setDeleteConfirmation(null);
  };

  const finishWorkout = async () => {
    // Save exercise logs to database
    if (sessionId && workout) {
      try {
        for (let idx = 0; idx < workout.exercises.length; idx++) {
          const exercise = workout.exercises[idx];
          const exerciseSets = setData[idx] || [];
          const completed = completedSets[idx] || [];
          
          await saveExerciseLog(
            sessionId,
            exercise.name,
            exercise,
            exerciseSets.map((set, setIdx) => ({
              ...set,
              completed: completed[setIdx] || false,
            }))
          );
        }
        
        // Mark session as completed
        await completeWorkoutSession(sessionId);
        
        // Update streak
        await updateUserStreak();
        
        toast({
          title: "Treino concluído! 🎉",
          description: "Continue assim para manter sua sequência!",
        });
      } catch (error) {
        console.error("Error saving workout:", error);
        toast({
          title: "Treino concluído! 🎉",
          description: "Parabéns por completar seu treino!",
          variant: "default",
        });
      }
    } else {
      toast({
        title: "Treino concluído! 🎉",
        description: "Parabéns por completar seu treino!",
      });
    }
    
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
          const currentSetsCount = setsCount[exerciseIdx] || parseInt(exercise.sets);
          const completedCount = completedSets[exerciseIdx]?.filter(Boolean).length || 0;
          const isExpanded = expandedExercises[exerciseIdx];

          return (
            <Card key={exerciseIdx} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExerciseExpanded(exerciseIdx)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{currentSetsCount} feito(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

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
                      {Array.from({ length: currentSetsCount }).map((_, setIdx) => {
                        const isCompleted = completedSets[exerciseIdx]?.[setIdx];
                        const setInfo = setData[exerciseIdx]?.[setIdx] || { weight: "", reps: "" };
                        
                        return (
                          <div
                            key={setIdx}
                            className="bg-muted/30 rounded-lg p-3 flex items-center gap-2"
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
                            <span className="font-semibold text-lg w-6">{setIdx + 1}</span>
                            
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input
                                type="number"
                                value={setInfo.weight}
                                onChange={(e) => updateSetData(exerciseIdx, setIdx, 'weight', e.target.value)}
                                placeholder="12"
                                className="h-9 text-center bg-background border-border text-sm"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">KG</span>
                              
                              <Input
                                type="number"
                                value={setInfo.reps}
                                onChange={(e) => updateSetData(exerciseIdx, setIdx, 'reps', e.target.value)}
                                placeholder="8"
                                className="h-9 text-center bg-background border-border text-sm"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Rep.</span>
                            </div>

                            {/* Only show delete button for dynamically added sets */}
                            {setIdx >= (originalSetsCount[exerciseIdx] || 0) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                onClick={() => setDeleteConfirmation({ exerciseIdx, setIdx })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Set Button */}
                      <Button
                        variant="outline"
                        onClick={() => addSet(exerciseIdx)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar uma série
                      </Button>

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


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir série?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta série? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveSet} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActiveWorkout;
