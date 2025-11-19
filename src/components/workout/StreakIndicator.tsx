import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { calculateStreak } from "@/lib/workoutStorage";
import { supabase } from "@/integrations/supabase/client";

interface StreakIndicatorProps {
  onNewRecord?: () => void;
}

const StreakIndicator = ({ onNewRecord }: StreakIndicatorProps) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak, max_streak")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setCurrentStreak(profile.current_streak || 0);
        setMaxStreak(profile.max_streak || 0);
      } else {
        // Calculate if not in profile yet
        const streakData = await calculateStreak();
        setCurrentStreak(streakData.currentStreak);
        setMaxStreak(streakData.maxStreak);
      }
    } catch (error) {
      console.error("Error loading streak:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    
    // Launch confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setShowCelebration(false);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    if (onNewRecord) {
      onNewRecord();
    }
  };

  // Check for new record when component mounts or streak changes
  useEffect(() => {
    if (currentStreak > 0 && currentStreak === maxStreak && currentStreak > 1) {
      // Small delay to ensure animation plays after render
      setTimeout(() => {
        triggerCelebration();
      }, 500);
    }
  }, [currentStreak, maxStreak]);

  if (loading) return null;

  const isOnStreak = currentStreak > 0;
  const isAtMaxStreak = currentStreak === maxStreak && currentStreak > 0;

  return (
    <>
      <Card className="p-6 bg-gradient-card shadow-medium relative overflow-hidden">
        {/* Background flame effect */}
        {isOnStreak && (
          <motion.div
            className="absolute inset-0 opacity-5"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, hsl(var(--primary)) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center"
                animate={isOnStreak ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className={`h-7 w-7 ${isOnStreak ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold">Sequência de Treinos</h3>
                <p className="text-sm text-muted-foreground">
                  {isOnStreak ? "Continue assim!" : "Comece uma sequência hoje"}
                </p>
              </div>
            </div>
            {isAtMaxStreak && currentStreak >= 3 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 gap-1">
                  <Trophy className="h-3 w-3" />
                  Recorde!
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Streak */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-primary/10 rounded-lg p-4 border-2 border-primary/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Atual</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStreak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-4xl font-bold text-primary"
                >
                  {currentStreak}
                </motion.div>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground mt-1">
                {currentStreak === 1 ? "dia" : "dias"} consecutivos
              </p>
            </motion.div>

            {/* Max Streak */}
            <div className="bg-secondary/10 rounded-lg p-4 border-2 border-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold text-muted-foreground">Recorde</span>
              </div>
              <div className="text-4xl font-bold text-secondary">
                {maxStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                melhor sequência
              </p>
            </div>
          </div>

          {/* Motivational message */}
          {currentStreak === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-muted/50 rounded-lg"
            >
              <p className="text-sm text-center">
                💪 Comece um treino hoje e inicie sua sequência!
              </p>
            </motion.div>
          )}

          {currentStreak > 0 && currentStreak < 7 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10"
            >
              <p className="text-sm text-center">
                🔥 Faltam {7 - currentStreak} {7 - currentStreak === 1 ? "dia" : "dias"} para completar uma semana!
              </p>
            </motion.div>
          )}

          {currentStreak >= 7 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
            >
              <p className="text-sm text-center font-semibold text-green-700">
                🎉 Parabéns! Você completou uma semana inteira!
              </p>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8" />
                <div>
                  <p className="text-2xl font-bold">Novo Recorde!</p>
                  <p className="text-sm opacity-90">{currentStreak} dias consecutivos 🔥</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StreakIndicator;
