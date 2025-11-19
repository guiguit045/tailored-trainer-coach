import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { celebrateAnswer, celebrateCompletion } from "@/lib/confetti";
import { supabase } from "@/integrations/supabase/client";

export interface QuizData {
  age: string;
  height: string;
  currentWeight: string;
  desiredWeight: string;
  mainGoal: string;
  trainingTime: string;
  hasTrainedBefore: string;
  experienceTime: string;
  knownExercises: string[];
  hasFear: string;
  hasLimitations: string;
  hasPain: string;
  painDetails: string;
  trainingDays: string;
  preferredTime: string;
  sleepQuality: string;
  stressLevel: string;
  equipmentAvailable: string;
  workoutLength: string;
  workoutSplit: string;
  desiredIntensity: string;
  eatsMeat: string;
  allergies: string;
  allergiesList: string;
  dislikedFoods: string;
  lovedFoods: string;
  canCook: string;
  mealsPerDay: string;
  jobType: string;
  activityLevel: string;
  alcoholConsumption: string;
  sugarConsumption: string;
  healthIssues: string;
  healthIssuesList: string;
  highBloodPressure: string;
  diabetes: string;
  highCholesterol: string;
  familyHistory: string;
  deadline: string;
  motivation: string;
  pastObstacles: string;
  currentMotivation: string;
  commitmentLevel: string;
  bodyPhotos?: string[];
  bodyAnalysis?: string;
}

interface Question {
  id: keyof QuizData | "bodyPhotos";
  title: string;
  type: "input" | "radio" | "checkbox" | "textarea" | "photo-upload";
  options?: { value: string; label: string }[];
  placeholder?: string;
  condition?: (data: QuizData) => boolean;
}

