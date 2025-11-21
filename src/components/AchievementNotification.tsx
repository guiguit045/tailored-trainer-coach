import { motion, AnimatePresence } from "framer-motion";
import { Achievement } from "@/lib/achievementService";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <div className="bg-gradient-to-r from-primary via-accent to-secondary p-6 rounded-2xl shadow-2xl border-2 border-primary/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-3 text-center"
            >
              {achievement.icon}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                Conquista Desbloqueada! 🎉
              </h3>
              <p className="text-xl font-semibold text-primary-foreground/90 mb-1">
                {achievement.title}
              </p>
              <p className="text-sm text-primary-foreground/70">
                {achievement.description}
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="mt-4 w-full bg-background/20 hover:bg-background/30 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Fechar
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
