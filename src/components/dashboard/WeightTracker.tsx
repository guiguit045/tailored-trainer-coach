import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface WeightLog {
  id: string;
  weight: number;
  log_date: string;
}

export default function WeightTracker() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeightLogs();
  }, []);

  const fetchWeightLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("body_weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (error) throw error;
      setWeightLogs(data || []);
    } catch (error) {
      console.error("Error fetching weight logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const addWeightLog = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Peso inválido",
        description: "Por favor, insira um peso válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("body_weight_logs")
        .insert({
          user_id: user.id,
          weight,
          log_date: format(new Date(), 'yyyy-MM-dd'),
        });

      if (error) throw error;

      toast({
        title: "Peso registrado!",
        description: `${weight} kg adicionado ao seu histórico.`,
      });

      setNewWeight("");
      fetchWeightLogs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWeightTrend = () => {
    if (weightLogs.length < 2) return null;
    const latest = weightLogs[weightLogs.length - 1].weight;
    const previous = weightLogs[weightLogs.length - 2].weight;
    const diff = latest - previous;
    return { diff: Math.abs(diff), isUp: diff > 0, isStable: Math.abs(diff) < 0.5 };
  };

  const chartData = weightLogs.map(log => ({
    date: new Date(log.log_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: log.weight,
  }));

  const trend = getWeightTrend();

  if (loading) {
    return <Card className="p-6"><p>Carregando...</p></Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold">Evolução do Peso</h3>
      </div>

      <div className="space-y-6">
        {/* Add weight form */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="weight">Peso atual (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Ex: 75.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addWeightLog}>Registrar</Button>
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {trend.isStable ? (
              <Minus className="w-5 h-5 text-blue-500" />
            ) : trend.isUp ? (
              <TrendingUp className="w-5 h-5 text-orange-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {trend.isStable
                ? "Peso estável"
                : `${trend.isUp ? "↑" : "↓"} ${trend.diff.toFixed(1)} kg desde último registro`}
            </span>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Registre seu peso para visualizar a evolução</p>
          </div>
        )}

        {/* Latest weight */}
        {weightLogs.length > 0 && (
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Peso Atual</p>
            <p className="text-3xl font-bold text-primary">
              {weightLogs[weightLogs.length - 1].weight} kg
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
