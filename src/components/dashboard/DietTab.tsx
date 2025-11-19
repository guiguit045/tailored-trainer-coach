import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Sun, Moon, Apple, Info, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMealCompletions, toggleMealCompletion } from "@/lib/workoutStorage";
import { celebrateCompletion } from "@/lib/confetti";
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
      : ["200g de frango ou peixe", "150g de batata doce ou mandioca", "Legumes variados", "Salada"];
    dinner.why = "Proteína para recuperação noturna. Carboidratos para repor glicogênio.";
    dinner.calories = "~550 kcal";
  } else {
    breakfast.foods = ["2-3 ovos mexidos", "2 fatias de pão integral", "1 fruta", "Café ou chá"];
    breakfast.why = "Equilíbrio de proteínas e carboidratos para energia matinal.";
    breakfast.calories = "~400 kcal";

    lunch.foods = isVegetarian
      ? ["Salada completa", "150g de lentilha ou grão-de-bico", "100g de arroz integral", "Legumes"]
      : ["Salada completa", "150g de proteína (frango, peixe ou carne)", "100g de arroz integral", "Legumes"];
    lunch.why = "Refeição balanceada com todos os macronutrientes essenciais.";
    lunch.calories = "~500 kcal";

    snack.foods = ["1 fruta", "Punhado de castanhas ou iogurte"];
    snack.why = "Lanche leve para manter energia e saciedade.";
    snack.calories = "~150 kcal";

    dinner.foods = isVegetarian
      ? ["Omelete ou tofu", "Salada", "Legumes cozidos"]
      : ["150g de proteína magra", "Salada", "Legumes cozidos"];
    dinner.why = "Jantar leve e nutritivo para boa digestão.";
    dinner.calories = "~400 kcal";
  }

  return [breakfast, lunch, snack, dinner];
};

const DietTab = ({ quizData }: DietTabProps) => {
  const { toast } = useToast();
  const diet = generateDiet(quizData);
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  
  useEffect(() => {
    loadMealCompletions();
  }, []);

  const loadMealCompletions = async () => {
    const completed = await getMealCompletions();
    setCompletedMeals(completed);
  };

  const handleToggleMeal = async (mealIndex: number) => {
    setIsLoading(prev => ({ ...prev, [mealIndex]: true }));
    try {
      const isCompleted = await toggleMealCompletion(mealIndex);
      
      if (isCompleted) {
        setCompletedMeals(prev => [...prev, mealIndex]);
        toast({
          title: "Refeição registrada! 🍽️",
          description: "Continue assim para manter sua dieta em dia!",
        });
      } else {
        setCompletedMeals(prev => prev.filter(idx => idx !== mealIndex));
        setHasTriggeredConfetti(false); // Reset confetti flag when uncompleting
        toast({
          title: "Registro removido",
          description: "Refeição desmarcada",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [mealIndex]: false }));
    }
  };
  
  const totalCalories = diet.reduce((sum, meal) => {
    const cals = parseInt(meal.calories.match(/\d+/)?.[0] || "0");
    return sum + cals;
  }, 0);

  const completedCount = completedMeals.length;
  const totalMeals = diet.length;

  // Calculate consumed calories
  const consumedCalories = diet.reduce((sum, meal, index) => {
    if (completedMeals.includes(index)) {
      const cals = parseInt(meal.calories.match(/\d+/)?.[0] || "0");
      return sum + cals;
    }
    return sum;
  }, 0);

  const caloriesProgress = (consumedCalories / totalCalories) * 100;

  // Trigger confetti when goal is reached
  useEffect(() => {
    if (caloriesProgress >= 100 && !hasTriggeredConfetti && completedMeals.length > 0) {
      celebrateCompletion();
      setHasTriggeredConfetti(true);
      toast({
        title: "🎉 Parabéns! Meta atingida!",
        description: "Você completou todas as calorias do dia!",
      });
    }
  }, [caloriesProgress, hasTriggeredConfetti, completedMeals.length]);

  return (
    <div className="space-y-4">
      {/* Calories Progress Bar */}
      <Card className="p-6 bg-gradient-card shadow-medium overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold">Calorias de Hoje</h3>
            <p className="text-sm text-muted-foreground">
              {consumedCalories} / {totalCalories} kcal
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{Math.round(caloriesProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalMeals} refeições
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
          >
            {caloriesProgress > 10 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {consumedCalories} kcal
                </span>
              </div>
            )}
          </div>
        </div>

        {caloriesProgress >= 100 && (
          <div className="mt-3 text-center">
            <Badge variant="default" className="bg-green-600">
              🎉 Meta de calorias atingida!
            </Badge>
          </div>
        )}
        
        {quizData.allergies === "yes" && (
          <div className="mt-3">
            <Badge variant="destructive" className="text-xs">
              ⚠️ Evitar: {quizData.allergiesList}
            </Badge>
          </div>
        )}
      </Card>

      {diet.map((meal, index) => {
        const Icon = meal.icon;
        const isCompleted = completedMeals.includes(index);
        const isLoadingMeal = isLoading[index];
        
        return (
          <Card key={index} className="p-6 hover:shadow-medium transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{meal.name}</h4>
                  <Badge variant="outline" className="text-xs mt-1">
                    {meal.calories}
                  </Badge>
                </div>
              </div>
              
              <Button
                variant={isCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleMeal(index)}
                disabled={isLoadingMeal}
                className="flex items-center gap-2"
              >
                {isCompleted && <Check className="h-4 w-4" />}
                {isCompleted ? "Concluída" : "Marcar"}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Alimentos</p>
                <ul className="space-y-1">
                  {meal.foods.map((food, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{food}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-secondary/10 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-secondary mb-1">Por que estes alimentos?</p>
                    <p className="text-sm">{meal.why}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      <Card className="p-6 bg-gradient-accent text-accent-foreground">
        <h4 className="font-bold mb-2">💡 Dicas Nutricionais</h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Beba ao menos 2-3 litros de água por dia</li>
          <li>Evite alimentos ultraprocessados</li>
          <li>Prepare refeições com antecedência quando possível</li>
          <li>Respeite os horários das refeições</li>
          {quizData.sugarConsumption === "yes" && (
            <li className="text-accent-foreground/90 font-semibold">⚠️ Reduza o consumo de açúcar gradualmente</li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default DietTab;