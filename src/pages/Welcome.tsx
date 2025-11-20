import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, TrendingUp, ChevronRight } from "lucide-react";

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
      navigate("/quiz");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const currentContent = onboardingSlides[currentSlide];
  const Icon = currentContent.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col items-center justify-between p-6 py-12">
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          FitPro
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Seu Personal Trainer Digital
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full overflow-hidden">
        <div
          key={currentSlide}
          className="flex flex-col items-center text-center"
        >
          {/* Icon Circle with Parallax Float */}
          <div
            className={`w-32 h-32 rounded-full ${currentContent.color} flex items-center justify-center mb-8 shadow-elegant animate-parallax-float`}
            style={{
              animationDelay: "0ms"
            }}
          >
            <Icon className="w-16 h-16 text-white" strokeWidth={2.5} />
          </div>

          {/* Title with Parallax Slide */}
          <h2 
            className="text-4xl font-bold text-foreground mb-6 animate-parallax-slide"
            style={{
              animationDelay: "100ms"
            }}
          >
            {currentContent.title}
          </h2>

          {/* Description with Parallax Rise */}
          <p 
            className="text-lg text-muted-foreground leading-relaxed px-4 animate-parallax-rise"
            style={{
              animationDelay: "200ms"
            }}
          >
            {currentContent.description}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="w-full max-w-md space-y-6">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2">
          {onboardingSlides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant"
          size="lg"
        >
          {isLastSlide ? "Começar" : "Próximo"}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>

        {/* Skip Button */}
        {!isLastSlide && (
          <button
            onClick={() => navigate("/quiz")}
            className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Pular introdução
          </button>
        )}
      </div>
    </div>
  );
};

export default Welcome;
