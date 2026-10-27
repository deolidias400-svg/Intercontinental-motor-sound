import React from 'react';
import { EQProfile } from '../types';
import { Sliders, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  currentProfile: EQProfile;
  onSelectProfile: (profile: EQProfile) => void;
  onOpenAiEqualizer: () => void;
}

export const DRIVE_PROFILES: (EQProfile & { activeColor: string; baseBorder: string; baseText: string })[] = [
  {
    id: 'STOCK',
    name: 'CRUISE',
    label: 'CRUISE',
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    accentColor: 'text-cyan-400',
    rpmBoost: 0,
    activeColor: 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_#00f0ff]',
    baseBorder: 'border-cyan-500/40',
    baseText: 'text-cyan-300',
  },
  {
    id: 'ECO',
    name: 'ECO GREEN',
    label: 'ECO',
    lowGain: -3,
    midGain: 2,
    highGain: -1,
    accentColor: 'text-emerald-300',
    rpmBoost: -500,
    activeColor: 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_#10b981]',
    baseBorder: 'border-emerald-500/40',
    baseText: 'text-emerald-300',
  },
  {
    id: 'SPORT',
    name: 'RACING AMBER',
    label: 'RACING',
    lowGain: 7,
    midGain: -2,
    highGain: 5,
    accentColor: 'text-amber-300',
    rpmBoost: 1200,
    activeColor: 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_#f59e0b]',
    baseBorder: 'border-amber-500/40',
    baseText: 'text-amber-300',
  },
  {
    id: 'CITY',
    name: 'URBAN VIOLET',
    label: 'URBAN',
    lowGain: 2,
    midGain: 4,
    highGain: 1,
    accentColor: 'text-purple-300',
    rpmBoost: 200,
    activeColor: 'bg-purple-500 text-black border-purple-300 shadow-[0_0_12px_#a855f7]',
    baseBorder: 'border-purple-500/40',
    baseText: 'text-purple-300',
  },
  {
    id: 'TURBO',
    name: 'V8 MAX RED',
    label: 'V8 MAX',
    lowGain: 10,
    midGain: 0,
    highGain: 6,
    accentColor: 'text-rose-400',
    rpmBoost: 2000,
    activeColor: 'bg-red-500 text-white border-red-300 shadow-[0_0_15px_#ef4444]',
    baseBorder: 'border-red-500/40',
    baseText: 'text-rose-300',
  },
  {
    id: 'VOICE',
    name: 'STUDIO GOLD',
    label: 'STUDIO',
    lowGain: -5,
    midGain: 8,
    highGain: 2,
    accentColor: 'text-yellow-200',
    rpmBoost: -200,
    activeColor: 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_12px_#facc15]',
    baseBorder: 'border-yellow-500/40',
    baseText: 'text-yellow-300',
  },
  {
    id: 'NIGHT',
    name: 'TUNNEL PINK',
    label: 'TUNNEL',
    lowGain: 5,
    midGain: -4,
    highGain: 8,
    accentColor: 'text-pink-300',
    rpmBoost: 800,
    activeColor: 'bg-pink-500 text-black border-pink-300 shadow-[0_0_12px_#ec4899]',
    baseBorder: 'border-pink-500/40',
    baseText: 'text-pink-300',
  },
];

export const DriveProfiles: React.FC<Props> = ({
  currentProfile,
  onSelectProfile,
  onOpenAiEqualizer,
}) => {
  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-2">
      <div className="flex flex-wrap justify-between items-center lcd-header-badge z-20 relative">
        <span className="flex items-center gap-1.5 lcd-text-cyan font-bold">
          <Sliders className="w-3.5 h-3.5 text-amber-400" /> [ LCD-06: ACOUSTIC DRIVE PROFILES & COLORS ]
        </span>
        <span className="text-[10px] font-mono-tech text-sky-300">
          DSP: <strong className="text-amber-300 font-bold">{currentProfile.name}</strong> (BASS: {currentProfile.lowGain > 0 ? `+${currentProfile.lowGain}` : currentProfile.lowGain}dB | MID: {currentProfile.midGain > 0 ? `+${currentProfile.midGain}` : currentProfile.midGain}dB | TREBLE: {currentProfile.highGain > 0 ? `+${currentProfile.highGain}` : currentProfile.highGain}dB)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 bg-[#001026]/90 p-2.5 rounded-xl border border-[#004b99] z-20 relative">
        {DRIVE_PROFILES.map((profile) => {
          const isSelected = currentProfile.id === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => {
                audioEngine.playTouchSound('switch');
                onSelectProfile(profile);
              }}
              className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase font-mono-tech transition-all border cursor-pointer ${
                isSelected
                  ? `${profile.activeColor} scale-103 font-black`
                  : `bg-[#001738] ${profile.baseText} ${profile.baseBorder} hover:scale-102 hover:text-white`
              }`}
            >
              {profile.label}
            </button>
          );
        })}

        {/* AI SMART AUTO-TUNE PROFILE BUTTON (VIBRANT PURPLE-CYAN GRADIENT) */}
        <button
          onClick={() => {
            audioEngine.playTouchSound('toggle');
            onOpenAiEqualizer();
          }}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white py-2 px-2 rounded-lg text-[10px] font-black uppercase font-mono-tech transition-all border border-purple-300 flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-103 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
          <span>AFINAR IA</span>
        </button>
      </div>
    </div>
  );
};
