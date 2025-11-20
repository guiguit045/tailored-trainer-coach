import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MealData {
  meal_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface MealPhotoCaptureProps {
  onMealAdded: () => void;
}

export default function MealPhotoCapture({ onMealAdded }: MealPhotoCaptureProps) {
  const { toast } = useToast();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCapturedImage(base64String);
      analyzeMeal(base64String);
    };
    reader.readAsDataURL(file);
  };

  const analyzeMeal = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setMealData(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-meal-photo', {
        body: { imageBase64 }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setMealData(data.data);
        toast({
          title: "Refeição analisada! 🍽️",
          description: `${data.data.meal_name}: ${data.data.calories} kcal`,
        });
      } else {
        throw new Error(data?.error || 'Falha na análise');
      }
    } catch (error) {
      console.error('Error analyzing meal:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a refeição. Tente novamente.",
        variant: "destructive",
      });
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMeal = async () => {
    if (!mealData) return;

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('consumed_meals')
        .insert({
          user_id: user.id,
          meal_name: mealData.meal_name,
          calories: mealData.calories,
          carbs: mealData.carbs,
          protein: mealData.protein,
          fat: mealData.fat,
          photo_url: capturedImage,
        });

      if (error) throw error;

      toast({
        title: "Refeição registrada! ✅",
        description: `+${mealData.calories} kcal adicionadas ao seu dia`,
      });

      // Reset state
      setCapturedImage(null);
      setMealData(null);
      onMealAdded();

    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar a refeição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setMealData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        {!capturedImage ? (
          <>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Registrar Refeição</h3>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
              id="meal-photo-input"
            />
            
            <label htmlFor="meal-photo-input">
              <Button className="w-full" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Câmera
                </span>
              </Button>
            </label>

            <p className="text-sm text-muted-foreground text-center">
              Tire uma foto da sua refeição para análise nutricional automática
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={capturedImage} 
                alt="Captured meal" 
                className="w-full h-48 object-cover"
              />
            </div>

            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analisando refeição...</span>
              </div>
            ) : mealData ? (
              <div className="space-y-3">
                <div className="bg-background/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-foreground">{mealData.meal_name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calorias:</span>
                      <span className="ml-2 font-medium text-foreground">{mealData.calories} kcal</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carboidratos:</span>
                      <span className="ml-2 font-medium text-foreground">{mealData.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proteínas:</span>
                      <span className="ml-2 font-medium text-foreground">{mealData.protein}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gorduras:</span>
                      <span className="ml-2 font-medium text-foreground">{mealData.fat}g</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddMeal}
                    disabled={isAdding}
                    className="flex-1"
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Comer
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isAdding}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}