import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Apple, TrendingUp, Clock, Target, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="mb-6">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
              Seu Personal Trainer Digital 💪
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            FitPro
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Treinos e Dietas Personalizados para Iniciantes
          </p>
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Responda um quiz completo e receba um plano totalmente personalizado 
            baseado nos seus objetivos, rotina e preferências
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-hero text-lg px-8 py-6 shadow-medium hover:scale-105 transition-transform"
            onClick={() => navigate("/quiz")}
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Por que escolher o FitPro?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">100% Personalizado</h3>
            <p className="text-sm text-muted-foreground">
              Quiz detalhado analisa seu perfil completo: objetivos, limitações, 
              preferências alimentares e rotina
            </p>
          </Card>

          <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <Dumbbell className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Treinos Inteligentes</h3>
            <p className="text-sm text-muted-foreground">
              Exercícios adaptados ao seu nível, com explicações detalhadas, 
              dicas de execução e variações
            </p>
          </Card>

          <Card className="p-6 hover:shadow-medium transition-all bg-gradient-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Apple className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-bold text-lg mb-2">Dieta Sob Medida</h3>
            <p className="text-sm text-muted-foreground">
              Plano alimentar respeitando suas restrições, alergias e 
              alimentos favoritos
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            O que você vai receber
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Progressão Automática</h3>
                <p className="text-sm text-muted-foreground">
                  Seu treino se adapta conforme você evolui, garantindo resultados contínuos
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Otimização de Tempo</h3>
                <p className="text-sm text-muted-foreground">
                  Treinos eficientes que respeitam seu tempo disponível e rotina
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Explicações Detalhadas</h3>
                <p className="text-sm text-muted-foreground">
                  Entenda o porquê de cada exercício e alimento no seu plano
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Para Todos os Níveis</h3>
                <p className="text-sm text-muted-foreground">
                  De iniciantes absolutos a intermediários, todos têm um plano adequado
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Card className="p-10 bg-gradient-hero text-primary-foreground shadow-medium">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar seu corpo?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Leva menos de 5 minutos para criar seu plano personalizado
          </p>
          <Button 
            size="lg"
            variant="outline"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
            onClick={() => navigate("/quiz")}
          >
            Fazer Quiz Agora
          </Button>
        </Card>
      </section>
    </div>
  );
};

// Import Badge component
import { Badge } from "@/components/ui/badge";

export default Index;