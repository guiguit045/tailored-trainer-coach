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

export async function searchExerciseByName(exerciseName: string): Promise<ExerciseVideo | null> {
  try {
    // Normalize exercise name for search
    const searchTerm = exerciseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/\s+/g, '%20');

    const response = await fetch(
      `https://${RAPIDAPI_HOST}/exercises/name/${searchTerm}?limit=1`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY || '',
        },
      }
    );

    if (!response.ok) {
      console.error('ExerciseDB API error:', response.status);
      return null;
    }

    const data = await response.json();
    
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

    return null;
  } catch (error) {
    console.error('Error fetching exercise from ExerciseDB:', error);
    return null;
  }
}
