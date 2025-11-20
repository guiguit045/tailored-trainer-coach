import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, History, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { getEffectiveDate } from "@/lib/dateUtils";
import { ptBR } from "date-fns/locale";

interface ConsumedMeal {
  id: string;
  meal_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  photo_url: string | null;
  created_at: string;
}

interface MealHistoryProps {
  onMealUpdated: () => void;
}

export default function MealHistory({ onMealUpdated }: MealHistoryProps) {
  const { toast } = useToast();
  const [meals, setMeals] = useState<ConsumedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<ConsumedMeal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    meal_name: "",
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getEffectiveDate();
      
      const { data, error } = await supabase
        .from('consumed_meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMeals(data || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o histórico de refeições.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (meal: ConsumedMeal) => {
    setSelectedMeal(meal);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (meal: ConsumedMeal) => {
    setSelectedMeal(meal);
    setEditForm({
      meal_name: meal.meal_name,
      calories: meal.calories,
      carbs: meal.carbs,
      protein: meal.protein,
      fat: meal.fat,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMeal) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('consumed_meals')
        .delete()
        .eq('id', selectedMeal.id);

      if (error) throw error;

      toast({
        title: "Refeição removida",
        description: "A refeição foi removida do seu histórico.",
      });

      await loadMeals();
      onMealUpdated();
      setDeleteDialogOpen(false);
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a refeição.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMeal) return;

    // Validate inputs
    if (!editForm.meal_name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a refeição.",
        variant: "destructive",
      });
      return;
    }

    if (editForm.calories < 0 || editForm.carbs < 0 || editForm.protein < 0 || editForm.fat < 0) {
      toast({
        title: "Valores inválidos",
        description: "Os valores nutricionais não podem ser negativos.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('consumed_meals')
        .update({
          meal_name: editForm.meal_name.trim(),
          calories: editForm.calories,
          carbs: editForm.carbs,
          protein: editForm.protein,
          fat: editForm.fat,
        })
        .eq('id', selectedMeal.id);

      if (error) throw error;

      toast({
        title: "Refeição atualizada! ✅",
        description: "As informações foram atualizadas com sucesso.",
      });

      await loadMeals();
      onMealUpdated();
      setEditDialogOpen(false);
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error updating meal:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a refeição.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando histórico...</span>
        </div>
      </Card>
    );
  }

  if (meals.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <History className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center">
            Nenhuma refeição registrada hoje
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Histórico de Hoje</h3>
            <Badge variant="secondary">{meals.length} refeições</Badge>
          </div>

          <div className="space-y-3">
            {meals.map((meal) => (
              <Card key={meal.id} className="p-4">
                <div className="space-y-3">
                  {/* Header with photo and main info */}
                  <div className="flex items-start gap-3">
                    {/* Meal Photo */}
                    {meal.photo_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={meal.photo_url} 
                          alt={meal.meal_name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Meal Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-semibold text-foreground truncate">{meal.meal_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(meal.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {meal.calories} kcal
                      </Badge>
                    </div>

                    {/* Action Buttons - Desktop */}
                    <div className="hidden sm:flex flex-col gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(meal)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(meal)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Nutritional Info */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="text-muted-foreground">Carb</div>
                      <div className="font-medium text-foreground">{meal.carbs}g</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="text-muted-foreground">Prot</div>
                      <div className="font-medium text-foreground">{meal.protein}g</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="text-muted-foreground">Gord</div>
                      <div className="font-medium text-foreground">{meal.fat}g</div>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile */}
                  <div className="flex sm:hidden gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(meal)}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(meal)}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover refeição?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{selectedMeal?.meal_name}" do seu histórico?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Refeição</DialogTitle>
            <DialogDescription>
              Atualize as informações nutricionais da refeição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meal_name">Nome da refeição</Label>
              <Input
                id="meal_name"
                value={editForm.meal_name}
                onChange={(e) => setEditForm({ ...editForm, meal_name: e.target.value })}
                placeholder="Ex: Café da manhã"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                max="10000"
                value={editForm.calories}
                onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="carbs">Carboidratos (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  max="1000"
                  value={editForm.carbs}
                  onChange={(e) => setEditForm({ ...editForm, carbs: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="protein">Proteínas (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  max="1000"
                  value={editForm.protein}
                  onChange={(e) => setEditForm({ ...editForm, protein: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat">Gorduras (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  max="1000"
                  value={editForm.fat}
                  onChange={(e) => setEditForm({ ...editForm, fat: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}