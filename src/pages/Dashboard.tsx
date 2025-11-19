import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, Settings } from "lucide-react";
import type { QuizData } from "./Quiz";
import WorkoutTab from "@/components/dashboard/WorkoutTab";
import DietTab from "@/components/dashboard/DietTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("quizData");
    if (!storedData) {
      navigate("/quiz");
      return;
    }
    setQuizData(JSON.parse(storedData));
  }, [navigate]);

  if (!quizData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="bg-gradient-hero text-primary-foreground py-6 px-4 shadow-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FitPro</h1>
            <p className="text-sm opacity-90 mt-1">Seu Personal Trainer Digital</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
            onClick={() => navigate("/quiz")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Card className="p-6 mb-6 bg-gradient-card shadow-medium">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Olá! 👋
              </h2>
              <p className="text-muted-foreground">
                Seu objetivo: <span className="font-semibold text-foreground">
                  {quizData.mainGoal === "weight-loss" && "Emagrecimento"}
                  {quizData.mainGoal === "muscle-gain" && "Ganho de Massa Muscular"}
                  {quizData.mainGoal === "conditioning" && "Condicionamento Físico"}
                  {quizData.mainGoal === "health" && "Saúde Geral"}
                  {quizData.mainGoal === "endurance" && "Resistência"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Peso Atual</p>
              <p className="text-3xl font-bold text-primary">{quizData.currentWeight}kg</p>
              <p className="text-xs text-muted-foreground">Meta: {quizData.desiredWeight}kg</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="workout" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="workout" className="py-3 data-[state=active]:bg-gradient-hero data-[state=active]:text-primary-foreground">
              <Dumbbell className="mr-2 h-5 w-5" />
              Treinos
            </TabsTrigger>
            <TabsTrigger value="diet" className="py-3 data-[state=active]:bg-gradient-hero data-[state=active]:text-primary-foreground">
              <Apple className="mr-2 h-5 w-5" />
              Dieta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workout">
            <WorkoutTab quizData={quizData} />
          </TabsContent>

          <TabsContent value="diet">
            <DietTab quizData={quizData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;