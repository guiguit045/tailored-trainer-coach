import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateProgressionSuggestion,
  detectPlateau,
  getPlateauBreakStrategy,
  type ProgressionSuggestion as ProgressionSuggestionType,
} from "@/lib/progressionSystem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProgressionSuggestionProps {
  exerciseName: string;
  currentSets: string;
  currentReps: string;
  currentWeight: string;
  exerciseType?: "compound" | "isolation";
  onApplySuggestion?: (suggestion: ProgressionSuggestionType) => void;
}

export const ProgressionSuggestion = ({
  exerciseName,
  currentSets,
  currentReps,
  currentWeight,
  exerciseType = "compound",
  onApplySuggestion,
}: ProgressionSuggestionProps) => {
  const [suggestion, setSuggestion] = useState<ProgressionSuggestionType | null>(null);
  const [hasPlateaued, setHasPlateaued] = useState(false);
  const [plateauStrategies, setPlateauStrategies] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSuggestion = async () => {
      setIsLoading(true);
      
      // Calcular sugestão de progressão
      const prog = await calculateProgressionSuggestion(
        exerciseName,
        currentSets,
        currentReps,
        currentWeight,
        exerciseType
      );
      setSuggestion(prog);

      // Detectar platô
      const plateaued = await detectPlateau(exerciseName, 4);
      setHasPlateaued(plateaued);

      if (plateaued) {
        const strategies = await getPlateauBreakStrategy(exerciseName);
        setPlateauStrategies(strategies);
      }

      setIsLoading(false);
    };

    loadSuggestion();
  }, [exerciseName, currentSets, currentReps, currentWeight, exerciseType]);

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/30 animate-pulse">
        <div className="h-16 bg-muted rounded"></div>
      </Card>
    );
  }

  if (!suggestion) {
    return null;
  }

  const getIcon = () => {
    if (suggestion.currentValue === suggestion.suggestedValue) {
      return <Minus className="w-5 h-5" />;
    }
    if (suggestion.type === "weight" || suggestion.type === "reps" || suggestion.type === "sets") {
      return <TrendingUp className="w-5 h-5" />;
    }
    return <TrendingDown className="w-5 h-5" />;
  };

  const getColor = () => {
    if (suggestion.confidence === "high") return "text-green-500 dark:text-green-400";
    if (suggestion.confidence === "medium") return "text-yellow-500 dark:text-yellow-400";
    return "text-orange-500 dark:text-orange-400";
  };

  const getBadgeVariant = () => {
    if (suggestion.confidence === "high") return "default";
    if (suggestion.confidence === "medium") return "secondary";
    return "outline";
  };

  const hasProgression = suggestion.currentValue !== suggestion.suggestedValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden border-2 transition-all ${
        hasProgression 
          ? "bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30" 
          : "bg-muted/30 border-muted"
      }`}>
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-full ${
              hasProgression ? "bg-primary/10" : "bg-muted"
            }`}>
              <div className={getColor()}>
                {getIcon()}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">
                  {hasProgression ? "🎯 Progressão Sugerida" : "✅ Continue assim"}
                </h4>
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {suggestion.confidence === "high" && "Alta confiança"}
                  {suggestion.confidence === "medium" && "Média confiança"}
                  {suggestion.confidence === "low" && "Baixa confiança"}
                </Badge>
              </div>

              {hasProgression && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-muted-foreground">{suggestion.currentValue}</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{suggestion.suggestedValue}</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {suggestion.reason}
              </p>

              {hasProgression && onApplySuggestion && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => onApplySuggestion(suggestion)}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Aplicar Progressão
                </Button>
              )}
            </div>
          </div>

          {/* Alerta de Platô */}
          {hasPlateaued && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 pt-3 border-t border-border"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between hover:bg-orange-500/10"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        Platô Detectado - Ver Estratégias
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <p className="text-xs text-muted-foreground mb-2">
                        Seu progresso estagnou nas últimas 4 semanas. Experimente uma destas estratégias:
                      </p>
                      {plateauStrategies.map((strategy, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border"
                        >
                          <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs leading-relaxed">
                            {strategy}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>
          )}

          {/* Info sobre o sistema */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Baseado na sua performance das últimas 2 semanas e princípios de sobrecarga progressiva.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