const questions: Question[] = [
  { id: "age", title: "Qual é a sua idade?", type: "input", placeholder: "Ex: 25" },
  { id: "height", title: "Qual é a sua altura?", type: "input", placeholder: "Ex: 1.75" },
  { id: "currentWeight", title: "Qual é o seu peso atual?", type: "input", placeholder: "Ex: 70" },
  { id: "desiredWeight", title: "Qual é o seu peso desejado?", type: "input", placeholder: "Ex: 65" },
  {
    id: "mainGoal",
    title: "Qual é o seu objetivo principal?",
    type: "radio",
    options: [
      { value: "lose", label: "Emagrecer" },
      { value: "gain", label: "Ganhar massa muscular" },
      { value: "health", label: "Melhorar saúde" },
      { value: "conditioning", label: "Condicionamento físico" },
      { value: "resistance", label: "Ganhar resistência" },
    ],
  },
  { id: "trainingTime", title: "Quanto tempo tem disponível por treino?", type: "input", placeholder: "Ex: 60 minutos" },
  {
    id: "hasTrainedBefore",
    title: "Você já treinou antes?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "experienceTime",
    title: "Quanto tempo de experiência você tem?",
    type: "input",
    placeholder: "Ex: 6 meses",
    condition: (data) => data.hasTrainedBefore === "yes",
  },
  {
    id: "knownExercises",
    title: "Quais exercícios você já sabe fazer?",
    type: "checkbox",
    options: [
      { value: "squat", label: "Agachamento" },
      { value: "bench", label: "Supino" },
      { value: "deadlift", label: "Levantamento terra" },
      { value: "pullup", label: "Barra fixa" },
      { value: "running", label: "Corrida" },
    ],
    condition: (data) => data.hasTrainedBefore === "yes",
  },
  {
    id: "hasFear",
    title: "Tem medo ou vergonha de academia?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
      { value: "sometimes", label: "Às vezes" },
    ],
  },
  {
    id: "hasLimitations",
    title: "Tem limitação de mobilidade?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "hasPain",
    title: "Tem dor crônica ou lesões?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "painDetails",
    title: "Descreva suas dores ou lesões:",
    type: "textarea",
    placeholder: "Ex: Dor no joelho direito",
    condition: (data) => data.hasPain === "yes",
  },
  { id: "trainingDays", title: "Quantos dias por semana quer treinar?", type: "input", placeholder: "Ex: 4" },
  {
    id: "preferredTime",
    title: "Horário preferido de treino:",
    type: "radio",
    options: [
      { value: "morning", label: "Manhã" },
      { value: "afternoon", label: "Tarde" },
      { value: "night", label: "Noite" },
    ],
  },
  {
    id: "sleepQuality",
    title: "Como você dorme?",
    type: "radio",
    options: [
      { value: "well", label: "Bem" },
      { value: "average", label: "Mais ou menos" },
      { value: "poorly", label: "Mal" },
    ],
  },
  {
    id: "stressLevel",
    title: "Nível de estresse atual:",
    type: "radio",
    options: [
      { value: "low", label: "Baixo" },
      { value: "medium", label: "Médio" },
      { value: "high", label: "Alto" },
    ],
  },
  {
    id: "equipmentAvailable",
    title: "Equipamentos disponíveis:",
    type: "radio",
    options: [
      { value: "full-gym", label: "Academia completa" },
      { value: "small-gym", label: "Academia pequena" },
      { value: "home", label: "Casa" },
    ],
  },
  {
    id: "workoutLength",
    title: "Prefere treinos:",
    type: "radio",
    options: [
      { value: "short", label: "Curtos e intensos" },
      { value: "long", label: "Longos e moderados" },
    ],
  },
  {
    id: "workoutSplit",
    title: "Tipo de divisão de treino:",
    type: "radio",
    options: [
      { value: "fullbody", label: "Corpo todo (Full Body)" },
      { value: "split", label: "Dividido (por grupo muscular)" },
    ],
  },
  {
    id: "desiredIntensity",
    title: "Intensidade desejada:",
    type: "radio",
    options: [
      { value: "light", label: "Leve" },
      { value: "medium", label: "Média" },
      { value: "high", label: "Alta" },
    ],
  },
  {
    id: "eatsMeat",
    title: "Você come carne?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não (Vegetariano/Vegano)" },
    ],
  },
  {
    id: "allergies",
    title: "Tem alergias alimentares?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "allergiesList",
    title: "Liste suas alergias:",
    type: "textarea",
    placeholder: "Ex: Lactose, glúten",
    condition: (data) => data.allergies === "yes",
  },
  { id: "dislikedFoods", title: "Alimentos que você odeia:", type: "textarea", placeholder: "Ex: Brócolis, peixe" },
  { id: "lovedFoods", title: "Alimentos que você ama:", type: "textarea", placeholder: "Ex: Frango, arroz integral" },
  {
    id: "canCook",
    title: "Você pode cozinhar?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim, gosto de cozinhar" },
      { value: "simple", label: "Só refeições simples" },
      { value: "no", label: "Não, prefiro praticidade" },
    ],
  },
  { id: "mealsPerDay", title: "Quantas refeições faz por dia?", type: "input", placeholder: "Ex: 4" },
  {
    id: "jobType",
    title: "Seu trabalho é:",
    type: "radio",
    options: [
      { value: "sitting", label: "Sentado (escritório)" },
      { value: "standing", label: "Em pé" },
      { value: "active", label: "Ativo (movimento constante)" },
    ],
  },
  {
    id: "activityLevel",
    title: "Nível de atividade fora da academia:",
    type: "radio",
    options: [
      { value: "sedentary", label: "Sedentário" },
      { value: "light", label: "Leve" },
      { value: "moderate", label: "Moderado" },
      { value: "intense", label: "Intenso" },
    ],
  },
  {
    id: "alcoholConsumption",
    title: "Consome álcool?",
    type: "radio",
    options: [
      { value: "never", label: "Nunca" },
      { value: "rarely", label: "Raramente" },
      { value: "socially", label: "Socialmente" },
      { value: "frequently", label: "Frequentemente" },
    ],
  },
  {
    id: "sugarConsumption",
    title: "Consome açúcar em excesso?",
    type: "radio",
    options: [
      { value: "no", label: "Não" },
      { value: "sometimes", label: "Às vezes" },
      { value: "yes", label: "Sim" },
    ],
  },
  {
    id: "healthIssues",
    title: "Tem problemas de saúde pré-existentes?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "healthIssuesList",
    title: "Liste seus problemas de saúde:",
    type: "textarea",
    placeholder: "Ex: Hipertensão, asma",
    condition: (data) => data.healthIssues === "yes",
  },
  {
    id: "highBloodPressure",
    title: "Tem pressão alta?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "diabetes",
    title: "Tem diabetes?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  {
    id: "highCholesterol",
    title: "Tem colesterol elevado?",
    type: "radio",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
    ],
  },
  { id: "familyHistory", title: "Histórico familiar relevante:", type: "textarea", placeholder: "Ex: Diabetes na família" },
  { id: "deadline", title: "Prazo para atingir seu objetivo:", type: "input", placeholder: "Ex: 3 meses" },
  { id: "motivation", title: "Por que você quer mudar seu corpo?", type: "textarea", placeholder: "Seja sincero..." },
  { id: "pastObstacles", title: "O que mais atrapalhou no passado?", type: "textarea", placeholder: "Ex: Falta de tempo, desmotivação" },
  { id: "currentMotivation", title: "O que mais te motiva agora?", type: "textarea", placeholder: "Ex: Saúde, autoestima" },
  {
    id: "commitmentLevel",
    title: "Seu nível de comprometimento:",
    type: "radio",
    options: [
      { value: "100", label: "100% - Vou seguir à risca" },
      { value: "flexible", label: "Flexível - Quero algo adaptável" },
    ],
  },
  {
    id: "bodyPhotos",
    title: "Fotos do seu corpo (opcional)",
    type: "photo-upload",
  },
];

