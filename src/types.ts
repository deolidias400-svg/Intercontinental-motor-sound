export type CockpitTheme =
  | 'default'
  | 'dark'
  | 'metal'
  | 'cyberpunk'
  | 'chrome'
  | 'green-racing'
  | 'volcano'
  | 'purple-neon'
  | 'gold-luxury'
  | 'synthwave-sunset';

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  url: string;
  bitrate: string;
  isPrimary?: boolean;
}

export interface CinemaChannel {
  id: string;
  title: string;
  videoId: string;
  category: 'Ação' | 'Ficção' | 'Clássicos' | 'Anime/Heróis' | 'Corrida';
  icon: string;
}

export interface EQProfile {
  id: string;
  name: string;
  label: string;
  lowGain: number; // dB (-12 to +14)
  midGain: number; // dB (-10 to +10)
  highGain: number; // dB (-10 to +12)
  accentColor: string;
  rpmBoost: number;
}

export interface TelemetryData {
  bass: number; // 0 - 100
  mid: number; // 0 - 100
  high: number; // 0 - 100
  psi: number; // 0 - 2.8 bar
  rpm: number; // 0 - 9000
  speed: number; // 0 - 360 km/h
  hp: number; // 100 - 140
  isNitro: boolean;
}

export interface CopilotMessage {
  id: string;
  sender: 'icon' | 'pilot';
  text: string;
  timestamp: string;
  suggestedAction?: string;
  vibe?: string;
}
