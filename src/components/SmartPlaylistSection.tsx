import React, { useState } from 'react';
import { Sparkles, Plus, Play, X, ListMusic } from 'lucide-react';
import { AiPlaylist, UserPreferences } from '../types/smartAudio';
import { TRACK_CATALOG } from '../data/trackCatalog';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  playlists: AiPlaylist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (playlist: AiPlaylist) => void;
  onCreatePlaylist: (playlist: AiPlaylist) => void;
  userPreferences: UserPreferences;
}

const QUICK_MOODS = ['Animado', 'Eufórico', 'Relaxante', 'Focado', 'Noturno', 'Agressivo'];
const QUICK_ACTIVITIES = ['Treino', 'Estrada/Corrida', 'Festa', 'Estudo/Trabalho', 'Relaxar'];

export const SmartPlaylistSection: React.FC<Props> = ({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  userPreferences,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('Animado');
  const [selectedActivity, setSelectedActivity] = useState<string>('Estrada/Corrida');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<AiPlaylist | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGeneratedPreview(null);
    audioEngine.playCockpitBeep(1100);

    try {
      const res = await fetch('/api/ai/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          activity: selectedActivity,
          prompt: userPrompt.trim(),
          userPreferences,
        }),
      });

      if (!res.ok) throw new Error('Falha na geração com IA');
      const data = await res.json();

      const newPlaylist: AiPlaylist = {
        id: `pl-${Date.now()}`,
        title: data.title || 'Playlist Dinâmica Intercontinental',
        description: data.description || 'Seleção inteligente calibrada para sua condução.',
        criteria: {
          mood: selectedMood,
          activity: selectedActivity,
          prompt: userPrompt,
        },
        trackIds: data.selectedTrackIds || ['trk-1', 'trk-2', 'trk-3'],
        createdAt: new Date().toISOString(),
        color: '#00f0ff',
      };

      setGeneratedPreview(newPlaylist);
      audioEngine.playTurboBlowOff();
    } catch (err: any) {
      console.error(err);
      const fallback: AiPlaylist = {
        id: `pl-${Date.now()}`,
        title: `${selectedActivity} - ${selectedMood} Mix`,
        description: 'Compilação dinâmica de alta rotação.',
        criteria: { mood: selectedMood, activity: selectedActivity },
        trackIds: ['trk-1', 'trk-2', 'trk-4', 'trk-11'],
        createdAt: new Date().toISOString(),
        color: '#00f0ff',
      };
      setGeneratedPreview(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPlay = () => {
    if (!generatedPreview) return;
    onCreatePlaylist(generatedPreview);
    onSelectPlaylist(generatedPreview);
    setIsModalOpen(false);
    setGeneratedPreview(null);
    setUserPrompt('');
  };

  return (
    <div className="blue-lcd-screen p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center lcd-header-badge z-20 relative">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 lcd-text-cyan" />
          <div>
            <h3 className="text-xs font-black lcd-text-cyan font-mono-tech uppercase">
              [ LCD-10: SMART DYNAMIC PLAYLISTS WITH IA ]
            </h3>
            <p className="text-[9px] text-sky-400 font-mono-tech">
              Curadoria inteligente por humor, atividade ou prompt livre
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playCockpitBeep(900);
            setIsModalOpen(true);
          }}
          className="btn-lcd-blue px-3 py-1.5 rounded text-[10px] uppercase font-mono-tech flex items-center gap-1.5 font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>CRIAR PLAYLIST COM IA</span>
        </button>
      </div>

      {/* Playlist Cards Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 z-20 relative">
        {playlists.map((pl) => {
          const isSelected = activePlaylistId === pl.id;
          const trackCount = pl.trackIds.length;

          return (
            <div
              key={pl.id}
              onClick={() => {
                audioEngine.playCockpitBeep(800);
                onSelectPlaylist(pl);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#002b66] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-[#001026]/90 border-[#004b99] hover:border-cyan-400 hover:bg-[#00183b]'
              }`}
            >
              <div
                className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"
              />

              <div className="pl-1.5">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-black text-white font-mono-tech group-hover:text-cyan-300 transition-colors lcd-text-white">
                    {pl.title}
                  </h4>
                  <span className="text-[8px] bg-[#001738] px-1.5 py-0.5 rounded text-cyan-300 font-mono-tech border border-[#003d73]">
                    {trackCount} faixas
                  </span>
                </div>
                <p className="text-[10px] text-sky-300 font-mono-tech line-clamp-2 mt-1">
                  {pl.description}
                </p>
              </div>

              <div className="pl-1.5 mt-3 pt-2 border-t border-[#003d73] flex justify-between items-center text-[9px] font-mono-tech">
                <span className="text-cyan-300 font-bold">
                  {pl.criteria.activity || pl.criteria.mood || 'Mix Inteligente'}
                </span>
                <span className="flex items-center gap-1 text-white font-bold group-hover:underline">
                  <Play className="w-3 h-3 fill-current" /> OUVIR AGORA
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO INTELIGENTE COM IA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="blue-lcd-screen max-w-lg w-full p-5 shadow-[0_0_50px_rgba(0,100,255,0.4)] flex flex-col gap-4 relative">
            <div className="flex justify-between items-center lcd-header-badge z-20 relative">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 lcd-text-cyan animate-spin" />
                <h3 className="text-sm font-black lcd-text-cyan font-mono-tech uppercase">
                  [ GERADOR DE PLAYLIST INTELIGENTE ]
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sky-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-3 z-20 relative">
              <div>
                <label className="text-[10px] font-black uppercase text-sky-300 font-mono-tech block mb-1">
                  1. Humor Musical:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MOODS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSelectedMood(m)}
                      className={`px-2.5 py-1 rounded text-[9px] font-mono-tech font-bold transition-all border ${
                        selectedMood === m
                          ? 'bg-cyan-500 text-black border-cyan-300 font-black shadow-[0_0_8px_#00f0ff]'
                          : 'bg-[#001738] text-sky-300 border-[#003d73] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-300 font-mono-tech block mb-1">
                  2. Atividade / Ambiente:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIVITIES.map((act) => (
                    <button
                      type="button"
                      key={act}
                      onClick={() => setSelectedActivity(act)}
                      className={`px-2.5 py-1 rounded text-[9px] font-mono-tech font-bold transition-all border ${
                        selectedActivity === act
                          ? 'bg-cyan-500 text-black border-cyan-300 font-black shadow-[0_0_8px_#00f0ff]'
                          : 'bg-[#001738] text-sky-300 border-[#003d73] hover:text-white'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-300 font-mono-tech block mb-1">
                  3. Prompt Livre para a IA (Opcional):
                </label>
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Ex: Treino pesado de perna, Racha na serra à noite, Foco total em programação..."
                  className="w-full bg-[#000c1e] border border-[#0055aa] rounded-xl px-3 py-2 text-xs text-white placeholder-sky-500 font-mono-tech focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl btn-lcd-blue font-black text-xs uppercase font-mono-tech flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all mt-1 text-white"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'IA PROCESSANDO PLAYLIST...' : 'CRIAR PLAYLIST COM IA'}</span>
              </button>
            </form>

            {/* Generated Preview */}
            {generatedPreview && (
              <div className="bg-[#001026] border border-cyan-500/50 rounded-xl p-3 flex flex-col gap-2 z-20 relative">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black lcd-text-cyan font-mono-tech uppercase">
                    ✨ {generatedPreview.title}
                  </h4>
                  <span className="text-[9px] font-mono-tech text-sky-400">
                    {generatedPreview.trackIds.length} faixas selecionadas
                  </span>
                </div>
                <p className="text-[11px] text-sky-200 font-mono-tech italic">
                  "{generatedPreview.description}"
                </p>

                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1 custom-scroll">
                  {generatedPreview.trackIds.map((tid) => {
                    const trk = TRACK_CATALOG.find((t) => t.id === tid);
                    if (!trk) return null;
                    return (
                      <div
                        key={trk.id}
                        className="text-[10px] font-mono-tech bg-[#001738] p-1.5 rounded flex justify-between items-center text-sky-200 border border-[#003d73]"
                      >
                        <span className="truncate">
                          🎵 {trk.title} - <strong className="text-cyan-300">{trk.artist}</strong>
                        </span>
                        <span className="text-[8px] text-sky-400">{trk.bpm} BPM</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#003d73]">
                  <button
                    onClick={handleSaveAndPlay}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs font-mono-tech uppercase flex items-center gap-1.5 shadow-[0_0_12px_#00f0ff]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>SALVAR E TOCAR AGORA</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