const Quiz = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quizData, setQuizData] = useState<QuizData>({
    age: "",
    height: "",
    currentWeight: "",
    desiredWeight: "",
    mainGoal: "",
    trainingTime: "",
    hasTrainedBefore: "",
    experienceTime: "",
    knownExercises: [],
    hasFear: "",
    hasLimitations: "",
    hasPain: "",
    painDetails: "",
    trainingDays: "",
    preferredTime: "",
    sleepQuality: "",
    stressLevel: "",
    equipmentAvailable: "",
    workoutLength: "",
    workoutSplit: "",
    desiredIntensity: "",
    eatsMeat: "",
    allergies: "",
    allergiesList: "",
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
  });

  // Filter questions based on conditions
  const activeQuestions = questions.filter((q) => !q.condition || q.condition(quizData));
  const currentQuestion = activeQuestions[currentIndex];
  const totalQuestions = activeQuestions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const updateQuizData = (field: keyof QuizData, value: any) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxPhotos = 4;
    const remainingSlots = maxPhotos - uploadedPhotos.length;
    
    if (files.length > remainingSlots) {
      toast.error(`Você pode adicionar no máximo ${maxPhotos} fotos`);
      return;
    }

    const newPhotos: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Cada foto deve ter no máximo 5MB");
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === files.length) {
          setUploadedPhotos(prev => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePhotos = async () => {
    if (uploadedPhotos.length === 0) return null;

    setIsAnalyzing(true);
    toast.loading("Analisando suas fotos com IA...");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-body-photos", {
        body: { 
          photos: uploadedPhotos,
          quizData: quizData
        }
      });

      toast.dismiss();

      if (error) throw error;

      toast.success("Análise concluída!");
      return data.analysis;
    } catch (error) {
      console.error("Error analyzing photos:", error);
      toast.error("Erro ao analisar fotos. Continuando sem análise.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      celebrateAnswer();
      setDirection("next");
      setTimeout(() => setCurrentIndex(currentIndex + 1), 50);
    } else {
      // Final step - analyze photos if uploaded
      let bodyAnalysis = null;
      if (uploadedPhotos.length > 0) {
        bodyAnalysis = await analyzePhotos();
      }

      const finalData = {
        ...quizData,
        bodyPhotos: uploadedPhotos,
        bodyAnalysis: bodyAnalysis
      };

      localStorage.setItem("quizData", JSON.stringify(finalData));
      celebrateCompletion();
      toast.success("Perfil completo! Gerando seu plano personalizado...");
      setTimeout(() => navigate("/dashboard"), 1000);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection("back");
      setTimeout(() => setCurrentIndex(currentIndex - 1), 50);
    }
  };

  const toggleCheckbox = (value: string) => {
    const currentValues = quizData[currentQuestion.id] as string[];
    if (currentValues.includes(value)) {
      updateQuizData(
        currentQuestion.id,
        currentValues.filter((v) => v !== value)
      );
    } else {
      updateQuizData(currentQuestion.id, [...currentValues, value]);
    }
  };

  const canProceed = () => {
    if (currentQuestion.type === "photo-upload") {
      return true; // Photos are optional
    }
    const value = quizData[currentQuestion.id as keyof QuizData];
    if (currentQuestion.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }
    return value && value.toString().trim() !== "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="h-2 bg-muted/30">
          <div
            className="h-full bg-gradient-to-r from-accent-green via-accent-green to-accent-green/80 transition-all duration-500 ease-out shadow-elegant"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Pergunta {currentIndex + 1} de {totalQuestions}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-2xl">
          <Card
            key={currentIndex}
            className={`p-8 md:p-12 shadow-elegant bg-card/50 backdrop-blur-sm border-2 animate-fade-in ${
              direction === "next" ? "animate-slide-in-right" : ""
            }`}
          >
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {currentQuestion.title}
              </h2>

              {/* Input Field */}
              {currentQuestion.type === "input" && (
                <Input
                  type="text"
                  value={quizData[currentQuestion.id] as string}
                  onChange={(e) => updateQuizData(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="text-lg h-14 bg-background/50"
                />
              )}

              {/* Textarea Field */}
              {currentQuestion.type === "textarea" && (
                <textarea
                  value={quizData[currentQuestion.id] as string}
                  onChange={(e) => updateQuizData(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full min-h-[120px] p-4 text-lg rounded-lg border-2 border-input bg-background/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              )}

              {/* Radio Options */}
              {currentQuestion.type === "radio" && currentQuestion.options && (
                <RadioGroup
                  value={quizData[currentQuestion.id] as string}
                  onValueChange={(value) => updateQuizData(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
                        quizData[currentQuestion.id] === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/30"
                      }`}
                      onClick={() => updateQuizData(currentQuestion.id, option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-lg cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Checkbox Options */}
              {currentQuestion.type === "checkbox" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
                        (quizData[currentQuestion.id] as string[])?.includes(option.value)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/30"
                      }`}
                      onClick={() => toggleCheckbox(option.value)}
                    >
                      <Checkbox
                        checked={(quizData[currentQuestion.id] as string[])?.includes(option.value)}
                        onCheckedChange={() => toggleCheckbox(option.value)}
                        id={option.value}
                      />
                      <Label htmlFor={option.value} className="text-lg cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo Upload */}
              {currentQuestion.type === "photo-upload" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Adicione até 4 fotos do seu corpo para uma análise mais precisa por IA
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border group">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {uploadedPhotos.length < 4 && (
                      <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-background/50 hover:bg-primary/5">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Adicionar foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <p className="text-sm text-accent-green font-medium">
                      ✓ {uploadedPhotos.length} foto{uploadedPhotos.length > 1 ? 's' : ''} adicionada{uploadedPhotos.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentIndex > 0 && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isAnalyzing}
              size="lg"
              className="flex-1 h-14 text-lg group disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>Analisando fotos...</>
              ) : currentIndex === totalQuestions - 1 ? (
                <>
                  Finalizar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  Próxima
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
