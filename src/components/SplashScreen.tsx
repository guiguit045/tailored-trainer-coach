import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import SkeletonCard from "@/components/SkeletonCard";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-hero flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
    >
      {/* Logo Container */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          duration: 0.8,
        }}
        className="relative"
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "160px", height: "160px", margin: "-20px" }}
        />

        {/* Logo Circle */}
        <motion.div
          className="w-32 h-32 bg-background rounded-3xl flex items-center justify-center shadow-elegant relative z-10"
          initial={{ boxShadow: "0 0 0 rgba(255, 107, 53, 0)" }}
          animate={{
            boxShadow: [
              "0 0 0 rgba(255, 107, 53, 0)",
              "0 0 40px rgba(255, 107, 53, 0.4)",
              "0 0 0 rgba(255, 107, 53, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Dumbbell className="w-16 h-16 text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* App Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">FitPro</h1>
        <p className="text-muted-foreground text-sm">Seu Personal Trainer Digital</p>
      </motion.div>

      {/* Loading Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        {/* Loading Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-primary rounded-full"
              animate={{
                y: [0, -12, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Carregando...
        </motion.p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "80%" }}
        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
        className="absolute bottom-20 max-w-xs h-1 bg-border rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
