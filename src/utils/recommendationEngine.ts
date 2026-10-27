import { UserPreferences, Track, RecommendationReason, AiPlaylist } from '../types/smartAudio';
import { TRACK_CATALOG } from '../data/trackCatalog';

const PREFS_STORAGE_KEY = 'motor_sound_user_preferences_v8';
const PLAYLISTS_STORAGE_KEY = 'motor_sound_ai_playlists_v8';

export const getStoredPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar preferências locais:', e);
  }
  return {
    likedTrackIds: ['trk-1'],
    dislikedTrackIds: [],
    skippedTrackIds: [],
    playedHistory: [
      { trackId: 'trk-1', playedAt: new Date().toISOString(), completed: true }
    ],
    favoriteGenres: { 'Euro Dance / Automotive': 3, 'Synthwave': 2 },
    favoriteMoods: { 'Eufórico': 2, 'Animado': 1 },
    favoriteActivities: { 'Estrada/Corrida': 3 },
    voiceCommandLog: [],
  };
};

export const savePreferences = (prefs: UserPreferences) => {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Erro ao salvar preferências:', e);
  }
};

export const getStoredPlaylists = (): AiPlaylist[] => {
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar playlists:', e);
  }
  return [
    {
      id: 'pl-init-1',
      title: 'V8 Asphalt Rush',
      description: 'Batidas aceleradas para rodovias interestaduais e aceleração contínua.',
      criteria: { mood: 'Eufórico', activity: 'Estrada/Corrida' },
      trackIds: ['trk-1', 'trk-2', 'trk-11', 'trk-3'],
      createdAt: new Date().toISOString(),
      color: '#ffb700',
    },
    {
      id: 'pl-init-2',
      title: 'Midnight Focus Cyberpunk',
      description: 'Sintetizadores contínuos e frequências estáveis para concentração no cockpit.',
      criteria: { mood: 'Focado', activity: 'Estudo/Trabalho' },
      trackIds: ['trk-5', 'trk-9', 'trk-2'],
      createdAt: new Date().toISOString(),
      color: '#00f0ff',
    },
  ];
};

export const savePlaylists = (playlists: AiPlaylist[]) => {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.warn('Erro ao salvar playlists:', e);
  }
};

/**
 * Motor de recomendação heurístico local ponderado pelo perfil do usuário
 */
export const calculateRecommendations = (
  prefs: UserPreferences,
  limit: number = 6
): RecommendationReason[] => {
  const allTracks = TRACK_CATALOG;

  const scoredTracks: RecommendationReason[] = allTracks.map((track) => {
    // Se o usuário descurtiu expressamente, penaliza fortemente
    if (prefs.dislikedTrackIds.includes(track.id)) {
      return {
        track,
        score: -50,
        reason: 'Evitado devido a descurtida anterior',
      };
    }

    let score = 20; // pontuação base
    const reasons: string[] = [];

    // Bônus se curtiu
    if (prefs.likedTrackIds.includes(track.id)) {
      score += 35;
      reasons.push('Favorito do seu perfil');
    }

    // Ponderação de gênero
    const genreCount = prefs.favoriteGenres[track.genre] || 0;
    if (genreCount > 0) {
      score += Math.min(30, genreCount * 8);
      reasons.push(`Você ouve muito ${track.genre}`);
    }

    // Ponderação de humor (mood)
    const moodCount = prefs.favoriteMoods[track.mood] || 0;
    if (moodCount > 0) {
      score += Math.min(25, moodCount * 6);
      reasons.push(`Combina com seu humor "${track.mood}"`);
    }

    // Ponderação de atividade
    const actCount = prefs.favoriteActivities[track.activity] || 0;
    if (actCount > 0) {
      score += Math.min(20, actCount * 5);
      reasons.push(`Ideal para sua atividade: ${track.activity}`);
    }

    // Penalidade se pulou recentemente
    const skipCount = prefs.skippedTrackIds.filter((id) => id === track.id).length;
    if (skipCount > 0) {
      score -= skipCount * 12;
      reasons.push('Pulada recentemente');
    }

    // Histórico de conclusão completa
    const completedPlays = prefs.playedHistory.filter(
      (h) => h.trackId === track.id && h.completed
    ).length;
    if (completedPlays > 0) {
      score += completedPlays * 6;
      reasons.push('Ouvida com frequência até o fim');
    }

    return {
      track,
      score,
      reason: reasons.length > 0 ? reasons.join(' • ') : 'Descoberta recomendada para você',
    };
  });

  return scoredTracks
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, limit);
};
