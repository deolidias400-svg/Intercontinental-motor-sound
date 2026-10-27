import React, { useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Play, SkipForward, User, Compass } from 'lucide-react';
import { RecommendationReason, Track, UserPreferences } from '../types/smartAudio';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  recommendations: RecommendationReason[];
  currentTrackId: string;
  userPreferences: UserPreferences;
  onPlayTrack: (track: Track) => void;
  onLikeTrack: (trackId: string) => void;
  onDislikeTrack: (trackId: string) => void;
  onSkipTrack: (trackId: string) => void;
  onRefreshAiRecommendations: () => void;
  isLoadingAi?: boolean;
  aiProfileInsight?: string | null;
}

export const SmartRecommendationsSection: React.FC<Props> = ({
  recommendations,
  currentTrackId,
  userPreferences,
  onPlayTrack,
  onLikeTrack,
  onDislikeTrack,
  onSkipTrack,
  onRefreshAiRecommendations,
  isLoadingAi,
  aiProfileInsight,
}) => {
  const [showProfileStats, setShowProfileStats] = useState(false);

  const topGenres = Object.entries(userPreferences.favoriteGenres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const topMoods = Object.entries(userPreferences.favoriteMoods)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center lcd-header-badge z-20 relative">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 lcd-text-cyan animate-spin" />
          <div>
            <h3 className="text-xs font-black lcd-text-cyan font-mono-tech uppercase flex items-center gap-2">
              <span>[ LCD-09: AI RECOMMENDATION MATRIX & USER PROFILE ]</span>
            </h3>
            <p className="text-[9px] text-sky-400 font-mono-tech">
              Aprendizado neural contínuo baseado nas suas curtidas e histórico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfileStats(!showProfileStats)}
            className="btn-lcd-blue px-2.5 py-1 rounded text-[10px] font-mono-tech flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            <span>{showProfileStats ? 'OCULTAR PERFIL' : 'MEU PERFIL IA'}</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playCockpitBeep(1050);
              onRefreshAiRecommendations();
            }}
            disabled={isLoadingAi}
            className="btn-lcd-blue px-3 py-1 rounded text-[10px] font-mono-tech font-bold flex items-center gap-1 text-white"
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>{isLoadingAi ? 'CALIBRANDO...' : 'RECALCULAR IA'}</span>
          </button>
        </div>
      </div>

      {/* Profile Insight Banner */}
      {aiProfileInsight && (
        <div className="bg-[#001026]/90 border border-cyan-500/40 rounded-xl p-2.5 text-[10px] font-mono-tech text-cyan-200 flex items-center justify-between z-20 relative">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>
              <strong className="lcd-text-cyan">INSIGHT DO PILOTO:</strong> {aiProfileInsight}
            </span>
          </span>
          <span className="text-[8px] text-sky-400">BLUE LCD ENGINE</span>
        </div>
      )}

      {/* Expanded User Profile Stats */}
      {showProfileStats && (
        <div className="bg-[#001026]/95 p-3 rounded-xl border border-[#0055aa] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono-tech z-20 relative">
          <div>
            <span className="text-sky-400 block font-bold mb-1">GÊNEROS PREFERIDOS:</span>
            {topGenres.length > 0 ? (
              topGenres.map(([g, count]) => (
                <div key={g} className="lcd-text-cyan flex justify-between">
                  <span>{g}</span>
                  <span className="text-sky-300">{count}x</span>
                </div>
              ))
            ) : (
              <span className="text-sky-600">Sem dados suficientes</span>
            )}
          </div>

          <div>
            <span className="text-sky-400 block font-bold mb-1">HUMORES DOMINANTES:</span>
            {topMoods.length > 0 ? (
              topMoods.map(([m, count]) => (
                <div key={m} className="lcd-text-white flex justify-between">
                  <span>{m}</span>
                  <span className="text-sky-300">{count}x</span>
                </div>
              ))
            ) : (
              <span className="text-sky-600">Sem dados suficientes</span>
            )}
          </div>

          <div>
            <span className="text-sky-400 block font-bold mb-1">MÉTRICAS DO PILOTO:</span>
            <div className="flex justify-between text-sky-200">
              <span>Músicas Curtidas:</span>
              <strong className="lcd-text-cyan">{userPreferences.likedTrackIds.length}</strong>
            </div>
            <div className="flex justify-between text-sky-200">
              <span>Músicas Puladas:</span>
              <strong className="text-amber-400">{userPreferences.skippedTrackIds.length}</strong>
            </div>
            <div className="flex justify-between text-sky-200">
              <span>Histórico de Reprodução:</span>
              <strong className="lcd-text-white">{userPreferences.playedHistory.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 z-20 relative">
        {recommendations.map(({ track, score, reason }) => {
          const isPlayingThis = currentTrackId === track.id;
          const isLiked = userPreferences.likedTrackIds.includes(track.id);
          const isDisliked = userPreferences.dislikedTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isPlayingThis
                  ? 'bg-[#002b66] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-[#001026]/90 border-[#004b99] hover:border-cyan-400'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <div className="truncate">
                    <h4 className="text-xs font-black text-white font-mono-tech truncate lcd-text-white">
                      {track.title}
                    </h4>
                    <span className="text-[10px] text-cyan-300 font-mono-tech truncate block">
                      {track.artist}
                    </span>
                  </div>
                  <span className="text-[8px] bg-[#001f4d] text-cyan-300 px-1.5 py-0.5 rounded font-mono-tech border border-cyan-500/40 shrink-0">
                    {score}% Match
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1 text-[8px] font-mono-tech">
                  <span className="bg-[#001738] text-sky-200 px-1.5 py-0.5 rounded border border-[#003d73]">
                    {track.genre}
                  </span>
                  <span className="bg-[#001738] text-cyan-300 px-1.5 py-0.5 rounded border border-[#003d73]">
                    {track.mood}
                  </span>
                  <span className="bg-[#001738] text-white px-1.5 py-0.5 rounded border border-[#003d73]">
                    {track.bpm} BPM
                  </span>
                </div>

                <div className="text-[9px] text-sky-300 font-mono-tech mt-2 italic bg-[#000814] p-1.5 rounded border border-[#003d73] line-clamp-2">
                  💡 {reason}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-[#003d73]">
                <button
                  onClick={() => {
                    audioEngine.playCockpitBeep(900);
                    onPlayTrack(track);
                  }}
                  className={`px-2.5 py-1 rounded text-[9px] font-black font-mono-tech uppercase flex items-center gap-1 transition-all ${
                    isPlayingThis
                      ? 'bg-cyan-400 text-black shadow-[0_0_8px_#00f0ff]'
                      : 'btn-lcd-blue'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isPlayingThis ? 'TOCANDO' : 'TOCAR'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      audioEngine.playCockpitBeep(1200);
                      onLikeTrack(track.id);
                    }}
                    className={`p-1.5 rounded transition-all border ${
                      isLiked
                        ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                        : 'bg-[#001738] text-sky-400 border-[#003d73] hover:text-cyan-300'
                    }`}
                    title="Curtir (ensina a IA)"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playCockpitBeep(400);
                      onDislikeTrack(track.id);
                    }}
                    className={`p-1.5 rounded transition-all border ${
                      isDisliked
                        ? 'bg-red-500/30 text-red-300 border-red-500/60'
                        : 'bg-[#001738] text-sky-400 border-[#003d73] hover:text-red-400'
                    }`}
                    title="Descurtir"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.playCockpitBeep(600);
                      onSkipTrack(track.id);
                    }}
                    className="p-1.5 rounded bg-[#001738] text-sky-400 border border-[#003d73] hover:text-white transition-all"
                    title="Pular música"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
