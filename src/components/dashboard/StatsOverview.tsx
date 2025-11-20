import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Flame, Droplet, Target } from "lucide-react";

interface Stats {
  totalWorkouts: number;
  weeklyWorkouts: number;
  totalCalories: number;
  weeklyWater: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    totalCalories: 0,
    weeklyWater: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const weekStart = sevenDaysAgo.toISOString().split('T')[0];

      // Total workouts (all time)
      const { count: totalWorkouts } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      // Weekly workouts
      const { count: weeklyWorkouts } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart);

      // Weekly calories
      const { data: mealsData } = await supabase
        .from("consumed_meals")
        .select("calories")
        .eq("user_id", user.id)
        .gte("meal_date", weekStart);

      const totalCalories = mealsData?.reduce((sum, meal) => sum + meal.calories, 0) || 0;

      // Weekly water
      const { data: waterData } = await supabase
        .from("water_intake")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("intake_date", weekStart);

      const weeklyWater = waterData?.reduce((sum, entry) => sum + entry.amount_ml, 0) || 0;

      setStats({
        totalWorkouts: totalWorkouts || 0,
        weeklyWorkouts: weeklyWorkouts || 0,
        totalCalories,
        weeklyWater,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card className="p-6"><p>Carregando estatísticas...</p></Card>;
  }

  const statCards = [
    {
      icon: Dumbbell,
      label: "Treinos Esta Semana",
      value: stats.weeklyWorkouts,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Target,
      label: "Total de Treinos",
      value: stats.totalWorkouts,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Flame,
      label: "Calorias (7 dias)",
      value: stats.totalCalories.toLocaleString(),
      suffix: "kcal",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Droplet,
      label: "Água (7 dias)",
      value: (stats.weeklyWater / 1000).toFixed(1),
      suffix: "L",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">
                {stat.value} {stat.suffix && <span className="text-sm font-normal">{stat.suffix}</span>}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
