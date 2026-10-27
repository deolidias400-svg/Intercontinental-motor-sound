import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types/smartAudio';
import {
  Disc3,
  Music2,
  Heart,
  Share2,
  Info,
  Sparkles,
  Radio,
  Flame,
  Clock,
  Gauge,
  Check,
  Zap,
  FileJson,
  Download,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { AudioTechnicalSpecs } from './AudioTechnicalSpecs';
import { ConfettiStreamerRain } from './ConfettiStreamerRain';

interface Props {
  currentTrack: Track;
  isPlaying: boolean;
  isNitro: boolean;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAskCopilotAboutTrack?: (track: Track) => void;
  onOpenExport?: () => void;
  customAudioName?: string | null;
  className?: string;
}

export const NowPlayingCard: React.FC<Props> = ({
  currentTrack,
  isPlaying,
  isNitro,
  isLiked,
  onToggleLike,
  onAskCopilotAboutTrack,
  onOpenExport,
  customAudioName,
  className = '',
}) => {
  const [showTrivia, setShowTrivia] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | null>(null);
  const [isHeartPulsing, setIsHeartPulsing] = useState(false);
  const [radioLoveCount, setRadioLoveCount] = useState(1482);
  const [showLoveToast, setShowLoveToast] = useState(false);
  const [duration, setDuration] = useState<number>(() => {
    const engineDur = audioEngine.getDuration();
    return engineDur > 0 ? engineDur : (currentTrack.duration || 180);
  });
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setConfettiOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsHeartPulsing(true);
    setShowConfetti(true);
    setRadioLoveCount((prev) => prev + 1);
    setShowLoveToast(true);
    audioEngine.playCelebrationSound();
    if (onToggleLike) onToggleLike();

    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = window.setTimeout(() => {
      setIsHeartPulsing(false);
    }, 800);

    // Sumir rapidamente em 1.5s ao invés de ficar na tela o tempo todo
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowLoveToast(false);
    }, 1500);
  };

  // Sync playback position & duration directly with audioEngine
  useEffect(() => {
    const audioEl = audioEngine.getAudioElement();
    if (!audioEl) return;

    const syncFromAudio = () => {
      const cur = audioEngine.getCurrentTime();
      const dur = audioEngine.getDuration();
      if (cur > 0) {
        setCurrentTime(cur);
      }
      if (dur > 0) {
        setDuration(dur);
      } else if (currentTrack.duration) {
        setDuration(currentTrack.duration);
      }
    };

    audioEl.addEventListener('timeupdate', syncFromAudio);
    audioEl.addEventListener('loadedmetadata', syncFromAudio);
    audioEl.addEventListener('durationchange', syncFromAudio);

    return () => {
      audioEl.removeEventListener('timeupdate', syncFromAudio);
      audioEl.removeEventListener('loadedmetadata', syncFromAudio);
      audioEl.removeEventListener('durationchange', syncFromAudio);
    };
  }, [currentTrack.duration]);

  // Track progress with smooth periodic interval when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const cur = audioEngine.getCurrentTime();
      const dur = audioEngine.getDuration();
      if (dur > 0) {
        setDuration(dur);
      }
      if (cur > 0) {
        setCurrentTime(cur);
      } else {
        // Fallback simulation timer if stream doesn't report finite currentTime
        setCurrentTime((prev) => {
          const effectiveDur = dur > 0 ? dur : (currentTrack.duration || 180);
          const next = prev + 0.25;
          return next > effectiveDur ? 0 : next;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  // Reset progress when track changes
  useEffect(() => {
    const engineCur = audioEngine.getCurrentTime();
    const engineDur = audioEngine.getDuration();
    setCurrentTime(engineCur > 0 ? engineCur : 0);
    setDuration(engineDur > 0 ? engineDur : (currentTrack.duration || 180));
  }, [currentTrack.id, currentTrack.duration]);

  const effectiveDuration = duration > 0 ? duration : (currentTrack.duration || 180);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * effectiveDuration;
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
    audioEngine.playTouchSound('tick');
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverPosition(ratio * 100);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Genre badge color mapping for rich colorful variety
  const getGenreColorClasses = (genre: string) => {
    if (genre.includes('Synthwave')) {
      return {
        badge: 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
        glow: '#ec4899',
        tag: 'SYNTHWAVE 80s',
      };
    }
    if (genre.includes('Euro Dance') || genre.includes('Automotive')) {
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
        glow: '#f59e0b',
        tag: 'EURO-DANCE V8',
      };
    }
    if (genre.includes('Phonk') || genre.includes('Bass')) {
      return {
        badge: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
        glow: '#ef4444',
        tag: 'PHONK BASS BOOST',
      };
    }
    if (genre.includes('Rock')) {
      return {
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
        glow: '#f97316',
        tag: 'CLASSIC ROCK V8',
      };
    }
    if (genre.includes('Lo-Fi') || genre.includes('Ambient')) {
      return {
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        glow: '#10b981',
        tag: 'LO-FI FOCUS 432Hz',
      };
    }
    return {
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
      glow: '#8b5cf6',
      tag: 'CHILLSTEP BOSSA',
    };
  };

  const genreStyle = getGenreColorClasses(currentTrack.genre);
  const trackColor = currentTrack.color || genreStyle.glow;

  const handleCopyInfo = () => {
    const text = `🎵 Tocando agora no Intercontinental Motor Sound:\n"${currentTrack.title}" por ${currentTrack.artist}\nÁlbum: ${currentTrack.album || 'Cockpit Master'} (${currentTrack.year || '2024'})\nGênero: ${currentTrack.genre} • ${currentTrack.bpm} BPM\nBitrate: ${currentTrack.bitrate || '320 kbps FLAC'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(0, 16, 44, 0.95) 0%, rgba(10, 25, 60, 0.92) 50%, rgba(2, 8, 24, 0.98) 100%)`,
        border: `1.5px solid ${isPlaying ? trackColor : '#004b99'}`,
        boxShadow: isPlaying
          ? `0 0 25px ${trackColor}33, inset 0 0 20px rgba(0, 240, 255, 0.15)`
          : '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Top Ambient Glow Ribbon */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
        style={{
          background: isPlaying
            ? `linear-gradient(90deg, #00f0ff, ${trackColor}, #ff0077, ${trackColor}, #00f0ff)`
            : '#003366',
        }}
      />

      {/* Header Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#003d73]/60 relative z-20">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono-tech uppercase tracking-wider ${
              isPlaying
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-[#001738] text-sky-400/80 border border-[#003d73]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-sky-600'}`} />
            {isPlaying ? 'NO AR • TOCANDO AGORA' : 'PAUSADO • STANDBY'}
          </span>

          {/* Nitro active badge */}
          {isNitro && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono-tech bg-rose-500/25 text-rose-300 border border-rose-400 shadow-[0_0_12px_#ff0055] animate-bounce">
              <Flame className="w-3 h-3 text-amber-400" /> NITRO +40% TORQUE
            </span>
          )}
        </div>

        {/* Audio Quality Badges */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[8px] font-mono-tech font-black tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            HI-RES AUDIO
          </span>
          <span className="px-2 py-0.5 rounded text-[8px] font-mono-tech font-bold bg-[#001b44] text-cyan-300 border border-cyan-500/40">
            320 KBPS
          </span>
        </div>
      </div>

      {/* Main Now Playing Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative z-20">
        {/* Left: Animated Vinyl Disc & Album Art */}
        <div className="md:col-span-4 flex items-center justify-center">
          <div className="relative group cursor-pointer" onClick={() => setShowTrivia(!showTrivia)}>
            {/* Spinning Vinyl Record behind the sleeve */}
            <div
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-gray-900 bg-radial from-gray-950 via-zinc-900 to-black absolute -right-6 top-1 shadow-2xl flex items-center justify-center transition-all ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: `${Math.max(1.8, 60 / (currentTrack.bpm || 120))}s`,
                boxShadow: isPlaying ? `0 0 15px ${trackColor}44` : 'none',
              }}
            >
              {/* Vinyl Grooves */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-zinc-700/40 border-dashed flex items-center justify-center">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-zinc-600/30 flex items-center justify-center">
                  {/* Vinyl Center Label */}
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[7px] font-mono-tech font-black text-white text-center shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${trackColor}, #001026)` }}
                  >
                    V8 DISK
                  </div>
                </div>
              </div>
            </div>

            {/* Album Cover Art Sleeve */}
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl relative z-10 flex flex-col justify-between p-2.5 overflow-hidden shadow-2xl border-2 transition-transform group-hover:scale-103"
              style={{
                background: `linear-gradient(135deg, #001738 0%, #002e66 50%, #000c1e 100%)`,
                borderColor: trackColor,
                boxShadow: `0 8px 24px rgba(0,0,0,0.8), 0 0 15px ${trackColor}44`,
              }}
            >
              {/* Sleeve corner badge */}
              <div className="flex justify-between items-center text-[8px] font-mono-tech font-black">
                <span className="px-1 py-0.5 rounded bg-black/60 text-white border border-white/20">
                  {currentTrack.year || 2024}
                </span>
                <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'text-cyan-300 animate-spin' : 'text-gray-400'}`} />
              </div>

              {/* Center icon / stylized artwork */}
              <div className="flex flex-col items-center justify-center my-auto">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: trackColor, color: '#000000' }}
                >
                  <Music2 className="w-5 h-5 font-black" />
                </div>
                <span className="text-[8px] font-black font-mono-tech text-white uppercase tracking-wider mt-1 text-center line-clamp-1">
                  {currentTrack.album || 'Motor Sound'}
                </span>
              </div>

              {/* Bottom audio wave simulation bars */}
              <div className="flex items-end justify-center gap-1 h-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-150"
                    style={{
                      height: isPlaying ? `${Math.max(20, Math.sin((i + Date.now() / 200)) * 50 + 50)}%` : '25%',
                      backgroundColor: trackColor,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Song Info, Artist, Album, Badges & Progress */}
        <div className="md:col-span-8 flex flex-col gap-2.5">
          {/* Main Title & Listener Heart Reaction Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {/* Colorful Genre Badge */}
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black font-mono-tech border ${genreStyle.badge}`}>
                  {currentTrack.genre}
                </span>

                {/* Live Stream / Master Disc Badge */}
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono-tech bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  TRANSMISSÃO AO VIVO V8
                </span>

                {/* Mood Tag */}
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono-tech bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {currentTrack.mood}
                </span>
              </div>

              {/* METADADOS CLAROS: NOME DA MÚSICA */}
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-amber-400 font-bold font-mono-tech uppercase tracking-wider shrink-0">
                  MÚSICA:
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-display tracking-tight truncate leading-tight drop-shadow-md">
                  {customAudioName ? customAudioName : currentTrack.title}
                </h2>
              </div>

              {/* METADADOS CLAROS: CANTOR E DISCO */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm font-mono-tech mt-1 bg-[#001026]/80 px-3 py-1.5 rounded-lg border border-[#003875]">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold uppercase text-[10px]">CANTOR:</span>
                  <strong className="text-cyan-300 font-black flex items-center gap-1">
                    🎤 {currentTrack.artist}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5 border-l border-[#003366] pl-3">
                  <span className="text-amber-400 font-bold uppercase text-[10px]">DISCO:</span>
                  <strong className="text-emerald-300 font-bold flex items-center gap-1">
                    <Disc3 className="w-3.5 h-3.5 text-emerald-400" />
                    {currentTrack.album || 'Disco Master V8 / Edição Especial'}
                  </strong>
                </div>

                {currentTrack.year && (
                  <span className="text-sky-400/80 text-[10px] font-mono-tech ml-auto hidden sm:inline">
                    Lançamento: {currentTrack.year}
                  </span>
                )}
              </div>

              {/* BARRA DE PROGRESSO VISUAL DA FAIXA (DURAÇÃO & POSIÇÃO DO AUDIOENGINE) */}
              <div className="mt-2.5 flex flex-col gap-1.5 bg-[#001026]/90 p-2.5 rounded-xl border border-[#004282] relative group/prog shadow-[inset_0_0_12px_rgba(0,100,255,0.12)]">
                {/* Header da Barra: Indicador de Tempo, Porcentagem e Badge */}
                <div className="flex items-center justify-between text-[11px] font-mono-tech">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-white font-mono-tech font-black tracking-wider">
                      {formatSeconds(currentTime)}
                    </span>
                    <span className="text-sky-500/60 font-normal">/</span>
                    <span className="text-sky-300 font-mono-tech">
                      {formatSeconds(effectiveDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tech font-bold text-cyan-300 bg-[#001c3d] px-1.5 py-0.5 rounded border border-[#004d8c]">
                      {Math.round(progressPercent)}%
                    </span>
                    <span className="text-[9px] font-mono-tech text-sky-400/70 hidden sm:inline">
                      RESTANTE: -{formatSeconds(Math.max(0, effectiveDuration - currentTime))}
                    </span>
                  </div>
                </div>

                {/* Linha/Barra de Progresso Interativa com Glow e Playhead Knob */}
                <div
                  ref={progressBarRef}
                  onClick={handleSeek}
                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={() => setHoverPosition(null)}
                  className="w-full h-3 bg-[#000814] rounded-full p-0.5 border border-[#004b99] hover:border-cyan-400 relative cursor-pointer shadow-inner overflow-hidden flex items-center transition-colors"
                  title="Clique na barra para navegar pela música"
                >
                  {/* Subtle track background grid markings */}
                  <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-full bg-cyan-400" />
                    ))}
                  </div>

                  {/* Preenchimento Dinâmico da Barra com Gradiente e Brilho */}
                  <div
                    className="h-full rounded-full transition-all duration-150 relative"
                    style={{
                      width: `${progressPercent}%`,
                      background: `linear-gradient(90deg, #0055d4 0%, #00f0ff 65%, ${trackColor} 100%)`,
                      boxShadow: `0 0 10px ${trackColor}, inset 0 0 4px rgba(255,255,255,0.6)`,
                    }}
                  >
                    {/* Cabeça / Playhead pulsante com anel luminoso */}
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_10px_#00f0ff] transform translate-x-1/2 group-hover/prog:scale-125 transition-transform"
                    />
                  </div>

                  {/* Marcador de Hover ao posicionar o mouse */}
                  {hoverPosition !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-[0_0_6px_#f59e0b]"
                      style={{ left: `${hoverPosition}%` }}
                    />
                  )}
                </div>

                {/* Informação Técnica do Engine de Áudio */}
                <div className="flex items-center justify-between text-[8px] font-mono-tech text-sky-400/80">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                    {isPlaying ? 'AUDIO ENGINE ATIVO' : 'AUDIO ENGINE STANDBY'}
                  </span>
                  <span className="text-cyan-400 font-bold uppercase tracking-wider">
                    {audioEngine.getDuration() > 0 ? 'FLAC / HQ LOSSLESS POS' : 'DSP TIME BUFFER'}
                  </span>
                </div>
              </div>
            </div>

            {/* OUVINTE CURTINDO A RÁDIO: CORAÇÃO PULSANTE & CHUVA DE CONFETES */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={handleHeartClick}
                className={`relative px-4 py-2.5 rounded-xl border flex items-center gap-2.5 font-mono-tech font-bold text-xs uppercase transition-all duration-200 cursor-pointer select-none group ${
                  isHeartPulsing || isLiked
                    ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 text-white border-rose-300 shadow-[0_0_30px_#ff0055] scale-105'
                    : 'bg-[#001738] text-rose-300 border-rose-500/40 hover:border-rose-400 hover:text-white hover:bg-rose-950/40 shadow-[0_0_12px_rgba(255,0,85,0.25)] hover:scale-103'
                }`}
                title="Clique aqui se você está gostando da rádio!"
              >
                {/* Glow ring pulse when clicked */}
                {isHeartPulsing && (
                  <span className="absolute -inset-1 rounded-xl bg-rose-500/50 animate-ping pointer-events-none" />
                )}
                
                <Heart
                  className={`w-6 h-6 transition-transform duration-300 fill-current ${
                    isHeartPulsing ? 'scale-135 text-white animate-bounce drop-shadow-[0_0_10px_#ffffff]' : 'text-rose-400 group-hover:scale-115'
                  }`}
                />
                
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-[11px] font-black tracking-wider flex items-center gap-1">
                    {isHeartPulsing ? 'AMANDO A RÁDIO! ❤️' : 'CURTINDO A RÁDIO?'}
                  </span>
                  <span className="text-[8px] text-pink-200/90 font-mono-tech">
                    {radioLoveCount.toLocaleString('pt-BR')} ouvintes amando
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  audioEngine.playTouchSound('click');
                  handleCopyInfo();
                }}
                className="p-2.5 rounded-xl border bg-[#001738] text-sky-300 border-[#003d73] hover:text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
                title="Copiar dados da música para compartilhar"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  audioEngine.playTouchSound('toggle');
                  setShowTrivia(!showTrivia);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  showTrivia
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-[0_0_10px_#00f0ff]'
                    : 'bg-[#001738] text-sky-300 border-[#003d73] hover:text-cyan-300'
                }`}
                title="Informações e curiosidades para os ouvintes"
              >
                <Info className="w-4 h-4" />
              </button>

              {onOpenExport && (
                <button
                  onClick={() => {
                    audioEngine.playTouchSound('click');
                    onOpenExport();
                  }}
                  className="p-2.5 rounded-xl border bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-cyan-300 border-cyan-400/60 hover:border-cyan-300 hover:text-white shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Exportar metadados da faixa e log de sessão em JSON para análise externa"
                >
                  <FileJson className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline text-[9px] font-mono-tech font-bold uppercase tracking-wider text-cyan-200">
                    Exportar JSON
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* CHUVA DE CONFETES E SERPENTINA AO CURTIR A RÁDIO */}
          <ConfettiStreamerRain
            active={showConfetti}
            origin={confettiOrigin}
            onComplete={() => setShowConfetti(false)}
          />

          {/* TOAST DE CELEBRAÇÃO DO OUVINTE VIP (DESAPARECE RAPIDAMENTE) */}
          {showLoveToast && (
            <div
              onClick={() => setShowLoveToast(false)}
              className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white font-mono-tech font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(255,0,85,0.85)] border border-white/80 flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150 cursor-pointer select-none transition-all hover:scale-102"
              title="Clique para fechar imediatamente"
            >
              <Heart className="w-4 h-4 fill-white text-white animate-ping" />
              <span>VOCÊ ESTÁ AMANDO A RÁDIO! ❤️ OUVINTE VIP! 🎉</span>
            </div>
          )}

          {/* REAL-TIME TECHNICAL AUDIO SPECIFICATIONS (BITRATE, SAMPLE RATE, CODEC, VU METERS) */}
          <AudioTechnicalSpecs
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isNitro={isNitro}
          />

          {/* Quick Musical Info Strip (BPM & Musical Key) */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#000c1e]/90 border border-[#003366] text-[10px] font-mono-tech">
            <div className="flex items-center gap-2">
              <span className="text-sky-400/80 flex items-center gap-1 text-[9px]">
                <Gauge className="w-3 h-3 text-amber-400" /> ANDAMENTO:
              </span>
              <span className="font-bold text-amber-300">{currentTrack.bpm} BPM</span>
            </div>
            <div className="flex items-center gap-2 border-l border-[#002e5c] pl-3">
              <span className="text-sky-400/80 text-[9px]">AFINAÇÃO / TOM:</span>
              <span className="font-bold text-cyan-300">{currentTrack.keySignature || 'Automotivo V8'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 border-l border-[#002e5c] pl-3">
              <span className="text-sky-400/80 text-[9px]">CANAL:</span>
              <span className="font-bold text-emerald-400">Stereo 2.0 HD</span>
            </div>
          </div>

          {/* Interactive Live Progress Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between items-center text-[10px] font-mono-tech">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" /> {formatSeconds(currentTime)}
              </span>
              <span className="text-sky-400/70 font-mono-tech">
                DURAÇÃO TOTAL: <strong className="text-white">{formatSeconds(currentTrack.duration || 180)}</strong>
              </span>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full h-2 rounded-full bg-[#000e24] border border-[#003d73] p-0.5 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${isPlaying ? progressPercent : 0}%`,
                  background: `linear-gradient(90deg, #00f0ff, ${trackColor}, #ffffff)`,
                  boxShadow: `0 0 10px ${trackColor}`,
                }}
              />
            </div>
          </div>

          {/* Curiosidade / Ouvintes Box (Trivia Drawer) */}
          {showTrivia && currentTrack.trivia && (
            <div className="mt-1 p-2.5 rounded-xl bg-[#001738] border border-cyan-400/50 text-[11px] font-mono-tech text-sky-200 flex flex-col gap-1.5 animate-fadeIn shadow-lg">
              <div className="flex items-center justify-between text-cyan-300 font-bold text-[9px] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> CURIOSIDADE MUSICAL PARA OS OUVINTES
                </span>
                <span className="text-sky-400 text-[8px]">PRODUÇÃO & HISTÓRIA</span>
              </div>
              <p className="italic text-sky-100 leading-relaxed font-sans text-xs">
                "{currentTrack.trivia}"
              </p>
              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#003366]">
                {onOpenExport && (
                  <button
                    onClick={onOpenExport}
                    className="text-[9px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                  >
                    <Download className="w-2.5 h-2.5" /> Exportar metadados & telemetria (.JSON)
                  </button>
                )}
                {onAskCopilotAboutTrack && (
                  <button
                    onClick={() => onAskCopilotAboutTrack(currentTrack)}
                    className="text-[9px] text-cyan-300 hover:text-white flex items-center gap-1 font-bold underline cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Análise com Robô I-CON &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {copied && (
            <div className="text-center text-[10px] font-mono-tech font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 p-1 rounded-md animate-fadeIn">
              ✓ Informações da música copiadas para a área de transferência!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
