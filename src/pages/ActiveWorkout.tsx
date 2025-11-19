import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, Check, Timer as TimerIcon, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Workout } from "./Quiz";

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const workoutIndex = parseInt(searchParams.get("workout") || "0");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [workoutStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
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
      // Expand first exercise by default
      setExpandedExercises({ 0: true });
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
          audioRef.current?.play().catch(() => {
            // Silently fail if audio doesn't play
          });
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
  const progressPercentage = (completedSetsCount / totalSets) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground py-4 px-4 shadow-medium sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard?tab=workout")}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{workout.day.split(" - ")[0]}</h1>
              <p className="text-sm opacity-90">{formatTime(elapsedTime)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedSetsCount} / {totalSets} séries</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-20 mx-4"
          >
            <Card className="max-w-4xl mx-auto bg-accent text-accent-foreground p-4 shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TimerIcon className="h-6 w-6 animate-pulse" />
                  <div>
                    <p className="font-bold">Descansando</p>
                    <p className="text-sm opacity-90">Próxima série em breve</p>
                  </div>
                </div>
                <div className="text-4xl font-bold">{formatTime(restTimeLeft)}</div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises List */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {workout.exercises.map((exercise, exerciseIdx) => {
          const setsCount = parseInt(exercise.sets);
          const completedCount = completedSets[exerciseIdx]?.filter(Boolean).length || 0;
          const isExpanded = expandedExercises[exerciseIdx];

          return (
            <Card key={exerciseIdx} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExerciseExpanded(exerciseIdx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{exercise.name}</h3>
                      {completedCount === setsCount && (
                        <Badge className="bg-green-500 text-white">
                          <Check className="h-3 w-3 mr-1" />
                          Completo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{setsCount} séries • {exercise.reps} reps • {exercise.rest} descanso
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
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
                    <div className="px-4 pb-4 space-y-3 border-t">
                      {/* Sets Checklist */}
                      <div className="space-y-2 pt-4">
                        {Array.from({ length: setsCount }).map((_, setIdx) => {
                          const isCompleted = completedSets[exerciseIdx]?.[setIdx];
                          return (
                            <button
                              key={setIdx}
                              onClick={() => toggleSetComplete(exerciseIdx, setIdx)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isCompleted
                                  ? "bg-primary/10 border-2 border-primary"
                                  : "bg-muted/30 border-2 border-transparent hover:border-muted"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {isCompleted && <Check className="h-4 w-4 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 text-left">
                                <span className="font-semibold">Série {setIdx + 1}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">{exercise.reps} Rep.</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Exercise Details */}
                      <div className="space-y-2 pt-2">
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                          <p className="text-xs font-semibold text-primary mb-1">Dica</p>
                          <p className="text-sm">{exercise.tip}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}

        {/* Finish Workout Button */}
        <Button
          onClick={finishWorkout}
          className="w-full h-14 text-lg font-bold"
          disabled={completedSetsCount < totalSets}
        >
          {completedSetsCount < totalSets
            ? `Complete ${totalSets - completedSetsCount} séries restantes`
            : "Finalizar Treino"}
        </Button>
      </main>
    </div>
  );
};

export default ActiveWorkout;
