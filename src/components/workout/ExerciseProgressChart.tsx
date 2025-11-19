import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Weight, Repeat } from "lucide-react";

interface ExerciseLog {
  date: string;
  sets: Array<{
    weight?: number;
    reps?: number;
  }>;
}

interface ExerciseProgressChartProps {
  exerciseName: string;
  logs: ExerciseLog[];
}

const ExerciseProgressChart = ({ exerciseName, logs }: ExerciseProgressChartProps) => {
  // Process data for charts
  const chartData = logs.map(log => {
    const date = parseISO(log.date);
    
    // Calculate averages for the session
    const weights = log.sets.map(s => s.weight || 0).filter(w => w > 0);
    const reps = log.sets.map(s => s.reps || 0).filter(r => r > 0);
    
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const maxReps = reps.length > 0 ? Math.max(...reps) : 0;

    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
      avgWeight: Math.round(avgWeight * 10) / 10,
      maxWeight: Math.round(maxWeight * 10) / 10,
      avgReps: Math.round(avgReps * 10) / 10,
      maxReps: Math.round(maxReps * 10) / 10,
    };
  }).reverse(); // Show oldest to newest

  const hasWeightData = chartData.some(d => d.avgWeight > 0);
  const hasRepsData = chartData.some(d => d.avgReps > 0);

  if (!hasWeightData && !hasRepsData) {
    return null;
  }

  // Calculate progress percentage
  const firstEntry = chartData[0];
  const lastEntry = chartData[chartData.length - 1];
  
  const weightProgress = hasWeightData && firstEntry.avgWeight > 0
    ? Math.round(((lastEntry.avgWeight - firstEntry.avgWeight) / firstEntry.avgWeight) * 100)
    : 0;
  
  const repsProgress = hasRepsData && firstEntry.avgReps > 0
    ? Math.round(((lastEntry.avgReps - firstEntry.avgReps) / firstEntry.avgReps) * 100)
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold mb-1">{exerciseName}</h3>
          <p className="text-sm text-muted-foreground">
            {chartData.length} registro{chartData.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-4">
          {hasWeightData && weightProgress !== 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
              <Weight className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className={`text-sm font-bold ${weightProgress > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {weightProgress > 0 ? '+' : ''}{weightProgress}%
                </p>
              </div>
            </div>
          )}
          {hasRepsData && repsProgress !== 0 && (
            <div className="flex items-center gap-2 bg-secondary/10 px-3 py-2 rounded-lg">
              <Repeat className="h-4 w-4 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">Reps</p>
                <p className={`text-sm font-bold ${repsProgress > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {repsProgress > 0 ? '+' : ''}{repsProgress}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {hasWeightData && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Weight className="h-4 w-4 text-primary" />
              Evolução de Peso (kg)
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgWeight" 
                  name="Peso Médio"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxWeight" 
                  name="Peso Máximo"
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--secondary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasRepsData && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Repeat className="h-4 w-4 text-accent" />
              Evolução de Repetições
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgReps" 
                  name="Reps Médias"
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxReps" 
                  name="Reps Máximas"
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--secondary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExerciseProgressChart;
