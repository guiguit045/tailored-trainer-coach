import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Sun, Moon, Apple, Info, Droplet, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWaterIntake, addWaterIntake } from "@/lib/workoutStorage";
import { celebrateCompletion } from "@/lib/confetti";
import { supabase } from "@/integrations/supabase/client";
import MealPhotoCapture from "./MealPhotoCapture";
import MealHistory from "./MealHistory";
import GoalEditor from "./GoalEditor";
import WaterGlass from "./WaterGlass";
import { calculateNutritionGoals } from "@/lib/nutritionCalculator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { waterSound } from "@/lib/waterSound";
import { format } from "date-fns";
import { getEffectiveDate } from "@/lib/dateUtils";
import AnimatedCard from "@/components/AnimatedCard";
import type { QuizData } from "@/pages/Quiz";
interface DietTabProps {
  quizData: QuizData;
}
interface MealVariation {
  foods: string[];
  why: string;
}
interface Meal {
  name: string;
  icon: any;
  variations: MealVariation[];
  calories: string;
}
const generateDiet = (quizData: QuizData): Meal[] => {
  const isWeightLoss = quizData.mainGoal === "lose";
  const isMuscleGain = quizData.mainGoal === "gain";
  const isVegetarian = quizData.eatsMeat === "no";
  const breakfast: Meal = {
    name: "Café da Manhã",
    icon: Coffee,
    variations: [],
    calories: ""
  };
  const lunch: Meal = {
    name: "Almoço",
    icon: Sun,
    variations: [],
    calories: ""
  };
  const snack: Meal = {
    name: "Lanche",
    icon: Apple,
    variations: [],
    calories: ""
  };
  const dinner: Meal = {
    name: "Jantar",
    icon: Moon,
    variations: [],
    calories: ""
  };
  if (isWeightLoss) {
    breakfast.calories = "~350 kcal";
    breakfast.variations = isVegetarian ? [{
      foods: ["2 ovos mexidos", "2 fatias de pão integral", "1 xícara de chá verde", "1 fruta (maçã ou banana)"],
      why: "Rico em proteínas para saciedade. Chá verde acelera metabolismo."
    }, {
      foods: ["Iogurte natural (200g)", "3 colheres de granola", "1 banana", "1 colher de mel"],
      why: "Probióticos para digestão. Carboidratos de absorção gradual mantêm energia."
    }, {
      foods: ["Panqueca de banana e aveia (2 unidades)", "1 colher de pasta de amendoim", "Café ou chá"],
      why: "Carboidratos complexos e proteína vegetal. Receita saudável e saborosa."
    }] : [{
      foods: ["3 ovos mexidos", "2 fatias de pão integral", "1 xícara de chá verde ou café sem açúcar"],
      why: "Rico em proteínas para saciedade. Chá verde acelera metabolismo."
    }, {
      foods: ["Omelete de 2 ovos com espinafre", "1 fatia de queijo branco", "1 torrada integral", "Café"],
      why: "Proteína de alta qualidade. Espinafre rico em ferro e fibras."
    }, {
      foods: ["Tapioca com ovo e queijo cottage", "1 fruta (mamão ou melão)", "Chá verde"],
      why: "Sem glúten, leve e nutritivo. Queijo cottage é rico em proteína."
    }];
    lunch.calories = "~450 kcal";
    lunch.variations = isVegetarian ? [{
      foods: ["Salada grande (alface, tomate, pepino)", "150g de grão-de-bico", "100g de quinoa", "Azeite de oliva (1 colher)"],
      why: "Proteína vegetal completa. Quinoa tem todos os aminoácidos essenciais."
    }, {
      foods: ["Bowl de lentilha (150g)", "100g de arroz integral", "Brócolis no vapor", "Cenoura ralada"],
      why: "Lentilha é rica em proteína e ferro. Baixo índice glicêmico."
    }, {
      foods: ["Wrap integral com hummus", "Vegetais grelhados (abobrinha, berinjela)", "Salada verde"],
      why: "Grão-de-bico do hummus fornece proteína. Fibras promovem saciedade."
    }] : [{
      foods: ["Salada grande (alface, tomate, pepino)", "150g de frango grelhado", "100g de batata doce", "Legumes cozidos"],
      why: "Proteína magra com carboidratos de baixo índice glicêmico. Mantém saciedade."
    }, {
      foods: ["150g de peixe assado", "Quinoa (100g)", "Brócolis e couve-flor no vapor", "Salada verde"],
      why: "Ômega-3 do peixe reduz inflamação. Quinoa é superalimento completo."
    }, {
      foods: ["Peito de frango em tiras (150g)", "Salada de folhas variadas", "100g de grão-de-bico", "Tomate cereja"],
      why: "Alta proteína, baixa caloria. Grão-de-bico adiciona fibras e saciedade."
    }];
    snack.calories = "~200 kcal";
    snack.variations = [{
      foods: ["1 iogurte natural (desnatado)", "10 amêndoas ou castanhas"],
      why: "Proteína e gorduras boas. Controla fome entre refeições."
    }, {
      foods: ["1 maçã média", "1 colher de pasta de amendoim integral"],
      why: "Fibras da maçã + gordura saudável. Combinação perfeita para saciedade."
    }, {
      foods: ["Vitamina: 200ml de leite desnatado + ½ banana + canela"],
      why: "Proteína do leite + carboidrato natural. Canela controla açúcar no sangue."
    }];
    dinner.calories = "~350 kcal";
    dinner.variations = isVegetarian ? [{
      foods: ["Omelete de 2 ovos com vegetais", "Salada verde", "1 fatia de queijo branco"],
      why: "Leve e rico em proteínas. Não sobrecarrega digestão à noite."
    }, {
      foods: ["Sopa de legumes com tofu (150g)", "Salada de rúcula", "1 fatia de pão integral"],
      why: "Hidratante e nutritiva. Tofu fornece proteína completa."
    }, {
      foods: ["Berinjela recheada com quinoa e tomate", "Salada verde", "Azeite de oliva"],
      why: "Baixa caloria, alto volume. Quinoa mantém saciedade durante a noite."
    }] : [{
      foods: ["150g de peixe grelhado (tilápia ou salmão)", "Brócolis e couve-flor no vapor", "Salada verde"],
      why: "Leve e rico em proteínas. Não sobrecarrega digestão à noite."
    }, {
      foods: ["150g de frango desfiado", "Sopa de legumes", "Salada de pepino com hortelã"],
      why: "Proteína magra. Sopa aquece e hidrata sem pesar."
    }, {
      foods: ["Omelete de claras (3 claras)", "Aspargos grelhados", "Tomate cereja", "Salada"],
      why: "Proteína pura sem gordura. Aspargos têm efeito diurético natural."
    }];
  } else if (isMuscleGain) {
    breakfast.calories = "~650 kcal";
    breakfast.variations = isVegetarian ? [{
      foods: ["4 ovos mexidos", "100g de aveia com leite", "2 bananas", "1 colher de pasta de amendoim"],
      why: "Alta caloria e proteína para crescimento muscular. Carboidratos para energia."
    }, {
      foods: ["Panqueca de aveia (3 unidades)", "2 ovos", "1 banana", "Mel", "Leite integral"],
      why: "Proteína + carboidrato na proporção ideal pós-treino. Receita saborosa."
    }, {
      foods: ["Vitamina: 400ml de leite integral", "100g de aveia", "2 bananas", "2 colheres de pasta de amendoim", "1 scoop de proteína vegetal"],
      why: "Shake hipercalórico. Fácil digestão, ideal para quem tem pouco apetite."
    }] : [{
      foods: ["4 ovos (2 inteiros + 2 claras)", "100g de aveia com leite", "2 bananas", "1 colher de pasta de amendoim"],
      why: "Alta caloria e proteína para crescimento muscular. Carboidratos para energia."
    }, {
      foods: ["3 ovos mexidos com queijo", "2 fatias de pão integral", "Abacate (½)", "Suco de laranja"],
      why: "Gorduras boas do abacate. Vitamina C do suco ajuda absorção de nutrientes."
    }, {
      foods: ["Tapioca recheada com frango desfiado (150g)", "2 ovos", "Vitamina de banana com whey"],
      why: "Carboidrato de rápida absorção + proteína. Perfeito pré-treino matinal."
    }];
    lunch.calories = "~750 kcal";
    lunch.variations = isVegetarian ? [{
      foods: ["200g de tofu grelhado", "200g de arroz integral", "150g de feijão", "Salada com azeite", "1 suco natural"],
      why: "Refeição completa com proteína, carboidratos e micronutrientes para recuperação muscular."
    }, {
      foods: ["150g de grão-de-bico", "200g de batata doce", "150g de lentilha", "Brócolis", "Azeite de oliva extra"],
      why: "Dupla de leguminosas = proteína completa. Batata doce fornece energia duradoura."
    }, {
      foods: ["Bowl de quinoa (200g)", "150g de edamame", "Abacate (½)", "Vegetais assados", "Molho tahine"],
      why: "Superalimentos combinados. Quinoa + edamame = proteína de alta qualidade."
    }] : [{
      foods: ["200g de carne vermelha magra", "200g de arroz integral", "150g de feijão", "Salada com azeite"],
      why: "Refeição completa com proteína, carboidratos e micronutrientes para recuperação muscular."
    }, {
      foods: ["200g de frango grelhado", "250g de macarrão integral", "Molho de tomate caseiro", "Legumes salteados"],
      why: "Carboidratos para repor glicogênio. Proteína para reparação muscular."
    }, {
      foods: ["200g de salmão", "200g de arroz integral", "Batata doce (150g)", "Aspargos grelhados"],
      why: "Ômega-3 reduz inflamação pós-treino. Combinação perfeita de macros."
    }];
    snack.calories = "~400 kcal";
    snack.variations = [{
      foods: ["Vitamina: 300ml de leite + 1 banana + 1 scoop de whey protein + aveia"],
      why: "Proteína de rápida absorção para manutenção do anabolismo."
    }, {
      foods: ["2 sanduíches de pão integral com pasta de amendoim", "1 copo de leite integral", "1 banana"],
      why: "Carboidratos + gorduras + proteína. Lanche completo entre refeições."
    }, {
      foods: ["Barra de proteína (30g)", "20 unidades de amendoim", "1 maçã"],
      why: "Prático e nutritivo. Proteína + gorduras boas + fibras."
    }];
    dinner.calories = "~600 kcal";
    dinner.variations = isVegetarian ? [{
      foods: ["200g de grão-de-bico", "150g de batata doce", "Legumes variados", "Salada"],
      why: "Refeição completa para recuperação noturna e síntese proteica."
    }, {
      foods: ["Omelete de 4 ovos com queijo e espinafre", "100g de arroz integral", "Salada de tomate"],
      why: "Proteína de alta qualidade. Caseinato do queijo = liberação lenta à noite."
    }, {
      foods: ["Hambúrguer de lentilha (2 unidades)", "150g de batata doce", "Salada verde", "Abacate"],
      why: "Proteína vegetal + carboidratos. Abacate adiciona calorias saudáveis."
    }] : [{
      foods: ["200g de frango ou peixe", "150g de arroz integral", "Legumes assados", "Salada"],
      why: "Refeição completa para recuperação noturna e síntese proteica."
    }, {
      foods: ["200g de carne moída magra", "150g de macarrão integral", "Molho de tomate", "Legumes"],
      why: "Proteína + carboidrato. Refeição sólida para manutenção do anabolismo."
    }, {
      foods: ["Omelete de 3 ovos inteiros", "150g de batata doce", "Atum (1 lata)", "Salada verde"],
      why: "Proteína de múltiplas fontes. Refeição rica para crescimento durante o sono."
    }];
  } else {
    // Maintenance
    breakfast.calories = "~400 kcal";
    breakfast.variations = [{
      foods: ["Tapioca com queijo", "1 fruta", "Café com leite"],
      why: "Carboidratos de qualidade para energia matinal."
    }, {
      foods: ["2 fatias de pão integral", "2 ovos", "Suco de laranja natural"],
      why: "Clássico equilibrado. Proteína + carboidrato + vitamina C."
    }, {
      foods: ["Mingau de aveia (100g)", "1 banana", "Canela", "Leite"],
      why: "Carboidratos de liberação lenta. Mantém saciedade até o almoço."
    }];
    lunch.calories = "~550 kcal";
    lunch.variations = [{
      foods: ["Arroz e feijão", "Proteína (frango, peixe ou carne)", "Salada", "Legumes"],
      why: "Refeição balanceada tradicional brasileira."
    }, {
      foods: ["150g de macarrão integral", "Molho de tomate com carne moída (100g)", "Salada verde"],
      why: "Carboidratos + proteína. Energia para o resto do dia."
    }, {
      foods: ["Prato feito: arroz (100g)", "Feijão (100g)", "Bife (120g)", "Ovo", "Salada"],
      why: "Brasileiro completo. Todos os macronutrientes balanceados."
    }];
    snack.calories = "~250 kcal";
    snack.variations = [{
      foods: ["Fruta da estação", "Castanhas (10 unidades)"],
      why: "Natural e nutritivo. Gorduras boas das castanhas."
    }, {
      foods: ["Iogurte natural (200g)", "2 colheres de granola", "Mel"],
      why: "Probióticos + fibras. Bom para digestão."
    }, {
      foods: ["Sanduíche integral com peito de peru e queijo"],
      why: "Prático e balanceado. Ideal para o meio da tarde."
    }];
    dinner.calories = "~450 kcal";
    dinner.variations = [{
      foods: ["Proteína grelhada (150g)", "Salada grande", "Sopa de legumes"],
      why: "Leve mas nutritivo. Não atrapalha o sono."
    }, {
      foods: ["150g de frango", "Purê de batata doce", "Brócolis no vapor"],
      why: "Jantar confortável e equilibrado. Carboidrato de qualidade."
    }, {
      foods: ["Omelete de 2 ovos", "Salada caprese", "1 fatia de pão integral"],
      why: "Rápido de fazer. Proteína + vegetais frescos."
    }];
  }
  return [breakfast, lunch, snack, dinner];
};
export default function DietTab({
  quizData
}: DietTabProps) {
  const {
    toast
  } = useToast();
  const [waterIntake, setWaterIntake] = useState(0);
  const [isLoadingWater, setIsLoadingWater] = useState(true);
  const [waterConfettiTriggered, setWaterConfettiTriggered] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isLoadingCalories, setIsLoadingCalories] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mealHistoryKey, setMealHistoryKey] = useState(0);

  // Track which variation is shown for each meal (0, 1, or 2)
  const [mealVariations, setMealVariations] = useState<number[]>([0, 0, 0, 0]);
  const meals = generateDiet(quizData);

  // Calculate goals using scientific formulas
  const calculatedGoals = calculateNutritionGoals(quizData);
  const [calorieGoal, setCalorieGoal] = useState(calculatedGoals.calories);
  const [waterGoalMl, setWaterGoalMl] = useState(calculatedGoals.waterMl);
  const handleGoalsUpdated = (newCalories: number, newWater: number) => {
    setCalorieGoal(newCalories);
    setWaterGoalMl(newWater);
  };
  const waterProgress = waterIntake / waterGoalMl * 100;
  const calorieProgress = totalCalories / calorieGoal * 100;

  // Rotate variations daily based on date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const dailyRotation = dayOfYear % 3; // Rotates 0, 1, 2 based on day
    setMealVariations([dailyRotation, dailyRotation, dailyRotation, dailyRotation]);
  }, []);
  useEffect(() => {
    const loadWaterIntake = async () => {
      setIsLoadingWater(true);
      try {
        const intake = await getWaterIntake();
        setWaterIntake(intake);
        setWaterConfettiTriggered(intake >= waterGoalMl);
      } catch (error) {
        console.error('Error loading water intake:', error);
        setWaterIntake(0);
      } finally {
        setIsLoadingWater(false);
      }
    };
    
    loadWaterIntake();
    loadDailyCalories();
    
    // Set up interval to check for date changes (every minute)
    const interval = setInterval(() => {
      loadWaterIntake();
      loadDailyCalories();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [waterGoalMl]);
  const loadDailyCalories = async () => {
    setIsLoadingCalories(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = getEffectiveDate();
      const {
        data,
        error
      } = await supabase.from('consumed_meals').select('calories').eq('user_id', user.id).eq('meal_date', today);
      if (error) throw error;
      const total = data?.reduce((sum, meal) => sum + meal.calories, 0) || 0;
      setTotalCalories(total);
      if (total >= calorieGoal) {
        celebrateCompletion();
      }
    } catch (error) {
      console.error('Error loading calories:', error);
      setTotalCalories(0);
    } finally {
      setIsLoadingCalories(false);
    }
  };
  
  // Reload data when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadWaterIntake = async () => {
          try {
            const intake = await getWaterIntake();
            setWaterIntake(intake);
            setWaterConfettiTriggered(intake >= waterGoalMl);
          } catch (error) {
            console.error('Error loading water intake:', error);
          }
        };
        loadWaterIntake();
        loadDailyCalories();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [waterGoalMl]);
  
  const handleMealAdded = async () => {
    await loadDailyCalories();
    // Força atualização do histórico incrementando um contador
    setMealHistoryKey(prev => prev + 1);
  };
  const handleAddWater = async () => {
    try {
      // Play drinking sound
      if (soundEnabled) {
        waterSound.playDrinkingSound();
      }
      
      const newIntake = await addWaterIntake(200);
      setWaterIntake(newIntake);
      
      toast({
        title: "Água adicionada! 💧",
        description: `Você bebeu ${newIntake}ml de ${waterGoalMl}ml hoje`
      });
      
      if (newIntake >= waterGoalMl && !waterConfettiTriggered) {
        celebrateCompletion();
        setWaterConfettiTriggered(true);

        // Play achievement sound
        if (soundEnabled) {
          setTimeout(() => waterSound.playAchievementSound(), 300);
        }
        
        toast({
          title: "Meta de água atingida! 🎉",
          description: "Parabéns! Você completou sua meta de hidratação hoje!"
        });
      }
    } catch (error) {
      console.error('Error adding water:', error);
      toast({
        title: "Erro ao adicionar água",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };
  const hasAllergies = quizData.allergies && quizData.allergies !== "none";
  return <div className="space-y-6 pb-20">
      {/* Goal Editor */}
      <div className="flex justify-end">
        <GoalEditor defaultCalories={calculatedGoals.calories} defaultWater={calculatedGoals.waterMl} onGoalsUpdated={handleGoalsUpdated} />
      </div>

      <MealPhotoCapture onMealAdded={handleMealAdded} quizData={quizData} />

      {/* Calorie Counter */}
      <AnimatedCard delay={0} enableParallax={true} className="p-6 bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Calorias de Hoje</h3>
            <Badge variant="outline" className="text-sm">
              {totalCalories} / {calorieGoal} kcal
            </Badge>
          </div>
          
          <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out" style={{
            width: `${Math.min(calorieProgress, 100)}%`
          }} />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {calorieProgress >= 100 ? "Meta de calorias atingida! 🎉" : `Faltam ${calorieGoal - totalCalories} kcal para sua meta`}
          </p>
        </div>
      </AnimatedCard>

      {/* Water Intake Tracker */}
      <AnimatedCard delay={0.1} enableParallax={true} className="p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 border-blue-500/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-foreground">Água de Hoje</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {waterIntake} / {waterGoalMl} ml
              </Badge>
              
            </div>
          </div>
          
          {/* Animated water glass */}
          <motion.div initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          duration: 0.5
        }}>
            <WaterGlass percentage={waterProgress} />
          </motion.div>

          <Button onClick={handleAddWater} variant="outline" className="w-full hover:bg-blue-500/10 hover:border-blue-500/50 transition-all" disabled={isLoadingWater}>
            <Droplet className="h-4 w-4 mr-2" />
            Bebi um copo (200ml)
          </Button>

          <motion.p className="text-sm text-muted-foreground text-center" key={waterProgress >= 100 ? "complete" : "incomplete"} initial={{
          opacity: 0,
          y: -5
        }} animate={{
          opacity: 1,
          y: 0
          }} transition={{
            duration: 0.3
          }}>
            {waterProgress >= 100 ? "🎉 Meta de hidratação atingida! Parabéns!" : `Faltam ${waterGoalMl - waterIntake}ml para sua meta`}
          </motion.p>
        </div>
      </AnimatedCard>

      {/* Meal History */}
      <MealHistory key={mealHistoryKey} onMealUpdated={loadDailyCalories} />

      {/* Meal Suggestions Accordion */}
      <AnimatedCard delay={0.2} enableParallax={true} className="p-6">
        <div className="space-y-4">
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3
        }}>
            <h3 className="text-xl font-semibold text-foreground">Sugestões de Refeições</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em cada refeição para ver as sugestões personalizadas. As variações mudam diariamente!
            </p>
          </motion.div>
          
          <Accordion type="single" collapsible className="w-full">
            {meals.map((meal, index) => {
            const Icon = meal.icon;
            const currentVariation = meal.variations[mealVariations[index]];
            const nextVariation = () => {
              setMealVariations(prev => {
                const newVariations = [...prev];
                newVariations[index] = (newVariations[index] + 1) % 3;
                return newVariations;
              });
            };
            const prevVariation = () => {
              setMealVariations(prev => {
                const newVariations = [...prev];
                newVariations[index] = (newVariations[index] - 1 + 3) % 3;
                return newVariations;
              });
            };
            return <AccordionItem key={index} value={`meal-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <motion.div className="flex items-center gap-3 flex-1" whileHover={{
                  x: 4
                }} transition={{
                  duration: 0.2
                }}>
                      <motion.div className="p-2 rounded-lg bg-muted" whileHover={{
                    scale: 1.1,
                    rotate: 5
                  }} transition={{
                    duration: 0.2
                  }}>
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
                      <div className="flex items-center justify-between flex-1 text-left">
                        <span className="font-semibold">{meal.name}</span>
                        <Badge variant="secondary" className="mr-2">
                          {meal.calories}
                        </Badge>
                      </div>
                    </motion.div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <motion.div initial={{
                  opacity: 0,
                  y: -10
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -10
                }} transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }} className="space-y-4 pt-4 pl-4 sm:pl-14">
                      {/* Variation navigation */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={prevVariation} className="h-8 w-8 p-0">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            Variação {mealVariations[index] + 1}/3
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={nextVariation} className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div key={mealVariations[index]} initial={{
                      opacity: 0,
                      x: 20
                    }} animate={{
                      opacity: 1,
                      x: 0
                    }} exit={{
                      opacity: 0,
                      x: -20
                    }} transition={{
                      duration: 0.3
                    }} className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Sugestão:</h4>
                            <motion.ul className="space-y-1" initial="hidden" animate="visible" variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.05
                            }
                          }
                        }}>
                              {currentVariation.foods.map((food, foodIndex) => <motion.li key={foodIndex} variants={{
                            hidden: {
                              opacity: 0,
                              x: -10
                            },
                            visible: {
                              opacity: 1,
                              x: 0
                            }
                          }} className="text-sm text-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{food}</span>
                                </motion.li>)}
                            </motion.ul>
                          </div>
                          
                          <motion.div className="pt-2 border-t border-border/50" initial={{
                        opacity: 0
                      }} animate={{
                        opacity: 1
                      }} transition={{
                        delay: 0.2,
                        duration: 0.3
                      }}>
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{currentVariation.why}</p>
                            </div>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>;
          })}
          </Accordion>
        </div>
      </AnimatedCard>

      {/* Nutritional Tips */}
      <AnimatedCard delay={0.3} enableParallax={true} className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
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
              {hasAllergies && <li className="flex items-start gap-2 text-orange-600 dark:text-orange-400 font-medium">
                  <span className="mt-1">⚠️</span>
                  <span>Atenção às suas alergias/restrições: {quizData.allergies}</span>
                </li>}
            </ul>
          </div>
        </AnimatedCard>
      </div>;
  }