export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number | string;
  genre: string;
  mood: 'Animado' | 'Eufórico' | 'Relaxante' | 'Focado' | 'Noturno' | 'Agressivo';
  activity: 'Treino' | 'Estrada/Corrida' | 'Festa' | 'Estudo/Trabalho' | 'Relaxar';
  duration: number; // in seconds
  bpm: number;
  url: string;
  coverUrl?: string;
  bitrate?: string;
  trivia?: string;
  color?: string;
  keySignature?: string;
}

export interface UserPreferences {
  likedTrackIds: string[];
  dislikedTrackIds: string[];
  skippedTrackIds: string[];
  playedHistory: {
    trackId: string;
    playedAt: string;
    completed: boolean;
  }[];
  favoriteGenres: Record<string, number>;
  favoriteMoods: Record<string, number>;
  favoriteActivities: Record<string, number>;
  voiceCommandLog: string[];
}

export interface AiPlaylist {
  id: string;
  title: string;
  description: string;
  criteria: {
    mood?: string;
    activity?: string;
    genre?: string;
    prompt?: string;
  };
  trackIds: string[];
  createdAt: string;
  color: string;
}

export interface RecommendationReason {
  track: Track;
  score: number;
  reason: string;
}
