import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Flame, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoalEditorProps {
  defaultCalories: number;
  defaultWater: number;
  onGoalsUpdated: (calories: number, water: number) => void;
}

export default function GoalEditor({ defaultCalories, defaultWater, onGoalsUpdated }: GoalEditorProps) {
  const [open, setOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(defaultCalories.toString());
  const [waterGoal, setWaterGoal] = useState(defaultWater.toString());
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomGoals();
  }, []);

  const fetchCustomGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.daily_calorie_goal) {
          setCalorieGoal(data.daily_calorie_goal.toString());
          onGoalsUpdated(data.daily_calorie_goal, data.daily_water_goal_ml || defaultWater);
        }
        if (data.daily_water_goal_ml) {
          setWaterGoal(data.daily_water_goal_ml.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const saveGoals = async () => {
    const calories = parseInt(calorieGoal);
    const water = parseInt(waterGoal);

    if (isNaN(calories) || calories < 1000 || calories > 5000) {
      toast({
        title: "Valor inválido",
        description: "As calorias devem estar entre 1000 e 5000.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(water) || water < 1000 || water > 10000) {
      toast({
        title: "Valor inválido",
        description: "A quantidade de água deve estar entre 1000ml e 10000ml.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_goals")
        .upsert({
          user_id: user.id,
          daily_calorie_goal: calories,
          daily_water_goal_ml: water,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      onGoalsUpdated(calories, water);
      setOpen(false);

      toast({
        title: "Metas atualizadas!",
        description: "Suas metas personalizadas foram salvas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Editar Metas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Personalizar Metas Diárias</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calories" className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Meta de Calorias (kcal/dia)
            </Label>
            <Input
              id="calories"
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              placeholder="Ex: 2000"
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: {defaultCalories} kcal (baseado no seu perfil)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="water" className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-500" />
              Meta de Água (ml/dia)
            </Label>
            <Input
              id="water"
              type="number"
              value={waterGoal}
              onChange={(e) => setWaterGoal(e.target.value)}
              placeholder="Ex: 2500"
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: {defaultWater} ml (baseado no seu peso e atividade)
            </p>
          </div>

          <Button onClick={saveGoals} className="w-full">
            Salvar Metas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
