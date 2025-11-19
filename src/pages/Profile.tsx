import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  Target, 
  Dumbbell, 
  Clock, 
  Heart,
  Apple,
  AlertCircle,
  CheckCircle2,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { getQuizResponses } from "@/lib/workoutStorage";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  name: string;
  age?: string;
  height?: string;
  currentWeight?: string;
  desiredWeight?: string;
  mainGoal?: string;
  experienceTime?: string;
  trainingDays?: string;
  preferredTime?: string;
  equipmentAvailable?: string;
  workoutLength?: string;
  lovedFoods?: string;
  dislikedFoods?: string;
  allergiesList?: string;
  painDetails?: string;
  healthIssuesList?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get user name from profiles table
      const { data: { user } } = await supabase.auth.getUser();
      let userName = "";
      
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();
        
        if (profileData) {
          userName = profileData.name;
        }
      }

      // Get quiz data
      const quizData = await getQuizResponses();
      
      if (quizData) {
        setProfile({
          name: userName || quizData.name,
          age: quizData.age?.toString(),
          height: quizData.height?.toString(),
          currentWeight: quizData.weight?.toString(),
          desiredWeight: "", // Not in new schema
          mainGoal: quizData.goal,
          experienceTime: quizData.experienceLevel,
          trainingDays: quizData.trainingFrequency?.toString(),
          preferredTime: quizData.preferredTime,
          equipmentAvailable: quizData.gymAccess ? "Academia" : "Casa",
          workoutLength: quizData.workoutDuration,
          lovedFoods: "", // Not in new schema
          dislikedFoods: "",
          allergiesList: quizData.dietaryRestrictions,
          painDetails: quizData.physicalLimitations,
          healthIssuesList: "", // Not in new schema
        });
      } else {
        // Fallback to localStorage
        const storedData = localStorage.getItem("quizData");
        if (storedData) {
          const data = JSON.parse(storedData);
          setProfile({
            name: userName || "Usuário",
            ...data,
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalLabel = (goal?: string) => {
    const goals: Record<string, string> = {
      "weight-loss": "Emagrecimento",
      "muscle-gain": "Ganho de Massa Muscular",
      "conditioning": "Condicionamento Físico",
      "health": "Saúde Geral",
      "endurance": "Resistência"
    };
    return goals[goal || ""] || goal;
  };

  const getExperienceLabel = (exp?: string) => {
    const levels: Record<string, string> = {
      "beginner": "Iniciante",
      "intermediate": "Intermediário",
      "advanced": "Avançado",
      "less-than-6-months": "Menos de 6 meses",
      "6-12-months": "6-12 meses",
      "1-2-years": "1-2 anos",
      "more-than-2-years": "Mais de 2 anos"
    };
    return levels[exp || ""] || exp;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Perfil não encontrado</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="bg-gradient-hero text-primary-foreground py-6 px-4 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meu Perfil</h1>
              <p className="text-sm opacity-90 mt-1">Suas informações e preferências</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
              onClick={() => navigate("/quiz")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Header Card with Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-8 mb-6 bg-gradient-card shadow-elegant">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{profile.name}</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.age && (
                    <Badge variant="secondary" className="text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {profile.age} anos
                    </Badge>
                  )}
                  {profile.mainGoal && (
                    <Badge className="text-sm bg-primary/20 text-primary border-primary/30">
                      <Target className="h-3 w-3 mr-1" />
                      {getGoalLabel(profile.mainGoal)}
                    </Badge>
                  )}
                  {profile.experienceTime && (
                    <Badge variant="outline" className="text-sm">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {getExperienceLabel(profile.experienceTime)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Informações Físicas
              </h3>
              <div className="space-y-4">
                {profile.height && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="h-4 w-4" />
                      <span>Altura</span>
                    </div>
                    <span className="font-semibold">{profile.height} cm</span>
                  </div>
                )}
                {profile.currentWeight && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Scale className="h-4 w-4" />
                      <span>Peso Atual</span>
                    </div>
                    <span className="font-semibold">{profile.currentWeight} kg</span>
                  </div>
                )}
                {profile.desiredWeight && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>Peso Meta</span>
                    </div>
                    <span className="font-semibold">{profile.desiredWeight} kg</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Training Preferences */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Preferências de Treino
              </h3>
              <div className="space-y-4">
                {profile.trainingDays && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Dias por Semana</span>
                    </div>
                    <span className="font-semibold">{profile.trainingDays} dias</span>
                  </div>
                )}
                {profile.preferredTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Horário Preferido</span>
                    </div>
                    <span className="font-semibold capitalize">{profile.preferredTime}</span>
                  </div>
                )}
                {profile.workoutLength && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duração do Treino</span>
                    </div>
                    <span className="font-semibold">{profile.workoutLength}</span>
                  </div>
                )}
                {profile.equipmentAvailable && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Dumbbell className="h-4 w-4" />
                      <span>Equipamento</span>
                    </div>
                    <span className="font-semibold">{profile.equipmentAvailable}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Nutrition Preferences */}
          {(profile.lovedFoods || profile.dislikedFoods || profile.allergiesList) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary" />
                  Preferências Alimentares
                </h3>
                <div className="space-y-4">
                  {profile.lovedFoods && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Alimentos Favoritos</span>
                      </div>
                      <p className="text-sm pl-6">{profile.lovedFoods}</p>
                    </div>
                  )}
                  {profile.dislikedFoods && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">Não Gosta</span>
                      </div>
                      <p className="text-sm pl-6">{profile.dislikedFoods}</p>
                    </div>
                  )}
                  {profile.allergiesList && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold">Restrições/Alergias</span>
                      </div>
                      <p className="text-sm pl-6">{profile.allergiesList}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Health Information */}
          {(profile.painDetails || profile.healthIssuesList) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Informações de Saúde
                </h3>
                <div className="space-y-4">
                  {profile.painDetails && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-semibold">Limitações Físicas</span>
                      </div>
                      <p className="text-sm pl-6">{profile.painDetails}</p>
                    </div>
                  )}
                  {profile.healthIssuesList && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Heart className="h-4 w-4" />
                        <span className="font-semibold">Condições de Saúde</span>
                      </div>
                      <p className="text-sm pl-6">{profile.healthIssuesList}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Edit Profile CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="p-6 bg-gradient-accent text-center">
            <h3 className="text-lg font-bold mb-2">Precisa atualizar suas informações?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Suas informações ajudam a criar treinos mais personalizados para você
            </p>
            <Button onClick={() => navigate("/quiz")} size="lg">
              <Edit className="h-4 w-4 mr-2" />
              Atualizar Perfil
            </Button>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
