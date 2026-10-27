import React, { useState } from 'react';
import { Track } from '../types/smartAudio';
import { audioEngine } from '../utils/audioEngine';
import {
  RotateCcw,
  History,
  Music2,
  Play,
  Volume2,
  Clock,
  Sparkles,
  Disc,
  Flame,
  Check,
  Radio,
} from 'lucide-react';

export interface RecentPlayRecord {
  track: Track;
  playedAt: string; // ISO string or timestamp
}

interface Props {
  history: RecentPlayRecord[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onReplayTrack: (track: Track) => void;
  onClearHistory?: () => void;
}

// Visual position badge colors to break up dark blue monotony
const RANK_STYLES = [
  {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    border: 'border-amber-400',
    text: 'text-black',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    label: '#01 MAIS RECENTE',
  },
  {
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    border: 'border-emerald-400',
    text: 'text-black',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    label: '#02 ANTERIOR',
  },
  {
    bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    border: 'border-purple-400',
    text: 'text-white',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    label: '#03',
  },
  {
    bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    border: 'border-cyan-400',
    text: 'text-black',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    label: '#04',
  },
  {
    bg: 'bg-gradient-to-r from-rose-500 to-pink-500',
    border: 'border-rose-400',
    text: 'text-white',
    glow: 'shadow-[0_0_10px_rgba(244,63,94,0.4)]',
    label: '#05',
  },
];

function formatTimeAgo(isoString: string): string {
  try {
    const playedDate = new Date(isoString).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - playedDate) / 1000));

    if (diffSec < 30) return 'Agora mesmo';
    if (diffSec < 60) return `Há ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;

    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return 'Recente';
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const RecentPlaysList: React.FC<Props> = ({
  history,
  currentTrackId,
  isPlaying,
  onReplayTrack,
  onClearHistory,
}) => {
  const [replayingId, setReplayingId] = useState<string | null>(null);

  // Take the last 5 played tracks
  const recentFive = history.slice(0, 5);

  const handleReplayClick = (track: Track) => {
    audioEngine.playTouchSound('switch');
    setReplayingId(track.id);
    onReplayTrack(track);
    setTimeout(() => {
      setReplayingId(null);
    }, 1200);
  };

  return (
    <div className="cockpit-panel p-4 flex flex-col gap-3 rounded-xl border border-[#0055aa]/60 bg-gradient-to-b from-[#001026] via-[#001433] to-[#000a1a] shadow-[0_4px_24px_rgba(0,30,80,0.4)] relative overflow-hidden">
      {/* Decorative ambient corner glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#003d73]/70 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            <History className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono-tech text-xs tracking-wider text-amber-300 font-bold uppercase flex items-center gap-1.5">
                Últimas Execuções
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-semibold">
                  TOP 5
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-sky-300/80 font-mono-tech">
              Registro cronológico recente • Repetição instantânea
            </p>
          </div>
        </div>

        {/* Quick action: Replay latest track if available */}
        {recentFive.length > 0 && (
          <button
            onClick={() => handleReplayClick(recentFive[0].track)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono-tech font-bold uppercase transition-all bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.35)] border border-emerald-400/50 hover:scale-105 active:scale-95"
            title="Repetir a música mais recente imediatamente"
          >
            <RotateCcw className="w-3 h-3 animate-spin-slow" />
            <span>Repetir Top 1</span>
          </button>
        )}
      </div>

      {/* List of 5 items */}
      <div className="flex flex-col gap-2 relative z-10">
        {recentFive.length === 0 ? (
          <div className="text-center py-6 text-sky-400 font-mono-tech text-xs flex flex-col items-center gap-2">
            <Music2 className="w-8 h-8 opacity-40 animate-pulse text-cyan-400" />
            <p>Nenhuma faixa executada ainda nesta sessão.</p>
            <span className="text-[10px] text-sky-500">Inicie uma música para registrar o histórico!</span>
          </div>
        ) : (
          recentFive.map((record, index) => {
            const { track, playedAt } = record;
            const isCurrent = track.id === currentTrackId;
            const rankStyle = RANK_STYLES[index] || RANK_STYLES[RANK_STYLES.length - 1];
            const isReplayingThis = replayingId === track.id;

            return (
              <div
                key={`${track.id}-${playedAt}-${index}`}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-[#002244]/90 border-cyan-400/80 shadow-[0_0_14px_rgba(0,240,255,0.25)]'
                    : 'bg-[#001026]/75 border-[#00386b]/80 hover:bg-[#001a3a] hover:border-sky-400/60'
                }`}
              >
                {/* Left side: Position Rank Badge + Album/Track Art + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  {/* Rank indicator */}
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono-tech text-[11px] font-black shrink-0 ${rankStyle.bg} ${rankStyle.text} ${rankStyle.glow} border ${rankStyle.border}`}
                  >
                    {index + 1}
                  </div>

                  {/* Album Cover / Disc Thumbnail */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-sky-500/40 bg-black/50 shadow-inner group-hover:border-cyan-300 transition-colors">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className={`w-full h-full object-cover ${
                          isCurrent && isPlaying ? 'animate-spin-slow' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#000a1a]">
                        <Disc
                          className={`w-5 h-5 text-cyan-400 ${
                            isCurrent && isPlaying ? 'animate-spin-slow text-amber-400' : ''
                          }`}
                        />
                      </div>
                    )}

                    {/* Playing indicator overlay */}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-3.5">
                          <span className="w-1 bg-emerald-400 rounded-sm animate-pulse h-2" />
                          <span className="w-1 bg-cyan-400 rounded-sm animate-pulse delay-75 h-3.5" />
                          <span className="w-1 bg-amber-400 rounded-sm animate-pulse delay-150 h-2.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track, Artist, Album info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`font-mono-tech text-xs font-bold truncate max-w-[190px] sm:max-w-[220px] ${
                          isCurrent ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]' : 'text-white'
                        }`}
                        title={track.title}
                      >
                        {track.title}
                      </h4>

                      {isCurrent && (
                        <span className="text-[8px] font-mono-tech px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Tocando
                        </span>
                      )}
                    </div>

                    {/* Artist & Album information */}
                    <div className="flex items-center gap-1.5 text-[10px] text-sky-300/90 font-mono-tech truncate">
                      <span className="font-semibold text-sky-200">{track.artist}</span>
                      {track.album && (
                        <>
                          <span className="text-sky-600">•</span>
                          <span className="text-amber-200/90 truncate max-w-[110px]" title={track.album}>
                            {track.album}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Meta tags: Genre, Duration & Time ago */}
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono-tech flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-[#00183b] text-cyan-300 border border-[#004080]">
                        {track.genre}
                      </span>
                      <span className="text-sky-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-sky-500" />
                        {formatDuration(track.duration)}
                      </span>
                      <span className="text-amber-400/90 font-semibold">
                        {formatTimeAgo(playedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Botão para repetir rapidamente */}
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleReplayClick(track)}
                    disabled={isReplayingThis}
                    className={`group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-tech text-xs font-bold uppercase transition-all duration-200 shadow-md ${
                      isCurrent && isPlaying
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-black border border-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.6)]'
                    } active:scale-95`}
                    title={`Repetir "${track.title}" agora`}
                  >
                    {isReplayingThis ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span className="text-[10px] text-white">Carregado!</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 group-hover/btn:-rotate-90 transition-transform duration-300" />
                        <span className="text-[10px] tracking-wide">Repetir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer bar with quick details */}
      <div className="pt-2 border-t border-[#003d73]/60 flex items-center justify-between text-[9px] font-mono-tech text-sky-400/80">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Fila inteligente sincronizada com áudio automotivo</span>
        </div>
        {recentFive.length > 0 && onClearHistory && (
          <button
            onClick={onClearHistory}
            className="text-sky-500 hover:text-rose-400 transition-colors uppercase"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
};
