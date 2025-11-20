import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = 'exercisedb_cache';
const CACHE_EXPIRATION_DAYS = 7;

export interface ExerciseVideo {
  id: string;
  name: string;
  gifUrl: string;
  target: string;
  bodyPart: string;
  equipment: string;
  instructions: string[];
}

interface CachedExercise extends ExerciseVideo {
  cachedAt: number;
}

interface ExerciseCache {
  [exerciseName: string]: CachedExercise;
}

// Funções de cache
function getCache(): ExerciseCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Erro ao ler cache:', error);
    return {};
  }
}

function setCache(cache: ExerciseCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

function getCachedExercise(exerciseName: string): ExerciseVideo | null {
  const cache = getCache();
  const normalizedName = exerciseName.toLowerCase().trim();
  const cached = cache[normalizedName];
  
  if (!cached) return null;
  
  // Verifica se o cache expirou
  const now = Date.now();
  const expirationTime = CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  
  if (now - cached.cachedAt > expirationTime) {
    console.log('Cache expirado para:', exerciseName);
    return null;
  }
  
  console.log('Exercício encontrado no cache:', exerciseName);
  return {
    id: cached.id,
    name: cached.name,
    gifUrl: cached.gifUrl,
    target: cached.target,
    bodyPart: cached.bodyPart,
    equipment: cached.equipment,
    instructions: cached.instructions,
  };
}

function cacheExercise(exerciseName: string, exercise: ExerciseVideo): void {
  const cache = getCache();
  const normalizedName = exerciseName.toLowerCase().trim();
  
  cache[normalizedName] = {
    ...exercise,
    cachedAt: Date.now(),
  };
  
  setCache(cache);
  console.log('Exercício salvo no cache:', exerciseName);
}

export function clearExerciseCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('Cache de exercícios limpo');
}

// Mapeamento de exercícios PT -> EN para melhor correspondência
const exerciseTranslations: Record<string, string> = {
  // Peito
  "supino inclinado com halteres": "dumbbell incline press",
  "supino reto com barra": "barbell bench press",
  "crossover": "cable crossover",
  "fly na máquina": "machine chest fly",
  "flexão": "push up",
  
  // Tríceps
  "tríceps testa": "dumbbell lying triceps extension",
  "extensão de tríceps": "cable triceps pushdown",
  "mergulho": "triceps dip",
  
  // Costas
  "puxada frontal": "cable lat pulldown",
  "remada curvada": "dumbbell bent over row",
  "remada baixa": "cable seated row",
  
  // Bíceps
  "rosca direta": "barbell curl",
  "rosca martelo": "dumbbell hammer curl",
  
  // Ombros
  "desenvolvimento militar": "dumbbell shoulder press",
  "elevação lateral": "dumbbell lateral raise",
  "crucifixo inverso": "cable reverse fly",
  
  // Pernas
  "agachamento": "barbell squat",
  "leg press": "leg press",
  "extensão de joelhos": "leg extension",
  "flexão de joelhos": "leg curl",
  "panturrilha": "calf raise",
  
  // Abdômen
  "prancha": "plank",
  "abdominal": "crunch",
};

function translateExerciseName(exerciseName: string): string[] {
  const normalized = exerciseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
  
  // Busca por correspondência exata no mapeamento
  if (exerciseTranslations[normalized]) {
    return [exerciseTranslations[normalized]];
  }
  
  // Busca por correspondências parciais
  const searchTerms: string[] = [];
  
  for (const [ptName, enName] of Object.entries(exerciseTranslations)) {
    if (normalized.includes(ptName) || ptName.includes(normalized)) {
      searchTerms.push(enName);
    }
  }
  
  // Se não encontrou nada, tenta buscar pela palavra-chave mais importante
  const keywords = normalized.split(/\s+/);
  for (const keyword of keywords) {
    if (keyword.length > 4) { // Ignora palavras muito curtas
      for (const [ptName, enName] of Object.entries(exerciseTranslations)) {
        if (ptName.includes(keyword)) {
          searchTerms.push(enName);
        }
      }
    }
  }
  
  // Se ainda não encontrou nada, retorna o nome original
  if (searchTerms.length === 0) {
    searchTerms.push(normalized);
  }
  
  return [...new Set(searchTerms)]; // Remove duplicatas
}

export async function searchExerciseByName(exerciseName: string): Promise<ExerciseVideo | null> {
  try {
    // Verifica o cache primeiro
    const cachedExercise = getCachedExercise(exerciseName);
    if (cachedExercise) {
      return cachedExercise;
    }
    
    const searchTerms = translateExerciseName(exerciseName);
    
    console.log('Buscando exercício (não encontrado no cache):', exerciseName);
    console.log('Termos de busca:', searchTerms);
    
    // Tenta buscar com cada termo de busca via edge function
    for (const searchTerm of searchTerms) {
      try {
        const { data, error } = await supabase.functions.invoke('search-exercise', {
          body: { exerciseName: searchTerm }
        });

        if (error) {
          console.error(`Erro ao buscar "${searchTerm}":`, error);
          continue;
        }

        if (data && !data.error) {
          const exerciseData: ExerciseVideo = data;
          
          // Salva no cache
          cacheExercise(exerciseName, exerciseData);
          console.log('Exercício encontrado e cacheado:', exerciseName);
          
          return exerciseData;
        }
      } catch (searchError) {
        console.error(`Erro ao buscar "${searchTerm}":`, searchError);
        continue;
      }
    }

    console.log('Nenhum exercício encontrado após tentar todos os termos');
    return null;
  } catch (error) {
    console.error('Error fetching exercise from ExerciseDB:', error);
    return null;
  }
}
