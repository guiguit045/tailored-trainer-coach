const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

export interface ExerciseVideo {
  id: string;
  name: string;
  gifUrl: string;
  target: string;
  bodyPart: string;
  equipment: string;
  instructions: string[];
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
    const searchTerms = translateExerciseName(exerciseName);
    
    console.log('Buscando exercício:', exerciseName);
    console.log('Termos de busca:', searchTerms);
    
    // Tenta buscar com cada termo de busca
    for (const searchTerm of searchTerms) {
      const encodedTerm = searchTerm.replace(/\s+/g, '%20');
      
      const response = await fetch(
        `https://${RAPIDAPI_HOST}/exercises/name/${encodedTerm}?limit=3`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': RAPIDAPI_KEY || '',
          },
        }
      );

      if (!response.ok) {
        console.error('ExerciseDB API error:', response.status, await response.text());
        continue;
      }

      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (data && data.length > 0) {
        const exercise = data[0];
        return {
          id: exercise.id,
          name: exercise.name,
          gifUrl: exercise.gifUrl,
          target: exercise.target,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          instructions: exercise.instructions || [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching exercise from ExerciseDB:', error);
    return null;
  }
}
