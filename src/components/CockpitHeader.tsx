import React, { useEffect, useState } from 'react';
import { CockpitTheme } from '../types';
import { Track } from '../types/smartAudio';
import { audioEngine } from '../utils/audioEngine';
import { Radio, Gauge, Sparkles, Volume2, ShieldCheck, Monitor, Mic, Flame, FileJson, Music2 } from 'lucide-react';
import { AppDownloadButton } from './AppDownloadButton';

interface Props {
  currentTheme: CockpitTheme;
  onSelectTheme: (theme: CockpitTheme) => void;
  isPlaying: boolean;
  isNitro: boolean;
  currentTrack?: Track;
  onOpenTranscriber?: () => void;
  onOpenExport?: () => void;
  onOpenDownloadApp?: () => void;
}

const LCD_SHADES = [
  { id: 'default' as CockpitTheme, label: 'COBALT BLUE', bg: 'bg-[#002b66]', text: 'text-cyan-300', border: 'border-[#0077e6]' },
  { id: 'volcano' as CockpitTheme, label: 'VOLCANO RED', bg: 'bg-red-950', text: 'text-rose-400', border: 'border-red-500' },
  { id: 'green-racing' as CockpitTheme, label: 'GREEN RACING', bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-500' },
  { id: 'purple-neon' as CockpitTheme, label: 'PURPLE NEON', bg: 'bg-purple-950', text: 'text-fuchsia-400', border: 'border-purple-500' },
  { id: 'gold-luxury' as CockpitTheme, label: 'GOLD AMBER', bg: 'bg-amber-950', text: 'text-amber-300', border: 'border-amber-500' },
  { id: 'synthwave-sunset' as CockpitTheme, label: 'SYNTH SUNSET', bg: 'bg-rose-950', text: 'text-pink-300', border: 'border-rose-500' },
  { id: 'chrome' as CockpitTheme, label: 'CYAN MATRIX', bg: 'bg-[#003d73]', text: 'text-sky-200', border: 'border-cyan-400' },
  { id: 'dark' as CockpitTheme, label: 'DARK CARBON', bg: 'bg-zinc-900', text: 'text-zinc-300', border: 'border-zinc-500' },
];

export const CockpitHeader: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  isPlaying,
  isNitro,
  currentTrack,
  onOpenTranscriber,
  onOpenExport,
  onOpenDownloadApp,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
      setDateStr(now.toLocaleDateString('pt-BR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* FAIXA BRASIL LUXURY BLUE LCD EDITION */}
      <div className="p-2.5 rounded-xl flex flex-col gap-1.5 px-4 blue-lcd-screen">
        <div className="flex justify-between items-center w-full text-[9px] font-black tracking-[0.25em] lcd-text-cyan font-mono-tech uppercase z-20 relative">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            [ LCD-00: BRAZILIAN COCKPIT HIGH PERFORMANCE - MULTI-COLOR MATRIX ]
          </span>
          <span className="hidden sm:inline text-sky-300/80">
            AUDIO MASTER COCKPIT V8.5
          </span>
          <span className="flex items-center gap-1 text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5" /> SAT-LINK ONLINE
          </span>
        </div>
        <div className="h-1.5 w-full brazil-strip rounded-full shadow-[0_0_10px_rgba(0,240,255,0.4)] z-20 relative"></div>
      </div>

      {/* DASHBOARD SYSTEM TELEMETRY STRIP IN BLUE LCD */}
      <div className="blue-lcd-screen p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 z-20 relative">
          <div className="flex items-center gap-2.5 bg-[#001026]/80 px-3 py-1.5 rounded-lg border border-[#004b99]">
            <span
              className={`w-3 h-3 rounded-full ${
                isPlaying
                  ? isNitro
                    ? 'bg-amber-400 shadow-[0_0_12px_#ffcc00] animate-pulse'
                    : 'bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse'
                  : 'bg-blue-600 shadow-[0_0_10px_#0055ff]'
              }`}
            ></span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-widest text-sky-400 font-mono-tech uppercase">
                MOTOR STATUS:
              </span>
              <span
                className={`text-xs font-black tracking-wider font-mono-tech ${
                  isPlaying ? (isNitro ? 'lcd-text-amber' : 'text-emerald-400') : 'text-sky-300/80'
                }`}
              >
                {isPlaying ? (isNitro ? 'NITRO ACTIVE [OVERDRIVE]' : 'LIVE V8 [RESONATING]') : 'STANDBY [READY]'}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 pl-3 border-l border-[#004b99] text-[11px] font-mono-tech text-sky-300/80">
            <div>
              SAT-LINK: <span className="lcd-text-cyan font-bold">100% HQ</span>
            </div>
            <div>
              CLOCK: <span className="lcd-text-white font-bold">{timeStr}</span>
            </div>
            <div>
              DATE: <span className="text-sky-200 font-bold">{dateStr}</span>
            </div>
          </div>

          {/* LOCAL COM NOME DA MÚSICA QUE ESTÁ TOCANDO E ARTISTA NO TOPO */}
          {currentTrack && (
            <div className="hidden xl:flex items-center gap-2 bg-[#001433]/90 px-3 py-1.5 rounded-lg border border-[#005bb5] shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping shrink-0" />
              <div className="flex flex-col min-w-0 max-w-[260px]">
                <div className="flex items-center gap-1.5 text-[9px] font-mono-tech truncate leading-tight">
                  <span className="text-amber-400 font-black uppercase shrink-0">MÚSICA:</span>
                  <span className="text-white font-black truncate">
                    {currentTrack.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-mono-tech text-cyan-300 truncate leading-tight">
                  <span className="text-sky-400/80 font-bold uppercase shrink-0">ARTISTA:</span>
                  <span className="font-bold truncate text-sky-200">
                    🎤 {currentTrack.artist}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & LCD Shade Selector */}
        <div className="flex flex-wrap items-center gap-2 z-20 relative">
          {/* BOTÃO PARA BAIXAR/INSTALAR O APLICATIVO NATIVO PWA */}
          {onOpenDownloadApp && (
            <AppDownloadButton onClick={onOpenDownloadApp} />
          )}

          {/* AUDIO TRANSCRIBER QUICK LAUNCH BUTTON */}
          {onOpenTranscriber && (
            <button
              onClick={() => {
                audioEngine.playTouchSound('toggle');
                onOpenTranscriber();
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-mono-tech font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,85,0.4)] border border-rose-300 hover:scale-103 transition-all cursor-pointer"
              title="Transcrever fala ou áudio com o modelo Gemini 3.5 Transcribe"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>TRANSCREVER ÁUDIO</span>
              <span className="hidden sm:inline text-[8px] bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono-tech">
                GEMINI 3.5
              </span>
            </button>
          )}

          {/* EXPORT SESSION LOGS AND TRACK METADATA BUTTON */}
          {onOpenExport && (
            <button
              onClick={() => {
                audioEngine.playTouchSound('click');
                onOpenExport();
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-mono-tech font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300 hover:scale-103 transition-all cursor-pointer"
              title="Exportar metadados da música e logs de telemetria em formato JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-black" />
              <span>EXPORTAR LOGS</span>
              <span className="hidden sm:inline text-[8px] bg-black/30 px-1 py-0.5 rounded text-white font-mono-tech">
                .JSON
              </span>
            </button>
          )}

          {/* Theme Selector */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs bg-[#001026]/90 p-1.5 rounded-lg border border-[#004b99] font-bold font-mono-tech">
            <span className="text-[9px] text-sky-400 mr-1 hidden lg:inline tracking-wider">
              <Monitor className="w-3 h-3 inline mr-1" />
              TEMA / COR:
            </span>
            {LCD_SHADES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    audioEngine.playTouchSound('switch');
                    onSelectTheme(theme.id);
                  }}
                  className={`px-2.5 py-1 rounded text-[9px] uppercase transition-all duration-200 border cursor-pointer ${
                    theme.border
                  } ${theme.bg} ${theme.text} ${
                    isSelected
                      ? 'ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.6)] scale-105 font-black'
                      : 'opacity-70 hover:opacity-100 hover:scale-102'
                  }`}
                >
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
