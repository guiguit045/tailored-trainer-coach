import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Sun, Moon, Apple, Info, Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWaterIntake, addWaterIntake } from "@/lib/workoutStorage";
import { celebrateCompletion } from "@/lib/confetti";
import { supabase } from "@/integrations/supabase/client";
import MealPhotoCapture from "./MealPhotoCapture";
import type { QuizData } from "@/pages/Quiz";

interface DietTabProps {
  quizData: QuizData;
}

interface Meal {
  name: string;
  icon: any;
  foods: string[];
  why: string;
  calories: string;
}

const generateDiet = (quizData: QuizData): Meal[] => {
  const isWeightLoss = quizData.mainGoal === "weight-loss";
  const isMuscleGain = quizData.mainGoal === "muscle-gain";
  const isVegetarian = quizData.eatsMeat === "no";
  const canCook = quizData.canCook === "yes";

  const breakfast: Meal = {
    name: "Café da Manhã",
    icon: Coffee,
    foods: [],
    why: "",
    calories: ""
  };

  const lunch: Meal = {
    name: "Almoço",
    icon: Sun,
    foods: [],
    why: "",
    calories: ""
  };

  const snack: Meal = {
    name: "Lanche",
    icon: Apple,
    foods: [],
    why: "",
    calories: ""
  };

  const dinner: Meal = {
    name: "Jantar",
    icon: Moon,
    foods: [],
    why: "",
    calories: ""
  };

  if (isWeightLoss) {
    breakfast.foods = isVegetarian 
      ? ["2 ovos mexidos", "2 fatias de pão integral", "1 xícara de chá verde", "1 fruta (maçã ou banana)"]
      : ["3 ovos mexidos", "2 fatias de pão integral", "1 xícara de chá verde ou café sem açúcar"];
    breakfast.why = "Rico em proteínas para saciedade. Chá verde acelera metabolismo.";
    breakfast.calories = "~350 kcal";

    lunch.foods = isVegetarian
      ? ["Salada grande (alface, tomate, pepino)", "150g de grão-de-bico", "100g de quinoa", "Azeite de oliva (1 colher)"]
      : ["Salada grande (alface, tomate, pepino)", "150g de frango grelhado", "100g de batata doce", "Legumes cozidos"];
    lunch.why = "Proteína magra com carboidratos de baixo índice glicêmico. Mantém saciedade.";
    lunch.calories = "~450 kcal";

    snack.foods = ["1 iogurte natural (desnatado)", "1 porção de oleaginosas (10 unidades de amêndoas ou castanhas)"];
    snack.why = "Proteína e gorduras boas. Controla fome entre refeições.";
    snack.calories = "~200 kcal";

    dinner.foods = isVegetarian
      ? ["Omelete de 2 ovos com vegetais", "Salada verde", "1 fatia de queijo branco"]
      : ["150g de peixe grelhado (tilápia ou salmão)", "Brócolis e couve-flor no vapor", "Salada verde"];
    dinner.why = "Leve e rico em proteínas. Não sobrecarrega digestão à noite.";
    dinner.calories = "~350 kcal";
  } else if (isMuscleGain) {
    breakfast.foods = isVegetarian
      ? ["4 ovos mexidos", "100g de aveia com leite", "2 bananas", "1 colher de pasta de amendoim"]
      : ["4 ovos (2 inteiros + 2 claras)", "100g de aveia com leite", "2 bananas", "1 colher de pasta de amendoim"];
    breakfast.why = "Alta caloria e proteína para crescimento muscular. Carboidratos para energia.";
    breakfast.calories = "~650 kcal";

    lunch.foods = isVegetarian
      ? ["200g de tofu grelhado", "200g de arroz integral", "150g de feijão", "Salada com azeite", "1 suco natural"]
      : ["200g de carne vermelha magra", "200g de arroz integral", "150g de feijão", "Salada com azeite"];
    lunch.why = "Refeição completa com proteína, carboidratos e micronutrientes para recuperação muscular.";
    lunch.calories = "~750 kcal";

    snack.foods = canCook
      ? ["Vitamina: 300ml de leite + 1 banana + 1 scoop de whey protein + aveia"]
      : ["2 sanduíches de pão integral com pasta de amendoim", "1 copo de leite"];
    snack.why = "Proteína de rápida absorção para manutenção do anabolismo.";
    snack.calories = "~400 kcal";

    dinner.foods = isVegetarian
      ? ["200g de grão-de-bico", "150g de batata doce", "Legumes variados", "Salada"]
      : ["200g de frango ou peixe", "150g de arroz integral", "Legumes assados", "Salada"];
    dinner.why = "Refeição completa para recuperação noturna e síntese proteica.";
    dinner.calories = "~600 kcal";
  } else {
    breakfast.foods = ["Tapioca com queijo", "1 fruta", "Café com leite"];
    breakfast.why = "Carboidratos de qualidade para energia matinal.";
    breakfast.calories = "~400 kcal";

    lunch.foods = ["Arroz e feijão", "Proteína (frango, peixe ou carne)", "Salada", "Legumes"];
    lunch.why = "Refeição equilibrada com todos os nutrientes essenciais.";
    lunch.calories = "~600 kcal";

    snack.foods = ["Frutas", "Castanhas", "Iogurte"];
    snack.why = "Lanche nutritivo para manter energia entre refeições.";
    snack.calories = "~250 kcal";

    dinner.foods = ["Sopa de legumes", "Proteína grelhada", "Salada"];
    dinner.why = "Jantar leve para boa digestão noturna.";
    dinner.calories = "~400 kcal";
  }

  return [breakfast, lunch, snack, dinner];
};

