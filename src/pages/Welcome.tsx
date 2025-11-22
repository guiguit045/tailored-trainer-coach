import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, TrendingUp, ChevronRight, Bot, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const onboardingSlides = [
  {
    icon: Dumbbell,
    title: "Treinos Personalizados",
    description: "Planos de treino adaptados aos seus objetivos e rotina",
    color: "bg-primary",
  },
  {
    icon: Apple,
    title: "Dieta Sob Medida",
    description: "Alimentação personalizada respeitando suas preferências e restrições",
    color: "bg-secondary",
  },
  {
    icon: Camera,
    title: "Análise de Refeições",
    description: "Tire uma foto da sua refeição e receba informações detalhadas sobre calorias e nutrientes",
    color: "bg-accent",
  },
  {
    icon: Bot,
    title: "TrainerIA Inteligente",
    description: "Seu personal trainer disponível 24/7 para tirar dúvidas sobre treinos, nutrição e saúde",
    color: "bg-primary",
  },
  {
    icon: TrendingUp,
    title: "Evolução Contínua",
    description: "Acompanhe seu progresso e adapte seu plano automaticamente",
    color: "bg-accent-green",
  },
];

const Welcome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const isLastSlide = currentSlide === onboardingSlides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      navigate("/auth");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const currentContent = onboardingSlides[currentSlide];
  const Icon = currentContent.icon;

  const slideVariants = {
    enter: {
      x: 300,
      opacity: 0,
      scale: 0.8,
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: {
      x: -300,
      opacity: 0,
      scale: 0.8,
    },
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
    },
    exit: { 
      scale: 0, 
      rotate: 180,
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col items-center justify-between p-6 py-12">
      {/* Logo/Brand */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          FitPro
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Seu Personal Trainer Digital
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 }
            }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Icon Circle with Animation */}
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className={`w-32 h-32 rounded-full ${currentContent.color} flex items-center justify-center mb-8 shadow-elegant`}
            >
              <Icon className="w-16 h-16 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title with Animation */}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl font-bold text-foreground mb-6"
            >
              {currentContent.title}
            </motion.h2>

            {/* Description with Animation */}
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg text-muted-foreground leading-relaxed px-4"
            >
              {currentContent.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <motion.div 
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2">
          {onboardingSlides.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleNext}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant"
            size="lg"
          >
            {isLastSlide ? "Começar" : "Próximo"}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        {/* Skip Button */}
        {!isLastSlide && (
          <motion.button
            onClick={() => navigate("/auth")}
            className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Pular introdução
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default Welcome;
