import { Track, UserPreferences } from '../types/smartAudio';
import { TelemetryData, EQProfile, RadioStation } from '../types';

export interface RecentPlayRecord {
  track: Track;
  playedAt: string;
}

export interface SessionExportPayload {
  exportMetadata: {
    schemaVersion: string;
    application: string;
    exportTimestamp: string;
    exportType: string;
  };
  currentTrackMetadata: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number | string;
    genre: string;
    mood: string;
    activity: string;
    durationSeconds: number;
    durationFormatted: string;
    bpm: number;
    bitrate: string;
    keySignature: string;
    trivia: string;
    audioUrl: string;
    coverUrl?: string;
  };
  livePlaybackSession: {
    state: 'PLAYING' | 'PAUSED';
    isNitroActive: boolean;
    volumePercent: number;
    currentPositionSeconds: number;
    currentPositionFormatted: string;
    progressPercent: number;
    activeAcousticProfile: {
      id: string;
      name: string;
      lowGainDb: number;
      midGainDb: number;
      highGainDb: number;
      rpmBoost: number;
    };
    activeRadioStation: {
      id: string;
      name: string;
      genre: string;
      bitrate: string;
    };
  };
  cockpitTelemetrySnapshot: {
    engineRpm: number;
    speedKmh: number;
    turboBoostPsi: number;
    turboBoostBar: number;
    engineHp: number;
    nitroEngaged: boolean;
    frequencyBands: {
      subBassEnergy: number; // 0 - 100
      midRangeEnergy: number; // 0 - 100
      highTrebleEnergy: number; // 0 - 100
    };
  };
  recentPlaybackHistory: {
    rank: number;
    trackId: string;
    title: string;
    artist: string;
    album: string;
    genre: string;
    playedAt: string;
  }[];
  userSessionAnalytics: {
    totalPlayedTracksLogged: number;
    likedTracksCount: number;
    likedTrackIds: string[];
    favoriteGenresDistribution: Record<string, number>;
    favoriteMoodsDistribution: Record<string, number>;
    favoriteActivitiesDistribution: Record<string, number>;
  };
  clientRuntimeInfo: {
    userAgent: string;
    language: string;
    platform: string;
    timeZone: string;
    screenResolution: string;
  };
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generateSessionExportData(params: {
  currentTrack: Track;
  isPlaying: boolean;
  isNitro: boolean;
  volume: number;
  currentProfile: EQProfile;
  currentStation: RadioStation;
  telemetry: TelemetryData;
  recentPlays?: RecentPlayRecord[];
  userPreferences: UserPreferences;
  currentTime?: number;
}): SessionExportPayload {
  const {
    currentTrack,
    isPlaying,
    isNitro,
    volume,
    currentProfile,
    currentStation,
    telemetry,
    recentPlays = [],
    userPreferences,
    currentTime = 0,
  } = params;

  const exportTimestamp = new Date().toISOString();
  const trackDuration = currentTrack.duration || 180;
  const progressPercent = Number(
    Math.min(100, Math.max(0, (currentTime / trackDuration) * 100)).toFixed(1)
  );

  return {
    exportMetadata: {
      schemaVersion: '1.0.0',
      application: 'Intercontinental Motor Sound Cockpit v8',
      exportTimestamp,
      exportType: 'TRACK_METADATA_AND_SESSION_LOGS',
    },
    currentTrackMetadata: {
      id: currentTrack.id,
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Cockpit Master Edition',
      year: currentTrack.year || 2024,
      genre: currentTrack.genre,
      mood: currentTrack.mood,
      activity: currentTrack.activity,
      durationSeconds: trackDuration,
      durationFormatted: formatDuration(trackDuration),
      bpm: currentTrack.bpm,
      bitrate: currentTrack.bitrate || '320 kbps Lossless FLAC',
      keySignature: currentTrack.keySignature || 'Automotivo V8',
      trivia: currentTrack.trivia || 'Produção original para corridas de alta performance.',
      audioUrl: currentTrack.url,
      coverUrl: currentTrack.coverUrl,
    },
    livePlaybackSession: {
      state: isPlaying ? 'PLAYING' : 'PAUSED',
      isNitroActive: isNitro,
      volumePercent: volume,
      currentPositionSeconds: Number(currentTime.toFixed(1)),
      currentPositionFormatted: formatDuration(currentTime),
      progressPercent,
      activeAcousticProfile: {
        id: currentProfile.id,
        name: currentProfile.name,
        lowGainDb: currentProfile.lowGain,
        midGainDb: currentProfile.midGain,
        highGainDb: currentProfile.highGain,
        rpmBoost: currentProfile.rpmBoost,
      },
      activeRadioStation: {
        id: currentStation.id,
        name: currentStation.name,
        genre: currentStation.genre,
        bitrate: currentStation.bitrate,
      },
    },
    cockpitTelemetrySnapshot: {
      engineRpm: telemetry.rpm,
      speedKmh: telemetry.speed,
      turboBoostPsi: Number(telemetry.psi.toFixed(2)),
      turboBoostBar: Number((telemetry.psi * 0.0689476).toFixed(2)),
      engineHp: telemetry.hp,
      nitroEngaged: telemetry.isNitro,
      frequencyBands: {
        subBassEnergy: telemetry.bass,
        midRangeEnergy: telemetry.mid,
        highTrebleEnergy: telemetry.high,
      },
    },
    recentPlaybackHistory: (recentPlays || []).slice(0, 5).map((rec, index) => ({
      rank: index + 1,
      trackId: rec.track.id,
      title: rec.track.title,
      artist: rec.track.artist,
      album: rec.track.album || 'Cockpit Master',
      genre: rec.track.genre,
      playedAt: rec.playedAt,
    })),
    userSessionAnalytics: {
      totalPlayedTracksLogged: userPreferences.playedHistory?.length || 0,
      likedTracksCount: userPreferences.likedTrackIds?.length || 0,
      likedTrackIds: userPreferences.likedTrackIds || [],
      favoriteGenresDistribution: userPreferences.favoriteGenres || {},
      favoriteMoodsDistribution: userPreferences.favoriteMoods || {},
      favoriteActivitiesDistribution: userPreferences.favoriteActivities || {},
    },
    clientRuntimeInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR',
      platform: typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || navigator.platform || 'Web' : 'Web',
      timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '1920x1080',
    },
  };
}

export function downloadJsonFile(data: unknown, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (error) {
    console.error('Falha ao exportar arquivo JSON:', error);
  }
}
