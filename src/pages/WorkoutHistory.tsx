import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar as CalendarIcon, Dumbbell, Clock, TrendingUp, LineChart } from "lucide-react";
import { getWorkoutHistory } from "@/lib/workoutStorage";
import { format, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ExerciseProgressChart from "@/components/workout/ExerciseProgressChart";

interface WorkoutSession {
  id: string;
  day_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  exercise_logs: any[];
}

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getWorkoutHistory(100);
      setWorkoutSessions(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get dates with completed workouts
  const workoutDates = workoutSessions
    .filter(session => session.completed_at)
    .map(session => parseISO(session.completed_at!));

  // Check if a date has a workout
  const hasWorkout = (date: Date) => {
    return workoutDates.some(workoutDate => isSameDay(workoutDate, date));
  };

  // Get workouts for selected week
  const getWeekWorkouts = (date: Date) => {
    const weekStart = startOfWeek(date, { locale: ptBR });
    const weekEnd = endOfWeek(date, { locale: ptBR });

    return workoutSessions.filter(session => {
      if (!session.completed_at) return false;
      const sessionDate = parseISO(session.completed_at);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    }).sort((a, b) => 
      new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
    );
  };

  const selectedWeekWorkouts = selectedDate ? getWeekWorkouts(selectedDate) : [];

  // Group exercise logs by exercise name for progress tracking
  const exerciseProgress = workoutSessions.reduce((acc, session) => {
    if (!session.exercise_logs || session.exercise_logs.length === 0) return acc;
    
    session.exercise_logs.forEach((log: any) => {
      const exerciseName = log.exercise_name;
      if (!acc[exerciseName]) {
        acc[exerciseName] = [];
      }
      
      acc[exerciseName].push({
        date: session.completed_at!,
        sets: log.sets || [],
      });
    });
    
    return acc;
  }, {} as Record<string, Array<{ date: string; sets: any[] }>>);

  // Sort exercises by number of records (most tracked first) and take top 5
  const topExercises = Object.entries(exerciseProgress)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  // Calculate statistics
  const totalWorkouts = workoutSessions.filter(s => s.status === 'completed').length;
  const totalExercises = workoutSessions.reduce((sum, session) => 
    sum + (session.exercise_logs?.length || 0), 0
  );

  // Group workouts by week
  const groupedByWeek = workoutSessions.reduce((acc, session) => {
    if (!session.completed_at) return acc;
    
    const date = parseISO(session.completed_at);
    const weekStart = startOfWeek(date, { locale: ptBR });
    const weekKey = format(weekStart, "yyyy-MM-dd");

    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(session);
    return acc;
  }, {} as Record<string, WorkoutSession[]>);

  const weeks = Object.entries(groupedByWeek)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 8); // Show last 8 weeks

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="bg-gradient-hero text-primary-foreground py-6 px-4 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Histórico de Treinos</h1>
          <p className="text-sm opacity-90 mt-1">Acompanhe sua jornada fitness</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendário & Histórico
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Evolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Treinos</p>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercícios Realizados</p>
                <p className="text-2xl font-bold">{totalExercises}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semanas Ativas</p>
                <p className="text-2xl font-bold">{weeks.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Card */}
          <Card className="p-6 bg-gradient-card shadow-medium">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Calendário de Treinos</h3>
                <p className="text-sm text-muted-foreground">Selecione uma data para ver detalhes</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-lg border-2 shadow-sm pointer-events-auto bg-background"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-base font-bold",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-colors"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-12 font-semibold text-[0.9rem]",
                  row: "flex w-full mt-2",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                  day: cn(
                    "h-12 w-12 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                    "aria-selected:opacity-100"
                  ),
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent/50 text-accent-foreground font-bold border-2 border-primary",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  workout: workoutDates,
                }}
                modifiersClassNames={{
                  workout: "bg-green-500/20 text-green-700 font-bold border-2 border-green-500 hover:bg-green-500/30",
                }}
              />
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-green-500/20 border-2 border-green-500"></div>
                  <span className="text-muted-foreground">Treino realizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/50 border-2 border-primary"></div>
                  <span className="text-muted-foreground">Hoje</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Selected Week Workouts */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">
              {selectedDate && `Semana de ${format(startOfWeek(selectedDate, { locale: ptBR }), "dd MMM", { locale: ptBR })}`}
            </h3>
            {selectedWeekWorkouts.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedWeekWorkouts.map((session) => (
                  <Card key={session.id} className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold">{session.day_name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(session.completed_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                        Concluído
                      </Badge>
                    </div>
                    {session.exercise_logs && session.exercise_logs.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          {session.exercise_logs.length} exercícios realizados
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.exercise_logs.slice(0, 3).map((log: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {log.exercise_name}
                            </Badge>
                          ))}
                          {session.exercise_logs.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.exercise_logs.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum treino realizado nesta semana</p>
              </div>
            )}
          </Card>
        </div>

        {/* All Weeks History */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">Histórico Completo</h3>
          {weeks.length > 0 ? (
            <div className="space-y-6">
              {weeks.map(([weekKey, sessions]) => {
                const weekStart = parseISO(weekKey);
                const weekEnd = endOfWeek(weekStart, { locale: ptBR });
                
                return (
                  <div key={weekKey} className="border-l-4 border-primary/30 pl-4">
                    <h4 className="font-bold mb-3">
                      {format(weekStart, "dd MMM", { locale: ptBR })} - {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
                      <Badge variant="outline" className="ml-2">
                        {sessions.length} treino{sessions.length !== 1 ? 's' : ''}
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sessions.map((session) => (
                        <Card key={session.id} className="p-4 bg-muted/20">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-semibold text-sm">{session.day_name}</h5>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(session.completed_at!), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          {session.exercise_logs && session.exercise_logs.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {session.exercise_logs.length} exercícios
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Nenhum treino realizado ainda</p>
              <p className="text-sm mt-2">Comece seu primeiro treino para ver seu progresso aqui!</p>
              <Button
                onClick={() => navigate("/dashboard?tab=workout")}
                className="mt-4"
              >
                Iniciar Treino
              </Button>
            </div>
          )}
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Progress Charts */}
          {topExercises.length > 0 ? (
            <>
              <Card className="p-6 bg-gradient-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Evolução dos Exercícios</h2>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe seu progresso em peso e repetições
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                {topExercises.map(([exerciseName, logs]) => (
                  <ExerciseProgressChart
                    key={exerciseName}
                    exerciseName={exerciseName}
                    logs={logs}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">Nenhum dado de progresso ainda</h3>
              <p className="text-muted-foreground mb-4">
                Complete treinos e registre seu peso e repetições para ver sua evolução aqui
              </p>
              <Button onClick={() => navigate("/dashboard?tab=workout")}>
                Iniciar Treino
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
};

export default WorkoutHistory;
