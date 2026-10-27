import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Volume2, VolumeX, Flame, Zap, Radio, Upload, SkipForward, SkipBack, ThumbsUp, Download } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { RadioStation } from '../types';
import { RADIO_STATIONS } from '../data/radioStations';
import { Track } from '../types/smartAudio';

interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isNitro: boolean;
  onToggleNitro: () => void;
  currentStation: RadioStation;
  onSelectStation: (station: RadioStation) => void;
  onCustomAudioFile: (file: File) => void;
  currentTrack?: Track;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onOpenDownloadApp?: () => void;
  isConnecting?: boolean;
}

export const CockpitControls: React.FC<Props> = ({
  isPlaying,
  onPlay,
  onStop,
  onNextTrack,
  onPrevTrack,
  volume,
  onVolumeChange,
  isNitro,
  onToggleNitro,
  currentStation,
  onSelectStation,
  onCustomAudioFile,
  currentTrack,
  isLiked,
  onToggleLike,
  onOpenDownloadApp,
  isConnecting,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleMute = () => {
    audioEngine.playTouchSound('toggle');
    if (isMuted) {
      onVolumeChange(prevVolume > 0 ? prevVolume : 80);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  useEffect(() => {
    let startY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (knobRef.current && knobRef.current.contains(e.target as Node)) {
        audioEngine.playTouchSound('tick');
        startY = e.clientY;
        setIsDragging(true);
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startY - e.clientY;
      startY = e.clientY;
      const newVol = Math.max(0, Math.min(100, Math.round(volume + delta * 0.8)));
      if (newVol !== volume) {
        if (Math.abs(newVol - volume) >= 3) {
          audioEngine.playTouchSound('tick');
        }
        onVolumeChange(newVol);
        if (isMuted && newVol > 0) setIsMuted(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, volume, onVolumeChange, isMuted]);

  const handleRevEngine = () => {
    audioEngine.playTouchSound('heavy');
    audioEngine.playRevSound();
  };

  const knobAngle = (volume / 100) * 270 - 135;

  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-3">
      {/* HEADER BADGE */}
      <div className="flex justify-between items-center lcd-header-badge z-20 relative">
        <span className="lcd-text-cyan flex items-center gap-1.5 font-bold">
          <Radio className="w-3.5 h-3.5" /> [ LCD-05: MASTER COCKPIT PLAYBACK ]
        </span>
        <span className="text-[9px] text-sky-400 font-mono-tech">320K HQ AUDIO</span>
      </div>

      {/* RADIO SELECTOR STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#001026]/90 p-2.5 rounded-xl border border-[#004b99] z-20 relative">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase text-amber-300 font-mono-tech tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-amber-400" /> CANAL V8:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {RADIO_STATIONS.map((st, idx) => {
            const colors = [
              'border-amber-400 text-amber-300 bg-amber-500/20',
              'border-pink-400 text-pink-300 bg-pink-500/20',
              'border-emerald-400 text-emerald-300 bg-emerald-500/20',
              'border-orange-400 text-orange-300 bg-orange-500/20',
            ];
            const activeColor = colors[idx % colors.length];

            return (
              <button
                key={st.id}
                onClick={() => {
                  audioEngine.playTouchSound('switch');
                  onSelectStation(st);
                }}
                className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase font-mono-tech transition-all border cursor-pointer ${
                  currentStation.id === st.id
                    ? `${activeColor} font-black shadow-[0_0_12px_rgba(255,200,0,0.5)] scale-102`
                    : 'bg-[#001738] text-sky-300 border-[#003d73] hover:border-amber-400 hover:text-white'
                }`}
              >
                {st.name}
              </button>
            );
          })}

          <button
            onClick={() => {
              audioEngine.playTouchSound('click');
              fileInputRef.current?.click();
            }}
            title="Carregar arquivo MP3/WAV do computador para rodar no motor do cockpit"
            className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-mono-tech bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-300 border border-purple-400/60 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3 h-3 text-purple-400" /> ARQUIVO PRÓPRIO
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                audioEngine.playTouchSound('switch');
                onCustomAudioFile(file);
              }
            }}
          />
        </div>
      </div>

      {/* CONTROLES PRINCIPAIS DO COCKPIT */}
      <div className="grid grid-cols-12 gap-3 items-center z-20 relative">
        {/* ESQUERDA: IGNITION, STOP, PREV E NEXT */}
        <div className="col-span-12 sm:col-span-4 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* GREEN IGNITION BUTTON - SOM REALISTA DE IGNIÇÃO V8 */}
            <button
              onClick={() => {
                audioEngine.playIgnitionSound();
                onPlay();
              }}
              disabled={isPlaying || isConnecting}
              className={`py-3.5 px-3 rounded-xl border font-black text-xs uppercase font-mono-tech flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-950/20 text-emerald-600/40 border-emerald-900/30 opacity-40 cursor-not-allowed'
                  : isConnecting
                  ? 'bg-emerald-400 text-black border-white shadow-[0_0_35px_#10b981] animate-pulse cursor-wait'
                  : 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-black border-emerald-300 shadow-[0_0_20px_#10b981] hover:scale-102 active:scale-98'
              }`}
            >
              {isConnecting ? (
                <>
                  <Zap className="w-5 h-5 fill-current text-black animate-bounce" />
                  <span>IGNIÇÃO ⚡</span>
                  <span className="text-[7px] text-emerald-950 font-black">LIGANDO RÁDIO...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>IGNIÇÃO ▶</span>
                  <span className="text-[7px] text-emerald-950 font-black">START ENGINE</span>
                </>
              )}
            </button>

            {/* CRIMSON RED STOP BUTTON - SOM DE DESLIGAMENTO */}
            <button
              onClick={() => {
                audioEngine.playEngineShutdownSound();
                onStop();
              }}
              disabled={!isPlaying}
              className={`py-3.5 px-3 rounded-xl border font-black text-xs uppercase font-mono-tech flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                !isPlaying
                  ? 'bg-red-950/20 text-rose-800/40 border-red-900/20 opacity-40 cursor-not-allowed'
                  : 'bg-gradient-to-b from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-400 shadow-[0_0_25px_#ef4444] hover:scale-102 active:scale-98 animate-pulse'
              }`}
            >
              <Square className="w-5 h-5 fill-current" />
              <span>STOP ■</span>
              <span className="text-[7px] text-red-200 font-bold">ENGINE OFF</span>
            </button>
          </div>

          {/* PREV / NEXT TRACK BUTTONS */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                audioEngine.playTouchSound('click');
                if (onPrevTrack) onPrevTrack();
              }}
              className="bg-[#001f44] hover:bg-[#002f66] border border-[#0055aa] text-sky-200 hover:text-white py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono-tech font-bold cursor-pointer transition-all"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>ANTERIOR</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playTouchSound('click');
                if (onNextTrack) onNextTrack();
              }}
              className="bg-gradient-to-r from-[#002855] to-purple-950 hover:from-[#003875] hover:to-purple-900 border border-purple-500/50 py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono-tech font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer transition-all"
            >
              <span>PRÓXIMA</span>
              <SkipForward className="w-3.5 h-3.5 text-purple-300" />
            </button>
          </div>
        </div>

        {/* CENTRO: KNOB DE VOLUME GIRATÓRIO MULTICOLORIDO */}
        <div className="col-span-12 sm:col-span-4 flex flex-col items-center justify-center py-2">
          <div
            ref={knobRef}
            title="Arraste para cima/baixo para alterar o volume"
            className="w-28 h-28 rounded-full relative flex items-center justify-center cursor-ns-resize shadow-[0_10px_25px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(0,100,255,0.4)] border-4 border-[#003d73] select-none"
            style={{
              background:
                'conic-gradient(from -135deg, #10b981 0%, #00f0ff 35%, #f59e0b 70%, #ef4444 95%, #10b981 100%)',
              transform: `rotate(${knobAngle}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div
              className="w-16 h-16 rounded-full bg-[#001026] border-2 border-[#0077e6] flex flex-col items-center justify-center shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)]"
              style={{ transform: `rotate(${-knobAngle}deg)` }}
            >
              <span className="text-[7px] text-amber-300 font-black tracking-wider uppercase font-mono-tech">
                VOLUME
              </span>
              <span className={`text-sm font-black font-mono-tech ${volume > 80 ? 'text-rose-400' : volume > 50 ? 'text-amber-300' : 'text-emerald-400'}`}>
                {volume}%
              </span>
            </div>
            <div className="absolute top-1.5 w-1.5 h-3 bg-white rounded-full shadow-[0_0_8px_#ffffff]"></div>
          </div>
          <span className="text-[8px] text-amber-400/80 font-mono-tech mt-1 tracking-wider uppercase font-bold">
            GIRE O KNOB DE POTÊNCIA
          </span>
        </div>

        {/* DIREITA: SILENCE, NITRO OVERDRIVE & ACELERADOR REV */}
        <div className="col-span-12 sm:col-span-4 grid grid-cols-2 gap-2">
          <button
            onClick={toggleMute}
            className={`py-3.5 px-2 rounded-xl border font-black text-xs uppercase font-mono-tech flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-950/60 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(255,204,0,0.4)] animate-pulse'
                : 'bg-[#001738] text-sky-300 border-[#003d73] hover:text-white hover:border-cyan-400'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'MUTADO' : 'SILENCE'}</span>
            <span className="text-[8px] text-sky-400 font-normal">
              {isMuted ? 'RESTAURAR' : 'MUTE AUDIO'}
            </span>
          </button>

          {/* FIERY NITRO OVERDRIVE BUTTON */}
          <button
            onClick={() => {
              audioEngine.playTouchSound('heavy');
              if (!isNitro) {
                audioEngine.playNitroBlast();
              }
              onToggleNitro();
            }}
            className={`py-3.5 px-2 rounded-xl border font-black text-xs uppercase font-mono-tech flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isNitro
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white border-amber-300 shadow-[0_0_30px_#ff0055] animate-pulse scale-103'
                : 'bg-[#1a0f00] text-amber-400 border-amber-500/50 hover:bg-[#2b1800] hover:border-amber-400'
            }`}
          >
            <Flame className={`w-4 h-4 ${isNitro ? 'text-yellow-200 animate-bounce' : 'text-amber-400'}`} />
            <span>{isNitro ? 'NITRO ON 🔥' : 'NITRO STAGE 2'}</span>
            <span className="text-[8px] font-normal">{isNitro ? '+40% HP BOOST' : 'OVERDRIVE'}</span>
          </button>

          {/* Quick V8 Rev Button (Amber Glow) */}
          <button
            onClick={handleRevEngine}
            className="col-span-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#001738] via-[#1a1100] to-[#001738] hover:from-[#00224d] hover:to-[#2e1d00] text-amber-300 border border-amber-500/40 flex items-center justify-center gap-2 text-[10px] font-black uppercase font-mono-tech transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> ACELERAR MOTOR V8 (REV SOUND)
          </button>

          {/* Botão de Download / Instalação do Aplicativo para o Ouvinte */}
          {onOpenDownloadApp && (
            <button
              onClick={() => {
                audioEngine.playTouchSound('switch');
                onOpenDownloadApp();
              }}
              className="col-span-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-950 via-[#002b66] to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 hover:text-white border border-cyan-400/60 flex items-center justify-center gap-2 text-[10px] font-black uppercase font-mono-tech transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:scale-102 group"
              title="Baixar aplicativo oficial no seu smartphone ou computador"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-y-0.5 transition-transform animate-bounce" />
              <span>BAIXAR APLICATIVO OFICIAL (CELULAR OU PC)</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-400 text-black font-black">
                PWA
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
