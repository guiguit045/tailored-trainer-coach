import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, Settings, LogOut, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { QuizData } from "./Quiz";
import WorkoutTab from "@/components/dashboard/WorkoutTab";
import DietTab from "@/components/dashboard/DietTab";
import { getQuizResponses, getActiveWorkoutPlan } from "@/lib/workoutStorage";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const defaultTab = searchParams.get("tab") || "workout";

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch from database first
        const dbQuizData = await getQuizResponses();
        const dbWorkoutPlan = await getActiveWorkoutPlan();

        if (dbQuizData) {
          // Convert database format to QuizData format
          const quizDataConverted: QuizData = {
            age: dbQuizData.age?.toString() || "",
            height: dbQuizData.height?.toString() || "",
            currentWeight: dbQuizData.weight?.toString() || "",
            desiredWeight: "",
            mainGoal: dbQuizData.goal || "",
            trainingTime: "",
            hasTrainedBefore: dbQuizData.experienceLevel !== "beginner" ? "yes" : "no",
            experienceTime: dbQuizData.experienceLevel || "",
            knownExercises: [],
            hasFear: "",
            hasLimitations: dbQuizData.physicalLimitations ? "yes" : "no",
            hasPain: "",
            painDetails: dbQuizData.physicalLimitations || "",
            trainingDays: dbQuizData.trainingFrequency?.toString() || "",
            preferredTime: dbQuizData.preferredTime || "",
            sleepQuality: "",
            stressLevel: "",
            equipmentAvailable: dbQuizData.gymAccess ? "gym" : "home",
            workoutLength: dbQuizData.workoutDuration || "",
            workoutSplit: "",
            desiredIntensity: "",
            eatsMeat: "",
            allergies: dbQuizData.dietaryRestrictions ? "yes" : "no",
            allergiesList: dbQuizData.dietaryRestrictions || "",
            dislikedFoods: "",
            lovedFoods: "",
            canCook: "",
            mealsPerDay: "",
            jobType: "",
            activityLevel: "",
            alcoholConsumption: "",
            sugarConsumption: "",
            healthIssues: "",
            healthIssuesList: "",
            highBloodPressure: "",
            diabetes: "",
            highCholesterol: "",
            familyHistory: "",
            deadline: "",
            motivation: "",
            pastObstacles: "",
            currentMotivation: "",
            commitmentLevel: "",
          };

          // Convert workout plan if available
          if (dbWorkoutPlan && dbWorkoutPlan.days) {
            quizDataConverted.aiWorkoutPlan = dbWorkoutPlan.days.map((day: any) => ({
              day: day.day,
              description: day.focus,
              exercises: day.exercises.map((ex: any) => ({
                name: ex.name,
                sets: ex.sets?.toString() || "3",
                reps: ex.reps || "10-12",
                rest: ex.rest || "60s",
                tip: ex.tips || "",
                why: "",
                variations: [],
              })),
            }));
          }

          setQuizData(quizDataConverted);
          // Also update localStorage for compatibility
          localStorage.setItem("quizData", JSON.stringify(quizDataConverted));
        } else {
          // Fallback to localStorage
          const storedData = localStorage.getItem("quizData");
          if (!storedData) {
            navigate("/quiz");
            return;
          }
          setQuizData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to localStorage on error
        const storedData = localStorage.getItem("quizData");
        if (!storedData) {
          navigate("/quiz");
          return;
        }
        setQuizData(JSON.parse(storedData));
      }
    };

    loadData();

    // Fetch user profile
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setUserName(profile.name);
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (!quizData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="bg-gradient-hero text-primary-foreground py-6 px-4 shadow-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FitPro</h1>
            <p className="text-sm opacity-90 mt-1">Seu Personal Trainer Digital</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
              onClick={() => navigate("/workout/history")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
              onClick={() => navigate("/quiz")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Card className="p-6 mb-6 bg-gradient-card shadow-medium">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Olá{userName ? `, ${userName}` : ""}! 👋
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

        <Tabs defaultValue={defaultTab} className="space-y-6">
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

          <TabsContent value="workout" className="m-0">
            <motion.div
              key="workout"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <WorkoutTab quizData={quizData} />
            </motion.div>
          </TabsContent>

          <TabsContent value="diet" className="m-0">
            <motion.div
              key="diet"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DietTab quizData={quizData} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;