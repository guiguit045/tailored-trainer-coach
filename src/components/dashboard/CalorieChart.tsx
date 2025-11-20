import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { getEffectiveDate } from "@/lib/dateUtils";

export default function CalorieChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyCalories();
  }, []);

  const fetchWeeklyCalories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data, error } = await supabase
        .from("consumed_meals")
        .select("calories, meal_date")
        .eq("user_id", user.id)
        .gte("meal_date", format(sevenDaysAgo, 'yyyy-MM-dd'))
        .order("meal_date", { ascending: true });

      if (error) throw error;

      // Group by date and sum calories
      const groupedData: { [key: string]: number } = {};
      
      // Initialize all 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        groupedData[dateStr] = 0;
      }

      // Sum calories for each day
      data?.forEach((meal) => {
        if (groupedData[meal.meal_date] !== undefined) {
          groupedData[meal.meal_date] += meal.calories;
        }
      });

      // Convert to chart format
      const formatted = Object.entries(groupedData).map(([date, calories]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        calories,
      }));

      setChartData(formatted);
    } catch (error) {
      console.error("Error fetching calorie data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card className="p-6"><p>Carregando...</p></Card>;
  }

  const totalWeekCalories = chartData.reduce((sum, day) => sum + day.calories, 0);
  const avgDailyCalories = Math.round(totalWeekCalories / 7);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Calorias da Semana</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Média diária</p>
          <p className="text-2xl font-bold text-primary">{avgDailyCalories} kcal</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="calories"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
            name="Calorias"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Total da semana: <span className="font-bold text-foreground">{totalWeekCalories.toLocaleString()} kcal</span>
        </p>
      </div>
    </Card>
  );
}