export default function DietTab({ quizData }: DietTabProps) {
  const { toast } = useToast();
  const [waterIntake, setWaterIntake] = useState(0);
  const [isLoadingWater, setIsLoadingWater] = useState(true);
  const [waterConfettiTriggered, setWaterConfettiTriggered] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isLoadingCalories, setIsLoadingCalories] = useState(true);

  const meals = generateDiet(quizData);
  const waterGoal = 2000; // 2 litros = 2000ml
  const waterProgress = (waterIntake / waterGoal) * 100;
  
  // Calculate daily calorie goal based on user goal
  const isWeightLoss = quizData.mainGoal === "weight-loss";
  const isMuscleGain = quizData.mainGoal === "muscle-gain";
  const calorieGoal = isWeightLoss ? 1500 : isMuscleGain ? 2500 : 2000;
  const calorieProgress = (totalCalories / calorieGoal) * 100;

  useEffect(() => {
    const loadWaterIntake = async () => {
      setIsLoadingWater(true);
      const intake = await getWaterIntake();
      setWaterIntake(intake);
      setIsLoadingWater(false);
      setWaterConfettiTriggered(intake >= waterGoal);
    };
    loadWaterIntake();
    loadDailyCalories();
  }, []);

  const loadDailyCalories = async () => {
    setIsLoadingCalories(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('consumed_meals')
        .select('calories')
        .eq('user_id', user.id)
        .eq('meal_date', today);

      if (error) throw error;

      const total = data?.reduce((sum, meal) => sum + meal.calories, 0) || 0;
      setTotalCalories(total);
      
      if (total >= calorieGoal) {
        celebrateCompletion();
      }
    } catch (error) {
      console.error('Error loading calories:', error);
    } finally {
      setIsLoadingCalories(false);
    }
  };

  const handleAddWater = async () => {
    const newIntake = await addWaterIntake(200);
    setWaterIntake(newIntake);
    
    toast({
      title: "Água adicionada! 💧",
      description: `Você bebeu ${newIntake}ml de ${waterGoal}ml hoje`,
    });

    if (newIntake >= waterGoal && !waterConfettiTriggered) {
      celebrateCompletion();
      setWaterConfettiTriggered(true);
      toast({
        title: "Meta de água atingida! 🎉",
        description: "Parabéns! Você completou sua meta de hidratação hoje!",
      });
    }
  };

  const hasAllergies = quizData.allergies && quizData.allergies !== "none";

  return (
    <div className="space-y-6">
      {/* Meal Photo Capture */}
      <MealPhotoCapture onMealAdded={loadDailyCalories} />

      {/* Calorie Counter */}
      <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Calorias de Hoje</h3>
            <Badge variant="outline" className="text-sm">
              {totalCalories} / {calorieGoal} kcal
            </Badge>
          </div>
          
          <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {calorieProgress >= 100 
              ? "Meta de calorias atingida! 🎉" 
              : `Faltam ${calorieGoal - totalCalories} kcal para sua meta`}
          </p>
        </div>
      </Card>

      {/* Water Intake Tracker */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-foreground">Água de Hoje</h3>
            </div>
            <Badge variant="outline" className="text-sm">
              {waterIntake} / {waterGoal} ml
            </Badge>
          </div>
          
          <div className="relative h-32 w-20 mx-auto bg-muted/50 rounded-full border-2 border-border overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 ease-out"
              style={{ height: `${Math.min(waterProgress, 100)}%` }}
            />
          </div>

          <Button 
            onClick={handleAddWater}
            variant="outline"
            className="w-full"
            disabled={isLoadingWater}
          >
            <Droplet className="h-4 w-4 mr-2" />
            Bebi um copo (200ml)
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {waterProgress >= 100 
              ? "Meta de hidratação atingida! 🎉" 
              : `Faltam ${waterGoal - waterIntake}ml para sua meta`}
          </p>
        </div>
      </Card>

      {/* Meal Suggestion Cards */}
      <div className="grid gap-4">
        {meals.map((meal, index) => {
          const Icon = meal.icon;
          
          return (
            <Card 
              key={index} 
              className="p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{meal.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {meal.calories}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Sugestão:</h4>
                  <ul className="space-y-1">
                    {meal.foods.map((food, foodIndex) => (
                      <li key={foodIndex} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{meal.why}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Nutritional Tips */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Dicas Nutricionais</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Beba pelo menos 2 litros de água por dia</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Faça refeições a cada 3-4 horas para manter o metabolismo ativo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Evite alimentos processados e frituras</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Priorize alimentos naturais e integrais</span>
            </li>
            {hasAllergies && (
              <li className="flex items-start gap-2 text-orange-600 dark:text-orange-400 font-medium">
                <span className="mt-1">⚠️</span>
                <span>Atenção às suas alergias/restrições: {quizData.allergies}</span>
              </li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
}
