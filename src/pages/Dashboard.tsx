import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, Settings, LogOut, BarChart3, User, Target, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { QuizData } from "./Quiz";
import WorkoutTab from "@/components/dashboard/WorkoutTab";
import DietTab from "@/components/dashboard/DietTab";
import StreakIndicator from "@/components/workout/StreakIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getQuizResponses, getActiveWorkoutPlan } from "@/lib/workoutStorage";

const motivationalQuotes = [
  "A única pessoa que você deve superar é quem você era ontem.",
  "Seus limites são apenas ilusões criadas pela sua mente.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Não conte os dias, faça os dias contarem.",
  "Sua saúde é um investimento, não uma despesa.",
  "O progresso, não a perfeição, é o que realmente importa.",
  "Acredite em si mesmo e tudo será possível.",
  "O corpo alcança o que a mente acredita.",
  "Cada treino é um passo mais perto do seu objetivo.",
  "A disciplina é a ponte entre objetivos e conquistas.",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [dailyQuote, setDailyQuote] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [showNewRecordCelebration, setShowNewRecordCelebration] = useState(false);
  const defaultTab = searchParams.get("tab") || "workout";

  // Get daily motivational quote
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setDailyQuote(motivationalQuotes[quoteIndex]);
  }, []);

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
          
          // Calculate target weight based on goal
          const currentWeight = parseFloat(dbQuizData.weight?.toString() || "0");
          let calculatedTarget = currentWeight;
          
          if (dbQuizData.goal === "lose") {
            // For weight loss: reduce 5-10% of current weight
            calculatedTarget = Math.round(currentWeight * 0.9);
          } else if (dbQuizData.goal === "gain") {
            // For muscle gain: increase 5-8% of current weight
            calculatedTarget = Math.round(currentWeight * 1.07);
          }
          
          setTargetWeight(calculatedTarget);
          
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

  // Check if coming from workout completion with new record
  useEffect(() => {
    const newRecord = searchParams.get("newRecord");
    if (newRecord === "true") {
      setShowNewRecordCelebration(true);
      // Clean up URL
      navigate("/dashboard?tab=workout", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (!quizData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="bg-gradient-hero text-primary-foreground py-4 md:py-6 px-3 md:px-4 shadow-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-3xl font-bold">FitPro</h1>
            <p className="text-xs md:text-sm opacity-90 mt-1 hidden sm:block">Seu Personal Trainer Digital</p>
          </div>
          <div className="flex gap-1 md:gap-2 items-center">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 px-2 md:px-3"
              onClick={() => navigate("/workout/history")}
            >
              <BarChart3 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Histórico</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 px-2 md:px-3"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Meu Perfil</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 px-2 md:px-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Card className="p-4 md:p-6 mb-6 bg-gradient-card shadow-medium">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-semibold mb-2 flex items-center gap-2">
                👋 Olá{userName ? `, ${userName}` : ""}!
              </h2>
              <p className="text-sm md:text-base text-muted-foreground italic">
                "{dailyQuote}"
              </p>
            </div>
            
            <div className="flex gap-4 md:gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Peso Atual</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {quizData.currentWeight}kg
                </p>
              </div>
              
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-secondary" />
                  <p className="text-xs text-muted-foreground">Meta</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-secondary">
                  {targetWeight}kg
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <StreakIndicator triggerCelebrationOnMount={showNewRecordCelebration} />
        </div>

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