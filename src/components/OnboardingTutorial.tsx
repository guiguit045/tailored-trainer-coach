import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dumbbell, 
  Utensils, 
  Calendar, 
  MessageSquare, 
  Target,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao FitPro! 🎉",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades do app para você começar sua jornada fitness!",
    icon: <Target className="w-12 h-12 text-primary" />,
  },
  {
    title: "Treinos Personalizados",
    description: "Acesse seus treinos personalizados na aba Treino. Cada dia da semana tem exercícios específicos baseados no seu objetivo.",
    icon: <Dumbbell className="w-12 h-12 text-primary" />,
    highlight: "Clique em 'Iniciar Treino' para começar"
  },
  {
    title: "Acompanhe sua Dieta",
    description: "Na aba Dieta, fotografe suas refeições para análise automática de calorias e receba sugestões personalizadas de refeições.",
    icon: <Utensils className="w-12 h-12 text-primary" />,
    highlight: "Registre sua primeira refeição hoje!"
  },
  {
    title: "Histórico e Evolução",
    description: "Acesse seu histórico de treinos e acompanhe sua evolução ao longo do tempo com gráficos detalhados.",
    icon: <Calendar className="w-12 h-12 text-primary" />,
    highlight: "Seu progresso é salvo automaticamente"
  },
  {
    title: "TrainerIA - Seu Assistente",
    description: "Clique no botão flutuante laranja para conversar com o TrainerIA. Ele pode tirar dúvidas, sugerir exercícios e dar dicas personalizadas!",
    icon: <MessageSquare className="w-12 h-12 text-primary" />,
    highlight: "Experimente perguntar sobre técnicas de exercícios"
  },
];

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    onComplete();
  };

  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4 mr-2" />
        Pular Tutorial
      </Button>

      <Card className="w-full max-w-lg p-8 shadow-elegant">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center">
                {step.icon}
              </div>
            </motion.div>

            {/* Content */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {step.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              {step.highlight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
                >
                  <p className="text-sm font-medium text-primary">
                    💡 {step.highlight}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-2">
              {onboardingSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-border"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={isFirstStep ? "w-full" : "flex-1"}
                size="lg"
              >
                {isLastStep ? "Começar" : "Próximo"}
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Step Counter */}
            <p className="text-center text-sm text-muted-foreground">
              Passo {currentStep + 1} de {onboardingSteps.length}
            </p>
          </motion.div>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default OnboardingTutorial;
